package com.sigmazero.repository;

import com.sigmazero.domain.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AccountRepository extends JpaRepository<Account, UUID> {
    List<Account> findAllByTenantId(UUID tenantId);
    Optional<Account> findByTenantIdAndCode(UUID tenantId, String code);
    Optional<Account> findByIdAndTenantId(UUID id, UUID tenantId);
}