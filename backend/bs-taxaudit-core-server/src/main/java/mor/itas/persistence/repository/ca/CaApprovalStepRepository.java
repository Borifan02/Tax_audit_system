package mor.itas.persistence.repository.ca;

import mor.itas.persistence.jpa.entity.ca.CaApprovalStepEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CaApprovalStepRepository extends JpaRepository<CaApprovalStepEntity, UUID> {
    List<CaApprovalStepEntity> findByAuditCaseIdOrderByCreatedAtAsc(UUID auditCaseId);
    List<CaApprovalStepEntity> findByEntityTypeAndEntityId(String entityType, UUID entityId);
    Optional<CaApprovalStepEntity> findTopByEntityTypeAndEntityIdOrderByCreatedAtDesc(String entityType, UUID entityId);
}
