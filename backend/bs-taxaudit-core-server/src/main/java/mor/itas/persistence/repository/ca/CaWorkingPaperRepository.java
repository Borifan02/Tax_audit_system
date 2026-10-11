package mor.itas.persistence.repository.ca;

import mor.itas.persistence.jpa.entity.ca.CaWorkingPaperEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CaWorkingPaperRepository extends JpaRepository<CaWorkingPaperEntity, UUID> {
    List<CaWorkingPaperEntity> findByAuditCaseIdOrderByCreatedAtDesc(UUID auditCaseId);
    List<CaWorkingPaperEntity> findByAuditCaseIdAndCategory(UUID auditCaseId, String category);
    long countByAuditCaseIdAndStatus(UUID auditCaseId, String status);
}
