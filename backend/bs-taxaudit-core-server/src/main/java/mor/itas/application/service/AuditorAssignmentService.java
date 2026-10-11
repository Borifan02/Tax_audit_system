package mor.itas.application.service;

import mor.itas.api.dto.request.AssignAuditorRequest;
import mor.itas.api.dto.response.AuditorAssignmentResponse;
import mor.itas.domain.exception.*;
import mor.itas.persistence.jpa.entity.CaseAuditorAssignment;
import mor.itas.persistence.jpa.entity.TeamMember;
import mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity;
import mor.itas.persistence.jpa.entity.ap.AuditTeamEntity;
import mor.itas.persistence.jpa.entity.identity.UserEntity;
import mor.itas.persistence.jpa.repository.CaseAuditorAssignmentRepository;
import mor.itas.persistence.jpa.repository.TeamMemberRepository;
import mor.itas.persistence.jpa.repository.ap.ApAuditCaseRepository;
import mor.itas.persistence.jpa.repository.ap.AuditTeamRepository;
import mor.itas.persistence.jpa.repository.ap.AuditorRepository;
import mor.itas.persistence.jpa.repository.identity.UserRepository;
import mor.itas.domain.service.ap.AuditTrailService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * AuditorAssignmentService handles the auditor assignment workflow where a team leader
 * assigns an auditor from their team to execute a case.
 * 
 * Responsibilities:
 * - Validate case is in TEAM_ASSIGNED status
 * - Verify requesting user is the assigned team leader (authorization check)
 * - Verify team has at least one active member (C3 bug fix)
 * - Verify auditor is a member of team leader's team (C2 bug fix)
 * - Create assignment record atomically with case status update
 * - Create audit trail entry
 * 
 * Addresses Bugs:
 * - C2: Cross-team auditor assignment prevention
 * - C3: Empty team null pointer prevention
 * - C4: Incomplete database query correction
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuditorAssignmentService {
    
    private final CaseAuditorAssignmentRepository caseAuditorAssignmentRepository;
    private final ApAuditCaseRepository apAuditCaseRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;
    private final AuditTrailService auditTrailService;
    private final AuditTeamRepository auditTeamRepository;
    private final AuditorRepository auditorRepository;
    
    /**
     * Assign an auditor from team leader's team to execute a case.
     * 
     * Validates all conditions and atomically:
     * 1. Creates case_auditor_assignment record
     * 2. Updates ap_audit_cases status to AUDITOR_ASSIGNED
     * 3. Creates audit trail entry
     * 
     * All operations in single @Transactional block for atomicity.
     * 
     * Critical validations for bug fixes:
     * - Step 5: Empty team check (C3 fix)
     * - Step 7: Team membership validation (C2/C4 fix)
     * 
     * @param caseId case identifier
     * @param request assignment request with auditorId
     * @param teamLeaderId authenticated team leader performing assignment
     * @return AuditorAssignmentResponse with complete assignment details
     * @throws CaseNotFoundException if case not found
     * @throws InvalidCaseStateException if case not in TEAM_ASSIGNED status
     * @throws UnauthorizedException if requesting user is not the assigned team leader
     * @throws NoTeamMembersException if team leader has zero active members (C3 fix)
     * @throws AuditorNotFoundException if auditor not found in system
     * @throws AuditorNotInTeamException if auditor not member of team leader's team (C2 fix)
     */
    @Transactional
    public AuditorAssignmentResponse assignAuditorToCase(UUID caseId,
                                                         AssignAuditorRequest request,
                                                         UUID teamLeaderId) {
        log.info("Starting auditor assignment: caseId={}, auditorId={}, teamLeaderId={}",
                caseId, request.getAuditorId(), teamLeaderId);
        
        // Step 1: Validate case exists
        ApAuditCaseEntity caseEntity = apAuditCaseRepository.findById(caseId)
            .orElseThrow(() -> {
                log.error("Case not found: caseId={}", caseId);
                return new CaseNotFoundException("Case not found with ID: " + caseId);
            });
        
        // Step 2: Validate case status is assignable.
        // Accepts the canonical TEAM_ASSIGNED plus the pre-execution statuses used
        // by the plan-cascade (ASSIGNED_TO_TEAM_LEADER / ASSIGNED_TO_COMMITTEE) and
        // the committee bridge (HANDED_OFF / ASSIGNED) so JA cases can flow through
        // the validated workflow regardless of which ingestion path created them.
        // WAITING_ASSIGNMENT is set by the committee when a team+leader is assigned but
        // the team leader hasn't handed off yet — allow direct assignment from this status.
        String currentStatus = caseEntity.getStatus();
        Set<String> assignableStatuses = Set.of(
            "TEAM_ASSIGNED",
            "ASSIGNED_TO_TEAM_LEADER",
            "ASSIGNED_TO_COMMITTEE",
            "HANDED_OFF",
            "ASSIGNED",
            "WAITING_ASSIGNMENT",  // set by committee after team assignment, before handoff
            "AUDITOR_ASSIGNED"     // reassignment: existing ACTIVE row gets superseded (Step 7b)
        );
        if (!assignableStatuses.contains(currentStatus)) {
            log.error("Invalid case state for auditor assignment: caseId={}, status={}", caseId, currentStatus);
            throw new InvalidCaseStateException(
                "Case is not in an assignable status for auditor assignment. Current status: " + currentStatus,
                currentStatus
            );
        }
        
        // Step 3: Validate requesting user is the assigned team leader (authorization check)
        String assignedTeamLeaderId = caseEntity.getAssignedTeamLeaderId();
        if (assignedTeamLeaderId == null || !assignedTeamLeaderId.equalsIgnoreCase(teamLeaderId.toString())) {
            log.error("Unauthorized auditor assignment: requested by {}, case assigned to {}",
                    teamLeaderId, assignedTeamLeaderId);
            throw new UnauthorizedException(
                "Only the assigned team leader can assign auditors to this case"
            );
        }
        
        // Step 4: DEFENSIVE - C3 BUG FIX - Check for empty team BEFORE attempting queries.
        // This prevents NullPointerException and allows early exit with clear error.
        // Membership sources: t_team_members (committee-workspace teams) OR t_audit_team
        // (JA teams formed during nomination, auditor_ids stored as a JSON array).
        long activeTeamMemberCount = teamMemberRepository.countActiveMembers(teamLeaderId);
        AuditTeamEntity jaTeam = (activeTeamMemberCount == 0)
            ? auditTeamRepository.findByTeamLeaderIdAndActiveTrue(teamLeaderId)
            : null;
        if (activeTeamMemberCount == 0
                && (jaTeam == null || jaTeam.getAuditorIds() == null || jaTeam.getAuditorIds().isBlank())) {
            log.warn("Team has no active members: teamLeaderId={}", teamLeaderId);
            throw new NoTeamMembersException(
                "No active team members available for assignment"
            );
        }
        log.debug("Team size: t_team_members={}, jaTeamFallback={}", activeTeamMemberCount, jaTeam != null);
        
        // Step 5: Validate auditor exists — users registry first, then t_auditor registry
        // (JA auditors live in t_auditor; V26 mirrors them into users for FK integrity)
        String auditorDisplayName;
        String auditorCode;
        Optional<UserEntity> auditorUser = userRepository.findById(request.getAuditorId());
        if (auditorUser.isPresent()) {
            auditorDisplayName = auditorUser.get().getFullName() != null
                ? auditorUser.get().getFullName() : auditorUser.get().getUsername();
            auditorCode = auditorUser.get().getUsername();
        } else {
            var registryAuditor = auditorRepository.findById(request.getAuditorId())
                .orElseThrow(() -> {
                    log.error("Auditor not found: auditorId={}", request.getAuditorId());
                    return new AuditorNotFoundException(
                        "Auditor not found with ID: " + request.getAuditorId()
                    );
                });
            auditorDisplayName = (registryAuditor.getFirstName() + " " + registryAuditor.getLastName()).trim();
            auditorCode = registryAuditor.getEmail() != null && !registryAuditor.getEmail().isBlank()
                ? registryAuditor.getEmail() : registryAuditor.getAuditorId().toString();
        }
        
        // Step 6: CRITICAL - C2/C4 BUG FIXES - Validate auditor is member of team leader's team.
        // Primary source: t_team_members (teamLeaderId + auditorId + is_active + left_at IS NULL).
        // Fallback source: t_audit_team.auditor_ids JSON (JA nomination teams).
        // Prevents C2 (cross-team assignment) and C4 (incomplete query).
        Optional<TeamMember> teamMembership = teamMemberRepository.findActiveTeamMember(
            teamLeaderId,
            request.getAuditorId()
        );

        boolean memberOfTeam = teamMembership.isPresent()
            && teamMembership.get().getIsActive() != null
            && teamMembership.get().getIsActive()
            && teamMembership.get().getLeftAt() == null;

        if (!memberOfTeam && jaTeam != null) {
            memberOfTeam = isAuditorInJaTeam(jaTeam, request.getAuditorId());
        }

        if (!memberOfTeam) {
            log.error("Auditor not in team: auditorId={}, teamLeaderId={}",
                    request.getAuditorId(), teamLeaderId);
            throw new AuditorNotInTeamException(
                "Auditor is not a member of this team leader's team",
                teamLeaderId,
                request.getAuditorId()
            );
        }
        
        // Step 7b: Reassignment safety — supersede any previous ACTIVE assignment
        // for this case (the partial unique index allows only one ACTIVE row).
        caseAuditorAssignmentRepository.findActiveByCaseId(caseId).ifPresent(previous -> {
            previous.setStatus("SUPERSEDED");
            previous.setSupersededAt(OffsetDateTime.now());
            previous.setSupersededById(teamLeaderId);
            // saveAndFlush: Hibernate's ActionQueue runs INSERTs before UPDATEs, so the
            // supersede UPDATE must reach the DB before the new ACTIVE row INSERTs,
            // or the partial unique index (uk_case_auditor_active) rejects the insert.
            caseAuditorAssignmentRepository.saveAndFlush(previous);
            log.info("Superseded previous assignment {} for case {}", previous.getId(), caseId);
        });

        // Step 8: Create CaseAuditorAssignment record
        CaseAuditorAssignment assignmentRecord = CaseAuditorAssignment.builder()
            .caseId(caseId)
            .auditorId(request.getAuditorId())
            .assignedById(teamLeaderId)
            .status("ACTIVE")
            .assignedDate(OffsetDateTime.now())
            .createdAt(OffsetDateTime.now())
            .build();
        
        // Step 9: Save assignment record
        CaseAuditorAssignment savedAssignment = caseAuditorAssignmentRepository.save(assignmentRecord);
        log.info("Auditor assignment record created: assignmentId={}", savedAssignment.getId());
        
        // Step 10: Update ApAuditCase status and auditor assignment
        String previousStatus = caseEntity.getStatus();
        caseEntity.setStatus("AUDITOR_ASSIGNED");
        caseEntity.setAssignedAuditorId(request.getAuditorId() != null ? request.getAuditorId().toString() : null);
        caseEntity.setAssignedAt(OffsetDateTime.now());
        caseEntity.setAssignedBy(teamLeaderId != null ? teamLeaderId.toString() : null);
        
        // Step 11: Save case
        ApAuditCaseEntity updatedCase = apAuditCaseRepository.save(caseEntity);
        log.info("Case status updated: caseId={}, previousStatus={}, newStatus={}", 
                caseId, previousStatus, updatedCase.getStatus());
        
        // Step 12: Create audit trail entry with before/after state
        try {
            Map<String, Object> beforeState = new HashMap<>();
            beforeState.put("status", previousStatus);
            beforeState.put("assignedAuditorId", "null");
            
            Map<String, Object> afterState = new HashMap<>();
            afterState.put("status", "AUDITOR_ASSIGNED");
            afterState.put("assignedAuditorId", request.getAuditorId().toString());
            afterState.put("assignmentId", savedAssignment.getId().toString());
            
            auditTrailService.logAction(
                caseId,
                teamLeaderId,
                "AUDITOR_ASSIGNED_TO_CASE",
                beforeState,
                afterState
            );
            log.info("Audit trail entry created: caseId={}", caseId);
        } catch (Exception e) {
            log.warn("Failed to create audit trail entry: caseId={}, reason={}", caseId, e.getMessage());
            // Don't fail the entire operation if audit trail fails
        }
        
        // Step 13: Build and return response
        // Note: auditorName and auditorCode fetched from UserEntity
        AuditorAssignmentResponse response = AuditorAssignmentResponse.builder()
            .assignmentId(savedAssignment.getId())
            .caseId(caseId)
            .auditorId(request.getAuditorId())
            .auditorName(auditorDisplayName)
            .auditorCode(auditorCode)
            .caseNumber(caseEntity.getCaseNumber())
            .status("ACTIVE")
            .assignedDate(savedAssignment.getAssignedDate())
            .build();
        
        log.info("Auditor assignment completed successfully: caseId={}, assignmentId={}, auditorId={}", 
                caseId, response.getAssignmentId(), request.getAuditorId());
        return response;
    }

    /**
     * Parse the t_audit_team.auditor_ids JSON array and check membership.
     * Tolerates quoted elements and surrounding whitespace.
     */
    private boolean isAuditorInJaTeam(AuditTeamEntity team, UUID auditorId) {
        try {
            String raw = team.getAuditorIds().trim();
            if (raw.startsWith("[")) raw = raw.substring(1);
            if (raw.endsWith("]")) raw = raw.substring(0, raw.length() - 1);
            if (raw.isBlank()) return false;
            String target = auditorId.toString();
            return Arrays.stream(raw.split(","))
                .map(s -> s.trim().replace("\"", ""))
                .anyMatch(target::equalsIgnoreCase);
        } catch (Exception e) {
            log.warn("Could not parse t_audit_team auditor_ids for team {}: {}",
                team.getTeamId(), e.getMessage());
            return false;
        }
    }
}
