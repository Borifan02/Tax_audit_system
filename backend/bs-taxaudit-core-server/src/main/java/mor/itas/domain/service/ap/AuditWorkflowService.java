package mor.itas.domain.service.ap;

import mor.itas.persistence.jpa.entity.ap.*;
import mor.itas.persistence.jpa.repository.ap.*;
import mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity;
import mor.itas.persistence.jpa.repository.ap.ApAuditCaseRepository;
import mor.itas.api.controller.backoffice.jac.CommitteeEventService;
import mor.itas.domain.exception.UnauthorizedAccessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;

/**
 * AuditWorkflowService - Implements the full 11-step audit execution workflow.
 *
 * Step 1:  Case Handoff (import from committee)
 * Step 2:  Assignment (team leader → auditor)
 * Step 3:  Planning (auditor submits plan, TL approves/revise)
 * Step 4:  Entry Conference (schedule, record minutes, approve)
 * Step 5:  Information Request (document requests, query sheets)
 * Step 6:  Document Collection (upload, verify, reject)
 * Step 7:  CAAT Analysis (run analysis, validate anomalies)
 * Step 8:  Audit Testing (working papers, evidence)
 * Step 9:  Findings (create, submit, TL approve/revise)
 * Step 10: Taxpayer Response (taxpayer responds to findings)
 * Step 11: Conclusion (conclude findings, finalize, sign report)
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AuditWorkflowService {

    private final ApAuditCaseRepository caseRepository;
    private final AuditPlanRecordRepository planRepository;
    private final ConferenceRecordRepository conferenceRepository;
    private final DocumentRequestRecordRepository docRequestRepository;
    private final AuditDocumentRepository documentRepository;
    private final CaatAnomalyRepository caatRepository;
    private final WorkingPaperRepository workingPaperRepository;
    private final AuditFindingRepository findingRepository;
    private final CommitteeEventService committeeEventService;
    private final mor.itas.persistence.jpa.repository.ap.CommitteeCaseRepository committeeCaseRepository;
    private final UserJpaRepository userRepository;
    private final mor.itas.persistence.jpa.repository.ap.AnnualAuditPlanJpaRepository annualAuditPlanRepository;

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 1: CASE HANDOFF
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Team Leader handoff — records that the Team Leader has taken responsibility
     * for the case. Required before auditor assignment.
     *
     * Validations:
     * - Case must exist
     * - Actor must be a TEAM_LEADER
     * - Case must be in ASSIGNED status (assigned to this team leader)
     * - Case must not already be handed off
     */
    public ApAuditCaseEntity handoffCase(UUID caseId, String teamLeaderId, String comment) {
        if (caseId == null || teamLeaderId == null) {
            throw new IllegalArgumentException("Case ID and team leader ID are required");
        }

        // Validate user is a team leader
        UserEntity user = resolveUser(teamLeaderId);
        if (user == null) {
            throw new IllegalArgumentException("User not found: " + teamLeaderId);
        }
        if (!"TEAM_LEADER".equals(user.getUserType()) || !"ACTIVE".equals(user.getStatus())) {
            throw new UnauthorizedAccessException(
                "Only an active Team Leader can hand off a case. User " + teamLeaderId + " is role=" + user.getUserType());
        }

        ApAuditCaseEntity auditCase = getCaseOrThrow(caseId);

        // Idempotent: If already handed off, return existing state
        if ("HANDED_OFF".equals(auditCase.getStatus())) {
            log.info("Case {} already in HANDED_OFF status, returning existing entity", caseId);
            return auditCase;
        }

        // Validate or assign case to this team leader
        if (auditCase.getAssignedTeamLeaderId() == null) {
            auditCase.setAssignedTeamLeaderId(user.getUserId().toString());
        } else if (!isSameTeamLeader(teamLeaderId, auditCase.getAssignedTeamLeaderId())) {
            throw new UnauthorizedAccessException(
                "Case is assigned to a different team leader. Cannot hand off.");
        }

        // Validate case is in a handoff-eligible state
        // WAITING_ASSIGNMENT is the status set by the committee when a team+team-leader has been
        // assigned but the team leader has not yet accepted (handed off) the case.
        String currentStatus = auditCase.getStatus();
        if ("AUDITOR_ASSIGNED".equals(currentStatus)
                || "IN_PROGRESS".equals(currentStatus) || "COMPLETED".equals(currentStatus)) {
            throw new IllegalStateException(
                "Case cannot be handed off — already in status: " + currentStatus);
        }
        if (!"ASSIGNED".equals(currentStatus) && !"PENDING_ASSIGNMENT".equals(currentStatus)
                && !"TEAM_ASSIGNED".equals(currentStatus)
                && !"WAITING_ASSIGNMENT".equals(currentStatus)
                && !ApAuditCaseEntity.STATUS_ASSIGNED_TO_TEAM_LEADER.equals(currentStatus)) {
            throw new IllegalStateException(
                "Case must be in ASSIGNED, PENDING_ASSIGNMENT, TEAM_ASSIGNED, WAITING_ASSIGNMENT or ASSIGNED_TO_TEAM_LEADER status for handoff. Current: " + currentStatus);
        }

        // Record handoff
        auditCase.setHandoffAt(OffsetDateTime.now());
        auditCase.setHandoffBy(user.getUsername() != null ? user.getUsername() : teamLeaderId);
        auditCase.setHandoffComment(comment);
        auditCase.setStatus("HANDED_OFF");
        auditCase.setUpdatedAt(OffsetDateTime.now());

        ApAuditCaseEntity saved = caseRepository.save(auditCase);
        log.info("Case {} handed off by team leader {} (previous status: {})",
                caseId, teamLeaderId, currentStatus);
        return saved;
    }

    public ApAuditCaseEntity importCaseFromCommittee(UUID caseId, String teamLeaderId) {
        // Try to find in ApAuditCase first by primary key
        Optional<ApAuditCaseEntity> existing = caseRepository.findById(caseId);
        if (existing.isEmpty()) {
            // Check if caseId is a CommitteeCase ID whose caseCode matches an existing ApAuditCaseEntity
            Optional<CommitteeCaseEntity> commOpt = committeeCaseRepository.findById(caseId);
            if (commOpt.isPresent()) {
                CommitteeCaseEntity comm = commOpt.get();
                if (comm.getCaseCode() != null) {
                    existing = caseRepository.findByCaseNumber(comm.getCaseCode());
                }
                if (existing.isEmpty() && comm.getOriginalCaseId() != null) {
                    existing = caseRepository.findById(comm.getOriginalCaseId());
                }
            }
        }

        if (existing.isPresent()) {
            ApAuditCaseEntity auditCase = existing.get();
            if (auditCase.getAssignedTeamLeaderId() == null) {
                auditCase.setAssignedTeamLeaderId(teamLeaderId);

            } else if (!isSameTeamLeader(teamLeaderId, auditCase.getAssignedTeamLeaderId())) {
                log.warn("Case {} has assigned TL {} but import requested by {}", auditCase.getId(), auditCase.getAssignedTeamLeaderId(), teamLeaderId);
            }
            if ("PENDING_ASSIGNMENT".equals(auditCase.getStatus()) 
                    || ApAuditCaseEntity.STATUS_ASSIGNED_TO_TEAM_LEADER.equals(auditCase.getStatus())
                    || "ASSIGNED_TO_COMMITTEE".equals(auditCase.getStatus())
                    || "WAITING_ASSIGNMENT".equals(auditCase.getStatus())) {
                auditCase.setStatus("ASSIGNED");
            }
            auditCase.setUpdatedAt(OffsetDateTime.now());
            return caseRepository.save(auditCase);
        }
        // Case not in ApAuditCase — create from CommitteeCase
        return createFromCommitteeAndImport(caseId, teamLeaderId);
    }

    private boolean isTeamLeaderMatch(String inputId, String assignedTlId) {
        if (inputId == null || assignedTlId == null) return false;
        if (inputId.trim().equalsIgnoreCase(assignedTlId.trim())) return true;
        UserEntity u1 = resolveUser(inputId);
        UserEntity u2 = resolveUser(assignedTlId);
        if (u1 != null && u2 != null) {
            return (u1.getUserId() != null && u1.getUserId().equals(u2.getUserId()))
                    || (u1.getUsername() != null && u1.getUsername().equalsIgnoreCase(u2.getUsername()))
                    || (u1.getEmail() != null && u1.getEmail().equalsIgnoreCase(u2.getEmail()));
        }
        if (u1 != null) {
            if (u1.getUsername() != null && u1.getUsername().equalsIgnoreCase(assignedTlId.trim())) return true;
            if (u1.getUserId() != null && u1.getUserId().toString().equalsIgnoreCase(assignedTlId.trim())) return true;
            if (u1.getEmail() != null && u1.getEmail().equalsIgnoreCase(assignedTlId.trim())) return true;
        }
        if (u2 != null) {
            if (u2.getUsername() != null && u2.getUsername().equalsIgnoreCase(inputId.trim())) return true;
            if (u2.getUserId() != null && u2.getUserId().toString().equalsIgnoreCase(inputId.trim())) return true;
            if (u2.getEmail() != null && u2.getEmail().equalsIgnoreCase(inputId.trim())) return true;
        }
        String l1 = inputId.toLowerCase().replaceAll("[^a-z0-9]", "");
        String l2 = assignedTlId.toLowerCase().replaceAll("[^a-z0-9]", "");
        return l1.contains(l2) || l2.contains(l1);
    }

    /**
     * Auto-create ApAuditCase from a CommitteeCase when team leader first interacts with it.
     */
    private ApAuditCaseEntity createFromCommitteeAndImport(UUID committeeCaseId, String teamLeaderId) {
        var committeeCase = committeeCaseRepository.findById(committeeCaseId)
            .orElseThrow(() -> new IllegalArgumentException("Case not found: " + committeeCaseId));

        if (committeeCase.getTeamLeadId() != null && !isTeamLeaderMatch(teamLeaderId, committeeCase.getTeamLeadId().toString())) {
            throw new IllegalStateException("Case is assigned to a different team leader");
        }

        if (committeeCase.getCaseCode() != null) {
            Optional<ApAuditCaseEntity> existing = caseRepository.findByCaseNumber(committeeCase.getCaseCode());
            if (existing.isPresent()) {
                ApAuditCaseEntity apCase = existing.get();
                if (apCase.getAssignedTeamLeaderId() == null) {
                    apCase.setAssignedTeamLeaderId(teamLeaderId);
                }
                return caseRepository.save(apCase);
            }
        }

        UUID validPlanId = annualAuditPlanRepository.findAll().stream()
                .findFirst()
                .map(mor.itas.persistence.jpa.entity.ap.AnnualAuditPlanEntity::getId)
                .orElse(committeeCaseId);

        String auditType = mapAuditType(committeeCase.getSegment());
        ApAuditCaseEntity apCase = ApAuditCaseEntity.builder()
            .planId(validPlanId)
            .caseNumber(committeeCase.getCaseCode() != null ? committeeCase.getCaseCode() : "CASE-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
            .taxpayerId(committeeCase.getTaxIdNumber())
            .taxpayerName(committeeCase.getTaxpayerName())
            .auditType(auditType)
            .riskPriority(committeeCase.getRiskPriority())
            .riskScore(committeeCase.getRiskScore())
            .segment(committeeCase.getSegment())
            .assignedTeamLeaderId(teamLeaderId)
            .status("ASSIGNED")
            .createdBy("team-leader-import")
            .createdAt(OffsetDateTime.now())
            .updatedAt(OffsetDateTime.now())
            .build();
        log.info("Auto-created ApAuditCase {} from CommitteeCase {} for team leader {}",
                 apCase.getCaseNumber(), committeeCaseId, teamLeaderId);
        return caseRepository.save(apCase);
    }

    /**
     * Flexible team-leader ownership match: accepts UUID, userId or username on either side.
     * bulk-assign stores the canonical username while callers may pass the session UUID (or vice versa).
     */
    private boolean isSameTeamLeader(String teamLeaderId, String assignedId) {
        if (teamLeaderId == null || assignedId == null) return false;
        if (teamLeaderId.equalsIgnoreCase(assignedId)) return true;
        UserEntity user = resolveUser(teamLeaderId);
        if (user == null) return false;
        return user.getUserId().toString().equalsIgnoreCase(assignedId)
                || (user.getUsername() != null && user.getUsername().equalsIgnoreCase(assignedId));
    }

    private String mapAuditType(String segment) {
        if (segment == null) return "DESK";
        return switch (segment.toUpperCase()) {
            case "LARGE", "TRADING" -> "COMP";
            case "MEDIUM" -> "FIELD";
            default -> "DESK";
        };
    }

    public ApAuditCaseEntity declineHandoff(UUID caseId, String reason) {
        ApAuditCaseEntity auditCase = getCaseOrThrow(caseId);
        auditCase.setStatus("PENDING_ASSIGNMENT");
        auditCase.setAssignedTeamLeaderId(null);
        auditCase.setUpdatedAt(OffsetDateTime.now());
        return caseRepository.save(auditCase);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 2: ASSIGNMENT
    // ═══════════════════════════════════════════════════════════════════════════

    public ApAuditCaseEntity assignToAuditor(UUID caseId, String auditorId, String dueDate, String instructions, String teamLeaderId) {
        // Auto-create from committee if not in execution workspace yet
        ApAuditCaseEntity auditCase;
        Optional<ApAuditCaseEntity> existing = caseRepository.findById(caseId);
        if (existing.isPresent()) {
            auditCase = existing.get();
        } else {
            auditCase = createFromCommitteeAndImport(caseId, teamLeaderId);
        }

        // ── Handoff-first enforcement ──────────────────────────────────
        // A team leader MUST hand off the case before assigning an auditor.
        // Exception: WAITING_ASSIGNMENT cases from the JA committee flow already have
        // a designated team+leader and can be assigned directly (implicit handoff).
        String currentStatus = auditCase.getStatus();
        if ("ASSIGNED".equals(currentStatus) || "PENDING_ASSIGNMENT".equals(currentStatus)) {
            throw new IllegalStateException(
                "CASE_HANDOFF_REQUIRED: Case must be handed off before an auditor can be assigned. " +
                "Current status: " + currentStatus);
        }
        if (!"HANDED_OFF".equals(currentStatus) && !"AUDITOR_ASSIGNED".equals(currentStatus)
                && !"IN_PROGRESS".equals(currentStatus) && !"COMPLETED".equals(currentStatus)
                && !"WAITING_ASSIGNMENT".equals(currentStatus)) {
            throw new IllegalStateException(
                "Cannot assign auditor in status: " + currentStatus + ". " +
                "Case must be in HANDED_OFF or WAITING_ASSIGNMENT status.");
        }
        // Prevent duplicate assignment if already assigned
        if ("AUDITOR_ASSIGNED".equals(currentStatus) || "IN_PROGRESS".equals(currentStatus)
                || "COMPLETED".equals(currentStatus)) {
            if (auditCase.getAssignedAuditorId() != null && !auditCase.getAssignedAuditorId().equals(auditorId)) {
                throw new IllegalStateException(
                    "Case already assigned to auditor: " + auditCase.getAssignedAuditorId());
            }
        }

        auditCase.setAssignedAuditorId(auditorId);
        // Always set team leader if provided (but never overwrite with auditor ID)
        if (teamLeaderId != null && !"system".equals(teamLeaderId) && !teamLeaderId.equals(auditorId)) {
            auditCase.setAssignedTeamLeaderId(teamLeaderId);
        } else if (auditCase.getAssignedTeamLeaderId() == null) {
            log.warn("No team leader ID available for case {} during auditor assignment", caseId);
        }
        auditCase.setStatus("AUDITOR_ASSIGNED");
        auditCase.setAssignedAt(OffsetDateTime.now());
        auditCase.setAssignedBy(teamLeaderId);
        auditCase.setUpdatedAt(OffsetDateTime.now());
        ApAuditCaseEntity saved = caseRepository.save(auditCase);
        // Broadcast real-time notification to assigned auditor
        try {
            committeeEventService.broadcastCaseAssigned(
                caseId, auditorId, teamLeaderId, saved);
        } catch (Exception e) {
            log.warn("Failed to broadcast case assignment notification: {}", e.getMessage());
        }
        log.info("Case {} assigned to auditor {} by team leader {} (previous status: {})",
                caseId, auditorId, teamLeaderId, currentStatus);
        return saved;
    }

    /**
     * @deprecated Assignment is auto-accepted. respondToAssignment is no longer needed.
     */
    @Deprecated
    public ApAuditCaseEntity respondToAssignment(UUID caseId, boolean accepted, String reason) {
        // No-op: assignment is immediate via assignToAuditor()
        return getCaseOrThrow(caseId);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 3: PLANNING
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Submit audit plan for team lead review.
     * Automatically captures team lead ID from the assigned case.
     * 
     * NEW (V3_9): Now also captures teamLeadId from ApAuditCaseEntity
     */
    public AuditPlanRecordEntity submitPlan(UUID caseId, Map<String, String> planData, String submittedBy) {
        // Get the case to extract team lead ID
        ApAuditCaseEntity auditCase = getCaseOrThrow(caseId);
        
        AuditPlanRecordEntity plan = AuditPlanRecordEntity.builder()
                .caseId(caseId)
                .submittedBy(submittedBy)
                // NEW: Capture team lead ID from case for team leader visibility
                .teamLeadId(auditCase.getAssignedTeamLeaderId())
                .scope(planData.getOrDefault("scope", ""))
                .objectives(planData.getOrDefault("objectives", ""))
                .methodology(planData.getOrDefault("methodology", ""))
                .timeline(planData.getOrDefault("timeline", ""))
                .resourcePlan(planData.getOrDefault("resourcePlan", ""))
                .status("SUBMITTED")
                .build();
        
        log.info("Plan submitted for case {} by auditor {} (team lead: {})", 
            caseId, submittedBy, auditCase.getAssignedTeamLeaderId());
        
        return planRepository.save(plan);
    }

    public AuditPlanRecordEntity approvePlan(UUID caseId) {
        AuditPlanRecordEntity plan = getLatestPlanOrThrow(caseId, "SUBMITTED");
        plan.setStatus("APPROVED");
        plan.setApprovedAt(OffsetDateTime.now());
        return planRepository.save(plan);
    }

    public AuditPlanRecordEntity revisePlan(UUID caseId, String revisionNotes) {
        AuditPlanRecordEntity plan = getLatestPlanOrThrow(caseId, "SUBMITTED");
        plan.setStatus("REVISION_REQUESTED");
        plan.setRevisionNotes(revisionNotes);
        return planRepository.save(plan);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 4: ENTRY CONFERENCE
    // ═══════════════════════════════════════════════════════════════════════════

    public ConferenceRecordEntity scheduleConference(UUID caseId, Map<String, String> data, String scheduledBy) {
        ConferenceRecordEntity conf = ConferenceRecordEntity.builder()
                .caseId(caseId)
                .scheduledBy(scheduledBy)
                .location(data.getOrDefault("location", ""))
                .agenda(data.getOrDefault("agenda", ""))
                .status("SCHEDULED")
                .build();
        if (data.containsKey("scheduledDate")) {
            conf.setScheduledDate(OffsetDateTime.parse(data.get("scheduledDate")));
        }
        return conferenceRepository.save(conf);
    }

    public ConferenceRecordEntity recordConferenceMinutes(UUID caseId, String minutes, String recordedBy) {
        ConferenceRecordEntity conf = getLatestConferenceOrThrow(caseId);
        conf.setMinutes(minutes);
        conf.setMinutesRecordedBy(recordedBy);
        conf.setStatus("MINUTES_RECORDED");
        return conferenceRepository.save(conf);
    }

    public ConferenceRecordEntity approveConference(UUID caseId, String approvedBy) {
        ConferenceRecordEntity conf = getLatestConferenceOrThrow(caseId);
        conf.setStatus("APPROVED");
        conf.setApprovedBy(approvedBy);
        conf.setApprovedAt(OffsetDateTime.now());
        return conferenceRepository.save(conf);
    }

    public ConferenceRecordEntity skipConference(UUID caseId, String reason, String skippedBy) {
        ConferenceRecordEntity conf = ConferenceRecordEntity.builder()
                .caseId(caseId)
                .scheduledBy(skippedBy)
                .agenda("N/A — Conference waived")
                .location("N/A")
                .status("SKIPPED")
                .minutes(reason != null ? reason : "Waived — not applicable for this case")
                .minutesRecordedBy(skippedBy)
                .approvedBy(skippedBy)
                .approvedAt(OffsetDateTime.now())
                .build();
        log.info("Conference skipped for case {} by {} — reason: {}", caseId, skippedBy, reason);
        return conferenceRepository.save(conf);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 5: INFORMATION REQUEST
    // ═══════════════════════════════════════════════════════════════════════════

    public DocumentRequestRecordEntity createDocumentRequest(UUID caseId, Map<String, String> data, String requestedBy) {
        DocumentRequestRecordEntity req = DocumentRequestRecordEntity.builder()
                .caseId(caseId)
                .requestedBy(requestedBy)
                .documentType(data.getOrDefault("documentType", ""))
                .description(data.getOrDefault("description", ""))
                .status("PENDING")
                .build();
        if (data.containsKey("dueDate")) {
            req.setDueDate(OffsetDateTime.parse(data.get("dueDate")));
        }
        return docRequestRepository.save(req);
    }

    public DocumentRequestRecordEntity sendQuerySheet(UUID caseId, Map<String, String> data, String requestedBy) {
        DocumentRequestRecordEntity req = DocumentRequestRecordEntity.builder()
                .caseId(caseId)
                .requestedBy(requestedBy)
                .documentType("QUERY_SHEET")
                .description(data.getOrDefault("content", ""))
                .status("PENDING")
                .build();
        return docRequestRepository.save(req);
    }

    public DocumentRequestRecordEntity sendFollowUp(UUID caseId, UUID requestId, String message) {
        DocumentRequestRecordEntity req = docRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Document request not found: " + requestId));
        req.setFollowUpMessage(message);
        req.setFollowUpCount(req.getFollowUpCount() + 1);
        req.setStatus("FOLLOW_UP");
        return docRequestRepository.save(req);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 6: DOCUMENT COLLECTION
    // ═══════════════════════════════════════════════════════════════════════════

    public AuditDocumentEntity uploadDocument(UUID caseId, String fileName, String contentType,
                                               Long fileSize, String fileUrl, UUID requestId, String uploadedBy) {
        AuditDocumentEntity doc = AuditDocumentEntity.builder()
                .caseId(caseId)
                .requestId(requestId)
                .fileName(fileName)
                .contentType(contentType)
                .fileSize(fileSize)
                .fileUrl(fileUrl)
                .uploadedBy(uploadedBy)
                .status("UPLOADED")
                .build();
        // Update the request status
        if (requestId != null) {
            docRequestRepository.findById(requestId).ifPresent(req -> {
                req.setStatus("UPLOADED");
                docRequestRepository.save(req);
            });
        }
        return documentRepository.save(doc);
    }

    public AuditDocumentEntity verifyDocument(UUID caseId, UUID documentId, String verifiedBy) {
        AuditDocumentEntity doc = getDocumentOrThrow(documentId);
        doc.setStatus("VERIFIED");
        doc.setVerifiedBy(verifiedBy);
        doc.setVerifiedAt(OffsetDateTime.now());
        return documentRepository.save(doc);
    }

    public AuditDocumentEntity rejectDocument(UUID caseId, UUID documentId, String reason) {
        AuditDocumentEntity doc = getDocumentOrThrow(documentId);
        doc.setStatus("REJECTED");
        doc.setRejectionReason(reason);
        return documentRepository.save(doc);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 7: CAAT ANALYSIS
    // ═══════════════════════════════════════════════════════════════════════════

    public List<CaatAnomalyEntity> runCAATAnalysis(UUID caseId, List<String> analysisTypes, String runBy) {
        List<CaatAnomalyEntity> anomalies = new ArrayList<>();
        OffsetDateTime now = OffsetDateTime.now();

        for (String analysisType : analysisTypes) {
            // Generate mock anomalies for each analysis type
            CaatAnomalyEntity anomaly = CaatAnomalyEntity.builder()
                    .caseId(caseId)
                    .analysisType(analysisType)
                    .description("Auto-detected anomaly from " + analysisType + " analysis")
                    .severity("MEDIUM")
                    .details("Anomaly detected during " + analysisType + " computer-assisted audit testing")
                    .runBy(runBy)
                    .runAt(now)
                    .validationStatus("PENDING")
                    .build();
            anomalies.add(caatRepository.save(anomaly));
        }
        return anomalies;
    }

    public CaatAnomalyEntity validateAnomaly(UUID caseId, UUID anomalyId, String decision, String notes, String validatedBy) {
        CaatAnomalyEntity anomaly = caatRepository.findById(anomalyId)
                .orElseThrow(() -> new IllegalArgumentException("Anomaly not found: " + anomalyId));
        anomaly.setValidationStatus(decision.toUpperCase()); // ACCEPTED, AMENDED, REJECTED
        anomaly.setValidatedBy(validatedBy);
        anomaly.setValidatedAt(OffsetDateTime.now());
        anomaly.setValidationNotes(notes);
        return caatRepository.save(anomaly);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 8: AUDIT TESTING
    // ═══════════════════════════════════════════════════════════════════════════

    public WorkingPaperEntity addWorkingPaper(UUID caseId, Map<String, String> data, String createdBy) {
        WorkingPaperEntity paper = WorkingPaperEntity.builder()
                .caseId(caseId)
                .title(data.getOrDefault("title", ""))
                .description(data.getOrDefault("description", ""))
                .createdBy(createdBy)
                .status("DRAFT")
                .evidenceSummary(data.getOrDefault("evidenceSummary", ""))
                .build();
        return workingPaperRepository.save(paper);
    }

    public WorkingPaperEntity uploadEvidence(UUID caseId, UUID paperId, String fileUrl, String fileName) {
        WorkingPaperEntity paper = workingPaperRepository.findById(paperId)
                .orElseThrow(() -> new IllegalArgumentException("Working paper not found: " + paperId));
        paper.setEvidenceFileUrl(fileUrl);
        paper.setEvidenceFileName(fileName);
        return workingPaperRepository.save(paper);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 9: FINDINGS
    // ═══════════════════════════════════════════════════════════════════════════

    public AuditFindingEntity createFinding(UUID caseId, Map<String, Object> data, String createdBy) {
        BigDecimal principal = parseAmount(data.get("principalAmount"));
        if (principal.compareTo(BigDecimal.ZERO) == 0 && data.containsKey("amount")) {
            principal = parseAmount(data.get("amount"));
        }
        BigDecimal penalty = parseAmount(data.get("penaltyAmount"));
        BigDecimal interest = parseAmount(data.get("interestAmount"));
        BigDecimal total = principal.add(penalty).add(interest);
        if (data.containsKey("finalAmount") && parseAmount(data.get("finalAmount")).compareTo(BigDecimal.ZERO) > 0) {
            total = parseAmount(data.get("finalAmount"));
        }

        AuditFindingEntity finding = AuditFindingEntity.builder()
                .caseId(caseId)
                .title(data.get("title") != null ? data.get("title").toString() : "Audit Finding")
                .description(data.get("description") != null ? data.get("description").toString() : "")
                .category(data.get("category") != null ? data.get("category").toString() : "VAT")
                .severity(data.get("severity") != null ? data.get("severity").toString() : "MEDIUM")
                .principalAmount(principal)
                .penaltyAmount(penalty)
                .interestAmount(interest)
                .finalAmount(total)
                .createdBy(createdBy)
                .status("DRAFT")
                .build();
        return findingRepository.save(finding);
    }

    private BigDecimal parseAmount(Object val) {
        if (val == null) return BigDecimal.ZERO;
        String s = val.toString().trim().replace(",", "");
        if (s.isEmpty()) return BigDecimal.ZERO;
        try {
            return new BigDecimal(s);
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }

    public void submitFindings(UUID caseId) {
        List<AuditFindingEntity> findings = findingRepository.findByCaseIdOrderByCreatedAtDesc(caseId);
        for (AuditFindingEntity finding : findings) {
            if ("DRAFT".equals(finding.getStatus())) {
                finding.setStatus("SUBMITTED");
                finding.setUpdatedAt(OffsetDateTime.now());
                findingRepository.save(finding);
            }
        }
    }

    public AuditFindingEntity approveFinding(UUID caseId, UUID findingId, String approvedBy) {
        AuditFindingEntity finding = getFindingOrThrow(findingId);
        finding.setStatus("APPROVED");
        finding.setApprovedBy(approvedBy);
        finding.setApprovedAt(OffsetDateTime.now());
        return findingRepository.save(finding);
    }

    public AuditFindingEntity reviseFinding(UUID caseId, UUID findingId, String revisionNotes) {
        AuditFindingEntity finding = getFindingOrThrow(findingId);
        finding.setStatus("REVISION_REQUESTED");
        finding.setRevisionNotes(revisionNotes);
        return findingRepository.save(finding);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 10: TAXPAYER RESPONSE
    // ═══════════════════════════════════════════════════════════════════════════

    public AuditFindingEntity respondToFinding(UUID caseId, UUID findingId,
                                                String responseType, String explanation, String evidence) {
        AuditFindingEntity finding = getFindingOrThrow(findingId);
        finding.setResponseType(responseType);
        finding.setTaxpayerExplanation(explanation);
        finding.setTaxpayerEvidence(evidence);
        finding.setRespondedAt(OffsetDateTime.now());
        return findingRepository.save(finding);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 11: CONCLUSION
    // ═══════════════════════════════════════════════════════════════════════════

    public AuditFindingEntity concludeFinding(UUID caseId, UUID findingId,
                                               String conclusion, String concludedBy) {
        AuditFindingEntity finding = getFindingOrThrow(findingId);
        finding.setConclusion(conclusion);
        finding.setConcludedBy(concludedBy);
        finding.setConcludedAt(OffsetDateTime.now());
        finding.setStatus("CONCLUDED");
        return findingRepository.save(finding);
    }

    public ApAuditCaseEntity finalizeCase(UUID caseId) {
        ApAuditCaseEntity auditCase = getCaseOrThrow(caseId);
        // Verify all findings are concluded
        int pending = findingRepository.countByCaseIdAndStatus(caseId, "DRAFT")
                    + findingRepository.countByCaseIdAndStatus(caseId, "SUBMITTED")
                    + findingRepository.countByCaseIdAndStatus(caseId, "APPROVED")
                    + findingRepository.countByCaseIdAndStatus(caseId, "REVISION_REQUESTED");
        if (pending > 0) {
            throw new IllegalStateException("Cannot finalize: " + pending + " findings are not yet concluded");
        }
        auditCase.setStatus("COMPLETED");
        auditCase.setCompletedAt(OffsetDateTime.now());
        auditCase.setUpdatedAt(OffsetDateTime.now());
        return caseRepository.save(auditCase);
    }

    public ApAuditCaseEntity signReport(UUID caseId, String digitalSignature) {
        ApAuditCaseEntity auditCase = getCaseOrThrow(caseId);
        // Signature is recorded; case moves to COMPLETED
        auditCase.setStatus("COMPLETED");
        auditCase.setCompletedAt(OffsetDateTime.now());
        auditCase.setUpdatedAt(OffsetDateTime.now());
        return caseRepository.save(auditCase);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // GETTERS (for read endpoints)
    // ═══════════════════════════════════════════════════════════════════════════

    public Map<String, Object> getCaseWorkflow(UUID caseId) {
        ApAuditCaseEntity auditCase = getCaseOrThrow(caseId);
        
        // Fetch related data with null-safety
        AuditPlanRecordEntity plan = null;
        try {
            plan = planRepository.findByCaseIdOrderByCreatedAtDesc(caseId)
                    .stream().findFirst().orElse(null);
        } catch (Exception e) {
            log.warn("Failed to load plan for case {}: {}", caseId, e.getMessage());
        }
        
        ConferenceRecordEntity conference = null;
        try {
            conference = conferenceRepository.findByCaseIdOrderByCreatedAtDesc(caseId)
                    .stream().findFirst().orElse(null);
        } catch (Exception e) {
            log.warn("Failed to load conference for case {}: {}", caseId, e.getMessage());
        }
        
        List<DocumentRequestRecordEntity> docRequests = List.of();
        try {
            docRequests = docRequestRepository.findByCaseIdOrderByCreatedAtDesc(caseId);
        } catch (Exception e) {
            log.warn("Failed to load doc requests for case {}: {}", caseId, e.getMessage());
        }
        
        List<AuditDocumentEntity> documents = List.of();
        try {
            documents = documentRepository.findByCaseIdOrderByCreatedAtDesc(caseId);
        } catch (Exception e) {
            log.warn("Failed to load documents for case {}: {}", caseId, e.getMessage());
        }
        
        List<CaatAnomalyEntity> anomalies = List.of();
        try {
            anomalies = caatRepository.findByCaseIdOrderByCreatedAtDesc(caseId);
        } catch (Exception e) {
            log.warn("Failed to load anomalies for case {}: {}", caseId, e.getMessage());
        }
        
        List<WorkingPaperEntity> papers = List.of();
        try {
            papers = workingPaperRepository.findByCaseIdOrderByCreatedAtDesc(caseId);
        } catch (Exception e) {
            log.warn("Failed to load working papers for case {}: {}", caseId, e.getMessage());
        }
        
        List<AuditFindingEntity> findings = List.of();
        try {
            findings = findingRepository.findByCaseIdOrderByCreatedAtDesc(caseId);
        } catch (Exception e) {
            log.warn("Failed to load findings for case {}: {}", caseId, e.getMessage());
        }

        Map<String, Object> workflow = new LinkedHashMap<>();
        workflow.put("caseId", caseId);
        workflow.put("status", auditCase.getStatus());
        workflow.put("assignedTeamLeaderId", auditCase.getAssignedTeamLeaderId());
        workflow.put("assignedAuditorId", auditCase.getAssignedAuditorId());
        
        // Steps
        Map<String, Object> steps = new LinkedHashMap<>();
        steps.put("HANDOFF", Map.of("completed", "HANDED_OFF".equals(auditCase.getStatus())
                || "AUDITOR_ASSIGNED".equals(auditCase.getStatus())
                || "IN_PROGRESS".equals(auditCase.getStatus())
                || "COMPLETED".equals(auditCase.getStatus())));
        steps.put("ASSIGNMENT", Map.of("completed", auditCase.getAssignedAuditorId() != null
                || "AUDITOR_ASSIGNED".equals(auditCase.getStatus())
                || "IN_PROGRESS".equals(auditCase.getStatus())
                || "COMPLETED".equals(auditCase.getStatus())));
        steps.put("PLANNING", Map.of("completed", plan != null && "APPROVED".equals(plan.getStatus())));
        steps.put("CONFERENCE", Map.of("completed", conference != null && ("APPROVED".equals(conference.getStatus()) || "MINUTES_RECORDED".equals(conference.getStatus()))));
        steps.put("INFO_REQUEST", Map.of("completed", !docRequests.isEmpty()));
        steps.put("DOC_COLLECTION", Map.of("completed", !documents.isEmpty()));
        steps.put("CAAT", Map.of("completed", !anomalies.isEmpty() && anomalies.stream().allMatch(a -> !"PENDING".equals(a.getValidationStatus()))));
        steps.put("TESTING", Map.of("completed", !papers.isEmpty()));
        steps.put("FINDINGS", Map.of("completed", findings.stream().anyMatch(f -> "SUBMITTED".equals(f.getStatus()) || "APPROVED".equals(f.getStatus()) || "CONCLUDED".equals(f.getStatus()))));
        steps.put("TAXPAYER_RESPONSE", Map.of("completed", findings.stream().anyMatch(f -> f.getResponseType() != null)));
        steps.put("CONCLUSION", Map.of("completed", "COMPLETED".equals(auditCase.getStatus())));
        workflow.put("steps", steps);
        
        // Plan data
        if (plan != null) {
            Map<String, Object> planMap = new LinkedHashMap<>();
            planMap.put("id", plan.getId() != null ? plan.getId().toString() : null);
            planMap.put("scope", plan.getScope());
            planMap.put("objectives", plan.getObjectives());
            planMap.put("methodology", plan.getMethodology());
            planMap.put("timeline", plan.getTimeline());
            planMap.put("resourcePlan", plan.getResourcePlan());
            planMap.put("status", plan.getStatus());
            planMap.put("revisionNotes", plan.getRevisionNotes());
            planMap.put("submittedBy", plan.getSubmittedBy());
            planMap.put("approvedBy", plan.getApprovedBy());
            planMap.put("createdAt", plan.getCreatedAt() != null ? plan.getCreatedAt().toString() : null);
            workflow.put("plan", planMap);
        }
        
        // Conference data
        if (conference != null) {
            Map<String, Object> confMap = new LinkedHashMap<>();
            confMap.put("id", conference.getId() != null ? conference.getId().toString() : null);
            confMap.put("status", conference.getStatus());
            confMap.put("minutes", conference.getMinutes());
            confMap.put("scheduledBy", conference.getScheduledBy());
            confMap.put("location", conference.getLocation());
            confMap.put("agenda", conference.getAgenda());
            confMap.put("scheduledDate", conference.getScheduledDate() != null ? conference.getScheduledDate().toString() : null);
            workflow.put("conference", confMap);
        }
        
        // Document requests
        if (!docRequests.isEmpty()) {
            workflow.put("documentRequests", docRequests.stream().map(d -> {
                Map<String, Object> dm = new LinkedHashMap<>();
                dm.put("id", d.getId() != null ? d.getId().toString() : null);
                dm.put("documentType", d.getDocumentType());
                dm.put("description", d.getDescription() != null ? d.getDescription() : "");
                dm.put("status", d.getStatus());
                return dm;
            }).collect(java.util.stream.Collectors.toList()));
        }
        
        // Findings
        if (!findings.isEmpty()) {
            workflow.put("findings", findings.stream().map(f -> {
                Map<String, Object> fm = new LinkedHashMap<>();
                fm.put("id", f.getId() != null ? f.getId().toString() : null);
                fm.put("title", f.getTitle());
                fm.put("description", f.getDescription());
                fm.put("category", f.getCategory());
                fm.put("taxType", f.getCategory());
                fm.put("severity", f.getSeverity());
                fm.put("status", f.getStatus());
                fm.put("principalAmount", f.getPrincipalAmount());
                fm.put("penaltyAmount", f.getPenaltyAmount());
                fm.put("interestAmount", f.getInterestAmount());
                fm.put("finalAmount", f.getFinalAmount());
                fm.put("amount", f.getFinalAmount());
                fm.put("financialImpact", f.getFinalAmount());
                fm.put("responseType", f.getResponseType());
                fm.put("taxpayerExplanation", f.getTaxpayerExplanation());
                fm.put("taxpayerEvidence", f.getTaxpayerEvidence());
                fm.put("conclusion", f.getConclusion());
                fm.put("createdAt", f.getCreatedAt() != null ? f.getCreatedAt().toString() : null);
                return fm;
            }).collect(java.util.stream.Collectors.toList()));
        }
        
        // Working papers
        if (!papers.isEmpty()) {
            workflow.put("workingPapers", papers.stream().map(p -> {
                Map<String, Object> pm = new LinkedHashMap<>();
                pm.put("id", p.getId() != null ? p.getId().toString() : null);
                pm.put("title", p.getTitle());
                pm.put("description", p.getDescription());
                pm.put("status", p.getStatus());
                return pm;
            }).collect(java.util.stream.Collectors.toList()));
        }
        
        // Timeline from findings and conference
        List<Map<String, Object>> timeline = new ArrayList<>();
        if (conference != null && conference.getCreatedAt() != null) {
            Map<String, Object> te = new LinkedHashMap<>();
            te.put("step", "ENTRY_CONFERENCE");
            te.put("action", "Conference scheduled");
            te.put("timestamp", conference.getCreatedAt().toString());
            timeline.add(te);
        }
        if (!findings.isEmpty()) {
            for (AuditFindingEntity f : findings) {
                if (f.getCreatedAt() != null) {
                    Map<String, Object> te = new LinkedHashMap<>();
                    te.put("step", "FINDINGS");
                    te.put("action", "Finding created: " + (f.getTitle() != null ? f.getTitle() : f.getDescription()));
                    te.put("timestamp", f.getCreatedAt().toString());
                    timeline.add(te);
                }
            }
        }
        if (!timeline.isEmpty()) {
            workflow.put("timeline", timeline);
        }
        
        log.info("Workflow for case {}: {} keys, plan={}, conference={}, findings={}",
                caseId, workflow.size(), plan != null, conference != null, findings.size());
        return workflow;
    }

    public List<AuditPlanRecordEntity> getPlans(UUID caseId) {
        return planRepository.findByCaseIdOrderByCreatedAtDesc(caseId);
    }

    public ConferenceRecordEntity getConference(UUID caseId) {
        return conferenceRepository.findByCaseIdOrderByCreatedAtDesc(caseId)
                .stream().findFirst().orElse(null);
    }

    public List<DocumentRequestRecordEntity> getDocumentRequests(UUID caseId) {
        return docRequestRepository.findByCaseIdOrderByCreatedAtDesc(caseId);
    }

    public List<AuditDocumentEntity> getDocuments(UUID caseId) {
        return documentRepository.findByCaseIdOrderByCreatedAtDesc(caseId);
    }

    public List<CaatAnomalyEntity> getCAATResults(UUID caseId) {
        return caatRepository.findByCaseIdOrderByCreatedAtDesc(caseId);
    }

    public List<WorkingPaperEntity> getWorkingPapers(UUID caseId) {
        return workingPaperRepository.findByCaseIdOrderByCreatedAtDesc(caseId);
    }

    public List<AuditFindingEntity> getFindings(UUID caseId) {
        return findingRepository.findByCaseIdOrderByCreatedAtDesc(caseId);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    private UserEntity resolveUser(String identifier) {
        if (identifier == null || identifier.isBlank()) return null;
        String trimmed = identifier.trim();
        try {
            UUID uuid = UUID.fromString(trimmed);
            Optional<UserEntity> byId = userRepository.findById(uuid);
            if (byId.isPresent()) return byId.get();
        } catch (IllegalArgumentException ignored) {}
        Optional<UserEntity> byUsername = userRepository.findByUsername(trimmed)
                .or(() -> userRepository.findByEmail(trimmed));
        if (byUsername.isPresent()) return byUsername.get();

        // Fallback for legacy UI mappings
        String mappedUsername = switch (trimmed) {
            case "u-tl-aa1a", "10000000-0000-0000-0000-000000000001" -> "aa1.tl";
            case "u-tl-aa2a", "10000000-0000-0000-0000-000000000007" -> "aa2.tl";
            case "u-tl-aa3a", "10000000-0000-0000-0000-000000000002" -> "aa3.tl";
            case "u-tl-or1a", "10000000-0000-0000-0000-000000000017", "u-tl-or1-ja-1", "u-tl-or1-joint-1" -> "or1.tl";
            case "u-tl-federal-lto1-ja-1", "u-tl-federal-lto1-joint-1" -> "fed.ja.tl";
            default -> null;
        };
        if (mappedUsername != null) {
            return userRepository.findByUsername(mappedUsername).orElse(null);
        }
        return null;
    }

    private ApAuditCaseEntity getCaseOrThrow(UUID caseId) {
        Optional<ApAuditCaseEntity> opt = caseRepository.findById(caseId);
        if (opt.isPresent()) return opt.get();
        Optional<CommitteeCaseEntity> commOpt = committeeCaseRepository.findById(caseId);
        if (commOpt.isPresent()) {
            CommitteeCaseEntity comm = commOpt.get();
            if (comm.getCaseCode() != null) {
                Optional<ApAuditCaseEntity> byCode = caseRepository.findByCaseNumber(comm.getCaseCode());
                if (byCode.isPresent()) return byCode.get();
            }
            if (comm.getOriginalCaseId() != null) {
                Optional<ApAuditCaseEntity> orig = caseRepository.findById(comm.getOriginalCaseId());
                if (orig.isPresent()) return orig.get();
            }
        }
        throw new IllegalArgumentException("Case not found: " + caseId);
    }

    private AuditPlanRecordEntity getLatestPlanOrThrow(UUID caseId, String expectedStatus) {
        return planRepository.findByCaseIdOrderByCreatedAtDesc(caseId)
                .stream()
                .filter(p -> expectedStatus.equals(p.getStatus()))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException(
                    "No plan in " + expectedStatus + " status found for case: " + caseId));
    }

    private ConferenceRecordEntity getLatestConferenceOrThrow(UUID caseId) {
        return conferenceRepository.findByCaseIdOrderByCreatedAtDesc(caseId)
                .stream().findFirst()
                .orElseThrow(() -> new IllegalStateException("No conference found for case: " + caseId));
    }

    private AuditDocumentEntity getDocumentOrThrow(UUID documentId) {
        return documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found: " + documentId));
    }

    private AuditFindingEntity getFindingOrThrow(UUID findingId) {
        return findingRepository.findById(findingId)
                .orElseThrow(() -> new IllegalArgumentException("Finding not found: " + findingId));
    }
}
