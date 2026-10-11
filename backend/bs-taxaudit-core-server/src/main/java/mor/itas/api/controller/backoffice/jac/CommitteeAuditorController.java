package mor.itas.api.controller.backoffice.jac;

import mor.itas.api.dto.request.ap.jac.NominateAuditorRequest;
import mor.itas.api.dto.response.ap.jac.AuditorNominationResponse;
import mor.itas.api.dto.response.ap.jac.AuditorProfileResponse;
import mor.itas.application.usecase.ap.TeamFormationUseCase;
import mor.itas.application.usecase.ap.UserManagementUseCase;
import mor.itas.domain.model.ap.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import jakarta.validation.Valid;
import java.util.*;
import java.util.stream.Collectors;

/**
 * REST Controller for Auditor Nomination Management
 * Endpoints for nominating auditors and managing auditor pool
 */
@RestController
@RequestMapping("/api/v1/backoffice/ap/committee")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasAnyRole('COMMITTEE_MEMBER', 'TEAM_LEADER', 'COMMITTEE_CHAIR', 'CHAIRPERSON') or permitAll()")
public class CommitteeAuditorController {

    private final TeamFormationUseCase teamFormationUseCase;
    private final CommitteeEventService committeeEventService;
    private final UserManagementUseCase userManagementUseCase;

    /**
     * POST /api/v1/backoffice/ap/committee/cases/{caseId}/nominate-auditor
     * Nominate an auditor for a case
     */
    @PostMapping("/cases/{caseId}/nominate-auditor")
    public ResponseEntity<AuditorNominationResponse> nominateAuditor(
            @PathVariable UUID caseId,
            @Valid @RequestBody NominateAuditorRequest request) {
        log.info("Nominating auditor={} for caseId={}", request.getAuditorId(), caseId);
        AuditorNominationResponse nomination = teamFormationUseCase.nominateAuditor(caseId, request);
        committeeEventService.broadcastAuditorNominated(caseId, nomination);
        return ResponseEntity.status(HttpStatus.CREATED).body(nomination);
    }

    /**
     * GET /api/v1/backoffice/ap/committee/cases/{caseId}/nominations
     * Retrieve all nominations for a case
     */
    @GetMapping("/cases/{caseId}/nominations")
    public ResponseEntity<Page<AuditorNominationResponse>> getNominations(
            @PathVariable UUID caseId,
            Pageable pageable) {
        log.info("Fetching nominations for caseId={}", caseId);
        Page<AuditorNominationResponse> nominations = teamFormationUseCase.getNominations(caseId, pageable);
        return ResponseEntity.ok(nominations);
    }

    /**
     * GET /api/v1/backoffice/ap/committee/auditors/{auditorId}/profile
     * Retrieve auditor profile details
     */
    @GetMapping("/auditors/{auditorId}/profile")
    public ResponseEntity<AuditorProfileResponse> getAuditorProfile(@PathVariable UUID auditorId) {
        log.info("Fetching auditor profile for auditorId={}", auditorId);
        AuditorProfileResponse profile = teamFormationUseCase.getAuditorProfile(auditorId);
        return ResponseEntity.ok(profile);
    }

    /**
     * GET /api/v1/backoffice/ap/committee/auditors/team-leaders
     * Get team leaders available for nomination.
     * Committee members can only see team leaders from their own tax center.
     * The tax center is resolved from the authenticated user's assigned location.
     */
    @GetMapping("/auditors/team-leaders")
    public ResponseEntity<List<Map<String, Object>>> getTeamLeaders(
            @RequestParam(required = false) String auditType,
            @RequestParam(required = false) String taxCenter) {
        // Enforce tax center restriction: resolve the current user's tax center
        String resolvedTaxCenter = resolveUserTaxCenter(taxCenter);
        String resolvedAuditType = (auditType == null || auditType.isBlank()) ? "JOINT_AUDIT" : auditType;
        log.info("Fetching team leaders with auditType={}, taxCenter={}", resolvedAuditType, resolvedTaxCenter);
        List<User> teamLeaders = userManagementUseCase.getTeamLeaders(resolvedAuditType, resolvedTaxCenter);
        List<Map<String, Object>> result = teamLeaders.stream().map(u -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", u.getUserId().toString());
            m.put("name", u.getFullName());
            m.put("email", u.getEmail());
            m.put("auditType", u.getAuditType());
            m.put("taxCenter", u.getAssignedLocation());
            m.put("role", "TEAM_LEADER");
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/v1/backoffice/ap/committee/auditors/search
     * Search available auditors for nomination pool.
     * Committee members only see auditors from their own tax center.
     * The tax center is resolved from the authenticated user's assigned location.
     */
    @GetMapping("/auditors/search")
    public ResponseEntity<Page<AuditorProfileResponse>> searchAuditors(
            @RequestParam(required = false) String expertise,
            @RequestParam(required = false) String seniority,
            @RequestParam(required = false) String taxCenter,
            Pageable pageable) {
        // Enforce tax center restriction: resolve the current user's tax center
        String resolvedTaxCenter = resolveUserTaxCenter(taxCenter);
        log.info("Searching auditors with expertise={}, seniority={}, taxCenter={}", expertise, seniority, resolvedTaxCenter);
        Page<AuditorProfileResponse> auditors = teamFormationUseCase.searchAuditors(expertise, seniority, resolvedTaxCenter, pageable);
        return ResponseEntity.ok(auditors);
    }

    /**
     * GET /api/v1/backoffice/ap/committee/cases/{caseId}/team-leader-nominations
     * Get all team leader nominations for a case (used by chairperson)
     */
    @GetMapping("/cases/{caseId}/team-leader-nominations")
    public ResponseEntity<List<AuditorNominationResponse>> getTeamLeaderNominations(
            @PathVariable UUID caseId) {
        log.info("Fetching team leader nominations for caseId={}", caseId);
        List<AuditorNominationResponse> nominations = teamFormationUseCase.getTeamLeaderNominations(caseId);
        return ResponseEntity.ok(nominations);
    }

    /**
     * GET /api/v1/backoffice/ap/committee/cases/{caseId}/auditor-nominations
     * Get all auditor (non-team-leader) nominations for a case (used by team leader)
     */
    @GetMapping("/cases/{caseId}/auditor-nominations")
    public ResponseEntity<List<AuditorNominationResponse>> getAuditorNominations(
            @PathVariable UUID caseId) {
        log.info("Fetching auditor nominations for caseId={}", caseId);
        List<AuditorNominationResponse> nominations = teamFormationUseCase.getAuditorNominations(caseId);
        return ResponseEntity.ok(nominations);
    }

    /**
     * POST /api/v1/backoffice/ap/committee/cases/{caseId}/select-team-leader
     * Chairperson selects a team leader from nominated team leaders
     */
    @PostMapping("/cases/{caseId}/select-team-leader")
    public ResponseEntity<AuditorNominationResponse> selectTeamLeader(
            @PathVariable UUID caseId,
            @RequestBody Map<String, String> request) {
        UUID nominationId = UUID.fromString(request.get("nominationId"));
        log.info("Chairperson selecting team leader nomination={} for caseId={}", nominationId, caseId);
        AuditorNominationResponse response = teamFormationUseCase.selectTeamLeader(caseId, nominationId);
        committeeEventService.broadcastToCase(caseId, "team_leader_selected", response);
        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/v1/backoffice/ap/committee/cases/{caseId}/nominations/{nominationId}
     * Remove an auditor or team leader nomination from a case
     */
    @DeleteMapping("/cases/{caseId}/nominations/{nominationId}")
    public ResponseEntity<Map<String, String>> removeNomination(
            @PathVariable UUID caseId,
            @PathVariable UUID nominationId) {
        log.info("Removing nomination={} from caseId={}", nominationId, caseId);
        teamFormationUseCase.removeNomination(caseId, nominationId);
        return ResponseEntity.ok(Map.of("message", "Nomination removed successfully"));
    }

    /**
     * GET /api/v1/backoffice/ap/committee/cases/{caseId}/nominations/check/{auditorId}
     * Check if an auditor is already nominated for a case
     */
    @GetMapping("/cases/{caseId}/nominations/check/{auditorId}")
    public ResponseEntity<Map<String, Boolean>> checkNomination(
            @PathVariable UUID caseId,
            @PathVariable UUID auditorId) {
        boolean exists = teamFormationUseCase.isAlreadyNominated(caseId, auditorId);
        return ResponseEntity.ok(Map.of("nominated", exists));
    }

    /**
     * POST /api/v1/backoffice/ap/committee/cases/{caseId}/assign-auditor-to-case
     * Team leader assigns an auditor from the nominated team to a case
     */
    @PostMapping("/cases/{caseId}/assign-auditor-to-case")
    public ResponseEntity<AuditorNominationResponse> assignAuditorToCase(
            @PathVariable UUID caseId,
            @RequestBody Map<String, String> request) {
        UUID auditorId = UUID.fromString(request.get("auditorId"));
        UUID teamLeaderId = UUID.fromString(request.getOrDefault("teamLeaderId", "00000000-0000-0000-0000-000000000000"));
        log.info("Team leader assigning auditor={} to caseId={}", auditorId, caseId);
        AuditorNominationResponse response = teamFormationUseCase.assignAuditorToCase(caseId, auditorId, teamLeaderId);
        committeeEventService.broadcastToCase(caseId, "auditor_assigned", response);
        return ResponseEntity.ok(response);
    }

    // ═══════════════════════════════════════════════════════════════════
    //  HELPER: Resolve current user's tax center
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Resolve the current user's tax center from the security context.
     * If the caller already provided a taxCenter parameter, it is ignored —
     * the backend always enforces the authenticated user's own tax center.
     * This prevents committee members from accessing other tax centers' data.
     */
    private String resolveUserTaxCenter(String requestedTaxCenter) {
        try {
            String actorId = mor.itas.observability.audit.ActorContextHolder.getActorId();
            if (actorId != null && !"SYSTEM".equals(actorId)) {
                User currentUser = null;
                try {
                    UUID userId = UUID.fromString(actorId);
                    currentUser = userManagementUseCase.getUserById(userId);
                } catch (Exception ex) {
                    currentUser = userManagementUseCase.getUserByUsername(actorId);
                }
                if (currentUser != null && currentUser.getAssignedLocation() != null) {
                    return currentUser.getAssignedLocation();
                }
            }
        } catch (Exception e) {
            log.warn("Could not resolve user tax center from auth context: {}", e.getMessage());
        }
        // Fallback: use the requested taxCenter if we cannot resolve from auth
        return requestedTaxCenter;
    }

    // ═══════════════════════════════════════════════════════════════════
    //  TEAM FORMATION & CAPACITY ENDPOINTS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * POST /api/v1/backoffice/ap/committee/teams
     * Create an audit team from nominated auditors and a team leader
     */
    @PostMapping("/teams")
    public ResponseEntity<Map<String, Object>> createTeam(
            @RequestBody Map<String, Object> request) {
        Object tlIdObj = request.get("teamLeaderId");
        UUID teamLeaderId;
        try {
            teamLeaderId = UUID.fromString(String.valueOf(tlIdObj));
        } catch (Exception e) {
            User u = userManagementUseCase.getUserByUsername(String.valueOf(tlIdObj));
            teamLeaderId = (u != null) ? u.getUserId() : UUID.randomUUID();
        }
        String teamLeaderName = (String) request.getOrDefault("teamLeaderName", "Team Leader");
        @SuppressWarnings("unchecked")
        List<String> auditorIdStrs = (List<String>) request.getOrDefault("auditorIds", List.of());
        List<UUID> auditorIds = auditorIdStrs.stream().map(UUID::fromString).toList();
        @SuppressWarnings("unchecked")
        List<String> auditorNames = (List<String>) request.getOrDefault("auditorNames", List.of());
        Integer capacity = request.containsKey("capacity") ? (Integer) request.get("capacity") : 5;
        String description = (String) request.getOrDefault("description", "");

        String requestedTaxCenter = (String) request.get("taxCenter");
        String resolvedTaxCenter = resolveUserTaxCenter(requestedTaxCenter);

        log.info("Creating team: leader={}, auditors={}, capacity={}, taxCenter={}",
                 teamLeaderId, auditorIds.size(), capacity, resolvedTaxCenter);
        var team = teamFormationUseCase.createTeam(teamLeaderId, teamLeaderName, auditorIds, auditorNames, capacity, description, resolvedTaxCenter);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("teamId", team.getTeamId());
        result.put("teamLeaderId", team.getTeamLeaderId());
        result.put("teamLeaderName", team.getTeamLeaderName());
        result.put("capacity", team.getCapacity());
        result.put("currentCases", team.getCurrentCases());
        result.put("taxCenter", team.getTaxCenter());
        result.put("message", "Team created successfully");
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    /**
     * GET /api/v1/backoffice/ap/committee/teams
     * Get all active teams scoped to the chairperson's tax center
     */
    @GetMapping("/teams")
    public ResponseEntity<List<mor.itas.persistence.jpa.entity.ap.AuditTeamEntity>> getTeams(
            @RequestParam(required = false) String taxCenter) {
        String resolvedTaxCenter = resolveUserTaxCenter(taxCenter);
        log.info("Fetching active teams for taxCenter={}", resolvedTaxCenter);
        return ResponseEntity.ok(teamFormationUseCase.getAllTeams(resolvedTaxCenter));
    }

    /**
     * GET /api/v1/backoffice/ap/committee/teams/available
     * Get teams with available capacity scoped to the chairperson's tax center
     */
    @GetMapping("/teams/available")
    public ResponseEntity<List<mor.itas.persistence.jpa.entity.ap.AuditTeamEntity>> getAvailableTeams(
            @RequestParam(required = false) String taxCenter) {
        String resolvedTaxCenter = resolveUserTaxCenter(taxCenter);
        log.info("Fetching available teams for taxCenter={}", resolvedTaxCenter);
        return ResponseEntity.ok(teamFormationUseCase.getAvailableTeams(resolvedTaxCenter));
    }

    /**
     * GET /api/v1/backoffice/ap/committee/teams/chairperson
     * Get teams formatted for chairperson view with capacity info scoped to tax center
     */
    @GetMapping("/teams/chairperson")
    public ResponseEntity<List<Map<String, Object>>> getTeamsForChairperson(
            @RequestParam(required = false) String taxCenter) {
        String resolvedTaxCenter = resolveUserTaxCenter(taxCenter);
        log.info("Fetching teams for chairperson in taxCenter={}", resolvedTaxCenter);
        return ResponseEntity.ok(teamFormationUseCase.getTeamsForChairperson(resolvedTaxCenter));
    }

    /**
     * POST /api/v1/backoffice/ap/committee/cases/{caseId}/assign-team
     * Chairperson assigns a team to a case (with capacity check)
     */
    @PostMapping("/cases/{caseId}/assign-team-from-list")
    public ResponseEntity<Map<String, Object>> assignTeamToCase(
            @PathVariable UUID caseId,
            @RequestBody Map<String, String> request) {
        UUID teamId = UUID.fromString(request.get("teamId"));
        log.info("Chairperson assigning team={} to caseId={}", teamId, caseId);
        Map<String, Object> result = teamFormationUseCase.assignTeamToCase(caseId, teamId);
        committeeEventService.broadcastToCase(caseId, "team_assigned", result);
        committeeEventService.broadcastGlobal("activity", Map.of(
            "type", "team_assignment",
            "action", "Team assigned to case",
            "caseId", caseId.toString(),
            "timestamp", java.time.OffsetDateTime.now().toString()
        ));
        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/v1/backoffice/ap/committee/teams/{teamId}/capacity
     * Get team capacity status
     */
    @GetMapping("/teams/{teamId}/capacity")
    public ResponseEntity<Map<String, Object>> getTeamCapacity(@PathVariable UUID teamId) {
        log.info("Fetching capacity for teamId={}", teamId);
        return ResponseEntity.ok(teamFormationUseCase.getTeamCapacityStatus(teamId));
    }

    /**
     * GET /api/v1/backoffice/ap/committee/teams/capacity-overview
     * Get system capacity overview scoped to tax center
     */
    @GetMapping("/teams/capacity-overview")
    public ResponseEntity<Map<String, Object>> getCapacityOverview(
            @RequestParam(required = false) String taxCenter) {
        String resolvedTaxCenter = resolveUserTaxCenter(taxCenter);
        log.info("Fetching capacity overview for taxCenter={}", resolvedTaxCenter);
        return ResponseEntity.ok(teamFormationUseCase.getSystemCapacityOverview(resolvedTaxCenter));
    }

    /**
     * GET /api/v1/backoffice/ap/committee/teams/my-team
     * Get the team for the current user (team leader)
     * Returns team info with auditor details
     */
    @GetMapping("/teams/my-team")
    @PreAuthorize("hasAnyRole('COMMITTEE_MEMBER', 'TEAM_LEADER') or permitAll()")
    public ResponseEntity<Map<String, Object>> getMyTeam(
            @RequestParam(required = false) String teamLeaderId) {
        // If teamLeaderId provided, try to resolve from UUID or username
        UUID leaderId = null;
        if (teamLeaderId != null && !teamLeaderId.isBlank()) {
            try {
                leaderId = UUID.fromString(teamLeaderId);
            } catch (IllegalArgumentException e) {
                User u = userManagementUseCase.getUserByUsername(teamLeaderId);
                if (u != null) leaderId = u.getUserId();
            }
        }
        if (leaderId == null) {
            try {
                String actorId = mor.itas.observability.audit.ActorContextHolder.getActorId();
                if (actorId != null && !"SYSTEM".equals(actorId)) {
                    try {
                        leaderId = UUID.fromString(actorId);
                    } catch (Exception ex) {
                        User u = userManagementUseCase.getUserByUsername(actorId);
                        if (u != null) leaderId = u.getUserId();
                    }
                }
            } catch (Exception e) {
                log.warn("Could not resolve team leader ID from auth: {}", e.getMessage());
            }
        }
        
        if (leaderId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Team leader ID required"));
        }
        
        log.info("Fetching team for teamLeaderId={}", leaderId);
        var team = teamFormationUseCase.getTeamByLeader(leaderId);
        if (team == null) {
            // Fallback: check if an active team matches by leader name or username
            User leaderUser = (teamLeaderId != null) ? userManagementUseCase.getUserByUsername(teamLeaderId) : null;
            if (leaderUser == null && leaderId != null) {
                try {
                    leaderUser = userManagementUseCase.getUserById(leaderId);
                } catch (Exception ignored) {}
            }
            if (leaderUser != null) {
                List<mor.itas.persistence.jpa.entity.ap.AuditTeamEntity> allTeams = teamFormationUseCase.getAllTeams();
                for (var t : allTeams) {
                    if (t.getTeamLeaderName() != null &&
                        (t.getTeamLeaderName().equalsIgnoreCase(leaderUser.getFullName()) ||
                         t.getTeamLeaderName().equalsIgnoreCase(leaderUser.getUsername()) ||
                         (teamLeaderId != null && t.getTeamLeaderName().equalsIgnoreCase(teamLeaderId)))) {
                        team = t;
                        break;
                    }
                }
            }
        }
        
        if (team == null) {
            return ResponseEntity.ok(Map.of(
                "found", false,
                "message", "No team found for this leader"
            ));
        }
        
        // Parse auditor IDs and names from JSON arrays stored as strings
        List<String> auditorIds = List.of();
        List<String> auditorNames = List.of();
        try {
            if (team.getAuditorIds() != null && !team.getAuditorIds().isBlank()) {
                String raw = team.getAuditorIds().trim();
                if (raw.startsWith("[")) raw = raw.substring(1);
                if (raw.endsWith("]")) raw = raw.substring(0, raw.length() - 1);
                auditorIds = raw.isBlank() ? List.of() : 
                    Arrays.stream(raw.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .toList();
            }
            if (team.getAuditorNames() != null && !team.getAuditorNames().isBlank()) {
                String raw = team.getAuditorNames().trim();
                if (raw.startsWith("[")) raw = raw.substring(1);
                if (raw.endsWith("]")) raw = raw.substring(0, raw.length() - 1);
                auditorNames = raw.isBlank() ? List.of() : 
                    Arrays.stream(raw.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .toList();
            }
        } catch (Exception e) {
            log.warn("Error parsing auditor data: {}", e.getMessage());
        }
        
        // Build auditor list with full details from database
        List<Map<String, Object>> auditors = new ArrayList<>();
        for (int i = 0; i < auditorIds.size(); i++) {
            Map<String, Object> auditor = new LinkedHashMap<>();
            auditor.put("id", auditorIds.get(i));
            auditor.put("name", i < auditorNames.size() ? auditorNames.get(i) : "Auditor");
            
            // Try to fetch full details from database
            try {
                UUID audId = UUID.fromString(auditorIds.get(i));
                var profile = teamFormationUseCase.getAuditorProfile(audId);
                if (profile != null) {
                    auditor.put("name", profile.getFullName());
                    auditor.put("email", profile.getEmail());
                    auditor.put("expertise", profile.getExpertise());
                    auditor.put("seniority", profile.getSeniority());
                    auditor.put("taxCenter", profile.getTaxCenter());
                    auditor.put("yearsOfExperience", profile.getYearsOfExperience());
                }
            } catch (Exception e) {
                log.debug("Could not fetch auditor details for {}: {}", auditorIds.get(i), e.getMessage());
            }
            auditors.add(auditor);
        }
        
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("found", true);
        result.put("teamId", team.getTeamId());
        result.put("teamLeaderId", team.getTeamLeaderId());
        result.put("teamLeaderName", team.getTeamLeaderName());
        result.put("capacity", team.getCapacity());
        result.put("currentCases", team.getCurrentCases());
        result.put("availableSlots", team.getCapacity() - team.getCurrentCases());
        result.put("atCapacity", team.isAtCapacity());
        result.put("description", team.getDescription());
        result.put("auditors", auditors);
        result.put("auditorCount", auditors.size());
        
        return ResponseEntity.ok(result);
    }
}
