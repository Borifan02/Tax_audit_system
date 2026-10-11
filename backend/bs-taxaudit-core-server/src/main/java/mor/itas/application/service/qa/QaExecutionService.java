package mor.itas.application.service.qa;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import mor.itas.api.dto.request.qa.*;
import mor.itas.domain.exception.CaseNotFoundException;
import mor.itas.domain.exception.InvalidCaseStateException;
import mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity;
import mor.itas.persistence.jpa.entity.qa.*;
import mor.itas.persistence.jpa.repository.ap.ApAuditCaseRepository;
import mor.itas.persistence.repository.qa.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class QaExecutionService {
    private final ApAuditCaseRepository auditCaseRepository;
    private final QaActionPlanRepository actionPlanRepository;

    @Transactional
    public QaActionPlanEntity submitActionPlan(UUID caseId, SubmitQaActionPlanRequest request, String actorId) {
        ApAuditCaseEntity auditCase = getAndValidateCase(caseId);
        
        QaActionPlanEntity plan = QaActionPlanEntity.builder()
            .auditCase(auditCase)
            .objectives(request.getObjectives())
            .reviewScope(request.getReviewScope())
            .reviewer(actorId)
            .status("SUBMITTED")
            .build();
            
        auditCase.setStatus("QA_ACTION_PLAN_SUBMITTED");
        auditCase.setQaCurrentPhase("PLAN_SUBMITTED");
        auditCaseRepository.save(auditCase);
        
        return actionPlanRepository.save(plan);
    }

    @Transactional
    public QaActionPlanEntity reviewActionPlan(UUID caseId, ReviewQaActionPlanRequest request, String actorId) {
        ApAuditCaseEntity auditCase = getAndValidateCase(caseId);
        QaActionPlanEntity plan = actionPlanRepository.findTopByAuditCaseIdOrderByCreatedAtDesc(caseId)
                .orElseThrow(() -> new IllegalStateException("No plan found"));

        plan.setStatus(request.getDecision());
        plan.setComments(request.getComments());

        if ("APPROVED".equals(request.getDecision())) {
            auditCase.setStatus("QA_REVIEW");
            auditCase.setQaCurrentPhase("REVIEW_IN_PROGRESS");
        } else {
            auditCase.setStatus("QA_ASSIGNED");
            auditCase.setQaCurrentPhase("PLAN_REJECTED");
        }
        
        auditCaseRepository.save(auditCase);
        return actionPlanRepository.save(plan);
    }

    private ApAuditCaseEntity getAndValidateCase(UUID caseId) {
        ApAuditCaseEntity auditCase = auditCaseRepository.findById(caseId)
                .orElseThrow(() -> new CaseNotFoundException("Case not found: " + caseId));
        return auditCase;
    }
}
