package mor.itas.persistence.repository.ca;

import mor.itas.persistence.jpa.entity.ca.CaBenfordAnalysisEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CaBenfordAnalysisRepository extends JpaRepository<CaBenfordAnalysisEntity, UUID> {
    List<CaBenfordAnalysisEntity> findByCaatRunIdOrderByDigitAsc(UUID caatRunId);
    List<CaBenfordAnalysisEntity> findByAuditCaseIdOrderByDigitAsc(UUID auditCaseId);
}
