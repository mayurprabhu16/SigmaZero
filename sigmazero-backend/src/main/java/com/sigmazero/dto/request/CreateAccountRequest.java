package com.sigmazero.dto.request;

import com.sigmazero.domain.enums.AccountType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateAccountRequest(
    @NotBlank @Size(max = 32) String code,
    @NotBlank @Size(max = 128) String name,
    @NotNull AccountType type,
    @Size(min = 3, max = 3) String currency,
    UUID parentId
) {}