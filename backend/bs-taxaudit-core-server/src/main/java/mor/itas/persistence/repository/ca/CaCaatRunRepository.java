package mor.itas.persistence.repository.ca;

import mor.itas.persistence.jpa.entity.ca.CaCaatRunEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CaCaatRunRepository extends JpaRepository<CaCaatRunEntity, UUID> {
    List<CaCaatRunEntity> findByAuditCaseIdOrderByCreatedAtDesc(UUID auditCaseId);
    Optional<CaCaatRunEntity> findTopByAuditCaseIdOrderByCreatedAtDesc(UUID auditCaseId);
}
