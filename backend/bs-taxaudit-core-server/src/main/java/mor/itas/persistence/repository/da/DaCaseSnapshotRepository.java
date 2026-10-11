package mor.itas.persistence.repository.da;

import mor.itas.persistence.jpa.entity.da.DaCaseSnapshotEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DaCaseSnapshotRepository extends JpaRepository<DaCaseSnapshotEntity, UUID> {
    Optional<DaCaseSnapshotEntity> findByCaseId(UUID caseId);
}
