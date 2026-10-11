package mor.itas.persistence.repository.ca;

import mor.itas.persistence.jpa.entity.ca.CaAssessmentNoticeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CaAssessmentNoticeRepository extends JpaRepository<CaAssessmentNoticeEntity, UUID> {
    List<CaAssessmentNoticeEntity> findByAuditCaseIdOrderByCreatedAtDesc(UUID auditCaseId);
    Optional<CaAssessmentNoticeEntity> findTopByAuditCaseIdOrderByCreatedAtDesc(UUID auditCaseId);
    Optional<CaAssessmentNoticeEntity> findByNoticeNumber(String noticeNumber);
    List<CaAssessmentNoticeEntity> findByAuditCaseIdAndStatus(UUID auditCaseId, String status);
}
