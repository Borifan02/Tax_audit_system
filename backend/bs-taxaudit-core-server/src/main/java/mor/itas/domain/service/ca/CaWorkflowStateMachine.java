package mor.itas.domain.service.ca;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import mor.itas.domain.event.ca.CaPhaseTransitionEvent;
import mor.itas.domain.exception.CaseNotFoundException;
import mor.itas.domain.exception.InvalidCaseStateException;
import mor.itas.domain.valueobject.ca.CaAuditPhase;
import mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity;
import mor.itas.persistence.jpa.repository.ap.ApAuditCaseRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Comprehensive Audit Workflow State Machine — FR-04.4 full lifecycle.
 *
 * States:
 *   OPENED → CAAT_AND_PLANNING → FIELDWORK → EXECUTION_REPORT
 *   → DRAFT_REPORT → APPROVALS → NOTICE_SENT → TAXPAYER_RESPONSE → COMPLETED
 *   + side-exit: any state → FRAUD_INVESTIGATION
 *
 * This service is the single authority for advancing ca_workflow_status on
 * ap_audit_cases. No other service writes that column directly.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CaWorkflowStateMachine {

    private final ApAuditCaseRepository caseRepository;
    private final ApplicationEventPublisher eventPublisher;

    // ── Valid forward transitions ─────────────────────────────────────────────
    private static final Map<String, Set<String>> ALLOWED = Map.of(
        "OPENED",               Set.of("CAAT_AND_PLANNING"),
        "CAAT_AND_PLANNING",    Set.of("FIELDWORK"),
        "FIELDWORK",            Set.of("EXECUTION_REPORT", "FRAUD_INVESTIGATION"),
        "EXECUTION_REPORT",     Set.of("DRAFT_REPORT"),
        "DRAFT_REPORT",         Set.of("APPROVALS", "FIELDWORK"), // FIELDWORK = TL rejection
        "APPROVALS",            Set.of("NOTICE_SENT", "DRAFT_REPORT", "FRAUD_INVESTIGATION"),
        "NOTICE_SENT",          Set.of("TAXPAYER_RESPONSE", "FRAUD_INVESTIGATION"),
        "TAXPAYER_RESPONSE",    Set.of("COMPLETED", "FRAUD_INVESTIGATION"),
        // FR-04.4-28: fraud investigation can resolve back to either
        // DRAFT_REPORT (case continues with additional findings) or COMPLETED
        "FRAUD_INVESTIGATION",  Set.of("DRAFT_REPORT", "COMPLETED")
    );

    // ── Any state can be escalated to FRAUD_INVESTIGATION ────────────────────
    private static final String FRAUD = "FRAUD_INVESTIGATION";

    /**
     * Advance the workflow to the next state.
     * Validates the transition, persists, and returns the updated case.
     */
    @Transactional
    public ApAuditCaseEntity advance(ApAuditCaseEntity auditCase, String targetState) {
        String current = currentState(auditCase);

        // Fraud escalation is always allowed from non-terminal states
        if (FRAUD.equals(targetState) && !"COMPLETED".equals(current)
                && !"FRAUD_INVESTIGATION".equals(current)) {
            return applyTransition(auditCase, FRAUD);
        }

        Set<String> allowed = ALLOWED.getOrDefault(current, Set.of());
        if (!allowed.contains(targetState)) {
            throw new InvalidCaseStateException(
                "Cannot transition CA workflow from [" + current + "] to [" + targetState + "]",
                current
            );
        }
        return applyTransition(auditCase, targetState);
    }

    /**
     * Advance by UUID — convenience overload.
     */
    @Transactional
    public ApAuditCaseEntity advance(UUID caseId, String targetState) {
        ApAuditCaseEntity auditCase = caseRepository.findById(caseId)
            .orElseThrow(() -> new CaseNotFoundException("Case not found: " + caseId));
        return advance(auditCase, targetState);
    }

    /**
     * Initialise a newly assigned case to OPENED if not already set.
     */
    @Transactional
    public ApAuditCaseEntity initialise(ApAuditCaseEntity auditCase) {
        if (auditCase.getCaWorkflowStatus() == null) {
            auditCase.setCaWorkflowStatus("OPENED");
            auditCase.setCaCurrentPhase("CASE_OPENED");
            return caseRepository.save(auditCase);
        }
        return auditCase;
    }

    public String currentState(ApAuditCaseEntity auditCase) {
        String ws = auditCase.getCaWorkflowStatus();
        return ws == null ? "OPENED" : ws;
    }

    public boolean isInState(ApAuditCaseEntity auditCase, String state) {
        return state.equals(currentState(auditCase));
    }

    public boolean canAdvanceTo(ApAuditCaseEntity auditCase, String targetState) {
        String current = currentState(auditCase);
        if (FRAUD.equals(targetState)) return !"COMPLETED".equals(current);
        return ALLOWED.getOrDefault(current, Set.of()).contains(targetState);
    }

    // ── Internal ──────────────────────────────────────────────────────────────
    private ApAuditCaseEntity applyTransition(ApAuditCaseEntity auditCase, String targetState) {
        String previous = currentState(auditCase);
        log.info("CA workflow transition [{}] {} → {}", auditCase.getId(), previous, targetState);
        auditCase.setCaWorkflowStatus(targetState);
        auditCase.setCaCurrentPhase(targetState);
        ApAuditCaseEntity saved = caseRepository.save(auditCase);

        // Publish domain event for every transition
        try {
            CaAuditPhase prevPhase = CaAuditPhase.valueOf(previous);
            CaAuditPhase newPhase  = CaAuditPhase.valueOf(targetState);
            eventPublisher.publishEvent(CaPhaseTransitionEvent.builder()
                .caseId(auditCase.getId())
                .previousPhase(prevPhase)
                .newPhase(newPhase)
                .build());
        } catch (IllegalArgumentException e) {
            // If phase string doesn't map to enum just skip event — don't break transition
            log.warn("Phase value '{}' or '{}' has no CaAuditPhase enum constant — event skipped",
                previous, targetState);
        }
        return saved;
    }
}
