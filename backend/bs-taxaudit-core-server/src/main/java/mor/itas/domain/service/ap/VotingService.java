package mor.itas.domain.service.ap;

import mor.itas.domain.aggregate.ap.AdvisoryVotingAggregate;
import mor.itas.domain.exception.DuplicateVoteException;
import mor.itas.domain.exception.InvalidVotingStateException;
import mor.itas.domain.valueobject.VoteOption;
import mor.itas.domain.valueobject.VotingTally;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.UUID;

/**
 * Domain Service for Advisory Voting
 * Handles voting logic and consensus calculation
 */
@Service
@RequiredArgsConstructor
public class VotingService {

    /**
     * Cast a vote on a case
     * Enforces one-vote-per-member rule
     */
    public void castVote(AdvisoryVotingAggregate voting, UUID memberId, VoteOption option, String reasoning)
            throws DuplicateVoteException, InvalidVotingStateException {

        if (voting == null) {
            throw new IllegalArgumentException("Voting aggregate cannot be null");
        }

        if (memberId == null || option == null) {
            throw new IllegalArgumentException("Member ID and vote option cannot be null");
        }

        voting.castVote(memberId, option, reasoning);
    }

    /**
     * Calculate tally for a voting session
     */
    public VotingTally calculateTally(AdvisoryVotingAggregate voting) {
        if (voting == null) {
            throw new IllegalArgumentException("Voting aggregate cannot be null");
        }
        return voting.getTally();
    }

    /**
     * Check if consensus has been reached
     */
    public boolean hasConsensus(AdvisoryVotingAggregate voting, Integer threshold) {
        if (voting == null) {
            throw new IllegalArgumentException("Voting aggregate cannot be null");
        }

        if (threshold == null || threshold < 0 || threshold > 100) {
            throw new IllegalArgumentException("Threshold must be between 0 and 100");
        }

        if (voting.getConsensusThreshold() == null) {
            voting.setConsensusThreshold(threshold);
        }

        return voting.hasConsensus();
    }

    /**
     * Determine voting outcome
     */
    public VotingTally.VotingOutcome determineOutcome(AdvisoryVotingAggregate voting, Integer threshold) {
        if (voting == null) {
            throw new IllegalArgumentException("Voting aggregate cannot be null");
        }

        if (threshold == null || threshold < 0 || threshold > 100) {
            throw new IllegalArgumentException("Threshold must be between 0 and 100");
        }

        if (voting.getConsensusThreshold() == null) {
            voting.setConsensusThreshold(threshold);
        }

        return voting.getOutcome();
    }

    /**
     * Close voting phase
     */
    public void closeVoting(AdvisoryVotingAggregate voting) {
        if (voting == null) {
            throw new IllegalArgumentException("Voting aggregate cannot be null");
        }
        voting.closeVoting();
    }

    /**
     * Reopen voting for more research
     */
    public void reopenVoting(AdvisoryVotingAggregate voting) {
        if (voting == null) {
            throw new IllegalArgumentException("Voting aggregate cannot be null");
        }
        voting.reopenVoting();
    }

    /**
     * Check if member has already voted
     */
    public boolean hasVoted(AdvisoryVotingAggregate voting, UUID memberId) {
        if (voting == null) {
            throw new IllegalArgumentException("Voting aggregate cannot be null");
        }

        if (memberId == null) {
            throw new IllegalArgumentException("Member ID cannot be null");
        }

        return voting.hasVoted(memberId);
    }

    /**
     * Get total votes cast
     */
    public int getTotalVotesCast(AdvisoryVotingAggregate voting) {
        if (voting == null) {
            throw new IllegalArgumentException("Voting aggregate cannot be null");
        }
        return voting.getAllVotes().size();
    }

    /**
     * Validate voting state is OPEN for vote casting
     */
    public void validateVotingOpen(AdvisoryVotingAggregate voting) {
        if (voting == null) {
            throw new IllegalArgumentException("Voting aggregate cannot be null");
        }

        if (voting.getStatus() != AdvisoryVotingAggregate.VotingStatus.OPEN) {
            throw new InvalidVotingStateException(voting.getStatus().name(), "cast vote");
        }
    }

    /**
     * Get consensus threshold with default
     */
    public Integer getConsensusThreshold(AdvisoryVotingAggregate voting) {
        if (voting == null) {
            throw new IllegalArgumentException("Voting aggregate cannot be null");
        }

        return voting.getConsensusThreshold() != null ? voting.getConsensusThreshold() : 60;
    }
}
