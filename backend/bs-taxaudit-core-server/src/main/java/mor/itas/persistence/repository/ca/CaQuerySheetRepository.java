package mor.itas.persistence.repository.ca;

import mor.itas.persistence.jpa.entity.ca.CaQuerySheetEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface CaQuerySheetRepository extends JpaRepository<CaQuerySheetEntity, UUID> {
    List<CaQuerySheetEntity> findByAuditCaseId(UUID caseId);
}
