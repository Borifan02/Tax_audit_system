package mor.itas.domain.service.ap;

import mor.itas.domain.model.ap.TaxCenterFeedback;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * TaxCenterFeedbackService - Domain Service
 * 
 * Implements business logic for tax center feedback submission.
 * 
 * Responsibilities:
 * 1. Validate feedback inputs
 * 2. Calculate capacity gaps
 * 3. Create feedback domain objects
 * 4. Aggregate feedback by audit type
 */
@Component
public class TaxCenterFeedbackService {
    
    /**
     * Validate feedback submission
     * 
     * @param requestedCount what was requested by Regional Director
     * @param acceptedCount what Tax Center can actually do
     * @param justification why they can't do more
     * @throws IllegalArgumentException if validation fails
     */
    public void validateFeedbackSubmission(
            Integer requestedCount,
            Integer acceptedCount,
            String justification) {
        
        if (requestedCount == null || requestedCount < 0) {
            throw new IllegalArgumentException("Requested count must be >= 0");
        }
        
        if (acceptedCount == null || acceptedCount < 0) {
            throw new IllegalArgumentException("Accepted count must be >= 0");
        }
        
        if (acceptedCount > requestedCount) {
            throw new IllegalArgumentException(
                "Accepted count (" + acceptedCount + ") cannot exceed " +
                "requested count (" + requestedCount + ")"
            );
        }
        
        if (justification == null || justification.trim().isEmpty()) {
            throw new IllegalArgumentException("Justification is required");
        }
    }
    
    /**
     * Create feedback domain object
     * 
     * @param taxCenterId the tax center ID
     * @param regionId the region ID
     * @param auditTypeId the audit type
     * @param requestedCount what was requested
     * @param acceptedCount what they can do
     * @param justification why
     * @param feedbackDetails optional structured details
     * @param submittedBy who submitted
     * @return TaxCenterFeedback domain object
     */
    public TaxCenterFeedback createFeedback(
            String taxCenterId,
            String regionId,
            String auditTypeId,
            Integer requestedCount,
            Integer acceptedCount,
            String justification,
            Map<String, Object> feedbackDetails,
            String submittedBy) {
        
        // Validate inputs
        validateFeedbackSubmission(requestedCount, acceptedCount, justification);
        
        return TaxCenterFeedback.builder()
            .taxCenterId(taxCenterId)
            .regionId(regionId)
            .auditTypeId(auditTypeId)
            .requestedCount(requestedCount)
            .acceptedCount(acceptedCount)
            .justification(justification)
            .feedbackDetails(feedbackDetails != null ? feedbackDetails : new HashMap<>())
            .submittedBy(submittedBy)
            .submittedAt(LocalDateTime.now())
            .status("SUBMITTED")
            .build();
    }
    
    /**
     * Aggregate feedback by audit type for a tax center
     * 
     * @param feedbacks list of feedbacks for a tax center
     * @return Map of auditTypeId → aggregated data
     */
    public Map<String, Map<String, Object>> aggregateFeedbackByAuditType(
            java.util.List<TaxCenterFeedback> feedbacks) {
        
        Map<String, Map<String, Object>> aggregated = new HashMap<>();
        
        for (TaxCenterFeedback feedback : feedbacks) {
            String auditType = feedback.getAuditTypeId();
            
            Map<String, Object> details = aggregated.computeIfAbsent(
                auditType,
                k -> new HashMap<>()
            );
            
            details.put("requested", feedback.getRequestedCount());
            details.put("accepted", feedback.getAcceptedCount());
            details.put("delta", feedback.calculateDelta());
            details.put("gap_percentage", feedback.getGapPercentage());
            details.put("justification", feedback.getJustification());
        }
        
        return aggregated;
    }
    
    /**
     * Calculate total capacity across all audit types
     * 
     * @param feedbacks list of feedbacks
     * @return sum of accepted counts
     */
    public Integer calculateTotalCapacity(java.util.List<TaxCenterFeedback> feedbacks) {
        return feedbacks.stream()
            .mapToInt(f -> f.getAcceptedCount() != null ? f.getAcceptedCount() : 0)
            .sum();
    }
    
    /**
     * Calculate total requested across all audit types
     * 
     * @param feedbacks list of feedbacks
     * @return sum of requested counts
     */
    public Integer calculateTotalRequested(java.util.List<TaxCenterFeedback> feedbacks) {
        return feedbacks.stream()
            .mapToInt(f -> f.getRequestedCount() != null ? f.getRequestedCount() : 0)
            .sum();
    }
    
    /**
     * Calculate total gap (requested - accepted) across all audit types
     * 
     * @param feedbacks list of feedbacks
     * @return gap = totalRequested - totalCapacity
     */
    public Integer calculateTotalGap(java.util.List<TaxCenterFeedback> feedbacks) {
        Integer totalRequested = calculateTotalRequested(feedbacks);
        Integer totalCapacity = calculateTotalCapacity(feedbacks);
        return totalRequested - totalCapacity;
    }
}
