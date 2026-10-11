package mor.itas.domain.event.ca;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Fired when a finding or review action triggers fraud escalation.
 * Mirrors TpFraudReferralEvent pattern exactly.
 * FR-04.4-28.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaFraudReferralEvent {
    private UUID caseId;
    private UUID findingId;         // the finding that triggered the referral (nullable for review-level)
    private String referringUserId;
    private String fraudIndicators;

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}
