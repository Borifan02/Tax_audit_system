package mor.itas.domain.service.ap;

import mor.itas.domain.model.ap.AnnualAuditPlan;
import mor.itas.domain.model.ap.AuditCase;
import mor.itas.domain.model.ap.PlanAllocation;
import mor.itas.application.port.outboundport.repositoryport.ap.AnnualAuditPlanRepository;
import mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity;
import mor.itas.persistence.jpa.entity.ap.CommitteeCaseEntity;
import mor.itas.persistence.jpa.entity.ap.UserEntity;
import mor.itas.persistence.jpa.repository.ap.ApAuditCaseRepository;
import mor.itas.persistence.jpa.repository.ap.CommitteeCaseRepository;
import mor.itas.persistence.jpa.repository.ap.UserJpaRepository;
import mor.itas.persistence.mapper.ap.AuditCaseMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * CaseGenerationService - Generates audit cases from finalized plans
 * Extracted from frontend's generateCases() logic
 */
@Service
@RequiredArgsConstructor
@Transactional
public class CaseGenerationService {

    private final ApAuditCaseRepository caseRepository;
    private final CommitteeCaseRepository committeeCaseRepository;
    private final AnnualAuditPlanRepository planRepository;
    private final AuditCaseMapper caseMapper;
    private final UserJpaRepository userRepository;
    private final JointCaseRoutingBridgeService jointCaseRoutingBridge;

    /**
     * Generate audit cases from a finalized plan
     * Creates one case per quota in the plan's allocations
     */
    public List<AuditCase> generateCasesForPlan(UUID planId, String actorId) {
        // Verify plan exists and is finalized
        AnnualAuditPlan plan = planRepository.findById(planId)
            .orElseThrow(() -> new IllegalArgumentException("Plan not found: " + planId));

        if (plan.getStatus() != mor.itas.domain.model.ap.PlanStatus.FINALIZED) {
            throw new IllegalStateException("Can only generate cases from FINALIZED plans. Current: " + plan.getStatus());
        }

        List<AuditCase> generatedCases = new ArrayList<>();
        List<PlanAllocation> allocations = plan.getAllocations();
        
        // Mock audit types (extracted from frontend)
        String[] auditTypes = {"DESK", "FIELD", "JOINT", "TPRICE", "COMP", "ISSUE"};

        // For each allocation, create cases equal to the approved quota
        for (PlanAllocation allocation : allocations) {
            // Determine count: use tcAdjustedCount if submitted, else use proposedCount
            int caseCount = allocation.getTcAdjustedCount() != null 
                ? allocation.getTcAdjustedCount() 
                : allocation.getProposedCount();

            String taxCenter = allocation.getTaxCenterCode();

            // Create individual cases
            for (int i = 0; i < caseCount; i++) {
                // Generate mock taxpayer data (phase 1 - will call real service in phase 2)
                String mockTin = String.format("TIN-%s-%05d", taxCenter, i + 1);
                String auditType = auditTypes[i % auditTypes.length];
                int riskScore = 30 + (i % 70);  // Random risk score between 30-100

                // Create case entity
                ApAuditCaseEntity caseEntity = new ApAuditCaseEntity();
                caseEntity.setPlanId(planId);
                caseEntity.setAllocationId(allocation.getId());
                caseEntity.setCaseNumber(generateCaseNumber(planId, taxCenter, i));
                caseEntity.setTaxpayerId(mockTin);
                caseEntity.setTaxCenterCode(taxCenter);
                caseEntity.setTaxpayerName("Taxpayer " + (taxCenter.contains("fed") ? "Federal Corp " : "Addis Enterprise ") + (i + 1));
                caseEntity.setSegment(i % 3 == 0 ? "LARGE" : (i % 3 == 1 ? "MEDIUM" : "SMALL"));
                caseEntity.setRiskPriority(riskScore >= 70 ? "HIGH" : (riskScore >= 50 ? "MEDIUM" : "LOW"));
                caseEntity.setAuditType(auditType);
                caseEntity.setRiskScore(riskScore);
                caseEntity.setStatus("PENDING_ASSIGNMENT");
                caseEntity.setCreatedBy(actorId);

                // Save and convert to domain model
                ApAuditCaseEntity saved = caseRepository.save(caseEntity);
                
                // If this is a Joint Audit case, bridge it into Josi's Committee Case system
                if (jointCaseRoutingBridge.isJointAudit(auditType)) {
                    jointCaseRoutingBridge.routeApCaseToCommittee(saved, taxCenter);
                }
                
                generatedCases.add(caseMapper.toDomain(saved));
            }
        }

        return generatedCases;
    }

    /**
     * Get all cases for a plan
     */
    public List<AuditCase> getCasesForPlan(UUID planId) {
        return caseRepository.findByPlanId(planId).stream()
            .map(caseMapper::toDomain)
            .toList();
    }

    /**
     * Get cases by status
     */
    public List<AuditCase> getCasesByStatus(String status) {
        return caseRepository.findByStatus(status).stream()
            .map(caseMapper::toDomain)
            .toList();
    }

    /**
     * Get cases assigned to auditor.
     * Handles both UUID IDs and frontend-format IDs (e.g. 'u-aud-aa1a')
     * by resolving usernames to UUIDs when needed.
     */
    public List<AuditCase> getCasesForAuditor(String auditorId) {
        // 1. Try direct match by ID
        List<ApAuditCaseEntity> cases = caseRepository.findByAssignedAuditorId(auditorId);
        if (!cases.isEmpty()) {
            return cases.stream().map(caseMapper::toDomain).toList();
        }
        // 2. Try resolving username → UUID
        UserEntity user = userRepository.findByUsername(auditorId).orElse(null);
        if (user == null) user = userRepository.findByEmail(auditorId).orElse(null);
        if (user != null) {
            cases = caseRepository.findByAssignedAuditorId(user.getUserId().toString());
            if (!cases.isEmpty()) {
                return cases.stream().map(caseMapper::toDomain).toList();
            }
        }
        // 3. Also try matching by UUID toString for any user with this name
        if (user == null) {
            // Try finding user by searching all users with matching full name parts
            String searchTerm = auditorId.replace("u-aud-", "").replace("u-tl-", "");
            user = userRepository.findByUsername(searchTerm).orElse(null);
            if (user != null) {
                cases = caseRepository.findByAssignedAuditorId(user.getUserId().toString());
            }
        }
        return (cases != null ? cases : List.<ApAuditCaseEntity>of()).stream()
            .map(caseMapper::toDomain).toList();
    }

    /**
     * Get cases visible to team leader:
     * 1. Cases already assigned to this team leader in execution workspace (ApAuditCase)
     * 2. TEAM_ASSIGNED committee cases assigned to this team leader (before execution transfer)
     */
    public List<AuditCase> getCasesForTeamLeader(String teamLeaderId) {
        // Get cases already in execution workspace
        List<AuditCase> executionCases = caseRepository.findAllForTeamLeader(teamLeaderId).stream()
            .map(caseMapper::toDomain)
            .toList();

        // Get TEAM_ASSIGNED committee cases for this team leader
        List<AuditCase> committeeCases = new ArrayList<>();
        try {
            UUID teamLeadUuid = UUID.fromString(teamLeaderId);
            List<CommitteeCaseEntity> teamCases = committeeCaseRepository.findTeamAssignedByTeamLeadId(teamLeadUuid);
            for (CommitteeCaseEntity cc : teamCases) {
                committeeCases.add(fromCommitteeCase(cc, teamLeaderId));
            }
        } catch (Exception e) {
            // If UUID parsing fails, try all team assigned cases
            List<CommitteeCaseEntity> allTeamCases = committeeCaseRepository.findAllTeamAssigned();
            for (CommitteeCaseEntity cc : allTeamCases) {
                if (cc.getTeamLeadId() != null && cc.getTeamLeadId().toString().equals(teamLeaderId)) {
                    committeeCases.add(fromCommitteeCase(cc, teamLeaderId));
                }
            }
        }

        // Merge both sources, avoiding duplicates (execution cases take priority)
        List<AuditCase> merged = new ArrayList<>(executionCases);
        for (AuditCase cc : committeeCases) {
            boolean alreadyInExecution = executionCases.stream()
                .anyMatch(ec -> ec.getId() != null && ec.getId().equals(cc.getId()));
            if (!alreadyInExecution) {
                merged.add(cc);
            }
        }
        return merged;
    }

    /**
     * Get single case by ID
     */
    public AuditCase getCaseById(UUID caseId) {
        return caseRepository.findById(caseId)
            .map(caseMapper::toDomain)
            .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseId));
    }

    /**
     * Assign case to team leader
     */
    public AuditCase assignCaseToTeamLeader(UUID caseId, String teamLeaderId) {
        ApAuditCaseEntity caseEntity = caseRepository.findById(caseId)
            .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseId));

        if (!caseEntity.getStatus().equals("PENDING_ASSIGNMENT")) {
            throw new IllegalStateException("Can only assign cases in PENDING_ASSIGNMENT status. Current: " + caseEntity.getStatus());
        }

        caseEntity.setAssignedTeamLeaderId(teamLeaderId);
        caseEntity.setStatus("ASSIGNED");
        ApAuditCaseEntity saved = caseRepository.save(caseEntity);

        return caseMapper.toDomain(saved);
    }

    /**
     * Assign case to auditor
     * Accepts PENDING_ASSIGNMENT or ASSIGNED status
     */
    public AuditCase assignCaseToAuditor(UUID caseId, String auditorId) {
        ApAuditCaseEntity caseEntity = caseRepository.findById(caseId)
            .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseId));

        // Accept PENDING_ASSIGNMENT (from committee) or ASSIGNED (from team leader)
        if (!"PENDING_ASSIGNMENT".equals(caseEntity.getStatus()) && !"ASSIGNED".equals(caseEntity.getStatus())) {
            throw new IllegalStateException("Case must be in PENDING_ASSIGNMENT or ASSIGNED status. Current: " + caseEntity.getStatus());
        }

        caseEntity.setAssignedAuditorId(auditorId);
        caseEntity.setStatus("IN_PROGRESS");
        caseEntity.setStartedAt(java.time.OffsetDateTime.now());
        ApAuditCaseEntity saved = caseRepository.save(caseEntity);

        return caseMapper.toDomain(saved);
    }

    /**
     * Update case status
     */
    public AuditCase updateCaseStatus(UUID caseId, String newStatus) {
        ApAuditCaseEntity caseEntity = caseRepository.findById(caseId)
            .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseId));

        if (newStatus.equals("COMPLETED")) {
            caseEntity.setCompletedAt(java.time.OffsetDateTime.now());
        }

        caseEntity.setStatus(newStatus);
        caseEntity.setUpdatedAt(java.time.OffsetDateTime.now());
        ApAuditCaseEntity saved = caseRepository.save(caseEntity);

        return caseMapper.toDomain(saved);
    }

    /**
     * Generate unique case number
     * Format: CASE-{planIdPrefix}-{taxCenter}-{sequentialNumber}
     */
    private String generateCaseNumber(UUID planId, String taxCenter, int index) {
        String planPrefix = planId.toString().substring(0, 8).toUpperCase();
        return String.format("CASE-%s-%s-%04d", planPrefix, taxCenter, index + 1);
    }

    /**
     * Convert a CommitteeCaseEntity to AuditCase domain model for team leader view.
     */
    private AuditCase fromCommitteeCase(CommitteeCaseEntity cc, String teamLeaderId) {
        AuditCase auditCase = new AuditCase();
        auditCase.setId(cc.getCaseId());
        auditCase.setCommitteeCaseId(cc.getCaseId());
        auditCase.setTaxpayerName(cc.getTaxpayerName());
        auditCase.setTaxIdNumber(cc.getTaxIdNumber());
        auditCase.setAuditType(cc.getSegment() != null ? cc.getSegment().toUpperCase() : "DESK");
        auditCase.setRiskPriority(cc.getRiskPriority());
        auditCase.setRiskScore(cc.getRiskScore());
        auditCase.setSegment(cc.getSegment());
        auditCase.setStatus(cc.getStatus());
        auditCase.setAssignedTeamLeaderId(teamLeaderId);
        auditCase.setCaseNumber(cc.getCaseCode());
        auditCase.setCreatedAt(cc.getCreatedDate());
        return auditCase;
    }
}
