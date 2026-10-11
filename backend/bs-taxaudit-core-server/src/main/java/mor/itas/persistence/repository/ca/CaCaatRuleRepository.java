package mor.itas.persistence.repository.ca;

import mor.itas.persistence.jpa.entity.ca.CaCaatRuleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CaCaatRuleRepository extends JpaRepository<CaCaatRuleEntity, UUID> {
    List<CaCaatRuleEntity> findByCaatRunId(UUID caatRunId);
    List<CaCaatRuleEntity> findByCaatRunIdAndStatus(UUID caatRunId, String status);
}
