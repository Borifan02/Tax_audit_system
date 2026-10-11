package mor.itas.application.usecase.ap;

import mor.itas.application.port.inboundport.ap.GetAmendmentFeedbackPort;
import mor.itas.application.port.outboundport.repositoryport.ap.AnnualAuditPlanRepository;
import mor.itas.domain.model.ap.AnnualAuditPlan;
import mor.itas.domain.model.ap.PlanStatus;
import mor.itas.persistence.jpa.entity.ap.RegionalFeedbackEntity;
import mor.itas.persistence.jpa.repository.ap.RegionalFeedbackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * GetAmendmentFeedbackUseCase - Use Case
 * 
 * Implements GetAmendmentFeedbackPort.
 * 
 * Retrieves amendment request from Director.
 * 
 * Flow:
 * 1. Validate plan exists
 * 2. Validate plan is in proper state
 * 3. Retrieve amendment request with regional feedback from database
 * 4. Return to Planning Team
 */
@Service
@RequiredArgsConstructor
public class GetAmendmentFeedbackUseCase implements GetAmendmentFeedbackPort {
    
    private final AnnualAuditPlanRepository repository;
    private final RegionalFeedbackRepository regionalFeedbackRepository;
    private final ObjectMapper objectMapper;
    
    @Override
    public Map<String, Object> getAmendmentFeedback(UUID planId) {
        // Load plan
        AnnualAuditPlan plan = repository.findById(planId)
            .orElseThrow(() -> new IllegalArgumentException("Plan not found: " + planId));
        
        // Validate plan status
        PlanStatus status = plan.getStatus();
        if (!isValidStatusForAmendment(status.name())) {
            throw new IllegalStateException(
                "Cannot get amendment feedback for plan in status: " + status + ". " +
                "Plan must be in AMENDMENT_REQUIRED status."
            );
        }
        
        // Retrieve amendment feedback from database
        Map<String, Object> amendmentFeedback = retrieveAmendmentFeedback(planId);
        
        return amendmentFeedback;
    }
    
    /**
     * Check if plan is in valid status for amendment
     */
    private boolean isValidStatusForAmendment(String status) {
        return "AMENDMENT_REQUIRED".equals(status) ||
               "FEEDBACK_COLLECTED".equals(status);
    }
    
    /**
     * Retrieve amendment feedback from database
     * 
     * Gets all regional feedback that triggered amendment request
     */
    private Map<String, Object> retrieveAmendmentFeedback(UUID planId) {
        Map<String, Object> feedback = new HashMap<>();
        
        // Get all regional feedback from database for this plan
        List<RegionalFeedbackEntity> allRegionalFeedback = 
            regionalFeedbackRepository.findByPlanId(planId);
        
        // Build amendment request with all regional feedback
        feedback.put("planId", planId.toString());
        feedback.put("amendmentRound", 1); // Could be incremented for subsequent amendments
        feedback.put("directorMessage", 
            "Please amend plan based on regional capacity constraints below");
        
        // Include all regional feedback
        Map<String, Object> regionalFeedbackSummary = new HashMap<>();
        for (RegionalFeedbackEntity entity : allRegionalFeedback) {
            String regionId = entity.getRegionId();
            
            // Parse feedback JSON
            Map<String, Map<String, Object>> regionFeedback = new HashMap<>();
            try {
                regionFeedback = objectMapper.readValue(entity.getFeedbackText(), 
                    objectMapper.getTypeFactory().constructMapType(Map.class, String.class, Map.class));
            } catch (Exception e) {
                // Handle parsing error
                regionFeedback = new HashMap<>();
            }
            
            // Create summary for this region
            Map<String, Object> regionSummary = new HashMap<>();
            regionSummary.put("regionName", getRegionName(regionId));
            regionSummary.put("feedback", regionFeedback);
            regionSummary.put("submittedBy", entity.getSubmittedBy());
            regionSummary.put("submittedAt", entity.getSubmittedAt());
            
            // Calculate totals
            long totalRequested = 0L;
            long totalCapacity = 0L;
            
            for (Map<String, Object> auditTypeFeedback : regionFeedback.values()) {
                if (auditTypeFeedback.containsKey("totalRequested")) {
                    Object tr = auditTypeFeedback.get("totalRequested");
                    if (tr instanceof Number) {
                        totalRequested += ((Number) tr).longValue();
                    }
                }
                if (auditTypeFeedback.containsKey("totalCapacity")) {
                    Object tc = auditTypeFeedback.get("totalCapacity");
                    if (tc instanceof Number) {
                        totalCapacity += ((Number) tc).longValue();
                    }
                }
            }
            
            regionSummary.put("totalRequested", totalRequested);
            regionSummary.put("totalCapacity", totalCapacity);
            regionSummary.put("totalGap", totalCapacity - totalRequested);
            regionSummary.put("gapPercentage", totalRequested > 0 ? 
                (double) (totalRequested - totalCapacity) / totalRequested * 100 : 0.0);
            
            regionalFeedbackSummary.put(regionId, regionSummary);
        }
        
        feedback.put("regionalFeedback", regionalFeedbackSummary);
        feedback.put("directorComment", 
            "Review regional feedback and adjust plan allocations accordingly. " +
            "All amendments must maintain strategic balance while accommodating regional constraints.");
        
        return feedback;
    }
    
    /**
     * Get region name from region code
     */
    private String getRegionName(String regionId) {
        return switch (regionId) {
            case "AA" -> "Addis Ababa";
            case "AB" -> "Oromia";
            case "BA" -> "Amhara";
            case "BB" -> "SNNP";
            case "CA" -> "Tigray";
            case "SO" -> "Somali";
            default -> "Region " + regionId;
        };
    }
}
