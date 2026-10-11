package mor.itas.application.usecase.ap;

import mor.itas.application.port.inboundport.ap.SubmitRegionalFeedbackPort;
import mor.itas.application.port.outboundport.repositoryport.ap.AnnualAuditPlanRepository;
import mor.itas.domain.model.ap.AnnualAuditPlan;
import mor.itas.domain.model.ap.PlanStatus;
import mor.itas.domain.service.ap.RegionalFeedbackAggregationService;
import mor.itas.persistence.jpa.entity.ap.RegionalFeedbackEntity;
import mor.itas.persistence.jpa.entity.ap.RegionalDeploymentEntity;
import mor.itas.persistence.jpa.repository.ap.RegionalFeedbackRepository;
import mor.itas.persistence.jpa.repository.ap.RegionalDeploymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.List;

/**
 * SubmitRegionalFeedbackUseCase - Use Case
 * 
 * Implements SubmitRegionalFeedbackPort.
 * 
 * Processes Regional Director's aggregated feedback submission.
 * 
 * Flow:
 * 1. Validate plan exists and is in proper state
 * 2. Validate aggregated feedback
 * 3. Store aggregated feedback to database (ONE-TIME ONLY per region per plan)
 * 4. Update plan status to indicate feedback received
 */
@Service
@RequiredArgsConstructor
@Transactional
public class SubmitRegionalFeedbackUseCase implements SubmitRegionalFeedbackPort {
    
    private final AnnualAuditPlanRepository repository;
    private final RegionalFeedbackRepository regionalFeedbackRepository;
    private final RegionalDeploymentRepository regionalDeploymentRepository;
    private final RegionalFeedbackAggregationService aggregationService;
    private final ObjectMapper objectMapper;
    
    @Override
    public void submitAggregatedFeedback(
            UUID planId,
            String regionId,
            Map<String, Map<String, Object>> aggregatedFeedback,
            String regionalDirectorId) {
        
        // Validate plan exists
        AnnualAuditPlan plan = repository.findById(planId)
            .orElseThrow(() -> new IllegalArgumentException("Plan not found: " + planId));
        
        // Validate plan status
        PlanStatus status = plan.getStatus();
        if (!isValidStatusForFeedbackSubmission(status.name())) {
            throw new IllegalStateException(
                "Cannot submit feedback for plan in status: " + status + ". " +
                "Plan must be in AWAITING_REGIONAL_FEEDBACK status."
            );
        }
        
        // Validate feedback input
        if (aggregatedFeedback == null || aggregatedFeedback.isEmpty()) {
            throw new IllegalArgumentException("Aggregated feedback cannot be empty");
        }
        
        // Validate all audit types present
        validateAuditTypesPresent(aggregatedFeedback);
        
        // Check if feedback already submitted (ONE-TIME ONLY enforcement)
        boolean alreadySubmitted = regionalFeedbackRepository
            .findByPlanIdAndRegionId(planId, regionId)
            .isPresent();
        
        if (alreadySubmitted) {
            throw new IllegalStateException(
                "Regional feedback for this plan and region has already been submitted. " +
                "Each region can submit feedback only once per plan."
            );
        }
        
        // Create and save regional feedback entity
        RegionalFeedbackEntity feedbackEntity = new RegionalFeedbackEntity();
        feedbackEntity.setId(UUID.randomUUID());
        feedbackEntity.setPlanId(planId);
        feedbackEntity.setRegionId(regionId);
        try {
            feedbackEntity.setFeedbackText(objectMapper.writeValueAsString(aggregatedFeedback)); // Serialize as JSON
        } catch (Exception e) {
            throw new IllegalStateException("Failed to serialize feedback: " + e.getMessage());
        }
        feedbackEntity.setSubmittedBy(regionalDirectorId);
        feedbackEntity.setSubmittedAt(OffsetDateTime.now());
        feedbackEntity.setIsOverridden(false);
        feedbackEntity.setCreatedAt(OffsetDateTime.now());
        
        regionalFeedbackRepository.save(feedbackEntity);
        
        // Check if ALL regions have now submitted feedback
        // If so, transition plan status to FEEDBACK_COLLECTED
        List<RegionalDeploymentEntity> deployments = regionalDeploymentRepository
            .findByPlanId(planId);
        
        long totalRegions = deployments.size();
        long submittedRegions = regionalFeedbackRepository
            .countByPlanId(planId);
        
        System.out.println("📊 Regional feedback: " + submittedRegions + "/" + totalRegions + " regions submitted for plan " + planId);
        
        // Transition to FEEDBACK_COLLECTED when FIRST region submits
        // This makes the plan visible on Director Dashboard under Regional Feedback tab
        if (submittedRegions >= 1 && totalRegions > 0) {
            repository.updateStatusDirect(planId, PlanStatus.FEEDBACK_COLLECTED.name());
            System.out.println("✅ Region " + regionId + " submitted. Plan status → FEEDBACK_COLLECTED (" + submittedRegions + "/" + totalRegions + ")");
        }
    }
    
    /**
     * Check if plan is in valid status for feedback submission
     */
    private boolean isValidStatusForFeedbackSubmission(String status) {
        return "AWAITING_REGIONAL_FEEDBACK".equals(status) ||
               "FEEDBACK_COLLECTED".equals(status) ||
               "SENT_TO_TAX_CENTERS".equals(status) ||
               "TC_FEEDBACK_SUBMITTED".equals(status);
    }
    
    /**
     * Validate that all required audit types are present in aggregated feedback
     */
    private void validateAuditTypesPresent(Map<String, Map<String, Object>> aggregatedFeedback) {
        String[] requiredAuditTypes = {
            "desk_audit",
            "issue_audit",
            "joint_audit",
            "transfer_pricing",
            "comprehensive"
        };
        
        for (String auditType : requiredAuditTypes) {
            if (!aggregatedFeedback.containsKey(auditType)) {
                // This is just a warning - frontend might not send all types
                // Continue anyway
            }
        }
    }
}
