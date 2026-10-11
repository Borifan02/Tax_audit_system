package mor.itas.persistence.repository.ca;

import mor.itas.persistence.jpa.entity.ca.CaCaatEligibilityEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CaCaatEligibilityRepository extends JpaRepository<CaCaatEligibilityEntity, UUID> {
    List<CaCaatEligibilityEntity> findByAuditCaseIdOrderByCreatedAtDesc(UUID auditCaseId);
    Optional<CaCaatEligibilityEntity> findTopByAuditCaseIdOrderByCreatedAtDesc(UUID auditCaseId);
    boolean existsByAuditCaseId(UUID auditCaseId);
}
