package com.sigmazero.service;

import com.sigmazero.config.TenantContext;
import com.sigmazero.domain.entity.Account;
import com.sigmazero.domain.entity.Tenant;
import com.sigmazero.dto.request.CreateAccountRequest;
import com.sigmazero.dto.response.AccountResponse;
import com.sigmazero.exception.AccountNotFoundException;
import com.sigmazero.exception.TenantNotFoundException;
import com.sigmazero.repository.AccountRepository;
import com.sigmazero.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;
    private final TenantRepository tenantRepository;

    @Transactional(readOnly = true)
    public List<AccountResponse> getAccountsForCurrentTenant() {
        UUID tenantId = getRequiredTenantId();
        return accountRepository.findAllByTenantId(tenantId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public AccountResponse createAccount(CreateAccountRequest request) {
        UUID tenantId = getRequiredTenantId();
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new TenantNotFoundException("Tenant not registered: " + tenantId));

        Account parent = null;
        if (request.parentId() != null) {
            parent = accountRepository.findByIdAndTenantId(request.parentId(), tenantId)
                    .orElseThrow(() -> new AccountNotFoundException("Parent account not found"));
        }

        Account account = Account.builder()
                .tenant(tenant)
                .code(request.code().trim())
                .name(request.name().trim())
                .type(request.type())
                .currency(request.currency() != null ? request.currency().toUpperCase() : "USD")
                .parent(parent)
                .isActive(true)
                .build();

        return mapToResponse(accountRepository.save(account));
    }

    public UUID getRequiredTenantId() {
        UUID tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            throw new TenantNotFoundException("Missing required X-Tenant-ID header");
        }
        return tenantId;
    }

    private AccountResponse mapToResponse(Account a) {
        return new AccountResponse(
                a.getId(),
                a.getCode(),
                a.getName(),
                a.getType(),
                a.getCurrency(),
                a.getIsActive(),
                a.getCreatedAt()
        );
    }
}