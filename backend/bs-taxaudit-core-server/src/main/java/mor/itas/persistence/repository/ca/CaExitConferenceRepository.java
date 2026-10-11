package mor.itas.persistence.repository.ca;

import mor.itas.persistence.jpa.entity.ca.CaExitConferenceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CaExitConferenceRepository extends JpaRepository<CaExitConferenceEntity, UUID> {
    List<CaExitConferenceEntity> findByAuditCaseIdOrderByCreatedAtDesc(UUID auditCaseId);
    Optional<CaExitConferenceEntity> findTopByAuditCaseIdOrderByCreatedAtDesc(UUID auditCaseId);
}
