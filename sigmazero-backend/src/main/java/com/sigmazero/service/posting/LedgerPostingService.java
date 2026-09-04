package com.sigmazero.service.posting;

import com.sigmazero.config.TenantContext;
import com.sigmazero.domain.enums.EntryDirection;
import com.sigmazero.dto.request.EntryLineRequest;
import com.sigmazero.dto.request.PostJournalEntryRequest;
import com.sigmazero.dto.response.JournalEntryResponse;
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
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LedgerPostingService {

    private final JdbcTemplate jdbcTemplate;

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public JournalEntryResponse postJournalEntry(PostJournalEntryRequest request) {
        UUID tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            throw new TenantNotFoundException("Missing required X-Tenant-ID header");
        }

        // 1. Math Verification: Sum(Debits) == Sum(Credits)
        BigDecimal totalDebits = BigDecimal.ZERO;
        BigDecimal totalCredits = BigDecimal.ZERO;

        for (EntryLineRequest line : request.lines()) {
            if (line.direction() == EntryDirection.DEBIT) {
                totalDebits = totalDebits.add(line.amount());
            } else {
                totalCredits = totalCredits.add(line.amount());
            }
        }

        if (totalDebits.compareTo(totalCredits) != 0) {
            throw new UnbalancedTransactionException(
                String.format("Unbalanced transaction: Debits (%s) != Credits (%s)", totalDebits, totalCredits)
            );
        }

        // 2. Insert Header
        UUID journalEntryId = UUID.randomUUID();
        Instant now = Instant.now();

        String insertJournalSql = """
            INSERT INTO journal_entries (id, tenant_id, reference_id, description, posted_at)
            VALUES (?, ?, ?, ?, ?)
        """;

        try {
            jdbcTemplate.update(
                insertJournalSql,
                journalEntryId,
                tenantId,
                request.referenceId(),
                request.description(),
                Timestamp.from(now)
            );
        } catch (DuplicateKeyException e) {
            throw new DuplicateKeyException("Transaction already posted for reference: " + request.referenceId());
        }

        // 3. Batch Append Immutable Entry Lines
        String insertLineSql = """
            INSERT INTO entry_lines (id, tenant_id, journal_entry_id, account_id, direction, amount, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """;

        List<Object[]> batchArgs = new ArrayList<>();
        List<JournalEntryResponse.LineItem> responseLines = new ArrayList<>();

        for (EntryLineRequest line : request.lines()) {
            UUID lineId = UUID.randomUUID();
            batchArgs.add(new Object[]{
                lineId,
                tenantId,
                journalEntryId,
                line.accountId(),
                line.direction().name(),
                line.amount(),
                Timestamp.from(now)
            });

            responseLines.add(new JournalEntryResponse.LineItem(
                lineId,
                line.accountId(),
                "",
                "",
                line.direction(),
                line.amount()
            ));
        }

        jdbcTemplate.batchUpdate(insertLineSql, batchArgs);

        return new JournalEntryResponse(
            journalEntryId,
            request.referenceId(),
            request.description(),
            now,
            responseLines
        );
    }
}