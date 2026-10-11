package mor.itas.persistence.repository.ca;

import mor.itas.persistence.jpa.entity.ca.CaMultiZoneAllocationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface CaMultiZoneAllocationRepository extends JpaRepository<CaMultiZoneAllocationEntity, UUID> {
    List<CaMultiZoneAllocationEntity> findByAuditCaseIdOrderByZoneNameAsc(UUID auditCaseId);
    List<CaMultiZoneAllocationEntity> findByNoticeId(UUID noticeId);

    @Query("SELECT COALESCE(SUM(z.netPayable), 0) FROM CaMultiZoneAllocationEntity z WHERE z.auditCase.id = :caseId")
    BigDecimal sumNetPayableByAuditCaseId(UUID caseId);
}
