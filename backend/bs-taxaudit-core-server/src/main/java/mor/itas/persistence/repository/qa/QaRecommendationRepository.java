package mor.itas.persistence.repository.qa;

import mor.itas.persistence.jpa.entity.qa.QaRecommendationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * QA deficiency / recommendation register — FR-04.9.2-04 / -06 / -13.
 */
@Repository
public interface QaRecommendationRepository extends JpaRepository<QaRecommendationEntity, UUID> {

    List<QaRecommendationEntity> findByQaReviewCaseIdOrderByDisplayOrderAsc(UUID qaReviewCaseId);

    List<QaRecommendationEntity> findByAuditCaseId(UUID auditCaseId);

    List<QaRecommendationEntity> findByQaReviewCaseIdAndStatusNotIn(UUID qaReviewCaseId, List<String> statuses);

    long countByQaReviewCaseId(UUID qaReviewCaseId);

    long countByQaReviewCaseIdAndSeverity(UUID qaReviewCaseId, String severity);

    long countByQaReviewCaseIdAndStatusNotIn(UUID qaReviewCaseId, List<String> statuses);

    void deleteByQaReviewCaseIdAndId(UUID qaReviewCaseId, UUID id);
}
