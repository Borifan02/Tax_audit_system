package mor.itas.application.usecase.ap;

import mor.itas.api.dto.request.ap.jac.NominateAuditorRequest;
import mor.itas.api.dto.response.ap.jac.AuditorNominationResponse;
import mor.itas.api.dto.response.ap.jac.AuditorProfileResponse;
import mor.itas.observability.audit.ActorContextHolder;
import mor.itas.persistence.jpa.entity.ap.*;
import mor.itas.persistence.jpa.repository.ap.*;
import mor.itas.persistence.jpa.repository.ap.UserJpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.time.OffsetDateTime;
import java.util.*;

/**
 * Use Case: Team Formation through Auditor Nomination
 * Handles auditor nomination and management of auditor pool
 */
@Component
@RequiredArgsConstructor
@Transactional
@Slf4j
public class TeamFormationUseCase {

    private final AuditorNominationRepository nominationRepository;
    private final CommitteeCaseRepository caseRepository;
    private final AuditTeamRepository auditTeamRepository;
    private final AuditorRepository auditorRepository;
    private final UserJpaRepository userJpaRepository;
    private final ApAuditCaseRepository apCaseRepository;

    public AuditorNominationResponse nominateAuditor(UUID caseId, NominateAuditorRequest request) {
        log.info("Nominating auditor={} for caseId={}, role={}", request.getAuditorId(), caseId, request.getRole());

        CommitteeCaseEntity caseEntity = caseRepository.findById(caseId)
            .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseId));

        UUID memberId;
        try {
            memberId = UUID.fromString(ActorContextHolder.getActorId());
        } catch (Exception e) {
            memberId = UUID.nameUUIDFromBytes("SYSTEM".getBytes());
        }

        // Convert string auditor ID to UUID (supports both UUID strings and seed-data IDs)
        UUID auditorId = toUUID(request.getAuditorId());

        // Determine role: AUDITOR or TEAM_LEADER
        String role = (request.getRole() != null && !request.getRole().isBlank())
            ? request.getRole().toUpperCase() : "AUDITOR";

        AuditorNominationEntity nomination = AuditorNominationEntity.builder()
            .committeeCaseEntity(caseEntity)
            .nominatedAuditorId(auditorId)
            .nominatingMemberId(memberId)
            .role(role)
            .selected(false)
            .justification(request.getJustification())
            .build();

        nomination = nominationRepository.save(nomination);

        String auditorName = resolveAuditorName(auditorId);

        return AuditorNominationResponse.builder()
            .nominationId(nomination.getNominationId())
            .auditorId(nomination.getNominatedAuditorId())
            .auditorName(auditorName)
            .justification(nomination.getJustification())
            .nominatingMemberId(nomination.getNominatingMemberId())
            .nominatedAt(nomination.getNominatedAt())
            .role(role)
            .selected(false)
            .build();
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

    @Transactional(readOnly = true)
    public Page<AuditorNominationResponse> getNominations(UUID caseId, Pageable pageable) {
        log.info("Fetching nominations for caseId={}", caseId);

        CommitteeCaseEntity caseEntity = caseRepository.findById(caseId)
            .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseId));

        List<AuditorNominationEntity> allNoms = nominationRepository.findByCaseIdOrderByNominatedAtAsc(caseId);

        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), allNoms.size());
        List<AuditorNominationResponse> page = start < allNoms.size()
            ? allNoms.subList(start, end).stream().map(this::toNominationResponse).toList()
            : List.of();

        return new PageImpl<>(page, pageable, allNoms.size());
    }

    /**
     * Get all team leader nominations for a case.
     * Used by chairperson to view and select team leaders.
     */
    @Transactional(readOnly = true)
    public List<AuditorNominationResponse> getTeamLeaderNominations(UUID caseId) {
        log.info("Fetching team leader nominations for caseId={}", caseId);
        return nominationRepository.findTeamLeaderNominationsByCaseId(caseId)
            .stream().map(this::toNominationResponse).toList();
    }

    /**
     * Get all auditor nominations (non-team-leader) for a case.
     * Used by team leader to see which auditors were nominated for their team.
     */
    @Transactional(readOnly = true)
    public List<AuditorNominationResponse> getAuditorNominations(UUID caseId) {
        log.info("Fetching auditor nominations for caseId={}", caseId);
        return nominationRepository.findAuditorNominationsByCaseId(caseId)
            .stream().map(this::toNominationResponse).toList();
    }

    /**
     * Chairperson selects a team leader from nominated team leaders.
     * Marks the selected nomination and deselects others.
     */
    public AuditorNominationResponse selectTeamLeader(UUID caseId, UUID nominationId) {
        log.info("Selecting team leader nomination={} for caseId={}", nominationId, caseId);

        CommitteeCaseEntity caseEntity = caseRepository.findById(caseId)
            .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseId));

        // Deselect any previously selected team leader for this case
        List<AuditorNominationEntity> teamLeaderNoms =
            nominationRepository.findTeamLeaderNominationsByCaseId(caseId);
        for (AuditorNominationEntity tlNom : teamLeaderNoms) {
            if (tlNom.getSelected()) {
                tlNom.setSelected(false);
                nominationRepository.save(tlNom);
            }
        }

        // Select the new team leader
        AuditorNominationEntity selectedNom = nominationRepository.findById(nominationId)
            .orElseThrow(() -> new IllegalArgumentException("Nomination not found: " + nominationId));

        if (!"TEAM_LEADER".equals(selectedNom.getRole())) {
            throw new IllegalArgumentException("Selected nomination is not a team leader nomination");
        }

        selectedNom.setSelected(true);
        nominationRepository.save(selectedNom);

        return toNominationResponse(selectedNom);
    }

    /**
     * Team leader assigns an auditor from their nominated team to a specific case.
     */
    public AuditorNominationResponse assignAuditorToCase(UUID caseId, UUID auditorId, UUID teamLeaderId) {
        log.info("Assigning auditor={} to caseId={} by teamLeader={}", auditorId, caseId, teamLeaderId);

        CommitteeCaseEntity caseEntity = caseRepository.findById(caseId)
            .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseId));

        UUID memberId;
        try {
            memberId = UUID.fromString(ActorContextHolder.getActorId());
        } catch (Exception e) {
            memberId = UUID.nameUUIDFromBytes("SYSTEM".getBytes());
        }

        // Create an assignment record (using AUDITOR role with selected=true)
        AuditorNominationEntity assignment = AuditorNominationEntity.builder()
            .committeeCaseEntity(caseEntity)
            .nominatedAuditorId(auditorId)
            .nominatingMemberId(memberId)
            .role("AUDITOR")
            .selected(true)
            .justification("Assigned by team leader to case")
            .build();

        assignment = nominationRepository.save(assignment);

        String auditorName = resolveAuditorName(auditorId);

        return AuditorNominationResponse.builder()
            .nominationId(assignment.getNominationId())
            .auditorId(assignment.getNominatedAuditorId())
            .auditorName(auditorName)
            .justification(assignment.getJustification())
            .nominatingMemberId(assignment.getNominatingMemberId())
            .nominatedAt(assignment.getNominatedAt())
            .role("AUDITOR")
            .selected(true)
            .build();
    }

    /**
     * Remove a nomination (auditor or team leader) from a case.
     * Only allows removal if the nomination is not yet selected.
     */
    public void removeNomination(UUID caseId, UUID nominationId) {
        log.info("Removing nomination={} from caseId={}", nominationId, caseId);

        AuditorNominationEntity nomination = nominationRepository.findById(nominationId)
            .orElseThrow(() -> new IllegalArgumentException("Nomination not found: " + nominationId));

        // Verify it belongs to this case
        if (!nomination.getCommitteeCaseEntity().getCaseId().equals(caseId)) {
            throw new IllegalArgumentException("Nomination does not belong to this case");
        }

        // Don't allow removing a selected team leader
        if (nomination.getSelected()) {
            throw new IllegalStateException("Cannot remove a selected team leader. Deselect first.");
        }

        nominationRepository.delete(nomination);
    }

    /**
     * Check if an auditor has already been nominated for a case.
     */
    @Transactional(readOnly = true)
    public boolean isAlreadyNominated(UUID caseId, UUID auditorId) {
        return nominationRepository.existsByCaseIdAndNominatedAuditorId(caseId, auditorId);
    }

    @Transactional(readOnly = true)
    public AuditorProfileResponse getAuditorProfile(UUID auditorId) {
        log.info("Fetching auditor profile for auditorId={}", auditorId);
        AuditorEntity auditor = auditorRepository.findById(auditorId)
            .orElseThrow(() -> new IllegalArgumentException("Auditor not found: " + auditorId));
        return toProfileResponse(auditor);
    }

    @Transactional(readOnly = true)
    public Page<AuditorProfileResponse> searchAuditors(String expertise, String seniority, String taxCenter, Pageable pageable) {
        log.info("Searching auditors with expertise={}, seniority={}, taxCenter={}", expertise, seniority, taxCenter);

        List<AuditorEntity> filtered = (taxCenter != null && !taxCenter.isBlank())
            ? auditorRepository.searchByExpertiseAndSeniorityAndTaxCenter(expertise, seniority, taxCenter)
            : auditorRepository.searchByExpertiseAndSeniority(expertise, seniority);

        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), filtered.size());
        List<AuditorProfileResponse> page = start < filtered.size()
            ? filtered.subList(start, end).stream().map(this::toProfileResponse).toList()
            : List.of();

        return new PageImpl<>(page, pageable, filtered.size());
    }

    /**
     * Resolve auditor name from repository (with fallback)
     */
    private String resolveAuditorName(UUID auditorId) {
        if (auditorId == null) return "Unknown Auditor";
        return auditorRepository.findById(auditorId)
            .map(a -> a.getFirstName() + " " + a.getLastName())
            .orElse("Unknown Auditor");
    }

    private AuditorNominationResponse toNominationResponse(AuditorNominationEntity nomination) {
        String auditorName = resolveAuditorName(nomination.getNominatedAuditorId());

        return AuditorNominationResponse.builder()
            .nominationId(nomination.getNominationId())
            .auditorId(nomination.getNominatedAuditorId())
            .auditorName(auditorName)
            .justification(nomination.getJustification())
            .nominatingMemberId(nomination.getNominatingMemberId())
            .nominatedAt(nomination.getNominatedAt())
            .role(nomination.getRole())
            .selected(nomination.getSelected())
            .build();
    }

    private AuditorProfileResponse toProfileResponse(AuditorEntity auditor) {
        return AuditorProfileResponse.builder()
            .auditorId(auditor.getAuditorId())
            .firstName(auditor.getFirstName())
            .lastName(auditor.getLastName())
            .expertise(auditor.getExpertise())
            .seniority(auditor.getSeniority())
            .yearsOfExperience(auditor.getYearsOfExperience())
            .taxCenter(auditor.getTaxCenter())
            .build();
    }

    // ═══════════════════════════════════════════════════════════════════
    //  TEAM FORMATION & CAPACITY
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Create an audit team from nominated auditors and a team leader.
     * Called when committee members finalize team formation.
     */
    public AuditTeamEntity createTeam(UUID teamLeaderId, String teamLeaderName,
                                      List<UUID> auditorIds, List<String> auditorNames,
                                      Integer capacity, String description) {
        return createTeam(teamLeaderId, teamLeaderName, auditorIds, auditorNames, capacity, description, null);
    }

    /**
     * Create an audit team scoped to a specific tax center.
     */
    public AuditTeamEntity createTeam(UUID teamLeaderId, String teamLeaderName,
                                      List<UUID> auditorIds, List<String> auditorNames,
                                      Integer capacity, String description, String taxCenter) {
        log.info("Creating team: leader={}, auditors={}, capacity={}, taxCenter={}",
                 teamLeaderId, auditorIds.size(), capacity, taxCenter);

        // Resolve tax center if not provided
        if (taxCenter == null || taxCenter.isBlank()) {
            taxCenter = userJpaRepository.findById(teamLeaderId)
                .map(UserEntity::getAssignedLocation)
                .orElse(null);
        }
        if (taxCenter == null || taxCenter.isBlank()) {
            if (!auditorIds.isEmpty()) {
                taxCenter = auditorRepository.findById(auditorIds.get(0))
                    .map(AuditorEntity::getTaxCenter)
                    .orElse(null);
            }
        }

        // Convert lists to proper JSON arrays
        String auditorIdsJson = auditorIds.stream().map(UUID::toString)
            .collect(java.util.stream.Collectors.joining(", ", "[", "]"));
        String auditorNamesJson = auditorNames.stream()
            .collect(java.util.stream.Collectors.joining(", ", "[", "]"));

        // Check if team leader already has an active team
        AuditTeamEntity existingTeam = auditTeamRepository.findByTeamLeaderIdAndActiveTrue(teamLeaderId);
        if (existingTeam != null) {
            // Update existing team
            existingTeam.setAuditorIds(auditorIdsJson);
            existingTeam.setAuditorNames(auditorNamesJson);
            if (capacity != null) existingTeam.setCapacity(capacity);
            if (description != null) existingTeam.setDescription(description);
            if (taxCenter != null) existingTeam.setTaxCenter(taxCenter);
            return auditTeamRepository.save(existingTeam);
        }

        // Create new team
        AuditTeamEntity team = AuditTeamEntity.builder()
            .teamId(UUID.randomUUID())
            .teamLeaderId(teamLeaderId)
            .teamLeaderName(teamLeaderName)
            .auditorIds(auditorIdsJson)
            .auditorNames(auditorNamesJson)
            .capacity(capacity != null ? capacity : 5)
            .currentCases(0)
            .active(true)
            .description(description)
            .taxCenter(taxCenter)
            .build();

        return auditTeamRepository.save(team);
    }

    public String resolveTeamTaxCenter(AuditTeamEntity team) {
        if (team.getTaxCenter() != null && !team.getTaxCenter().isBlank()) {
            return team.getTaxCenter();
        }
        if (team.getTeamLeaderId() != null) {
            String loc = userJpaRepository.findById(team.getTeamLeaderId())
                .map(UserEntity::getAssignedLocation)
                .orElse(null);
            if (loc != null && !loc.isBlank()) {
                team.setTaxCenter(loc);
                auditTeamRepository.save(team);
                return loc;
            }
        }
        return null;
    }

    private boolean matchesTaxCenter(AuditTeamEntity team, String taxCenter) {
        if (taxCenter == null || taxCenter.isBlank()) return true;
        String teamTc = resolveTeamTaxCenter(team);
        if (teamTc == null || teamTc.isBlank()) return false;
        String normalizedTeamTc = teamTc.trim().toLowerCase().replaceAll("[-_]", "");
        String normalizedTc = taxCenter.trim().toLowerCase().replaceAll("[-_]", "");
        return normalizedTeamTc.equals(normalizedTc);
    }

    /**
     * Get all active teams.
     */
    @Transactional(readOnly = true)
    public List<AuditTeamEntity> getAllTeams() {
        return getAllTeams(null);
    }

    /**
     * Get all active teams scoped to a tax center.
     */
    @Transactional(readOnly = true)
    public List<AuditTeamEntity> getAllTeams(String taxCenter) {
        List<AuditTeamEntity> teams = auditTeamRepository.findByActiveTrue();
        if (taxCenter == null || taxCenter.isBlank()) {
            return teams;
        }
        return teams.stream()
            .filter(t -> matchesTaxCenter(t, taxCenter))
            .toList();
    }

    /**
     * Get teams with available capacity.
     */
    @Transactional(readOnly = true)
    public List<AuditTeamEntity> getAvailableTeams() {
        return getAvailableTeams(null);
    }

    /**
     * Get teams with available capacity scoped to a tax center.
     */
    @Transactional(readOnly = true)
    public List<AuditTeamEntity> getAvailableTeams(String taxCenter) {
        List<AuditTeamEntity> teams = auditTeamRepository.findAvailableTeams();
        if (taxCenter == null || taxCenter.isBlank()) {
            return teams;
        }
        return teams.stream()
            .filter(t -> matchesTaxCenter(t, taxCenter))
            .toList();
    }

    /**
     * Get team by team leader ID.
     */
    @Transactional(readOnly = true)
    public AuditTeamEntity getTeamByLeader(UUID teamLeaderId) {
        return auditTeamRepository.findByTeamLeaderIdAndActiveTrue(teamLeaderId);
    }

    /**
     * Get team summary for chairperson display.
     * Returns teams with their leader info and capacity status.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTeamsForChairperson() {
        return getTeamsForChairperson(null);
    }

    /**
     * Get team summary for chairperson display scoped to a tax center.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTeamsForChairperson(String taxCenter) {
        List<AuditTeamEntity> teams = auditTeamRepository.findByActiveTrue();
        List<Map<String, Object>> result = new ArrayList<>();

        for (AuditTeamEntity team : teams) {
            if (taxCenter != null && !taxCenter.isBlank() && !matchesTaxCenter(team, taxCenter)) {
                continue;
            }
            Map<String, Object> teamInfo = new LinkedHashMap<>();
            teamInfo.put("teamId", team.getTeamId());
            teamInfo.put("teamLeaderId", team.getTeamLeaderId());
            teamInfo.put("teamLeaderName", team.getTeamLeaderName());
            teamInfo.put("auditorIds", team.getAuditorIds());
            teamInfo.put("auditorNames", team.getAuditorNames());
            teamInfo.put("capacity", team.getCapacity());
            teamInfo.put("currentCases", team.getCurrentCases());
            teamInfo.put("availableSlots", team.getCapacity() - team.getCurrentCases());
            teamInfo.put("atCapacity", team.isAtCapacity());
            teamInfo.put("description", team.getDescription());
            teamInfo.put("taxCenter", resolveTeamTaxCenter(team));
            result.add(teamInfo);
        }

        return result;
    }

    /**
     * Chairperson selects a team for a case.
     * Increments the team's case count and checks capacity.
     * @throws IllegalStateException if team is at capacity
     */
    public Map<String, Object> assignTeamToCase(UUID caseId, UUID teamId) {
        log.info("Assigning team={} to caseId={}", teamId, caseId);

        CommitteeCaseEntity caseEntity = caseRepository.findById(caseId)
            .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseId));

        AuditTeamEntity team = auditTeamRepository.findById(teamId)
            .orElseThrow(() -> new IllegalArgumentException("Team not found: " + teamId));

        if (!team.getActive()) {
            throw new IllegalStateException("Team is not active: " + teamId);
        }

        // Validate that a team or team leader is not already assigned to this case
        if (caseEntity.getTeamLeadId() != null || caseEntity.getTeamId() != null) {
            throw new IllegalStateException(
                "A team is already assigned to this case. Re-assignment is not permitted.");
        }

        if (team.isAtCapacity()) {
            throw new IllegalStateException(
                String.format("Team '%s' has reached its capacity limit (%d/%d cases).\n" +
                    "Cannot assign more cases to this team.",
                    team.getTeamLeaderName(), team.getCurrentCases(), team.getCapacity()));
        }

        // Validate tax center: team leader must be from the same tax center as the case
        String caseTaxCenter = caseEntity.getTaxCenter();
        if (caseTaxCenter != null && !caseTaxCenter.isBlank()) {
            userJpaRepository.findById(team.getTeamLeaderId()).ifPresent(tl -> {
                if (tl.getAssignedLocation() != null && !tl.getAssignedLocation().equals(caseTaxCenter)) {
                    throw new IllegalArgumentException(
                        String.format("Team leader tax center (%s) does not match case tax center (%s). " +
                            "A team can only be assigned to cases from their own tax center.",
                            tl.getAssignedLocation(), caseTaxCenter));
                }
            });
        }

        // Increment team's case count
        team.incrementCases();
        auditTeamRepository.save(team);

        // Update case with team assignment and move to WAITING_ASSIGNMENT
        caseEntity.setTeamLeadId(team.getTeamLeaderId());
        caseEntity.setTeamId(team.getTeamId());
        caseEntity.setStatus("WAITING_ASSIGNMENT");
        caseRepository.save(caseEntity);

        // Synchronize with linked AP Audit Case
        java.util.Optional<ApAuditCaseEntity> existingApCase = java.util.Optional.empty();
        if (caseEntity.getOriginalCaseId() != null) {
            existingApCase = apCaseRepository.findById(caseEntity.getOriginalCaseId());
        }
        if (existingApCase.isEmpty() && caseEntity.getCaseCode() != null) {
            existingApCase = apCaseRepository.findByCaseNumber(caseEntity.getCaseCode());
        }
        if (existingApCase.isPresent()) {
            ApAuditCaseEntity apCase = existingApCase.get();
            apCase.setAssignedTeamLeaderId(team.getTeamLeaderId().toString());
            apCase.setStatus("WAITING_ASSIGNMENT");
            apCase.setAssignedAt(OffsetDateTime.now());
            apCase.setUpdatedAt(OffsetDateTime.now());
            apCaseRepository.save(apCase);
            log.info("Synchronized AP case {} with team leader {} (status=WAITING_ASSIGNMENT)",
                apCase.getCaseNumber(), team.getTeamLeaderId());
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("caseId", caseId);
        result.put("teamId", team.getTeamId());
        result.put("teamName", team.getDescription() != null ? team.getDescription() : "Team " + team.getTeamLeaderName());
        result.put("teamLeaderId", team.getTeamLeaderId());
        result.put("teamLeaderName", team.getTeamLeaderName());
        result.put("auditorNames", team.getAuditorNames());
        result.put("teamLeaderName", team.getTeamLeaderName());
        result.put("teamCapacity", team.getCapacity());
        result.put("teamCurrentCases", team.getCurrentCases());
        result.put("availableSlots", team.getCapacity() - team.getCurrentCases());
        result.put("message", String.format("Team '%s' assigned to case. %d/%d slots used.",
            team.getTeamLeaderName(), team.getCurrentCases(), team.getCapacity()));

        return result;
    }

    /**
     * Release a case from a team (decrement case count).
     * Called when a case is completed or reassigned.
     */
    public void releaseTeamFromCase(UUID teamId) {
        log.info("Releasing team={} from a case", teamId);
        AuditTeamEntity team = auditTeamRepository.findById(teamId)
            .orElseThrow(() -> new IllegalArgumentException("Team not found: " + teamId));
        team.decrementCases();
        auditTeamRepository.save(team);
    }

    /**
     * Get team capacity status.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getTeamCapacityStatus(UUID teamId) {
        AuditTeamEntity team = auditTeamRepository.findById(teamId)
            .orElseThrow(() -> new IllegalArgumentException("Team not found: " + teamId));

        Map<String, Object> status = new LinkedHashMap<>();
        status.put("teamId", team.getTeamId());
        status.put("teamLeaderName", team.getTeamLeaderName());
        status.put("capacity", team.getCapacity());
        status.put("currentCases", team.getCurrentCases());
        status.put("availableSlots", team.getCapacity() - team.getCurrentCases());
        status.put("atCapacity", team.isAtCapacity());
        status.put("utilizationPercent",
            team.getCapacity() > 0 ? (team.getCurrentCases() * 100 / team.getCapacity()) : 0);

        return status;
    }

    /**
     * Get system-wide capacity overview.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getSystemCapacityOverview() {
        return getSystemCapacityOverview(null);
    }

    /**
     * Get capacity overview scoped to a tax center.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getSystemCapacityOverview(String taxCenter) {
        List<AuditTeamEntity> allTeams = getAllTeams(taxCenter);
        long atCapacityCount = allTeams.stream().filter(AuditTeamEntity::isAtCapacity).count();

        int totalCapacity = allTeams.stream().mapToInt(AuditTeamEntity::getCapacity).sum();
        int totalCurrentCases = allTeams.stream().mapToInt(AuditTeamEntity::getCurrentCases).sum();

        Map<String, Object> overview = new LinkedHashMap<>();
        overview.put("totalTeams", allTeams.size());
        overview.put("teamsAtCapacity", atCapacityCount);
        overview.put("totalCapacity", totalCapacity);
        overview.put("totalCurrentCases", totalCurrentCases);
        overview.put("availableSlots", totalCapacity - totalCurrentCases);
        overview.put("systemUtilizationPercent",
            totalCapacity > 0 ? (totalCurrentCases * 100 / totalCapacity) : 0);
        if (taxCenter != null && !taxCenter.isBlank()) {
            overview.put("taxCenter", taxCenter);
        }

        return overview;
    }
}
