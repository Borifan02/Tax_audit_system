package mor.itas.api.controller.backoffice.qa;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import mor.itas.api.dto.request.qa.*;
import mor.itas.application.service.qa.QaExecutionService;
import mor.itas.application.service.qa.QaReviewService;
import mor.itas.application.service.qa.QaSamplingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/backoffice/qa/cases")
@RequiredArgsConstructor
public class QaController {

    private final QaExecutionService executionService;
    private final QaReviewService reviewService;
    private final QaSamplingService samplingService;

    private static final String QA_AND_AUDIT_ROLES =
            "hasAnyRole('QA_OFFICER', 'QA_TEAM_LEADER', 'QA_DIRECTOR', 'SYSTEM_ADMIN', 'DIRECTOR', 'AUDIT_DIRECTOR', 'TEAM_LEADER', 'AUDIT_TEAM_LEADER', 'AUDITOR', 'TAX_AUDITOR', 'SENIOR_AUDITOR', 'COMPREHENSIVE_AUDITOR', 'DESK_AUDITOR', 'JOINT_AUDITOR', 'TP_AUDITOR', 'ISSUE_AUDITOR')";

    private String resolveActor(String actorId, String userId) {
        if (actorId != null && !actorId.isBlank() && !"test-user".equals(actorId)) return actorId;
        if (userId != null && !userId.isBlank()) return userId;
        return actorId != null ? actorId : "u-qa-officer-1";
    }

    @GetMapping
    @PreAuthorize(QA_AND_AUDIT_ROLES)
    public ResponseEntity<?> getQaCases(@RequestParam(required = false, defaultValue = "false") boolean all) {
        return ResponseEntity.ok(reviewService.getQaCases(all));
    }

    @GetMapping("/stats")
    @PreAuthorize(QA_AND_AUDIT_ROLES)
    public ResponseEntity<?> getQaStats() {
        return ResponseEntity.ok(reviewService.getStats());
    }

    @GetMapping("/underlying/{auditCaseId}")
    @PreAuthorize(QA_AND_AUDIT_ROLES)
    public ResponseEntity<?> getUnderlyingDossier(@PathVariable String auditCaseId) {
        return ResponseEntity.ok(reviewService.getUnderlyingAuditCaseDossier(auditCaseId));
    }

    @GetMapping("/{caseId}")
    @PreAuthorize(QA_AND_AUDIT_ROLES)
    public ResponseEntity<?> getQaCase(@PathVariable String caseId) {
        return ResponseEntity.ok(reviewService.getQaCase(caseId));
    }

    @PostMapping("/sample")
    @PreAuthorize(QA_AND_AUDIT_ROLES)
    public ResponseEntity<?> runSampling(@RequestBody(required = false) QaReviewRequests.SamplingRunRequest request,
                                         @RequestHeader(value = "X-Actor-Id", defaultValue = "test-user") String actorId,
                                         @RequestHeader(value = "X-User-Id", required = false) String userId) {
        if (request == null) {
            request = new QaReviewRequests.SamplingRunRequest();
        }
        return ResponseEntity.ok(samplingService.runSampling(request, resolveActor(actorId, userId)));
    }

    @PutMapping("/{caseId}")
    @PreAuthorize(QA_AND_AUDIT_ROLES)
    public ResponseEntity<?> updateQaCase(@PathVariable String caseId,
                                          @RequestBody Map<String, Object> updates,
                                          @RequestHeader(value = "X-Actor-Id", defaultValue = "test-user") String actorId,
                                          @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(reviewService.updateQaCase(caseId, updates, resolveActor(actorId, userId)));
    }

    @PutMapping("/{caseId}/dimensions/{dimId}")
    @PreAuthorize(QA_AND_AUDIT_ROLES)
    public ResponseEntity<?> updateDimension(@PathVariable String caseId,
                                             @PathVariable String dimId,
                                             @RequestBody Map<String, Object> updates,
                                             @RequestHeader(value = "X-Actor-Id", defaultValue = "test-user") String actorId,
                                             @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(reviewService.updateDimension(caseId, dimId, updates, resolveActor(actorId, userId)));
    }

    @PostMapping("/{caseId}/action-plan")
    @PreAuthorize(QA_AND_AUDIT_ROLES)
    public ResponseEntity<?> submitActionPlan(@PathVariable String caseId,
                                              @Valid @RequestBody SubmitQaActionPlanRequest request,
                                              @RequestHeader(value = "X-Actor-Id", defaultValue = "test-user") String actorId,
                                              @RequestHeader(value = "X-User-Id", required = false) String userId) {
        UUID auditCaseUuid;
        try { auditCaseUuid = UUID.fromString(caseId); } catch (Exception e) { auditCaseUuid = UUID.nameUUIDFromBytes(caseId.getBytes()); }
        return ResponseEntity.ok(executionService.submitActionPlan(auditCaseUuid, request, resolveActor(actorId, userId)));
    }

    @PostMapping("/{caseId}/action-plan/review")
    @PreAuthorize(QA_AND_AUDIT_ROLES)
    public ResponseEntity<?> reviewActionPlan(@PathVariable String caseId,
                                              @Valid @RequestBody ReviewQaActionPlanRequest request,
                                              @RequestHeader(value = "X-Actor-Id", defaultValue = "test-user") String actorId,
                                              @RequestHeader(value = "X-User-Id", required = false) String userId) {
        UUID auditCaseUuid;
        try { auditCaseUuid = UUID.fromString(caseId); } catch (Exception e) { auditCaseUuid = UUID.nameUUIDFromBytes(caseId.getBytes()); }
        return ResponseEntity.ok(executionService.reviewActionPlan(auditCaseUuid, request, resolveActor(actorId, userId)));
    }

    @PostMapping("/{caseId}/workflow")
    @PreAuthorize(QA_AND_AUDIT_ROLES)
    public ResponseEntity<?> executeWorkflow(@PathVariable String caseId,
                                             @RequestBody QaWorkflowRequest request,
                                             @RequestHeader(value = "X-Actor-Id", defaultValue = "test-user") String actorId,
                                             @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(reviewService.executeWorkflow(caseId, request, resolveActor(actorId, userId)));
    }

    @PostMapping("/{caseId}/deficiencies")
    @PreAuthorize(QA_AND_AUDIT_ROLES)
    public ResponseEntity<?> createDeficiency(@PathVariable String caseId,
                                              @RequestBody QaDeficiencyRequest request,
                                              @RequestHeader(value = "X-Actor-Id", defaultValue = "test-user") String actorId,
                                              @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(reviewService.createDeficiency(caseId, request, resolveActor(actorId, userId)));
    }

    @PutMapping("/{caseId}/deficiencies/{defId}")
    @PreAuthorize(QA_AND_AUDIT_ROLES)
    public ResponseEntity<?> updateDeficiency(@PathVariable String caseId,
                                              @PathVariable String defId,
                                              @RequestBody QaDeficiencyRequest request,
                                              @RequestHeader(value = "X-Actor-Id", defaultValue = "test-user") String actorId,
                                              @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(reviewService.updateDeficiency(caseId, defId, request, resolveActor(actorId, userId)));
    }

    @DeleteMapping("/{caseId}/deficiencies/{defId}")
    @PreAuthorize(QA_AND_AUDIT_ROLES)
    public ResponseEntity<?> deleteDeficiency(@PathVariable String caseId,
                                              @PathVariable String defId,
                                              @RequestHeader(value = "X-Actor-Id", defaultValue = "test-user") String actorId,
                                              @RequestHeader(value = "X-User-Id", required = false) String userId) {
        reviewService.deleteDeficiency(caseId, defId, resolveActor(actorId, userId));
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/{caseId}/report")
    @PreAuthorize(QA_AND_AUDIT_ROLES)
    public ResponseEntity<?> generateQaReport(@PathVariable String caseId,
                                              @RequestBody QaReportRequest request,
                                              @RequestHeader(value = "X-Actor-Id", defaultValue = "test-user") String actorId,
                                              @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(reviewService.generateReport(caseId, request, resolveActor(actorId, userId)));
    }

    @PostMapping("/{caseId}/exit-conference")
    @PreAuthorize(QA_AND_AUDIT_ROLES)
    public ResponseEntity<?> saveExitConference(@PathVariable UUID caseId,
                                                @RequestBody QaExitConferenceDto request,
                                                @RequestHeader(value = "X-Actor-Id", defaultValue = "test-user") String actorId,
                                                @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(reviewService.saveExitConference(caseId, request, resolveActor(actorId, userId)));
    }

    @PostMapping("/{caseId}/follow-up")
    @PreAuthorize(QA_AND_AUDIT_ROLES)
    public ResponseEntity<?> saveFollowUp(@PathVariable UUID caseId,
                                          @RequestBody QaFollowUpDto request,
                                          @RequestHeader(value = "X-Actor-Id", defaultValue = "test-user") String actorId,
                                          @RequestHeader(value = "X-User-Id", required = false) String userId) {
        return ResponseEntity.ok(reviewService.saveFollowUp(caseId, request, resolveActor(actorId, userId)));
    }
}
