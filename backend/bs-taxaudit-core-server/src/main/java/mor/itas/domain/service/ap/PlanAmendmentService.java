package mor.itas.domain.service.ap;

import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * PlanAmendmentService - Domain Service
 * 
 * Implements business logic for plan amendment workflow.
 * 
 * Responsibilities:
 * 1. Validate amendment changes
 * 2. Apply amendments to plan
 * 3. Track amendment rounds
 * 4. Ensure consistency and strategy
 */
@Component
public class PlanAmendmentService {
    
    /**
     * Validate amendment changes
     * 
     * @param plannedChanges map of region/auditType → newCount
     * @throws IllegalArgumentException if validation fails
     */
    public void validateAmendmentChanges(Map<String, Map<String, Integer>> plannedChanges) {
        if (plannedChanges == null || plannedChanges.isEmpty()) {
            throw new IllegalArgumentException("Planned changes cannot be empty");
        }
        
        // Validate each change
        for (Map.Entry<String, Map<String, Integer>> entry : plannedChanges.entrySet()) {
            String regionId = entry.getKey();
            Map<String, Integer> auditTypeChanges = entry.getValue();
            
            if (auditTypeChanges == null || auditTypeChanges.isEmpty()) {
                throw new IllegalArgumentException(
                    "No changes for region: " + regionId
                );
            }
            
            // Validate counts are non-negative
            for (Map.Entry<String, Integer> change : auditTypeChanges.entrySet()) {
                String auditType = change.getKey();
                Integer newCount = change.getValue();
                
                if (newCount == null || newCount < 0) {
                    throw new IllegalArgumentException(
                        "Invalid count for " + auditType + " in " + regionId + ": " + newCount
                    );
                }
            }
        }
    }
    
    /**
     * Calculate change summary
     * 
     * @param oldAllocations original allocations
     * @param newAllocations amended allocations
     * @return summary of changes
     */
    public Map<String, Object> calculateChangeSummary(
            Map<String, Map<String, Integer>> oldAllocations,
            Map<String, Map<String, Integer>> newAllocations) {
        
        Map<String, Object> summary = new HashMap<>();
        long totalOld = 0L;
        long totalNew = 0L;
        long totalDelta = 0L;
        
        for (String region : oldAllocations.keySet()) {
            Map<String, Integer> oldAuditTypes = oldAllocations.get(region);
            Map<String, Integer> newAuditTypes = newAllocations.getOrDefault(region, new HashMap<>());
            
            for (String auditType : oldAuditTypes.keySet()) {
                int oldCount = oldAuditTypes.get(auditType);
                int newCount = newAuditTypes.getOrDefault(auditType, 0);
                
                totalOld += oldCount;
                totalNew += newCount;
                totalDelta += (newCount - oldCount);
            }
        }
        
        summary.put("totalOld", totalOld);
        summary.put("totalNew", totalNew);
        summary.put("totalDelta", totalDelta);
        summary.put("percentageChange", totalOld > 0 ? (double) totalDelta / totalOld * 100 : 0.0);
        
        return summary;
    }
    
    /**
     * Track amendment history
     * 
     * @param amendmentRound which round
     * @param changes what was changed
     * @return amendment history entry
     */
    public Map<String, Object> createAmendmentHistoryEntry(
            Integer amendmentRound,
            Map<String, Map<String, Integer>> changes,
            String planningTeamId) {
        
        Map<String, Object> entry = new HashMap<>();
        entry.put("amendmentRound", amendmentRound);
        entry.put("plannedChanges", changes);
        entry.put("submittedBy", planningTeamId);
        entry.put("submittedAt", java.time.LocalDateTime.now().toString());
        entry.put("status", "PENDING_DIRECTOR_REVIEW");
        
        return entry;
    }
    
    /**
     * Validate amendment is reasonable (not deviating too far from original strategy)
     * 
     * @param oldAllocations original allocations
     * @param newAllocations amended allocations
     * @throws IllegalArgumentException if deviation too large
     */
    public void validateAmendmentStrategy(
            Map<String, Map<String, Integer>> oldAllocations,
            Map<String, Map<String, Integer>> newAllocations) {
        
        // Calculate total change percentage
        long totalOld = calculateTotal(oldAllocations);
        long totalNew = calculateTotal(newAllocations);
        
        if (totalOld == 0) {
            return;
        }
        
        double percentageChange = Math.abs((double) (totalNew - totalOld) / totalOld * 100);
        
        // Allow up to 20% change (accounting for regional feedback)
        if (percentageChange > 20.0) {
            throw new IllegalArgumentException(
                "Amendment changes total by " + String.format("%.1f", percentageChange) + "%. " +
                "Maximum allowed is 20% to maintain strategic consistency."
            );
        }
    }
    
    /**
     * Calculate total across all allocations
     */
    private long calculateTotal(Map<String, Map<String, Integer>> allocations) {
        return allocations.values().stream()
            .flatMap(auditTypes -> auditTypes.values().stream())
            .mapToLong(Long::valueOf)
            .sum();
    }
}
