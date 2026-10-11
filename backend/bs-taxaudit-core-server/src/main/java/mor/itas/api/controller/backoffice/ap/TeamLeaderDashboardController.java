package mor.itas.api.controller.backoffice.ap;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import mor.itas.api.dto.response.ap.GenericResponse;
import mor.itas.api.dto.response.ap.TeamLeaderPlanReviewDto;
import mor.itas.domain.service.ap.AuditWorkflowService;
import mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity;
import mor.itas.persistence.jpa.entity.ap.AuditPlanRecordEntity;
import mor.itas.persistence.jpa.repository.ap.ApAuditCaseRepository;
import mor.itas.persistence.jpa.repository.ap.AuditPlanRecordRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * TeamLeaderDashboardController - REST endpoints for Team Leader operations
 * 
 * Provides:
 * - Dashboard with pending plan metrics
 * - List of pending plans for review
 * - Plan approval, rejection, and revision request operations
 * 
 * All endpoints require teamLeaderId parameter for authorization.
 */
@RestController
@RequestMapping("/api/v1/backoffice/ap/team-leader")
@RequiredArgsConstructor
@Slf4j
public class TeamLeaderDashboardController {
    
    private final AuditPlanRecordRepository planRepository;
    private final ApAuditCaseRepository caseRepository;
    private final AuditWorkflowService workflowService;
    
    // ═════════════════════════════════════════════════════════════════════
    // DASHBOARD ENDPOINTS
    // ═════════════════════════════════════════════════════════════════════
    
    /**
     * Get team leader dashboard with pending plans for review and metrics.
     * 
     * GET /api/v1/backoffice/ap/team-leader/dashboard?teamLeaderId={id}
     * 
     * Response includes:
     * - totalCasesAssigned: Count of cases assigned to this team leader
     * - plansAwaitingReview: Count of pending plans
     * - plansApproved: Count of approved plans
     * - plansRejected: Count of rejected plans
     * - pendingPlans: List of pending plans with full context
     */
    @GetMapping("/dashboard")
    public ResponseEntity<GenericResponse<Map<String, Object>>> getTeamLeaderDashboard(
            @RequestParam String teamLeaderId) {
        
        log.info("Fetching team leader dashboard for: {}", teamLeaderId);
        
        try {
            Set<String> aliases = workflowService.resolveTeamLeaderAliases(teamLeaderId);
            if (aliases.isEmpty()) aliases = Set.of(teamLeaderId);

            // Fetch pending plans for review across all aliases (deduplicated)
            Map<UUID, AuditPlanRecordEntity> pendingMap = new LinkedHashMap<>();
            Map<UUID, ApAuditCaseEntity> casesMap = new LinkedHashMap<>();
            Set<UUID> approvedIds = new HashSet<>();
            Set<UUID> rejectedIds = new HashSet<>();

            for (String alias : aliases) {
                for (AuditPlanRecordEntity p : planRepository.findPendingPlansForTeamLeader(alias)) {
                    pendingMap.putIfAbsent(p.getId(), p);
                }
                for (ApAuditCaseEntity c : caseRepository.findByAssignedTeamLeaderId(alias)) {
                    casesMap.putIfAbsent(c.getId(), c);
                }
                for (AuditPlanRecordEntity p : planRepository.findByTeamLeadIdAndStatusOrderByCreatedAtDesc(alias, "APPROVED")) {
                    approvedIds.add(p.getId());
                }
                for (AuditPlanRecordEntity p : planRepository.findByTeamLeadIdAndStatusOrderByCreatedAtDesc(alias, "REJECTED")) {
                    rejectedIds.add(p.getId());
                }
            }

            List<AuditPlanRecordEntity> pendingPlans = new ArrayList<>(pendingMap.values());
            List<ApAuditCaseEntity> assignedCases = new ArrayList<>(casesMap.values());
            long approvedCount = approvedIds.size();
            long rejectedCount = rejectedIds.size();
            
            // Map plans to DTOs with enriched case data
            List<TeamLeaderPlanReviewDto> planDtos = pendingPlans.stream()
                .map(this::enrichPlanWithCaseData)
                .collect(Collectors.toList());
            
            // Build response
            Map<String, Object> dashboard = new HashMap<>();
            dashboard.put("totalCasesAssigned", assignedCases.size());
            dashboard.put("plansAwaitingReview", pendingPlans.size());
            dashboard.put("plansApproved", approvedCount);
            dashboard.put("plansRejected", rejectedCount);
            dashboard.put("pendingPlans", planDtos);
            
            log.info("Dashboard retrieved for team leader {} (aliases={}) with {} pending plans", 
                teamLeaderId, aliases.size(), pendingPlans.size());
            
            return ResponseEntity.ok(GenericResponse.success(dashboard));
            
        } catch (Exception e) {
            log.error("Error fetching dashboard for team leader {}", teamLeaderId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(GenericResponse.error("DASHBOARD_ERROR", "Error fetching dashboard: " + e.getMessage()));
        }
    }
    
    /**
     * Get all pending plans for team leader (paginated).
     * 
     * GET /api/v1/backoffice/ap/team-leader/plans?teamLeaderId={id}&page=0&size=10
     */
    @GetMapping("/plans")
    public ResponseEntity<GenericResponse<Page<TeamLeaderPlanReviewDto>>> getPendingPlans(
            @RequestParam String teamLeaderId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        
        log.info("Fetching pending plans for team leader: {} (page={}, size={})", 
            teamLeaderId, page, size);
        
        try {
            Pageable pageable = PageRequest.of(page, size);
            Set<String> aliases = workflowService.resolveTeamLeaderAliases(teamLeaderId);
            if (aliases.isEmpty()) aliases = Set.of(teamLeaderId);

            Map<UUID, AuditPlanRecordEntity> pendingMap = new LinkedHashMap<>();
            for (String alias : aliases) {
                for (AuditPlanRecordEntity p : planRepository.findPendingPlansForTeamLeader(alias)) {
                    pendingMap.putIfAbsent(p.getId(), p);
                }
            }
            List<AuditPlanRecordEntity> allPlans = new ArrayList<>(pendingMap.values());
            
            List<TeamLeaderPlanReviewDto> dtos = allPlans.stream()
                .map(this::enrichPlanWithCaseData)
                .skip((long) page * size)
                .limit(size)
                .collect(Collectors.toList());
            
            Page<TeamLeaderPlanReviewDto> result = new PageImpl<>(dtos, pageable, allPlans.size());
            
            log.info("Retrieved {} pending plans for team leader {}", dtos.size(), teamLeaderId);
            
            return ResponseEntity.ok(GenericResponse.success(result));
            
        } catch (Exception e) {
            log.error("Error fetching pending plans for team leader {}", teamLeaderId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(GenericResponse.error("PLANS_ERROR", "Error fetching plans: " + e.getMessage()));
        }
    }
    
    // ═════════════════════════════════════════════════════════════════════
    // PLAN REVIEW ENDPOINTS
    // ═════════════════════════════════════════════════════════════════════
    
    /**
     * Approve a submitted plan.
     */
    @PostMapping("/plans/{planId}/approve")
    public ResponseEntity<GenericResponse<TeamLeaderPlanReviewDto>> approvePlan(
            @PathVariable UUID planId,
            @RequestParam String teamLeaderId,
            @RequestBody(required = false) Map<String, String> reviewData) {
        
        log.info("Approving plan {} by team leader {}", planId, teamLeaderId);
        
        try {
            AuditPlanRecordEntity plan = planRepository.findById(planId)
                .orElseThrow(() -> new IllegalArgumentException("Plan not found: " + planId));
            
            // Verify team lead owns this plan (supporting all aliases)
            if (plan.getTeamLeadId() != null && !workflowService.isSameTeamLeaderPublic(teamLeaderId, plan.getTeamLeadId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(GenericResponse.error("FORBIDDEN", "Not authorized to review this plan"));
            }
            
            // Update plan status
            plan.setStatus("APPROVED");
            plan.setReviewedBy(teamLeaderId);
            plan.setReviewTimestamp(OffsetDateTime.now());
            plan.setReviewComments(reviewData != null ? reviewData.get("comments") : "Plan approved");
            
            AuditPlanRecordEntity saved = planRepository.save(plan);
            
            TeamLeaderPlanReviewDto dto = enrichPlanWithCaseData(saved);
            
            log.info("Plan {} approved by team leader {}", planId, teamLeaderId);
            
            return ResponseEntity.ok(GenericResponse.success(dto));
            
        } catch (IllegalArgumentException e) {
            log.warn("Plan not found: {}", planId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(GenericResponse.error("PLAN_NOT_FOUND", e.getMessage()));
        } catch (Exception e) {
            log.error("Error approving plan {}", planId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(GenericResponse.error("PLAN_APPROVAL_ERROR", "Error approving plan: " + e.getMessage()));
        }
    }
    
    /**
     * Reject a submitted plan.
     */
    @PostMapping("/plans/{planId}/reject")
    public ResponseEntity<GenericResponse<TeamLeaderPlanReviewDto>> rejectPlan(
            @PathVariable UUID planId,
            @RequestParam String teamLeaderId,
            @RequestBody Map<String, String> reviewData) {
        
        log.info("Rejecting plan {} by team leader {}", planId, teamLeaderId);
        
        try {
            String rejectionReason = reviewData.getOrDefault("reason", "Plan rejected");
            
            AuditPlanRecordEntity plan = planRepository.findById(planId)
                .orElseThrow(() -> new IllegalArgumentException("Plan not found: " + planId));
            
            // Verify team lead owns this plan (supporting all aliases)
            if (plan.getTeamLeadId() != null && !workflowService.isSameTeamLeaderPublic(teamLeaderId, plan.getTeamLeadId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(GenericResponse.error("FORBIDDEN", "Not authorized to review this plan"));
            }
            
            // Update plan status
            plan.setStatus("REJECTED");
            plan.setReviewedBy(teamLeaderId);
            plan.setReviewTimestamp(OffsetDateTime.now());
            plan.setReviewComments(rejectionReason);
            
            AuditPlanRecordEntity saved = planRepository.save(plan);
            
            TeamLeaderPlanReviewDto dto = enrichPlanWithCaseData(saved);
            
            log.info("Plan {} rejected by team leader {} with reason: {}", 
                planId, teamLeaderId, rejectionReason);
            
            return ResponseEntity.ok(GenericResponse.success(dto));
            
        } catch (IllegalArgumentException e) {
            log.warn("Plan not found: {}", planId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(GenericResponse.error("PLAN_NOT_FOUND", e.getMessage()));
        } catch (Exception e) {
            log.error("Error rejecting plan {}", planId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(GenericResponse.error("PLAN_REJECTION_ERROR", "Error rejecting plan: " + e.getMessage()));
        }
    }
    
    /**
     * Request plan revision.
     */
    @PostMapping("/plans/{planId}/request-revision")
    public ResponseEntity<GenericResponse<TeamLeaderPlanReviewDto>> requestRevision(
            @PathVariable UUID planId,
            @RequestParam String teamLeaderId,
            @RequestBody Map<String, String> reviewData) {
        
        log.info("Requesting revision for plan {} by team leader {}", planId, teamLeaderId);
        
        try {
            String revisionComments = reviewData.getOrDefault("comments", 
                "Please revise the plan and resubmit");
            
            AuditPlanRecordEntity plan = planRepository.findById(planId)
                .orElseThrow(() -> new IllegalArgumentException("Plan not found: " + planId));
            
            // Verify team lead owns this plan (supporting all aliases)
            if (plan.getTeamLeadId() != null && !workflowService.isSameTeamLeaderPublic(teamLeaderId, plan.getTeamLeadId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(GenericResponse.error("FORBIDDEN", "Not authorized to review this plan"));
            }
            
            // Update plan status
            plan.setStatus("REVISION_REQUESTED");
            plan.setReviewedBy(teamLeaderId);
            plan.setReviewTimestamp(OffsetDateTime.now());
            plan.setReviewComments(revisionComments);
            
            AuditPlanRecordEntity saved = planRepository.save(plan);
            
            TeamLeaderPlanReviewDto dto = enrichPlanWithCaseData(saved);
            
            log.info("Revision requested for plan {} by team leader {} with comments: {}", 
                planId, teamLeaderId, revisionComments);
            
            return ResponseEntity.ok(GenericResponse.success(dto));
            
        } catch (IllegalArgumentException e) {
            log.warn("Plan not found: {}", planId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(GenericResponse.error("PLAN_NOT_FOUND", e.getMessage()));
        } catch (Exception e) {
            log.error("Error requesting revision for plan {}", planId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(GenericResponse.error("REVISION_ERROR", "Error requesting revision: " + e.getMessage()));
        }
    }
    
    // ═════════════════════════════════════════════════════════════════════
    // HELPER METHODS
    // ═════════════════════════════════════════════════════════════════════
    
    /**
     * Enrich audit plan with related case data for rich context.
     * Fetches taxpayer info, risk data, and calculates days waiting.
     */
    private TeamLeaderPlanReviewDto enrichPlanWithCaseData(AuditPlanRecordEntity plan) {
        ApAuditCaseEntity auditCase = caseRepository.findById(plan.getCaseId())
            .orElse(null);
        
        // Calculate days since submission
        long daysWaiting = 0;
        if (plan.getCreatedAt() != null) {
            daysWaiting = ChronoUnit.DAYS.between(plan.getCreatedAt(), OffsetDateTime.now());
        }
        
        return TeamLeaderPlanReviewDto.builder()
            .planId(plan.getId())
            .caseId(plan.getCaseId())
            .caseCode(auditCase != null ? auditCase.getCaseNumber() : "N/A")
            .auditorId(plan.getSubmittedBy())
            .auditorName("Auditor " + plan.getSubmittedBy()) // TODO: Fetch from user service
            .taxpayerId(auditCase != null ? auditCase.getTaxpayerId() : null)
            .taxpayerName(auditCase != null ? auditCase.getTaxpayerName() : "Unknown")
            .taxIdentificationNumber(auditCase != null ? auditCase.getTaxpayerId() : null) // Using taxpayerId as TIN
            .segment(auditCase != null ? auditCase.getSegment() : null)
            .scope(plan.getScope())
            .objectives(plan.getObjectives())
            .methodology(plan.getMethodology())
            .timeline(plan.getTimeline())
            .resourcePlan(plan.getResourcePlan())
            .status(plan.getStatus())
            .submittedAt(plan.getCreatedAt())
            .daysWaiting((int) daysWaiting)
            .reviewedBy(plan.getReviewedBy())
            .reviewTimestamp(plan.getReviewTimestamp())
            .reviewComments(plan.getReviewComments())
            .riskPriority(auditCase != null ? auditCase.getRiskPriority() : null)
            .riskScore(auditCase != null ? auditCase.getRiskScore() : null)
            .build();
    }
}
