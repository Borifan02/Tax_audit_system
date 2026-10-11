package mor.itas.persistence.repository.qa;

import mor.itas.persistence.jpa.entity.qa.QaSamplingRuleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * FR-04.9.2-01 — the sampling engine reads its strategies from these rules,
 * so switching strategy is a data change and no strategy is hard-coded.
 */
@Repository
public interface QaSamplingRuleRepository extends JpaRepository<QaSamplingRuleEntity, UUID> {

    Optional<QaSamplingRuleEntity> findByCode(String code);

    List<QaSamplingRuleEntity> findByActiveTrueOrderByCodeAsc();

    List<QaSamplingRuleEntity> findByActiveTrueAndStrategyOrderByCodeAsc(String strategy);
}
