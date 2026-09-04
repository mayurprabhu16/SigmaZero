package com.sigmazero.dto.response;

import com.sigmazero.domain.enums.AccountType;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record TrialBalanceResponse(
    BigDecimal totalDebits,
    BigDecimal totalCredits,
    boolean isBalanced,
    List<Row> rows
) {
    public record Row(
        UUID accountId,
        String accountCode,
        String accountName,
        AccountType accountType,
        BigDecimal totalDebit,
        BigDecimal totalCredit,
        BigDecimal netBalance
    ) {}
}