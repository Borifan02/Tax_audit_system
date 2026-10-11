package mor.itas.persistence.adapter.da;

import lombok.RequiredArgsConstructor;
import mor.itas.application.port.outboundport.repositoryport.da.DaAuditCaseRepositoryPort;
import mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity;
import mor.itas.persistence.jpa.repository.ap.ApAuditCaseRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class DaAuditCaseRepositoryAdapter implements DaAuditCaseRepositoryPort {

    private final ApAuditCaseRepository apAuditCaseRepository;

    @Override
    public Optional<ApAuditCaseEntity> findById(UUID caseId) {
        return apAuditCaseRepository.findById(caseId);
    }

    @Override
    public ApAuditCaseEntity save(ApAuditCaseEntity entity) {
        return apAuditCaseRepository.save(entity);
    }
}
