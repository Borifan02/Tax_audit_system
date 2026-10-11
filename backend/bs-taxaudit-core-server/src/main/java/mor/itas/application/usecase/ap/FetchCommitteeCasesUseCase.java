package mor.itas.application.usecase.ap;

import mor.itas.api.dto.response.ap.jac.CommitteeCaseResponse;
import mor.itas.api.mapper.ap.CommitteeCaseJacMapper;
import mor.itas.domain.aggregate.CommitteeCaseAggregate;
import mor.itas.persistence.jpa.entity.ap.CommitteeCaseEntity;
import mor.itas.persistence.jpa.repository.ap.CommitteeCaseRepository;
import mor.itas.persistence.jpa.repository.ap.CommitteeVoteRepository;
import lombok.RequiredArgsConstructor;
import lombok.Data;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.time.OffsetDateTime;

/**
 * Use Case: Fetch Committee Cases Portfolio
 * Retrieves paginated committee cases with optional filtering, takes ownership and releases ownership.
 */
@Component
@RequiredArgsConstructor
@Transactional
public class FetchCommitteeCasesUseCase {
    private final CommitteeCaseRepository caseRepository;
    private final CommitteeVoteRepository voteRepository;
    private final CommitteeCaseJacMapper caseMapper;
    
    /**
     * Fetch cases using search parameters
     */
    @Transactional(readOnly = true)
    public Page<CommitteeCaseResponse> execute(String status, String riskPriority, String taxpayerName, String segment, String taxCenter, Pageable pageable) {
        Page<CommitteeCaseResponse> page = caseRepository.searchCases(status, riskPriority, taxpayerName, segment, taxCenter, pageable)
            .map(caseMapper::toResponse);

        // Bulk-fetch vote counts for all cases on this page to avoid N+1
        List<UUID> caseIds = page.getContent().stream()
            .map(CommitteeCaseResponse::getCommitteeCaseId)
            .filter(Objects::nonNull)
            .toList();

        if (!caseIds.isEmpty()) {
            Map<UUID, int[]> voteCounts = new HashMap<>();
            List<Object[]> rows = voteRepository.countVotesGroupByCaseId(caseIds);
            for (Object[] row : rows) {
                UUID caseId = (UUID) row[0];
                long total = ((Number) row[1]).longValue();
                long approves = ((Number) row[2]).longValue();
                voteCounts.put(caseId, new int[]{(int) total, (int) approves});
            }

            for (CommitteeCaseResponse cr : page.getContent()) {
                UUID cid = cr.getCommitteeCaseId();
                int[] counts = voteCounts.getOrDefault(cid, new int[]{0, 0});
                cr.setVotingStatus(computeVotingStatus(counts[0], counts[1], cr.getStatus()));
            }
        }

        return page;
    }

    /**
     * Derive a human-readable voting status from vote counts and case status.
     */
    private String computeVotingStatus(int totalVotes, int approveCount, String caseStatus) {
        if (totalVotes == 0) {
            return "PENDING";
        }
        double consensus = (double) approveCount / totalVotes;
        if (consensus >= 0.6) {
            return "PASSED";
        }
        if (approveCount > 0 && totalVotes - approveCount > approveCount) {
            return "REJECTED";
        }
        return "IN_PROGRESS";
    }
    
    /**
     * Fetch cases using search parameters (overload for backward compatibility)
     */
    @Transactional(readOnly = true)
    public Page<CommitteeCaseResponse> execute(String status, String riskPriority, String taxpayerName, Pageable pageable) {
        return execute(status, riskPriority, taxpayerName, null, null, pageable);
    }
    
    /**
     * Get details of a single committee case
     */
    @Transactional(readOnly = true)
    public CommitteeCaseResponse getCaseDetail(UUID caseId) {
        CommitteeCaseEntity entity = caseRepository.findById(caseId)
            .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseId));
        UUID currentUserId = null;
        try {
            currentUserId = UUID.fromString(mor.itas.observability.audit.ActorContextHolder.getActorId());
        } catch (Exception ignored) {
        }
        return caseMapper.toResponse(entity, currentUserId);
    }
    
    /**
     * Take ownership of a committee case
     */
    public CommitteeCaseResponse takeOwnership(UUID caseId) {
        CommitteeCaseEntity entity = caseRepository.findById(caseId)
            .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseId));
        CommitteeCaseAggregate aggregate = toAggregate(entity);
        
        UUID memberId;
        try {
            memberId = UUID.fromString(mor.itas.observability.audit.ActorContextHolder.getActorId());
        } catch (Exception e) {
            memberId = UUID.nameUUIDFromBytes("SYSTEM".getBytes());
        }
        
        aggregate.takeOwnership(memberId);
        
        entity.setCurrentOwnerId(aggregate.getCurrentOwnerId());
        entity.setOwnershipAcquiredAt(aggregate.getOwnershipAcquiredAt());
        caseRepository.save(entity);
        
        return caseMapper.toResponse(entity);
    }
    
    /**
     * Release ownership of a committee case
     */
    public CommitteeCaseResponse releaseOwnership(UUID caseId) {
        CommitteeCaseEntity entity = caseRepository.findById(caseId)
            .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseId));
        CommitteeCaseAggregate aggregate = toAggregate(entity);
        
        aggregate.releaseOwnership();
        
        entity.setCurrentOwnerId(null);
        entity.setOwnershipAcquiredAt(null);
        caseRepository.save(entity);
        
        return caseMapper.toResponse(entity);
    }
    
    private CommitteeCaseAggregate toAggregate(CommitteeCaseEntity entity) {
        return CommitteeCaseAggregate.builder()
            .caseId(entity.getCaseId())
            .originalCaseId(entity.getOriginalCaseId())
            .caseCode(entity.getCaseCode())
            .taxpayerId(entity.getTaxpayerId())
            .taxpayerName(entity.getTaxpayerName())
            .taxIdNumber(entity.getTaxIdNumber())
            .segment(entity.getSegment())
            .industry(entity.getIndustry())
            .riskScore(entity.getRiskScore())
            .riskPriority(entity.getRiskPriority())
            .status(entity.getStatus() != null ? CommitteeCaseAggregate.CommitteeCaseStatus.valueOf(entity.getStatus()) : null)
            .createdDate(entity.getCreatedDate())
            .committeeDeadline(entity.getCommitteeDeadline())
            .extendedDeadline(entity.getExtendedDeadline())
            .extensionCount(entity.getExtensionCount())
            .currentOwnerId(entity.getCurrentOwnerId())
            .ownershipAcquiredAt(entity.getOwnershipAcquiredAt())
            .decision(entity.getDecision() != null ? CommitteeCaseAggregate.CommitteeCaseDecision.valueOf(entity.getDecision()) : null)
            .decisionDate(entity.getDecisionDate())
            .decisionReason(entity.getDecisionReason())
            .chairpersonId(entity.getChairpersonId())
            .handoffRecordId(entity.getHandoffRecordId())
            .handoffDate(entity.getHandoffDate())
            .build();
    }
    
    /**
     * Legacy execute method for compatibility if needed
     */
    @Transactional(readOnly = true)
    public Page<CommitteeCaseResponse> execute(CaseFilterCriteria filter, Pageable pageable) {
        String status = filter != null ? filter.getStatus() : null;
        String riskPriority = filter != null ? filter.getRiskPriority() : null;
        return execute(status, riskPriority, null, pageable);
    }
    
    @Data
    public static class CaseFilterCriteria {
        private String status;
        private String riskPriority;
        private UUID taxpayerId;
        private String segment;
    }
}
