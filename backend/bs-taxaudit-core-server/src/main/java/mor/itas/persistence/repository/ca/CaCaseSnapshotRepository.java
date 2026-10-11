package mor.itas.persistence.repository.ca;

import mor.itas.persistence.jpa.entity.ca.CaCaseSnapshotEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CaCaseSnapshotRepository extends JpaRepository<CaCaseSnapshotEntity, UUID> {
    Optional<CaCaseSnapshotEntity> findByCaseId(UUID caseId);
}
