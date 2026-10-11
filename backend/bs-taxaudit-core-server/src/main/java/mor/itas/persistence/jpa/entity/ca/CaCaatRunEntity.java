package mor.itas.persistence.jpa.entity.ca;

import jakarta.persistence.*;
import lombok.*;
import mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * CAAT Execution Run — FR-04.4-02, 14
 * Represents one execution of automated CAAT algorithms over the taxpayer ledger data.
 */
@Entity
@Table(name = "ca_caat_runs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaCaatRunEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audit_case_id", nullable = false)
    private ApAuditCaseEntity auditCase;

    @Column(nullable = false, length = 64)
    private String runReference;

    @Column(nullable = false, length = 128)
    @Builder.Default
    private String caatToolName = "ITAS Automated CAAT Suite";

    /** STRATIFIED | RANDOM | SYSTEMATIC_MUS */
    @Column(nullable = false, length = 64)
    private String samplingMethod;

    @Builder.Default
    private Integer totalRecordsMined = 0;

    @Builder.Default
    private Integer totalFlagged = 0;

    @Column(precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalFlaggedExposure = BigDecimal.ZERO;

    /** PENDING | RUNNING | COMPLETED | FAILED */
    @Column(nullable = false, length = 32)
    @Builder.Default
    private String status = "PENDING";

    @Column(columnDefinition = "TEXT")
    private String auditorNotes;

    @Column(columnDefinition = "TEXT")
    private String executionLog;

    private String executedBy;
    private OffsetDateTime startedAt;
    private OffsetDateTime completedAt;

    @CreationTimestamp
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    private OffsetDateTime updatedAt;

    // Child associations
    @OneToMany(mappedBy = "caatRun", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<CaCaatRuleEntity> rules = new ArrayList<>();

    @OneToMany(mappedBy = "caatRun", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<CaCaatExceptionEntity> exceptions = new ArrayList<>();

    @OneToMany(mappedBy = "caatRun", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<CaBenfordAnalysisEntity> benfordStats = new ArrayList<>();
}
