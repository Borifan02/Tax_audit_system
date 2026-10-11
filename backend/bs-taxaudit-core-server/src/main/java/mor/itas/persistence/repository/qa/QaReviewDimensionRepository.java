package mor.itas.persistence.repository.qa;

import mor.itas.persistence.jpa.entity.qa.QaReviewDimensionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QaReviewDimensionRepository extends JpaRepository<QaReviewDimensionEntity, UUID> {

    List<QaReviewDimensionEntity> findByQaReviewCaseIdOrderByDisplayOrderAsc(UUID qaReviewCaseId);

    Optional<QaReviewDimensionEntity> findByQaReviewCaseIdAndDimensionCode(UUID qaReviewCaseId, String dimensionCode);

    long countByQaReviewCaseId(UUID qaReviewCaseId);

    void deleteByQaReviewCaseId(UUID qaReviewCaseId);
}
