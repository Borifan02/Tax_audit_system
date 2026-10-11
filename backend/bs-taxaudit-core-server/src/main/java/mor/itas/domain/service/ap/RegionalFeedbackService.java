package mor.itas.domain.service.ap;

import mor.itas.domain.model.ap.AnnualAuditPlan;
import mor.itas.domain.model.ap.PlanStatus;
import mor.itas.domain.model.ap.RegionalFeedback;
import mor.itas.domain.model.ap.RegionalDeployment;
import mor.itas.application.port.outboundport.repositoryport.ap.AnnualAuditPlanRepository;
import mor.itas.persistence.jpa.entity.ap.ApRegionalFeedbackEntity;
import mor.itas.persistence.jpa.entity.ap.ApRegionalDeploymentEntity;
import mor.itas.persistence.jpa.entity.ap.ApPlanTimelineEntity;
import mor.itas.persistence.jpa.repository.ap.ApRegionalFeedbackRepository;
import mor.itas.persistence.jpa.repository.ap.ApRegionalDeploymentRepository;
import mor.itas.persistence.jpa.repository.ap.ApPlanTimelineRepository;
import mor.itas.persistence.mapper.ap.RegionalFeedbackMapper;
import mor.itas.persistence.mapper.ap.RegionalDeploymentMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * RegionalFeedbackService - Handles regional feedback collection and deployment
 * Extracted from frontend AppContext business logic
 */
@Service
@RequiredArgsConstructor
@Transactional
public class RegionalFeedbackService {

    private final ApRegionalFeedbackRepository feedbackRepository;
    private final ApRegionalDeploymentRepository deploymentRepository;
    private final ApPlanTimelineRepository timelineRepository;
    private final AnnualAuditPlanRepository planRepository;
    private final RegionalFeedbackMapper feedbackMapper;
    private final RegionalDeploymentMapper deploymentMapper;

    // List of all regions (extracted from frontend constants)
    private static final List<String> ALL_REGIONS = List.of(
        "ADDIS_ABABA",
        "DIRE_DAWA",
        "HAWASSA",
        "BAHIR_DAR"
    );

    /**
     * Submit regional feedback for a plan
     * Aggregates feedback and updates plan status if all regions have submitted
     */
    public AnnualAuditPlan submitRegionalFeedback(UUID planId, String regionId, String feedbackText, String actorId) {
        // Verify plan exists
        AnnualAuditPlan plan = planRepository.findById(planId)
            .orElseThrow(() -> new IllegalArgumentException("Plan not found: " + planId));

        if (!plan.getStatus().equals(PlanStatus.AWAITING_REGIONAL_FEEDBACK)) {
            throw new IllegalStateException("Plan must be in AWAITING_REGIONAL_FEEDBACK status. Current: " + plan.getStatus());
        }

        // Store feedback for this region
        ApRegionalFeedbackEntity feedback = new ApRegionalFeedbackEntity(planId, regionId);
        feedback.setFeedbackText(feedbackText);
        feedback.setSubmittedBy(actorId);
        feedback.setSubmittedAt(OffsetDateTime.now());
        feedbackRepository.save(feedback);

        // Check if ALL regions have submitted feedback
        List<ApRegionalFeedbackEntity> allFeedback = feedbackRepository.findByPlanId(planId);
        boolean allRegionsSubmitted = ALL_REGIONS.stream()
            .allMatch(region -> allFeedback.stream()
                .anyMatch(f -> f.getRegionId().equals(region)));

        // If all regions submitted, update plan status
        if (allRegionsSubmitted) {
            plan.setStatus(PlanStatus.FEEDBACK_COLLECTED);
            plan = planRepository.save(plan);
            addTimelineEntry(planId, "FEEDBACK_COLLECTED", actorId, 
                           "All regional feedback collected - ready for director review");
        } else {
            addTimelineEntry(planId, "AWAITING_REGIONAL_FEEDBACK", actorId,
                           "Regional feedback received from " + regionId);
        }

        return plan;
    }

    /**
     * Director overrides regional feedback
     * Used by director to modify allocations from a specific region
     */
    public void overrideRegionalFeedback(UUID planId, String regionId, String overrideComment, String actorId) {
        ApRegionalFeedbackEntity feedback = feedbackRepository.findByPlanIdAndRegionId(planId, regionId)
            .orElseThrow(() -> new IllegalArgumentException("Feedback not found for plan: " + planId + ", region: " + regionId));

        feedback.setIsOverridden(true);
        feedback.setOverrideComment(overrideComment);
        feedback.setOverrideBy(actorId);
        feedback.setOverrideAt(OffsetDateTime.now());
        feedbackRepository.save(feedback);

        addTimelineEntry(planId, "FEEDBACK_COLLECTED", actorId,
                       "Director overrode " + regionId + " feedback: " + overrideComment);
    }

    /**
     * Regional director deploys approved plan to their tax centers
     * Status: APPROVED_TO_REGIONS → FINALIZED (when all regions deployed)
     */
    public AnnualAuditPlan deployToTaxCenters(UUID planId, String regionId, String actorId) {
        // Verify plan exists
        AnnualAuditPlan plan = planRepository.findById(planId)
            .orElseThrow(() -> new IllegalArgumentException("Plan not found: " + planId));

        if (!plan.getStatus().equals(PlanStatus.APPROVED_TO_REGIONS)) {
            throw new IllegalStateException("Plan must be in APPROVED_TO_REGIONS status. Current: " + plan.getStatus());
        }

        // Record deployment
        ApRegionalDeploymentEntity deployment = new ApRegionalDeploymentEntity(planId, regionId, actorId);
        deploymentRepository.save(deployment);

        // Check if ALL regions have deployed
        int totalDeployments = deploymentRepository.countByPlanId(planId);
        boolean allRegionsDeployed = totalDeployments >= ALL_REGIONS.size();

        // If all regions deployed, finalize the plan
        if (allRegionsDeployed) {
            plan.setStatus(PlanStatus.FINALIZED);
            plan = planRepository.save(plan);
            addTimelineEntry(planId, "FINALIZED", actorId,
                           "All regions deployed - Plan finalized");
        } else {
            addTimelineEntry(planId, "APPROVED_TO_REGIONS", actorId,
                           regionId + " deployed to tax centers (" + totalDeployments + "/" + ALL_REGIONS.size() + ")");
        }

        return plan;
    }

    /**
     * Get all feedback for a plan
     */
    public List<RegionalFeedback> getFeedbackByPlanId(UUID planId) {
        return feedbackRepository.findByPlanId(planId).stream()
            .map(feedbackMapper::toDomain)
            .toList();
    }

    /**
     * Get all deployments for a plan
     */
    public List<RegionalDeployment> getDeploymentsByPlanId(UUID planId) {
        return deploymentRepository.findByPlanId(planId).stream()
            .map(deploymentMapper::toDomain)
            .toList();
    }

    /**
     * Check if a specific region has deployed
     */
    public boolean isRegionDeployed(UUID planId, String regionId) {
        return deploymentRepository.findByPlanIdAndRegionId(planId, regionId).isPresent();
    }

    /**
     * Helper method: Add timeline entry
     */
    private void addTimelineEntry(UUID planId, String status, String actorId, String comment) {
        ApPlanTimelineEntity entry = new ApPlanTimelineEntity(
            planId,
            status,
            actorId,
            comment,
            OffsetDateTime.now()
        );
        timelineRepository.save(entry);
    }
}
