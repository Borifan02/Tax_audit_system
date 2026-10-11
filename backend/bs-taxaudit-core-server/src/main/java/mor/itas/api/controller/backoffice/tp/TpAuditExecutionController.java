package mor.itas.api.controller.backoffice.tp;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import mor.itas.api.dto.request.tp.*;
import mor.itas.application.service.notification.NotificationService;
import mor.itas.application.service.tp.TpCaseInitializationService;
import mor.itas.application.usecase.tp.*;
import mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity;
import mor.itas.persistence.jpa.entity.tp.*;
import mor.itas.persistence.jpa.repository.ap.ApAuditCaseRepository;
import mor.itas.persistence.jpa.repository.tp.*;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;

/**
 * TP Audit Execution REST Controller — covering all Transfer Pricing phases (BUC-TA-013 through BUC-TA-018).
 * Base: /api/v1/backoffice/tp/cases/{caseId}
 */
@RestController
@RequestMapping("/api/v1/backoffice/tp/cases/{caseId}")
@RequiredArgsConstructor
@Slf4j
public class TpAuditExecutionController {

    private final TpRiskAssessmentUseCase riskAssessmentUseCase;
    private final TpWorkingHypothesisUseCase workingHypothesisUseCase;
    private final TpAuditPlanUseCase auditPlanUseCase;
    private final TpPlanningMeetingUseCase planningMeetingUseCase;
    private final TpFieldWorkUseCase fieldWorkUseCase;
    private final TpAnalysisUseCase analysisUseCase;
    private final TpAuditReportUseCase auditReportUseCase;
    private final TpNoticeAndObjectionUseCase noticeAndObjectionUseCase;

    private final TpCaseInitializationService tpCaseInitializationService;
    private final ApAuditCaseRepository caseRepository;
    private final TpRiskAssessmentRepository riskAssessmentRepository;
    private final TpWorkingHypothesisRepository workingHypothesisRepository;
    private final TpAuditPlanRepository auditPlanRepository;
    private final TpPlanningMeetingRepository planningMeetingRepository;
    private final TpFieldWorkDataRepository fieldWorkDataRepository;
    private final TpAnalysisDataRepository analysisDataRepository;
    private final TpAuditReportRepository auditReportRepository;
    private final TpAuditNoticeRepository auditNoticeRepository;
    private final TpObjectionRepository objectionRepository;
    private final TpInformationRequestLogRepository idrRepository;
    private final TpExitConferenceRepository exitConferenceRepository;
    private final TpCompetitorPriceUploadRepository competitorPriceUploadRepository;
    private final TpExternalPriceMatchRepository externalPriceMatchRepository;
    private final TpAuditActionHistoryRepository actionHistoryRepository;
    private final TpPhaseGateRepository phaseGateRepository;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;
    private final mor.itas.persistence.jpa.repository.identity.UserRepository userRepository;

    // ── Full Case State Endpoint ─────────────────────────────────────────────

    @GetMapping("/full-state")
    @Transactional
    public ResponseEntity<Map<String, Object>> getFullState(
            @PathVariable UUID caseId,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {

        ApAuditCaseEntity caseEntity = tpCaseInitializationService.initializeTpCaseIfEmpty(caseId, actorId);

        Map<String, Object> state = new HashMap<>();

        Map<String, Object> caseDetails = new HashMap<>();
        caseDetails.put("id", caseEntity.getId());
        caseDetails.put("caseNumber", caseEntity.getCaseNumber());
        caseDetails.put("taxpayerId", caseEntity.getTaxpayerId());
        caseDetails.put("taxpayerName", caseEntity.getTaxpayerName());
        caseDetails.put("sector", caseEntity.getSector());
        caseDetails.put("auditType", caseEntity.getAuditType());
        caseDetails.put("riskScore", caseEntity.getRiskScore());
        caseDetails.put("estimatedRevenue", caseEntity.getEstimatedRevenue());
        caseDetails.put("status", caseEntity.getStatus());
        caseDetails.put("tpCurrentPhase", caseEntity.getTpCurrentPhase() != null ? caseEntity.getTpCurrentPhase() : "DETAILED_RISK_ASSESSMENT");
        caseDetails.put("taxCenterCode", caseEntity.getTaxCenterCode());
        caseDetails.put("regionCode", caseEntity.getRegionCode());
        caseDetails.put("assignedAuditorId", caseEntity.getAssignedAuditorId());
        caseDetails.put("assignedTeamLeaderId", caseEntity.getAssignedTeamLeaderId());
        
        String tlName = null;
        if (caseEntity.getAssignedTeamLeaderId() != null && !caseEntity.getAssignedTeamLeaderId().isBlank()) {
            tlName = userRepository.findByUsername(caseEntity.getAssignedTeamLeaderId())
                    .map(mor.itas.persistence.jpa.entity.identity.UserEntity::getFullName)
                    .orElse(caseEntity.getAssignedTeamLeaderId());
        }
        String audName = null;
        if (caseEntity.getAssignedAuditorId() != null && !caseEntity.getAssignedAuditorId().isBlank()) {
            audName = userRepository.findByUsername(caseEntity.getAssignedAuditorId())
                    .map(mor.itas.persistence.jpa.entity.identity.UserEntity::getFullName)
                    .orElse(caseEntity.getAssignedAuditorId());
        }
        caseDetails.put("assignedTeamLeaderName", tlName);
        caseDetails.put("assignedAuditorName", audName);

        caseDetails.put("committeeId", caseEntity.getCommitteeId());
        caseDetails.put("createdAt", caseEntity.getCreatedAt());
        state.put("caseDetails", caseDetails);

        state.put("riskAssessment", riskAssessmentRepository.findByAuditCaseId(caseId).orElse(null));
        state.put("workingHypothesis", workingHypothesisRepository.findByAuditCaseId(caseId).orElse(null));
        state.put("auditPlan", auditPlanRepository.findByAuditCaseId(caseId).orElse(null));
        state.put("planningMeetings", planningMeetingRepository.findByAuditCaseId(caseId).orElse(null));
        state.put("fieldWork", fieldWorkDataRepository.findByAuditCaseId(caseId).orElse(null));
        state.put("informationRequests", idrRepository.findByAuditCaseIdOrderByCreatedAtDesc(caseId));
        state.put("analysis", analysisDataRepository.findByAuditCaseId(caseId).orElse(null));
        state.put("competitorPrices", competitorPriceUploadRepository.findByAuditCaseIdOrderByPriceDateDesc(caseId));
        state.put("priceMatches", externalPriceMatchRepository.findByAuditCaseIdOrderByGeneratedAtDesc(caseId));
        state.put("reports", auditReportRepository.findByAuditCaseIdOrderByVersionDesc(caseId));
        state.put("exitConference", exitConferenceRepository.findByAuditCaseId(caseId).orElse(null));
        state.put("notices", auditNoticeRepository.findByAuditCaseId(caseId).orElse(null));
        state.put("objections", objectionRepository.findByAuditCaseIdOrderByCreatedAtDesc(caseId));
        state.put("actionHistory", actionHistoryRepository.findByAuditCaseIdOrderByActionTimestampAsc(caseId));
        state.put("phaseGates", phaseGateRepository.findByAuditCaseIdOrderByCreatedAtAsc(caseId));

        return ResponseEntity.ok(state);
    }

    // ── Strict Phase Gate Governance & Sub-Step Endpoints ──────────────────────

    @GetMapping("/phase-gates")
    @Transactional
    public ResponseEntity<List<Map<String, Object>>> getPhaseGates(
            @PathVariable UUID caseId,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {

        tpCaseInitializationService.initializeTpCaseIfEmpty(caseId, actorId);
        List<TpPhaseGateEntity> gates = phaseGateRepository.findByAuditCaseIdOrderByCreatedAtAsc(caseId);

        List<String> phasesOrdered = List.of(
                "DETAILED_RISK_ASSESSMENT",
                "AUDIT_PLANNING",
                "FIELD_WORK",
                "ANALYSIS",
                "REPORT",
                "ASSESSMENT",
                "NOTICE",
                "CLOSURE"
        );

        Map<String, TpPhaseGateEntity> gateMap = new HashMap<>();
        for (TpPhaseGateEntity g : gates) {
            gateMap.put(g.getPhaseId(), g);
        }

        ApAuditCaseEntity caseEntity = caseRepository.findById(caseId).orElse(null);
        String currentPhase = (caseEntity != null && caseEntity.getTpCurrentPhase() != null)
                ? caseEntity.getTpCurrentPhase() : "DETAILED_RISK_ASSESSMENT";
        int currentPhaseIndex = phasesOrdered.indexOf(currentPhase);
        if (currentPhaseIndex < 0) currentPhaseIndex = 0;

        List<Map<String, Object>> result = new ArrayList<>();
        boolean previousApproved = true; // Phase 1 is always unlocked

        for (int i = 0; i < phasesOrdered.size(); i++) {
            String phaseId = phasesOrdered.get(i);
            TpPhaseGateEntity entity = gateMap.get(phaseId);
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("phaseId", phaseId);
            item.put("phaseIndex", i + 1);

            boolean isUnlocked = previousApproved || (currentPhaseIndex >= i);
            item.put("isUnlocked", isUnlocked);

            if (entity != null) {
                item.put("id", entity.getId());
                item.put("status", entity.getStatus());
                item.put("subStepsCompleted", entity.getSubStepsCompleted());
                item.put("subStepData", entity.getSubStepData());
                item.put("submittedAt", entity.getSubmittedAt());
                item.put("submittedBy", entity.getSubmittedBy());
                item.put("reviewedAt", entity.getReviewedAt());
                item.put("reviewedBy", entity.getReviewedBy());
                item.put("reviewerRole", entity.getReviewerRole());
                item.put("reviewDecision", entity.getReviewDecision());
                item.put("reviewComments", entity.getReviewComments());

                previousApproved = "APPROVED".equalsIgnoreCase(entity.getStatus()) || (currentPhaseIndex > i);
            } else {
                item.put("status", "DRAFT");
                item.put("subStepsCompleted", Collections.emptyList());
                item.put("subStepData", Collections.emptyMap());
                previousApproved = (currentPhaseIndex > i);
            }
            result.add(item);
        }

        return ResponseEntity.ok(result);
    }

    @PostMapping("/phases/{phaseId}/sub-steps/{subStepId}/complete")
    @Transactional
    public ResponseEntity<Map<String, Object>> completeSubStep(
            @PathVariable UUID caseId,
            @PathVariable String phaseId,
            @PathVariable String subStepId,
            @RequestBody(required = false) Map<String, Object> req,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {

        tpCaseInitializationService.initializeTpCaseIfEmpty(caseId, actorId);
        TpPhaseGateEntity gate = phaseGateRepository.findByAuditCaseIdAndPhaseId(caseId, phaseId)
                .orElseGet(() -> TpPhaseGateEntity.builder()
                        .auditCaseId(caseId)
                        .phaseId(phaseId)
                        .status("DRAFT")
                        .subStepsCompleted(objectMapper.valueToTree(Collections.emptyList()))
                        .subStepData(objectMapper.valueToTree(Collections.emptyMap()))
                        .build());

        Set<String> completed = new LinkedHashSet<>();
        if (gate.getSubStepsCompleted() != null && gate.getSubStepsCompleted().isArray()) {
            for (JsonNode n : gate.getSubStepsCompleted()) {
                completed.add(n.asText());
            }
        }

        boolean markDone = req == null || !Boolean.FALSE.equals(req.get("completed"));
        if (markDone) {
            completed.add(subStepId);
        } else {
            completed.remove(subStepId);
        }
        gate.setSubStepsCompleted(objectMapper.valueToTree(completed));

        if (req != null && req.containsKey("data")) {
            gate.setSubStepData(objectMapper.valueToTree(req.get("data")));
        }

        phaseGateRepository.save(gate);

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("phaseId", phaseId);
        res.put("subStepId", subStepId);
        res.put("completedSubSteps", completed);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/phases/{phaseId}/submit")
    @Transactional
    public ResponseEntity<Map<String, Object>> submitPhaseForReview(
            @PathVariable UUID caseId,
            @PathVariable String phaseId,
            @RequestBody(required = false) Map<String, Object> req,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {

        tpCaseInitializationService.initializeTpCaseIfEmpty(caseId, actorId);
        TpPhaseGateEntity gate = phaseGateRepository.findByAuditCaseIdAndPhaseId(caseId, phaseId)
                .orElseThrow(() -> new IllegalArgumentException("Phase gate not found: " + phaseId));

        gate.setStatus("SUBMITTED_FOR_REVIEW");
        gate.setSubmittedAt(OffsetDateTime.now());
        gate.setSubmittedBy(actorId);

        String authority = req != null && req.get("authority") != null ? req.get("authority").toString() : "TEAM_LEADER";
        gate.setReviewerRole(authority);

        phaseGateRepository.save(gate);

        // Update Case status to ensure Team Leader accesses it immediately
        ApAuditCaseEntity c = caseRepository.findById(caseId).orElse(null);
        if (c != null) {
            String newStatus;
            if ("DETAILED_RISK_ASSESSMENT".equalsIgnoreCase(phaseId)) {
                newStatus = "RISK_ASSESSMENT_SUBMITTED_TL";
            } else if ("AUDIT_PLANNING".equalsIgnoreCase(phaseId)) {
                newStatus = "AUDIT_PLAN_SUBMITTED_TL";
            } else if ("FIELD_WORK".equalsIgnoreCase(phaseId)) {
                newStatus = "FIELD_WORK_SUBMITTED_TL";
            } else if ("ANALYSIS".equalsIgnoreCase(phaseId)) {
                newStatus = "ANALYSIS_SUBMITTED_TL";
            } else if ("REPORT".equalsIgnoreCase(phaseId)) {
                newStatus = "REPORT_SUBMITTED_FOR_TL_REVIEW";
            } else if ("ASSESSMENT".equalsIgnoreCase(phaseId)) {
                newStatus = "ASSESSMENT_SUBMITTED_TL";
            } else if ("NOTICE".equalsIgnoreCase(phaseId)) {
                newStatus = "NOTICE_SUBMITTED_TL";
            } else {
                newStatus = "SUBMITTED_FOR_TL_REVIEW";
            }
            c.setStatus(newStatus);
            caseRepository.save(c);

            if (c.getAssignedTeamLeaderId() != null && !c.getAssignedTeamLeaderId().isBlank()) {
                notificationService.sendNotification(c.getAssignedTeamLeaderId(), "TP_PHASE_SUBMITTED",
                        "TP Phase Dossier Submitted for Review",
                        "Auditor submitted " + phaseId + " for case " + c.getCaseNumber() + " for TL supervisory review and committee endorsement.",
                        caseId, null, "TP_PHASE_GATE", gate.getId());
            }
        }

        logAction(caseId, "PHASE_SUBMITTED_FOR_REVIEW", phaseId, actorId, "AUDITOR",
                "Phase " + phaseId + " submitted for review to " + authority,
                req, "DRAFT", "SUBMITTED_FOR_REVIEW", null, null);

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("phaseId", phaseId);
        res.put("status", "SUBMITTED_FOR_REVIEW");
        res.put("authority", authority);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/phases/{phaseId}/review")
    @Transactional
    public ResponseEntity<Map<String, Object>> reviewPhaseGate(
            @PathVariable UUID caseId,
            @PathVariable String phaseId,
            @RequestBody Map<String, Object> req,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId,
            @RequestHeader(value = "X-Actor-Role", defaultValue = "TEAM_LEADER") String actorRole) {

        tpCaseInitializationService.initializeTpCaseIfEmpty(caseId, actorId);
        TpPhaseGateEntity gate = phaseGateRepository.findByAuditCaseIdAndPhaseId(caseId, phaseId)
                .orElseThrow(() -> new IllegalArgumentException("Phase gate not found: " + phaseId));

        if ("AUDITOR".equalsIgnoreCase(actorRole)) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Auditors cannot review or endorse phase gates. Statutory separation of duties requires review by Team Leader or Review Committee."));
        }

        ApAuditCaseEntity c = caseRepository.findById(caseId).orElse(null);
        if (c != null && actorId != null && !"SYSTEM".equalsIgnoreCase(actorId) && actorId.equals(c.getAssignedAuditorId())) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Assigned Auditor cannot review their own audit phase. Statutory separation of duties requires review by Team Leader or Review Committee."));
        }

        String decision = req.get("decision") != null ? req.get("decision").toString().toUpperCase() : "APPROVED";
        String comments = req.get("comments") != null ? req.get("comments").toString() : "";

        gate.setReviewedAt(OffsetDateTime.now());
        gate.setReviewedBy(actorId);
        gate.setReviewerRole(actorRole);
        gate.setReviewDecision(decision);
        gate.setReviewComments(comments);

        boolean isEndorseToCommittee = "ENDORSE_TO_COMMITTEE".equalsIgnoreCase(decision)
                || "SUBMIT_TO_COMMITTEE".equalsIgnoreCase(decision)
                || "ENDORSED".equalsIgnoreCase(decision);

        if (isEndorseToCommittee) {
            // Team Leader routes case to Review Committee
            gate.setStatus("SUBMITTED_FOR_COMMITTEE");
            gate.setReviewerRole("COMMITTEE");

            if (c != null) {
                if ("DETAILED_RISK_ASSESSMENT".equalsIgnoreCase(phaseId)) {
                    c.setStatus("SUBMITTED_FOR_COMMITTEE");
                } else if ("AUDIT_PLANNING".equalsIgnoreCase(phaseId)) {
                    c.setStatus("AUDIT_PLAN_SUBMITTED_COMMITTEE");
                } else if ("REPORT".equalsIgnoreCase(phaseId)) {
                    c.setStatus("REPORT_SUBMITTED_COMMITTEE");
                } else {
                    c.setStatus("SUBMITTED_FOR_COMMITTEE");
                }
                caseRepository.save(c);

                if (c.getCommitteeId() != null) {
                    notificationService.sendNotification(String.valueOf(c.getCommitteeId()), "TP_CASE_FOR_COMMITTEE",
                            "TP Case Endorsed by TL for Committee Approval",
                            "Team Leader endorsed " + phaseId + " for case " + c.getCaseNumber() + ". Ready for committee review.",
                            caseId, null, "TP_PHASE_GATE", gate.getId());
                }
            }

            if ("AUDIT_PLANNING".equalsIgnoreCase(phaseId)) {
                auditPlanRepository.findByAuditCaseId(caseId).ifPresent(p -> {
                    p.setStatus("SUBMITTED_FOR_REVIEW");
                    p.setUpdatedBy(actorId);
                    auditPlanRepository.save(p);
                });
            }
        } else if ("APPROVED".equalsIgnoreCase(decision)) {
            gate.setStatus("APPROVED");
            if (c != null) {
                c.setStatus("IN_PROGRESS");
                List<String> phasesOrdered = List.of(
                        "DETAILED_RISK_ASSESSMENT",
                        "AUDIT_PLANNING",
                        "FIELD_WORK",
                        "ANALYSIS",
                        "REPORT",
                        "ASSESSMENT",
                        "NOTICE",
                        "CLOSURE"
                );
                int idx = phasesOrdered.indexOf(phaseId);
                if (idx >= 0 && idx < phasesOrdered.size() - 1) {
                    c.setTpCurrentPhase(phasesOrdered.get(idx + 1));
                }
                caseRepository.save(c);
            }

            if ("AUDIT_PLANNING".equalsIgnoreCase(phaseId)) {
                auditPlanRepository.findByAuditCaseId(caseId).ifPresent(p -> {
                    p.setStatus("APPROVED");
                    p.setUpdatedBy(actorId);
                    auditPlanRepository.save(p);
                });
            } else if ("FIELD_WORK".equalsIgnoreCase(phaseId)) {
                fieldWorkDataRepository.findByAuditCaseId(caseId).ifPresent(fw -> {
                    fw.setStatus("TL_SIGNED_OFF");
                    fw.setUpdatedBy(actorId);
                    fieldWorkDataRepository.save(fw);
                });
            } else if ("ANALYSIS".equalsIgnoreCase(phaseId)) {
                analysisDataRepository.findByAuditCaseId(caseId).ifPresent(an -> {
                    an.setStatus("TL_CONFIRMED");
                    an.setUpdatedBy(actorId);
                    analysisDataRepository.save(an);
                });
            } else if ("REPORT".equalsIgnoreCase(phaseId)) {
                List<TpAuditReportEntity> reports = auditReportRepository.findByAuditCaseIdOrderByVersionDesc(caseId);
                if (!reports.isEmpty()) {
                    TpAuditReportEntity rep = reports.get(0);
                    rep.setStatus("FULLY_APPROVED");
                    auditReportRepository.save(rep);
                }
            }
        } else {
            gate.setStatus("REVISION_REQUESTED");
            if (c != null) {
                c.setStatus("REVISION_REQUESTED");
                caseRepository.save(c);
                if (c.getAssignedAuditorId() != null) {
                    notificationService.sendNotification(c.getAssignedAuditorId(), "TP_REVISION_REQUESTED",
                            "TP Phase Revision Requested",
                            "Team Leader requested revisions on " + phaseId + ": " + comments,
                            caseId, null, "TP_PHASE_GATE", gate.getId());
                }
            }
        }

        phaseGateRepository.save(gate);

        logAction(caseId, "PHASE_REVIEW_" + decision, phaseId, actorId, actorRole,
                "Phase " + phaseId + " reviewed: " + decision + ". Comments: " + comments,
                req, "SUBMITTED_FOR_REVIEW", gate.getStatus(), null, null);

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("phaseId", phaseId);
        res.put("status", gate.getStatus());
        res.put("decision", decision);
        res.put("comments", comments);
        return ResponseEntity.ok(res);
    }

    // ── Phase Transition & Lifecycle Management ──────────────────────────────

    @PostMapping("/start-execution")
    @Transactional
    public ResponseEntity<Map<String, Object>> startExecution(
            @PathVariable UUID caseId,
            @RequestBody(required = false) Map<String, Object> req,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {
        ApAuditCaseEntity c = tpCaseInitializationService.initializeTpCaseIfEmpty(caseId, actorId);
        c.setStatus("IN_PROGRESS");
        c.setTpCurrentPhase("DETAILED_RISK_ASSESSMENT");
        c.setStartedAt(OffsetDateTime.now());
        caseRepository.save(c);

        logAction(caseId, "TP_EXECUTION_STARTED", "RISK_ASSESSMENT", actorId, "AUDITOR",
                "Transfer Pricing Audit Execution started. Phase 1: Detailed Risk Assessment initiated.",
                req, "ASSIGNED", "IN_PROGRESS", null, null);

        Map<String, Object> res = new HashMap<>();
        res.put("status", "IN_PROGRESS");
        res.put("currentPhase", "DETAILED_RISK_ASSESSMENT");
        return ResponseEntity.ok(res);
    }

    @PostMapping("/advance-phase")
    @Transactional
    public ResponseEntity<Map<String, Object>> advancePhase(
            @PathVariable UUID caseId,
            @RequestBody(required = false) Map<String, Object> req,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {
        ApAuditCaseEntity c = caseRepository.findById(caseId)
                .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseId));
        String targetPhase = req != null ? (String) req.get("targetPhase") : null;
        if (targetPhase != null && !targetPhase.isBlank()) {
            c.setTpCurrentPhase(targetPhase);
            caseRepository.save(c);
        }

        logAction(caseId, "TP_PHASE_ADVANCED", targetPhase != null ? targetPhase : "EXECUTION", actorId, "AUDITOR",
                "Transfer Pricing Audit advanced to phase: " + targetPhase,
                req, null, targetPhase, null, null);

        Map<String, Object> res = new HashMap<>();
        res.put("status", c.getStatus());
        res.put("currentPhase", c.getTpCurrentPhase());
        return ResponseEntity.ok(res);
    }

    // ── Phase 1: Risk Assessment & Working Hypothesis ────────────────────────

    @PostMapping("/risk-assessment")
    public ResponseEntity<Void> submitRiskAssessment(
            @PathVariable UUID caseId,
            @RequestBody TpRiskAssessmentRequest req,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {
        riskAssessmentUseCase.saveRiskAssessment(caseId, req.getRiskLevel(), req.getRiskDetails(), req.getComments(), actorId);
        logAction(caseId, "RISK_ASSESSMENT_SAVED", "RISK_ASSESSMENT", actorId, "AUDITOR",
                "Saved risk assessment: Level " + req.getRiskLevel(), req, null, "RISK_ASSESSED", null, null);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/risk-assessment/submit-tl")
    @Transactional
    public ResponseEntity<Map<String, Object>> submitRiskAssessmentToTl(
            @PathVariable UUID caseId,
            @RequestBody(required = false) Map<String, Object> req,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {
        ApAuditCaseEntity c = caseRepository.findById(caseId)
                .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseId));
        c.setStatus("RISK_ASSESSMENT_SUBMITTED_TL");
        caseRepository.save(c);

        if (c.getAssignedTeamLeaderId() != null) {
            notificationService.sendNotification(c.getAssignedTeamLeaderId(), "TP_RISK_SUBMITTED",
                    "TP Detailed Risk Assessment Submitted",
                    "Auditor submitted Detailed Risk Assessment for case " + c.getCaseNumber() + " for TL review.",
                    caseId, null, "TP_RISK_ASSESSMENT", null);
        }

        logAction(caseId, "RISK_ASSESSMENT_SUBMITTED_TL", "RISK_ASSESSMENT", actorId, "AUDITOR",
                "Submitted Detailed Risk Assessment to Team Leader", req, "IN_PROGRESS", "RISK_ASSESSMENT_SUBMITTED_TL", null, null);

        Map<String, Object> res = new HashMap<>();
        res.put("status", "RISK_ASSESSMENT_SUBMITTED_TL");
        return ResponseEntity.ok(res);
    }

    @PostMapping("/risk-assessment/submit-committee")
    @Transactional
    public ResponseEntity<Map<String, Object>> submitRiskAssessmentToCommittee(
            @PathVariable UUID caseId,
            @RequestBody(required = false) Map<String, Object> req,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId,
            @RequestHeader(value = "X-Actor-Role", defaultValue = "TEAM_LEADER") String actorRole) {
        if ("AUDITOR".equalsIgnoreCase(actorRole)) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Auditors cannot endorse Risk Assessment to Committee. Endorsement must be performed by Team Leader."));
        }
        ApAuditCaseEntity c = caseRepository.findById(caseId)
                .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseId));
        if (c.getAssignedAuditorId() != null && c.getAssignedAuditorId().equals(actorId) && !"SYSTEM".equalsIgnoreCase(actorId)) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Assigned Auditor cannot endorse Risk Assessment to Committee. Endorsement must be performed by Team Leader."));
        }
        c.setStatus("SUBMITTED_FOR_COMMITTEE");
        c.setTpCurrentPhase("WORKING_HYPOTHESIS");
        caseRepository.save(c);

        if (c.getCommitteeId() != null) {
            notificationService.sendNotification(String.valueOf(c.getCommitteeId()), "TP_CASE_FOR_COMMITTEE",
                    "TP Case Submitted for Planning Review",
                    "Team Leader endorsed risk assessment for case " + c.getCaseNumber() + ". Ready for Working Hypothesis and Planning Meeting.",
                    caseId, null, "TP_RISK_ASSESSMENT", null);
        }

        logAction(caseId, "RISK_ASSESSMENT_SUBMITTED_COMMITTEE", "RISK_ASSESSMENT", actorId, "TEAM_LEADER",
                "Team Leader endorsed and submitted TP case to Review Committee / Process Owner", req, "RISK_ASSESSMENT_SUBMITTED_TL", "SUBMITTED_FOR_COMMITTEE", null, null);

        Map<String, Object> res = new HashMap<>();
        res.put("status", "SUBMITTED_FOR_COMMITTEE");
        return ResponseEntity.ok(res);
    }

    @PostMapping("/accept-intake")
    @Transactional
    public ResponseEntity<Map<String, Object>> acceptCaseIntake(
            @PathVariable UUID caseId,
            @RequestBody(required = false) Map<String, Object> req,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {
        ApAuditCaseEntity c = caseRepository.findById(caseId)
                .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseId));
        c.setStatus("TP_INTAKE_ACCEPTED");
        c.setTpCurrentPhase("HYPOTHESIS_DEVELOPMENT");
        caseRepository.save(c);

        logAction(caseId, "TP_CASE_ACCEPTED_BY_COMMITTEE", "INTAKE", actorId, "TP_PROCESS_OWNER_COMMITTEE",
                "TP Process Owner / Committee acknowledged and accepted case into TP workflow", req, "ASSIGNED_TO_COMMITTEE", "TP_INTAKE_ACCEPTED", null, null);

        Map<String, Object> res = new HashMap<>();
        res.put("status", "TP_INTAKE_ACCEPTED");
        res.put("tpCurrentPhase", "HYPOTHESIS_DEVELOPMENT");
        return ResponseEntity.ok(res);
    }

    @PostMapping("/working-hypothesis")
    public ResponseEntity<Map<String, Object>> submitWorkingHypothesis(
            @PathVariable UUID caseId,
            @RequestBody TpWorkingHypothesisRequest req,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {
        workingHypothesisUseCase.saveWorkingHypothesis(caseId,
                req.getHypothesisDescription(), req.getIdentifiedIssue(),
                req.getEconomicRationale(), req.getRevenueAtRisk(), req.getCalculationDetails(), actorId);

        ApAuditCaseEntity c = caseRepository.findById(caseId).orElse(null);
        if (c != null && ("ASSIGNED_TO_COMMITTEE".equalsIgnoreCase(c.getStatus()) || "TP_INTAKE_ACCEPTED".equalsIgnoreCase(c.getStatus()))) {
            c.setTpCurrentPhase("PLANNING_MEETING");
            caseRepository.save(c);
        }

        logAction(caseId, "HYPOTHESIS_SAVED", "HYPOTHESIS", actorId, "TP_PROCESS_OWNER_COMMITTEE",
                "TP Process Owner / Committee developed initial working hypothesis & quantified revenue at risk: ETB " + req.getRevenueAtRisk(),
                req, null, "DEVELOPED_BY_PO", null, null);

        Map<String, Object> res = new HashMap<>();
        res.put("status", "DEVELOPED_BY_PO");
        res.put("tpCurrentPhase", c != null ? c.getTpCurrentPhase() : "PLANNING_MEETING");
        return ResponseEntity.ok(res);
    }

    // ── Phase 2: BUC-TA-013 (1.14 Plan Transfer Pricing Audit) ────────────────

    @PostMapping("/audit-plan")
    public ResponseEntity<Void> submitAuditPlan(
            @PathVariable UUID caseId,
            @RequestBody TpAuditPlanRequest req,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {
        auditPlanUseCase.saveAuditPlan(caseId, req.getObjective(), req.getScope(),
                req.getMaterialityDetails(), req.getIndustryResearch(),
                req.getSamplingMethod(), req.getPlannedProcedures(), actorId);
        logAction(caseId, "AUDIT_PLAN_SUBMITTED", "PLANNING", actorId, "AUDITOR",
                "Drafted and submitted TP Audit Plan", req, "DRAFT", "SUBMITTED_FOR_REVIEW", null, null);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/audit-plan/submit-tl")
    @Transactional
    public ResponseEntity<Map<String, Object>> submitAuditPlanToTl(
            @PathVariable UUID caseId,
            @RequestBody(required = false) Map<String, Object> req,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {
        TpAuditPlanEntity plan = auditPlanRepository.findByAuditCaseId(caseId)
                .orElseThrow(() -> new IllegalArgumentException("Audit plan not found for case: " + caseId));
        plan.setStatus("UNDER_TL_REVIEW");
        plan.setUpdatedBy(actorId);
        auditPlanRepository.save(plan);

        ApAuditCaseEntity c = caseRepository.findById(caseId).orElse(null);
        if (c != null) {
            c.setStatus("AUDIT_PLAN_SUBMITTED_TL");
            caseRepository.save(c);
            if (c.getAssignedTeamLeaderId() != null) {
                notificationService.sendNotification(c.getAssignedTeamLeaderId(), "TP_PLAN_SUBMITTED_TL",
                        "TP Audit Plan Submitted for Review",
                        "Auditor submitted Audit Plan (Form FR-04.5.1) for case " + c.getCaseNumber() + " for TL review.",
                        caseId, null, "TP_AUDIT_PLAN", plan.getId());
            }
        }

        logAction(caseId, "AUDIT_PLAN_SUBMITTED_TL", "PLANNING", actorId, "AUDITOR",
                "Submitted TP Audit Plan to Team Leader for review", req, "DRAFT", "UNDER_TL_REVIEW", plan.getId(), "TP_PLAN");

        Map<String, Object> res = new HashMap<>();
        res.put("status", "UNDER_TL_REVIEW");
        res.put("planId", plan.getId());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/audit-plan/tl-endorse")
    @Transactional
    public ResponseEntity<Map<String, Object>> tlEndorseAuditPlan(
            @PathVariable UUID caseId,
            @RequestBody(required = false) Map<String, Object> req,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId,
            @RequestHeader(value = "X-Actor-Role", defaultValue = "TEAM_LEADER") String actorRole) {
        if ("AUDITOR".equalsIgnoreCase(actorRole)) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Auditors cannot endorse Audit Plans to Review Committee. Endorsement must be performed by Team Leader."));
        }
        ApAuditCaseEntity c = caseRepository.findById(caseId).orElse(null);
        if (c != null && c.getAssignedAuditorId() != null && c.getAssignedAuditorId().equals(actorId) && !"SYSTEM".equalsIgnoreCase(actorId)) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Assigned Auditor cannot endorse their own Audit Plan."));
        }
        TpAuditPlanEntity plan = auditPlanRepository.findByAuditCaseId(caseId)
                .orElseThrow(() -> new IllegalArgumentException("Audit plan not found for case: " + caseId));
        plan.setStatus("SUBMITTED_FOR_REVIEW");
        plan.setUpdatedBy(actorId);
        auditPlanRepository.save(plan);
        if (c != null) {
            c.setStatus("AUDIT_PLAN_SUBMITTED_COMMITTEE");
            caseRepository.save(c);
            if (c.getCommitteeId() != null) {
                notificationService.sendNotification(String.valueOf(c.getCommitteeId()), "TP_PLAN_FOR_COMMITTEE",
                        "TP Audit Plan for Committee Approval",
                        "Team Leader endorsed TP Audit Plan for case " + c.getCaseNumber() + ". Ready for committee approval.",
                        caseId, null, "TP_AUDIT_PLAN", plan.getId());
            }
        }

        logAction(caseId, "AUDIT_PLAN_TL_ENDORSED", "PLANNING", actorId, "TEAM_LEADER",
                "Team Leader endorsed Audit Plan and submitted to Review Committee / Process Owner", req, "UNDER_TL_REVIEW", "SUBMITTED_FOR_REVIEW", plan.getId(), "TP_PLAN");

        Map<String, Object> res = new HashMap<>();
        res.put("status", "SUBMITTED_FOR_REVIEW");
        res.put("planId", plan.getId());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/audit-plan/request-revision")
    @Transactional
    public ResponseEntity<Map<String, Object>> requestPlanRevision(
            @PathVariable UUID caseId,
            @RequestBody Map<String, Object> req,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {
        String reason = (String) req.getOrDefault("reason", "Revisions requested to audit scope or materiality.");
        TpAuditPlanEntity plan = auditPlanRepository.findByAuditCaseId(caseId)
                .orElseThrow(() -> new IllegalArgumentException("Audit plan not found for case: " + caseId));
        plan.setStatus("REVISION_REQUESTED");
        plan.setUpdatedBy(actorId);
        auditPlanRepository.save(plan);

        ApAuditCaseEntity c = caseRepository.findById(caseId).orElse(null);
        if (c != null && c.getAssignedAuditorId() != null) {
            notificationService.sendNotification(c.getAssignedAuditorId(), "TP_PLAN_REVISION",
                    "TP Plan Revision Requested",
                    "Process Owner requested plan revisions: " + reason,
                    caseId, null, "TP_AUDIT_PLAN", plan.getId());
        }

        logAction(caseId, "PLAN_REVISION_REQUESTED", "PLANNING", actorId, "PROCESS_OWNER",
                "Requested TP plan revisions: " + reason, req, "SUBMITTED_FOR_REVIEW", "REVISION_REQUESTED", plan.getId(), "TP_PLAN");

        Map<String, Object> res = new HashMap<>();
        res.put("status", "REVISION_REQUESTED");
        res.put("planId", plan.getId());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/audit-plan/additional-research")
    @Transactional
    public ResponseEntity<Map<String, Object>> requestAdditionalResearch(
            @PathVariable UUID caseId,
            @RequestBody Map<String, Object> req,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {
        String instructions = (String) req.getOrDefault("instructions", "Perform further industry benchmarking.");
        TpAuditPlanEntity plan = auditPlanRepository.findByAuditCaseId(caseId)
                .orElseThrow(() -> new IllegalArgumentException("Audit plan not found for case: " + caseId));
        plan.setStatus("ADDITIONAL_RESEARCH_REQUIRED");
        plan.setUpdatedBy(actorId);
        auditPlanRepository.save(plan);

        logAction(caseId, "ADDITIONAL_RESEARCH_REQUIRED", "PLANNING", actorId, "PROCESS_OWNER",
                "AF2: Process Owner requested additional industry research: " + instructions, req, "SUBMITTED_FOR_REVIEW", "ADDITIONAL_RESEARCH_REQUIRED", plan.getId(), "TP_PLAN");

        Map<String, Object> res = new HashMap<>();
        res.put("status", "ADDITIONAL_RESEARCH_REQUIRED");
        res.put("planId", plan.getId());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/audit-plan/new-risk")
    @Transactional
    public ResponseEntity<Map<String, Object>> logNewRiskDuringPlanning(
            @PathVariable UUID caseId,
            @RequestBody Map<String, Object> req,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {
        String riskDesc = (String) req.getOrDefault("riskDescription", "New risk factor discovered during planning.");
        logAction(caseId, "NEW_RISK_IDENTIFIED", "PLANNING", actorId, "AUDITOR",
                "AF3: New TP risk identified during planning phase: " + riskDesc, req, null, null, null, null);
        Map<String, Object> res = new HashMap<>();
        res.put("status", "RECORDED");
        return ResponseEntity.ok(res);
    }

    @PostMapping("/audit-plan/approve")
    @Transactional
    public ResponseEntity<Map<String, Object>> approveAuditPlan(
            @PathVariable UUID caseId,
            @RequestBody(required = false) Map<String, Object> req,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId,
            @RequestHeader(value = "X-Actor-Role", defaultValue = "COMMITTEE") String actorRole) {
        if ("AUDITOR".equalsIgnoreCase(actorRole)) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Auditors cannot approve Audit Plans. Review Committee / Process Owner approval is required."));
        }
        ApAuditCaseEntity c = caseRepository.findById(caseId).orElse(null);
        if (c != null && c.getAssignedAuditorId() != null && c.getAssignedAuditorId().equals(actorId) && !"SYSTEM".equalsIgnoreCase(actorId)) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Assigned Auditor cannot approve their own Audit Plan."));
        }
        TpAuditPlanEntity plan = auditPlanRepository.findByAuditCaseId(caseId)
                .orElseThrow(() -> new IllegalArgumentException("Audit plan not found for case: " + caseId));
        plan.setStatus("APPROVED");
        plan.setApprovedBy(actorId);
        plan.setApprovedAt(OffsetDateTime.now());
        auditPlanRepository.save(plan);

        phaseGateRepository.findByAuditCaseIdAndPhaseId(caseId, "AUDIT_PLANNING").ifPresent(gate -> {
            gate.setStatus("APPROVED");
            gate.setReviewedAt(OffsetDateTime.now());
            gate.setReviewedBy(actorId);
            gate.setReviewDecision("APPROVED");
            phaseGateRepository.save(gate);
        });

        if (c != null) {
            c.setStatus("IN_PROGRESS");
            c.setTpCurrentPhase("FIELD_WORK");
            caseRepository.save(c);
            if (c.getAssignedAuditorId() != null) {
                notificationService.sendNotification(c.getAssignedAuditorId(), "TP_PLAN_APPROVED",
                        "TP Audit Plan Approved",
                        "Audit plan approved by Review Committee / Process Owner. Fieldwork may commence.",
                        caseId, null, "TP_AUDIT_PLAN", plan.getId());
            }
        }

        logAction(caseId, "PLAN_APPROVED", "PLANNING", actorId, "PROCESS_OWNER",
                "Process Owner approved TP Audit Plan and Program", req, "SUBMITTED_FOR_REVIEW", "APPROVED", plan.getId(), "TP_PLAN");

        Map<String, Object> res = new HashMap<>();
        res.put("status", "APPROVED");
        res.put("planId", plan.getId());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/planning-meeting")
    public ResponseEntity<Void> recordPlanningMeeting(
            @PathVariable UUID caseId,
            @RequestBody TpPlanningMeetingRequest req,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {
        planningMeetingUseCase.recordMeetingDetails(caseId, req.getScheduledDate(), req.getParticipants(), req.getAgenda(), actorId);
        logAction(caseId, "PLANNING_MEETING_RECORDED", "PLANNING", actorId, "TP_PROCESS_OWNER_COMMITTEE",
                "Recorded TP planning meeting details and agenda", req, null, null, null, null);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/planning-meeting/decision")
    @Transactional
    public ResponseEntity<Map<String, Object>> recordMeetingDecision(
            @PathVariable UUID caseId,
            @RequestBody TpMeetingDecisionRequest req,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {

        StringBuilder notesBuilder = new StringBuilder();
        if (req.getDiscussionNotes() != null && !req.getDiscussionNotes().isBlank()) {
            notesBuilder.append(req.getDiscussionNotes());
        }
        if (req.getMeetingMinutes() != null && !req.getMeetingMinutes().isBlank()) {
            if (notesBuilder.length() > 0) notesBuilder.append("\n\nMinutes: ");
            notesBuilder.append(req.getMeetingMinutes());
        }
        if (req.getMandateDirectives() != null && !req.getMandateDirectives().isBlank()) {
            if (notesBuilder.length() > 0) notesBuilder.append("\n\nPlanning Mandate Directives: ");
            notesBuilder.append(req.getMandateDirectives());
        }
        if (req.getTargetFiscalYears() != null && !req.getTargetFiscalYears().isBlank()) {
            if (notesBuilder.length() > 0) notesBuilder.append("\nTarget Fiscal Years: ");
            notesBuilder.append(req.getTargetFiscalYears());
        }
        if (req.getStatutoryDeadlineDays() != null) {
            if (notesBuilder.length() > 0) notesBuilder.append("\nPlanning Deadline: ");
            notesBuilder.append(req.getStatutoryDeadlineDays()).append(" statutory working days");
        }

        String notes = notesBuilder.toString();
        planningMeetingUseCase.recordMeetingDecision(caseId, req.getDecision(), notes, actorId);

        ApAuditCaseEntity c = caseRepository.findById(caseId).orElse(null);
        if (c != null && ("CONTINUE".equalsIgnoreCase(req.getDecision()) || "APPROVED".equalsIgnoreCase(req.getDecision()) || "PROCEED".equalsIgnoreCase(req.getDecision()))) {
            c.setStatus("PLANNING_TRIGGERED");
            c.setTpCurrentPhase("PLANNING");
            if (req.getAssignedTeamLeaderId() != null && !req.getAssignedTeamLeaderId().isBlank()) {
                c.setAssignedTeamLeaderId(req.getAssignedTeamLeaderId());
            }
            caseRepository.save(c);

            TpPhaseGateEntity riskGate = phaseGateRepository.findByAuditCaseIdAndPhaseId(caseId, "DETAILED_RISK_ASSESSMENT").orElse(null);
            if (riskGate != null) {
                riskGate.setStatus("APPROVED");
                riskGate.setReviewDecision("APPROVED");
                riskGate.setReviewerRole("COMMITTEE");
                phaseGateRepository.save(riskGate);
            }

            if (c.getAssignedTeamLeaderId() != null) {
                notificationService.sendNotification(c.getAssignedTeamLeaderId(), "TP_PLANNING_TRIGGERED",
                        "TP Audit Planning Mandate Issued",
                        "TP Process Owner / Committee decided to CONTINUE with case " + c.getCaseNumber() + ". Planning & Programming has been triggered.",
                        caseId, null, "TP_AUDIT_PLAN", null);
            }
            if (c.getAssignedAuditorId() != null) {
                notificationService.sendNotification(c.getAssignedAuditorId(), "TP_PLANNING_TRIGGERED",
                        "TP Audit Planning Mandate Issued",
                        "TP Process Owner / Committee decided to CONTINUE with case " + c.getCaseNumber() + ". You may now prepare the Audit Plan & Program.",
                        caseId, null, "TP_AUDIT_PLAN", null);
            }
        }

        logAction(caseId, "PLANNING_MEETING_DECISION", "PLANNING", actorId, "TP_PROCESS_OWNER_COMMITTEE",
                "TP Process Owner / Review Committee recorded planning meeting decision: " + req.getDecision(),
                req, null, req.getDecision(), null, null);

        Map<String, Object> res = new HashMap<>();
        res.put("decision", req.getDecision());
        res.put("status", c != null ? c.getStatus() : req.getDecision());
        res.put("tpCurrentPhase", c != null ? c.getTpCurrentPhase() : "PLANNING");
        return ResponseEntity.ok(res);
    }

    @PostMapping("/entry-conference")
    @Transactional
    public ResponseEntity<Map<String, Object>> recordEntryConference(
            @PathVariable UUID caseId,
            @RequestBody Map<String, Object> req,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {
        String venue = (String) req.getOrDefault("venue", "MoR Tax Office");

        logAction(caseId, "ENTRY_CONFERENCE_CONDUCTED", "PLANNING", actorId, "AUDITOR",
                "Held TP Entry Conference with taxpayer at " + venue, req, null, "ENTRY_CONFERENCE_COMPLETED", null, null);

        Map<String, Object> res = new HashMap<>();
        res.put("status", "RECORDED");
        res.put("message", "Entry conference recorded successfully.");
        return ResponseEntity.ok(res);
    }

    // ── Phase 3: BUC-TA-014 (1.15 Conduct TP Audit Fieldwork) ─────────────────

    @PostMapping("/field-work")
    @Transactional
    public ResponseEntity<Map<String, Object>> saveFieldWorkProgress(
            @PathVariable UUID caseId,
            @RequestBody(required = false) Map<String, Object> req,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {
        ApAuditCaseEntity c = caseRepository.findById(caseId)
                .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseId));
        c.setTpCurrentPhase("ANALYSIS");
        caseRepository.save(c);

        logAction(caseId, "FIELD_WORK_PROGRESS_SAVED", "FIELD_WORK", actorId, "AUDITOR",
                "Fieldwork documentation and working papers recorded. Ready for Transfer Pricing Analysis.",
                req, "FIELD_WORK", "ANALYSIS", null, null);

        Map<String, Object> res = new HashMap<>();
        res.put("status", "SAVED");
        res.put("currentPhase", "ANALYSIS");
        return ResponseEntity.ok(res);
    }

    @PostMapping("/field-work/contract-verify")
    @Transactional
    public ResponseEntity<Map<String, Object>> verifyContract(
            @PathVariable UUID caseId,
            @RequestBody Map<String, Object> req,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {
        String title = req != null && req.get("title") != null ? req.get("title").toString() : "Intercompany Contract";
        logAction(caseId, "CONTRACT_VERIFIED", "FIELD_WORK", actorId, "AUDITOR",
                "Verified intercompany agreement and terms: " + title, req, null, "VERIFIED", null, null);
        Map<String, Object> res = new HashMap<>();
        res.put("status", "VERIFIED");
        return ResponseEntity.ok(res);
    }

    @PostMapping("/field-work/accounting")
    public ResponseEntity<Void> saveAccountingAssessment(@PathVariable UUID caseId, @RequestBody TpFieldWorkRequest req, @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {
        fieldWorkUseCase.saveAccountingAssessment(caseId, req.getAccountingMethods(), req.getData(), actorId);
        logAction(caseId, "ACCOUNTING_SYSTEMS_ASSESSED", "FIELD_WORK", actorId, "AUDITOR",
                "Assessed taxpayer accounting and cost allocation systems", req, null, null, null, null);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/field-work/transaction-trails")
    public ResponseEntity<Void> saveTransactionTrails(@PathVariable UUID caseId, @RequestBody TpFieldWorkRequest req, @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {
        fieldWorkUseCase.saveTransactionTrails(caseId, req.getData(), actorId);
        logAction(caseId, "TRANSACTION_TRAILS_DOCUMENTED", "FIELD_WORK", actorId, "AUDITOR",
                "Documented end-to-end controlled transaction trails", req, null, null, null, null);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/field-work/sample-selections")
    public ResponseEntity<Void> saveSampleSelections(@PathVariable UUID caseId, @RequestBody TpFieldWorkRequest req, @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {
        fieldWorkUseCase.saveSampleSelections(caseId, req.getData(), actorId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/field-work/information-requests")
    public ResponseEntity<Void> saveInformationRequests(@PathVariable UUID caseId, @RequestBody TpFieldWorkRequest req, @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {
        fieldWorkUseCase.saveInformationRequest(caseId, req.getData(), actorId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/field-work/idr/create")
    @Transactional
    public ResponseEntity<TpInformationRequestLogEntity> createInformationRequest(
            @PathVariable UUID caseId,
            @RequestBody Map<String, Object> req,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {

        ApAuditCaseEntity caseEntity = caseRepository.findById(caseId)
                .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseId));

        String reqType = (String) req.getOrDefault("requestType", "DOCUMENT");
        String subject = (String) req.getOrDefault("subject", "Transfer Pricing Supporting Documentation Request");
        String description = (String) req.getOrDefault("description", "Provide contracts, invoices, and allocation keys.");
        int days = req.get("deadlineDays") != null ? ((Number) req.get("deadlineDays")).intValue() : 14;

        String ref = "IDR-TP-" + caseEntity.getCaseNumber().replaceAll("[^a-zA-Z0-9]", "") + "-" + (System.currentTimeMillis() % 10000);

        TpInformationRequestLogEntity idr = TpInformationRequestLogEntity.builder()
                .auditCase(caseEntity)
                .requestReference(ref)
                .requestType(reqType)
                .subject(subject)
                .description(description)
                .deadlineDate(LocalDate.now().plusDays(days))
                .status("ISSUED")
                .submittedBy(actorId)
                .submittedAt(OffsetDateTime.now())
                .approvedBy(actorId)
                .approvedAt(OffsetDateTime.now())
                .approvalComments("Issued by TP audit team")
                .build();

        TpInformationRequestLogEntity saved = idrRepository.save(idr);
        logAction(caseId, "IDR_ISSUED", "FIELD_WORK", actorId, "AUDITOR",
                "Issued Information & Document Request: " + ref + " (" + subject + ")", saved, "DRAFT", "ISSUED", saved.getId(), "TP_IDR");

        return ResponseEntity.ok(saved);
    }

    @PostMapping("/field-work/idr/{idrId}/respond")
    @Transactional
    public ResponseEntity<TpInformationRequestLogEntity> respondToIdr(
            @PathVariable UUID caseId,
            @PathVariable UUID idrId,
            @RequestBody Map<String, Object> req,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {

        TpInformationRequestLogEntity idr = idrRepository.findById(idrId)
                .orElseThrow(() -> new IllegalArgumentException("IDR not found: " + idrId));

        String responseText = (String) req.getOrDefault("taxpayerResponse", "Documents submitted via portal.");
        boolean evidenceUploaded = Boolean.TRUE.equals(req.get("evidenceUploaded"));

        idr.setTaxpayerResponse(responseText);
        idr.setEvidenceUploaded(evidenceUploaded);
        idr.setResponseReceivedAt(OffsetDateTime.now());
        idr.setStatus("RESPONSE_RECEIVED");
        TpInformationRequestLogEntity saved = idrRepository.save(idr);

        logAction(caseId, "IDR_RESPONSE_RECEIVED", "FIELD_WORK", actorId, "TAXPAYER",
                "Taxpayer responded to " + idr.getRequestReference(), req, "ISSUED", "RESPONSE_RECEIVED", idr.getId(), "TP_IDR");

        return ResponseEntity.ok(saved);
    }

    @PostMapping("/field-work/site-visit")
    @Transactional
    public ResponseEntity<Map<String, Object>> recordSiteVisit(
            @PathVariable UUID caseId,
            @RequestBody Map<String, Object> req,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {

        String location = (String) req.getOrDefault("location", "Taxpayer Manufacturing Plant & Warehouse");
        String observations = (String) req.getOrDefault("observations", "Inspected inventory tracking and functional substance.");

        logAction(caseId, "SITE_VISIT_CONDUCTED", "FIELD_WORK", actorId, "AUDITOR",
                "Conducted TP site visit at " + location + ". Notes: " + observations, req, null, null, null, null);

        Map<String, Object> res = new HashMap<>();
        res.put("status", "RECORDED");
        res.put("message", "Site visit documented.");
        return ResponseEntity.ok(res);
    }

    @PostMapping("/field-work/no-risk")
    @Transactional
    public ResponseEntity<Map<String, Object>> recordFieldWorkNoRisk(
            @PathVariable UUID caseId,
            @RequestBody(required = false) Map<String, Object> req,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {

        TpFieldWorkDataEntity fw = fieldWorkDataRepository.findByAuditCaseId(caseId)
                .orElseThrow(() -> new IllegalArgumentException("Fieldwork record not found for case: " + caseId));
        fw.setStatus("NO_RISK_FOUND");
        fieldWorkDataRepository.save(fw);

        logAction(caseId, "FIELDWORK_NO_RISK_FOUND", "FIELD_WORK", actorId, "AUDITOR",
                "AF1: Fieldwork confirmed controlled transactions adhere to arm's length. Recommended closure without adjustment.", req, "IN_PROGRESS", "NO_RISK_FOUND", fw.getId(), "TP_FIELD_WORK");

        Map<String, Object> res = new HashMap<>();
        res.put("status", "NO_RISK_FOUND");
        return ResponseEntity.ok(res);
    }

    @PostMapping("/field-work/fact-statement")
    @Transactional
    public ResponseEntity<Void> saveFactStatement(@PathVariable UUID caseId, @RequestBody TpFieldWorkRequest req, @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {
        int v = req.getFactStatementVersion() != null ? req.getFactStatementVersion() : 1;
        String s = req.getFactStatementStatus() != null ? req.getFactStatementStatus() : (req.getStatus() != null ? req.getStatus() : "DRAFT");
        fieldWorkUseCase.saveFactStatement(caseId, req.getData(), v, s, actorId);

        if ("TL_SIGNED_OFF".equalsIgnoreCase(s) || "APPROVED".equalsIgnoreCase(s)) {
            phaseGateRepository.findByAuditCaseIdAndPhaseId(caseId, "FIELD_WORK").ifPresent(gate -> {
                gate.setStatus("APPROVED");
                gate.setReviewedAt(OffsetDateTime.now());
                gate.setReviewedBy(actorId);
                gate.setReviewDecision("APPROVED");
                gate.setReviewerRole("TEAM_LEADER");
                phaseGateRepository.save(gate);
            });
            ApAuditCaseEntity c = caseRepository.findById(caseId).orElse(null);
            if (c != null) {
                c.setTpCurrentPhase("ANALYSIS");
                caseRepository.save(c);
            }
        }

        logAction(caseId, "FACT_STATEMENT_SAVED", "FIELD_WORK", actorId, "AUDITOR",
                "Saved Fact Statement (v" + v + ", status: " + s + ")", req, null, s, null, null);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/field-work/structured-discussions")
    public ResponseEntity<Void> saveStructuredDiscussions(@PathVariable UUID caseId, @RequestBody TpFieldWorkRequest req, @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {
        fieldWorkUseCase.saveStructuredDiscussion(caseId, req.getData(), actorId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/field-work/complete")
    @Transactional
    public ResponseEntity<Void> completeFieldWork(@PathVariable UUID caseId, @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {
        fieldWorkUseCase.transitionToAnalysis(caseId, actorId);

        phaseGateRepository.findByAuditCaseIdAndPhaseId(caseId, "FIELD_WORK").ifPresent(gate -> {
            gate.setStatus("APPROVED");
            gate.setReviewedAt(OffsetDateTime.now());
            gate.setReviewedBy(actorId);
            gate.setReviewDecision("APPROVED");
            phaseGateRepository.save(gate);
        });

        ApAuditCaseEntity c = caseRepository.findById(caseId).orElse(null);
        if (c != null) {
            c.setTpCurrentPhase("ANALYSIS");
            c.setStatus("IN_PROGRESS");
            caseRepository.save(c);
        }

        logAction(caseId, "FIELD_WORK_COMPLETED", "FIELD_WORK", actorId, "AUDITOR",
                "Field work concluded; transitioned to Transfer Pricing Analysis", null, "IN_PROGRESS", "ANALYSIS_IN_PROGRESS", null, null);
        return ResponseEntity.ok().build();
    }

    // ── Phase 4: BUC-TA-015 (1.16 Perform TP Analysis) ────────────────────────

    @PostMapping("/analysis/ratios")
    public ResponseEntity<Void> saveRatioAnalysis(@PathVariable UUID caseId, @RequestBody TpAnalysisRequest req, @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {
        analysisUseCase.saveRatioAnalysis(caseId, req.getData(), actorId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/analysis/benchmarks")
    public ResponseEntity<Void> saveBenchmarks(@PathVariable UUID caseId, @RequestBody TpAnalysisRequest req, @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {
        analysisUseCase.saveBenchmarkComparisons(caseId, req.getData(), actorId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/analysis/cross-border")
    public ResponseEntity<Void> saveCrossBorder(@PathVariable UUID caseId, @RequestBody TpAnalysisRequest req, @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {
        analysisUseCase.saveCrossBorderAssessments(caseId, req.getData(), actorId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/analysis/customs-valuation")
    public ResponseEntity<Void> saveCustomsValuation(@PathVariable UUID caseId, @RequestBody TpAnalysisRequest req, @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {
        analysisUseCase.saveCustomsValuationMatches(caseId, req.getData(), actorId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/analysis/method-selection")
    public ResponseEntity<Void> saveTpMethodSelection(@PathVariable UUID caseId, @RequestBody TpAnalysisRequest req, @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {
        analysisUseCase.saveTpMethodSelection(caseId, req.getSelectedTpMethod(), req.getData(), actorId);
        logAction(caseId, "TP_METHOD_SELECTED", "ANALYSIS", actorId, "AUDITOR",
                "Selected Transfer Pricing Method: " + req.getSelectedTpMethod(), req, null, req.getSelectedTpMethod(), null, null);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/analysis/arms-length")
    public ResponseEntity<Void> saveArmsLength(@PathVariable UUID caseId, @RequestBody TpAnalysisRequest req, @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {
        analysisUseCase.saveArmsLengthAnalysis(caseId, req.getData(),
                req.getArmsLengthRangeMin(), req.getArmsLengthRangeMax(),
                req.getTaxpayerActualResult(), req.getVarianceAmount(), req.getVariancePercentage(), actorId);
        logAction(caseId, "ARMS_LENGTH_ANALYZED", "ANALYSIS", actorId, "AUDITOR",
                "Computed arm's length range: [" + req.getArmsLengthRangeMin() + " to " + req.getArmsLengthRangeMax() + "], Taxpayer: " + req.getTaxpayerActualResult(), req, null, null, null, null);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/analysis/recalculate")
    @Transactional
    public ResponseEntity<TpAnalysisDataEntity> recalculateIqr(
            @PathVariable UUID caseId,
            @RequestBody Map<String, Object> req,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {

        TpAnalysisDataEntity analysis = analysisDataRepository.findByAuditCaseId(caseId)
                .orElseThrow(() -> new IllegalArgumentException("Analysis record not found for case: " + caseId));

        if (req.get("selectedTpMethod") != null) {
            analysis.setSelectedTpMethod((String) req.get("selectedTpMethod"));
        }
        if (req.get("armsLengthRangeMin") != null) {
            analysis.setArmsLengthRangeMin(new BigDecimal(req.get("armsLengthRangeMin").toString()));
        }
        if (req.get("armsLengthRangeMax") != null) {
            analysis.setArmsLengthRangeMax(new BigDecimal(req.get("armsLengthRangeMax").toString()));
        }
        if (req.get("taxpayerActualResult") != null) {
            analysis.setTaxpayerActualResult(new BigDecimal(req.get("taxpayerActualResult").toString()));
        }
        if (req.get("varianceAmount") != null) {
            analysis.setVarianceAmount(new BigDecimal(req.get("varianceAmount").toString()));
        }
        if (req.get("variancePercentage") != null) {
            analysis.setVariancePercentage(new BigDecimal(req.get("variancePercentage").toString()));
        }
        analysis.setUpdatedBy(actorId);
        TpAnalysisDataEntity saved = analysisDataRepository.save(analysis);

        logAction(caseId, "IQR_BENCHMARK_RECALCULATED", "ANALYSIS", actorId, "AUDITOR",
                "Recalculated Arm's Length IQR and Adjustment: ETB " + saved.getVarianceAmount(), req, null, "RECALCULATED", saved.getId(), "TP_ANALYSIS");

        return ResponseEntity.ok(saved);
    }

    @PostMapping("/analysis/arms-length-confirmed")
    @Transactional
    public ResponseEntity<Map<String, Object>> confirmArmsLengthCompliance(
            @PathVariable UUID caseId,
            @RequestBody(required = false) Map<String, Object> req,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {

        TpAnalysisDataEntity analysis = analysisDataRepository.findByAuditCaseId(caseId)
                .orElseThrow(() -> new IllegalArgumentException("Analysis record not found for case: " + caseId));

        analysis.setVarianceAmount(BigDecimal.ZERO);
        analysis.setVariancePercentage(BigDecimal.ZERO);
        analysis.setStatus("ARM_LENGTH_COMPLIANT");
        analysisDataRepository.save(analysis);

        phaseGateRepository.findByAuditCaseIdAndPhaseId(caseId, "ANALYSIS").ifPresent(gate -> {
            gate.setStatus("APPROVED");
            gate.setReviewedAt(OffsetDateTime.now());
            gate.setReviewedBy(actorId);
            gate.setReviewDecision("APPROVED");
            phaseGateRepository.save(gate);
        });

        ApAuditCaseEntity c = caseRepository.findById(caseId).orElse(null);
        if (c != null) {
            c.setTpCurrentPhase("REPORT");
            caseRepository.save(c);
        }

        logAction(caseId, "ARMS_LENGTH_CONFIRMED", "ANALYSIS", actorId, "AUDITOR",
                "AF3: Taxpayer's transfer prices confirmed at arm's length within IQR. No adjustment recommended.", req, null, "ARM_LENGTH_COMPLIANT", analysis.getId(), "TP_ANALYSIS");

        Map<String, Object> res = new HashMap<>();
        res.put("status", "ARM_LENGTH_COMPLIANT");
        return ResponseEntity.ok(res);
    }

    @PostMapping("/analysis/complete")
    @Transactional
    public ResponseEntity<Void> completeAnalysis(@PathVariable UUID caseId, @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {
        analysisUseCase.transitionToReport(caseId, actorId);

        phaseGateRepository.findByAuditCaseIdAndPhaseId(caseId, "ANALYSIS").ifPresent(gate -> {
            gate.setStatus("APPROVED");
            gate.setReviewedAt(OffsetDateTime.now());
            gate.setReviewedBy(actorId);
            gate.setReviewDecision("APPROVED");
            phaseGateRepository.save(gate);
        });

        ApAuditCaseEntity c = caseRepository.findById(caseId).orElse(null);
        if (c != null) {
            c.setTpCurrentPhase("REPORT");
            c.setStatus("IN_PROGRESS");
            caseRepository.save(c);
        }

        logAction(caseId, "ANALYSIS_COMPLETED", "ANALYSIS", actorId, "AUDITOR",
                "Economic analysis concluded; transitioned to TP Audit Report phase", null, "ANALYSIS_IN_PROGRESS", "REPORT_IN_PROGRESS", null, null);
        return ResponseEntity.ok().build();
    }

    // ── Phase 5: BUC-TA-016 (1.17 Prepare and Review TP Audit Report) ──────────

    @PostMapping("/report/draft")
    public ResponseEntity<UUID> draftReport(@PathVariable UUID caseId, @RequestBody TpAuditReportDraftRequest req, @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {
        UUID reportId = auditReportUseCase.draftReport(caseId,
                req.getExecutiveSummary(), req.getAuditBackground(), req.getScope(),
                req.getProceduresPerformed(), req.getFindingsAndConclusions(),
                req.getIssuesAnalyzed(), req.getComplianceAssessment(), actorId);
        logAction(caseId, "REPORT_DRAFTED", "REPORT", actorId, "AUDITOR",
                "Drafted initial TP Audit Report", req, "NONE", "DRAFT", reportId, "TP_REPORT");
        return ResponseEntity.ok(reportId);
    }

    private UUID resolveReportId(UUID caseId, String reportIdStr, String actorId) {
        try {
            UUID id = UUID.fromString(reportIdStr);
            if (auditReportRepository.existsById(id)) {
                return id;
            }
        } catch (Exception ignored) {}

        List<TpAuditReportEntity> existing = auditReportRepository.findByAuditCaseIdOrderByVersionDesc(caseId);
        if (!existing.isEmpty()) {
            return existing.get(0).getId();
        }

        JsonNode issuesNode = null;
        try {
            issuesNode = objectMapper.readTree("[\"Cross-border profit shifting to low-tax jurisdictions\"]");
        } catch (Exception ignored) {}

        return auditReportUseCase.draftReport(caseId,
                "Transfer Pricing Audit Report - Comprehensive Assessment",
                "Audit initiated pursuant to Proclamation 979/2016",
                "FY 2020 - FY 2024",
                "FAR analysis, IQR benchmarking, intercompany transaction review",
                "Disallowance of non-arm's length management fees and royalties",
                issuesNode,
                "Non-compliant with Arm's Length Principle",
                actorId);
    }

    @PostMapping("/report/{reportId}/submit-for-team-leader-review")
    public ResponseEntity<Void> submitForTLReview(@PathVariable UUID caseId, @PathVariable String reportId, @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {
        UUID actualReportId = resolveReportId(caseId, reportId, actorId);
        auditReportUseCase.submitForTeamLeaderReview(actualReportId, actorId);
        logAction(caseId, "SUBMITTED_FOR_TL_REVIEW", "REPORT", actorId, "AUDITOR",
                "Submitted TP Audit Report for Team Leader QA review", null, "DRAFT", "UNDER_TL_REVIEW", actualReportId, "TP_REPORT");
        return ResponseEntity.ok().build();
    }

    @PostMapping("/report/{reportId}/team-leader-review")
    public ResponseEntity<Void> teamLeaderReview(
            @PathVariable UUID caseId,
            @PathVariable String reportId,
            @RequestBody TpReportReviewRequest req,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId,
            @RequestHeader(value = "X-Actor-Role", defaultValue = "TEAM_LEADER") String actorRole) {
        if ("AUDITOR".equalsIgnoreCase(actorRole)) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).build();
        }
        ApAuditCaseEntity c = caseRepository.findById(caseId).orElse(null);
        if (c != null && c.getAssignedAuditorId() != null && c.getAssignedAuditorId().equals(actorId) && !"SYSTEM".equalsIgnoreCase(actorId)) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).build();
        }
        UUID actualReportId = resolveReportId(caseId, reportId, actorId);
        auditReportUseCase.recordTeamLeaderReview(actualReportId, req.getDecision(), req.getComments(), actorId);
        logAction(caseId, "TL_REVIEW_DECISION", "REPORT", actorId, "TEAM_LEADER",
                "Team Leader recorded review decision: " + req.getDecision(), req, "UNDER_TL_REVIEW", req.getDecision(), actualReportId, "TP_REPORT");
        return ResponseEntity.ok().build();
    }

    @PostMapping("/report/{reportId}/submit-for-process-owner-review")
    public ResponseEntity<Void> submitForPOReview(@PathVariable UUID caseId, @PathVariable String reportId, @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {
        UUID actualReportId = resolveReportId(caseId, reportId, actorId);
        auditReportUseCase.submitForProcessOwnerReview(actualReportId, actorId);
        logAction(caseId, "SUBMITTED_FOR_PO_REVIEW", "REPORT", actorId, "TEAM_LEADER",
                "Submitted TP Audit Report for Process Owner approval", null, "TL_APPROVED", "UNDER_PO_REVIEW", actualReportId, "TP_REPORT");
        return ResponseEntity.ok().build();
    }

    @PostMapping("/report/{reportId}/process-owner-review")
    public ResponseEntity<Void> processOwnerReview(@PathVariable UUID caseId, @PathVariable String reportId, @RequestBody TpReportReviewRequest req, @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {
        UUID actualReportId = resolveReportId(caseId, reportId, actorId);
        auditReportUseCase.recordProcessOwnerReview(actualReportId, req.getDecision(), req.getComments(), actorId);
        logAction(caseId, "PO_REVIEW_DECISION", "REPORT", actorId, "PROCESS_OWNER",
                "Process Owner recorded review decision: " + req.getDecision(), req, "UNDER_PO_REVIEW", req.getDecision(), actualReportId, "TP_REPORT");
        return ResponseEntity.ok().build();
    }

    @PostMapping("/report/{reportId}/submit-for-final-approval")
    public ResponseEntity<Void> submitForFinalApproval(@PathVariable UUID caseId, @PathVariable String reportId, @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {
        UUID actualReportId = resolveReportId(caseId, reportId, actorId);
        auditReportUseCase.submitForFinalApproval(actualReportId, actorId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/report/{reportId}/final-approval")
    public ResponseEntity<Void> finalApproval(@PathVariable UUID caseId, @PathVariable String reportId, @RequestBody TpReportReviewRequest req, @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {
        UUID actualReportId = resolveReportId(caseId, reportId, actorId);
        auditReportUseCase.recordFinalApproval(actualReportId, req.getDecision(), req.getComments(), actorId);
        logAction(caseId, "FINAL_APPROVAL_DECISION", "REPORT", actorId, "PROCESS_OWNER",
                "Final approval granted: " + req.getDecision(), req, null, req.getDecision(), actualReportId, "TP_REPORT");
        return ResponseEntity.ok().build();
    }

    @PostMapping("/report/{reportId}/committee-approval")
    @Transactional
    public ResponseEntity<Map<String, Object>> committeeApproveReport(
            @PathVariable UUID caseId,
            @PathVariable String reportId,
            @RequestBody(required = false) Map<String, Object> req,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId,
            @RequestHeader(value = "X-Actor-Role", defaultValue = "COMMITTEE") String actorRole) {
        if ("AUDITOR".equalsIgnoreCase(actorRole)) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Auditors cannot approve TP Audit Reports. Committee approval is required."));
        }
        ApAuditCaseEntity c = caseRepository.findById(caseId).orElse(null);
        if (c != null && c.getAssignedAuditorId() != null && c.getAssignedAuditorId().equals(actorId) && !"SYSTEM".equalsIgnoreCase(actorId)) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Assigned Auditor cannot approve their own TP Audit Report."));
        }
        UUID actualReportId = resolveReportId(caseId, reportId, actorId);
        TpAuditReportEntity report = auditReportRepository.findById(actualReportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found: " + actualReportId));
        report.setStatus("FULLY_APPROVED");
        com.fasterxml.jackson.databind.node.ObjectNode reviewNode = objectMapper.createObjectNode();
        reviewNode.put("reviewerId", actorId);
        reviewNode.put("role", "REVIEW_COMMITTEE");
        reviewNode.put("decision", "APPROVED");
        reviewNode.put("comments", req != null && req.get("comments") != null ? req.get("comments").toString() : "Review Committee resolution adopted.");
        reviewNode.put("reviewedAt", OffsetDateTime.now().toString());
        report.setAuthorizedOfficialReview(reviewNode);
        auditReportRepository.save(report);

        if (c != null) {
            c.setStatus("REPORT_APPROVED");
            c.setTpCurrentPhase("ASSESSMENT");
            caseRepository.save(c);
            if (c.getAssignedAuditorId() != null) {
                notificationService.sendNotification(c.getAssignedAuditorId(), "TP_REPORT_APPROVED",
                        "TP Audit Report Approved by Committee",
                        "The Review Committee formally adopted the resolution approving the TP Audit Report for case " + c.getCaseNumber() + ". Assessment & Computation is now unlocked.",
                        caseId, null, "TP_AUDIT_REPORT", report.getId());
            }
        }

        phaseGateRepository.findByAuditCaseIdAndPhaseId(caseId, "REPORT").ifPresent(gate -> {
            gate.setStatus("APPROVED");
            gate.setReviewedAt(OffsetDateTime.now());
            gate.setReviewedBy(actorId);
            gate.setReviewDecision("APPROVED");
            gate.setReviewerRole("COMMITTEE");
            phaseGateRepository.save(gate);
        });

        logAction(caseId, "COMMITTEE_REPORT_APPROVED", "REPORT", actorId, "COMMITTEE",
                "Review Committee adopted resolution approving TP Audit Report", req, "SUBMITTED_FOR_REVIEW", "FULLY_APPROVED", report.getId(), "TP_REPORT");

        Map<String, Object> res = new HashMap<>();
        res.put("status", "FULLY_APPROVED");
        res.put("reportId", report.getId());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/exit-conference/record")
    @Transactional
    public ResponseEntity<TpExitConferenceEntity> recordExitConference(
            @PathVariable UUID caseId,
            @RequestBody Map<String, Object> req,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {

        ApAuditCaseEntity caseEntity = caseRepository.findById(caseId)
                .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseId));

        TpExitConferenceEntity conf = exitConferenceRepository.findByAuditCaseId(caseId)
                .orElseGet(() -> TpExitConferenceEntity.builder()
                        .auditCase(caseEntity)
                        .conferenceReference("EXC-TP-" + caseEntity.getCaseNumber().replaceAll("[^a-zA-Z0-9]", ""))
                        .venue("MoR Tax Office — TP Conference Suite")
                        .createdBy(actorId)
                        .build());

        if (req.get("venue") != null) conf.setVenue((String) req.get("venue"));
        if (req.get("auditorNotes") != null) conf.setAuditorNotes((String) req.get("auditorNotes"));
        if (req.get("taxpayerObservations") != null) conf.setTaxpayerObservations((String) req.get("taxpayerObservations"));
        if (req.get("taxpayerSigned") != null) conf.setTaxpayerSigned(Boolean.TRUE.equals(req.get("taxpayerSigned")));
        conf.setSchedulingStatus("HELD");
        conf.setMeetingHeldAt(OffsetDateTime.now());

        TpExitConferenceEntity saved = exitConferenceRepository.save(conf);

        logAction(caseId, "EXIT_CONFERENCE_HELD", "REPORT", actorId, "AUDITOR",
                "Conducted statutory Exit Conference with taxpayer at MoR Tax Office", req, "SCHEDULED", "HELD", saved.getId(), "TP_EXIT_CONF");

        return ResponseEntity.ok(saved);
    }

    @PostMapping("/report/{reportId}/taxpayer-response")
    public ResponseEntity<Void> taxpayerReportResponse(@PathVariable UUID caseId, @PathVariable UUID reportId, @RequestBody TpTaxpayerReportResponseRequest req, @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {
        auditReportUseCase.recordTaxpayerResponse(reportId, req.getAction(), req.getResponseDetail(), actorId);
        logAction(caseId, "TAXPAYER_REPORT_RESPONSE", "REPORT", actorId, "TAXPAYER",
                "Taxpayer response recorded: " + req.getAction(), req, null, req.getAction(), reportId, "TP_REPORT");
        return ResponseEntity.ok().build();
    }

    @PostMapping("/report/{reportId}/escalate-fraud")
    @Transactional
    public ResponseEntity<Map<String, Object>> escalateFraud(
            @PathVariable UUID caseId,
            @PathVariable UUID reportId,
            @RequestBody Map<String, Object> req,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {

        String fraudReasons = (String) req.getOrDefault("reasons", "Substantial fictitious management fee invoices and bogus transactions detected.");

        ApAuditCaseEntity c = caseRepository.findById(caseId).orElse(null);
        if (c != null) {
            c.setStatus("CRIMINAL_INVESTIGATION_REFERRAL");
            caseRepository.save(c);
        }

        logAction(caseId, "FRAUD_CRIMINAL_REFERRAL", "REPORT", actorId, "AUDITOR",
                "AF5: Indicators of deliberate tax fraud detected. Referred case to Criminal Investigation Division: " + fraudReasons, req, null, "CRIMINAL_INVESTIGATION_REFERRAL", reportId, "TP_REPORT");

        Map<String, Object> res = new HashMap<>();
        res.put("status", "CRIMINAL_INVESTIGATION_REFERRAL");
        res.put("message", "Case referred to Tax Fraud & Criminal Prosecution Department.");
        return ResponseEntity.ok(res);
    }

    // ── Phase 6: BUC-TA-017 (1.18 Issue Audit Notices) ────────────────────────

    @GetMapping("/notices")
    public ResponseEntity<List<TpAuditNoticeEntity>> listNotices(@PathVariable UUID caseId) {
        return ResponseEntity.ok(auditNoticeRepository.findByAuditCaseId(caseId).stream().toList());
    }

    @PostMapping("/notice/generate")
    public ResponseEntity<UUID> generateNotice(@PathVariable UUID caseId, @RequestBody TpNoticeGenerationRequest req, @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {
        UUID noticeId = noticeAndObjectionUseCase.generateNotice(caseId,
                req.getTaxpayerName(), req.getTin(), req.getAuditPeriod(),
                req.getIssuesSummary(), req.getProposedAdjustmentsSummary(),
                req.getAssessedPrincipalTax(), req.getPenalties(), req.getInterest(),
                req.getIssueDate(), req.getResponseDeadline(), req.getDeliveryMethod(), actorId);
        logAction(caseId, "NOTICE_GENERATED", "NOTICE", actorId, "AUDITOR",
                "Drafted TP Audit Notice for ETB " + req.getAssessedPrincipalTax(), req, "DRAFT", "GENERATED", noticeId, "TP_NOTICE");
        return ResponseEntity.ok(noticeId);
    }

    @PostMapping("/notice/{noticeId}/issue")
    public ResponseEntity<Void> issueNotice(@PathVariable UUID caseId, @PathVariable UUID noticeId, @RequestParam String deliveryStatus, @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {
        noticeAndObjectionUseCase.issueNotice(noticeId, deliveryStatus, actorId);
        logAction(caseId, "NOTICE_ISSUED", "NOTICE", actorId, "AUDITOR",
                "Notice issued to taxpayer with delivery status: " + deliveryStatus, null, "DRAFT", "ISSUED", noticeId, "TP_NOTICE");
        return ResponseEntity.ok().build();
    }

    @PostMapping("/notice/{noticeId}/dispatch")
    @Transactional
    public ResponseEntity<TpAuditNoticeEntity> dispatchNotice(
            @PathVariable UUID caseId,
            @PathVariable UUID noticeId,
            @RequestBody Map<String, Object> req,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {

        TpAuditNoticeEntity notice = auditNoticeRepository.findById(noticeId)
                .orElseThrow(() -> new IllegalArgumentException("Notice not found: " + noticeId));

        String channel = (String) req.getOrDefault("deliveryMethod", "PORTAL");
        notice.setDeliveryMethod(channel);
        notice.setDeliveryStatus("DISPATCHED");
        notice.setDeliveryTimestamp(OffsetDateTime.now());
        TpAuditNoticeEntity saved = auditNoticeRepository.save(notice);

        logAction(caseId, "NOTICE_DISPATCHED", "NOTICE", actorId, "AUDITOR",
                "Dispatched TP Notice via " + channel, req, "ISSUED", "DISPATCHED", noticeId, "TP_NOTICE");

        return ResponseEntity.ok(saved);
    }

    @PostMapping("/notice/{noticeId}/delivery-confirm")
    @Transactional
    public ResponseEntity<TpAuditNoticeEntity> confirmNoticeDelivery(
            @PathVariable UUID caseId,
            @PathVariable UUID noticeId,
            @RequestBody(required = false) Map<String, Object> req,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {

        TpAuditNoticeEntity notice = auditNoticeRepository.findById(noticeId)
                .orElseThrow(() -> new IllegalArgumentException("Notice not found: " + noticeId));

        notice.setDeliveryStatus("DELIVERED");
        notice.setDeliveryTimestamp(OffsetDateTime.now());
        TpAuditNoticeEntity saved = auditNoticeRepository.save(notice);

        logAction(caseId, "NOTICE_DELIVERY_CONFIRMED", "NOTICE", actorId, "AUDITOR",
                "Delivery confirmed for TP Notice: " + notice.getNoticeReferenceNumber(), req, "DISPATCHED", "DELIVERED", noticeId, "TP_NOTICE");

        return ResponseEntity.ok(saved);
    }

    @PostMapping("/notice/{noticeId}/returned")
    public ResponseEntity<Void> markReturned(@PathVariable UUID caseId, @PathVariable UUID noticeId, @RequestParam String returnedReason, @RequestParam(required = false) String actionPlanDetails, @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {
        noticeAndObjectionUseCase.markNoticeReturned(noticeId, returnedReason, actionPlanDetails, actorId);
        logAction(caseId, "NOTICE_RETURNED_UNDELIVERED", "NOTICE", actorId, "AUDITOR",
                "AF1: Notice returned undelivered: " + returnedReason, null, "DISPATCHED", "RETURNED", noticeId, "TP_NOTICE");
        return ResponseEntity.ok().build();
    }

    @PostMapping("/notice/{noticeId}/acknowledge")
    public ResponseEntity<Void> acknowledgeNotice(@PathVariable UUID caseId, @PathVariable UUID noticeId, @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {
        noticeAndObjectionUseCase.acknowledgeNotice(noticeId, actorId);
        logAction(caseId, "NOTICE_ACKNOWLEDGED", "NOTICE", actorId, "TAXPAYER",
                "Taxpayer acknowledged receipt of TP Notice", null, "DELIVERED", "ACKNOWLEDGED", noticeId, "TP_NOTICE");
        return ResponseEntity.ok().build();
    }

    // ── Phase 7: BUC-TA-018 (1.19 Issue Assessment Notice & Conclude Audit) ────

    @PostMapping("/assessment/save")
    @Transactional
    public ResponseEntity<Map<String, Object>> saveAssessmentComputation(
            @PathVariable UUID caseId,
            @RequestBody Map<String, Object> req,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {
        ApAuditCaseEntity c = caseRepository.findById(caseId)
                .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseId));
        c.setStatus("ASSESSMENT_COMPUTED");
        c.setTpCurrentPhase("NOTICE");
        caseRepository.save(c);

        phaseGateRepository.findByAuditCaseIdAndPhaseId(caseId, "ASSESSMENT").ifPresent(gate -> {
            gate.setStatus("APPROVED");
            gate.setReviewedAt(OffsetDateTime.now());
            gate.setReviewedBy(actorId);
            gate.setReviewDecision("APPROVED");
            phaseGateRepository.save(gate);
        });

        logAction(caseId, "ASSESSMENT_COMPUTATION_SAVED", "ASSESSMENT", actorId, "AUDITOR",
                "Transfer Pricing Assessment & Penalties computed pursuant to Proclamation 979/2016",
                req, "ASSESSMENT", "ASSESSMENT_COMPUTED", null, null);

        Map<String, Object> res = new HashMap<>();
        res.put("status", "ASSESSMENT_COMPUTED");
        res.put("currentPhase", "NOTICE");
        return ResponseEntity.ok(res);
    }

    @PostMapping("/notice/fraud-referral")
    @Transactional
    public ResponseEntity<Map<String, Object>> noticeFraudReferral(
            @PathVariable UUID caseId,
            @RequestBody(required = false) Map<String, Object> req,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {
        ApAuditCaseEntity c = caseRepository.findById(caseId)
                .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseId));
        c.setStatus("CRIMINAL_INVESTIGATION_REFERRAL");
        caseRepository.save(c);

        logAction(caseId, "FRAUD_CRIMINAL_REFERRAL", "NOTICE", actorId, "AUDITOR",
                "Form FR-04.5-22 Criminal Referral Submitted to MoR Tax Fraud Division",
                req, null, "CRIMINAL_INVESTIGATION_REFERRAL", null, null);

        Map<String, Object> res = new HashMap<>();
        res.put("status", "CRIMINAL_INVESTIGATION_REFERRAL");
        return ResponseEntity.ok(res);
    }

    @PostMapping("/assessment/generate-final-notice")
    @Transactional
    public ResponseEntity<TpAuditNoticeEntity> generateAssessmentNotice(
            @PathVariable UUID caseId,
            @RequestBody Map<String, Object> req,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {

        ApAuditCaseEntity caseEntity = caseRepository.findById(caseId)
                .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseId));

        BigDecimal principal = new BigDecimal(req.getOrDefault("principalTax", "26800000").toString());
        BigDecimal penalty = new BigDecimal(req.getOrDefault("penalties", principal.multiply(new BigDecimal("0.50")).toString()).toString());
        BigDecimal interest = new BigDecimal(req.getOrDefault("interest", "4250000").toString());
        BigDecimal total = principal.add(penalty).add(interest);

        TpAuditNoticeEntity notice = auditNoticeRepository.findByAuditCaseId(caseId)
                .orElseGet(() -> TpAuditNoticeEntity.builder()
                        .auditCase(caseEntity)
                        .noticeReferenceNumber("NOT-TP-" + caseEntity.getCaseNumber().replaceAll("[^a-zA-Z0-9]", ""))
                        .taxpayerName(caseEntity.getTaxpayerName())
                        .tin(caseEntity.getTaxpayerId())
                        .auditPeriod("FY 2020 – FY 2024")
                        .build());

        notice.setAssessedPrincipalTax(principal);
        notice.setPenalties(penalty);
        notice.setInterest(interest);
        notice.setTotalAssessmentAmount(total);
        notice.setIssueDate(LocalDate.now());
        notice.setResponseDeadline(LocalDate.now().plusDays(30)); // Statutory 30-day window
        notice.setStatus("OFFICIAL_ASSESSMENT_ISSUED");
        notice.setDeliveryStatus("DELIVERED");

        TpAuditNoticeEntity saved = auditNoticeRepository.save(notice);

        caseEntity.setStatus("NOTICE_ISSUED");
        caseEntity.setTpCurrentPhase("NOTICE");
        caseRepository.save(caseEntity);

        logAction(caseId, "OFFICIAL_ASSESSMENT_ISSUED", "ASSESSMENT", actorId, "PROCESS_OWNER",
                "Issued Official Transfer Pricing Assessment Notice: Total ETB " + total + " (Principal: " + principal + ", 50% Penalty: " + penalty + ", Interest: " + interest + ")",
                req, "DRAFT", "OFFICIAL_ASSESSMENT_ISSUED", saved.getId(), "TP_ASSESSMENT");

        return ResponseEntity.ok(saved);
    }

    @PostMapping("/notice/authorize")
    @Transactional
    public ResponseEntity<Map<String, Object>> authorizeNotice(
            @PathVariable UUID caseId,
            @RequestBody(required = false) Map<String, Object> req,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId,
            @RequestHeader(value = "X-Actor-Role", defaultValue = "COMMITTEE") String actorRole) {

        ApAuditCaseEntity caseEntity = caseRepository.findById(caseId)
                .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseId));

        String authorizedBy = req != null && req.get("authorizedBy") != null ? req.get("authorizedBy").toString() : actorId;
        String comments = req != null && req.get("comments") != null ? req.get("comments").toString() : "Statutory Notice of Assessment legally signed and authorized for formal dispatch.";

        TpAuditNoticeEntity notice = auditNoticeRepository.findByAuditCaseId(caseId)
                .orElseGet(() -> TpAuditNoticeEntity.builder()
                        .auditCase(caseEntity)
                        .noticeReferenceNumber("NOT-TP-" + caseEntity.getCaseNumber().replaceAll("[^a-zA-Z0-9]", ""))
                        .taxpayerName(caseEntity.getTaxpayerName())
                        .tin(caseEntity.getTaxpayerId())
                        .auditPeriod("FY 2020 – FY 2024")
                        .assessedPrincipalTax(new BigDecimal("26800000"))
                        .penalties(new BigDecimal("13400000"))
                        .interest(new BigDecimal("4250000"))
                        .totalAssessmentAmount(new BigDecimal("44450000"))
                        .issueDate(LocalDate.now())
                        .responseDeadline(LocalDate.now().plusDays(30))
                        .deliveryMethod("PORTAL")
                        .build());

        notice.setStatus("OFFICIAL_ASSESSMENT_ISSUED");
        notice.setDeliveryStatus("DELIVERED");
        auditNoticeRepository.save(notice);

        caseEntity.setStatus("NOTICE_ISSUED");
        caseEntity.setTpCurrentPhase("CLOSURE");
        caseRepository.save(caseEntity);

        phaseGateRepository.findByAuditCaseIdAndPhaseId(caseId, "NOTICE").ifPresent(gate -> {
            gate.setStatus("APPROVED");
            gate.setReviewedAt(OffsetDateTime.now());
            gate.setReviewedBy(authorizedBy);
            gate.setReviewDecision("APPROVED");
            gate.setReviewerRole("COMMITTEE");
            gate.setReviewComments(comments);
            phaseGateRepository.save(gate);
        });

        logAction(caseId, "NOTICE_AUTHORIZED", "NOTICE", actorId, actorRole,
                "Statutory Notice of Assessment legally authorized and issued: " + comments,
                req, "ASSESSMENT_COMPUTED", "NOTICE_ISSUED", notice.getId(), "TP_NOTICE");

        Map<String, Object> res = new HashMap<>();
        res.put("status", "NOTICE_ISSUED");
        res.put("noticeId", notice.getId());
        res.put("message", "Statutory Notice authorized and issued successfully.");
        return ResponseEntity.ok(res);
    }

    @PostMapping("/assessment/taxpayer-accept")
    @Transactional
    public ResponseEntity<Map<String, Object>> taxpayerAcceptAssessment(
            @PathVariable UUID caseId,
            @RequestBody(required = false) Map<String, Object> req,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {

        ApAuditCaseEntity c = caseRepository.findById(caseId).orElse(null);
        if (c != null) {
            c.setStatus("SETTLED_ACCEPTED");
            caseRepository.save(c);
        }

        auditNoticeRepository.findByAuditCaseId(caseId).ifPresent(n -> {
            n.setStatus("ACCEPTED_SETTLED");
            auditNoticeRepository.save(n);
        });

        logAction(caseId, "ASSESSMENT_ACCEPTED_SETTLED", "ASSESSMENT", actorId, "TAXPAYER",
                "AF1: Taxpayer accepted transfer pricing assessment and committed to payment schedule.", req, "OFFICIAL_ASSESSMENT_ISSUED", "SETTLED_ACCEPTED", null, null);

        Map<String, Object> res = new HashMap<>();
        res.put("status", "SETTLED_ACCEPTED");
        return ResponseEntity.ok(res);
    }

    @PostMapping("/assessment/taxpayer-object")
    @Transactional
    public ResponseEntity<TpObjectionEntity> taxpayerObjectToAssessment(
            @PathVariable UUID caseId,
            @RequestBody Map<String, Object> req,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {

        ApAuditCaseEntity caseEntity = caseRepository.findById(caseId)
                .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseId));

        String grounds = (String) req.getOrDefault("grounds", "Challenging comparable company selection and profit split allocation.");
        String legalArgs = (String) req.getOrDefault("legalArguments", "Articles 15 and 28 of Transfer Pricing Directive No. 43/2015.");

        TpAuditNoticeEntity notice = auditNoticeRepository.findByAuditCaseId(caseId).orElse(null);

        TpObjectionEntity objection = TpObjectionEntity.builder()
                .auditCase(caseEntity)
                .noticeId(notice != null ? notice.getId() : null)
                .taxpayerId(caseEntity.getTaxpayerId())
                .objectionDate(OffsetDateTime.now())
                .status("SUBMITTED")
                .factualExplanation(grounds)
                .legalArguments(legalArgs)
                .disputedTpAnalysisSections("Benchmark comparability & functional risk weighting")
                .build();

        TpObjectionEntity saved = objectionRepository.save(objection);

        logAction(caseId, "FORMAL_OBJECTION_FILED", "OBJECTION", actorId, "TAXPAYER",
                "AF2: Taxpayer submitted formal objection against TP assessment within 30 days", req, "OFFICIAL_ASSESSMENT_ISSUED", "OBJECTION_SUBMITTED", saved.getId(), "TP_OBJECTION");

        return ResponseEntity.ok(saved);
    }

    @PostMapping("/objection/record")
    @Transactional
    public ResponseEntity<Map<String, Object>> recordObjectionDetermination(
            @PathVariable UUID caseId,
            @RequestBody(required = false) Map<String, Object> req,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {

        ApAuditCaseEntity caseEntity = caseRepository.findById(caseId)
                .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseId));

        String grounds = req != null && req.get("groundsSummary") != null ? req.get("groundsSummary").toString() : "Taxpayer objection points";
        String rejoinder = req != null && req.get("auditorRejoinder") != null ? req.get("auditorRejoinder").toString() : "Auditor technical defense";
        String decision = req != null && req.get("committeeDecision") != null ? req.get("committeeDecision").toString() : "Upheld assessment";

        TpAuditNoticeEntity notice = auditNoticeRepository.findByAuditCaseId(caseId).orElse(null);

        TpObjectionEntity objection = TpObjectionEntity.builder()
                .auditCase(caseEntity)
                .noticeId(notice != null ? notice.getId() : null)
                .taxpayerId(caseEntity.getTaxpayerId())
                .objectionDate(OffsetDateTime.now())
                .status("DETERMINED")
                .factualExplanation(grounds)
                .legalArguments(rejoinder)
                .disputedTpAnalysisSections(decision)
                .reviewResult(decision)
                .reviewedAt(OffsetDateTime.now())
                .reviewerId(actorId)
                .build();

        objectionRepository.save(objection);

        logAction(caseId, "OBJECTION_DETERMINATION_RECORDED", "OBJECTION", actorId, "AUDITOR",
                "Recorded objection determination: " + decision, req, null, "DETERMINED", objection.getId(), "TP_OBJECTION");

        Map<String, Object> res = new HashMap<>();
        res.put("status", "DETERMINED");
        res.put("objectionId", objection.getId());
        res.put("message", "Objection determination recorded.");
        return ResponseEntity.ok(res);
    }

    @PostMapping("/assessment/default-enforce")
    @Transactional
    public ResponseEntity<Map<String, Object>> triggerDefaultEnforcement(
            @PathVariable UUID caseId,
            @RequestBody(required = false) Map<String, Object> req,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {

        ApAuditCaseEntity c = caseRepository.findById(caseId).orElse(null);
        if (c != null) {
            c.setStatus("ENFORCEMENT_COLLECTION_REFERRED");
            caseRepository.save(c);
        }

        auditNoticeRepository.findByAuditCaseId(caseId).ifPresent(n -> {
            n.setStatus("DEFAULT_ENFORCEMENT");
            auditNoticeRepository.save(n);
        });

        logAction(caseId, "DEFAULT_ENFORCEMENT_INITIATED", "ASSESSMENT", actorId, "SYSTEM",
                "AF3: 30-day statutory deadline expired with no payment or objection. Referred for bank account lien and asset seizure.", req, "OFFICIAL_ASSESSMENT_ISSUED", "ENFORCEMENT_COLLECTION_REFERRED", null, null);

        Map<String, Object> res = new HashMap<>();
        res.put("status", "ENFORCEMENT_COLLECTION_REFERRED");
        res.put("message", "Sent to MoR Tax Recovery & Legal Enforcement Department.");
        return ResponseEntity.ok(res);
    }

    @PostMapping("/assessment/close-and-kpi")
    @Transactional
    public ResponseEntity<Map<String, Object>> closeCaseAndLogKpi(
            @PathVariable UUID caseId,
            @RequestBody(required = false) Map<String, Object> req,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {

        ApAuditCaseEntity c = caseRepository.findById(caseId)
                .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseId));
        c.setStatus("COMPLETED");
        c.setTpCurrentPhase("CLOSURE");
        c.setCompletedAt(OffsetDateTime.now());
        caseRepository.save(c);

        phaseGateRepository.findByAuditCaseIdAndPhaseId(caseId, "CLOSURE").ifPresent(gate -> {
            gate.setStatus("APPROVED");
            gate.setReviewedAt(OffsetDateTime.now());
            gate.setReviewedBy(actorId);
            gate.setReviewDecision("APPROVED");
            phaseGateRepository.save(gate);
        });

        logAction(caseId, "TP_AUDIT_CONCLUDED_ARCHIVED", "CLOSURE", actorId, "PROCESS_OWNER",
                "Concluded Transfer Pricing Audit, archived case files, and updated MoR executive KPI dashboard", req, "IN_PROGRESS", "COMPLETED", null, null);

        Map<String, Object> res = new HashMap<>();
        res.put("status", "COMPLETED");
        res.put("message", "Transfer Pricing Audit concluded successfully.");
        return ResponseEntity.ok(res);
    }

    // ── Phase 8: Objections & Direct Closure ─────────────────────────────────

    @PostMapping("/objections")
    public ResponseEntity<UUID> submitObjection(@PathVariable UUID caseId, @RequestBody TpObjectionRequest req, @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {
        return ResponseEntity.ok(noticeAndObjectionUseCase.submitObjection(caseId,
                req.getNoticeId(), req.getTaxpayerId(), req.getNoticeProvisionReferenced(),
                req.getFactualExplanation(), req.getLegalArguments(), req.getDisputedTpAnalysisSections(), actorId));
    }

    @PostMapping("/objections/{objectionId}/review")
    public ResponseEntity<Void> reviewObjection(@PathVariable UUID caseId, @PathVariable UUID objectionId, @RequestBody TpObjectionReviewRequest req, @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {
        noticeAndObjectionUseCase.reviewObjection(objectionId, req.getReviewResult(), req.getAdjustedAssessmentAmount(), req.getReviewComments(), actorId);
        logAction(caseId, "OBJECTION_REVIEWED", "OBJECTION", actorId, "REVIEW_OFFICER",
                "Reviewed objection: " + req.getReviewResult(), req, "SUBMITTED", req.getReviewResult(), objectionId, "TP_OBJECTION");
        return ResponseEntity.ok().build();
    }

    @PostMapping("/close")
    @Transactional
    public ResponseEntity<Void> closeCase(@PathVariable UUID caseId, @RequestHeader(value = "X-Actor-Id", defaultValue = "SYSTEM") String actorId) {
        noticeAndObjectionUseCase.closeCase(caseId, actorId);

        phaseGateRepository.findByAuditCaseIdAndPhaseId(caseId, "CLOSURE").ifPresent(gate -> {
            gate.setStatus("APPROVED");
            gate.setReviewedAt(OffsetDateTime.now());
            gate.setReviewedBy(actorId);
            gate.setReviewDecision("APPROVED");
            phaseGateRepository.save(gate);
        });

        logAction(caseId, "CASE_CLOSED", "CLOSURE", actorId, "PROCESS_OWNER",
                "Case closed via standard workflow", null, null, "CLOSED", null, null);
        return ResponseEntity.ok().build();
    }

    // ── Internal Helpers ─────────────────────────────────────────────────────

    private void logAction(UUID caseId, String actionType, String actionPhase, String actorId, String actorRole,
                           String summary, Object detail, String beforeStatus, String afterStatus, UUID refId, String refType) {
        try {
            ApAuditCaseEntity caseEntity = caseRepository.findById(caseId).orElse(null);
            if (caseEntity == null) return;

            JsonNode detailNode = null;
            if (detail != null) {
                if (detail instanceof JsonNode) {
                    detailNode = (JsonNode) detail;
                } else {
                    detailNode = objectMapper.valueToTree(detail);
                }
            }

            TpAuditActionHistoryEntity history = TpAuditActionHistoryEntity.builder()
                    .auditCase(caseEntity)
                    .actionType(actionType)
                    .actionPhase(actionPhase)
                    .actorId(actorId != null ? actorId : "SYSTEM")
                    .actorRole(actorRole != null ? actorRole : "AUDITOR")
                    .summary(summary)
                    .detail(detailNode)
                    .beforeStatus(beforeStatus)
                    .afterStatus(afterStatus)
                    .referenceId(refId)
                    .referenceType(refType)
                    .actionTimestamp(OffsetDateTime.now())
                    .build();

            actionHistoryRepository.save(history);
        } catch (Exception e) {
            log.warn("Failed to log audit action history for case {}: {}", caseId, e.getMessage());
        }
    }
}
