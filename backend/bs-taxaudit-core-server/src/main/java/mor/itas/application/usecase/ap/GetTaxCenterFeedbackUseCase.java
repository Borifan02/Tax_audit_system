package mor.itas.application.usecase.ap;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import mor.itas.application.port.inboundport.ap.GetTaxCenterFeedbackPort;
import mor.itas.persistence.jpa.entity.ap.PlanAllocationEntity;
import mor.itas.persistence.jpa.entity.ap.AnnualAuditPlanEntity;
import mor.itas.persistence.jpa.repository.ap.PlanAllocationRepository;
import mor.itas.persistence.jpa.repository.ap.AnnualAuditPlanJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * GetTaxCenterFeedbackUseCase - Use Case
 * 
 * Implements GetTaxCenterFeedbackPort.
 * 
 * Retrieves all tax center feedback submitted for a region.
 * Reads from PlanAllocationEntity (where TaxCenterDashboardController stores feedback).
 * 
 * Flow:
 * 1. Validate plan exists
 * 2. Query PlanAllocationRepository for tax center allocations with feedback
 * 3. Build feedback list with per-audit-type breakdown
 * 4. Return to Regional Director for aggregation
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GetTaxCenterFeedbackUseCase implements GetTaxCenterFeedbackPort {
    
    private final PlanAllocationRepository allocationRepository;
    private final AnnualAuditPlanJpaRepository planRepository;
    private final ObjectMapper objectMapper;
    
    @Override
    public List<Map<String, Object>> getTaxCenterFeedback(UUID planId, String regionId) {
        // 1. Validate plan exists
        AnnualAuditPlanEntity plan = planRepository.findById(planId)
            .orElseThrow(() -> new IllegalArgumentException("Plan not found: " + planId));
        
        // 2. Get all tax center allocations for this plan+region that have feedback
        List<PlanAllocationEntity> allocations = allocationRepository
            .findByAnnualPlanIdAndRegionCode(planId, regionId);
        
        List<Map<String, Object>> feedbackList = new ArrayList<>();
        
        // 3. Build feedback for each tax center that has submitted feedback
        for (PlanAllocationEntity allocation : allocations) {
            // Only include tax center allocations (not regional-level)
            if (allocation.getTaxCenterCode() == null || allocation.getTaxCenterCode().isBlank()) {
                continue;
            }
            
            // Only include allocations that have feedback submitted
            if (!Boolean.TRUE.equals(allocation.getTcFeedbackSubmitted())) {
                continue;
            }
            
            Map<String, Object> tcFeedback = new HashMap<>();
            tcFeedback.put("taxCenterId", allocation.getTaxCenterCode());
            tcFeedback.put("regionId", regionId);
            tcFeedback.put("planId", planId.toString());
            tcFeedback.put("allocationId", allocation.getId().toString());
            tcFeedback.put("originalCount", allocation.getProposedCount());
            tcFeedback.put("adjustedCount", allocation.getTcAdjustedCount());
            tcFeedback.put("justification", allocation.getTcJustification());
            tcFeedback.put("adjustmentReason", allocation.getTcAdjustmentReason());
            tcFeedback.put("feedbackSubmittedAt", 
                allocation.getTcFeedbackSubmittedAt() != null 
                    ? allocation.getTcFeedbackSubmittedAt().toString() 
                    : null);
            
            // Parse per-audit-type adjustments from JSON
            Map<String, Map<String, Object>> feedbackByAuditType = new LinkedHashMap<>();
            
            // Use adjusted allocations if available (from acknowledge endpoint)
            JsonNode adjustedNode = allocation.getTcAdjustedAllocations();
            if (adjustedNode != null && !adjustedNode.isNull()) {
                try {
                    Map<String, Object> adjustedMap = objectMapper.convertValue(adjustedNode, Map.class);
                    for (Map.Entry<String, Object> entry : adjustedMap.entrySet()) {
                        String auditType = entry.getKey();
                        Object value = entry.getValue();
                        
                        Map<String, Object> auditFeedback = new HashMap<>();
                        if (value instanceof Number) {
                            // Simple count - calculate from original
                            int adjusted = ((Number) value).intValue();
                            int original = getOriginalForAuditType(allocation, auditType);
                            auditFeedback.put("requested", original);
                            auditFeedback.put("accepted", adjusted);
                            auditFeedback.put("gap", adjusted - original);
                        } else if (value instanceof Map) {
                            // Detailed feedback map
                            auditFeedback.putAll((Map<String, Object>) value);
                        }
                        
                        feedbackByAuditType.put(auditType, auditFeedback);
                    }
                } catch (Exception e) {
                    // Fall back to allocationByAuditType
                }
            }
            
            // If no adjusted allocations, use original allocation by audit type
            if (feedbackByAuditType.isEmpty()) {
                JsonNode originalNode = allocation.getAllocationByAuditType();
                if (originalNode != null && !originalNode.isNull()) {
                    try {
                        Map<String, Object> originalMap = objectMapper.convertValue(originalNode, Map.class);
                        for (Map.Entry<String, Object> entry : originalMap.entrySet()) {
                            Map<String, Object> auditFeedback = new HashMap<>();
                            int count = entry.getValue() instanceof Number 
                                ? ((Number) entry.getValue()).intValue() : 0;
                            auditFeedback.put("requested", count);
                            auditFeedback.put("accepted", count); // No adjustment = same as requested
                            auditFeedback.put("gap", 0);
                            feedbackByAuditType.put(entry.getKey(), auditFeedback);
                        }
                    } catch (Exception e) {
                        // Skip
                    }
                }
            }
            
            tcFeedback.put("feedbackByAuditType", feedbackByAuditType);
            
            feedbackList.add(tcFeedback);
        }
        
        return feedbackList;
    }
    
    /**
     * Get original allocation count for a specific audit type from allocationByAuditType
     */
    private int getOriginalForAuditType(PlanAllocationEntity allocation, String auditType) {
        JsonNode originalNode = allocation.getAllocationByAuditType();
        if (originalNode != null && originalNode.has(auditType)) {
            JsonNode value = originalNode.get(auditType);
            if (value.isNumber()) {
                return value.intValue();
            }
        }
        // Fallback: distribute proportionally from total
        return 0;
    }
}
