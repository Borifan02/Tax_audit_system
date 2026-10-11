package mor.itas.api.controller.backoffice.ap;

import jakarta.validation.Valid;
import mor.itas.api.dto.request.ap.ApprovalRequest;
import mor.itas.api.dto.request.ap.CreatePlanRequest;
import mor.itas.api.dto.request.ap.DivideAllocationRequest;
import mor.itas.api.dto.request.ap.SubmitTaxCenterFeedbackRequest;
import mor.itas.api.dto.response.ap.AllocationResponse;
import mor.itas.api.dto.response.ap.AuditLogResponse;
import mor.itas.api.dto.response.ap.PlanResponse;
import mor.itas.api.dto.response.ap.CreatePlanResponse;
import mor.itas.application.port.outboundport.riskengine.RiskEnginePort;
import mor.itas.domain.valueobject.RiskDistribution;
import mor.itas.api.mapper.ap.PlanResponseMapper;
import mor.itas.application.usecase.ap.PlanManagementUseCase;
import mor.itas.domain.model.ap.AnnualAuditPlan;
import mor.itas.domain.model.ap.PlanAllocation;
import mor.itas.domain.model.ap.PlanAuditLog;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.Map;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.ArrayList;

import mor.itas.application.usecase.workflow.WorkflowExecutionEngine;
import mor.itas.infrastructure.security.ItasPrincipal;
import java.util.Set;

/**
 * PlanWorkflowController - REST API for Annual Audit Plan workflow
 * Implements 4-level approval workflow with regional allocations
 */
@RestController
@RequestMapping("/api/v1/backoffice/ap/plans/workflow")
public class PlanWorkflowController {

    @Autowired
    private PlanManagementUseCase planManagementUseCase;

    @Autowired
    private PlanResponseMapper responseMapper;

    @Autowired
    private RiskEnginePort riskEnginePort;

    @Autowired
    private WorkflowExecutionEngine workflowExecutionEngine;

    @Autowired
    private mor.itas.application.service.notification.NotificationService notificationService;

    // ============= LEVEL 1: Planning Team =============

    /**
     * Get Pre-filled Plan Data with Risk Recommendations
     * GET /api/v1/backoffice/ap/plans/pre-filled-data
     * Returns case distribution table pre-filled from Risk Engine that can be reviewed and overridden
     */
    @GetMapping("/pre-filled-data")
    public ResponseEntity<Map<String, Object>> getPreFilledPlanData(
            @RequestHeader(value = "X-Actor-Id", required = false, defaultValue = "national-process-owner") String actorId) {
        
        // Get risk-based recommendations from Risk Engine
        Map<String, Integer> suggestedQuotas = riskEnginePort.fetchSuggestedQuotas();
        Map<String, RiskDistribution> regionalRisks = riskEnginePort.getRiskDistributionByRegion();
        Map<String, Double> auditTypeDistribution = riskEnginePort.getRecommendedAuditTypeDistribution();
        
        // Build case distribution table
        List<Map<String, Object>> caseDistributionTable = new ArrayList<>();
        Map<String, String> regionNames = Map.of(
            "FED", "Federal Level (LTO)",
            "AA", "Addis Ababa",
            "BA", "Amhara (Bahir Dar)",
            "BB", "Oromia",
            "AB", "Dire Dawa",
            "CA", "SNNPR",
            "SO", "Somalia"
        );
        
        int totalCases = 0;
        
        for (String region : new String[]{"FED", "AA", "BA", "BB", "AB", "CA", "SO"}) {
            RiskDistribution risk = regionalRisks.get(region);
            if (risk != null) {
                long regionalTotal = risk.critical() + risk.high() + risk.medium() + risk.low();
                
                // Calculate distribution by audit type based on testing target (~500-800 per region, 20-50 per type in TC)
                int desk = (int)(regionalTotal * 0.35 * 0.02);
                int field = (int)(regionalTotal * 0.25 * 0.02);
                int joint = (int)(regionalTotal * 0.15 * 0.02);
                int tprice = (int)(regionalTotal * 0.08 * 0.02);
                int comp = (int)(regionalTotal * 0.12 * 0.02);
                int issue = (int)(regionalTotal * 0.05 * 0.02);
                int regionTotal = desk + field + joint + tprice + comp + issue;
                
                totalCases += regionTotal;
                
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("region", region);
                row.put("regionName", regionNames.get(region));
                row.put("desk", desk);
                row.put("field", field);
                row.put("joint", joint);
                row.put("tprice", tprice);
                row.put("comp", comp);
                row.put("issue", issue);
                row.put("total", regionTotal);
                
                caseDistributionTable.add(row);
            }
        }
        
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("riskBasedDefaults", Map.of(
            "source", "Risk Engine",
            "message", "Pre-filled from Risk Estimates. Values below are based on risk engine recommendations. Edit any cell to override.",
            "totalCases", totalCases,
            "caseDistributionTable", caseDistributionTable,
            "suggestedQuotas", suggestedQuotas
        ));
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get Risk Analysis Dashboard
     * GET /api/v1/backoffice/ap/plans/risk-analysis/dashboard
     * Shows national aggregate, regional breakdown, audit types, and risk levels
     */
    @GetMapping("/risk-analysis/dashboard")
    public ResponseEntity<Map<String, Object>> getRiskAnalysisDashboard(
            @RequestHeader(value = "X-Actor-Id", required = false, defaultValue = "national-process-owner") String actorId) {
        
        // Get national risk distribution - SCALED FOR OPTIMAL TESTING PERFORMANCE (Total: 3,500 national cases)
        Map<String, Integer> nationalRiskCounts = new HashMap<>();
        nationalRiskCounts.put("critical", 350);
        nationalRiskCounts.put("high", 1050);
        nationalRiskCounts.put("medium", 1225);
        nationalRiskCounts.put("low", 875);
        Long totalAudits = 350L + 1050L + 1225L + 875L; // 3,500 total
        
        // Calculate percentages
        Double criticalPct = (350.0 / totalAudits) * 100;
        Double highPct = (1050.0 / totalAudits) * 100;
        Double mediumPct = (1225.0 / totalAudits) * 100;
        Double lowPct = (875.0 / totalAudits) * 100;
        
        Map<String, Object> dashboard = new LinkedHashMap<>();
        
        // National Level
        Map<String, Object> national = new LinkedHashMap<>();
        national.put("totalTaxpayers", 50_000L);
        national.put("totalRiskyTaxpayers", 4_500L);
        national.put("totalAuditsRequired", totalAudits);
        national.put("riskPercentage", String.format("%.2f%%", (4_500.0 / 50_000.0) * 100));
        national.put("riskLevelBreakdown", nationalRiskCounts);
        national.put("riskLevelPercentages", Map.of(
            "critical", String.format("%.2f%%", criticalPct),
            "high", String.format("%.2f%%", highPct),
            "medium", String.format("%.2f%%", mediumPct),
            "low", String.format("%.2f%%", lowPct)
        ));
        dashboard.put("nationalAggregate", national);
        
        // Regional Breakdown (Scaled to 500-800 per region)
        Map<String, Object> regional = new LinkedHashMap<>();
        
        // Region FED (600 audits)
        Map<String, Object> fed = new LinkedHashMap<>();
        fed.put("regionCode", "FED");
        fed.put("regionName", "Federal Level (LTO)");
        fed.put("taxpayers", 2_000L);
        fed.put("riskyTaxpayers", 800L);
        fed.put("auditsRequired", 600);
        fed.put("riskLevelBreakdown", Map.of("critical", 150, "high", 250, "medium", 150, "low", 50));
        regional.put("FED", fed);

        // Region AA (700 audits)
        Map<String, Object> aa = new LinkedHashMap<>();
        aa.put("regionCode", "AA");
        aa.put("regionName", "Addis Ababa");
        aa.put("taxpayers", 15_000L);
        aa.put("riskyTaxpayers", 900L);
        aa.put("auditsRequired", 700);
        aa.put("riskLevelBreakdown", Map.of("critical", 50, "high", 200, "medium", 270, "low", 180));
        regional.put("AA", aa);
        
        // Region BA (500 audits)
        Map<String, Object> ba = new LinkedHashMap<>();
        ba.put("regionCode", "BA");
        ba.put("regionName", "Amhara (Bahir Dar)");
        ba.put("taxpayers", 10_000L);
        ba.put("riskyTaxpayers", 650L);
        ba.put("auditsRequired", 500);
        ba.put("riskLevelBreakdown", Map.of("critical", 30, "high", 150, "medium", 170, "low", 150));
        regional.put("BA", ba);
        
        // Region BB (500 audits)
        Map<String, Object> bb = new LinkedHashMap<>();
        bb.put("regionCode", "BB");
        bb.put("regionName", "Oromia");
        bb.put("taxpayers", 12_000L);
        bb.put("riskyTaxpayers", 650L);
        bb.put("auditsRequired", 500);
        bb.put("riskLevelBreakdown", Map.of("critical", 30, "high", 150, "medium", 170, "low", 150));
        regional.put("BB", bb);
        
        // Region AB (400 audits)
        Map<String, Object> ab = new LinkedHashMap<>();
        ab.put("regionCode", "AB");
        ab.put("regionName", "Dire Dawa");
        ab.put("taxpayers", 5_000L);
        ab.put("riskyTaxpayers", 500L);
        ab.put("auditsRequired", 400);
        ab.put("riskLevelBreakdown", Map.of("critical", 30, "high", 100, "medium", 150, "low", 120));
        regional.put("AB", ab);
        
        // Region CA (400 audits)
        Map<String, Object> ca = new LinkedHashMap<>();
        ca.put("regionCode", "CA");
        ca.put("regionName", "SNNPR");
        ca.put("taxpayers", 4_000L);
        ca.put("riskyTaxpayers", 500L);
        ca.put("auditsRequired", 400);
        ca.put("riskLevelBreakdown", Map.of("critical", 30, "high", 100, "medium", 130, "low", 140));
        regional.put("CA", ca);
        
        // Region SO (400 audits)
        Map<String, Object> so = new LinkedHashMap<>();
        so.put("regionCode", "SO");
        so.put("regionName", "Somalia");
        so.put("taxpayers", 4_000L);
        so.put("riskyTaxpayers", 500L);
        so.put("auditsRequired", 400);
        so.put("riskLevelBreakdown", Map.of("critical", 30, "high", 100, "medium", 130, "low", 140));
        regional.put("SO", so);
        
        dashboard.put("regionalBreakdown", regional);
        
        // Audit Type Distribution
        Map<String, Object> auditTypes = new LinkedHashMap<>();
        auditTypes.put("DESK_AUDIT", Map.of("percentage", 35.0, "suggestedCount", (long)(totalAudits * 0.35)));
        auditTypes.put("FIELD_AUDIT", Map.of("percentage", 25.0, "suggestedCount", (long)(totalAudits * 0.25)));
        auditTypes.put("JOINT_AUDIT", Map.of("percentage", 15.0, "suggestedCount", (long)(totalAudits * 0.15)));
        auditTypes.put("TRANSFER_PRICING", Map.of("percentage", 8.0, "suggestedCount", (long)(totalAudits * 0.08)));
        auditTypes.put("COMPREHENSIVE", Map.of("percentage", 12.0, "suggestedCount", (long)(totalAudits * 0.12)));
        auditTypes.put("ISSUE_AUDIT", Map.of("percentage", 5.0, "suggestedCount", (long)(totalAudits * 0.05)));
        dashboard.put("auditTypeDistribution", auditTypes);
        
        // Risk Level Distribution
        Map<String, Object> riskDistribution = new LinkedHashMap<>();
        riskDistribution.put("critical", Map.of("count", 350, "percentage", criticalPct));
        riskDistribution.put("high", Map.of("count", 1050, "percentage", highPct));
        riskDistribution.put("medium", Map.of("count", 1225, "percentage", mediumPct));
        riskDistribution.put("low", Map.of("count", 875, "percentage", lowPct));
        dashboard.put("riskLevelDistribution", riskDistribution);
        
        return ResponseEntity.ok(dashboard);
    }
    @PostMapping
    public ResponseEntity<PlanResponse> createPlan(
        @Valid @RequestBody CreatePlanRequest request,
        @RequestHeader(value = "X-Actor-Id", required = false, defaultValue = "national-process-owner") String actorId) {

        // Convert request DTOs to use case DTOs
        List<PlanManagementUseCase.RegionalAllocationDto> regionalAllocations = request.getRegionalAllocations()
            .stream()
            .map(r -> new PlanManagementUseCase.RegionalAllocationDto(r.getRegionCode(), r.getProposedCount()))
            .toList();

        AnnualAuditPlan plan = planManagementUseCase.createPlanWithRegionalAllocations(
            request.getPlanYear(),
            request.getPlanName(),
            regionalAllocations,
            request.getDistribution(),  // Pass distribution data
            request.getEstimatedRevenue(), // Pass estimated revenue
            actorId
        );

        return ResponseEntity.status(HttpStatus.CREATED)
            .body(responseMapper.toPlanResponse(plan));
    }

    /**
     * Submit plan to Director
     * POST /api/v1/backoffice/ap/plans/{planId}/submit-to-director
     */
    @PostMapping("/{planId}/submit-to-director")
    public ResponseEntity<PlanResponse> submitToDirector(
        @PathVariable UUID planId,
        @RequestHeader(value = "X-Actor-Id", required = false, defaultValue = "national-process-owner") String actorId) throws Exception {

        AnnualAuditPlan plan = planManagementUseCase.submitToDirector(planId, actorId);

        // Wire into WorkflowExecutionEngine
        try {
            ItasPrincipal principal = new ItasPrincipal(
                    actorId,
                    actorId,
                    "N/A",
                    "Planning Officer",
                    "FED",
                    java.util.Set.of(
                            new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_AUDITOR"),
                            new org.springframework.security.core.authority.SimpleGrantedAuthority("PERM_AUDIT_PLAN_CREATE")
                    )
            );

            workflowExecutionEngine.triggerWorkflow(
                    planId,
                    planId,
                    "AUDIT_PLAN",
                    "Annual Audit Plan Approval — FY " + plan.getPlanYear(),
                    principal
            );
        } catch (Exception e) {
            System.err.println("[AP-Workflow] Notice: Workflow task trigger log: " + e.getMessage());
        }

        try {
            notificationService.sendNotification(
                "u-dir-audit",
                "WORKFLOW_TASK",
                "Annual Audit Plan Submitted: FY " + plan.getPlanYear(),
                "Planning Officer has submitted the FY " + plan.getPlanYear() + " Annual Audit Plan for Director review.",
                null,
                null,
                "AUDIT_PLAN",
                planId
            );
        } catch (Exception ignored) {}

        return ResponseEntity.ok(responseMapper.toPlanResponse(plan));
    }

    // ============= LEVEL 2: Director =============

    /**
     * Approve plan by Director
     * POST /api/v1/backoffice/ap/plans/{planId}/approve-by-director
     */
    @PostMapping("/{planId}/approve-by-director")
    public ResponseEntity<PlanResponse> approveByDirector(
        @PathVariable UUID planId,
        @Valid @RequestBody ApprovalRequest request,
        @RequestHeader(value = "X-Actor-Id", required = false, defaultValue = "national-process-owner") String actorId) throws Exception {

        AnnualAuditPlan plan = planManagementUseCase.approveByDirector(
            planId,
            actorId,
            request.getReason()
        );

        try {
            notificationService.sendNotification(
                "u-pt-01",
                "WORKFLOW_TASK",
                "Annual Audit Plan Approved: FY " + plan.getPlanYear(),
                "Director of Audit has approved the FY " + plan.getPlanYear() + " Annual Audit Plan.",
                null,
                null,
                "AUDIT_PLAN",
                planId
            );
        } catch (Exception ignored) {}

        return ResponseEntity.ok(responseMapper.toPlanResponse(plan));
    }

    /**
     * Submit plan to Regional Directors
     * POST /api/v1/backoffice/ap/plans/{planId}/submit-to-regional
     */
    @PostMapping("/{planId}/submit-to-regional")
    public ResponseEntity<PlanResponse> submitToRegional(
        @PathVariable UUID planId,
        @RequestHeader(value = "X-Actor-Id", required = false, defaultValue = "national-process-owner") String actorId) throws Exception {

        AnnualAuditPlan plan = planManagementUseCase.submitToRegionalDirectors(planId, actorId);
        return ResponseEntity.ok(responseMapper.toPlanResponse(plan));
    }

    /**
     * Send plan to Tax Centers
     * POST /api/v1/backoffice/ap/plans/{planId}/send-to-tax-centers
     */
    @PostMapping("/{planId}/send-to-tax-centers")
    public ResponseEntity<PlanResponse> sendToTaxCenters(
        @PathVariable UUID planId,
        @RequestHeader(value = "X-Actor-Id", required = false, defaultValue = "national-process-owner") String actorId) throws Exception {

        AnnualAuditPlan plan = planManagementUseCase.sendToTaxCenters(planId, actorId);

        try {
            notificationService.sendNotification(
                "u-mgr-federal-lto1",
                "WORKFLOW_TASK",
                "Annual Audit Plan Allocations Received",
                "FY " + plan.getPlanYear() + " Annual Audit Plan allocations are available for tax center review.",
                null,
                null,
                "AUDIT_PLAN",
                planId
            );
        } catch (Exception ignored) {}

        return ResponseEntity.ok(responseMapper.toPlanResponse(plan));
    }

    // ============= LEVEL 3: Regional Director =============

    /**
     * Approve plan by Regional Director
     * POST /api/v1/backoffice/ap/plans/{planId}/approve-by-regional
     */
    @PostMapping("/{planId}/approve-by-regional")
    public ResponseEntity<PlanResponse> approveByRegional(
        @PathVariable UUID planId,
        @Valid @RequestBody ApprovalRequest request,
        @RequestHeader(value = "X-Actor-Id", required = false, defaultValue = "national-process-owner") String actorId) throws Exception {

        AnnualAuditPlan plan = planManagementUseCase.approveByRegionalDirector(
            planId,
            actorId,
            request.getReason()
        );

        return ResponseEntity.ok(responseMapper.toPlanResponse(plan));
    }

    /**
     * Divide regional allocation into tax center allocations
     * POST /api/v1/backoffice/ap/plans/{planId}/divide-allocations
     */
    @PostMapping("/{planId}/divide-allocations")
    public ResponseEntity<PlanResponse> divideAllocations(
        @PathVariable UUID planId,
        @Valid @RequestBody DivideAllocationRequest request,
        @RequestHeader(value = "X-Actor-Id", required = false, defaultValue = "national-process-owner") String actorId) {

        // Convert request DTOs to use case DTOs
        List<PlanManagementUseCase.TaxCenterAllocationDto> tcAllocations = request.getTaxCenterAllocations()
            .stream()
            .map(t -> new PlanManagementUseCase.TaxCenterAllocationDto(t.getTaxCenterCode(), t.getAuditCount()))
            .toList();

        AnnualAuditPlan plan = planManagementUseCase.divideRegionalAllocationIntoTaxCenters(
            planId,
            request.getRegionCode(),
            tcAllocations,
            actorId
        );

        return ResponseEntity.ok(responseMapper.toPlanResponse(plan));
    }

    // ============= LEVEL 4: Tax Center Manager =============

    /**
     * Submit tax center feedback
     * PATCH /api/v1/backoffice/ap/plans/{planId}/allocations/{taxCenterCode}/feedback
     */
    @PatchMapping("/{planId}/allocations/{taxCenterCode}/feedback")
    public ResponseEntity<PlanResponse> submitTaxCenterFeedback(
        @PathVariable UUID planId,
        @PathVariable String taxCenterCode,
        @Valid @RequestBody SubmitTaxCenterFeedbackRequest request,
        @RequestHeader(value = "X-Actor-Id", required = false, defaultValue = "national-process-owner") String actorId) {

        AnnualAuditPlan plan = planManagementUseCase.submitTaxCenterFeedback(
            planId,
            taxCenterCode,
            request.getAdjustedCount(),
            request.getJustification(),
            actorId
        );

        try {
            notificationService.sendNotification(
                "u-pt-01",
                "WORKFLOW_TASK",
                "Tax Center Feedback: " + taxCenterCode,
                "Tax center " + taxCenterCode + " has submitted allocation adjustment feedback for plan FY " + plan.getPlanYear() + ".",
                null,
                null,
                "AUDIT_PLAN",
                planId
            );
        } catch (Exception ignored) {}

        return ResponseEntity.ok(responseMapper.toPlanResponse(plan));
    }

    // ============= FINALIZATION =============

    /**
     * Record all tax centers have submitted feedback
     * POST /api/v1/backoffice/ap/plans/{planId}/mark-feedback-complete
     */
    @PostMapping("/{planId}/mark-feedback-complete")
    public ResponseEntity<PlanResponse> markFeedbackComplete(
        @PathVariable UUID planId,
        @RequestHeader(value = "X-Actor-Id", required = false, defaultValue = "national-process-owner") String actorId) {

        AnnualAuditPlan plan = planManagementUseCase.recordAllTaxCenterFeedbackSubmitted(planId, actorId);
        return ResponseEntity.ok(responseMapper.toPlanResponse(plan));
    }

    /**
     * Finalize plan
     * POST /api/v1/backoffice/ap/plans/{planId}/finalize
     */
    @PostMapping("/{planId}/finalize")
    public ResponseEntity<PlanResponse> finalizePlan(
        @PathVariable UUID planId,
        @RequestHeader(value = "X-Actor-Id", required = false, defaultValue = "national-process-owner") String actorId) {

        AnnualAuditPlan plan = planManagementUseCase.finalizePlan(planId, actorId);

        try {
            notificationService.sendNotification(
                "u-mgr-federal-lto1",
                "WORKFLOW_TASK",
                "Annual Audit Plan Finalized: FY " + plan.getPlanYear(),
                "The Annual Audit Plan FY " + plan.getPlanYear() + " has been finalized and cases are ready for assignment.",
                null,
                null,
                "AUDIT_PLAN",
                planId
            );
        } catch (Exception ignored) {}

        return ResponseEntity.ok(responseMapper.toPlanResponse(plan));
    }

    // ============= ERROR HANDLING =============

    /**
     * Handle bean validation errors (from @Valid, @NotBlank, @Positive, etc.)
     */
    @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(
            org.springframework.web.bind.MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getAllErrors().stream()
            .map(error -> error.getDefaultMessage())
            .findFirst()
            .orElse("Validation failed");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(new ErrorResponse("VALIDATION_ERROR", message));
    }

    /**
     * Handle validation errors
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(new ErrorResponse("INVALID_INPUT", ex.getMessage()));
    }

    /**
     * Handle state transition errors
     */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalState(IllegalStateException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(new ErrorResponse("INVALID_STATE", ex.getMessage()));
    }

    /**
     * Handle not found errors
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(new ErrorResponse("INTERNAL_ERROR", ex.getMessage()));
    }

    /**
     * Error response DTO
     */
    public static class ErrorResponse {
        private String code;
        private String message;

        public ErrorResponse(String code, String message) {
            this.code = code;
            this.message = message;
        }

        public String getCode() {
            return code;
        }

        public String getMessage() {
            return message;
        }
    }
}

