package mor.itas.persistence.repository.da;

import mor.itas.persistence.jpa.entity.da.DaAuditProcedureEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DaAuditProcedureRepository extends JpaRepository<DaAuditProcedureEntity, UUID> {
    List<DaAuditProcedureEntity> findByAuditCase_Id(UUID caseId);
}
