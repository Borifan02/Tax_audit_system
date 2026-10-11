package mor.itas.persistence.repository.qa;

import mor.itas.persistence.jpa.entity.qa.QaDeficiencyEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QaDeficiencyRepository extends JpaRepository<QaDeficiencyEntity, UUID> {
    List<QaDeficiencyEntity> findByQaCaseId(UUID qaCaseId);
}
