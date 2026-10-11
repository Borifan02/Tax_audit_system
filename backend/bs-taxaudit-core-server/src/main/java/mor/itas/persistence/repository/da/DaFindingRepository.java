package mor.itas.persistence.repository.da;

import mor.itas.persistence.jpa.entity.da.DaFindingEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DaFindingRepository extends JpaRepository<DaFindingEntity, UUID> {
    List<DaFindingEntity> findByAuditCaseId(UUID caseId);
}
