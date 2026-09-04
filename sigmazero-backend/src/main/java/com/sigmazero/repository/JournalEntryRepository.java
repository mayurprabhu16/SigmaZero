package com.sigmazero.repository;

import com.sigmazero.domain.entity.JournalEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface JournalEntryRepository extends JpaRepository<JournalEntry, UUID> {
    List<JournalEntry> findAllByTenantIdOrderByPostedAtDesc(UUID tenantId);
    Optional<JournalEntry> findByTenantIdAndReferenceId(UUID tenantId, String referenceId);
}