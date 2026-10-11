package mor.itas.persistence.repository.da;

import mor.itas.persistence.jpa.entity.da.DaWorkingPaperEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DaWorkingPaperRepository extends JpaRepository<DaWorkingPaperEntity, UUID> {
    List<DaWorkingPaperEntity> findByAuditCaseId(UUID caseId);
}
