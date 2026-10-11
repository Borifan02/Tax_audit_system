package mor.itas.application.usecase.ap;

import mor.itas.api.dto.response.ap.jac.VotingTallyResponse;
import mor.itas.api.dto.response.ap.jac.VoteHistoryResponse;
import mor.itas.api.mapper.ap.CommitteeVoteJacMapper;
import mor.itas.domain.service.ap.VotingService;
import mor.itas.domain.valueobject.VotingTally;
import mor.itas.domain.valueobject.VoteOption;
import mor.itas.domain.valueobject.CommitteeVote;
import mor.itas.domain.aggregate.ap.AdvisoryVotingAggregate;
import mor.itas.persistence.jpa.repository.ap.AdvisoryVotingRepository;
import mor.itas.persistence.jpa.repository.ap.CommitteeVoteRepository;
import mor.itas.persistence.jpa.entity.ap.AdvisoryVotingEntity;
import mor.itas.persistence.jpa.entity.ap.CommitteeVoteEntity;
import lombok.RequiredArgsConstructor;
import lombok.Data;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;
import java.util.Map;
import java.util.HashMap;

/**
 * Use Case: Get Vote Tally
 * Retrieves current voting tally and history for a case
 */
@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GetVoteTallyUseCase {
    private final VotingService votingService;
    private final AdvisoryVotingRepository votingRepository;
    private final CommitteeVoteRepository voteRepository;
    private final CommitteeVoteJacMapper voteMapper;
    
    /**
     * Execute: Get current voting tally
     * 
     * @param caseId the case ID
     * @return VotingTallyResponse with counts and outcome
     */
    public VotingTallyResponse execute(UUID caseId) {
        // If no voting session exists yet, return a default zero tally
        java.util.Optional<AdvisoryVotingEntity> votingOpt = votingRepository.findByCommitteeCaseEntityCaseId(caseId);
        
        if (votingOpt.isEmpty()) {
            return VotingTallyResponse.builder()
                .votingId(null)
                .approveCount(0)
                .rejectCount(0)
                .moreInfoCount(0)
                .totalVotesCast(0)
                .consensusPercentage(0.0)
                .outcome("INCONCLUSIVE")
                .votingStartedAt(null)
                .build();
        }
        
        AdvisoryVotingEntity voting = votingOpt.get();
        AdvisoryVotingAggregate aggregate = toAggregate(voting);
        
        // Calculate tally via domain service
        VotingTally tally = votingService.calculateTally(aggregate);
        
        // Convert to response
        return VotingTallyResponse.builder()
            .votingId(voting.getVotingId())
            .approveCount(tally.getApproveCount())
            .rejectCount(tally.getRejectCount())
            .moreInfoCount(tally.getMoreInfoCount())
            .totalVotesCast(tally.getTotalVotesCast())
            .consensusPercentage(tally.getConsensusPercentage())
            .outcome(tally.getOutcome().toString())
            .votingStartedAt(voting.getVotingStartedAt())
            .build();
    }

    /**
     * Retrieve vote history for a specific case
     */
    public Page<VoteHistoryResponse> getVoteHistory(UUID caseId, Pageable pageable) {
        return voteRepository.findByCommitteeCaseEntityCaseIdOrderByVotedAtDesc(caseId, pageable)
            .map(voteMapper::toHistoryResponse);
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
}
