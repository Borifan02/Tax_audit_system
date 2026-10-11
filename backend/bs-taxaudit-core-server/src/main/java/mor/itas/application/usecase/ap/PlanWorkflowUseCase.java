package mor.itas.application.usecase.ap;

import mor.itas.domain.model.ap.AnnualAuditPlan;
import mor.itas.domain.service.ap.PlanStatusTransitionService;
import mor.itas.domain.service.ap.RegionalFeedbackService;
import mor.itas.application.port.inboundport.ap.PlanWorkflowPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

/**
 * Plan Workflow Use Case
 * 
 * Implements PlanWorkflowPort inbound interface.
 * Orchestrates domain services for plan status transitions and feedback workflows.
 * 
 * Hexagonal/DDD: Implements inbound port, delegates to domain services via outbound ports
 */
@Service
@RequiredArgsConstructor
@Transactional
public class PlanWorkflowUseCase implements PlanWorkflowPort {

    private final PlanStatusTransitionService planStatusService;
    private final RegionalFeedbackService regionalFeedbackService;

    // ==================== PLAN STATUS TRANSITIONS ====================

    public AnnualAuditPlan submitToDirector(UUID planId, String actorId) {
        return planStatusService.submitToDirector(planId, actorId);
    }

    public AnnualAuditPlan approvePlan(UUID planId, String actorId, String comment) {
        return planStatusService.approvePlan(planId, actorId, comment);
    }

    public AnnualAuditPlan requestRevision(UUID planId, String actorId, String comment) {
        return planStatusService.requestRevision(planId, actorId, comment);
    }

    public AnnualAuditPlan sendToRegions(UUID planId, String actorId) {
        return planStatusService.sendToRegions(planId, actorId);
    }

    public AnnualAuditPlan sendAmendmentToPlanningTeam(UUID planId, String actorId, String comment) {
        return planStatusService.sendAmendmentToPlanningTeam(planId, actorId, comment);
    }

    public AnnualAuditPlan submitToSeniorMgmt(UUID planId, String actorId) {
        return planStatusService.submitToSeniorMgmt(planId, actorId);
    }

    public AnnualAuditPlan approveBySenior(UUID planId, String actorId, String comment) {
        return planStatusService.approveBySenior(planId, actorId, comment);
    }

    public AnnualAuditPlan rejectBySenior(UUID planId, String actorId, String comment) {
        return planStatusService.rejectBySenior(planId, actorId, comment);
    }

    public AnnualAuditPlan sendApprovedToRegions(UUID planId, String actorId) {
        return planStatusService.sendApprovedToRegions(planId, actorId);
    }

    public AnnualAuditPlan finalizePlan(UUID planId, String actorId) {
        return planStatusService.finalizePlan(planId, actorId);
    }

    // ==================== REGIONAL FEEDBACK ====================

    public AnnualAuditPlan submitRegionalFeedback(UUID planId, String regionId, String feedbackText, String actorId) {
        return regionalFeedbackService.submitRegionalFeedback(planId, regionId, feedbackText, actorId);
    }

    public void overrideRegionalFeedback(UUID planId, String regionId, String overrideComment, String actorId) {
        regionalFeedbackService.overrideRegionalFeedback(planId, regionId, overrideComment, actorId);
    }

    public AnnualAuditPlan deployToTaxCenters(UUID planId, String regionId, String actorId) {
        return regionalFeedbackService.deployToTaxCenters(planId, regionId, actorId);
    }
}
