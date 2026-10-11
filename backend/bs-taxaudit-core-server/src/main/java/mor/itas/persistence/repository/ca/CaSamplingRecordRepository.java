package mor.itas.persistence.repository.ca;

import mor.itas.persistence.jpa.entity.ca.CaSamplingRecordEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CaSamplingRecordRepository extends JpaRepository<CaSamplingRecordEntity, UUID> {
    List<CaSamplingRecordEntity> findByAuditCaseIdOrderByCreatedAtDesc(UUID auditCaseId);
}
