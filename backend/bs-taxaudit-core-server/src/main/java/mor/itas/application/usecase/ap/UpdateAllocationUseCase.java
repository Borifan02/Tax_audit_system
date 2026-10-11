package mor.itas.application.usecase.ap;

import mor.itas.application.port.inboundport.ap.UpdateAllocationPort;
import mor.itas.domain.service.ap.RegionalAllocationService;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * UpdateAllocationUseCase - Application Use Case
 * 
 * Implements UpdateAllocationPort.
 * Handles updates to tax center allocations by regional directors.
 */
@Component
public class UpdateAllocationUseCase implements UpdateAllocationPort {
    
    private final RegionalAllocationService allocationService;
    
    public UpdateAllocationUseCase(RegionalAllocationService allocationService) {
        this.allocationService = allocationService;
    }
    
    @Override
    @Transactional
    public void updateAllocation(
            UUID allocationId,
            String auditTypeId,
            Integer newCount,
            String regionalDirectorId) {
        
        // Validate inputs
        if (allocationId == null) {
            throw new IllegalArgumentException("Allocation ID cannot be null");
        }
        
        if (auditTypeId == null || auditTypeId.trim().isEmpty()) {
            throw new IllegalArgumentException("Audit type ID cannot be null or empty");
        }
        
        if (newCount == null || newCount < 0) {
            throw new IllegalArgumentException("New count must be >= 0");
        }
        
        // In full implementation:
        // 1. Find TaxCenterAllocation by ID
        // 2. Check allocation is for same region director
        // 3. Update the count
        // 4. Validate doesn't exceed regional allocation
        // 5. Save to repository
        
        // For Phase B MVP, just validate inputs
        // TODO: Implement full update persistence
    }
}
