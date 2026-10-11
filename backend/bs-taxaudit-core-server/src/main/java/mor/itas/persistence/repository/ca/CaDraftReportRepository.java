package mor.itas.persistence.repository.ca;

import mor.itas.persistence.jpa.entity.ca.CaDraftReportEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CaDraftReportRepository extends JpaRepository<CaDraftReportEntity, UUID> {
    List<CaDraftReportEntity> findByAuditCaseIdOrderByCreatedAtDesc(UUID auditCaseId);
    Optional<CaDraftReportEntity> findTopByAuditCaseIdOrderByCreatedAtDesc(UUID auditCaseId);
    Optional<CaDraftReportEntity> findByAuditCaseIdAndStatus(UUID auditCaseId, String status);
}
