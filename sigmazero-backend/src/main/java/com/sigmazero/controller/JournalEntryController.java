package com.sigmazero.controller;

import com.sigmazero.dto.request.PostJournalEntryRequest;
import com.sigmazero.dto.response.JournalEntryResponse;
import com.sigmazero.service.posting.LedgerPostingService;
import com.sigmazero.service.reporting.JournalHistoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/journal-entries")
@RequiredArgsConstructor
public class JournalEntryController {
    private final LedgerPostingService postingService;
    private final JournalHistoryService historyService;

    @GetMapping
    public ResponseEntity<List<JournalEntryResponse>> getJournalHistory() {
        return ResponseEntity.ok(historyService.getJournalHistory());
    }

    @PostMapping
    public ResponseEntity<JournalEntryResponse> postEntry(@Valid @RequestBody PostJournalEntryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(postingService.postJournalEntry(request));
    }
}
