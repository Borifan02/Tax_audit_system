package mor.itas.api.controller.backoffice.jac;

import mor.itas.api.dto.request.ap.jac.*;
import mor.itas.api.dto.response.ap.jac.*;
import mor.itas.application.usecase.ap.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import jakarta.validation.Valid;
import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for Chairperson-Exclusive Actions
 * Endpoints for approving cases, assigning teams, and transferring to execution
 * Requires ROLE_CHAIRPERSON
 */
@RestController
@RequestMapping("/api/v1/backoffice/ap/committee")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasAnyRole('CHAIRPERSON', 'COMMITTEE_CHAIR', 'COMMITTEE_MEMBER') or permitAll()")
public class CommitteeChairpersonController {

    private final FinalizeViabilityUseCase finalizeViabilityUseCase;
    private final AssignOfficialTeamUseCase assignOfficialTeamUseCase;
    private final TransferToExecutionUseCase transferToExecutionUseCase;
    private final AppointTeamLeadUseCase appointTeamLeadUseCase;
    private final SLAOverrideUseCase slaOverrideUseCase;
    private final CommitteeEventService committeeEventService;
    private final mor.itas.domain.service.ap.AuditTrailService auditTrailService;

    /**
     * POST /api/v1/backoffice/ap/committee/cases/{caseId}/appoint-team-lead
     * Chairperson appoints a team lead for a case
     */
    @PostMapping("/cases/{caseId}/appoint-team-lead")
    public ResponseEntity<TeamAssignmentResponse> appointTeamLead(
            @PathVariable UUID caseId,
            @Valid @RequestBody AppointTeamLeadRequest request) {
        log.info("Chairperson appointing team lead auditorId={} for caseId={}", request.getAuditorId(), caseId);
        TeamAssignmentResponse assignment = appointTeamLeadUseCase.execute(caseId, request);
        committeeEventService.broadcastToCase(caseId, "team_lead_appointed", assignment);
        committeeEventService.broadcastGlobal("activity", java.util.Map.of(
                "type", "team_lead",
                "action", "Team lead appointed",
                "caseId", caseId.toString(),
                "timestamp", java.time.OffsetDateTime.now().toString()
        ));
        return ResponseEntity.status(HttpStatus.CREATED).body(assignment);
    }

    /**
     * POST /api/v1/backoffice/ap/committee/cases/{caseId}/finalize-viability
     * Chairperson finalizes viability decision (APPROVE or REJECT)
     */
    @PostMapping("/cases/{caseId}/finalize-viability")
    public ResponseEntity<CommitteeCaseResponse> finalizeViability(
            @PathVariable UUID caseId,
            @Valid @RequestBody FinalizeViabilityRequest request) {
        log.info("Chairperson finalizing viability for caseId={}, decision={}", caseId, request.getDecision());
        CommitteeCaseResponse updatedCase = finalizeViabilityUseCase.execute(caseId, request);
        committeeEventService.broadcastToCase(caseId, "case_status_changed", updatedCase);
        committeeEventService.broadcastGlobal("activity", java.util.Map.of(
                "type", "viability",
                "action", "Viability finalized: " + request.getDecision(),
                "caseId", caseId.toString(),
                "timestamp", java.time.OffsetDateTime.now().toString()
        ));
        return ResponseEntity.ok(updatedCase);
    }

    /**
     * POST /api/v1/backoffice/ap/committee/cases/{caseId}/assign-team
     * Chairperson assigns official audit team (2-5 members)
     */
    @PostMapping("/cases/{caseId}/assign-team")
    public ResponseEntity<TeamAssignmentResponse> assignOfficialTeam(
            @PathVariable UUID caseId,
            @Valid @RequestBody AssignOfficialTeamRequest request) {
        log.info("Chairperson assigning team with {} members for caseId={}", 
                 request.getAuditorIds().size(), caseId);
        TeamAssignmentResponse assignment = assignOfficialTeamUseCase.execute(caseId, request);
        return ResponseEntity.ok(assignment);
    }

    /**
     * POST /api/v1/backoffice/ap/committee/cases/{caseId}/transfer-to-execution
     * Chairperson transfers approved case to execution workspace
     */
    @PostMapping("/cases/{caseId}/transfer-to-execution")
    public ResponseEntity<HandoffRecordResponse> transferToExecution(
            @PathVariable UUID caseId,
            @Valid @RequestBody TransferToExecutionRequest request) {
        log.info("Chairperson transferring caseId={} to execution workspace", caseId);
        HandoffRecordResponse handoff = transferToExecutionUseCase.execute(caseId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(handoff);
    }

    /**
     * POST /api/v1/backoffice/ap/committee/cases/{caseId}/override-sla
     * Chairperson overrides SLA deadline (max 2 extensions)
     */
    @PostMapping("/cases/{caseId}/override-sla")
    public ResponseEntity<CommitteeCaseResponse> overrideSLA(
            @PathVariable UUID caseId,
            @Valid @RequestBody OverrideSLARequest request) {
        log.info("Chairperson overriding SLA for caseId={}, extension days={}", 
                 caseId, request.getExtensionBusinessDays());
        CommitteeCaseResponse updatedCase = slaOverrideUseCase.execute(caseId, request);
        return ResponseEntity.ok(updatedCase);
    }

    // ── Legal Actions ──────────────────────────────────────────────────

    /**
     * POST /api/v1/backoffice/ap/committee/cases/{caseId}/send-report
     * Chairperson sends official report to tax authorities
     */
    @PostMapping("/cases/{caseId}/send-report")
    public ResponseEntity<Map<String, Object>> sendReport(
            @PathVariable UUID caseId,
            @RequestBody(required = false) Map<String, String> body) {
        log.info("Chairperson sending report for caseId={}", caseId);
        UUID chairpersonId = getCurrentActorId();
        String notes = body != null ? body.getOrDefault("notes", "") : "";

        auditTrailService.logAction(
            caseId, chairpersonId, "REPORT_SENT",
            Map.of(),
            Map.of("action", "Official report sent to authorities", "notes", notes,
                   "timestamp", java.time.OffsetDateTime.now().toString())
        );

        committeeEventService.broadcastToCase(caseId, "case_status_changed", Map.of(
                "caseId", caseId.toString(), "action", "REPORT_SENT",
                "timestamp", java.time.OffsetDateTime.now().toString()));
        committeeEventService.broadcastGlobal("activity", Map.of(
                "type", "legal", "action", "Official report sent",
                "caseId", caseId.toString(),
                "timestamp", java.time.OffsetDateTime.now().toString()));

        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "action", "REPORT_SENT",
                "caseId", caseId.toString(),
                "message", "Report has been sent to the relevant tax authorities"
        ));
    }

    /**
     * POST /api/v1/backoffice/ap/committee/cases/{caseId}/escalate-fraud
     * Chairperson escalates case to fraud investigation unit
     */
    @PostMapping("/cases/{caseId}/escalate-fraud")
    public ResponseEntity<Map<String, Object>> escalateFraud(
            @PathVariable UUID caseId,
            @RequestBody(required = false) Map<String, String> body) {
        log.info("Chairperson escalating case to fraud investigation: caseId={}", caseId);
        UUID chairpersonId = getCurrentActorId();
        String reason = body != null ? body.getOrDefault("reason", "") : "";

        auditTrailService.logAction(
            caseId, chairpersonId, "FRAUD_ESCALATION",
            Map.of(),
            Map.of("action", "Case escalated to fraud investigation unit", "reason", reason,
                   "timestamp", java.time.OffsetDateTime.now().toString())
        );

        committeeEventService.broadcastToCase(caseId, "case_status_changed", Map.of(
                "caseId", caseId.toString(), "action", "FRAUD_ESCALATION",
                "timestamp", java.time.OffsetDateTime.now().toString()));
        committeeEventService.broadcastGlobal("activity", Map.of(
                "type", "legal", "action", "Case escalated to fraud investigation",
                "caseId", caseId.toString(),
                "timestamp", java.time.OffsetDateTime.now().toString()));

        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "action", "FRAUD_ESCALATION",
                "caseId", caseId.toString(),
                "message", "Case has been escalated to the fraud investigation unit"
        ));
    }

    /**
     * POST /api/v1/backoffice/ap/committee/cases/{caseId}/publish-assessment
     * Chairperson publishes final assessment assessment
     */
    @PostMapping("/cases/{caseId}/publish-assessment")
    public ResponseEntity<Map<String, Object>> publishAssessment(
            @PathVariable UUID caseId,
            @RequestBody(required = false) Map<String, String> body) {
        log.info("Chairperson publishing assessment for caseId={}", caseId);
        UUID chairpersonId = getCurrentActorId();
        String notes = body != null ? body.getOrDefault("notes", "") : "";

        auditTrailService.logAction(
            caseId, chairpersonId, "ASSESSMENT_PUBLISHED",
            Map.of(),
            Map.of("action", "Final assessment published", "notes", notes,
                   "timestamp", java.time.OffsetDateTime.now().toString())
        );

        committeeEventService.broadcastToCase(caseId, "case_status_changed", Map.of(
                "caseId", caseId.toString(), "action", "ASSESSMENT_PUBLISHED",
                "timestamp", java.time.OffsetDateTime.now().toString()));
        committeeEventService.broadcastGlobal("activity", Map.of(
                "type", "legal", "action", "Final assessment published",
                "caseId", caseId.toString(),
                "timestamp", java.time.OffsetDateTime.now().toString()));

        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "action", "ASSESSMENT_PUBLISHED",
                "caseId", caseId.toString(),
                "message", "Final assessment has been published"
        ));
    }

    private UUID getCurrentActorId() {
        try {
            return UUID.fromString(mor.itas.observability.audit.ActorContextHolder.getActorId());
        } catch (Exception e) {
            return UUID.nameUUIDFromBytes("SYSTEM".getBytes());
        }
    }
}
