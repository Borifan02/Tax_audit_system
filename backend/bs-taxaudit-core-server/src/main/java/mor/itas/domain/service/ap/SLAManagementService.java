package mor.itas.domain.service.ap;

import mor.itas.domain.aggregate.CommitteeCaseAggregate;
import mor.itas.domain.exception.SLAExtensionLimitExceededException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

/**
 * Domain Service for SLA Management
 * Handles deadline calculation, extensions, and breach detection
 */
@Service
@RequiredArgsConstructor
public class SLAManagementService {

    private static final int MAX_EXTENSIONS = 2;
    private static final int DEFAULT_BUSINESS_DAYS = 30;

    /**
     * Set initial deadline for committee review
     */
    public OffsetDateTime setInitialDeadline(CommitteeCaseAggregate committeeCase, Integer businessDays) {
        if (committeeCase == null) {
            throw new IllegalArgumentException("Committee case cannot be null");
        }

        int days = businessDays != null ? businessDays : DEFAULT_BUSINESS_DAYS;
        if (days <= 0) {
            throw new IllegalArgumentException("Business days must be greater than 0");
        }

        OffsetDateTime deadline = OffsetDateTime.now().plus(days, ChronoUnit.DAYS);
        committeeCase.setCommitteeDeadline(deadline);
        committeeCase.setExtensionCount(0);

        return deadline;
    }

    /**
     * Extend SLA deadline
     * Maximum 2 extensions allowed
     */
    public OffsetDateTime extendDeadline(CommitteeCaseAggregate committeeCase, 
                                        Integer extensionBusinessDays, 
                                        String reason,
                                        UUID approvedBy) throws SLAExtensionLimitExceededException {
        if (committeeCase == null) {
            throw new IllegalArgumentException("Committee case cannot be null");
        }

        int currentCount = committeeCase.getExtensionCount() != null ? 
                committeeCase.getExtensionCount() : 0;

        if (currentCount >= MAX_EXTENSIONS) {
            throw new SLAExtensionLimitExceededException(currentCount, MAX_EXTENSIONS);
        }

        int days = extensionBusinessDays != null ? extensionBusinessDays : DEFAULT_BUSINESS_DAYS;
        if (days <= 0) {
            throw new IllegalArgumentException("Extension days must be greater than 0");
        }

        OffsetDateTime currentDeadline = committeeCase.getExtendedDeadline() != null ?
                committeeCase.getExtendedDeadline() : committeeCase.getCommitteeDeadline();

        OffsetDateTime newDeadline = currentDeadline.plus(days, ChronoUnit.DAYS);
        committeeCase.setExtendedDeadline(newDeadline);
        committeeCase.setExtensionCount(currentCount + 1);

        return newDeadline;
    }

    /**
     * Get effective deadline (extended or original)
     */
    public OffsetDateTime getEffectiveDeadline(CommitteeCaseAggregate committeeCase) {
        if (committeeCase == null) {
            throw new IllegalArgumentException("Committee case cannot be null");
        }

        return committeeCase.getExtendedDeadline() != null ?
                committeeCase.getExtendedDeadline() : committeeCase.getCommitteeDeadline();
    }

    /**
     * Check if case deadline has been exceeded
     */
    public boolean isOverdue(CommitteeCaseAggregate committeeCase) {
        if (committeeCase == null) {
            throw new IllegalArgumentException("Committee case cannot be null");
        }

        OffsetDateTime deadline = getEffectiveDeadline(committeeCase);
        return deadline != null && OffsetDateTime.now().isAfter(deadline);
    }

    /**
     * Get days remaining until deadline
     */
    public long getDaysRemaining(CommitteeCaseAggregate committeeCase) {
        if (committeeCase == null) {
            throw new IllegalArgumentException("Committee case cannot be null");
        }

        OffsetDateTime deadline = getEffectiveDeadline(committeeCase);
        if (deadline == null) {
            return 0;
        }

        return ChronoUnit.DAYS.between(OffsetDateTime.now(), deadline);
    }

    /**
     * Get hours remaining until deadline
     */
    public long getHoursRemaining(CommitteeCaseAggregate committeeCase) {
        if (committeeCase == null) {
            throw new IllegalArgumentException("Committee case cannot be null");
        }

        OffsetDateTime deadline = getEffectiveDeadline(committeeCase);
        if (deadline == null) {
            return 0;
        }

        return ChronoUnit.HOURS.between(OffsetDateTime.now(), deadline);
    }

    /**
     * Check if SLA breach escalation is needed (less than 24 hours remaining)
     */
    public boolean shouldEscalate(CommitteeCaseAggregate committeeCase) {
        if (committeeCase == null) {
            throw new IllegalArgumentException("Committee case cannot be null");
        }

        long hoursRemaining = getHoursRemaining(committeeCase);
        return hoursRemaining > 0 && hoursRemaining <= 24;
    }

    /**
     * Get remaining extensions available
     */
    public int getRemainingExtensions(CommitteeCaseAggregate committeeCase) {
        if (committeeCase == null) {
            throw new IllegalArgumentException("Committee case cannot be null");
        }

        int currentCount = committeeCase.getExtensionCount() != null ?
                committeeCase.getExtensionCount() : 0;

        return MAX_EXTENSIONS - currentCount;
    }

    /**
     * Check if case can be extended
     */
    public boolean canExtend(CommitteeCaseAggregate committeeCase) {
        if (committeeCase == null) {
            throw new IllegalArgumentException("Committee case cannot be null");
        }

        return getRemainingExtensions(committeeCase) > 0;
    }

    /**
     * Format deadline for display
     */
    public String formatDeadline(CommitteeCaseAggregate committeeCase) {
        if (committeeCase == null) {
            throw new IllegalArgumentException("Committee case cannot be null");
        }

        OffsetDateTime deadline = getEffectiveDeadline(committeeCase);
        if (deadline == null) {
            return "Not set";
        }

        if (isOverdue(committeeCase)) {
            return "OVERDUE: " + deadline;
        } else {
            long daysRemaining = getDaysRemaining(committeeCase);
            return daysRemaining + " days remaining";
        }
    }
}
