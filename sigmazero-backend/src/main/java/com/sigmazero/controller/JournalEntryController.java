package com.sigmazero.controller;

import com.sigmazero.dto.request.PostJournalEntryRequest;
import com.sigmazero.dto.response.JournalEntryResponse;
import com.sigmazero.service.posting.LedgerPostingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/journal-entries")
@RequiredArgsConstructor
public class JournalEntryController {

    private final LedgerPostingService postingService;

    @PostMapping
    public ResponseEntity<JournalEntryResponse> postEntry(@Valid @RequestBody PostJournalEntryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(postingService.postJournalEntry(request));
    }
}