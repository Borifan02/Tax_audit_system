package mor.itas.persistence.repository.qa;

import mor.itas.persistence.jpa.entity.qa.QaReportEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface QaReportRepository extends JpaRepository<QaReportEntity, UUID> {
    Optional<QaReportEntity> findByQaCaseId(UUID qaCaseId);
}
