package mor.itas.persistence.repository.ca;

import mor.itas.persistence.jpa.entity.ca.CaAuditFindingEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface CaAuditFindingRepository extends JpaRepository<CaAuditFindingEntity, UUID> {
    List<CaAuditFindingEntity> findByAuditCaseIdOrderByCreatedAtDesc(UUID auditCaseId);
    List<CaAuditFindingEntity> findByAuditCaseIdAndStatus(UUID auditCaseId, String status);
    List<CaAuditFindingEntity> findByAuditCaseIdAndIndicatesFraudTrue(UUID auditCaseId);

    @Query("SELECT COALESCE(SUM(f.totalTaxImpact), 0) FROM CaAuditFindingEntity f WHERE f.auditCase.id = :caseId AND f.status <> 'WITHDRAWN'")
    BigDecimal sumTotalTaxImpact(UUID caseId);

    @Query("SELECT COALESCE(SUM(f.totalTaxImpact), 0) FROM CaAuditFindingEntity f WHERE f.auditCase.id = :caseId AND f.taxType = :taxType AND f.status <> 'WITHDRAWN'")
    BigDecimal sumTaxImpactByTaxType(UUID caseId, String taxType);

    boolean existsByAuditCaseIdAndIndicatesFraudTrue(UUID auditCaseId);
    long countByAuditCaseIdAndStatus(UUID auditCaseId, String status);
}
