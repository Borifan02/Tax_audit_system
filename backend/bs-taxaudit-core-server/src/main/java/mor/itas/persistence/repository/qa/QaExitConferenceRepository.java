package mor.itas.persistence.repository.qa;

import mor.itas.persistence.jpa.entity.qa.QaExitConferenceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface QaExitConferenceRepository extends JpaRepository<QaExitConferenceEntity, UUID> {
    Optional<QaExitConferenceEntity> findByQaCaseId(UUID qaCaseId);
}
