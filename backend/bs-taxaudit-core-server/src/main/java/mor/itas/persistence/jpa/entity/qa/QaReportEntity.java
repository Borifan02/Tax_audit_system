package mor.itas.persistence.jpa.entity.qa;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.util.UUID;
import java.util.List;

@Entity
@Table(name = "qa_reports")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QaReportEntity {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "qa_case_id")
    private UUID qaCaseId;

    private String generatedDate;
    
    @Column(columnDefinition = "TEXT")
    private String executiveSummary;
    
    private String overallRating;
    private Integer totalWeightedScore;
    private Integer criticalDeficienciesCount;
    private Integer majorDeficienciesCount;
    
    @Column(columnDefinition = "TEXT")
    private String keyStrengths;
    
    @Column(columnDefinition = "TEXT")
    private String systemicVulnerabilities;
    
    @Column(columnDefinition = "TEXT")
    private String recommendationsForDirector;
    
    @Column(columnDefinition = "TEXT")
    private String mandatoryCorrectiveActions;
}
