package mor.itas.persistence.repository.ca;

import mor.itas.persistence.jpa.entity.ca.CaTaxpayerResponseEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CaTaxpayerResponseRepository extends JpaRepository<CaTaxpayerResponseEntity, UUID> {
    List<CaTaxpayerResponseEntity> findByAuditCaseIdOrderByCreatedAtDesc(UUID auditCaseId);
    List<CaTaxpayerResponseEntity> findByAuditCaseIdAndResponseType(UUID auditCaseId, String responseType);
    boolean existsByAuditCaseIdAndResponseType(UUID auditCaseId, String responseType);
}
