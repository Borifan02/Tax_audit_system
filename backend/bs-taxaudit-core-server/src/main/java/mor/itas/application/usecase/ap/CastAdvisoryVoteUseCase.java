package mor.itas.application.usecase.ap;

import mor.itas.api.dto.response.ap.jac.VotingTallyResponse;
import mor.itas.domain.service.ap.VotingService;
import mor.itas.domain.exception.DuplicateVoteException;
import mor.itas.domain.exception.InvalidVotingStateException;
import mor.itas.domain.exception.UnauthorizedAccessException;
import mor.itas.domain.aggregate.ap.AdvisoryVotingAggregate;
import mor.itas.domain.valueobject.VoteOption;
import mor.itas.domain.valueobject.CommitteeVote;
import mor.itas.domain.valueobject.VotingTally;
import mor.itas.persistence.jpa.repository.ap.AdvisoryVotingRepository;
import mor.itas.persistence.jpa.repository.ap.CommitteeCaseRepository;
import mor.itas.persistence.jpa.repository.ap.UserJpaRepository;
import mor.itas.persistence.jpa.entity.ap.AdvisoryVotingEntity;
import mor.itas.persistence.jpa.entity.ap.CommitteeVoteEntity;
import mor.itas.persistence.jpa.entity.ap.CommitteeCaseEntity;
import mor.itas.persistence.jpa.entity.ap.CaseStatusHistoryEntity;
import mor.itas.observability.audit.ActorContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.time.OffsetDateTime;
import java.util.UUID;
import java.util.Map;
import java.util.HashMap;

/**
 * Use Case: Cast Advisory Vote
 * Allows committee members to cast votes on cases
 * Enforces one-vote-per-member business rule
 */
@Component
@RequiredArgsConstructor
@Transactional
@Slf4j
public class CastAdvisoryVoteUseCase {
    private final VotingService votingService;
    private final AdvisoryVotingRepository votingRepository;
    private final CommitteeCaseRepository caseRepository;
    private final UserJpaRepository userRepository;
    
    /**
     * Overloaded execute method to match controller signature
     */
    public VotingTallyResponse execute(UUID caseId, mor.itas.api.dto.request.ap.jac.CastVoteRequest request)
            throws DuplicateVoteException, InvalidVotingStateException {
        
        AdvisoryVotingEntity votingEntity = votingRepository.findByCommitteeCaseEntityCaseId(caseId)
            .orElseGet(() -> createVotingSession(caseId));
        
        UUID memberId;
        try {
            memberId = UUID.fromString(ActorContextHolder.getActorId());
        } catch (Exception e) {
            throw new IllegalStateException("Authenticated committee member is required to cast a vote");
        }

        UserJpaRepository userRepo = userRepository;
        boolean committeeMember = userRepo.findById(memberId)
            .map(user -> "COMMITTEE_MEMBER".equalsIgnoreCase(user.getUserType()))
            .orElse(false);
        if (!committeeMember) {
            throw new UnauthorizedAccessException("Only committee members can cast advisory votes");
        }
        
        CastVoteRequest useCaseRequest = new CastVoteRequest(
            votingEntity.getVotingId(),
            memberId,
            VoteOption.fromPersistedValue(request.getVoteOption()),
            request.getReasoning()
        );
        
        this.execute(useCaseRequest);
        
        // Recalculate and return tally
        AdvisoryVotingEntity updatedEntity = votingRepository.findById(votingEntity.getVotingId())
            .orElseThrow(() -> new IllegalStateException("Failed to load updated voting session"));
        AdvisoryVotingAggregate aggregate = toAggregate(updatedEntity);
        VotingTally tally = votingService.calculateTally(aggregate);
        
        // End-to-end status transition: if all committee members have voted and consensus reached,
        // auto-transition case from PENDING_VOTES → TEAM_ASSIGNED
        if (tally.getOutcome() == VotingTally.VotingOutcome.PASSED
                || tally.getOutcome() == VotingTally.VotingOutcome.FAILED) {
            transitionCaseStatusIfNeeded(updatedEntity.getCommitteeCaseEntity(), tally, memberId);
        }
        
        return VotingTallyResponse.builder()
            .votingId(updatedEntity.getVotingId())
            .approveCount(tally.getApproveCount())
            .rejectCount(tally.getRejectCount())
            .moreInfoCount(tally.getMoreInfoCount())
            .totalVotesCast(tally.getTotalVotesCast())
            .consensusPercentage(tally.getConsensusPercentage())
            .outcome(tally.getOutcome().toString())
            .votingStartedAt(updatedEntity.getVotingStartedAt())
            .build();
    }

    /**
     * Execute: Cast a vote on a case
     * 
     * @param request contains votingId, memberId, option, reasoning
     * @throws DuplicateVoteException if member already voted
     * @throws InvalidVotingStateException if voting is not open
     */
    public void execute(CastVoteRequest request) 
        throws DuplicateVoteException, InvalidVotingStateException {
        
        // Validate voting exists and is open
        AdvisoryVotingEntity votingEntity = votingRepository.findById(request.getVotingId())
            .orElseThrow(() -> new IllegalArgumentException("Voting not found: " + request.getVotingId()));
        
        AdvisoryVotingAggregate aggregate = toAggregate(votingEntity);
        
        // Cast the vote via domain service
        votingService.castVote(
            aggregate,
            request.getMemberId(),
            request.getOption(),
            request.getReasoning()
        );
        
        // Save the vote entity
        CommitteeVoteEntity voteEntity = CommitteeVoteEntity.builder()
            .voteId(UUID.randomUUID())
            .votingEntity(votingEntity)
            .committeeCaseEntity(votingEntity.getCommitteeCaseEntity())
            .memberId(request.getMemberId())
            .voteOption(request.getOption().name())
            .reasoning(request.getReasoning())
            .votedAt(OffsetDateTime.now())
            .build();
            
        votingEntity.getVotes().add(voteEntity);
        votingRepository.save(votingEntity);
    }
    
    /**
     * End-to-end case status transition.
     * When voting outcome is definitive (PASSED or REJECTED), auto-transition:
     *   - PASSED:   PENDING_VOTES → TEAM_ASSIGNED
     *   - REJECTED: PENDING_VOTES → REJECTED
     * Records the transition in t_case_status_history.
     */
    private void transitionCaseStatusIfNeeded(CommitteeCaseEntity caseEntity, VotingTally tally, UUID triggeredBy) {
        if (caseEntity == null) return;

        String currentStatus = caseEntity.getStatus();
        String newStatus;

        if ("PENDING_VOTES".equals(currentStatus)) {
            if (tally.getOutcome() == VotingTally.VotingOutcome.PASSED) {
                newStatus = "TEAM_ASSIGNED";
            } else if (tally.getOutcome() == VotingTally.VotingOutcome.FAILED) {
                newStatus = "REJECTED";
            } else {
                return; // INSUFFICIENT / INCONCLUSIVE — stay in PENDING_VOTES
            }
        } else {
            return; // Only transition from PENDING_VOTES
        }

        log.info("Case {} status transition: {} → {} (outcome={}, triggeredBy={})",
                 caseEntity.getCaseId(), currentStatus, newStatus, tally.getOutcome(), triggeredBy);

        // Record status history
        CaseStatusHistoryEntity history = CaseStatusHistoryEntity.builder()
                .historyId(UUID.randomUUID())
                .committeeCaseEntity(caseEntity)
                .oldStatus(currentStatus)
                .newStatus(newStatus)
                .transitionReason("Voting outcome: " + tally.getOutcome()
                    + " | Approve=" + tally.getApproveCount()
                    + " Reject=" + tally.getRejectCount()
                    + " MoreInfo=" + tally.getMoreInfoCount()
                    + " Consensus=" + tally.getConsensusPercentage() + "%")
                .transitionedBy(triggeredBy)
                .transitionedAt(OffsetDateTime.now())
                .build();

        caseEntity.getStatusHistory().add(history);
        caseEntity.setStatus(newStatus);
        caseRepository.save(caseEntity);
    }

    private AdvisoryVotingAggregate toAggregate(AdvisoryVotingEntity entity) {
        Map<UUID, CommitteeVote> votes = new HashMap<>();
        if (entity.getVotes() != null) {
            for (CommitteeVoteEntity voteEntity : entity.getVotes()) {
                votes.put(voteEntity.getMemberId(), CommitteeVote.builder()
                    .voterId(voteEntity.getMemberId())
                    .option(VoteOption.fromPersistedValue(voteEntity.getVoteOption()))
                    .reasoning(voteEntity.getReasoning())
                    .votedAt(voteEntity.getVotedAt())
                    .build());
            }
        }
        
        return AdvisoryVotingAggregate.builder()
            .votingId(entity.getVotingId())
            .committeeCaseId(entity.getCommitteeCaseEntity() != null ? entity.getCommitteeCaseEntity().getCaseId() : null)
            .status(AdvisoryVotingAggregate.VotingStatus.valueOf(entity.getStatus()))
            .consensusThreshold(entity.getConsensusThreshold())
            .votingStartedAt(entity.getVotingStartedAt())
            .votingClosedAt(entity.getVotingClosedAt())
            .votes(votes)
            .build();
    }
    
    private AdvisoryVotingEntity createVotingSession(UUID caseId) {
        mor.itas.persistence.jpa.entity.ap.CommitteeCaseEntity caseEntity = caseRepository.findById(caseId)
            .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseId));
        AdvisoryVotingEntity voting = AdvisoryVotingEntity.builder()
            .votingId(UUID.randomUUID())
            .committeeCaseEntity(caseEntity)
            .status("OPEN")
            .consensusThreshold(60)
            .votingStartedAt(OffsetDateTime.now())
            .votes(new java.util.ArrayList<>())
            .build();
        return votingRepository.save(voting);
    }

    @Data
    public static class CastVoteRequest {
        private UUID votingId;
        private UUID memberId;
        private VoteOption option;
        private String reasoning;
        
        public CastVoteRequest() {}
        
        public CastVoteRequest(UUID votingId, UUID memberId, VoteOption option, String reasoning) {
            this.votingId = votingId;
            this.memberId = memberId;
            this.option = option;
            this.reasoning = reasoning;
        }
    }
}
