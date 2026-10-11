package mor.itas.persistence.repository.qa;

import mor.itas.persistence.jpa.entity.qa.QaReviewReportEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QaReviewReportRepository extends JpaRepository<QaReviewReportEntity, UUID> {

    List<QaReviewReportEntity> findByQaReviewCaseIdOrderByCreatedAtDesc(UUID qaReviewCaseId);

    Optional<QaReviewReportEntity> findTopByQaReviewCaseIdAndKindOrderByCreatedAtDesc(UUID qaReviewCaseId, String kind);

    Optional<QaReviewReportEntity> findTopByQaReviewCaseIdOrderByCreatedAtDesc(UUID qaReviewCaseId);

    List<QaReviewReportEntity> findByStatusOrderByCreatedAtAsc(String status);
}
