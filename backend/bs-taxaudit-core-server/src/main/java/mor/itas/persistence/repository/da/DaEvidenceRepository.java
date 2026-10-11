package mor.itas.persistence.repository.da;

import mor.itas.persistence.jpa.entity.da.DaEvidenceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DaEvidenceRepository extends JpaRepository<DaEvidenceEntity, UUID> {
    List<DaEvidenceEntity> findByAuditCase_Id(UUID caseId);
}
