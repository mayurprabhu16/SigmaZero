package com.sigmazero.controller;

import com.sigmazero.domain.entity.Tenant;
import com.sigmazero.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tenants")
@RequiredArgsConstructor
public class TenantController {

    private final TenantRepository tenantRepository;

    @GetMapping
    public ResponseEntity<List<Tenant>> listTenants() {
        return ResponseEntity.ok(tenantRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<Tenant> createTenant(@RequestBody Map<String, String> payload) {
        String name = payload.get("name");
        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        Tenant tenant = Tenant.builder().name(name.trim()).build();
        return ResponseEntity.status(HttpStatus.CREATED).body(tenantRepository.save(tenant));
    }
}