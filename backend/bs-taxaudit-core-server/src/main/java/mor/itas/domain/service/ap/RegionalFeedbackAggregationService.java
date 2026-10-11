package mor.itas.domain.service.ap;

import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * RegionalFeedbackAggregationService - Domain Service
 * 
 * Implements business logic for aggregating tax center feedback at regional level.
 * 
 * Responsibilities:
 * 1. Aggregate feedback by audit type (sum requested, capacity, gaps)
 * 2. Calculate regional capacity analysis
 * 3. Generate aggregate statistics
 */
@Component
public class RegionalFeedbackAggregationService {
    
    /**
     * Aggregate tax center feedback by audit type
     * 
     * @param taxCenterFeedbackList list of tax center feedback objects
     * @return aggregated data by audit type
     */
    public Map<String, Map<String, Object>> aggregateFeedbackByAuditType(
            List<Map<String, Object>> taxCenterFeedbackList) {
        
        if (taxCenterFeedbackList == null || taxCenterFeedbackList.isEmpty()) {
            throw new IllegalArgumentException("Tax center feedback list cannot be empty");
        }
        
        Map<String, Map<String, Object>> aggregated = new HashMap<>();
        
        // Initialize aggregated map
        initializeAuditTypes(aggregated);
        
        // Process each tax center's feedback
        for (Map<String, Object> tcFeedback : taxCenterFeedbackList) {
            aggregateFromTaxCenter(tcFeedback, aggregated);
        }
        
        // Calculate totals and percentages
        calculateAggregateStats(aggregated);
        
        return aggregated;
    }
    
    /**
     * Initialize aggregated map with all audit types
     */
    private void initializeAuditTypes(Map<String, Map<String, Object>> aggregated) {
        String[] auditTypes = {
            "desk_audit",
            "field_audit",
            "joint_audit",
            "transfer_pricing",
            "comprehensive",
            "issue_audit"
        };
        
        for (String auditType : auditTypes) {
            Map<String, Object> typeData = new HashMap<>();
            typeData.put("auditType", auditType);
            typeData.put("totalRequested", 0L);
            typeData.put("totalCapacity", 0L);
            typeData.put("totalGap", 0L);
            typeData.put("gapPercentage", 0.0);
            typeData.put("taxCenterFeedbacks", new java.util.ArrayList<>());
            aggregated.put(auditType, typeData);
        }
    }
    
    /**
     * Aggregate feedback from a single tax center
     */
    private void aggregateFromTaxCenter(
            Map<String, Object> tcFeedback,
            Map<String, Map<String, Object>> aggregated) {
        
        @SuppressWarnings("unchecked")
        Map<String, Map<String, Object>> feedbackByAuditType = 
            (Map<String, Map<String, Object>>) tcFeedback.get("feedbackByAuditType");
        
        if (feedbackByAuditType == null) {
            return;
        }
        
        for (Map.Entry<String, Map<String, Object>> entry : feedbackByAuditType.entrySet()) {
            String auditType = entry.getKey();
            Map<String, Object> feedback = entry.getValue();
            
            if (!aggregated.containsKey(auditType)) {
                continue;
            }
            
            Map<String, Object> typeData = aggregated.get(auditType);
            
            // Extract feedback values
            int requested = getIntValue(feedback, "requested");
            int accepted = getIntValue(feedback, "accepted");
            
            // Add to totals
            long currentRequested = (long) typeData.get("totalRequested");
            long currentCapacity = (long) typeData.get("totalCapacity");
            
            typeData.put("totalRequested", currentRequested + requested);
            typeData.put("totalCapacity", currentCapacity + accepted);
            
            // Store individual tax center feedback
            @SuppressWarnings("unchecked")
            java.util.List<Map<String, Object>> tcFeedbacks = 
                (java.util.List<Map<String, Object>>) typeData.get("taxCenterFeedbacks");
            
            Map<String, Object> tcFeedbackEntry = new HashMap<>();
            tcFeedbackEntry.put("taxCenterId", tcFeedback.get("taxCenterId"));
            tcFeedbackEntry.put("requested", requested);
            tcFeedbackEntry.put("accepted", accepted);
            tcFeedbackEntry.put("justification", feedback.get("justification"));
            
            tcFeedbacks.add(tcFeedbackEntry);
        }
    }
    
    /**
     * Calculate aggregate statistics
     */
    private void calculateAggregateStats(Map<String, Map<String, Object>> aggregated) {
        for (Map<String, Object> typeData : aggregated.values()) {
            long totalRequested = (long) typeData.get("totalRequested");
            long totalCapacity = (long) typeData.get("totalCapacity");
            
            long gap = totalCapacity - totalRequested;
            double gapPercentage = totalRequested > 0 ? 
                (double) (totalRequested - totalCapacity) / totalRequested * 100 : 0.0;
            
            typeData.put("totalGap", gap);
            typeData.put("gapPercentage", gapPercentage);
        }
    }
    
    /**
     * Calculate total capacity across all audit types
     */
    public long calculateTotalCapacity(Map<String, Map<String, Object>> aggregated) {
        return aggregated.values().stream()
            .mapToLong(data -> (long) data.get("totalCapacity"))
            .sum();
    }
    
    /**
     * Calculate total requested across all audit types
     */
    public long calculateTotalRequested(Map<String, Map<String, Object>> aggregated) {
        return aggregated.values().stream()
            .mapToLong(data -> (long) data.get("totalRequested"))
            .sum();
    }
    
    /**
     * Calculate total gap (requested - capacity)
     */
    public long calculateTotalGap(Map<String, Map<String, Object>> aggregated) {
        return aggregated.values().stream()
            .mapToLong(data -> (long) data.get("totalGap"))
            .sum();
    }
    
    /**
     * Calculate regional gap percentage
     */
    public double calculateRegionalGapPercentage(Map<String, Map<String, Object>> aggregated) {
        long totalRequested = calculateTotalRequested(aggregated);
        if (totalRequested == 0) {
            return 0.0;
        }
        long totalCapacity = calculateTotalCapacity(aggregated);
        return (double) (totalRequested - totalCapacity) / totalRequested * 100;
    }
    
    /**
     * Extract integer value from map, handling different value types
     */
    private int getIntValue(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value == null) {
            return 0;
        }
        if (value instanceof Integer) {
            return (Integer) value;
        }
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        throw new IllegalArgumentException("Expected integer for key: " + key);
    }
}
