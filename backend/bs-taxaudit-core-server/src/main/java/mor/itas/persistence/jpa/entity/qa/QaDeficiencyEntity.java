package mor.itas.persistence.jpa.entity.qa;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.util.UUID;

@Entity
@Table(name = "qa_deficiencies")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QaDeficiencyEntity {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "qa_case_id")
    private UUID qaCaseId;

    private String dimensionId;
    private String dimensionTitle;
    private String severity;
    private String title;
    private String findingDescription;
    private String statutoryBreach;
    private String correctiveActionMandate;
    private String status;
}
