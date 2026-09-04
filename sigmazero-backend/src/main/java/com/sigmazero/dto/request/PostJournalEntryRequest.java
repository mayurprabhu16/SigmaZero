package com.sigmazero.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record PostJournalEntryRequest(
    @NotBlank @Size(max = 64) String referenceId,
    @Size(max = 255) String description,
    @NotEmpty @Size(min = 2, message = "Transaction requires at least two lines for double-entry")
    List<@Valid EntryLineRequest> lines
) {}