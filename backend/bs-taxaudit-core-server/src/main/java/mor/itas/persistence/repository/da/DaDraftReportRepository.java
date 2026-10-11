package mor.itas.persistence.repository.da;

import mor.itas.persistence.jpa.entity.da.DaDraftReportEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DaDraftReportRepository extends JpaRepository<DaDraftReportEntity, UUID> {
    List<DaDraftReportEntity> findByAuditCase_Id(UUID caseId);
    Optional<DaDraftReportEntity> findTopByAuditCase_IdOrderByCreatedAtDesc(UUID caseId);
}
