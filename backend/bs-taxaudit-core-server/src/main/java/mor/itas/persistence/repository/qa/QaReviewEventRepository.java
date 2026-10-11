package mor.itas.persistence.repository.qa;

import mor.itas.persistence.jpa.entity.qa.QaReviewEventEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/** Per-review FR-04.9.2-xx workflow trace — the workspace audit-trail drawer. */
@Repository
public interface QaReviewEventRepository extends JpaRepository<QaReviewEventEntity, UUID> {

    List<QaReviewEventEntity> findByQaReviewCaseIdOrderByOccurredAtAsc(UUID qaReviewCaseId);

    List<QaReviewEventEntity> findTop50ByQaReviewCaseIdOrderByOccurredAtDesc(UUID qaReviewCaseId);

    List<QaReviewEventEntity> findTop25ByOrderByOccurredAtDesc();
}
