package com.sigmazero.controller;

import com.sigmazero.dto.response.TrialBalanceResponse;
import com.sigmazero.service.reporting.LedgerReportingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final LedgerReportingService reportingService;

    @GetMapping("/trial-balance")
    public ResponseEntity<TrialBalanceResponse> getTrialBalance() {
        return ResponseEntity.ok(reportingService.generateTrialBalance());
    }
}