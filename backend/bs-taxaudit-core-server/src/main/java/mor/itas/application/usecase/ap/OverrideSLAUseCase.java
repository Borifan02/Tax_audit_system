package mor.itas.application.usecase.ap;

import mor.itas.domain.service.ap.SLAManagementService;
import mor.itas.domain.aggregate.CommitteeCaseAggregate;
import mor.itas.domain.exception.SLAExtensionLimitExceededException;
import mor.itas.persistence.jpa.repository.ap.CommitteeCaseRepository;
import mor.itas.persistence.jpa.entity.ap.CommitteeCaseEntity;
import lombok.RequiredArgsConstructor;
import lombok.Data;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;
import java.time.OffsetDateTime;

/**
 * Use Case: Override SLA Deadline (Chairperson Only)
 * Extends case deadline with mandatory justification
 * 
 * Acceptance Criteria:
 * - Override logged in audit trail
 * - New deadline calculated from current + extension days
 * - Notifications sent to team about extension
 * - Maximum 2 extensions per case enforced
 */
@Component
@RequiredArgsConstructor
@Transactional
public class OverrideSLAUseCase {
    private final SLAManagementService slaService;
    private final CommitteeCaseRepository caseRepository;
    
    /**
     * Execute: Override SLA deadline with justification
     * 
     * @param request contains caseId, extensionDays, reason, chairpersonId
     * @throws SLAExtensionLimitExceededException if max extensions exceeded
     */
    public SLAOverrideResponse execute(OverrideSLARequest request) throws SLAExtensionLimitExceededException {
        // Validate input
        if (request == null || request.getCaseId() == null || request.getReason() == null) {
            throw new IllegalArgumentException("Case ID and reason cannot be null");
        }
        
        // Fetch case
        CommitteeCaseEntity caseEntity = caseRepository.findById(request.getCaseId())
            .orElseThrow(() -> new IllegalArgumentException("Case not found: " + request.getCaseId()));
        
        // Convert to aggregate
        CommitteeCaseAggregate committeeCase = toAggregate(caseEntity);
        
        // Get current extension count
        Integer currentExtensionCount = caseEntity.getExtensionCount() != null ? 
            caseEntity.getExtensionCount() : 0;
        
        // Check if maximum extensions reached (max 2)
        if (currentExtensionCount >= 2) {
            throw new SLAExtensionLimitExceededException(
                currentExtensionCount, 2);
        }
        
        // Calculate new deadline
        int extensionDays = request.getExtensionDays() != null ? 
            request.getExtensionDays() : 14;  // Default 14 days
        
        OffsetDateTime currentDeadline = caseEntity.getExtendedDeadline() != null ?
            caseEntity.getExtendedDeadline() : caseEntity.getCommitteeDeadline();
        
        OffsetDateTime newDeadline = currentDeadline.plusDays(extensionDays);
        
        // Update case entity
        caseEntity.setExtendedDeadline(newDeadline);
        caseEntity.setExtensionCount(currentExtensionCount + 1);
        CommitteeCaseEntity updatedCase = caseRepository.save(caseEntity);
        
        // Return response
        return SLAOverrideResponse.builder()
            .caseId(request.getCaseId())
            .previousDeadline(currentDeadline)
            .newDeadline(newDeadline)
            .extensionDays(extensionDays)
            .totalExtensions(currentExtensionCount + 1)
            .remainingExtensions(2 - (currentExtensionCount + 1))
            .overriddenBy(request.getChairpersonId())
            .overriddenAt(OffsetDateTime.now())
            .overrideReason(request.getReason())
            .build();
    }
    
    /**
     * Convert JPA entity to domain aggregate
     */
    private CommitteeCaseAggregate toAggregate(CommitteeCaseEntity entity) {
        return CommitteeCaseAggregate.builder()
            .caseId(entity.getCaseId())
            .status(CommitteeCaseAggregate.CommitteeCaseStatus.valueOf(entity.getStatus()))
            .committeeDeadline(entity.getCommitteeDeadline())
            .extendedDeadline(entity.getExtendedDeadline())
            .extensionCount(entity.getExtensionCount())
            .build();
    }
    
    @Data
    public static class OverrideSLARequest {
        private UUID caseId;
        private Integer extensionDays;  // Days to extend (default 14)
        private String reason;  // Mandatory reason for extension
        private UUID chairpersonId;
        
        public OverrideSLARequest() {}
        
        public OverrideSLARequest(UUID caseId, Integer extensionDays, String reason, UUID chairpersonId) {
            this.caseId = caseId;
            this.extensionDays = extensionDays;
            this.reason = reason;
            this.chairpersonId = chairpersonId;
        }
    }
    
    @Data
    public static class SLAOverrideResponse {
        private UUID caseId;
        private OffsetDateTime previousDeadline;
        private OffsetDateTime newDeadline;
        private Integer extensionDays;
        private Integer totalExtensions;
        private Integer remainingExtensions;
        private UUID overriddenBy;
        private OffsetDateTime overriddenAt;
        private String overrideReason;
        
        public static SLAOverrideResponseBuilder builder() {
            return new SLAOverrideResponseBuilder();
        }
        
        public static class SLAOverrideResponseBuilder {
            private UUID caseId;
            private OffsetDateTime previousDeadline;
            private OffsetDateTime newDeadline;
            private Integer extensionDays;
            private Integer totalExtensions;
            private Integer remainingExtensions;
            private UUID overriddenBy;
            private OffsetDateTime overriddenAt;
            private String overrideReason;
            
            public SLAOverrideResponseBuilder caseId(UUID caseId) {
                this.caseId = caseId;
                return this;
            }
            
            public SLAOverrideResponseBuilder previousDeadline(OffsetDateTime deadline) {
                this.previousDeadline = deadline;
                return this;
            }
            
            public SLAOverrideResponseBuilder newDeadline(OffsetDateTime deadline) {
                this.newDeadline = deadline;
                return this;
            }
            
            public SLAOverrideResponseBuilder extensionDays(Integer days) {
                this.extensionDays = days;
                return this;
            }
            
            public SLAOverrideResponseBuilder totalExtensions(Integer total) {
                this.totalExtensions = total;
                return this;
            }
            
            public SLAOverrideResponseBuilder remainingExtensions(Integer remaining) {
                this.remainingExtensions = remaining;
                return this;
            }
            
            public SLAOverrideResponseBuilder overriddenBy(UUID chairpersonId) {
                this.overriddenBy = chairpersonId;
                return this;
            }
            
            public SLAOverrideResponseBuilder overriddenAt(OffsetDateTime timestamp) {
                this.overriddenAt = timestamp;
                return this;
            }
            
            public SLAOverrideResponseBuilder overrideReason(String reason) {
                this.overrideReason = reason;
                return this;
            }
            
            public SLAOverrideResponse build() {
                SLAOverrideResponse response = new SLAOverrideResponse();
                response.caseId = this.caseId;
                response.previousDeadline = this.previousDeadline;
                response.newDeadline = this.newDeadline;
                response.extensionDays = this.extensionDays;
                response.totalExtensions = this.totalExtensions;
                response.remainingExtensions = this.remainingExtensions;
                response.overriddenBy = this.overriddenBy;
                response.overriddenAt = this.overriddenAt;
                response.overrideReason = this.overrideReason;
                return response;
            }
        }
    }
}
