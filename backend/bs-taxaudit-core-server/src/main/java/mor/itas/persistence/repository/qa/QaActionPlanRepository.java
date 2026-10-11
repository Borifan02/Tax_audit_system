package mor.itas.persistence.repository.qa;

import mor.itas.persistence.jpa.entity.qa.QaActionPlanEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QaActionPlanRepository extends JpaRepository<QaActionPlanEntity, UUID> {
    List<QaActionPlanEntity> findByAuditCaseId(UUID caseId);
    Optional<QaActionPlanEntity> findTopByAuditCaseIdOrderByCreatedAtDesc(UUID caseId);
}
