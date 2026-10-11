package mor.itas.api.controller.backoffice.ap;

import mor.itas.api.dto.response.ap.GenericResponse;
import mor.itas.api.dto.response.ap.jac.AuditorDashboardResponse;
import mor.itas.domain.service.ap.AuditWorkflowService;
import mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity;
import mor.itas.persistence.jpa.repository.ap.ApAuditCaseRepository;
import mor.itas.persistence.jpa.repository.ap.AuditFindingRepository;
import mor.itas.persistence.jpa.repository.ap.AuditPlanRecordRepository;
import mor.itas.persistence.jpa.repository.ap.DocumentRequestRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * AuditorDashboardController - REST endpoints for the auditor dashboard
 * Provides metrics, case summaries, and workflow progress for the logged-in auditor
 */
@RestController
@RequestMapping("/api/v1/backoffice/ap/auditor")
@RequiredArgsConstructor
public class AuditorDashboardController {

    private final ApAuditCaseRepository caseRepository;
    private final AuditWorkflowService workflowService;
    private final AuditFindingRepository findingRepository;
    private final AuditPlanRecordRepository planRepository;
    private final DocumentRequestRecordRepository docRequestRepository;
    private final mor.itas.persistence.jpa.repository.ap.UserJpaRepository userJpaRepository;

    /**
     * Get auditor dashboard with metrics and case summaries
     * GET /api/v1/backoffice/ap/auditor/dashboard?auditorId={id}
     */
    @GetMapping("/dashboard")
    public ResponseEntity<GenericResponse<AuditorDashboardResponse>> getDashboard(
            @RequestParam String auditorId) {

        // Fetch all cases assigned to this auditor
        List<ApAuditCaseEntity> allCases = new ArrayList<>(caseRepository.findByAssignedAuditorId(auditorId));
        if (allCases.isEmpty() && auditorId != null && !auditorId.isBlank()) {
            String altId = resolveAltAuditorId(auditorId);
            if (altId != null && !altId.equalsIgnoreCase(auditorId)) {
                allCases.addAll(caseRepository.findByAssignedAuditorId(altId));
            }
        }

        // Compute metrics
        long totalAssigned = allCases.size();
        long inProgress = allCases.stream()
                .filter(c -> "IN_PROGRESS".equals(c.getStatus()))
                .count();
        long completed = allCases.stream()
                .filter(c -> "COMPLETED".equals(c.getStatus()) || "CONCLUDED".equals(c.getStatus()))
                .count();

        // Build case summaries for active cases
        List<ApAuditCaseEntity> activeCases = allCases.stream()
                .filter(c -> "IN_PROGRESS".equals(c.getStatus()) || "ASSIGNED".equals(c.getStatus()))
                .sorted(Comparator.comparing(ApAuditCaseEntity::getCreatedAt).reversed())
                .collect(Collectors.toList());

        List<AuditorDashboardResponse.AuditorCaseSummary> activeSummaries = activeCases.stream()
                .map(this::buildCaseSummary)
                .collect(Collectors.toList());

        // Build case summaries for recent completed
        List<ApAuditCaseEntity> completedCases = allCases.stream()
                .filter(c -> "COMPLETED".equals(c.getStatus()) || "CONCLUDED".equals(c.getStatus()))
                .sorted(Comparator.comparing(ApAuditCaseEntity::getCompletedAt).reversed())
                .limit(5)
                .collect(Collectors.toList());

        List<AuditorDashboardResponse.AuditorCaseSummary> completedSummaries = completedCases.stream()
                .map(this::buildCaseSummary)
                .collect(Collectors.toList());

        AuditorDashboardResponse response = AuditorDashboardResponse.builder()
                .totalAssigned(totalAssigned)
                .inProgress(inProgress)
                .completed(completed)
                .pendingDocuments(0L) // Will be computed from doc requests
                .overdueFindings(0L) // Will be computed from findings
                .totalAuditDays(computeTotalAuditDays(allCases))
                .activeCases(activeSummaries)
                .recentCompleted(completedSummaries)
                .build();

        return ResponseEntity.ok(GenericResponse.success(response));
    }

    /**
     * Get workflow progress for a specific case
     * GET /api/v1/backoffice/ap/auditor/cases/{caseId}/progress
     */
    @GetMapping("/cases/{caseId}/progress")
    public ResponseEntity<GenericResponse<Map<String, Object>>> getCaseProgress(
            @PathVariable UUID caseId) {

        Map<String, Object> workflow = workflowService.getCaseWorkflow(caseId);
        return ResponseEntity.ok(GenericResponse.success(workflow));
    }

    /**
     * Get auditor workload summary
     * GET /api/v1/backoffice/ap/auditor/workload?auditorId={id}
     */
    @GetMapping("/workload")
    public ResponseEntity<GenericResponse<Map<String, Object>>> getWorkload(
            @RequestParam String auditorId) {

        List<ApAuditCaseEntity> allCases = caseRepository.findByAssignedAuditorId(auditorId);

        Map<String, Object> workload = new HashMap<>();
        workload.put("totalCases", allCases.size());
        workload.put("inProgress", allCases.stream()
                .filter(c -> "IN_PROGRESS".equals(c.getStatus())).count());
        workload.put("completed", allCases.stream()
                .filter(c -> "COMPLETED".equals(c.getStatus()) || "CONCLUDED".equals(c.getStatus())).count());
        workload.put("highRisk", allCases.stream()
                .filter(c -> "HIGH".equals(c.getRiskPriority()) || "CRITICAL".equals(c.getRiskPriority())).count());

        return ResponseEntity.ok(GenericResponse.success(workload));
    }

    // ── Helper Methods ──────────────────────────────────────────────────────

    private AuditorDashboardResponse.AuditorCaseSummary buildCaseSummary(ApAuditCaseEntity entity) {
        return AuditorDashboardResponse.AuditorCaseSummary.builder()
                .caseId(entity.getId().toString())
                .caseNumber(entity.getCaseNumber())
                .taxpayerName(entity.getTaxpayerName())
                .taxpayerId(entity.getTaxpayerId())
                .auditType(entity.getAuditType())
                .riskPriority(entity.getRiskPriority())
                .riskScore(entity.getRiskScore())
                .status(entity.getStatus())
                .currentStep(determineCurrentStep(entity))
                .workflowProgress(computeWorkflowProgress(entity))
                .assignedTeamLeaderId(entity.getAssignedTeamLeaderId())
                .assignedDate(entity.getStartedAt() != null ? entity.getStartedAt().toString() : null)
                .dueDate(null) // Due date not in entity yet
                .daysRemaining(computeDaysRemaining(entity))
                .build();
    }

    private String determineCurrentStep(ApAuditCaseEntity entity) {
        if (entity.getStatus() == null) return "HANDOFF";
        return switch (entity.getStatus()) {
            case "PENDING_ASSIGNMENT" -> "HANDOFF";
            case "ASSIGNED" -> "ASSIGNMENT";
            case "IN_PROGRESS" -> "PLANNING";
            case "COMPLETED" -> "CONCLUSION";
            case "CONCLUDED" -> "CONCLUDED";
            default -> "HANDOFF";
        };
    }

    private int computeWorkflowProgress(ApAuditCaseEntity entity) {
        if (entity.getStatus() == null) return 0;
        return switch (entity.getStatus()) {
            case "PENDING_ASSIGNMENT" -> 0;
            case "ASSIGNED" -> 10;
            case "IN_PROGRESS" -> 20;
            case "COMPLETED" -> 90;
            case "CONCLUDED" -> 100;
            default -> 0;
        };
    }

    private long computeTotalAuditDays(List<ApAuditCaseEntity> cases) {
        return cases.stream()
                .filter(c -> c.getStartedAt() != null)
                .mapToLong(c -> {
                    OffsetDateTime end = c.getCompletedAt() != null ? c.getCompletedAt() : OffsetDateTime.now();
                    return java.time.temporal.ChronoUnit.DAYS.between(c.getStartedAt(), end);
                })
                .sum();
    }

    private Integer computeDaysRemaining(ApAuditCaseEntity entity) {
        if (entity.getStartedAt() == null) return null;
        // Default 30-day audit window
        OffsetDateTime dueDate = entity.getStartedAt().plusDays(30);
        long days = java.time.temporal.ChronoUnit.DAYS.between(OffsetDateTime.now(), dueDate);
        return (int) Math.max(0, days);
    }

    private String resolveAltAuditorId(String id) {
        if (id == null || id.isBlank()) return null;
        try {
            if (userJpaRepository != null) {
                try {
                    UUID uId = UUID.fromString(id.trim());
                    Optional<mor.itas.persistence.jpa.entity.ap.UserEntity> opt = userJpaRepository.findById(uId);
                    if (opt.isPresent()) return opt.get().getUsername();
                } catch (IllegalArgumentException ignored) {}

                Optional<mor.itas.persistence.jpa.entity.ap.UserEntity> opt = userJpaRepository.findByUsername(id.trim());
                if (opt.isPresent()) return opt.get().getUserId().toString();
            }
        } catch (Exception ignored) {}
        return null;
    }
}
