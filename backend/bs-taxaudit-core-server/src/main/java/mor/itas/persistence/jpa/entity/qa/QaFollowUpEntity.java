package mor.itas.persistence.jpa.entity.qa;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.util.UUID;

@Entity
@Table(name = "qa_follow_ups")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QaFollowUpEntity {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "qa_case_id", nullable = false)
    private UUID qaCaseId;

    @Column(name = "deficiency_id", nullable = false)
    private UUID deficiencyId;

    private String originalAuditorId;
    private String status; // PENDING, SUBMITTED, APPROVED, REJECTED
    
    private String dueDate;
    
    @Column(columnDefinition = "TEXT")
    private String correctiveActionProof;
}
