package mor.itas.application.usecase.ap;

import mor.itas.api.dto.request.ap.jac.AppointTeamLeadRequest;
import mor.itas.api.dto.response.ap.jac.TeamAssignmentResponse;
import mor.itas.api.mapper.ap.CommitteeCaseJacMapper;
import mor.itas.domain.aggregate.CommitteeCaseAggregate;
import mor.itas.domain.service.ap.AuditTrailService;
import mor.itas.persistence.jpa.entity.ap.CommitteeCaseEntity;
import mor.itas.persistence.jpa.entity.ap.UserEntity;
import mor.itas.persistence.jpa.repository.ap.CommitteeCaseRepository;
import mor.itas.persistence.jpa.repository.ap.UserJpaRepository;
import mor.itas.observability.audit.ActorContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.*;
import java.time.OffsetDateTime;

/**
 * Use Case: Appoint Team Lead
 * Handles assignment of a team lead auditor for a committee case
 *
 * Responsibilities:
 * - Assign a single auditor as team lead for a case
 * - Validate auditor eligibility and case state
 * - Record team assignment in audit trail
 * - Update case status to TEAM_ASSIGNED
 *
 * Access: Chairperson-exclusive
 */
@Component
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AppointTeamLeadUseCase {

    private final CommitteeCaseRepository caseRepository;
    private final UserJpaRepository userJpaRepository;
    private final mor.itas.persistence.jpa.repository.ap.AuditTeamRepository auditTeamRepository;
    private final mor.itas.persistence.jpa.repository.ap.ApAuditCaseRepository apCaseRepository;
    private final AuditTrailService auditTrailService;
    private final CommitteeCaseJacMapper caseMapper;

    /**
     * Execute: Appoint a team lead for a case
     *
     * @param caseId the case identifier
     * @param request contains auditorId and reason
     * @return TeamAssignmentResponse with assignment confirmation
     */
    public TeamAssignmentResponse execute(UUID caseId, AppointTeamLeadRequest request) {
        log.info("Appointing team lead auditorId={} for caseId={}", request.getAuditorId(), caseId);

        UUID chairpersonId;
        try {
            chairpersonId = UUID.fromString(ActorContextHolder.getActorId());
        } catch (Exception e) {
            chairpersonId = UUID.nameUUIDFromBytes("SYSTEM".getBytes());
        }

        // Fetch case
        CommitteeCaseEntity caseEntity = caseRepository.findById(caseId)
            .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseId));

        // Convert string auditor ID to UUID (supports both UUID strings and seed-data IDs like "u-tl-aa1c")
        UUID auditorId = toUUID(request.getAuditorId());

        // Validate case state — must be in TEAM_ASSIGNED, PENDING_VIABILITY or WAITING_ASSIGNMENT for team lead appointment
        String currentStatus = caseEntity.getStatus();
        if (!"TEAM_ASSIGNED".equals(currentStatus) && !"PENDING_VIABILITY".equals(currentStatus) && !"WAITING_ASSIGNMENT".equals(currentStatus)) {
            throw new IllegalStateException(
                "Case must be in TEAM_ASSIGNED, PENDING_VIABILITY or WAITING_ASSIGNMENT state to appoint a team lead. Current: " + currentStatus);
        }

        // Validate team lead is not already assigned
        if (caseEntity.getTeamLeadId() != null || caseEntity.getTeamId() != null) {
            throw new IllegalStateException(
                "A team is already assigned to this case. Re-assignment is not permitted.");
        }

        // Validate tax center: team leader must be from the same tax center as the case
        String caseTaxCenter = caseEntity.getTaxCenter();
        if (caseTaxCenter != null && !caseTaxCenter.isBlank()) {
            userJpaRepository.findById(auditorId).ifPresent(tl -> {
                if (tl.getAssignedLocation() != null && !tl.getAssignedLocation().equals(caseTaxCenter)) {
                    throw new IllegalArgumentException(
                        String.format("Team leader tax center (%s) does not match case tax center (%s). " +
                            "A team leader can only be assigned to cases from their own tax center.",
                            tl.getAssignedLocation(), caseTaxCenter));
                }
            });
        }

        // Validate that an active formed team exists for this team leader
        mor.itas.persistence.jpa.entity.ap.AuditTeamEntity team = auditTeamRepository.findByTeamLeaderIdAndActiveTrue(auditorId);
        if (team == null) {
            throw new IllegalStateException(
                "Cannot assign case: A team must be formed first before appointing a team leader. " +
                "No active formed team found for team leader ID: " + auditorId + " in Team Formation.");
        }

        if (team.isAtCapacity()) {
            throw new IllegalStateException(
                String.format("Team '%s' has reached its capacity limit (%d/%d cases).",
                    team.getTeamLeaderName(), team.getCurrentCases(), team.getCapacity()));
        }

        // Increment team cases
        team.incrementCases();
        auditTeamRepository.save(team);

        // Create before-state for audit
        Map<String, Object> beforeState = new LinkedHashMap<>();
        beforeState.put("status", currentStatus);
        beforeState.put("teamLeadId", caseEntity.getTeamLeadId());

        // Update case with team lead assignment and teamId
        // After team lead is appointed, case moves to WAITING_ASSIGNMENT
        caseEntity.setTeamLeadId(auditorId);
        caseEntity.setTeamId(team.getTeamId());
        caseEntity.setStatus("WAITING_ASSIGNMENT");
        caseRepository.save(caseEntity);

        // Synchronize with linked AP Audit Case
        java.util.Optional<mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity> existingApCase = java.util.Optional.empty();
        if (caseEntity.getOriginalCaseId() != null) {
            existingApCase = apCaseRepository.findById(caseEntity.getOriginalCaseId());
        }
        if (existingApCase.isEmpty() && caseEntity.getCaseCode() != null) {
            existingApCase = apCaseRepository.findByCaseNumber(caseEntity.getCaseCode());
        }
        if (existingApCase.isPresent()) {
            mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity apCase = existingApCase.get();
            apCase.setAssignedTeamLeaderId(auditorId.toString());
            apCase.setStatus("WAITING_ASSIGNMENT");
            apCase.setAssignedAt(OffsetDateTime.now());
            apCase.setUpdatedAt(OffsetDateTime.now());
            apCaseRepository.save(apCase);
            log.info("Synchronized AP case {} with team lead {} (status=WAITING_ASSIGNMENT)",
                apCase.getCaseNumber(), auditorId);
        }

        // Create after-state for audit
        Map<String, Object> afterState = new LinkedHashMap<>();
        afterState.put("status", "WAITING_ASSIGNMENT");
        afterState.put("teamLeadId", auditorId.toString());
        afterState.put("teamId", team.getTeamId().toString());
        afterState.put("teamName", team.getDescription());
        afterState.put("reason", request.getReason());
        afterState.put("appointedAt", OffsetDateTime.now().toString());

        // Log to audit trail
        auditTrailService.logAction(
            caseId,
            chairpersonId,
            "TEAM_LEAD_APPOINTED",
            beforeState,
            afterState
        );

        log.info("Team lead appointed successfully. caseId={}, teamLeadId={}, teamId={}", caseId, auditorId, team.getTeamId());

        // Build response
        return TeamAssignmentResponse.builder()
            .teamAssignmentId(UUID.randomUUID())
            .appointedTeamLeadId(auditorId)
            .teamLeadName(team.getTeamLeaderName())
            .nominations(Collections.emptyList())
            .officialTeam(Collections.emptyList())
            .teamSize(1)
            .build();
    }

    /**
     * Convert a string ID to UUID. If already a valid UUID string, parse it directly.
     * Otherwise, generate a deterministic UUID from the string using UUID.nameUUIDFromBytes.
     */
    private static UUID toUUID(String id) {
        if (id == null) throw new IllegalArgumentException("ID cannot be null");
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException e) {
            return UUID.nameUUIDFromBytes(id.getBytes());
        }
    }
}
