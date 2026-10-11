package mor.itas.persistence.repository.ca;

import mor.itas.persistence.jpa.entity.ca.CaReconciliationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CaReconciliationRepository extends JpaRepository<CaReconciliationEntity, UUID> {
    List<CaReconciliationEntity> findByAuditCaseIdOrderByCreatedAtDesc(UUID auditCaseId);
    Optional<CaReconciliationEntity> findByAuditCaseIdAndReconciliationType(UUID auditCaseId, String reconciliationType);
    List<CaReconciliationEntity> findByAuditCaseIdAndStatus(UUID auditCaseId, String status);
}
