package mor.itas.application.usecase.ap;

import mor.itas.api.dto.request.ap.jac.AssignOfficialTeamRequest;
import mor.itas.api.dto.response.ap.jac.TeamAssignmentResponse;
import mor.itas.domain.service.ap.TeamFormationService;
import mor.itas.domain.exception.InvalidTeamSizeException;
import mor.itas.persistence.jpa.repository.ap.CommitteeCaseRepository;
import mor.itas.persistence.jpa.entity.ap.CommitteeCaseEntity;
import lombok.RequiredArgsConstructor;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;

/**
 * Use Case: Assign Official Team (Chairperson Only)
 * Assigns auditors as the official audit team (2-5 members)
 */
@Component
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AssignOfficialTeamUseCase {
    private final TeamFormationService teamFormationService;
    private final CommitteeCaseRepository caseRepository;
    
    /**
     * Overloaded execute method to match controller signature
     */
    public TeamAssignmentResponse execute(UUID caseId, AssignOfficialTeamRequest request) {
        // Convert string IDs to UUIDs
        List<UUID> auditorIds = request.getAuditorIds().stream()
            .map(AssignOfficialTeamUseCase::toUUID)
            .toList();
        
        UUID teamLeadId = null;
        if (request.getTeamLeadIndex() != null && request.getTeamLeadIndex() >= 0 && request.getTeamLeadIndex() < auditorIds.size()) {
            teamLeadId = auditorIds.get(request.getTeamLeadIndex());
        }
        
        AssignTeamRequest useCaseRequest = new AssignTeamRequest(caseId, auditorIds, teamLeadId, null);
        try {
            this.execute(useCaseRequest);
        } catch (InvalidTeamSizeException e) {
            throw new IllegalArgumentException("Invalid team size: " + e.getMessage(), e);
        }
        
        return TeamAssignmentResponse.builder()
            .teamAssignmentId(UUID.randomUUID())
            .appointedTeamLeadId(teamLeadId)
            .teamSize(auditorIds.size())
            .build();
    }

    /**
     * Execute: Assign official audit team
     * 
     * @param request contains caseId, auditorIds, teamLeadId, chairpersonId
     * @throws InvalidTeamSizeException if team size is invalid
     */
    public void execute(AssignTeamRequest request) throws InvalidTeamSizeException {
        // Validate input
        if (request == null || request.getCaseId() == null || request.getAuditorIds() == null) {
            throw new IllegalArgumentException("Case ID and auditor IDs cannot be null");
        }
        
        // Validate team size (2-5 members)
        teamFormationService.validateTeamSize(request.getAuditorIds());
        
        // Validate team lead is in the team
        if (request.getTeamLeadId() != null) {
            teamFormationService.validateTeamLeadInTeam(request.getTeamLeadId(), request.getAuditorIds());
        }
        
        // Fetch and update case
        CommitteeCaseEntity caseEntity = caseRepository.findById(request.getCaseId())
            .orElseThrow(() -> new IllegalArgumentException("Case not found: " + request.getCaseId()));
        
        // Validate case is ready for team assignment (must be in TEAM_ASSIGNED after vote passes)
        String currentStatus = caseEntity.getStatus();
        if (!"TEAM_ASSIGNED".equals(currentStatus)) {
            throw new IllegalStateException(
                "Case must be in TEAM_ASSIGNED state for team assignment. Current: " + currentStatus);
        }
        
        // Update case: team assigned → move to viability assessment
        // This transition happens when the chairperson assigns the official audit team
        caseEntity.setStatus("PENDING_VIABILITY");
        caseRepository.save(caseEntity);
        
        log.info("Case {} status transition: {} → PENDING_VIABILITY (team assigned)", 
                 caseEntity.getCaseId(), currentStatus);
    }
    
    /**
     * Convert a string ID to UUID. If already a valid UUID string, parse it directly.
     * Otherwise, generate a deterministic UUID from the string.
     */
    private static UUID toUUID(String id) {
        if (id == null) throw new IllegalArgumentException("ID cannot be null");
        try {
            return UUID.fromString(id);
        } catch (IllegalArgumentException e) {
            return UUID.nameUUIDFromBytes(id.getBytes());
        }
    }

    @Data
    public static class AssignTeamRequest {
        private UUID caseId;
        private List<UUID> auditorIds;
        private UUID teamLeadId;
        private UUID chairpersonId;
        
        public AssignTeamRequest() {}
        
        public AssignTeamRequest(UUID caseId, List<UUID> auditorIds, UUID teamLeadId, UUID chairpersonId) {
            this.caseId = caseId;
            this.auditorIds = auditorIds;
            this.teamLeadId = teamLeadId;
            this.chairpersonId = chairpersonId;
        }
    }
}
