package com.sigmazero.dto.response;

import java.util.UUID;

public record AuthResponse(
        String token,
        UserInfo user,
        TenantInfo tenant
) {
    public record UserInfo(UUID id, String email, String role) {}
    public record TenantInfo(UUID id, String name) {}
}
