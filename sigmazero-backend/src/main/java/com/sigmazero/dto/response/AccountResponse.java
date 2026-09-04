package com.sigmazero.dto.response;

import com.sigmazero.domain.enums.AccountType;

import java.time.Instant;
import java.util.UUID;

public record AccountResponse(
    UUID id,
    String code,
    String name,
    AccountType type,
    String currency,
    Boolean isActive,
    Instant createdAt
) {}