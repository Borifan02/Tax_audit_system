package mor.itas.persistence.jpa.entity.qa;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.util.UUID;

@Entity
@Table(name = "qa_exit_conferences")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QaExitConferenceEntity {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "qa_case_id", nullable = false)
    private UUID qaCaseId;

    private String scheduledDate;
    private String status; // SCHEDULED, COMPLETED, CANCELLED
    
    @Column(columnDefinition = "TEXT")
    private String minutes;
    
    @Column(columnDefinition = "TEXT")
    private String auditorComments;
    
    private Boolean resolvedFlag; // True if disagreements are resolved
}
