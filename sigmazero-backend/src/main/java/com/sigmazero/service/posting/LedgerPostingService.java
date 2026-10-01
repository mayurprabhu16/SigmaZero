package com.sigmazero.service.posting;

import com.sigmazero.config.TenantContext;
import com.sigmazero.domain.enums.EntryDirection;
import com.sigmazero.dto.request.EntryLineRequest;
import com.sigmazero.dto.request.PostJournalEntryRequest;
import com.sigmazero.dto.response.JournalEntryResponse;
import com.sigmazero.exception.AccountNotFoundException;
import com.sigmazero.exception.TenantNotFoundException;
import com.sigmazero.exception.UnbalancedTransactionException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LedgerPostingService {
    private final JdbcTemplate jdbcTemplate;

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public JournalEntryResponse postJournalEntry(PostJournalEntryRequest request) {
        UUID tenantId = requiredTenantId();

        BigDecimal totalDebits = BigDecimal.ZERO;
        BigDecimal totalCredits = BigDecimal.ZERO;
        for (EntryLineRequest line : request.lines()) {
            if (line.direction() == EntryDirection.DEBIT) totalDebits = totalDebits.add(line.amount());
            else totalCredits = totalCredits.add(line.amount());
        }
        if (totalDebits.compareTo(totalCredits) != 0) {
            throw new UnbalancedTransactionException(
                    String.format("Unbalanced transaction: Debits (%s) != Credits (%s)", totalDebits, totalCredits));
        }

        // Never allow a tenant to post against another tenant's account.
        String placeholders = String.join(",", request.lines().stream().map(l -> "?").toList());
        List<Object> accountArgs = new ArrayList<>();
        accountArgs.add(tenantId);
        request.lines().forEach(l -> accountArgs.add(l.accountId()));
        Integer matchingAccounts = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM accounts WHERE tenant_id = ? AND id IN (" + placeholders + ")",
                Integer.class, accountArgs.toArray());
        if (matchingAccounts == null || matchingAccounts != new HashSet<>(request.lines().stream().map(EntryLineRequest::accountId).toList()).size()) {
            throw new AccountNotFoundException("One or more accounts do not belong to the current workspace");
        }

        UUID journalEntryId = UUID.randomUUID();
        Instant now = Instant.now();
        try {
            jdbcTemplate.update("""
                    INSERT INTO journal_entries (id, tenant_id, reference_id, description, posted_at)
                    VALUES (?, ?, ?, ?, ?)
                    """, journalEntryId, tenantId, request.referenceId().trim(), request.description(), Timestamp.from(now));
        } catch (DuplicateKeyException e) {
            throw new DuplicateKeyException("Transaction already posted for reference: " + request.referenceId());
        }

        String insertLineSql = """
                INSERT INTO entry_lines (id, tenant_id, journal_entry_id, account_id, direction, amount, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """;
        List<Object[]> batchArgs = new ArrayList<>();
        List<JournalEntryResponse.LineItem> responseLines = new ArrayList<>();

        for (EntryLineRequest line : request.lines()) {
            UUID lineId = UUID.randomUUID();
            batchArgs.add(new Object[]{lineId, tenantId, journalEntryId, line.accountId(),
                    line.direction().name(), line.amount(), Timestamp.from(now)});

            String[] account = jdbcTemplate.queryForObject(
                    "SELECT code, name FROM accounts WHERE id = ? AND tenant_id = ?",
                    (rs, rowNum) -> new String[]{rs.getString("code"), rs.getString("name")},
                    line.accountId(), tenantId);
            responseLines.add(new JournalEntryResponse.LineItem(lineId, line.accountId(),
                    account[0], account[1], line.direction(), line.amount()));
        }
        jdbcTemplate.batchUpdate(insertLineSql, batchArgs);

        return new JournalEntryResponse(journalEntryId, request.referenceId().trim(), request.description(), now, responseLines);
    }

    private UUID requiredTenantId() {
        UUID tenantId = TenantContext.getTenantId();
        if (tenantId == null) throw new TenantNotFoundException("Authenticated workspace could not be resolved");
        return tenantId;
    }
}
