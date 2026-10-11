package mor.itas.persistence.repository.ca;

import mor.itas.persistence.jpa.entity.ca.CaExecutionReportEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CaExecutionReportRepository extends JpaRepository<CaExecutionReportEntity, UUID> {
    List<CaExecutionReportEntity> findByAuditCaseId(UUID caseId);
    Optional<CaExecutionReportEntity> findTopByAuditCaseIdOrderByCreatedAtDesc(UUID caseId);
}
