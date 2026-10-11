package mor.itas.persistence.repository.qa;

import mor.itas.persistence.jpa.entity.qa.QaFollowUpActionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QaFollowUpActionRepository extends JpaRepository<QaFollowUpActionEntity, UUID> {

    List<QaFollowUpActionEntity> findByQaReviewCaseIdOrderByCreatedAtAsc(UUID qaReviewCaseId);

    List<QaFollowUpActionEntity> findByQaReviewCaseIdAndActionKind(UUID qaReviewCaseId, String actionKind);

    List<QaFollowUpActionEntity> findByQaReviewCaseIdAndStatusNot(UUID qaReviewCaseId, String status);

    long countByQaReviewCaseIdAndStatusNotIn(UUID qaReviewCaseId, List<String> statuses);
}
