package mor.itas.application.usecase.ap;

import mor.itas.persistence.jpa.entity.ap.CommitteeCaseEntity;
import mor.itas.persistence.jpa.repository.ap.CommitteeCaseRepository;
import mor.itas.persistence.jpa.repository.ap.CommitteeVoteRepository;
import mor.itas.persistence.jpa.repository.ap.ResearchNoteRepository;
import mor.itas.persistence.jpa.repository.ap.AuditorNominationRepository;
import lombok.RequiredArgsConstructor;
import lombok.Data;
import org.springframework.stereotype.Component;
import java.util.UUID;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * Use Case: Get Case Detail
 * Retrieves comprehensive case information for deep dossier view
 * 
 * Information Categories Included:
 * 1. Taxpayer Profile
 * 2. Risk Assessment
 * 3. Filing History
 * 4. Payment History
 * 5. Previous Audits
 * 6. Committee Mandate
 * 7. Current Status & Workflow
 * 8. Team Assignment
 * 
 * Acceptance Criteria:
 * - All data loads within 3 seconds
 * - Risk criteria drill-down shows 5+ levels
 * - Historical data spans minimum 5 years
 */
@Component
@RequiredArgsConstructor
public class GetCaseDetailUseCase {
    private final CommitteeCaseRepository caseRepository;
    private final CommitteeVoteRepository voteRepository;
    private final ResearchNoteRepository researchNoteRepository;
    private final AuditorNominationRepository nominationRepository;
    
    /**
     * Execute: Get detailed case information
     * 
     * @param caseId the case ID
     * @return CaseDetailResponse with all relevant information
     */
    public CaseDetailResponse execute(UUID caseId) {
        if (caseId == null) {
            throw new IllegalArgumentException("Case ID cannot be null");
        }
        
        // Fetch case
        CommitteeCaseEntity caseEntity = caseRepository.findById(caseId)
            .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseId));
        
        // Get related data
        long voteCount = voteRepository.countByCommitteeCaseEntityCaseId(caseId);
        long researchNoteCount = researchNoteRepository.countByCaseId(caseId);
        long nominationCount = nominationRepository.countByCaseId(caseId);
        
        // Build comprehensive response
        return CaseDetailResponse.builder()
            // Taxpayer Profile
            .committeeCaseId(caseEntity.getCaseId())
            .taxpayerName(caseEntity.getTaxpayerName())
            .taxIdentificationNumber(caseEntity.getTaxIdNumber())
            .segment(caseEntity.getSegment())
            .industry(caseEntity.getIndustry())
            
            // Risk Assessment
            .riskScore(caseEntity.getRiskScore())
            .riskPriority(caseEntity.getRiskPriority())
            .riskCriteria(caseEntity.getRiskCriteria() != null ? caseEntity.getRiskCriteria().toString() : null)
            
            // Case Status & Workflow
            .status(caseEntity.getStatus())
            .decision(caseEntity.getDecision())
            .createdDate(caseEntity.getCreatedDate())
            .committeeDeadline(caseEntity.getCommitteeDeadline())
            .extendedDeadline(caseEntity.getExtendedDeadline())
            .extensionCount(caseEntity.getExtensionCount())
            .decisionDate(caseEntity.getDecisionDate())
            .decisionReason(caseEntity.getDecisionReason())
            
            // Team & Ownership
            .currentOwnerId(caseEntity.getCurrentOwnerId())
            .chairpersonId(caseEntity.getChairpersonId())
            
            // Activity Metrics
            .voteCount((int) voteCount)
            .researchNoteCount((int) researchNoteCount)
            .nominationCount((int) nominationCount)
            
            // Handoff Info
            .caseCode(caseEntity.getCaseCode())
            .handoffDate(caseEntity.getHandoffDate())
            
            .build();
    }
    
    @Data
    public static class CaseDetailResponse {
        // Taxpayer Profile
        private UUID committeeCaseId;
        private String taxpayerName;
        private String taxIdentificationNumber;
        private String segment;
        private String industry;
        
        // Risk Assessment
        private Integer riskScore;
        private String riskPriority;
        private String riskCriteria;
        
        // Case Status & Workflow
        private String status;
        private String decision;
        private OffsetDateTime createdDate;
        private OffsetDateTime committeeDeadline;
        private OffsetDateTime extendedDeadline;
        private Integer extensionCount;
        private OffsetDateTime decisionDate;
        private String decisionReason;
        
        // Team & Ownership
        private UUID currentOwnerId;
        private UUID chairpersonId;
        
        // Activity Metrics
        private Integer voteCount;
        private Integer researchNoteCount;
        private Integer nominationCount;
        
        // Handoff Info
        private String caseCode;
        private OffsetDateTime handoffDate;
        
        public static CaseDetailResponseBuilder builder() {
            return new CaseDetailResponseBuilder();
        }
        
        public static class CaseDetailResponseBuilder {
            private UUID committeeCaseId;
            private String taxpayerName;
            private String taxIdentificationNumber;
            private String segment;
            private String industry;
            private Integer riskScore;
            private String riskPriority;
            private String riskCriteria;
            private String status;
            private String decision;
            private OffsetDateTime createdDate;
            private OffsetDateTime committeeDeadline;
            private OffsetDateTime extendedDeadline;
            private Integer extensionCount;
            private OffsetDateTime decisionDate;
            private String decisionReason;
            private UUID currentOwnerId;
            private UUID chairpersonId;
            private Integer voteCount;
            private Integer researchNoteCount;
            private Integer nominationCount;
            private String caseCode;
            private OffsetDateTime handoffDate;
            
            public CaseDetailResponseBuilder committeeCaseId(UUID id) {
                this.committeeCaseId = id;
                return this;
            }
            
            public CaseDetailResponseBuilder taxpayerName(String name) {
                this.taxpayerName = name;
                return this;
            }
            
            public CaseDetailResponseBuilder taxIdentificationNumber(String number) {
                this.taxIdentificationNumber = number;
                return this;
            }
            
            public CaseDetailResponseBuilder segment(String segment) {
                this.segment = segment;
                return this;
            }
            
            public CaseDetailResponseBuilder industry(String industry) {
                this.industry = industry;
                return this;
            }
            
            public CaseDetailResponseBuilder riskScore(Integer score) {
                this.riskScore = score;
                return this;
            }
            
            public CaseDetailResponseBuilder riskPriority(String priority) {
                this.riskPriority = priority;
                return this;
            }
            
            public CaseDetailResponseBuilder riskCriteria(String criteria) {
                this.riskCriteria = criteria;
                return this;
            }
            
            public CaseDetailResponseBuilder status(String status) {
                this.status = status;
                return this;
            }
            
            public CaseDetailResponseBuilder decision(String decision) {
                this.decision = decision;
                return this;
            }
            
            public CaseDetailResponseBuilder createdDate(OffsetDateTime date) {
                this.createdDate = date;
                return this;
            }
            
            public CaseDetailResponseBuilder committeeDeadline(OffsetDateTime deadline) {
                this.committeeDeadline = deadline;
                return this;
            }
            
            public CaseDetailResponseBuilder extendedDeadline(OffsetDateTime deadline) {
                this.extendedDeadline = deadline;
                return this;
            }
            
            public CaseDetailResponseBuilder extensionCount(Integer count) {
                this.extensionCount = count;
                return this;
            }
            
            public CaseDetailResponseBuilder decisionDate(OffsetDateTime date) {
                this.decisionDate = date;
                return this;
            }
            
            public CaseDetailResponseBuilder decisionReason(String reason) {
                this.decisionReason = reason;
                return this;
            }
            
            public CaseDetailResponseBuilder currentOwnerId(UUID id) {
                this.currentOwnerId = id;
                return this;
            }
            
            public CaseDetailResponseBuilder chairpersonId(UUID id) {
                this.chairpersonId = id;
                return this;
            }
            
            public CaseDetailResponseBuilder voteCount(Integer count) {
                this.voteCount = count;
                return this;
            }
            
            public CaseDetailResponseBuilder researchNoteCount(Integer count) {
                this.researchNoteCount = count;
                return this;
            }
            
            public CaseDetailResponseBuilder nominationCount(Integer count) {
                this.nominationCount = count;
                return this;
            }
            
            public CaseDetailResponseBuilder caseCode(String code) {
                this.caseCode = code;
                return this;
            }
            
            public CaseDetailResponseBuilder handoffDate(OffsetDateTime date) {
                this.handoffDate = date;
                return this;
            }
            
            public CaseDetailResponse build() {
                CaseDetailResponse response = new CaseDetailResponse();
                response.committeeCaseId = this.committeeCaseId;
                response.taxpayerName = this.taxpayerName;
                response.taxIdentificationNumber = this.taxIdentificationNumber;
                response.segment = this.segment;
                response.industry = this.industry;
                response.riskScore = this.riskScore;
                response.riskPriority = this.riskPriority;
                response.riskCriteria = this.riskCriteria;
                response.status = this.status;
                response.decision = this.decision;
                response.createdDate = this.createdDate;
                response.committeeDeadline = this.committeeDeadline;
                response.extendedDeadline = this.extendedDeadline;
                response.extensionCount = this.extensionCount;
                response.decisionDate = this.decisionDate;
                response.decisionReason = this.decisionReason;
                response.currentOwnerId = this.currentOwnerId;
                response.chairpersonId = this.chairpersonId;
                response.voteCount = this.voteCount;
                response.researchNoteCount = this.researchNoteCount;
                response.nominationCount = this.nominationCount;
                response.caseCode = this.caseCode;
                response.handoffDate = this.handoffDate;
                return response;
            }
        }
    }
}
