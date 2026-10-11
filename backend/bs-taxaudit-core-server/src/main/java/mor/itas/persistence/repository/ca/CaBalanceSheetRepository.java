package mor.itas.persistence.repository.ca;

import mor.itas.persistence.jpa.entity.ca.CaBalanceSheetItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface CaBalanceSheetRepository extends JpaRepository<CaBalanceSheetItemEntity, UUID> {
    List<CaBalanceSheetItemEntity> findByAuditCaseIdOrderByCreatedAtDesc(UUID auditCaseId);
    List<CaBalanceSheetItemEntity> findByAuditCaseIdAndAssertionType(UUID auditCaseId, String assertionType);

    @Query("SELECT COALESCE(SUM(ABS(b.variance)), 0) FROM CaBalanceSheetItemEntity b WHERE b.auditCase.id = :caseId")
    BigDecimal sumVarianceByAuditCaseId(UUID caseId);
}
