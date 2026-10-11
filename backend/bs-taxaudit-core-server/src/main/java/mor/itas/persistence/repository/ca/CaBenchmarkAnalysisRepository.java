package mor.itas.persistence.repository.ca;

import mor.itas.persistence.jpa.entity.ca.CaBenchmarkAnalysisEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CaBenchmarkAnalysisRepository extends JpaRepository<CaBenchmarkAnalysisEntity, UUID> {
    List<CaBenchmarkAnalysisEntity> findByAuditCaseIdOrderByCreatedAtDesc(UUID auditCaseId);
    List<CaBenchmarkAnalysisEntity> findByAuditCaseIdAndRiskLevel(UUID auditCaseId, String riskLevel);
}
