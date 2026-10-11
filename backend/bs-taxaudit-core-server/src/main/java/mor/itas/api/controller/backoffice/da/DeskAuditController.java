package mor.itas.api.controller.backoffice.da;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import mor.itas.api.dto.request.da.AddEvidenceRequest;
import mor.itas.api.dto.request.da.AddProcedureRequest;
import mor.itas.api.dto.request.da.ReviewDraftReportRequest;
import mor.itas.api.dto.request.da.SubmitDraftReportRequest;
import mor.itas.application.port.inboundport.da.DeskAuditExecutionUseCasePort;
import mor.itas.application.service.notification.NotificationService;
import mor.itas.persistence.jpa.repository.ap.ApAuditCaseRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/backoffice/da/cases")
@RequiredArgsConstructor
public class DeskAuditController {

    private final DeskAuditExecutionUseCasePort deskAuditExecutionUseCase;
    private final NotificationService notificationService;
    private final ApAuditCaseRepository apAuditCaseRepository;

    @PostMapping("/{caseId}/evidence")
    @PreAuthorize("hasAnyRole('AUDITOR', 'TEAM_LEADER')")
    public ResponseEntity<?> addEvidence(@PathVariable UUID caseId,
                                         @Valid @RequestBody AddEvidenceRequest request,
                                         @RequestHeader("X-Actor-Id") String actorId) {
        var evidence = deskAuditExecutionUseCase.addEvidence(caseId, request, actorId);
        return ResponseEntity.ok(evidence);
    }

    @PostMapping("/{caseId}/procedures")
    @PreAuthorize("hasAnyRole('AUDITOR', 'TEAM_LEADER')")
    public ResponseEntity<?> recordProcedure(@PathVariable UUID caseId,
                                             @Valid @RequestBody AddProcedureRequest request,
                                             @RequestHeader("X-Actor-Id") String actorId) {
        var procedure = deskAuditExecutionUseCase.recordProcedure(caseId, request, actorId);
        return ResponseEntity.ok(procedure);
    }

    @PostMapping("/{caseId}/draft-report")
    @PreAuthorize("hasRole('AUDITOR')")
    public ResponseEntity<?> submitDraftReport(@PathVariable UUID caseId,
                                               @Valid @RequestBody SubmitDraftReportRequest request,
                                               @RequestHeader("X-Actor-Id") String actorId) {
        var report = deskAuditExecutionUseCase.submitDraftReport(caseId, request, actorId);
        return ResponseEntity.ok(report);
    }

    @PostMapping("/{caseId}/draft-report/review")
    @PreAuthorize("hasRole('TEAM_LEADER')")
    public ResponseEntity<?> reviewDraftReport(@PathVariable UUID caseId,
                                               @Valid @RequestBody ReviewDraftReportRequest request,
                                               @RequestHeader("X-Actor-Id") String actorId) {
        var report = deskAuditExecutionUseCase.reviewDraftReport(caseId, request, actorId);
        return ResponseEntity.ok(report);
    }

    @GetMapping("/{caseId}")
    public ResponseEntity<?> getCaseData(@PathVariable UUID caseId) {
        var caseData = deskAuditExecutionUseCase.getCaseSnapshot(caseId);
        return ResponseEntity.ok(caseData);
    }

    @PostMapping("/{caseId}/autosave")
    public ResponseEntity<?> autosaveCase(@PathVariable UUID caseId,
                                          @RequestBody Map<String, Object> snapshot,
                                          @RequestHeader("X-Actor-Id") String actorId) {
        var response = deskAuditExecutionUseCase.autosaveCase(caseId, snapshot, actorId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{caseId}/findings")
    @PreAuthorize("hasAnyRole('AUDITOR', 'TEAM_LEADER')")
    public ResponseEntity<?> createFinding(@PathVariable UUID caseId,
                                           @Valid @RequestBody mor.itas.api.dto.request.da.CreateFindingRequest request,
                                           @RequestHeader("X-Actor-Id") String actorId) {
        var finding = deskAuditExecutionUseCase.createFinding(caseId, request, actorId);
        return ResponseEntity.ok(finding);
    }

    @PostMapping("/{caseId}/working-papers")
    @PreAuthorize("hasAnyRole('AUDITOR', 'TEAM_LEADER')")
    public ResponseEntity<?> createWorkingPaper(@PathVariable UUID caseId,
                                                @Valid @RequestBody mor.itas.api.dto.request.da.CreateWorkingPaperRequest request,
                                                @RequestHeader("X-Actor-Id") String actorId) {
        var wp = deskAuditExecutionUseCase.createWorkingPaper(caseId, request, actorId);
        return ResponseEntity.ok(wp);
    }

    @PutMapping("/{caseId}/findings/{findingId}")
    @PreAuthorize("hasAnyRole('AUDITOR', 'TEAM_LEADER')")
    public ResponseEntity<?> updateFinding(@PathVariable UUID caseId,
                                           @PathVariable UUID findingId,
                                           @RequestBody mor.itas.api.dto.request.da.UpdateFindingRequest request,
                                           @RequestHeader("X-Actor-Id") String actorId) {
        var finding = deskAuditExecutionUseCase.updateFinding(caseId, findingId, request, actorId);
        return ResponseEntity.ok(finding);
    }

    @PutMapping("/{caseId}/working-papers/{wpId}")
    @PreAuthorize("hasAnyRole('AUDITOR', 'TEAM_LEADER')")
    public ResponseEntity<?> updateWorkingPaper(@PathVariable UUID caseId,
                                                @PathVariable UUID wpId,
                                                @RequestBody mor.itas.api.dto.request.da.UpdateWorkingPaperRequest request,
                                                @RequestHeader("X-Actor-Id") String actorId) {
        var wp = deskAuditExecutionUseCase.updateWorkingPaper(caseId, wpId, request, actorId);
        return ResponseEntity.ok(wp);
    }

    @PostMapping("/{caseId}/queries")
    @PreAuthorize("hasAnyRole('AUDITOR', 'TEAM_LEADER')")
    public ResponseEntity<?> createQuery(@PathVariable UUID caseId,
                                         @Valid @RequestBody mor.itas.api.dto.request.da.CreateQueryRequest request,
                                         @RequestHeader("X-Actor-Id") String actorId) {
        var query = deskAuditExecutionUseCase.createQuery(caseId, request, actorId);
        return ResponseEntity.ok(query);
    }

    @PutMapping("/{caseId}/queries/{queryId}")
    @PreAuthorize("hasAnyRole('AUDITOR', 'TEAM_LEADER')")
    public ResponseEntity<?> updateQuery(@PathVariable UUID caseId,
                                         @PathVariable UUID queryId,
                                         @RequestBody mor.itas.api.dto.request.da.UpdateQueryRequest request,
                                         @RequestHeader("X-Actor-Id") String actorId) {
        var query = deskAuditExecutionUseCase.updateQuery(caseId, queryId, request, actorId);
        return ResponseEntity.ok(query);
    }

    @PostMapping("/{caseId}/workflow")
    @PreAuthorize("hasAnyRole('AUDITOR', 'TEAM_LEADER')")
    public ResponseEntity<?> executeWorkflow(@PathVariable UUID caseId,
                                             @RequestBody Map<String, Object> payload,
                                             @RequestHeader("X-Actor-Id") String actorId) {
        String action = (String) payload.get("action");
        if ("APPROVE_AUDIT".equals(action) || "RETURN_FOR_CORRECTION".equals(action)) {
            // Further programmatic check if needed, but endpoint can also use method security
            if (!org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_TEAM_LEADER") || a.getAuthority().equals("ROLE_AUDIT_DIRECTOR"))) {
                return ResponseEntity.status(403).body("Access Denied: Only Team Leaders can review audits.");
            }
        }
        
        if ("SUBMIT_FOR_REVIEW".equals(action)) {
            String teamLeaderId = apAuditCaseRepository.findById(caseId)
                .map(mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity::getAssignedTeamLeaderId)
                .orElse("u-tl-addis_ababa-tc1-desk-1");
            notificationService.sendNotification(
                    teamLeaderId,
                    "REVIEW_REQUEST",
                    "Desk Audit Submitted for Review",
                    "A desk audit case (" + caseId + ") has been submitted for your supervisory review and decision.",
                    caseId,
                    null,
                    "DESK_AUDIT",
                    caseId
            );
        }

        // Update the case status in the database so it reflects in the Team Leader's dashboard
        apAuditCaseRepository.findById(caseId).ifPresent(c -> {
            if ("SUBMIT_FOR_REVIEW".equals(action)) {
                c.setStatus("SUBMITTED");
            } else if ("APPROVE_AUDIT".equals(action)) {
                c.setStatus("APPROVED");
            } else if ("RETURN_FOR_CORRECTION".equals(action)) {
                c.setStatus("IN_PROGRESS");
            }
            apAuditCaseRepository.save(c);
        });

        // Mocked response to satisfy frontend's executeWorkflow payload since full logic is not requested
        return ResponseEntity.ok(Map.of(
            "success", true,
            "status", "APPROVE_AUDIT".equals(action) ? "APPROVED" : ("RETURN_FOR_CORRECTION".equals(action) ? "RETURNED_FOR_CORRECTION" : "SUBMITTED"),
            "auditCase", Map.of("status", "APPROVE_AUDIT".equals(action) ? "APPROVED" : ("RETURN_FOR_CORRECTION".equals(action) ? "RETURNED_FOR_CORRECTION" : "SUBMITTED"))
        ));
    }

    @PutMapping("/{caseId}/procedures/{procId}")
    @PreAuthorize("hasAnyRole('AUDITOR', 'TEAM_LEADER')")
    public ResponseEntity<?> updateProcedure(@PathVariable UUID caseId,
                                             @PathVariable UUID procId,
                                             @RequestBody mor.itas.api.dto.request.da.UpdateProcedureRequest request,
                                             @RequestHeader("X-Actor-Id") String actorId) {
        var proc = deskAuditExecutionUseCase.updateProcedure(caseId, procId, request, actorId);
        return ResponseEntity.ok(proc);
    }

    @DeleteMapping("/{caseId}/evidence/{evidenceId}")
    @PreAuthorize("hasAnyRole('AUDITOR', 'TEAM_LEADER')")
    public ResponseEntity<?> deleteEvidence(@PathVariable UUID caseId,
                                            @PathVariable UUID evidenceId,
                                            @RequestHeader("X-Actor-Id") String actorId) {
        deskAuditExecutionUseCase.deleteEvidence(caseId, evidenceId, actorId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{caseId}/findings/{findingId}")
    @PreAuthorize("hasAnyRole('AUDITOR', 'TEAM_LEADER')")
    public ResponseEntity<?> deleteFinding(@PathVariable UUID caseId,
                                           @PathVariable UUID findingId,
                                           @RequestHeader("X-Actor-Id") String actorId) {
        deskAuditExecutionUseCase.deleteFinding(caseId, findingId, actorId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{caseId}/working-papers/{wpId}")
    @PreAuthorize("hasAnyRole('AUDITOR', 'TEAM_LEADER')")
    public ResponseEntity<?> deleteWorkingPaper(@PathVariable UUID caseId,
                                                @PathVariable UUID wpId,
                                                @RequestHeader("X-Actor-Id") String actorId) {
        deskAuditExecutionUseCase.deleteWorkingPaper(caseId, wpId, actorId);
        return ResponseEntity.ok().build();
    }
}
