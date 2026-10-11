package mor.itas.api.controller.backoffice.ca;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import mor.itas.api.dto.request.ca.*;
import mor.itas.application.service.ca.ComprehensiveAuditService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Comprehensive Audit REST API — FR-04.4-01 → 34
 *
 * Base: /api/v1/backoffice/ca/cases/{caseId}
 */
@Tag(
    name = "Comprehensive Audit",
    description = "Full lifecycle management for Comprehensive Tax Audits. "
        + "Covers FR-04.4-01 to FR-04.4-34 (SoR Module D): "
        + "CAAT eligibility & execution, entry/exit conferences, balance sheet testing, "
        + "benchmark analysis, third-party matching, reconciliations, sampling, "
        + "audit findings, working papers, draft report approval chain, "
        + "assessment notice generation, taxpayer responses, and case closure."
)
@RestController
@RequestMapping("/api/v1/backoffice/ca/cases")
@RequiredArgsConstructor
public class ComprehensiveAuditController {

    private final ComprehensiveAuditService service;
    private final mor.itas.persistence.jpa.repository.ap.ApAuditCaseRepository caseRepository;

    private static final String READ_ROLES =
        "hasAnyRole('AUDITOR','TEAM_LEADER','DIRECTOR','FRAUD_INVESTIGATOR')";
    private static final String AUDITOR_ROLE   = "hasRole('AUDITOR')";
    private static final String TL_DIR_ROLES   = "hasAnyRole('TEAM_LEADER','DIRECTOR')";

    private UUID resolveCaseId(String caseIdStr) {
        if (caseIdStr == null || caseIdStr.isBlank()) {
            return UUID.fromString("c0000000-0000-0000-0000-000000000101");
        }
        try {
            return UUID.fromString(caseIdStr);
        } catch (IllegalArgumentException e) {
            return caseRepository.findByCaseNumber(caseIdStr)
                    .map(mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity::getId)
                    .orElseGet(() -> {
                        var cases = caseRepository.findAll().stream()
                                .filter(c -> "COMPREHENSIVE_AUDIT".equalsIgnoreCase(c.getAuditType()) || "COMPREHENSIVE".equalsIgnoreCase(c.getAuditType()))
                                .findFirst();
                        return cases.map(mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity::getId)
                                .orElse(UUID.fromString("c0000000-0000-0000-0000-000000000101"));
                    });
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CASE LISTING & WORKSPACE FULL DATA
    // ═══════════════════════════════════════════════════════════════════════════

    @Operation(summary = "Get list of comprehensive audit cases",
               description = "Returns assigned comprehensive audit cases filtered by taxCenter, auditor, teamLeader, or status.")
    @GetMapping("")
    public ResponseEntity<?> getAssignedCases(
            @RequestParam(required = false) String taxCenter,
            @RequestParam(required = false) String auditorId,
            @RequestParam(required = false) String teamLeaderId,
            @RequestParam(required = false) String status,
            @RequestHeader(value = "X-Actor-Id", required = false) String actorId) {
        return ResponseEntity.ok(service.listComprehensiveCases(taxCenter, auditorId, teamLeaderId, status, actorId));
    }

    @Operation(summary = "Get comprehensive audit case data",
               description = "Returns full CaseFullData snapshot or summary overview.")
    @GetMapping("/{caseId}")
    public ResponseEntity<?> getCaseData(
            @Parameter(description = "Audit case UUID or caseNumber") @PathVariable String caseId,
            @RequestParam(required = false, defaultValue = "false") boolean overviewOnly,
            @RequestHeader(value = "X-Actor-Id", required = false) String actorId) {
        UUID resolvedId = resolveCaseId(caseId);
        if (overviewOnly) {
            return ResponseEntity.ok(service.getCaseOverview(resolvedId));
        }
        return ResponseEntity.ok(service.getCaseSnapshot(resolvedId, actorId));
    }

    @Operation(summary = "Autosave comprehensive audit case snapshot",
               description = "Persists the complete state of working papers, procedures, findings, and analysis.")
    @PostMapping("/{caseId}/autosave")
    public ResponseEntity<?> autosaveCase(
            @PathVariable String caseId,
            @RequestBody java.util.Map<String, Object> snapshot,
            @RequestHeader(value = "X-Actor-Id", required = false) String actorId) {
        UUID resolvedId = resolveCaseId(caseId);
        return ResponseEntity.ok(service.autosaveCase(resolvedId, snapshot, actorId));
    }

    @Operation(summary = "Execute comprehensive audit workflow transition",
               description = "Transitions case between auditor submission, supervisory review, director approval, and fraud referral.")
    @PostMapping("/{caseId}/workflow")
    public ResponseEntity<?> executeWorkflow(
            @PathVariable String caseId,
            @RequestBody java.util.Map<String, Object> payload,
            @RequestHeader(value = "X-Actor-Id", required = false) String actorId) {
        UUID resolvedId = resolveCaseId(caseId);
        return ResponseEntity.ok(service.executeWorkflow(resolvedId, payload, actorId));
    }

    @PutMapping("/{caseId}")
    public ResponseEntity<?> updateCase(
            @PathVariable String caseId,
            @RequestBody java.util.Map<String, Object> updates,
            @RequestHeader(value = "X-Actor-Id", required = false) String actorId) {
        UUID resolvedId = resolveCaseId(caseId);
        return ResponseEntity.ok(service.updateCaseMetadata(resolvedId, updates, actorId));
    }

    @PutMapping("/{caseId}/procedures/{procId}")
    public ResponseEntity<?> updateProcedure(
            @PathVariable String caseId,
            @PathVariable String procId,
            @RequestBody java.util.Map<String, Object> updates,
            @RequestHeader(value = "X-Actor-Id", required = false) String actorId) {
        UUID resolvedId = resolveCaseId(caseId);
        return ResponseEntity.ok(service.updateProcedure(resolvedId, procId, updates, actorId));
    }

    @PostMapping("/{caseId}/evidence")
    public ResponseEntity<?> addEvidence(
            @PathVariable String caseId,
            @RequestBody java.util.Map<String, Object> item,
            @RequestHeader(value = "X-Actor-Id", required = false) String actorId) {
        UUID resolvedId = resolveCaseId(caseId);
        return ResponseEntity.ok(service.addEvidence(resolvedId, item, actorId));
    }

    @DeleteMapping("/{caseId}/evidence/{evidenceId}")
    public ResponseEntity<?> deleteEvidence(
            @PathVariable String caseId,
            @PathVariable String evidenceId,
            @RequestHeader(value = "X-Actor-Id", required = false) String actorId) {
        UUID resolvedId = resolveCaseId(caseId);
        service.deleteEvidence(resolvedId, evidenceId, actorId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{caseId}/findings/{findingId}")
    public ResponseEntity<?> updateFinding(
            @PathVariable String caseId,
            @PathVariable String findingId,
            @RequestBody java.util.Map<String, Object> updates,
            @RequestHeader(value = "X-Actor-Id", required = false) String actorId) {
        UUID resolvedId = resolveCaseId(caseId);
        return ResponseEntity.ok(service.updateFinding(resolvedId, findingId, updates, actorId));
    }

    @DeleteMapping("/{caseId}/findings/{findingId}")
    public ResponseEntity<?> deleteFinding(
            @PathVariable String caseId,
            @PathVariable String findingId,
            @RequestHeader(value = "X-Actor-Id", required = false) String actorId) {
        UUID resolvedId = resolveCaseId(caseId);
        service.deleteFinding(resolvedId, findingId, actorId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{caseId}/working-papers/{wpId}")
    public ResponseEntity<?> updateWorkingPaper(
            @PathVariable String caseId,
            @PathVariable String wpId,
            @RequestBody java.util.Map<String, Object> updates,
            @RequestHeader(value = "X-Actor-Id", required = false) String actorId) {
        UUID resolvedId = resolveCaseId(caseId);
        return ResponseEntity.ok(service.updateWorkingPaper(resolvedId, wpId, updates, actorId));
    }

    @DeleteMapping("/{caseId}/working-papers/{wpId}")
    public ResponseEntity<?> deleteWorkingPaper(
            @PathVariable String caseId,
            @PathVariable String wpId,
            @RequestHeader(value = "X-Actor-Id", required = false) String actorId) {
        UUID resolvedId = resolveCaseId(caseId);
        service.deleteWorkingPaper(resolvedId, wpId, actorId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{caseId}/queries/{queryId}")
    public ResponseEntity<?> updateQuery(
            @PathVariable String caseId,
            @PathVariable String queryId,
            @RequestBody java.util.Map<String, Object> updates,
            @RequestHeader(value = "X-Actor-Id", required = false) String actorId) {
        UUID resolvedId = resolveCaseId(caseId);
        return ResponseEntity.ok(service.updateQuery(resolvedId, queryId, updates, actorId));
    }

    @PutMapping("/{caseId}/analysis")
    public ResponseEntity<?> updateAnalysis(
            @PathVariable String caseId,
            @RequestBody java.util.Map<String, Object> analysis,
            @RequestHeader(value = "X-Actor-Id", required = false) String actorId) {
        UUID resolvedId = resolveCaseId(caseId);
        return ResponseEntity.ok(service.updateAnalysis(resolvedId, analysis, actorId));
    }

    @PutMapping("/{caseId}/report")
    public ResponseEntity<?> updateDraftReport(
            @PathVariable String caseId,
            @RequestBody java.util.Map<String, Object> report,
            @RequestHeader(value = "X-Actor-Id", required = false) String actorId) {
        UUID resolvedId = resolveCaseId(caseId);
        return ResponseEntity.ok(service.updateDraftReportContent(resolvedId, report, actorId));
    }

    @GetMapping("/{caseId}/audit-trail")
    public ResponseEntity<?> getAuditTrail(
            @PathVariable String caseId) {
        UUID resolvedId = resolveCaseId(caseId);
        return ResponseEntity.ok(service.getAuditTrailEntries(resolvedId));
    }

    @PostMapping("/{caseId}/audit-trail")
    public ResponseEntity<?> addAuditTrail(
            @PathVariable String caseId,
            @RequestBody java.util.Map<String, Object> entry,
            @RequestHeader(value = "X-Actor-Id", required = false) String actorId) {
        UUID resolvedId = resolveCaseId(caseId);
        service.addAuditTrailEntry(resolvedId, entry, actorId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{caseId}/entry-conference")
    public ResponseEntity<?> updateEntryConference(
            @PathVariable String caseId,
            @RequestBody java.util.Map<String, Object> updates,
            @RequestHeader(value = "X-Actor-Id", required = false) String actorId) {
        UUID resolvedId = resolveCaseId(caseId);
        return ResponseEntity.ok(service.updateEntryConference(resolvedId, updates, actorId));
    }

    @GetMapping("/{caseId}/caat")
    public ResponseEntity<?> getCaat(
            @PathVariable String caseId,
            @RequestHeader(value = "X-Actor-Id", required = false) String actorId) {
        UUID resolvedId = resolveCaseId(caseId);
        java.util.Map<String, Object> snap = service.getCaseSnapshot(resolvedId, actorId);
        return ResponseEntity.ok(snap.get("caatAudit"));
    }

    @PutMapping("/{caseId}/caat")
    public ResponseEntity<?> updateCaat(
            @PathVariable String caseId,
            @RequestBody java.util.Map<String, Object> updates,
            @RequestHeader(value = "X-Actor-Id", required = false) String actorId) {
        UUID resolvedId = resolveCaseId(caseId);
        return ResponseEntity.ok(service.updateCaatAudit(resolvedId, updates, actorId));
    }

    @PutMapping("/{caseId}/reconciliations")
    public ResponseEntity<?> updateReconciliations(
            @PathVariable String caseId,
            @RequestBody java.util.Map<String, Object> updates,
            @RequestHeader(value = "X-Actor-Id", required = false) String actorId) {
        UUID resolvedId = resolveCaseId(caseId);
        return ResponseEntity.ok(service.updateReconciliations(resolvedId, updates, actorId));
    }

    @PutMapping("/{caseId}/exit-conference")
    public ResponseEntity<?> updateExitConference(
            @PathVariable String caseId,
            @RequestBody java.util.Map<String, Object> updates,
            @RequestHeader(value = "X-Actor-Id", required = false) String actorId) {
        UUID resolvedId = resolveCaseId(caseId);
        return ResponseEntity.ok(service.updateExitConference(resolvedId, updates, actorId));
    }

    @PutMapping("/{caseId}/assessment-notice")
    public ResponseEntity<?> updateAssessmentNotice(
            @PathVariable String caseId,
            @RequestBody java.util.Map<String, Object> updates,
            @RequestHeader(value = "X-Actor-Id", required = false) String actorId) {
        UUID resolvedId = resolveCaseId(caseId);
        return ResponseEntity.ok(service.updateAssessmentNotice(resolvedId, updates, actorId));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CAAT ELIGIBILITY — FR-04.4-01
    // ═══════════════════════════════════════════════════════════════════════════

    @Operation(summary = "Assess CAAT eligibility (FR-04.4-01)",
               description = "Applies configured business rules (LTO segment, ERP system, electronic records, turnover) to determine if taxpayer qualifies for Computer Assisted Audit Techniques.")
    @ApiResponses({ @ApiResponse(responseCode = "201", description = "Eligibility assessed"),
                    @ApiResponse(responseCode = "400", description = "Validation error"),
                    @ApiResponse(responseCode = "404", description = "Case not found") })
    @PostMapping("/{caseId}/caat-eligibility")
    @PreAuthorize(AUDITOR_ROLE)
    public ResponseEntity<?> assessCaatEligibility(
            @PathVariable UUID caseId,
            @Valid @RequestBody AssessCaatEligibilityRequest request,
            @RequestHeader("X-Actor-Id") String actorId) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(service.assessCaatEligibility(caseId, request, actorId));
    }

    @GetMapping("/{caseId}/caat-eligibility")
    @PreAuthorize(READ_ROLES)
    public ResponseEntity<?> getCaatEligibility(
            @PathVariable UUID caseId,
            @RequestHeader("X-Actor-Id") String actorId) {
        return ResponseEntity.ok(service.getCaseOverview(caseId));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CAAT RUNS — FR-04.4-02, 14
    // ═══════════════════════════════════════════════════════════════════════════

    @PostMapping("/{caseId}/caat-runs")
    @PreAuthorize(AUDITOR_ROLE)
    public ResponseEntity<?> startCaatRun(
            @PathVariable UUID caseId,
            @Valid @RequestBody StartCaatRunRequest request,
            @RequestHeader("X-Actor-Id") String actorId) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(service.startCaatRun(caseId, request, actorId));
    }

    @GetMapping("/{caseId}/caat-runs")
    @PreAuthorize(READ_ROLES)
    public ResponseEntity<?> getCaatRuns(
            @PathVariable UUID caseId,
            @RequestHeader("X-Actor-Id") String actorId) {
        return ResponseEntity.ok(service.getCaatRuns(caseId));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CAAT EXCEPTIONS — FR-04.4-14, 28
    // ═══════════════════════════════════════════════════════════════════════════

    @GetMapping("/{caseId}/caat-exceptions")
    @PreAuthorize(READ_ROLES)
    public ResponseEntity<?> getCaatExceptions(
            @PathVariable UUID caseId,
            @RequestHeader("X-Actor-Id") String actorId) {
        return ResponseEntity.ok(service.getCaatExceptions(caseId));
    }

    @PostMapping("/{caseId}/caat-exceptions/{exceptionId}/review")
    @PreAuthorize(AUDITOR_ROLE)
    public ResponseEntity<?> reviewCaatException(
            @PathVariable UUID caseId,
            @PathVariable UUID exceptionId,
            @Valid @RequestBody ReviewCaatExceptionRequest request,
            @RequestHeader("X-Actor-Id") String actorId) {
        return ResponseEntity.ok(
            service.reviewCaatException(caseId, exceptionId, request, actorId));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ENTRY CONFERENCE — FR-04.2.1-01 → 05
    // ═══════════════════════════════════════════════════════════════════════════

    @PostMapping("/{caseId}/entry-conference")
    @PreAuthorize(AUDITOR_ROLE)
    public ResponseEntity<?> scheduleEntryConference(
            @PathVariable UUID caseId,
            @Valid @RequestBody ScheduleEntryConferenceRequest request,
            @RequestHeader("X-Actor-Id") String actorId) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(service.scheduleEntryConference(caseId, request, actorId));
    }

    @PutMapping("/{caseId}/entry-conference/results")
    @PreAuthorize(AUDITOR_ROLE)
    public ResponseEntity<?> recordEntryConferenceResults(
            @PathVariable UUID caseId,
            @Valid @RequestBody RecordEntryConferenceResultsRequest request,
            @RequestHeader("X-Actor-Id") String actorId) {
        return ResponseEntity.ok(
            service.recordEntryConferenceResults(caseId, request, actorId));
    }

    @GetMapping("/{caseId}/entry-conference")
    @PreAuthorize(READ_ROLES)
    public ResponseEntity<?> getEntryConferences(
            @PathVariable UUID caseId,
            @RequestHeader("X-Actor-Id") String actorId) {
        return ResponseEntity.ok(service.getEntryConferences(caseId));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // BALANCE SHEET TESTING — FR-04.4-03, 08
    // ═══════════════════════════════════════════════════════════════════════════

    @PostMapping("/{caseId}/balance-sheet")
    @PreAuthorize(AUDITOR_ROLE)
    public ResponseEntity<?> addBalanceSheetItem(
            @PathVariable UUID caseId,
            @Valid @RequestBody AddBalanceSheetItemRequest request,
            @RequestHeader("X-Actor-Id") String actorId) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(service.addBalanceSheetItem(caseId, request, actorId));
    }

    @GetMapping("/{caseId}/balance-sheet")
    @PreAuthorize(READ_ROLES)
    public ResponseEntity<?> getBalanceSheetItems(
            @PathVariable UUID caseId,
            @RequestHeader("X-Actor-Id") String actorId) {
        return ResponseEntity.ok(service.getBalanceSheetItems(caseId));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // BENCHMARK ANALYSIS — FR-04.4-06, 14
    // ═══════════════════════════════════════════════════════════════════════════

    @PostMapping("/{caseId}/benchmark-analysis")
    @PreAuthorize(AUDITOR_ROLE)
    public ResponseEntity<?> addBenchmarkAnalysis(
            @PathVariable UUID caseId,
            @Valid @RequestBody AddBenchmarkAnalysisRequest request,
            @RequestHeader("X-Actor-Id") String actorId) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(service.addBenchmarkAnalysis(caseId, request, actorId));
    }

    @GetMapping("/{caseId}/benchmark-analysis")
    @PreAuthorize(READ_ROLES)
    public ResponseEntity<?> getBenchmarkAnalyses(
            @PathVariable UUID caseId,
            @RequestHeader("X-Actor-Id") String actorId) {
        return ResponseEntity.ok(service.getBenchmarkAnalyses(caseId));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // THIRD-PARTY MATCHING — FR-04.4-07
    // ═══════════════════════════════════════════════════════════════════════════

    @PostMapping("/{caseId}/third-party-matches")
    @PreAuthorize(AUDITOR_ROLE)
    public ResponseEntity<?> addThirdPartyMatch(
            @PathVariable UUID caseId,
            @Valid @RequestBody AddThirdPartyMatchRequest request,
            @RequestHeader("X-Actor-Id") String actorId) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(service.addThirdPartyMatch(caseId, request, actorId));
    }

    @GetMapping("/{caseId}/third-party-matches")
    @PreAuthorize(READ_ROLES)
    public ResponseEntity<?> getThirdPartyMatches(
            @PathVariable UUID caseId,
            @RequestHeader("X-Actor-Id") String actorId) {
        return ResponseEntity.ok(service.getThirdPartyMatches(caseId));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RECONCILIATION — FR-04.4-16
    // ═══════════════════════════════════════════════════════════════════════════

    @PostMapping("/{caseId}/reconciliations")
    @PreAuthorize(AUDITOR_ROLE)
    public ResponseEntity<?> addReconciliation(
            @PathVariable UUID caseId,
            @Valid @RequestBody AddReconciliationRequest request,
            @RequestHeader("X-Actor-Id") String actorId) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(service.addReconciliation(caseId, request, actorId));
    }

    @GetMapping("/{caseId}/reconciliations")
    @PreAuthorize(READ_ROLES)
    public ResponseEntity<?> getReconciliations(
            @PathVariable UUID caseId,
            @RequestHeader("X-Actor-Id") String actorId) {
        return ResponseEntity.ok(service.getReconciliations(caseId));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // AUDIT FINDINGS — FR-04.4-10, 28, 33
    // ═══════════════════════════════════════════════════════════════════════════

    @PostMapping("/{caseId}/findings")
    @PreAuthorize(AUDITOR_ROLE)
    public ResponseEntity<?> createFinding(
            @PathVariable UUID caseId,
            @Valid @RequestBody CreateCaFindingRequest request,
            @RequestHeader("X-Actor-Id") String actorId) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(service.createFinding(caseId, request, actorId));
    }

    @GetMapping("/{caseId}/findings")
    @PreAuthorize(READ_ROLES)
    public ResponseEntity<?> getFindings(
            @PathVariable UUID caseId,
            @RequestHeader("X-Actor-Id") String actorId) {
        return ResponseEntity.ok(service.getFindings(caseId));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SAMPLING — FR-04.4-13, 15, 16
    // ═══════════════════════════════════════════════════════════════════════════

    @PostMapping("/{caseId}/sampling-records")
    @PreAuthorize(AUDITOR_ROLE)
    public ResponseEntity<?> addSamplingRecord(
            @PathVariable UUID caseId,
            @Valid @RequestBody AddSamplingRecordRequest request,
            @RequestHeader("X-Actor-Id") String actorId) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(service.addSamplingRecord(caseId, request, actorId));
    }

    @GetMapping("/{caseId}/sampling-records")
    @PreAuthorize(READ_ROLES)
    public ResponseEntity<?> getSamplingRecords(
            @PathVariable UUID caseId,
            @RequestHeader("X-Actor-Id") String actorId) {
        return ResponseEntity.ok(service.getSamplingRecords(caseId));
    }


    // ═══════════════════════════════════════════════════════════════════════════
    // WORKING PAPERS — FR-04.2-10
    // ═══════════════════════════════════════════════════════════════════════════

    @PostMapping("/{caseId}/working-papers")
    @PreAuthorize(AUDITOR_ROLE)
    public ResponseEntity<?> createWorkingPaper(
            @PathVariable UUID caseId,
            @Valid @RequestBody CreateWorkingPaperRequest request,
            @RequestHeader("X-Actor-Id") String actorId) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(service.createWorkingPaper(caseId, request, actorId));
    }

    @GetMapping("/{caseId}/working-papers")
    @PreAuthorize(READ_ROLES)
    public ResponseEntity<?> getWorkingPapers(
            @PathVariable UUID caseId,
            @RequestHeader("X-Actor-Id") String actorId) {
        return ResponseEntity.ok(service.getWorkingPapers(caseId));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DOCUMENT REQUESTS — FR-04.4-04
    // ═══════════════════════════════════════════════════════════════════════════

    @PostMapping("/{caseId}/documents")
    @PreAuthorize(AUDITOR_ROLE)
    public ResponseEntity<?> requestDocument(
            @PathVariable UUID caseId,
            @Valid @RequestBody AddDocumentRequestDto request,
            @RequestHeader("X-Actor-Id") String actorId) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(service.addDocumentRequest(caseId, request, actorId));
    }

    @GetMapping("/{caseId}/documents")
    @PreAuthorize(READ_ROLES)
    public ResponseEntity<?> getDocumentRequests(
            @PathVariable UUID caseId,
            @RequestHeader("X-Actor-Id") String actorId) {
        return ResponseEntity.ok(service.getDocumentRequests(caseId));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // QUERY SHEETS — FR-04.4-05, 09
    // ═══════════════════════════════════════════════════════════════════════════

    @PostMapping("/{caseId}/queries")
    @PreAuthorize(AUDITOR_ROLE)
    public ResponseEntity<?> createQuerySheet(
            @PathVariable UUID caseId,
            @Valid @RequestBody CreateQuerySheetRequest request,
            @RequestHeader("X-Actor-Id") String actorId) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(service.createQuerySheet(caseId, request, actorId));
    }

    @GetMapping("/{caseId}/queries")
    @PreAuthorize(READ_ROLES)
    public ResponseEntity<?> getQuerySheets(
            @PathVariable UUID caseId,
            @RequestHeader("X-Actor-Id") String actorId) {
        return ResponseEntity.ok(service.getQuerySheets(caseId));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ASSERTIONS — FR-04.4-03
    // ═══════════════════════════════════════════════════════════════════════════

    @PostMapping("/{caseId}/assertions")
    @PreAuthorize(AUDITOR_ROLE)
    public ResponseEntity<?> recordAssertion(
            @PathVariable UUID caseId,
            @Valid @RequestBody AddAuditAssertionRequest request,
            @RequestHeader("X-Actor-Id") String actorId) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(service.recordAssertion(caseId, request, actorId));
    }

    @GetMapping("/{caseId}/assertions")
    @PreAuthorize(READ_ROLES)
    public ResponseEntity<?> getAssertions(
            @PathVariable UUID caseId,
            @RequestHeader("X-Actor-Id") String actorId) {
        return ResponseEntity.ok(service.getAssertions(caseId));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // EXECUTION REPORT — FR-04.4-10
    // ═══════════════════════════════════════════════════════════════════════════

    @PostMapping("/{caseId}/reports")
    @PreAuthorize(AUDITOR_ROLE)
    public ResponseEntity<?> submitReport(
            @PathVariable UUID caseId,
            @Valid @RequestBody SubmitCaReportRequest request,
            @RequestHeader("X-Actor-Id") String actorId) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(service.submitExecutionReport(caseId, request, actorId));
    }

    @PostMapping("/{caseId}/reports/review")
    @PreAuthorize(TL_DIR_ROLES)
    public ResponseEntity<?> reviewReport(
            @PathVariable UUID caseId,
            @Valid @RequestBody ReviewCaReportRequest request,
            @RequestHeader("X-Actor-Id") String actorId) {
        return ResponseEntity.ok(service.reviewExecutionReport(caseId, request, actorId));
    }

    @GetMapping("/{caseId}/reports")
    @PreAuthorize(READ_ROLES)
    public ResponseEntity<?> getReports(
            @PathVariable UUID caseId,
            @RequestHeader("X-Actor-Id") String actorId) {
        return ResponseEntity.ok(service.getExecutionReports(caseId));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DRAFT REPORT — FR-04.4-18, 19, 20
    // ═══════════════════════════════════════════════════════════════════════════

    @PostMapping("/{caseId}/draft-report")
    @PreAuthorize(AUDITOR_ROLE)
    public ResponseEntity<?> submitDraftReport(
            @PathVariable UUID caseId,
            @Valid @RequestBody SubmitDraftReportRequest request,
            @RequestHeader("X-Actor-Id") String actorId) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(service.submitDraftReport(caseId, request, actorId));
    }

    @PostMapping("/{caseId}/draft-report/review")
    @PreAuthorize(TL_DIR_ROLES)
    public ResponseEntity<?> reviewDraftReport(
            @PathVariable UUID caseId,
            @Valid @RequestBody ReviewDraftReportRequest request,
            @RequestHeader("X-Actor-Id") String actorId) {
        return ResponseEntity.ok(service.reviewDraftReport(caseId, request, actorId));
    }

    @PostMapping("/{caseId}/draft-report/dispatch")
    @PreAuthorize(TL_DIR_ROLES)
    public ResponseEntity<?> dispatchReport(
            @PathVariable UUID caseId,
            @Valid @RequestBody DispatchReportRequest request,
            @RequestHeader("X-Actor-Id") String actorId) {
        return ResponseEntity.ok(service.dispatchReportToTaxpayer(caseId, request, actorId));
    }

    @GetMapping("/{caseId}/draft-report")
    @PreAuthorize(READ_ROLES)
    public ResponseEntity<?> getDraftReports(
            @PathVariable UUID caseId,
            @RequestHeader("X-Actor-Id") String actorId) {
        return ResponseEntity.ok(service.getDraftReports(caseId));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // EXIT CONFERENCE — FR-04.4-18, 19
    // ═══════════════════════════════════════════════════════════════════════════

    @PostMapping("/{caseId}/exit-conference")
    @PreAuthorize(AUDITOR_ROLE)
    public ResponseEntity<?> scheduleExitConference(
            @PathVariable UUID caseId,
            @Valid @RequestBody ScheduleExitConferenceRequest request,
            @RequestHeader("X-Actor-Id") String actorId) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(service.scheduleExitConference(caseId, request, actorId));
    }

    @PutMapping("/{caseId}/exit-conference/results")
    @PreAuthorize(AUDITOR_ROLE)
    public ResponseEntity<?> recordExitConferenceResults(
            @PathVariable UUID caseId,
            @Valid @RequestBody RecordExitConferenceResultsRequest request,
            @RequestHeader("X-Actor-Id") String actorId) {
        return ResponseEntity.ok(
            service.recordExitConferenceResults(caseId, request, actorId));
    }

    @GetMapping("/{caseId}/exit-conference")
    @PreAuthorize(READ_ROLES)
    public ResponseEntity<?> getExitConferences(
            @PathVariable UUID caseId,
            @RequestHeader("X-Actor-Id") String actorId) {
        return ResponseEntity.ok(service.getExitConferences(caseId));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ASSESSMENT NOTICE — FR-04.4-29, 30, 31, 32
    // ═══════════════════════════════════════════════════════════════════════════

    @PostMapping("/{caseId}/assessment-notice")
    @PreAuthorize(TL_DIR_ROLES)
    public ResponseEntity<?> generateAssessmentNotice(
            @PathVariable UUID caseId,
            @Valid @RequestBody GenerateAssessmentNoticeRequest request,
            @RequestHeader("X-Actor-Id") String actorId) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(service.generateAssessmentNotice(caseId, request, actorId));
    }

    @PostMapping("/{caseId}/assessment-notice/{noticeId}/issue")
    @PreAuthorize(TL_DIR_ROLES)
    public ResponseEntity<?> issueAssessmentNotice(
            @PathVariable UUID caseId,
            @PathVariable UUID noticeId,
            @RequestHeader("X-Actor-Id") String actorId) {
        return ResponseEntity.ok(service.issueAssessmentNotice(caseId, noticeId, actorId));
    }

    @GetMapping("/{caseId}/assessment-notice")
    @PreAuthorize(READ_ROLES)
    public ResponseEntity<?> getAssessmentNotices(
            @PathVariable UUID caseId,
            @RequestHeader("X-Actor-Id") String actorId) {
        return ResponseEntity.ok(service.getAssessmentNotices(caseId));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TAXPAYER RESPONSE — FR-04.4-27, 30
    // ═══════════════════════════════════════════════════════════════════════════

    @PostMapping("/{caseId}/taxpayer-responses")
    @PreAuthorize(AUDITOR_ROLE)
    public ResponseEntity<?> recordTaxpayerResponse(
            @PathVariable UUID caseId,
            @Valid @RequestBody RecordTaxpayerResponseRequest request,
            @RequestHeader("X-Actor-Id") String actorId) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(service.recordTaxpayerResponse(caseId, request, actorId));
    }

    @GetMapping("/{caseId}/taxpayer-responses")
    @PreAuthorize(READ_ROLES)
    public ResponseEntity<?> getTaxpayerResponses(
            @PathVariable UUID caseId,
            @RequestHeader("X-Actor-Id") String actorId) {
        return ResponseEntity.ok(service.getTaxpayerResponses(caseId));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CLOSE CASE
    // ═══════════════════════════════════════════════════════════════════════════

    @PostMapping("/{caseId}/close")
    @PreAuthorize(TL_DIR_ROLES)
    public ResponseEntity<?> closeCase(
            @PathVariable UUID caseId,
            @RequestHeader("X-Actor-Id") String actorId) {
        return ResponseEntity.ok(service.closeCase(caseId, actorId));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HISTORY
    // ═══════════════════════════════════════════════════════════════════════════

    @GetMapping("/{caseId}/history")
    @PreAuthorize(READ_ROLES)
    public ResponseEntity<?> getCaseOverviewForHistory(
            @PathVariable UUID caseId,
            @RequestHeader("X-Actor-Id") String actorId) {
        return ResponseEntity.ok(service.getCaseOverview(caseId));
    }
}
