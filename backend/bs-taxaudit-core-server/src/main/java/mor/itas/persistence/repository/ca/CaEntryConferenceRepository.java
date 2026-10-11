package mor.itas.persistence.repository.ca;

import mor.itas.persistence.jpa.entity.ca.CaEntryConferenceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CaEntryConferenceRepository extends JpaRepository<CaEntryConferenceEntity, UUID> {
    List<CaEntryConferenceEntity> findByAuditCaseIdOrderByCreatedAtDesc(UUID auditCaseId);
    Optional<CaEntryConferenceEntity> findTopByAuditCaseIdOrderByCreatedAtDesc(UUID auditCaseId);
    Optional<CaEntryConferenceEntity> findByAuditCaseIdAndStatus(UUID auditCaseId, String status);
}
