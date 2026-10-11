package mor.itas.domain.service.ca;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import mor.itas.domain.event.ca.*;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

/**
 * CA Domain Event Publisher
 *
 * Single entry-point for publishing all Comprehensive Audit domain events
 * via Spring's ApplicationEventPublisher. Mirrors the pattern used by other
 * modules that fire domain events for JA and TP workflows.
 *
 * All published events are delivered synchronously within the current
 * transaction. Async listeners (e.g. notification service, SSE broadcast)
 * should subscribe using @TransactionalEventListener.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CaDomainEventPublisher {

    private final ApplicationEventPublisher publisher;

    // ── Case lifecycle ─────────────────────────────────────────────────────────
    public void publish(CaCaseOpenedEvent event) {
        log.debug("CA event: CaCaseOpened caseId={}", event.getCaseId());
        publisher.publishEvent(event);
    }

    public void publish(CaPhaseTransitionEvent event) {
        log.debug("CA event: CaPhaseTransition caseId={} {} → {}",
            event.getCaseId(), event.getPreviousPhase(), event.getNewPhase());
        publisher.publishEvent(event);
    }

    public void publish(CaWorkflowRevertedEvent event) {
        log.debug("CA event: CaWorkflowReverted caseId={} {} → {}",
            event.getCaseId(), event.getRevertedFromPhase(), event.getRevertedToPhase());
        publisher.publishEvent(event);
    }

    public void publish(CaCaseClosedEvent event) {
        log.debug("CA event: CaCaseClosed caseId={}", event.getCaseId());
        publisher.publishEvent(event);
    }

    // ── CAAT ──────────────────────────────────────────────────────────────────
    public void publish(CaCaatEligibilityAssessedEvent event) {
        log.debug("CA event: CaatEligibilityAssessed caseId={} eligible={}",
            event.getCaseId(), event.isEligible());
        publisher.publishEvent(event);
    }

    public void publish(CaCaatRunStartedEvent event) {
        log.debug("CA event: CaatRunStarted caseId={} ref={}", event.getCaseId(), event.getRunReference());
        publisher.publishEvent(event);
    }

    public void publish(CaCaatRunCompletedEvent event) {
        log.debug("CA event: CaatRunCompleted caseId={} exceptions={} exposure={}",
            event.getCaseId(), event.getTotalExceptions(), event.getTotalFlaggedExposure());
        publisher.publishEvent(event);
    }

    public void publish(CaCaatExceptionFlaggedEvent event) {
        log.debug("CA event: CaatExceptionFlagged caseId={} risk={}", event.getCaseId(), event.getRiskLevel());
        publisher.publishEvent(event);
    }

    public void publish(CaCaatExceptionReviewedEvent event) {
        log.debug("CA event: CaatExceptionReviewed caseId={} disposition={}",
            event.getCaseId(), event.getDisposition());
        publisher.publishEvent(event);
    }

    // ── Entry Conference ───────────────────────────────────────────────────────
    public void publish(CaEntryConferenceScheduledEvent event) {
        log.debug("CA event: EntryConferenceScheduled caseId={} date={}",
            event.getCaseId(), event.getScheduledDate());
        publisher.publishEvent(event);
    }

    public void publish(CaEntryConferenceConductedEvent event) {
        log.debug("CA event: EntryConferenceConducted caseId={}", event.getCaseId());
        publisher.publishEvent(event);
    }

    public void publish(CaEntryConferenceConfirmedByTaxpayerEvent event) {
        log.debug("CA event: EntryConferenceConfirmedByTaxpayer caseId={}", event.getCaseId());
        publisher.publishEvent(event);
    }

    // ── Documents & Queries ───────────────────────────────────────────────────
    public void publish(CaDocumentRequestedEvent event) {
        log.debug("CA event: DocumentRequested caseId={} doc={}",
            event.getCaseId(), event.getRequestedDocument());
        publisher.publishEvent(event);
    }

    public void publish(CaDocumentReceivedEvent event) {
        log.debug("CA event: DocumentReceived caseId={}", event.getCaseId());
        publisher.publishEvent(event);
    }

    public void publish(CaQuerySheetCreatedEvent event) {
        log.debug("CA event: QuerySheetCreated caseId={}", event.getCaseId());
        publisher.publishEvent(event);
    }

    public void publish(CaQuerySheetResolvedEvent event) {
        log.debug("CA event: QuerySheetResolved caseId={}", event.getCaseId());
        publisher.publishEvent(event);
    }

    // ── Fieldwork ─────────────────────────────────────────────────────────────
    public void publish(CaAssertionRecordedEvent event) {
        log.debug("CA event: AssertionRecorded caseId={} area={} result={}",
            event.getCaseId(), event.getFinancialArea(), event.getVerificationResult());
        publisher.publishEvent(event);
    }

    public void publish(CaBalanceSheetItemAddedEvent event) {
        log.debug("CA event: BalanceSheetItemAdded caseId={} component={} variance={}",
            event.getCaseId(), event.getComponent(), event.getVariance());
        publisher.publishEvent(event);
    }

    public void publish(CaBenchmarkAnalysisAddedEvent event) {
        log.debug("CA event: BenchmarkAnalysisAdded caseId={} ratio={} risk={}",
            event.getCaseId(), event.getRatioName(), event.getRiskLevel());
        publisher.publishEvent(event);
    }

    public void publish(CaThirdPartyMatchAddedEvent event) {
        log.debug("CA event: ThirdPartyMatchAdded caseId={} source={} status={}",
            event.getCaseId(), event.getDataSource(), event.getMatchStatus());
        publisher.publishEvent(event);
    }

    public void publish(CaReconciliationAddedEvent event) {
        log.debug("CA event: ReconciliationAdded caseId={} type={} status={}",
            event.getCaseId(), event.getReconciliationType(), event.getStatus());
        publisher.publishEvent(event);
    }

    public void publish(CaSamplingRecordAddedEvent event) {
        log.debug("CA event: SamplingRecordAdded caseId={} type={} population={}",
            event.getCaseId(), event.getSamplingType(), event.getTargetPopulation());
        publisher.publishEvent(event);
    }

    // ── Findings ──────────────────────────────────────────────────────────────
    public void publish(CaFindingCreatedEvent event) {
        log.debug("CA event: FindingCreated caseId={} ref={} impact={}",
            event.getCaseId(), event.getFindingReference(), event.getTotalTaxImpact());
        publisher.publishEvent(event);
    }

    public void publish(CaFindingConfirmedEvent event) {
        log.debug("CA event: FindingConfirmed caseId={} ref={}", event.getCaseId(), event.getFindingReference());
        publisher.publishEvent(event);
    }

    // ── Working Papers ────────────────────────────────────────────────────────
    public void publish(CaWorkingPaperCreatedEvent event) {
        log.debug("CA event: WorkingPaperCreated caseId={} ref={}",
            event.getCaseId(), event.getPaperReference());
        publisher.publishEvent(event);
    }

    // ── Reports & Approvals ───────────────────────────────────────────────────
    public void publish(CaExecutionReportSubmittedEvent event) {
        log.debug("CA event: ExecutionReportSubmitted caseId={}", event.getCaseId());
        publisher.publishEvent(event);
    }

    public void publish(CaReportApprovedEvent event) {
        log.debug("CA event: ReportApproved caseId={} type={} level={}",
            event.getCaseId(), event.getEntityType(), event.getApprovalLevel());
        publisher.publishEvent(event);
    }

    public void publish(CaReportRejectedEvent event) {
        log.debug("CA event: ReportRejected caseId={} type={} level={}",
            event.getCaseId(), event.getEntityType(), event.getRejectionLevel());
        publisher.publishEvent(event);
    }

    public void publish(CaDraftReportSubmittedEvent event) {
        log.debug("CA event: DraftReportSubmitted caseId={} ref={}",
            event.getCaseId(), event.getReportReference());
        publisher.publishEvent(event);
    }

    public void publish(CaDraftReportFinalizedEvent event) {
        log.debug("CA event: DraftReportFinalized caseId={} ref={}",
            event.getCaseId(), event.getReportReference());
        publisher.publishEvent(event);
    }

    public void publish(CaReportDispatchedToTaxpayerEvent event) {
        log.debug("CA event: ReportDispatchedToTaxpayer caseId={} objectionDays={}",
            event.getCaseId(), event.getObjectionWindowDays());
        publisher.publishEvent(event);
    }

    // ── Exit Conference ───────────────────────────────────────────────────────
    public void publish(CaExitConferenceScheduledEvent event) {
        log.debug("CA event: ExitConferenceScheduled caseId={} date={}",
            event.getCaseId(), event.getScheduledDate());
        publisher.publishEvent(event);
    }

    public void publish(CaExitConferenceConductedEvent event) {
        log.debug("CA event: ExitConferenceConducted caseId={} signed={}",
            event.getCaseId(), event.isSignedByTaxpayer());
        publisher.publishEvent(event);
    }

    // ── Assessment Notice ─────────────────────────────────────────────────────
    public void publish(CaAssessmentNoticeGeneratedEvent event) {
        log.debug("CA event: AssessmentNoticeGenerated caseId={} notice={} total={}",
            event.getCaseId(), event.getNoticeNumber(), event.getTotalAssessmentDue());
        publisher.publishEvent(event);
    }

    public void publish(CaAssessmentNoticeIssuedEvent event) {
        log.debug("CA event: AssessmentNoticeIssued caseId={} notice={}",
            event.getCaseId(), event.getNoticeNumber());
        publisher.publishEvent(event);
    }

    public void publish(CaMultiZoneAllocationAddedEvent event) {
        log.debug("CA event: MultiZoneAllocationAdded caseId={} zone={}",
            event.getCaseId(), event.getZoneName());
        publisher.publishEvent(event);
    }

    // ── Taxpayer Responses ────────────────────────────────────────────────────
    public void publish(CaTaxpayerObjectionReceivedEvent event) {
        log.debug("CA event: TaxpayerObjectionReceived caseId={} notice={}",
            event.getCaseId(), event.getNoticeNumber());
        publisher.publishEvent(event);
    }

    public void publish(CaTaxpayerSignedReportEvent event) {
        log.debug("CA event: TaxpayerSignedReport caseId={}", event.getCaseId());
        publisher.publishEvent(event);
    }

    // ── Fraud ─────────────────────────────────────────────────────────────────
    public void publish(CaFraudReferralTriggeredEvent event) {
        log.warn("CA event: FraudReferralTriggered caseId={} source={} indicators={}",
            event.getCaseId(), event.getTriggerSource(), event.getFraudIndicators());
        publisher.publishEvent(event);
    }
}
