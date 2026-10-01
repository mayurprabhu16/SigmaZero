package com.sigmazero.service.reporting;

import com.sigmazero.config.TenantContext;
import com.sigmazero.dto.response.JournalEntryResponse;
import com.sigmazero.exception.TenantNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.SQLException;
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
                ORDER BY je.posted_at DESC, el.created_at ASC
                """;

        Map<UUID, JournalEntryResponseBuilder> entries =
                new LinkedHashMap<>();

        jdbcTemplate.query(
                sql,
                rs -> {
                    try {
                        UUID journalId =
                                rs.getObject("journal_id", UUID.class);

                        JournalEntryResponseBuilder builder =
                                entries.computeIfAbsent(
                                        journalId,
                                        id -> {
                                            try {
                                                return new JournalEntryResponseBuilder(
                                                        id,
                                                        rs.getString("reference_id"),
                                                        rs.getString("description"),
                                                        rs.getTimestamp("posted_at")
                                                                .toInstant()
                                                );
                                            } catch (SQLException e) {
                                                throw new RuntimeException(
                                                        "Failed to read journal entry",
                                                        e
                                                );
                                            }
                                        }
                                );

                        builder.lines.add(
                                new JournalEntryResponse.LineItem(
                                        rs.getObject("line_id", UUID.class),
                                        rs.getObject("account_id", UUID.class),
                                        rs.getString("account_code"),
                                        rs.getString("account_name"),
                                        com.sigmazero.domain.enums.EntryDirection
                                                .valueOf(rs.getString("direction")),
                                        rs.getBigDecimal("amount")
                                )
                        );

                    } catch (SQLException e) {
                        throw new RuntimeException(
                                "Failed to read journal history",
                                e
                        );
                    }
                },
                tenantId
        );

        return entries.values()
                .stream()
                .map(JournalEntryResponseBuilder::build)
                .toList();
    }

    private static class JournalEntryResponseBuilder {

        final UUID id;
        final String referenceId;
        final String description;
        final Instant postedAt;

        final List<JournalEntryResponse.LineItem> lines =
                new ArrayList<>();

        JournalEntryResponseBuilder(
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

        JournalEntryResponse build() {
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