package mor.itas.persistence.jpa.entity.ca;

import jakarta.persistence.*;
import lombok.*;
import mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "ca_audit_assertions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaAuditAssertionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audit_case_id", nullable = false)
    private ApAuditCaseEntity auditCase;

    @Column(nullable = false)
    private String financialArea;

    @Column(nullable = false)
    private String assertionType;

    private BigDecimal expectedValue;
    private BigDecimal actualValue;
    private String verificationResult;
    private String explanation;
    private String finding;
    private String conclusion;
    private String createdBy;

    @CreationTimestamp
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
