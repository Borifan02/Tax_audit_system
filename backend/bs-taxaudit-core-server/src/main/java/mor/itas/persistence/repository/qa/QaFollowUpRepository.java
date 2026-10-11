package mor.itas.persistence.repository.qa;

import mor.itas.persistence.jpa.entity.qa.QaFollowUpEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QaFollowUpRepository extends JpaRepository<QaFollowUpEntity, UUID> {
    List<QaFollowUpEntity> findByQaCaseId(UUID qaCaseId);
}
