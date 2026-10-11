package mor.itas.persistence.repository.qa;

import mor.itas.persistence.jpa.entity.qa.QaReviewCaseEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface QaReviewCaseRepository extends JpaRepository<QaReviewCaseEntity, UUID> {
    boolean existsByAuditCaseId(UUID auditCaseId);
}
