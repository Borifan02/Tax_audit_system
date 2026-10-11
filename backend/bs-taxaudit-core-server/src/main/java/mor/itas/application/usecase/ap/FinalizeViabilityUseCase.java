package mor.itas.application.usecase.ap;

import mor.itas.api.dto.request.ap.jac.FinalizeViabilityRequest;
import mor.itas.api.dto.response.ap.jac.CommitteeCaseResponse;
import mor.itas.api.mapper.ap.CommitteeCaseJacMapper;
import mor.itas.domain.service.ap.CommitteeCaseService;
import mor.itas.domain.service.ap.AuditTrailService;
import mor.itas.domain.service.ap.DigitalSignatureService;
import mor.itas.domain.aggregate.CommitteeCaseAggregate;
import mor.itas.persistence.jpa.repository.ap.CommitteeCaseRepository;
import mor.itas.persistence.jpa.repository.ap.ApAuditCaseRepository;
import mor.itas.persistence.jpa.entity.ap.CommitteeCaseEntity;
import mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity;
import mor.itas.observability.audit.ActorContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Use Case: Finalize Viability (Chairperson Only)
 * Chairperson approves or rejects case with digital signature
 */
@Component
@RequiredArgsConstructor
@Transactional
@Slf4j
public class FinalizeViabilityUseCase {
    private final CommitteeCaseService caseService;
    private final AuditTrailService auditTrailService;
    private final DigitalSignatureService digitalSignatureService;
    private final CommitteeCaseRepository caseRepository;
    private final ApAuditCaseRepository apCaseRepository;
    private final CommitteeCaseJacMapper caseMapper;
    private final mor.itas.persistence.jpa.repository.ap.AnnualAuditPlanJpaRepository annualAuditPlanRepository;
    
    /**
     * Overloaded execute method to match controller signature
     */
    public CommitteeCaseResponse execute(UUID caseId, FinalizeViabilityRequest request) {
        UUID chairpersonId;
        try {
            chairpersonId = UUID.fromString(ActorContextHolder.getActorId());
        } catch (Exception e) {
            chairpersonId = UUID.nameUUIDFromBytes("SYSTEM".getBytes());
        }
        
        FinalizeViabilityRequestLegacy useCaseRequest = new FinalizeViabilityRequestLegacy(
            caseId,
            request.getDecision(),
            request.getReason(),
            chairpersonId
        );
        useCaseRequest.setDigitalSignature(request.getDigitalSignature());
        
        this.execute(useCaseRequest);
        
        CommitteeCaseEntity updatedCase = caseRepository.findById(caseId)
            .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseId));
            
        return caseMapper.toResponse(updatedCase);
    }

    /**
     * Execute: Finalize case viability decision
     * 
     * @param request contains caseId, decision, reason, chairpersonId
     */
    public void execute(FinalizeViabilityRequestLegacy request) {
        // Validate input
        if (request == null || request.getCaseId() == null || request.getDecision() == null) {
            throw new IllegalArgumentException("Case ID and decision cannot be null");
        }
        
        // Fetch case
        CommitteeCaseEntity caseEntity = caseRepository.findById(request.getCaseId())
            .orElseThrow(() -> new IllegalArgumentException("Case not found: " + request.getCaseId()));
        
        // Convert to aggregate
        CommitteeCaseAggregate committeeCase = toAggregate(caseEntity);
        
        // Validate preconditions
        caseService.validateCaseForFinalization(committeeCase);
        
        // Create before-state for audit log
        Map<String, Object> beforeState = new HashMap<>();
        beforeState.put("status", committeeCase.getStatus().toString());
        beforeState.put("decision", committeeCase.getDecision());
        
        // Update decision — map frontend values to domain enum
        String decisionStr = request.getDecision().toUpperCase();
        if ("VIABLE".equals(decisionStr) || "CONDITIONALLY_VIABLE".equals(decisionStr)) {
            decisionStr = "APPROVED";
        } else if ("NOT_VIABLE".equals(decisionStr)) {
            decisionStr = "REJECTED";
        }
        CommitteeCaseAggregate.CommitteeCaseDecision decision = 
            CommitteeCaseAggregate.CommitteeCaseDecision.valueOf(decisionStr);
        
        committeeCase.finalizeViability(decision, request.getReason(), request.getChairpersonId());
        
        // Generate digital signature (use mapped decision, not raw request)
        DigitalSignatureService.DigitalSignature digitalSig = null;
        if ("APPROVED".equalsIgnoreCase(decisionStr)) {
            digitalSig = digitalSignatureService.signViabilityDecision(
                    request.getCaseId(),
                    decisionStr,
                    request.getChairpersonId(),
                    request.getReason()
            );
        }
        
        // Create after-state for audit log
        Map<String, Object> afterState = new HashMap<>();
        afterState.put("status", committeeCase.getStatus().toString());
        afterState.put("decision", committeeCase.getDecision().toString());
        afterState.put("decisionReason", request.getReason());
        afterState.put("decisionDate", OffsetDateTime.now());
        afterState.put("chairpersonId", request.getChairpersonId());
        if (digitalSig != null) {
            afterState.put("digitalSignature", digitalSig.getSignature());
            afterState.put("verificationCode", digitalSig.getVerificationCode());
        }
        
        // Log to audit trail
        auditTrailService.logAction(
            request.getCaseId(),
            request.getChairpersonId(),
            "VIABILITY_FINALIZED",
            beforeState,
            afterState
        );
        
        // Persist changes
        caseEntity.setStatus(committeeCase.getStatus().toString());
        caseEntity.setDecision(committeeCase.getDecision().toString());
        caseEntity.setDecisionReason(request.getReason());
        caseEntity.setDecisionDate(OffsetDateTime.now());
        caseEntity.setChairpersonId(request.getChairpersonId());
        caseRepository.save(caseEntity);
        
        // Auto-create AP audit case when approved (makes case available for execution)
        // Use mapped decisionStr, not raw request.getDecision() which may still be VIABLE
        if ("APPROVED".equalsIgnoreCase(decisionStr)) {
            createApAuditCase(caseEntity);
        }
    }
    
    /**
     * Create AP audit case from committee case when approved.
     * This makes the case visible to the Team Leader and Auditor dashboards.
     * 
     * Flow after approval:
     *   1. AP audit case created with PENDING_ASSIGNMENT
     *   2. Team leader sees it and assigns auditor
     *   3. Auditor executes the audit
     */
    private void createApAuditCase(CommitteeCaseEntity committeeCase) {
        // Check if AP audit case already exists for this committee case (by originalCaseId or caseCode)
        if (committeeCase.getOriginalCaseId() != null) {
            java.util.Optional<ApAuditCaseEntity> orig = apCaseRepository.findById(committeeCase.getOriginalCaseId());
            if (orig.isPresent()) {
                ApAuditCaseEntity apCase = orig.get();
                if (committeeCase.getTeamLeadId() != null) {
                    apCase.setAssignedTeamLeaderId(committeeCase.getTeamLeadId().toString());
                }
                apCase.setStatus("WAITING_ASSIGNMENT");
                apCase.setUpdatedAt(OffsetDateTime.now());
                apCaseRepository.save(apCase);
                log.info("Updated existing AP audit case {} upon viability approval (status=WAITING_ASSIGNMENT)",
                         apCase.getCaseNumber());
                return;
            }
        }
        if (committeeCase.getCaseCode() != null) {
            java.util.Optional<ApAuditCaseEntity> byNum = apCaseRepository.findByCaseNumber(committeeCase.getCaseCode());
            if (byNum.isPresent()) {
                ApAuditCaseEntity apCase = byNum.get();
                if (committeeCase.getTeamLeadId() != null) {
                    apCase.setAssignedTeamLeaderId(committeeCase.getTeamLeadId().toString());
                }
                apCase.setStatus("WAITING_ASSIGNMENT");
                apCase.setUpdatedAt(OffsetDateTime.now());
                apCaseRepository.save(apCase);
                log.info("Updated existing AP audit case by code {} upon viability approval (status=WAITING_ASSIGNMENT)",
                         apCase.getCaseNumber());
                return;
            }
            log.info("AP audit case already exists for committee case {}, skipping", committeeCase.getCaseId());
            return;
        }
        
        // Generate case code
        String caseCode = String.format("JAC-%s", committeeCase.getCaseId().toString().substring(0, 8).toUpperCase());
        
        String auditType = mapAuditType(committeeCase.getSegment());
        
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

        // Create AP audit case with PENDING_ASSIGNMENT status
        // This status means: case is ready for team leader to assign auditor
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
            .status("PENDING_ASSIGNMENT")
            .createdBy("committee-viability")
            .createdAt(OffsetDateTime.now())
            .updatedAt(OffsetDateTime.now())
            .build();

        apCaseRepository.save(apCase);
        
        // Update committee case with case code
        committeeCase.setCaseCode(caseCode);
        caseRepository.save(committeeCase);
        
        log.info("Created AP audit case {} from committee case {} (status=PENDING_ASSIGNMENT)",
                 caseCode, committeeCase.getCaseId());
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
            .chairpersonId(entity.getChairpersonId())
            .teamLeadId(entity.getTeamLeadId())
            .build();
    }
    
    @Data
    public static class FinalizeViabilityRequestLegacy {
        private UUID caseId;
        private String decision;  // "APPROVED" or "REJECTED"
        private String reason;
        private UUID chairpersonId;
        private String digitalSignature;
        
        public FinalizeViabilityRequestLegacy() {}
        
        public FinalizeViabilityRequestLegacy(UUID caseId, String decision, String reason, UUID chairpersonId) {
            this.caseId = caseId;
            this.decision = decision;
            this.reason = reason;
            this.chairpersonId = chairpersonId;
        }
    }
}
