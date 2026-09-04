package com.sigmazero.dto.response;

import com.sigmazero.domain.enums.EntryDirection;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record JournalEntryResponse(
    UUID id,
    String referenceId,
    String description,
    Instant postedAt,
    List<LineItem> lines
) {
    public record LineItem(
        UUID lineId,
        UUID accountId,
        String accountCode,
        String accountName,
        EntryDirection direction,
        BigDecimal amount
    ) {}
}