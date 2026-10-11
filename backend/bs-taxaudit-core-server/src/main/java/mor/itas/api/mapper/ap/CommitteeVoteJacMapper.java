package mor.itas.api.mapper.ap;

import mor.itas.api.dto.response.ap.jac.VoteHistoryResponse;
import mor.itas.api.dto.response.ap.jac.VotingTallyResponse;
import mor.itas.persistence.jpa.entity.ap.CommitteeVoteEntity;
import mor.itas.persistence.jpa.entity.ap.VotingTallyEntity;
import org.springframework.stereotype.Component;

/**
 * Mapper for voting entities to response DTOs
 */
@Component
public class CommitteeVoteJacMapper {
    
    public VotingTallyResponse toTallyResponse(VotingTallyEntity entity) {
        if (entity == null) {
            return null;
        }
        
        return VotingTallyResponse.builder()
            .votingId(entity.getVotingEntity() != null ? entity.getVotingEntity().getVotingId() : null)
            .approveCount(entity.getApproveCount())
            .rejectCount(entity.getRejectCount())
            .moreInfoCount(entity.getMoreInfoCount())
            .totalVotesCast(entity.getTotalVotesCast())
            .consensusPercentage(entity.getConsensusPercentage() != null ? entity.getConsensusPercentage().doubleValue() : null)
            .outcome(entity.getVotingOutcome())
            .votingStartedAt(entity.getCalculatedAt())
            .build();
    }
    
    public VoteHistoryResponse toHistoryResponse(CommitteeVoteEntity entity) {
        if (entity == null) {
            return null;
        }
        
        return VoteHistoryResponse.builder()
            .voteId(entity.getVoteId())
            .memberId(entity.getMemberId())
            .voteOption(entity.getVoteOption())
            .reasoning(entity.getReasoning())
            .votedAt(entity.getVotedAt())
            .build();
    }
}
