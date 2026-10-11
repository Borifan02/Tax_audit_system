package mor.itas.persistence.repository.da;

import mor.itas.persistence.jpa.entity.da.DaQueryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DaQueryRepository extends JpaRepository<DaQueryEntity, UUID> {
    List<DaQueryEntity> findByAuditCaseId(UUID caseId);
}
