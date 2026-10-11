package mor.itas.application.usecase.ap;

import mor.itas.api.dto.response.ap.jac.DashboardMetricsResponse;
import mor.itas.persistence.jpa.entity.ap.CommitteeCaseEntity;
import mor.itas.persistence.jpa.repository.ap.CommitteeCaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Use Case: Get Dashboard Metrics
 * Retrieves summary metrics for committee dashboard
 */
@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GetDashboardMetricsUseCase {
    private final CommitteeCaseRepository caseRepository;
    
    /**
     * Execute: Calculate dashboard metrics (unfiltered - backward compat)
     */
    public DashboardMetricsResponse execute() {
        return execute(null);
    }

    /**
     * Execute: Calculate dashboard metrics filtered by tax center.
     * If taxCenter is null, returns metrics for all cases.
     */
    public DashboardMetricsResponse execute(String taxCenter) {
        long totalCases = caseRepository.countByTaxCenter(taxCenter);
        long pendingVotes = caseRepository.countByStatusAndTaxCenter("PENDING_VOTES", taxCenter);
        long teamAssigned = caseRepository.countByStatusAndTaxCenter("TEAM_ASSIGNED", taxCenter);
        long pendingViability = caseRepository.countByStatusAndTaxCenter("PENDING_VIABILITY", taxCenter);
        long approvedCases = caseRepository.countByStatusAndTaxCenter("APPROVED", taxCenter);
        long rejectedCases = caseRepository.countByStatusAndTaxCenter("REJECTED", taxCenter);
        long overdueCases = caseRepository.findOverdueCasesByTaxCenter(taxCenter).size();
        
        // Find upcoming deadlines (e.g., in the next 7 days)
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime nextSevenDays = now.plusDays(7);
        List<CommitteeCaseEntity> upcomingCases = caseRepository.findByCommitteeDeadlineBetweenAndTaxCenter(now, nextSevenDays, taxCenter);
        List<String> upcomingDeadlines = upcomingCases.stream()
            .map(c -> c.getTaxpayerName() + " (" + c.getCommitteeDeadline().toLocalDate() + ")")
            .collect(Collectors.toList());
        
        // Calculate risk priority distribution
        List<CommitteeCaseEntity> allCases = (taxCenter != null && !taxCenter.isBlank())
            ? caseRepository.searchCases(null, null, null, null, taxCenter, org.springframework.data.domain.PageRequest.of(0, 1000)).getContent()
            : caseRepository.findAll();
        long highThreat = allCases.stream().filter(c -> "HIGH".equals(c.getRiskPriority())).count();
        long mediumThreat = allCases.stream().filter(c -> "MEDIUM".equals(c.getRiskPriority())).count();
        long lowThreat = allCases.stream().filter(c -> "LOW".equals(c.getRiskPriority())).count();
        
        // Calculate office segment distribution
        long ltoCount = allCases.stream().filter(c -> "LARGE".equals(c.getSegment())).count();
        long mtoCount = allCases.stream().filter(c -> "MEDIUM".equals(c.getSegment())).count();
        long stoCount = allCases.stream().filter(c -> "SMALL".equals(c.getSegment())).count();
        
        long totalSegments = ltoCount + mtoCount + stoCount;
        int ltoPercentage = totalSegments > 0 ? (int) ((ltoCount * 100) / totalSegments) : 0;
        int mtoPercentage = totalSegments > 0 ? (int) ((mtoCount * 100) / totalSegments) : 0;
        int stoPercentage = totalSegments > 0 ? (int) ((stoCount * 100) / totalSegments) : 0;
        
        // Build activity stream with recent cases
        List<DashboardMetricsResponse.ActivityStreamItem> activityStream = allCases.stream()
            .sorted(Comparator.comparing(CommitteeCaseEntity::getCreatedDate, Comparator.nullsLast(Comparator.reverseOrder())).thenComparing(CommitteeCaseEntity::getCommitteeDeadline, Comparator.nullsLast(Comparator.reverseOrder())))
            .limit(5)
            .map(c -> DashboardMetricsResponse.ActivityStreamItem.builder()
                .initials(c.getTaxpayerName().substring(0, 1))
                .advisor(c.getCurrentOwnerId() != null ? "Member " + c.getCurrentOwnerId().toString().substring(0, 8) : "Unassigned")
                .action("Processing " + c.getStatus())
                .timestamp(c.getCommitteeDeadline() != null ? c.getCommitteeDeadline().toString() : "N/A")
                .caseReference(c.getTaxpayerName() + " - " + c.getTaxIdNumber())
                .build())
            .collect(Collectors.toList());
        
        return DashboardMetricsResponse.builder()
            .totalCases((int) totalCases)
            .totalPortfolioCases((int) totalCases)
            .pendingVotes((int) pendingVotes)
            .teamAssigned((int) teamAssigned)
            .pendingViability((int) pendingViability)
            .approvedCases((int) approvedCases)
            .rejectedCases((int) rejectedCases)
            .overdueCount((int) overdueCases)
            .averageDecisionDaysRemaining(15.0)
            .upcomingDeadlines(upcomingDeadlines)
            .advisoryVotesPending((int) pendingVotes)
            .criticalSLAWarnings((int) overdueCases)
            .chairpersonAction(DashboardMetricsResponse.ChairpersonActionMetrics.builder()
                .count((int) (approvedCases + rejectedCases))
                .status("Decision")
                .build())
            .riskPriority(DashboardMetricsResponse.RiskPriorityMetrics.builder()
                .highThreat((int) highThreat)
                .mediumThreat((int) mediumThreat)
                .lowThreat((int) lowThreat)
                .totalCases((int) totalCases)
                .build())
            .officeSegment(DashboardMetricsResponse.OfficeSegmentMetrics.builder()
                .ltoPercentage((double) ltoPercentage)
                .ltoDossiers((int) ltoCount)
                .mtoPercentage((double) mtoPercentage)
                .mtoDossiers((int) mtoCount)
                .stoPercentage((double) stoPercentage)
                .stoDossiers((int) stoCount)
                .slaHealthIndex("92")
                .build())
            .activityStream(activityStream)
            .build();
    }
}
