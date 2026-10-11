package mor.itas.application.port.outboundport.repositoryport.da;

import java.util.Optional;
import java.util.UUID;
import mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity;

public interface DaAuditCaseRepositoryPort {
    Optional<ApAuditCaseEntity> findById(UUID caseId);
    ApAuditCaseEntity save(ApAuditCaseEntity entity);
}
