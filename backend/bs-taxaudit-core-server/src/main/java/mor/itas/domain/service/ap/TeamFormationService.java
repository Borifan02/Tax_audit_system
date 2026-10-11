package mor.itas.domain.service.ap;

import mor.itas.domain.aggregate.ap.TeamAssignmentAggregate;
import mor.itas.domain.exception.InvalidTeamSizeException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.UUID;

/**
 * Domain Service for Team Formation
 * Manages auditor nomination and official team assignment
 */
@Service
@RequiredArgsConstructor
public class TeamFormationService {

    private static final int MIN_TEAM_SIZE = 2;
    private static final int MAX_TEAM_SIZE = 5;

    /**
     * Validate team size is within acceptable range
     */
    public void validateTeamSize(List<UUID> auditorIds) throws InvalidTeamSizeException {
        if (auditorIds == null) {
            throw new IllegalArgumentException("Auditor IDs list cannot be null");
        }

        int teamSize = auditorIds.size();
        if (teamSize < MIN_TEAM_SIZE || teamSize > MAX_TEAM_SIZE) {
            throw new InvalidTeamSizeException(teamSize, MIN_TEAM_SIZE, MAX_TEAM_SIZE);
        }
    }

    /**
     * Validate team lead is included in the team
     */
    public void validateTeamLeadInTeam(UUID teamLeadId, List<UUID> teamMemberIds) {
        if (teamLeadId == null || teamMemberIds == null) {
            throw new IllegalArgumentException("Team lead ID and member IDs cannot be null");
        }

        if (!teamMemberIds.contains(teamLeadId)) {
            throw new IllegalStateException("Team lead must be included in the official team");
        }
    }

    /**
     * Nominate an auditor
     */
    public void nominateAuditor(TeamAssignmentAggregate teamAssignment, UUID nominatingMemberId, 
                                UUID auditorId, String justification) {
        if (teamAssignment == null) {
            throw new IllegalArgumentException("Team assignment aggregate cannot be null");
        }

        if (nominatingMemberId == null || auditorId == null || justification == null || justification.isEmpty()) {
            throw new IllegalArgumentException("Nomination fields cannot be null or empty");
        }

        teamAssignment.nominateAuditor(nominatingMemberId, auditorId, justification);
    }

    /**
     * Appoint team lead
     */
    public void appointTeamLead(TeamAssignmentAggregate teamAssignment, UUID auditorId) {
        if (teamAssignment == null) {
            throw new IllegalArgumentException("Team assignment aggregate cannot be null");
        }

        if (auditorId == null) {
            throw new IllegalArgumentException("Auditor ID cannot be null");
        }

        teamAssignment.appointTeamLead(auditorId);
    }

    /**
     * Assign official team members
     */
    public void assignOfficialTeam(TeamAssignmentAggregate teamAssignment, List<UUID> auditorIds) 
            throws InvalidTeamSizeException {
        if (teamAssignment == null) {
            throw new IllegalArgumentException("Team assignment aggregate cannot be null");
        }

        validateTeamSize(auditorIds);
        validateTeamLeadInTeam(teamAssignment.getAppointedTeamLeadId(), auditorIds);

        teamAssignment.assignOfficialTeam(auditorIds);
    }

    /**
     * Get official team size
     */
    public int getOfficialTeamSize(TeamAssignmentAggregate teamAssignment) {
        if (teamAssignment == null) {
            throw new IllegalArgumentException("Team assignment aggregate cannot be null");
        }

        return teamAssignment.getOfficialTeamMemberIds().size();
    }

    /**
     * Check if auditor is on official team
     */
    public boolean isTeamMember(TeamAssignmentAggregate teamAssignment, UUID auditorId) {
        if (teamAssignment == null) {
            throw new IllegalArgumentException("Team assignment aggregate cannot be null");
        }

        if (auditorId == null) {
            throw new IllegalArgumentException("Auditor ID cannot be null");
        }

        return teamAssignment.isTeamMember(auditorId);
    }

    /**
     * Check if auditor was nominated
     */
    public boolean wasNominated(TeamAssignmentAggregate teamAssignment, UUID auditorId) {
        if (teamAssignment == null) {
            throw new IllegalArgumentException("Team assignment aggregate cannot be null");
        }

        if (auditorId == null) {
            throw new IllegalArgumentException("Auditor ID cannot be null");
        }

        return teamAssignment.wasNominated(auditorId);
    }

    /**
     * Get nomination count for an auditor
     */
    public int getNominationCount(TeamAssignmentAggregate teamAssignment, UUID auditorId) {
        if (teamAssignment == null) {
            throw new IllegalArgumentException("Team assignment aggregate cannot be null");
        }

        if (auditorId == null) {
            throw new IllegalArgumentException("Auditor ID cannot be null");
        }

        return (int) teamAssignment.getNominations().stream()
                .filter(n -> n.getNominatedAuditorId().equals(auditorId))
                .count();
    }

    /**
     * Mark team assignment as completed
     */
    public void markAsCompleted(TeamAssignmentAggregate teamAssignment) {
        if (teamAssignment == null) {
            throw new IllegalArgumentException("Team assignment aggregate cannot be null");
        }

        teamAssignment.markAsCompleted();
    }
}
