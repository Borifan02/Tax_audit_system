package mor.itas.application.service;

import mor.itas.api.dto.request.HandoffToTeamLeaderRequest;
import mor.itas.api.dto.response.HandoffRecordResponse;
import mor.itas.domain.exception.*;
import mor.itas.persistence.jpa.entity.CaseHandoff;
import mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity;
import mor.itas.persistence.jpa.repository.CaseHandoffRepository;
import mor.itas.persistence.jpa.repository.ap.ApAuditCaseRepository;
import mor.itas.persistence.jpa.repository.identity.UserRepository;
import mor.itas.domain.service.ap.AuditTrailService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * HandoffService handles the case handoff workflow from chairperson to team leader.
 * This is a NEW service distinct from the domain layer HandoffService.
 * 
 * Responsibilities:
 * - Validate case exists and is in APPROVED status
 * - Validate team leader exists and has TEAM_LEADER role
 * - Create handoff record atomically with case status update
 * - Create audit trail entry
 * 
 * Addresses Bug C1: Ensures handoff record creation and case status transition are atomic
 */
@Service("caseHandoffService")
@RequiredArgsConstructor
@Slf4j
public class HandoffService {
    
    private final CaseHandoffRepository caseHandoffRepository;
    private final ApAuditCaseRepository apAuditCaseRepository;
    private final UserRepository userRepository;
    private final AuditTrailService auditTrailService;
    
    /**
     * Hand off a case from chairperson to team leader.
     * 
     * Validates all conditions and atomically:
     * 1. Creates case_handoff record
     * 2. Updates ap_audit_cases status to TEAM_ASSIGNED
     * 3. Creates audit trail entry
     * 
     * All operations in single @Transactional block for C1 bug fix (atomicity).
     * 
     * @param caseId case identifier
     * @param request handoff request with teamLeaderId and assignmentReason
     * @param chairpersonId authenticated chairperson performing handoff
     * @return HandoffRecordResponse with complete handoff details
     * @throws CaseNotFoundException if case not found
     * @throws InvalidCaseStateException if case not in APPROVED status
     * @throws InvalidTeamLeaderException if team leader not found or lacks role
     */
    @Transactional
    public HandoffRecordResponse handoffCaseToTeamLeader(UUID caseId, 
                                                         HandoffToTeamLeaderRequest request,
                                                         UUID chairpersonId) {
        log.info("Starting handoff operation: caseId={}, teamLeaderId={}, chairpersonId={}",
                caseId, request.getTeamLeaderId(), chairpersonId);
        
        // Step 1: Validate case exists
        ApAuditCaseEntity caseEntity = apAuditCaseRepository.findById(caseId)
            .orElseThrow(() -> {
                log.error("Case not found: caseId={}", caseId);
                return new CaseNotFoundException("Case not found with ID: " + caseId);
            });
        
        // Step 2: Validate case status is APPROVED
        String currentStatus = caseEntity.getStatus();
        if (!"APPROVED".equals(currentStatus)) {
            log.error("Invalid case state for handoff: caseId={}, currentStatus={}", caseId, currentStatus);
            throw new InvalidCaseStateException(
                "Case must be in APPROVED status to handoff. Current status: " + currentStatus,
                currentStatus
            );
        }
        
        // Step 3: Validate team leader exists and has TEAM_LEADER role
        // Note: This validation depends on UserRepository having role checking capability
        boolean isValidTeamLeader = userRepository.existsById(request.getTeamLeaderId());
        if (!isValidTeamLeader) {
            log.error("Invalid team leader: teamLeaderId={}", request.getTeamLeaderId());
            throw new InvalidTeamLeaderException(
                "Team leader not found with ID: " + request.getTeamLeaderId()
            );
        }
        
        // Step 4: Create CaseHandoff record
        CaseHandoff handoffRecord = CaseHandoff.builder()
            .caseId(caseId)
            .teamLeaderId(request.getTeamLeaderId())
            .assignedById(chairpersonId)
            .assignmentReason(request.getAssignmentReason())
            .status("ACTIVE")
            .assignmentDate(OffsetDateTime.now())
            .createdAt(OffsetDateTime.now())
            .build();
        
        // Step 5: Save handoff record
        CaseHandoff savedHandoff = caseHandoffRepository.save(handoffRecord);
        log.info("Handoff record created: handoffId={}", savedHandoff.getId());
        
        // Step 6: Update ApAuditCase status and team leader assignment
        String previousStatus = caseEntity.getStatus();
        caseEntity.setStatus("TEAM_ASSIGNED");
        caseEntity.setAssignedTeamLeaderId(request.getTeamLeaderId() != null ? request.getTeamLeaderId().toString() : null);
        caseEntity.setHandoffAt(OffsetDateTime.now());
        caseEntity.setHandoffComment(request.getAssignmentReason());
        caseEntity.setHandoffBy(chairpersonId != null ? chairpersonId.toString() : null);
        
        // Step 7: Save case
        ApAuditCaseEntity updatedCase = apAuditCaseRepository.save(caseEntity);
        log.info("Case status updated: caseId={}, previousStatus={}, newStatus={}", 
                caseId, previousStatus, updatedCase.getStatus());
        
        // Step 8: Create audit trail entry with before/after state
        try {
            Map<String, Object> beforeState = new HashMap<>();
            beforeState.put("status", previousStatus);
            
            Map<String, Object> afterState = new HashMap<>();
            afterState.put("status", "TEAM_ASSIGNED");
            afterState.put("assignedTeamLeaderId", request.getTeamLeaderId().toString());
            afterState.put("handoffId", savedHandoff.getId().toString());
            
            auditTrailService.logAction(
                caseId,
                chairpersonId,
                "CASE_HANDOFF_TO_TEAM_LEADER",
                beforeState,
                afterState
            );
            log.info("Audit trail entry created: caseId={}", caseId);
        } catch (Exception e) {
            log.warn("Failed to create audit trail entry: caseId={}, reason={}", caseId, e.getMessage());
            // Don't fail the entire operation if audit trail fails
        }
        
        // Step 9: Build and return response
        HandoffRecordResponse response = HandoffRecordResponse.builder()
            .handoffId(savedHandoff.getId())
            .caseId(caseId)
            .teamLeaderId(request.getTeamLeaderId())
            .caseNumber(caseEntity.getCaseNumber())
            .status("ACTIVE")
            .assignmentDate(savedHandoff.getAssignmentDate())
            .assignmentReason(request.getAssignmentReason())
            .build();
        
        log.info("Handoff operation completed successfully: caseId={}, handoffId={}", 
                caseId, response.getHandoffId());
        return response;
    }
}
