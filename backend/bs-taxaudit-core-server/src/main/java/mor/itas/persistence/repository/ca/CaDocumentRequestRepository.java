package mor.itas.persistence.repository.ca;

import mor.itas.persistence.jpa.entity.ca.CaDocumentRequestEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface CaDocumentRequestRepository extends JpaRepository<CaDocumentRequestEntity, UUID> {
    List<CaDocumentRequestEntity> findByAuditCaseId(UUID caseId);
}
