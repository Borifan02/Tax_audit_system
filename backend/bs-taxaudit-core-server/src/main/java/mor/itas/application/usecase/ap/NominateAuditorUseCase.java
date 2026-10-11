package mor.itas.application.usecase.ap;

import mor.itas.persistence.jpa.entity.ap.AuditorNominationEntity;
import mor.itas.persistence.jpa.repository.ap.AuditorNominationRepository;
import mor.itas.persistence.jpa.repository.ap.CommitteeCaseRepository;
import lombok.RequiredArgsConstructor;
import lombok.Data;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * Use Case: Nominate Auditor
 * Committee members nominate qualified auditors for the audit team
 * 
 * Acceptance Criteria:
 * - Nomination submitted within 1 second
 * - Auditor pool searchable by 5+ attributes
 * - Nomination rationale stored and visible to Chairperson
 * - Multiple nominations allowed per auditor
 */
@Component
@RequiredArgsConstructor
@Transactional
public class NominateAuditorUseCase {
    private final AuditorNominationRepository nominationRepository;
    private final CommitteeCaseRepository caseRepository;
    
    /**
     * Execute: Nominate an auditor for a case
     * Multiple members can nominate the same auditor
     * 
     * @param request contains caseId, auditorId, nominatingMemberId, justification
     * @return UUID of nomination record
     */
    public UUID execute(NominateAuditorRequest request) {
        // Validate input
        if (request == null || request.getCaseId() == null || 
            request.getAuditorId() == null || request.getNominatingMemberId() == null ||
            request.getJustification() == null) {
            throw new IllegalArgumentException(
                "Case ID, auditor ID, nominating member ID, and justification cannot be null");
        }
        
        // Validate justification length
        if (request.getJustification().length() < 10) {
            throw new IllegalArgumentException("Justification must be at least 10 characters");
        }
        
        if (request.getJustification().length() > 1000) {
            throw new IllegalArgumentException("Justification cannot exceed 1000 characters");
        }
        
        // Verify case exists
        mor.itas.persistence.jpa.entity.ap.CommitteeCaseEntity caseEntity = caseRepository.findById(request.getCaseId())
            .orElseThrow(() -> new IllegalArgumentException("Case not found: " + request.getCaseId()));
        
        // Create nomination
        AuditorNominationEntity nomination = AuditorNominationEntity.builder()
            .nominationId(UUID.randomUUID())
            .committeeCaseEntity(caseEntity)
            .nominatedAuditorId(request.getAuditorId())
            .nominatingMemberId(request.getNominatingMemberId())
            .justification(request.getJustification())
            .nominatedAt(OffsetDateTime.now())
            .build();
        
        AuditorNominationEntity savedNomination = nominationRepository.save(nomination);
        return savedNomination.getNominationId();
    }
    
    /**
     * Get all nominations for a case
     * 
     * @param caseId the case ID
     * @return list of nominations with counts
     */
    public List<NominationAggregateResponse> getPoolForCase(UUID caseId) {
        if (caseId == null) {
            throw new IllegalArgumentException("Case ID cannot be null");
        }
        
        // In production, this would aggregate nominations and return nomination counts
        // For now, return empty list (would be populated from repository query)
        return List.of();
    }
    
    @Data
    public static class NominateAuditorRequest {
        private UUID caseId;
        private UUID auditorId;
        private UUID nominatingMemberId;
        private String justification;
        
        public NominateAuditorRequest() {}
        
        public NominateAuditorRequest(UUID caseId, UUID auditorId, UUID nominatingMemberId, String justification) {
            this.caseId = caseId;
            this.auditorId = auditorId;
            this.nominatingMemberId = nominatingMemberId;
            this.justification = justification;
        }
    }
    
    @Data
    public static class NominationAggregateResponse {
        private UUID auditorId;
        private String auditorName;
        private String auditorSeniority;
        private String auditorExpertise;
        private Integer nominationCount;
        private List<String> nominationReasons;
        private Integer priorJointAudits;
        
        public static NominationAggregateResponseBuilder builder() {
            return new NominationAggregateResponseBuilder();
        }
        
        public static class NominationAggregateResponseBuilder {
            private UUID auditorId;
            private String auditorName;
            private String auditorSeniority;
            private String auditorExpertise;
            private Integer nominationCount;
            private List<String> nominationReasons;
            private Integer priorJointAudits;
            
            public NominationAggregateResponseBuilder auditorId(UUID auditorId) {
                this.auditorId = auditorId;
                return this;
            }
            
            public NominationAggregateResponseBuilder auditorName(String name) {
                this.auditorName = name;
                return this;
            }
            
            public NominationAggregateResponseBuilder auditorSeniority(String seniority) {
                this.auditorSeniority = seniority;
                return this;
            }
            
            public NominationAggregateResponseBuilder auditorExpertise(String expertise) {
                this.auditorExpertise = expertise;
                return this;
            }
            
            public NominationAggregateResponseBuilder nominationCount(Integer count) {
                this.nominationCount = count;
                return this;
            }
            
            public NominationAggregateResponseBuilder nominationReasons(List<String> reasons) {
                this.nominationReasons = reasons;
                return this;
            }
            
            public NominationAggregateResponseBuilder priorJointAudits(Integer count) {
                this.priorJointAudits = count;
                return this;
            }
            
            public NominationAggregateResponse build() {
                NominationAggregateResponse response = new NominationAggregateResponse();
                response.auditorId = this.auditorId;
                response.auditorName = this.auditorName;
                response.auditorSeniority = this.auditorSeniority;
                response.auditorExpertise = this.auditorExpertise;
                response.nominationCount = this.nominationCount;
                response.nominationReasons = this.nominationReasons;
                response.priorJointAudits = this.priorJointAudits;
                return response;
            }
        }
    }
}
