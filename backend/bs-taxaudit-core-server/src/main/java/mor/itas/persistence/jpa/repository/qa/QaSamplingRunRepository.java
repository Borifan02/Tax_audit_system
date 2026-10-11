package mor.itas.persistence.jpa.repository.qa;

import mor.itas.persistence.jpa.entity.qa.QaSamplingRunEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface QaSamplingRunRepository extends JpaRepository<QaSamplingRunEntity, UUID> {
    Page<QaSamplingRunEntity> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
