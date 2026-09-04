package com.sigmazero.dto.request;

import com.sigmazero.domain.enums.EntryDirection;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record EntryLineRequest(
    @NotNull UUID accountId,
    @NotNull EntryDirection direction,
    @NotNull @DecimalMin(value = "0.0001", message = "Amount must be strictly greater than zero") BigDecimal amount
) {}