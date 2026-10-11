package mor.itas.application.usecase.ap;

import mor.itas.observability.audit.ActorContextHolder;
import mor.itas.api.dto.request.ap.jac.TransferToExecutionRequest;
import mor.itas.api.dto.response.ap.jac.HandoffRecordResponse;
import mor.itas.domain.service.ap.HandoffService;
import mor.itas.domain.aggregate.CommitteeCaseAggregate;
import mor.itas.domain.valueobject.HandoffRecord;
import mor.itas.persistence.jpa.repository.ap.CommitteeCaseRepository;
import mor.itas.persistence.jpa.repository.ap.ApAuditCaseRepository;
import mor.itas.persistence.jpa.entity.ap.CommitteeCaseEntity;
import mor.itas.persistence.jpa.entity.ap.HandoffRecordEntity;
import mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity;
import mor.itas.persistence.jpa.repository.ap.HandoffRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;
import java.time.OffsetDateTime;

/**
 * Use Case: Transfer Case to Execution Workspace (Chairperson Only)
 * Initiates handoff of approved case to execution workspace
 */
@Component
@RequiredArgsConstructor
@Transactional
@Slf4j
public class TransferToExecutionUseCase {
    private final HandoffService handoffService;
    private final CommitteeCaseRepository caseRepository;
    private final HandoffRecordRepository handoffRecordRepository;
    private final ApAuditCaseRepository apCaseRepository;
    private final mor.itas.persistence.jpa.repository.ap.AnnualAuditPlanJpaRepository annualAuditPlanRepository;
    
    /**
     * Overloaded execute method to match controller signature
     */
    public HandoffRecordResponse execute(UUID caseId, TransferToExecutionRequest request) {
        CommitteeCaseEntity caseEntity = caseRepository.findById(caseId)
            .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseId));
        
        UUID chairpersonId = caseEntity.getChairpersonId() != null ? 
            caseEntity.getChairpersonId() : 
            (ActorContextHolder.getActorId() != null && !ActorContextHolder.getActorId().equals("SYSTEM") ? 
                UUID.fromString(ActorContextHolder.getActorId()) : UUID.randomUUID());
        
        // Use the appointed team lead ID, not the current owner (which may be the chairperson)
        UUID teamLeadId = caseEntity.getTeamLeadId();
        
        TransferToExecutionRequestLegacy legacyRequest = new TransferToExecutionRequestLegacy(
            caseId, chairpersonId, teamLeadId, request.getSummary(), request.getKeyFindings());
            
        this.execute(legacyRequest);
        
        return HandoffRecordResponse.builder()
            .handoffRecordId(UUID.randomUUID())
            .committeeCaseId(caseId)
            .caseCode(caseEntity.getCaseCode())
            .teamLeadId(teamLeadId)
            .committeeSummary(request.getSummary())
            .keyFindings(request.getKeyFindings())
            .decision(caseEntity.getDecision())
            .handoffDate(OffsetDateTime.now())
            .deliveryStatus("DELIVERED")
            .build();
    }

    /**
     * Execute: Transfer case to execution workspace
     * 
     * @param request contains caseId, chairpersonId, committeeSummary, keyFindings
     */
    public void execute(TransferToExecutionRequestLegacy request) {
        // Validate input
        if (request == null || request.getCaseId() == null || request.getChairpersonId() == null) {
            throw new IllegalArgumentException("Case ID and chairperson ID cannot be null");
        }
        
        // Fetch case
        CommitteeCaseEntity caseEntity = caseRepository.findById(request.getCaseId())
            .orElseThrow(() -> new IllegalArgumentException("Case not found: " + request.getCaseId()));
        
        // Validate case is in TEAM_ASSIGNED or APPROVED state (ready for execution)
        String status = caseEntity.getStatus();
        if (!"TEAM_ASSIGNED".equals(status) && !"APPROVED".equals(status)) {
            throw new IllegalStateException(
                "Only TEAM_ASSIGNED or APPROVED cases can be transferred to execution. Current: " + status);
        }
        
        // Generate case code if not already set
        String caseCode = caseEntity.getCaseCode();
        if (caseCode == null) {
            CommitteeCaseAggregate aggregate = toAggregate(caseEntity);
            caseCode = handoffService.generateCaseCode(aggregate);
        }
        
        // Create handoff record
        HandoffRecordEntity handoffRecord = HandoffRecordEntity.builder()
            .handoffId(UUID.randomUUID())
            .committeeCaseEntity(caseEntity)
            .caseCode(caseCode)
            .teamLeadId(request.getTeamLeadId())
            .committeeSummary(request.getCommitteeSummary())
            .keyFindings(request.getKeyFindings())
            .decision(caseEntity.getDecision())
            .handoffDate(OffsetDateTime.now())
            .createdBy(request.getChairpersonId())
            .build();
        
        handoffRecordRepository.save(handoffRecord);
        
        // Generate case code if not already set
        caseEntity.setCaseCode(caseCode);
        caseEntity.setHandoffRecordId(handoffRecord.getHandoffId());
        caseEntity.setHandoffDate(OffsetDateTime.now());
        caseEntity.setStatus("TRANSFERRED_TO_EXECUTION");
        caseRepository.save(caseEntity);

        // Create AP audit case from committee case data
        createApAuditCase(caseEntity, caseCode, request.getTeamLeadId());
    }

    /**
     * Create an AP audit case from a committee case when transferred to execution.
     * This makes the case visible to the Team Leader and Auditor dashboards.
     */
    private void createApAuditCase(CommitteeCaseEntity committeeCase, String caseCode, UUID teamLeadId) {
        // Convert teamLeadId to string for assignedTeamLeaderId
        String teamLeaderIdStr = teamLeadId != null ? teamLeadId.toString() : null;
        // Also check if committee case has a team lead ID string format
        if (teamLeaderIdStr == null && committeeCase.getTeamLeadId() != null) {
            teamLeaderIdStr = committeeCase.getTeamLeadId().toString();
        }
        
        // Check if an AP case already exists (either by originalCaseId or by caseNumber)
        java.util.Optional<ApAuditCaseEntity> existing = java.util.Optional.empty();
        if (committeeCase.getOriginalCaseId() != null) {
            existing = apCaseRepository.findById(committeeCase.getOriginalCaseId());
        }
        if (existing.isEmpty() && caseCode != null) {
            existing = apCaseRepository.findByCaseNumber(caseCode);
        }

        if (existing.isPresent()) {
            ApAuditCaseEntity apCase = existing.get();
            apCase.setAssignedTeamLeaderId(teamLeaderIdStr);
            apCase.setStatus("ASSIGNED");
            apCase.setAuditType("JOINT");
            apCase.setUpdatedAt(OffsetDateTime.now());
            apCaseRepository.save(apCase);
            log.info("Updated existing AP audit case {} from committee case {} (status=ASSIGNED, teamLeader={})",
                     caseCode, committeeCase.getCaseId(), teamLeaderIdStr);
        } else {
            UUID planId = null;
            if (committeeCase.getOriginalCaseId() != null) {
                java.util.Optional<ApAuditCaseEntity> orig = apCaseRepository.findById(committeeCase.getOriginalCaseId());
                if (orig.isPresent()) {
                    planId = orig.get().getPlanId();
                }
            }
            if (planId == null) {
                planId = annualAuditPlanRepository.findAll().stream()
                    .map(mor.itas.persistence.jpa.entity.ap.AnnualAuditPlanEntity::getId)
                    .findFirst()
                    .orElse(null);
            }

            ApAuditCaseEntity apCase = ApAuditCaseEntity.builder()
                .planId(planId)
                .caseNumber(caseCode)
                .taxpayerId(committeeCase.getTaxIdNumber())
                .taxpayerName(committeeCase.getTaxpayerName())
                .taxCenterCode(committeeCase.getTaxCenter())
                .auditType("JOINT_AUDIT")
                .riskPriority(committeeCase.getRiskPriority())
                .riskScore(committeeCase.getRiskScore())
                .segment(committeeCase.getSegment())
                .assignedTeamLeaderId(teamLeaderIdStr)
                .status("ASSIGNED")
                .createdBy("committee-transfer")
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build();

            apCaseRepository.save(apCase);
            log.info("Created AP audit case {} from committee case {} (status=ASSIGNED, teamLeader={})",
                     caseCode, committeeCase.getCaseId(), teamLeaderIdStr);
        }
    }

    /**
     * Map committee segment to an audit type
     */
    private String mapAuditType(String segment) {
        if (segment == null) return "DESK";
        return switch (segment.toUpperCase()) {
            case "LARGE", "TRADING" -> "COMP";
            case "MEDIUM" -> "FIELD";
            case "SMALL" -> "DESK";
            default -> "DESK";
        };
    }

    /**
     * Convert JPA entity to domain aggregate
     */
    private CommitteeCaseAggregate toAggregate(CommitteeCaseEntity entity) {
        return CommitteeCaseAggregate.builder()
            .caseId(entity.getCaseId())
            .originalCaseId(entity.getOriginalCaseId())
            .status(CommitteeCaseAggregate.CommitteeCaseStatus.valueOf(entity.getStatus()))
            .decision(entity.getDecision() != null ? 
                CommitteeCaseAggregate.CommitteeCaseDecision.valueOf(entity.getDecision()) : null)
            .build();
    }
    
    @Data
    public static class TransferToExecutionRequestLegacy {
        private UUID caseId;
        private UUID chairpersonId;
        private UUID teamLeadId;
        private String committeeSummary;
        private String keyFindings;
        
        public TransferToExecutionRequestLegacy() {}
        
        public TransferToExecutionRequestLegacy(UUID caseId, UUID chairpersonId, UUID teamLeadId,
                                          String committeeSummary, String keyFindings) {
            this.caseId = caseId;
            this.chairpersonId = chairpersonId;
            this.teamLeadId = teamLeadId;
            this.committeeSummary = committeeSummary;
            this.keyFindings = keyFindings;
        }
    }
}
