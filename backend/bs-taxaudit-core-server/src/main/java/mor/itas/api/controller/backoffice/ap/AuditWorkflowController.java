package mor.itas.api.controller.backoffice.ap;

import mor.itas.api.dto.response.ap.GenericResponse;
import mor.itas.domain.service.ap.AuditWorkflowService;
import mor.itas.persistence.jpa.entity.ap.*;
import lombok.RequiredArgsConstructor;
import lombok.Data;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * AuditWorkflowController - REST endpoints for the 11-step audit execution workflow.
 *
 * Step 1:  Case Handoff (import from committee)
 * Step 2:  Assignment (team leader → auditor)
 * Step 3:  Planning (submit, approve, revise)
 * Step 4:  Entry Conference (schedule, minutes, approve)
 * Step 5:  Information Request (document requests, query sheets)
 * Step 6:  Document Collection (upload, verify, reject)
 * Step 7:  CAAT Analysis (run, validate anomalies)
 * Step 8:  Audit Testing (working papers, evidence)
 * Step 9:  Findings (create, submit, approve, revise)
 * Step 10: Taxpayer Response
 * Step 11: Conclusion (conclude, finalize, sign)
 */
@RestController
@RequestMapping("/api/v1/backoffice/ap/cases/{caseId}")
@RequiredArgsConstructor
public class AuditWorkflowController {

    private final AuditWorkflowService workflowService;

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 1: CASE HANDOFF
    // ═══════════════════════════════════════════════════════════════════════════

    @PostMapping("/handoff")
    public ResponseEntity<GenericResponse<ApAuditCaseEntity>> handoffCase(
            @PathVariable UUID caseId,
            @RequestBody(required = false) HandoffRequest request,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "system") String actorId) {
        String comment = request != null ? request.getComment() : null;
        String effectiveActorId = (request != null && request.getTeamLeaderId() != null && !request.getTeamLeaderId().isBlank() && !"system".equalsIgnoreCase(request.getTeamLeaderId()))
                ? request.getTeamLeaderId() : actorId;
        ApAuditCaseEntity result = workflowService.handoffCase(caseId, effectiveActorId, comment);
        return ResponseEntity.ok(GenericResponse.success(result));
    }

    @PostMapping("/import-from-committee")
    public ResponseEntity<GenericResponse<ApAuditCaseEntity>> importCaseFromCommittee(
            @PathVariable UUID caseId,
            @RequestBody(required = false) ImportFromCommitteeRequest request,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "system") String actorId) {
        String teamLeaderId = request != null ? request.getTeamLeaderId() : null;
        if (teamLeaderId == null || teamLeaderId.isEmpty() || "system".equals(teamLeaderId)) {
            teamLeaderId = actorId;
        }
        ApAuditCaseEntity result = workflowService.importCaseFromCommittee(caseId, teamLeaderId);
        return ResponseEntity.ok(GenericResponse.success(result));
    }

    @PostMapping("/decline-handoff")
    public ResponseEntity<GenericResponse<ApAuditCaseEntity>> declineHandoff(
            @PathVariable UUID caseId,
            @RequestBody DeclineHandoffRequest request) {
        ApAuditCaseEntity result = workflowService.declineHandoff(caseId, request.getReason());
        return ResponseEntity.ok(GenericResponse.success(result));
    }

    /**
     * @deprecated Step 2 assignment response is no longer needed.
     * assignToAuditor() already sets status to IN_PROGRESS immediately.
     */
    @Deprecated
    @PostMapping("/respond-assignment")
    public ResponseEntity<GenericResponse<ApAuditCaseEntity>> respondToAssignment(
            @PathVariable UUID caseId,
            @RequestBody RespondToAssignmentRequest request) {
        ApAuditCaseEntity result = workflowService.respondToAssignment(
                caseId, request.isAccepted(), request.getReason());
        return ResponseEntity.ok(GenericResponse.success(result));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 3: PLANNING
    // ═══════════════════════════════════════════════════════════════════════════

    @PostMapping("/plan")
    public ResponseEntity<GenericResponse<AuditPlanRecordEntity>> submitPlan(
            @PathVariable UUID caseId,
            @RequestBody Map<String, String> plan,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "system") String actorId) {
        AuditPlanRecordEntity result = workflowService.submitPlan(caseId, plan, actorId);
        return ResponseEntity.ok(GenericResponse.success(result));
    }

    @PostMapping("/plan/approve")
    public ResponseEntity<GenericResponse<AuditPlanRecordEntity>> approvePlan(
            @PathVariable UUID caseId,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "system") String actorId) {
        AuditPlanRecordEntity result = workflowService.approvePlan(caseId);
        return ResponseEntity.ok(GenericResponse.success(result));
    }

    @PostMapping("/plan/revise")
    public ResponseEntity<GenericResponse<AuditPlanRecordEntity>> revisePlan(
            @PathVariable UUID caseId,
            @RequestBody RevisionNotesRequest request) {
        AuditPlanRecordEntity result = workflowService.revisePlan(caseId, request.getRevisionNotes());
        return ResponseEntity.ok(GenericResponse.success(result));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 4: ENTRY CONFERENCE
    // ═══════════════════════════════════════════════════════════════════════════

    @PostMapping("/conference")
    public ResponseEntity<GenericResponse<ConferenceRecordEntity>> scheduleConference(
            @PathVariable UUID caseId,
            @RequestBody Map<String, String> data,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "system") String actorId) {
        ConferenceRecordEntity result = workflowService.scheduleConference(caseId, data, actorId);
        return ResponseEntity.ok(GenericResponse.success(result));
    }

    @PostMapping("/conference/minutes")
    public ResponseEntity<GenericResponse<ConferenceRecordEntity>> recordConferenceMinutes(
            @PathVariable UUID caseId,
            @RequestBody MinutesRequest request,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "system") String actorId) {
        ConferenceRecordEntity result = workflowService.recordConferenceMinutes(
                caseId, request.getMinutes(), actorId);
        return ResponseEntity.ok(GenericResponse.success(result));
    }

    @PostMapping("/conference/approve")
    public ResponseEntity<GenericResponse<ConferenceRecordEntity>> approveConference(
            @PathVariable UUID caseId,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "system") String actorId) {
        ConferenceRecordEntity result = workflowService.approveConference(caseId, actorId);
        return ResponseEntity.ok(GenericResponse.success(result));
    }

    @PostMapping("/conference/skip")
    public ResponseEntity<GenericResponse<Map<String, Object>>> skipConference(
            @PathVariable UUID caseId,
            @RequestBody(required = false) Map<String, String> data,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "system") String actorId) {
        String reason = (data != null) ? data.getOrDefault("reason", "Waived — not applicable for this case") : "Waived";
        workflowService.skipConference(caseId, reason, actorId);
        Map<String, Object> result = Map.of("status", "SKIPPED", "reason", reason, "caseId", caseId.toString());
        return ResponseEntity.ok(GenericResponse.success(result));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 5: INFORMATION REQUEST
    // ═══════════════════════════════════════════════════════════════════════════

    @PostMapping("/doc-requests")
    public ResponseEntity<GenericResponse<DocumentRequestRecordEntity>> createDocumentRequest(
            @PathVariable UUID caseId,
            @RequestBody Map<String, String> data,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "system") String actorId) {
        DocumentRequestRecordEntity result = workflowService.createDocumentRequest(caseId, data, actorId);
        return ResponseEntity.ok(GenericResponse.success(result));
    }

    @PostMapping("/query-sheets")
    public ResponseEntity<GenericResponse<DocumentRequestRecordEntity>> sendQuerySheet(
            @PathVariable UUID caseId,
            @RequestBody Map<String, String> data,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "system") String actorId) {
        DocumentRequestRecordEntity result = workflowService.sendQuerySheet(caseId, data, actorId);
        return ResponseEntity.ok(GenericResponse.success(result));
    }

    @PostMapping("/doc-requests/{requestId}/followup")
    public ResponseEntity<GenericResponse<DocumentRequestRecordEntity>> sendFollowUp(
            @PathVariable UUID caseId,
            @PathVariable UUID requestId,
            @RequestBody FollowUpRequest request) {
        DocumentRequestRecordEntity result = workflowService.sendFollowUp(caseId, requestId, request.getMessage());
        return ResponseEntity.ok(GenericResponse.success(result));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 6: DOCUMENT COLLECTION
    // ═══════════════════════════════════════════════════════════════════════════

    @PostMapping("/documents")
    public ResponseEntity<GenericResponse<AuditDocumentEntity>> uploadDocument(
            @PathVariable UUID caseId,
            @RequestBody UploadDocumentRequest request,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "system") String actorId) {
        UUID requestId = request.getRequestId() != null ? UUID.fromString(request.getRequestId()) : null;
        AuditDocumentEntity result = workflowService.uploadDocument(
                caseId, request.getFileName(), request.getContentType(),
                request.getFileSize(), request.getFileUrl(), requestId, actorId);
        return ResponseEntity.ok(GenericResponse.success(result));
    }

    @PostMapping("/documents/{documentId}/verify")
    public ResponseEntity<GenericResponse<AuditDocumentEntity>> verifyDocument(
            @PathVariable UUID caseId,
            @PathVariable UUID documentId,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "system") String actorId) {
        AuditDocumentEntity result = workflowService.verifyDocument(caseId, documentId, actorId);
        return ResponseEntity.ok(GenericResponse.success(result));
    }

    @PostMapping("/documents/{documentId}/reject")
    public ResponseEntity<GenericResponse<AuditDocumentEntity>> rejectDocument(
            @PathVariable UUID caseId,
            @PathVariable UUID documentId,
            @RequestBody RejectDocumentRequest request) {
        AuditDocumentEntity result = workflowService.rejectDocument(caseId, documentId, request.getReason());
        return ResponseEntity.ok(GenericResponse.success(result));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 7: CAAT ANALYSIS
    // ═══════════════════════════════════════════════════════════════════════════

    @PostMapping("/caat/run")
    public ResponseEntity<GenericResponse<List<CaatAnomalyEntity>>> runCAATAnalysis(
            @PathVariable UUID caseId,
            @RequestBody CaatRunRequest request,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "system") String actorId) {
        List<CaatAnomalyEntity> result = workflowService.runCAATAnalysis(
                caseId, request.getAnalysisTypes(), actorId);
        return ResponseEntity.ok(GenericResponse.success(result, result.size(), (long) result.size()));
    }

    @PostMapping("/caat/anomalies/{anomalyId}/validate")
    public ResponseEntity<GenericResponse<CaatAnomalyEntity>> validateAnomaly(
            @PathVariable UUID caseId,
            @PathVariable UUID anomalyId,
            @RequestBody ValidateAnomalyRequest request,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "system") String actorId) {
        CaatAnomalyEntity result = workflowService.validateAnomaly(
                caseId, anomalyId, request.getDecision(), request.getNotes(), actorId);
        return ResponseEntity.ok(GenericResponse.success(result));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 8: AUDIT TESTING
    // ═══════════════════════════════════════════════════════════════════════════

    @PostMapping("/working-papers")
    public ResponseEntity<GenericResponse<WorkingPaperEntity>> addWorkingPaper(
            @PathVariable UUID caseId,
            @RequestBody Map<String, String> data,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "system") String actorId) {
        WorkingPaperEntity result = workflowService.addWorkingPaper(caseId, data, actorId);
        return ResponseEntity.ok(GenericResponse.success(result));
    }

    @PostMapping("/working-papers/{paperId}/evidence")
    public ResponseEntity<GenericResponse<WorkingPaperEntity>> uploadEvidence(
            @PathVariable UUID caseId,
            @PathVariable UUID paperId,
            @RequestBody UploadEvidenceRequest request) {
        WorkingPaperEntity result = workflowService.uploadEvidence(
                caseId, paperId, request.getFileUrl(), request.getFileName());
        return ResponseEntity.ok(GenericResponse.success(result));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 9: FINDINGS
    // ═══════════════════════════════════════════════════════════════════════════

    @PostMapping("/findings")
    public ResponseEntity<GenericResponse<AuditFindingEntity>> createFinding(
            @PathVariable UUID caseId,
            @RequestBody Map<String, Object> data,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "system") String actorId) {
        AuditFindingEntity result = workflowService.createFinding(caseId, data, actorId);
        return ResponseEntity.ok(GenericResponse.success(result));
    }

    @PostMapping("/findings/submit")
    public ResponseEntity<GenericResponse<String>> submitFindings(
            @PathVariable UUID caseId) {
        workflowService.submitFindings(caseId);
        return ResponseEntity.ok(GenericResponse.success("Findings submitted for review"));
    }

    @PostMapping("/findings/{findingId}/approve")
    public ResponseEntity<GenericResponse<AuditFindingEntity>> approveFinding(
            @PathVariable UUID caseId,
            @PathVariable UUID findingId,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "system") String actorId) {
        AuditFindingEntity result = workflowService.approveFinding(caseId, findingId, actorId);
        return ResponseEntity.ok(GenericResponse.success(result));
    }

    @PostMapping("/findings/{findingId}/revise")
    public ResponseEntity<GenericResponse<AuditFindingEntity>> reviseFinding(
            @PathVariable UUID caseId,
            @PathVariable UUID findingId,
            @RequestBody RevisionNotesRequest request) {
        AuditFindingEntity result = workflowService.reviseFinding(caseId, findingId, request.getRevisionNotes());
        return ResponseEntity.ok(GenericResponse.success(result));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 10: TAXPAYER RESPONSE
    // ═══════════════════════════════════════════════════════════════════════════

    @PostMapping("/findings/{findingId}/respond")
    public ResponseEntity<GenericResponse<AuditFindingEntity>> respondToFinding(
            @PathVariable UUID caseId,
            @PathVariable UUID findingId,
            @RequestBody TaxpayerResponseRequest request) {
        AuditFindingEntity result = workflowService.respondToFinding(
                caseId, findingId, request.getResponseType(),
                request.getExplanation(), request.getEvidence());
        return ResponseEntity.ok(GenericResponse.success(result));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 11: CONCLUSION
    // ═══════════════════════════════════════════════════════════════════════════

    @PostMapping("/findings/{findingId}/conclude")
    public ResponseEntity<GenericResponse<AuditFindingEntity>> concludeFinding(
            @PathVariable UUID caseId,
            @PathVariable UUID findingId,
            @RequestBody ConcludeFindingRequest request,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "system") String actorId) {
        AuditFindingEntity result = workflowService.concludeFinding(
                caseId, findingId, request.getConclusion(), actorId);
        return ResponseEntity.ok(GenericResponse.success(result));
    }

    @PostMapping("/finalize")
    public ResponseEntity<GenericResponse<ApAuditCaseEntity>> finalizeCase(
            @PathVariable UUID caseId) {
        ApAuditCaseEntity result = workflowService.finalizeCase(caseId);
        return ResponseEntity.ok(GenericResponse.success(result));
    }

    @PostMapping("/sign-report")
    public ResponseEntity<GenericResponse<ApAuditCaseEntity>> signReport(
            @PathVariable UUID caseId,
            @RequestBody SignReportRequest request) {
        ApAuditCaseEntity result = workflowService.signReport(caseId, request.getDigitalSignature());
        return ResponseEntity.ok(GenericResponse.success(result));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // GET ENDPOINTS
    // ═══════════════════════════════════════════════════════════════════════════

    @GetMapping("/workflow")
    public ResponseEntity<GenericResponse<Map<String, Object>>> getCaseWorkflow(@PathVariable UUID caseId) {
        Map<String, Object> result = workflowService.getCaseWorkflow(caseId);
        return ResponseEntity.ok(GenericResponse.success(result));
    }

    @GetMapping("/documents")
    public ResponseEntity<GenericResponse<List<AuditDocumentEntity>>> getDocuments(@PathVariable UUID caseId) {
        List<AuditDocumentEntity> result = workflowService.getDocuments(caseId);
        return ResponseEntity.ok(GenericResponse.success(result, result.size(), (long) result.size()));
    }

    @GetMapping("/findings")
    public ResponseEntity<GenericResponse<List<AuditFindingEntity>>> getFindings(@PathVariable UUID caseId) {
        List<AuditFindingEntity> result = workflowService.getFindings(caseId);
        return ResponseEntity.ok(GenericResponse.success(result, result.size(), (long) result.size()));
    }

    @GetMapping("/caat/results")
    public ResponseEntity<GenericResponse<List<CaatAnomalyEntity>>> getCAATResults(@PathVariable UUID caseId) {
        List<CaatAnomalyEntity> result = workflowService.getCAATResults(caseId);
        return ResponseEntity.ok(GenericResponse.success(result, result.size(), (long) result.size()));
    }

    @GetMapping("/working-papers")
    public ResponseEntity<GenericResponse<List<WorkingPaperEntity>>> getWorkingPapers(@PathVariable UUID caseId) {
        List<WorkingPaperEntity> result = workflowService.getWorkingPapers(caseId);
        return ResponseEntity.ok(GenericResponse.success(result, result.size(), (long) result.size()));
    }

    @GetMapping("/doc-requests")
    public ResponseEntity<GenericResponse<List<DocumentRequestRecordEntity>>> getDocumentRequests(@PathVariable UUID caseId) {
        List<DocumentRequestRecordEntity> result = workflowService.getDocumentRequests(caseId);
        return ResponseEntity.ok(GenericResponse.success(result, result.size(), (long) result.size()));
    }

    @GetMapping("/conference")
    public ResponseEntity<GenericResponse<ConferenceRecordEntity>> getConference(@PathVariable UUID caseId) {
        ConferenceRecordEntity result = workflowService.getConference(caseId);
        return ResponseEntity.ok(GenericResponse.success(result));
    }

    @GetMapping("/plan")
    public ResponseEntity<GenericResponse<AuditPlanRecordEntity>> getLatestPlan(@PathVariable UUID caseId) {
        AuditPlanRecordEntity result = workflowService.getPlans(caseId)
                .stream().findFirst().orElse(null);
        return ResponseEntity.ok(GenericResponse.success(result));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // REQUEST DTOs
    // ═══════════════════════════════════════════════════════════════════════════

    @Data
    static class ImportFromCommitteeRequest {
        private String teamLeaderId;
    }

    @Data
    static class HandoffRequest {
        private String comment;
        private String teamLeaderId;
    }

    @Data
    static class DeclineHandoffRequest {
        private String reason;
    }

    @Data
    static class AssignToAuditorRequest {
        private String auditorId;
        private String dueDate;
        private String instructions;
    }

    @Data
    static class RespondToAssignmentRequest {
        private boolean accepted;
        private String reason;
    }

    @Data
    static class RevisionNotesRequest {
        private String revisionNotes;
    }

    @Data
    static class MinutesRequest {
        private String minutes;
    }

    @Data
    static class FollowUpRequest {
        private String message;
    }

    @Data
    static class UploadDocumentRequest {
        private String fileName;
        private String contentType;
        private Long fileSize;
        private String fileUrl;
        private String requestId;
    }

    @Data
    static class RejectDocumentRequest {
        private String reason;
    }

    @Data
    static class CaatRunRequest {
        private List<String> analysisTypes;
    }

    @Data
    static class ValidateAnomalyRequest {
        private String decision;
        private String notes;
    }

    @Data
    static class UploadEvidenceRequest {
        private String fileUrl;
        private String fileName;
    }

    @Data
    static class TaxpayerResponseRequest {
        private String responseType;
        private String explanation;
        private String evidence;
    }

    @Data
    static class ConcludeFindingRequest {
        private String conclusion;
    }

    @Data
    static class SignReportRequest {
        private String digitalSignature;
    }
}
