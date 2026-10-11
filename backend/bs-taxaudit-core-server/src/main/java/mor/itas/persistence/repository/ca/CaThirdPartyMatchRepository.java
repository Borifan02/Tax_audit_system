package mor.itas.persistence.repository.ca;

import mor.itas.persistence.jpa.entity.ca.CaThirdPartyMatchEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CaThirdPartyMatchRepository extends JpaRepository<CaThirdPartyMatchEntity, UUID> {
    List<CaThirdPartyMatchEntity> findByAuditCaseIdOrderByCreatedAtDesc(UUID auditCaseId);
    List<CaThirdPartyMatchEntity> findByAuditCaseIdAndMatchStatus(UUID auditCaseId, String matchStatus);
}
