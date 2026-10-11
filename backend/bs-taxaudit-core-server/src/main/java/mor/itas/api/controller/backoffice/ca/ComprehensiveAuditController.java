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

    private static final String READ_ROLES =
        "hasAnyRole('AUDITOR','TEAM_LEADER','DIRECTOR','FRAUD_INVESTIGATOR')";
    private static final String AUDITOR_ROLE   = "hasRole('AUDITOR')";
    private static final String TL_DIR_ROLES   = "hasAnyRole('TEAM_LEADER','DIRECTOR')";

    // ═══════════════════════════════════════════════════════════════════════════
    // CASE OVERVIEW
    // ═══════════════════════════════════════════════════════════════════════════

    @Operation(summary = "Get comprehensive audit case overview",
               description = "Returns caWorkflowStatus, progress counters, taxpayer info, and latest report/notice status. FR-04.4.")
    @GetMapping("/{caseId}")
    @PreAuthorize(READ_ROLES)
    public ResponseEntity<?> getCaseOverview(
            @Parameter(description = "Audit case UUID") @PathVariable UUID caseId,
            @Parameter(description = "Actor UUID (X-Actor-Id header)", required = true)
            @RequestHeader("X-Actor-Id") String actorId) {
        return ResponseEntity.ok(service.getCaseOverview(caseId));
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
