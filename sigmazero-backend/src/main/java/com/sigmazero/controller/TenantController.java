package com.sigmazero.controller;

import com.sigmazero.config.TenantContext;
import com.sigmazero.domain.entity.Tenant;
import com.sigmazero.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tenants")
@RequiredArgsConstructor
public class TenantController {
    private final TenantRepository tenantRepository;

    @GetMapping("/current")
    public ResponseEntity<Tenant> currentTenant() {
        return TenantContext.getTenantId() == null
                ? ResponseEntity.notFound().build()
                : ResponseEntity.of(tenantRepository.findById(TenantContext.getTenantId()));
    }
}
