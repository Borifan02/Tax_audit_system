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
import java.util.UUID;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/backoffice/qa/cases")
@RequiredArgsConstructor
public class QaController {

    private final QaExecutionService executionService;
    private final QaReviewService reviewService;
    private final QaSamplingService samplingService;

    @GetMapping
    @PreAuthorize("hasAnyRole('QA_OFFICER', 'QA_TEAM_LEADER', 'QA_DIRECTOR')")
    public ResponseEntity<?> getQaCases(@RequestParam(required = false, defaultValue = "false") boolean all) {
        return ResponseEntity.ok(reviewService.getQaCases(all));
    }

    @GetMapping("/{caseId}")
    @PreAuthorize("hasAnyRole('QA_OFFICER', 'QA_TEAM_LEADER', 'QA_DIRECTOR')")
    public ResponseEntity<?> getQaCase(@PathVariable String caseId) {
        return ResponseEntity.ok(reviewService.getQaCase(caseId));
    }

    @PostMapping("/sample")
    @PreAuthorize("hasAnyRole('QA_OFFICER', 'QA_TEAM_LEADER', 'QA_DIRECTOR')")
    public ResponseEntity<?> runSampling(@RequestBody(required = false) QaReviewRequests.SamplingRunRequest request,
                                         @RequestHeader(value = "X-Actor-Id", defaultValue = "test-user") String actorId) {
        if (request == null) {
            request = new QaReviewRequests.SamplingRunRequest();
        }
        return ResponseEntity.ok(samplingService.runSampling(request, actorId));
    }

    @PutMapping("/{caseId}")
    @PreAuthorize("hasRole('QA_OFFICER')")
    public ResponseEntity<?> updateQaCase(@PathVariable String caseId, @RequestBody Map<String, Object> updates) {
        // Dummy endpoint to satisfy frontend save
        return ResponseEntity.ok(updates);
    }

    @PutMapping("/{caseId}/dimensions/{dimId}")
    @PreAuthorize("hasRole('QA_OFFICER')")
    public ResponseEntity<?> updateDimension(@PathVariable String caseId, @PathVariable String dimId, @RequestBody Map<String, Object> updates) {
        // Dummy endpoint to satisfy frontend dimension updates
        return ResponseEntity.ok(updates);
    }

    @PostMapping("/{caseId}/action-plan")
    @PreAuthorize("hasRole('QA_OFFICER')")
    public ResponseEntity<?> submitActionPlan(@PathVariable String caseId,
                                              @Valid @RequestBody SubmitQaActionPlanRequest request,
                                              @RequestHeader(value = "X-Actor-Id", defaultValue = "test-user") String actorId) {
        UUID auditCaseUuid = null;
        try { auditCaseUuid = UUID.fromString(caseId); } catch (Exception e) { auditCaseUuid = UUID.nameUUIDFromBytes(caseId.getBytes()); }
        return ResponseEntity.ok(executionService.submitActionPlan(auditCaseUuid, request, actorId));
    }

    @PostMapping("/{caseId}/action-plan/review")
    @PreAuthorize("hasRole('QA_TEAM_LEADER')")
    public ResponseEntity<?> reviewActionPlan(@PathVariable String caseId,
                                              @Valid @RequestBody ReviewQaActionPlanRequest request,
                                              @RequestHeader(value = "X-Actor-Id", defaultValue = "test-user") String actorId) {
        UUID auditCaseUuid = null;
        try { auditCaseUuid = UUID.fromString(caseId); } catch (Exception e) { auditCaseUuid = UUID.nameUUIDFromBytes(caseId.getBytes()); }
        return ResponseEntity.ok(executionService.reviewActionPlan(auditCaseUuid, request, actorId));
    }

    @PostMapping("/{caseId}/workflow")
    @PreAuthorize("hasAnyRole('QA_OFFICER', 'QA_TEAM_LEADER')")
    public ResponseEntity<?> executeWorkflow(@PathVariable String caseId,
                                             @RequestBody QaWorkflowRequest request,
                                             @RequestHeader(value = "X-Actor-Id", defaultValue = "test-user") String actorId) {
        return ResponseEntity.ok(reviewService.executeWorkflow(caseId, request, actorId));
    }

    @PostMapping("/{caseId}/deficiencies")
    @PreAuthorize("hasRole('QA_OFFICER')")
    public ResponseEntity<?> createDeficiency(@PathVariable String caseId,
                                              @RequestBody QaDeficiencyRequest request,
                                              @RequestHeader(value = "X-Actor-Id", defaultValue = "test-user") String actorId) {
        return ResponseEntity.ok(reviewService.createDeficiency(caseId, request, actorId));
    }

    @PutMapping("/{caseId}/deficiencies/{defId}")
    @PreAuthorize("hasRole('QA_OFFICER')")
    public ResponseEntity<?> updateDeficiency(@PathVariable String caseId,
                                              @PathVariable String defId,
                                              @RequestBody QaDeficiencyRequest request,
                                              @RequestHeader(value = "X-Actor-Id", defaultValue = "test-user") String actorId) {
        return ResponseEntity.ok(reviewService.updateDeficiency(caseId, defId, request, actorId));
    }

    @DeleteMapping("/{caseId}/deficiencies/{defId}")
    @PreAuthorize("hasRole('QA_OFFICER')")
    public ResponseEntity<?> deleteDeficiency(@PathVariable String caseId,
                                              @PathVariable String defId,
                                              @RequestHeader(value = "X-Actor-Id", defaultValue = "test-user") String actorId) {
        reviewService.deleteDeficiency(caseId, defId, actorId);
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/{caseId}/report")
    @PreAuthorize("hasRole('QA_OFFICER')")
    public ResponseEntity<?> generateQaReport(@PathVariable String caseId,
                                              @RequestBody QaReportRequest request,
                                              @RequestHeader(value = "X-Actor-Id", defaultValue = "test-user") String actorId) {
        return ResponseEntity.ok(reviewService.generateReport(caseId, request, actorId));
    }
    
    @PostMapping("/{caseId}/exit-conference")
    @PreAuthorize("hasRole('QA_OFFICER')")
    public ResponseEntity<?> saveExitConference(@PathVariable UUID caseId,
                                                @RequestBody QaExitConferenceDto request,
                                                @RequestHeader(value = "X-Actor-Id", defaultValue = "test-user") String actorId) {
        return ResponseEntity.ok(reviewService.saveExitConference(caseId, request, actorId));
    }

    @PostMapping("/{caseId}/follow-up")
    @PreAuthorize("hasAnyRole('QA_OFFICER', 'QA_TEAM_LEADER')")
    public ResponseEntity<?> saveFollowUp(@PathVariable UUID caseId,
                                          @RequestBody QaFollowUpDto request,
                                          @RequestHeader(value = "X-Actor-Id", defaultValue = "test-user") String actorId) {
        return ResponseEntity.ok(reviewService.saveFollowUp(caseId, request, actorId));
    }
}
