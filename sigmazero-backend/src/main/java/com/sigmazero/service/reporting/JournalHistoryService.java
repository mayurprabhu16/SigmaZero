package com.sigmazero.service.reporting;

import com.sigmazero.config.TenantContext;
import com.sigmazero.domain.enums.EntryDirection;
import com.sigmazero.dto.response.JournalEntryResponse;
import com.sigmazero.exception.TenantNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class JournalHistoryService {

    private final JdbcTemplate jdbcTemplate;

    @Transactional(readOnly = true)
    public List<JournalEntryResponse> getJournalHistory() {

        // Get tenant from the authenticated user's security context.
        // Do NOT accept tenantId from the frontend.
        UUID tenantId = TenantContext.getTenantId();

        if (tenantId == null) {
            throw new TenantNotFoundException(
                    "Authenticated workspace could not be resolved"
            );
        }

        String sql = """
                SELECT
                    je.id AS journal_id,
                    je.reference_id,
                    je.description,
                    je.posted_at,

                    el.id AS line_id,
                    el.account_id,

                    a.code AS account_code,
                    a.name AS account_name,

                    el.direction,
                    el.amount

                FROM journal_entries je

                JOIN entry_lines el
                    ON el.journal_entry_id = je.id
                   AND el.tenant_id = je.tenant_id

                JOIN accounts a
                    ON a.id = el.account_id
                   AND a.tenant_id = je.tenant_id

                WHERE je.tenant_id = ?

                ORDER BY je.posted_at DESC,
                         el.created_at ASC
                """;

        Map<UUID, JournalEntryData> entries =
                new LinkedHashMap<>();

        jdbcTemplate.query(
                sql,
                rs -> {

                    UUID journalId =
                            rs.getObject("journal_id", UUID.class);

                    JournalEntryData entry =
                            entries.computeIfAbsent(
                                    journalId,
                                    id -> {

                                        try {
                                            return new JournalEntryData(
                                                    id,
                                                    rs.getString("reference_id"),
                                                    rs.getString("description"),
                                                    getInstant(
                                                            rs,
                                                            "posted_at"
                                                    )
                                            );

                                        } catch (Exception e) {
                                            throw new RuntimeException(
                                                    "Failed to read journal entry",
                                                    e
                                            );
                                        }
                                    }
                            );

                    UUID lineId =
                            rs.getObject("line_id", UUID.class);

                    UUID accountId =
                            rs.getObject("account_id", UUID.class);

                    String accountCode =
                            rs.getString("account_code");

                    String accountName =
                            rs.getString("account_name");

                    String directionValue =
                            rs.getString("direction");

                    EntryDirection direction =
                            EntryDirection.valueOf(
                                    directionValue.toUpperCase()
                            );

                    BigDecimal amount =
                            rs.getBigDecimal("amount");

                    entry.lines.add(
                            new JournalEntryResponse.LineItem(
                                    lineId,
                                    accountId,
                                    accountCode,
                                    accountName,
                                    direction,
                                    amount
                            )
                    );
                },
                tenantId
        );

        return entries.values()
                .stream()
                .map(JournalEntryData::toResponse)
                .toList();
    }

    private Instant getInstant(
            java.sql.ResultSet rs,
            String column
    ) throws java.sql.SQLException {

        java.sql.Timestamp timestamp =
                rs.getTimestamp(column);

        return timestamp != null
                ? timestamp.toInstant()
                : null;
    }

    private static class JournalEntryData {

        private final UUID id;
        private final String referenceId;
        private final String description;
        private final Instant postedAt;

        private final List<JournalEntryResponse.LineItem> lines =
                new ArrayList<>();

        private JournalEntryData(
                UUID id,
                String referenceId,
                String description,
                Instant postedAt
        ) {
            this.id = id;
            this.referenceId = referenceId;
            this.description = description;
            this.postedAt = postedAt;
        }

        private JournalEntryResponse toResponse() {

            return new JournalEntryResponse(
                    id,
                    referenceId,
                    description,
                    postedAt,
                    lines
            );
        }
    }
}