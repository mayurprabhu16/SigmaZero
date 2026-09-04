package com.sigmazero.service.reporting;

import com.sigmazero.config.TenantContext;
import com.sigmazero.domain.enums.AccountType;
import com.sigmazero.dto.response.TrialBalanceResponse;
import com.sigmazero.exception.TenantNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LedgerReportingService {

    private final JdbcTemplate jdbcTemplate;

    @Transactional(readOnly = true)
    public TrialBalanceResponse generateTrialBalance() {
        UUID tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            throw new TenantNotFoundException("Missing required X-Tenant-ID header");
        }

        String sql = """
            SELECT 
                a.id AS account_id,
                a.code AS account_code,
                a.name AS account_name,
                a.type AS account_type,
                COALESCE(SUM(CASE WHEN el.direction = 'DEBIT' THEN el.amount ELSE 0 END), 0) AS total_debit,
                COALESCE(SUM(CASE WHEN el.direction = 'CREDIT' THEN el.amount ELSE 0 END), 0) AS total_credit
            FROM accounts a
            LEFT JOIN entry_lines el ON a.id = el.account_id AND el.tenant_id = a.tenant_id
            WHERE a.tenant_id = ?
            GROUP BY a.id, a.code, a.name, a.type
            ORDER BY a.code ASC
        """;

        List<TrialBalanceResponse.Row> rows = jdbcTemplate.query(sql, (rs, rowNum) -> {
            BigDecimal debits = rs.getBigDecimal("total_debit");
            BigDecimal credits = rs.getBigDecimal("total_credit");
            BigDecimal net = debits.subtract(credits);

            return new TrialBalanceResponse.Row(
                UUID.fromString(rs.getString("account_id")),
                rs.getString("account_code"),
                rs.getString("account_name"),
                AccountType.valueOf(rs.getString("account_type")),
                debits,
                credits,
                net
            );
        }, tenantId);

        BigDecimal sumDebits = rows.stream()
                .map(TrialBalanceResponse.Row::totalDebit)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal sumCredits = rows.stream()
                .map(TrialBalanceResponse.Row::totalCredit)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        boolean isBalanced = sumDebits.compareTo(sumCredits) == 0;

        return new TrialBalanceResponse(sumDebits, sumCredits, isBalanced, rows);
    }
}