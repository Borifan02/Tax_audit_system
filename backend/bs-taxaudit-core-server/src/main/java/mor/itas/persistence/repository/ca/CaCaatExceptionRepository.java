package mor.itas.persistence.repository.ca;

import mor.itas.persistence.jpa.entity.ca.CaCaatExceptionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CaCaatExceptionRepository extends JpaRepository<CaCaatExceptionEntity, UUID> {
    List<CaCaatExceptionEntity> findByAuditCaseIdOrderByCreatedAtDesc(UUID auditCaseId);
    List<CaCaatExceptionEntity> findByCaatRunId(UUID caatRunId);
    List<CaCaatExceptionEntity> findByAuditCaseIdAndStatus(UUID auditCaseId, String status);
    List<CaCaatExceptionEntity> findByAuditCaseIdAndRiskLevel(UUID auditCaseId, String riskLevel);

    @Query("SELECT COUNT(e) FROM CaCaatExceptionEntity e WHERE e.auditCase.id = :caseId AND e.status = 'PENDING_REVIEW'")
    long countPendingByAuditCaseId(UUID caseId);
}
