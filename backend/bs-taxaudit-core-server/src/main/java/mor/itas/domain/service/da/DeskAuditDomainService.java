package mor.itas.domain.service.da;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import mor.itas.domain.event.da.*;
import mor.itas.application.port.outboundport.da.DataAnalyticsPort;
import mor.itas.application.port.outboundport.da.DeskToComprehensiveEscalationPort;
import mor.itas.application.port.outboundport.da.ThirdPartyDataPort;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class DeskAuditDomainService {
    
    private final ApplicationEventPublisher eventPublisher;
    private final ThirdPartyDataPort thirdPartyDataPort;
    private final DataAnalyticsPort dataAnalyticsPort;
    private final DeskToComprehensiveEscalationPort escalationPort;

    public void gatherEvidence(UUID caseId, String tin, String sourceType) {
        log.info("Domain Service: Gathering evidence for case {}", caseId);
        List<String> evidenceRefs = thirdPartyDataPort.fetchEvidence(tin, sourceType);
        for (String ref : evidenceRefs) {
            eventPublisher.publishEvent(new DeskAuditEvidenceGatheredEvent(caseId, sourceType, ref));
        }
    }

    public void runAnalytics(UUID caseId, String tin, List<String> datasets) {
        log.info("Domain Service: Running analytics for case {}", caseId);
        String analyticsRef = dataAnalyticsPort.runAnalytics(caseId, tin, datasets);
        eventPublisher.publishEvent(new DeskAuditEvidenceGatheredEvent(caseId, "ANALYTICS", analyticsRef)); // Reuse or create new event
    }

    public void draftReport(UUID caseId, UUID reportId, String actorId) {
        log.info("Domain Service: Drafted report for case {}", caseId);
        eventPublisher.publishEvent(new DeskAuditReportDraftedEvent(caseId, reportId, actorId));
    }

    public void approveReport(UUID caseId, UUID reportId, String actorId, boolean bigIssueFound) {
        log.info("Domain Service: Approved report for case {}, big issue: {}", caseId, bigIssueFound);
        eventPublisher.publishEvent(new DeskAuditReportApprovedEvent(caseId, reportId, actorId, bigIssueFound));
    }

    public UUID escalateToComprehensive(UUID caseId, String tin, List<String> evidence, String narrative, String directorId) {
        log.info("Domain Service: Escalating case {} to Comprehensive Audit", caseId);
        DeskToComprehensiveEscalationPort.EscalationRequest req = new DeskToComprehensiveEscalationPort.EscalationRequest(
                caseId, tin, evidence, narrative, directorId
        );
        UUID newCaseId = escalationPort.openComprehensiveCase(req);
        eventPublisher.publishEvent(new DeskAuditEscalatedToComprehensiveEvent(caseId, newCaseId, directorId, narrative));
        return newCaseId;
    }
}
