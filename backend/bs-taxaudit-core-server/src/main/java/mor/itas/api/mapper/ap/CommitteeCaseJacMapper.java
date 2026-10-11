package mor.itas.api.mapper.ap;

import mor.itas.api.dto.response.ap.jac.CommitteeCaseResponse;
import mor.itas.persistence.jpa.entity.ap.CommitteeCaseEntity;
import mor.itas.persistence.jpa.repository.ap.UserJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Mapper for committee case entity to response DTO
 */
@Component
@RequiredArgsConstructor
public class CommitteeCaseJacMapper {

    private final UserJpaRepository userRepository;
    private final mor.itas.persistence.jpa.repository.ap.AuditTeamRepository auditTeamRepository;
    
    public CommitteeCaseResponse toResponse(CommitteeCaseEntity entity) {
        return toResponse(entity, null);
    }

    /**
     * Map entity to response DTO, optionally computing userOwnsCase.
     * @param entity     the JPA entity
     * @param currentUserId the currently authenticated user's ID (may be null)
     */
    public CommitteeCaseResponse toResponse(CommitteeCaseEntity entity, java.util.UUID currentUserId) {
        if (entity == null) {
            return null;
        }

        boolean owns = currentUserId != null && currentUserId.equals(entity.getCurrentOwnerId());

        // Resolve assigned team
        mor.itas.persistence.jpa.entity.ap.AuditTeamEntity assignedTeam = null;
        if (entity.getTeamId() != null) {
            assignedTeam = auditTeamRepository.findById(entity.getTeamId()).orElse(null);
        }
        if (assignedTeam == null && entity.getTeamLeadId() != null) {
            assignedTeam = auditTeamRepository.findByTeamLeaderIdAndActiveTrue(entity.getTeamLeadId());
        }

        java.util.UUID resolvedTeamId = entity.getTeamId();
        String teamName = null;
        String teamDescription = null;
        java.util.List<String> teamAuditors = java.util.Collections.emptyList();
        Integer teamCapacity = null;
        Integer teamCurrentCases = null;

        if (assignedTeam != null) {
            resolvedTeamId = assignedTeam.getTeamId();
            teamName = assignedTeam.getDescription() != null && !assignedTeam.getDescription().isBlank()
                ? assignedTeam.getDescription()
                : "Joint Audit Team (" + assignedTeam.getTeamLeaderName() + ")";
            teamDescription = assignedTeam.getDescription();
            teamCapacity = assignedTeam.getCapacity();
            teamCurrentCases = assignedTeam.getCurrentCases();
            teamAuditors = parseAuditorNames(assignedTeam.getAuditorNames());
        }

        String teamLeadName = resolveUserName(entity.getTeamLeadId());
        if ((teamLeadName == null || teamLeadName.isBlank() || "Team Lead".equals(teamLeadName)) && assignedTeam != null) {
            teamLeadName = assignedTeam.getTeamLeaderName();
        }

        return CommitteeCaseResponse.builder()
            .committeeCaseId(entity.getCaseId())
            .id(entity.getCaseId())
            .caseCode(entity.getCaseCode())
            .taxpayerName(entity.getTaxpayerName())
            .taxIdNumber(entity.getTaxIdNumber())
            .segment(entity.getSegment())
            .industry(entity.getIndustry())
            .description(entity.getDescription())
            .businessType(entity.getBusinessType())
            .totalAmount(entity.getTotalAmount())
            .assessmentScore(entity.getAssessmentScore())
            .address(entity.getAddress())
            .city(entity.getCity())
            .region(entity.getRegion())
            .taxCenter(entity.getTaxCenter())
            .complianceIssues(entity.getComplianceIssues())
            .riskIndicators(
                entity.getRiskIndicators() != null
                    ? entity.getRiskIndicators().stream()
                        .map(m -> mor.itas.api.dto.response.ap.jac.RiskIndicatorResponse.builder()
                            .id((String) m.get("id"))
                            .name((String) m.get("name"))
                            .weight(m.get("weight") instanceof Number ? ((Number) m.get("weight")).doubleValue() : null)
                            .description((String) m.get("description"))
                            .source((String) m.get("source"))
                            .severity((String) m.get("severity"))
                            .build())
                        .toList()
                    : null
            )
            .representatives(
                entity.getRepresentatives() != null
                    ? entity.getRepresentatives().stream()
                        .map(m -> mor.itas.api.dto.response.ap.jac.RepresentativeResponse.builder()
                            .name(m.get("name"))
                            .title(m.get("title"))
                            .build())
                        .toList()
                    : null
            )
            .riskScore(entity.getRiskScore())
            .riskPriority(entity.getRiskPriority())
            .status(entity.getStatus())
            .createdDate(entity.getCreatedDate())
            .committeeDeadline(entity.getCommitteeDeadline())
            .extendedDeadline(entity.getExtendedDeadline())
            .extensionCount(entity.getExtensionCount())
            .currentOwnerId(entity.getCurrentOwnerId())
            .teamLeadId(entity.getTeamLeadId())
            .teamLeadName(teamLeadName)
            .userOwnsCase(owns)
            .teamId(resolvedTeamId)
            .teamName(teamName)
            .teamDescription(teamDescription)
            .teamAuditors(teamAuditors)
            .teamCapacity(teamCapacity)
            .teamCurrentCases(teamCurrentCases)
            .decision(entity.getDecision())
            .decisionDate(entity.getDecisionDate())
            .decisionReason(entity.getDecisionReason())
            .build();
    }

    private java.util.List<String> parseAuditorNames(String val) {
        if (val == null || val.isBlank()) return java.util.Collections.emptyList();
        String cleaned = val.replaceAll("^\\[|\\]$", "").trim();
        if (cleaned.isEmpty()) return java.util.Collections.emptyList();
        return java.util.Arrays.stream(cleaned.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .toList();
    }

    private String resolveUserName(java.util.UUID userId) {
        if (userId == null) return null;
        return userRepository.findById(userId)
            .map(u -> u.getFullName())
            .orElse(null);
    }
}
