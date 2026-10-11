package mor.itas.application.usecase.ap;

import mor.itas.application.port.inboundport.ap.RequestPlanAmendmentPort;
import mor.itas.persistence.jpa.entity.ap.AnnualAuditPlanEntity;
import mor.itas.persistence.jpa.entity.ap.PlanStatusEnum;
import mor.itas.persistence.jpa.repository.ap.AnnualAuditPlanJpaRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

/**
 * RequestPlanAmendmentUseCase - Application Use Case
 * 
 * Implements RequestPlanAmendmentPort.
 * Uses direct JPA updates to avoid OptimisticLockException from concurrent requests.
 */
@Component
public class RequestPlanAmendmentUseCase implements RequestPlanAmendmentPort {
    
    private final AnnualAuditPlanJpaRepository planRepository;
    private final JdbcTemplate jdbcTemplate;
    
    public RequestPlanAmendmentUseCase(AnnualAuditPlanJpaRepository planRepository, JdbcTemplate jdbcTemplate) {
        this.planRepository = planRepository;
        this.jdbcTemplate = jdbcTemplate;
    }
    
    @Override
    @Transactional
    public void requestAmendment(UUID planId, String feedback, String directorId) {
        AnnualAuditPlanEntity plan = planRepository.findById(planId)
            .orElseThrow(() -> new IllegalArgumentException("Plan not found: " + planId));
        
        PlanStatusEnum status = plan.getStatus();
        if (status != PlanStatusEnum.SUBMITTED_TO_DIRECTOR && status != PlanStatusEnum.FEEDBACK_COLLECTED && status != PlanStatusEnum.AWAITING_REGIONAL_FEEDBACK) {
            throw new IllegalStateException(
                "Cannot request amendment. Current status: " + status +
                ". Plan must be in SUBMITTED_TO_DIRECTOR, FEEDBACK_COLLECTED, or AWAITING_REGIONAL_FEEDBACK status."
            );
        }
        
        // Use raw SQL to avoid JPA version conflicts
        jdbcTemplate.update(
            "UPDATE ap_annual_audit_plans SET status = 'AMENDMENT_REQUIRED', amendment_comment = ?, updated_at = NOW() WHERE id = ?",
            feedback, planId
        );
    }
}
