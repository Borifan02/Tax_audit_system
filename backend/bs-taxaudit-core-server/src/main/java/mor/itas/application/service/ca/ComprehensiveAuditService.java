package mor.itas.application.service.ca;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import mor.itas.api.dto.request.ca.*;
import mor.itas.api.dto.response.ca.*;
import mor.itas.domain.exception.CaseNotFoundException;
import mor.itas.domain.exception.InvalidCaseStateException;
import mor.itas.domain.service.ap.AuditTrailService;
import mor.itas.domain.service.ca.AssessmentNoticeGeneratorService;
import mor.itas.domain.service.ca.CaDomainEventPublisher;
import mor.itas.domain.service.ca.CaWorkflowStateMachine;
import mor.itas.domain.service.ca.CaatEngineService;
import mor.itas.domain.event.ca.*;
import mor.itas.domain.model.ca.CaAuditAssertion;
import mor.itas.domain.model.ca.CaDocumentRequest;
import mor.itas.domain.model.ca.CaFinding;
import mor.itas.domain.model.ca.CaReconciliation;
import mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity;
import mor.itas.persistence.jpa.entity.ca.*;
import mor.itas.persistence.jpa.repository.ap.ApAuditCaseRepository;
import mor.itas.persistence.repository.ca.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ComprehensiveAuditService {

    // ── Repositories ──────────────────────────────────────────────────────────
    private final ApAuditCaseRepository        caseRepository;
    private final CaDocumentRequestRepository  documentRequestRepository;
    private final CaQuerySheetRepository       querySheetRepository;
    private final CaAuditAssertionRepository   assertionRepository;
    private final CaExecutionReportRepository  executionReportRepository;
    private final CaCaatEligibilityRepository  caatEligibilityRepository;
    private final CaCaatRunRepository          caatRunRepository;
    private final CaCaatExceptionRepository    caatExceptionRepository;
    private final CaEntryConferenceRepository  entryConferenceRepository;
    private final CaBalanceSheetRepository     balanceSheetRepository;
    private final CaBenchmarkAnalysisRepository benchmarkRepository;
    private final CaThirdPartyMatchRepository  thirdPartyMatchRepository;
    private final CaReconciliationRepository   reconciliationRepository;
    private final CaSamplingRecordRepository   samplingRepository;
    private final CaAuditFindingRepository     findingRepository;
    private final CaWorkingPaperRepository     workingPaperRepository;
    private final CaDraftReportRepository      draftReportRepository;
    private final CaExitConferenceRepository   exitConferenceRepository;
    private final CaAssessmentNoticeRepository noticeRepository;
    private final CaApprovalStepRepository     approvalStepRepository;
    private final CaTaxpayerResponseRepository taxpayerResponseRepository;
    private final CaMultiZoneAllocationRepository multiZoneAllocationRepository;
    private final CaCaseSnapshotRepository     snapshotRepository;

    // ── Domain services ───────────────────────────────────────────────────────
    private final CaWorkflowStateMachine       stateMachine;
    private final CaatEngineService            caatEngine;
    private final AssessmentNoticeGeneratorService noticeGenerator;
    private final AuditTrailService            auditTrailService;
    private final CaDomainEventPublisher       eventPublisher;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;
    private final mor.itas.engineadapter.taxpayer.MockTaxpayerAdapter mockTaxpayerAdapter;
    private final mor.itas.persistence.jpa.repository.ap.UserJpaRepository userJpaRepository;
    private final mor.itas.application.service.notification.NotificationService notificationService;

    private UUID parseActorId(String actorId) {
        if (actorId == null) return UUID.fromString("10000000-0000-0000-0001-000000000001");
        try {
            return UUID.fromString(actorId);
        } catch (IllegalArgumentException e) {
            return UUID.nameUUIDFromBytes(actorId.getBytes());
        }
    }

    // ── Sequence counter for references (DB-count based — restarts safely) ──
    private String nextFindingRef(UUID caseId) {
        long count = findingRepository.countByAuditCaseIdAndStatus(caseId, "DRAFT")
                   + findingRepository.countByAuditCaseIdAndStatus(caseId, "CONFIRMED")
                   + findingRepository.countByAuditCaseIdAndStatus(caseId, "UNDER_REVIEW")
                   + findingRepository.countByAuditCaseIdAndStatus(caseId, "WITHDRAWN") + 1;
        return "CA-" + caseId.toString().substring(0, 6).toUpperCase()
               + "-F" + String.format("%02d", count);
    }

    private String nextWorkingPaperRef(UUID caseId) {
        long count = workingPaperRepository.countByAuditCaseIdAndStatus(caseId, "DRAFT")
                   + workingPaperRepository.countByAuditCaseIdAndStatus(caseId, "COMPLETED")
                   + workingPaperRepository.countByAuditCaseIdAndStatus(caseId, "REVIEWED") + 1;
        return "WP-" + caseId.toString().substring(0, 6).toUpperCase()
               + "-" + String.format("%03d", count);
    }

    private String nextReportRef(UUID caseId) {
        long count = draftReportRepository.findByAuditCaseIdOrderByCreatedAtDesc(caseId).size() + 1;
        return "DR-" + caseId.toString().substring(0, 6).toUpperCase()
               + "-" + String.format("%03d", count);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CASE OVERVIEW
    // ═══════════════════════════════════════════════════════════════════════════

    @Transactional(readOnly = true)
    public CaCaseOverviewResponse getCaseOverview(UUID caseId) {
        ApAuditCaseEntity c = getAndValidateCase(caseId);

        Optional<CaDraftReportEntity> latestReport = draftReportRepository
            .findTopByAuditCaseIdOrderByCreatedAtDesc(caseId);
        Optional<CaAssessmentNoticeEntity> latestNotice = noticeRepository
            .findTopByAuditCaseIdOrderByCreatedAtDesc(caseId);
        Optional<CaCaatEligibilityEntity> eligibility = caatEligibilityRepository
            .findTopByAuditCaseIdOrderByCreatedAtDesc(caseId);

        BigDecimal exposure = findingRepository.sumTotalTaxImpact(caseId);

        return CaCaseOverviewResponse.builder()
            .caseId(c.getId())
            .caseNumber(c.getCaseNumber())
            .taxpayerName(c.getTaxpayerName())
            .tin(c.getTin() != null ? c.getTin() : c.getTaxpayerId())
            .taxCenter(c.getTaxCenter() != null ? c.getTaxCenter() : c.getTaxCenterCode())
            .auditType(c.getAuditType())
            .status(c.getStatus())
            .caWorkflowStatus(c.getCaWorkflowStatus())
            .caCurrentPhase(c.getCaCurrentPhase())
            .taxpayerSegment(c.getTaxpayerSegment() != null ? c.getTaxpayerSegment() : c.getSegment())
            .riskScore(c.getRiskScore())
            .riskCategory(c.getRiskCategory() != null ? c.getRiskCategory() : c.getRiskPriority())
            .startDate(c.getStartDate() != null ? c.getStartDate().toString()
                : (c.getStartedAt() != null ? c.getStartedAt().toLocalDate().toString() : null))
            .dueDate(c.getDueDate() != null ? c.getDueDate().toString() : null)
            .auditScope(c.getAuditScope())
            .assignedAuditorId(c.getAssignedAuditorId())
            .teamLeaderId(c.getAssignedTeamLeaderId())
            .totalFindings((int) findingRepository.countByAuditCaseIdAndStatus(caseId, "CONFIRMED")
                + (int) findingRepository.countByAuditCaseIdAndStatus(caseId, "DRAFT"))
            .fraudFindings((int) findingRepository.countByAuditCaseIdAndStatus(caseId, "CONFIRMED"))
            .openQueries((int) querySheetRepository.findByAuditCaseId(caseId).stream()
                .filter(q -> "OPEN".equals(q.getStatus()) || "PENDING_RESPONSE".equals(q.getStatus())).count())
            .workingPapers((int) workingPaperRepository.countByAuditCaseIdAndStatus(caseId, "COMPLETED"))
            .caatEligible(eligibility.map(CaCaatEligibilityEntity::getIsEligible).orElse(null))
            .estimatedTaxExposure(exposure)
            .reportStatus(latestReport.map(CaDraftReportEntity::getStatus).orElse(null))
            .noticeStatus(latestNotice.map(CaAssessmentNoticeEntity::getStatus).orElse(null))
            .build();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CAAT ELIGIBILITY  FR-04.4-01
    // ═══════════════════════════════════════════════════════════════════════════

    @Transactional
    public CaCaatEligibilityResponse assessCaatEligibility(UUID caseId,
                                                            AssessCaatEligibilityRequest req,
                                                            String actorId) {
        ApAuditCaseEntity c = getAndValidateCase(caseId);
        stateMachine.initialise(c);

        // Delegate to Domain Model for FR-04.4-01 Business Rules
        mor.itas.domain.model.ca.CaCaatEligibility eligibilityDomain = mor.itas.domain.model.ca.CaCaatEligibility.builder()
            .caseId(caseId)
            .annualTurnover(req.getAnnualTurnover())
            .hasErpSystem(Boolean.TRUE.equals(req.getHasErpSystem()))
            .hasElectronicRecords(Boolean.TRUE.equals(req.getHasElectronicRecords()))
            .taxpayerSegment(req.getTaxpayerSegment())
            .overridden(Boolean.TRUE.equals(req.getOverride()))
            .overrideReason(req.getOverrideReason())
            .assessedBy(actorId)
            .assessedAt(OffsetDateTime.now())
            .build();

        boolean finalEligible = eligibilityDomain.isFinalEligible();
        String reason = eligibilityDomain.getEligibilityReason();

        CaCaatEligibilityEntity entity = CaCaatEligibilityEntity.builder()
            .auditCase(c)
            .isEligible(finalEligible)
            .eligibilityReason(reason)
            .annualTurnover(eligibilityDomain.getAnnualTurnover())
            .hasErpSystem(eligibilityDomain.isHasErpSystem())
            .hasElectronicRecords(eligibilityDomain.isHasElectronicRecords())
            .taxpayerSegment(eligibilityDomain.getTaxpayerSegment())
            .assessedBy(eligibilityDomain.getAssessedBy())
            .assessedAt(eligibilityDomain.getAssessedAt())
            .overridden(eligibilityDomain.isOverridden())
            .overrideReason(eligibilityDomain.getOverrideReason())
            .overrideBy(eligibilityDomain.isOverridden() ? actorId : null)
            .status(finalEligible ? "ELIGIBLE" : "INELIGIBLE")
            .build();
        entity = caatEligibilityRepository.save(entity);

        // Advance workflow
        if ("OPENED".equals(stateMachine.currentState(c))) {
            stateMachine.advance(c, "CAAT_AND_PLANNING");
        }

        auditTrailService.logAction(caseId, parseActorId(actorId),
            "CAAT_ELIGIBILITY_ASSESSED", "CaCaatEligibility",
            null, finalEligible ? "ELIGIBLE" : "INELIGIBLE",
            "CAAT eligibility assessed: " + reason);

        eventPublisher.publish(CaCaatEligibilityAssessedEvent.builder()
            .caseId(caseId)
            .eligibilityId(entity.getId())
            .eligible(finalEligible)
            .eligibilityReason(reason)
            .annualTurnover(eligibilityDomain.getAnnualTurnover())
            .hasErpSystem(eligibilityDomain.isHasErpSystem())
            .hasElectronicRecords(eligibilityDomain.isHasElectronicRecords())
            .taxpayerSegment(eligibilityDomain.getTaxpayerSegment())
            .overridden(eligibilityDomain.isOverridden())
            .overrideReason(eligibilityDomain.getOverrideReason())
            .assessedById(actorId)
            .build());

        return mapEligibility(entity);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CAAT RUN  FR-04.4-02, 14
    // ═══════════════════════════════════════════════════════════════════════════

    @Transactional
    public CaCaatRunResponse startCaatRun(UUID caseId, StartCaatRunRequest req, String actorId) {
        ApAuditCaseEntity c = getAndValidateCase(caseId);

        // Verify eligibility
        CaCaatEligibilityEntity elig = caatEligibilityRepository
            .findTopByAuditCaseIdOrderByCreatedAtDesc(caseId)
            .orElseThrow(() -> new InvalidCaseStateException(
                "CAAT eligibility must be assessed before running CAAT", c.getStatus()));
        if (!elig.getIsEligible()) {
            throw new InvalidCaseStateException("Taxpayer is not CAAT eligible", c.getStatus());
        }

        String toolName = req.getCaatToolName() != null
            ? req.getCaatToolName() : "ITAS Automated CAAT Suite";
        String runRef = "RUN-" + caseId.toString().substring(0, 8).toUpperCase()
            + "-" + System.currentTimeMillis();

        CaCaatRunEntity run = CaCaatRunEntity.builder()
            .auditCase(c)
            .runReference(runRef)
            .caatToolName(toolName)
            .samplingMethod(req.getSamplingMethod())
            .status("PENDING")
            .auditorNotes(req.getAuditorNotes())
            .executedBy(actorId)
            .build();
        run = caatRunRepository.save(run);

        // Execute all CAAT rules
        run = caatEngine.executeRun(run, c);

        // Advance to FIELDWORK if still in CAAT_AND_PLANNING
        if ("CAAT_AND_PLANNING".equals(stateMachine.currentState(c))) {
            stateMachine.advance(c, "FIELDWORK");
        }

        auditTrailService.logAction(caseId, parseActorId(actorId),
            "CAAT_RUN_COMPLETED", "CaCaatRun", null, run.getId().toString(),
            "CAAT run " + runRef + " completed — " + run.getTotalFlagged() + " exceptions flagged");

        eventPublisher.publish(CaCaatRunCompletedEvent.builder()
            .caseId(caseId)
            .caatRunId(run.getId())
            .runReference(run.getRunReference())
            .totalRecordsMined(run.getTotalRecordsMined())
            .totalExceptions(run.getTotalFlagged())
            .totalFlaggedExposure(run.getTotalFlaggedExposure())
            .executedById(actorId)
            .build());

        return mapCaatRun(run);
    }

    @Transactional(readOnly = true)
    public List<CaCaatRunResponse> getCaatRuns(UUID caseId) {
        getAndValidateCase(caseId);
        return caatRunRepository.findByAuditCaseIdOrderByCreatedAtDesc(caseId)
            .stream().map(this::mapCaatRun).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CaCaatExceptionResponse> getCaatExceptions(UUID caseId) {
        getAndValidateCase(caseId);
        return caatExceptionRepository.findByAuditCaseIdOrderByCreatedAtDesc(caseId)
            .stream().map(this::mapException).collect(Collectors.toList());
    }

    @Transactional
    public CaCaatExceptionResponse reviewCaatException(UUID caseId, UUID exceptionId,
                                                        ReviewCaatExceptionRequest req,
                                                        String actorId) {
        getAndValidateCase(caseId);
        CaCaatExceptionEntity ex = caatExceptionRepository.findById(exceptionId)
            .orElseThrow(() -> new CaseNotFoundException("CAAT exception not found: " + exceptionId));

        ex.setActionTakenNotes(req.getActionTakenNotes());
        ex.setStatus(req.getDisposition());
        ex.setUpdatedAt(OffsetDateTime.now());

        if ("FINDING_CREATED".equals(req.getDisposition()) && req.getFindingTitle() != null) {
            // Auto-create a finding from this exception
            CreateCaFindingRequest findingReq = new CreateCaFindingRequest();
            findingReq.setAuditArea("CAAT_EXCEPTION");
            findingReq.setTitle(req.getFindingTitle());
            findingReq.setDescription(req.getFindingDescription() != null
                ? req.getFindingDescription() : ex.getDetails());
            findingReq.setUnderDeclaredAmount(ex.getAmount());
            findingReq.setTaxType(ex.getTaxHead());
            findingReq.setCaatExceptionId(ex.getId());
            CaFindingResponse finding = createFinding(caseId, findingReq, actorId);
            ex.setFindingId(UUID.fromString(finding.getId().toString()));
            ex.setConvertedToFinding(true);
        }

        auditTrailService.logAction(caseId, parseActorId(actorId),
            "CAAT_EXCEPTION_REVIEWED", "CaCaatException",
            "PENDING_REVIEW", req.getDisposition(),
            "Exception " + exceptionId + " → " + req.getDisposition());

        return mapException(caatExceptionRepository.save(ex));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ENTRY CONFERENCE  FR-04.2.1-01 → 05
    // ═══════════════════════════════════════════════════════════════════════════

    @Transactional
    public CaEntryConferenceResponse scheduleEntryConference(UUID caseId,
                                                              ScheduleEntryConferenceRequest req,
                                                              String actorId) {
        ApAuditCaseEntity c = getAndValidateCase(caseId);
        CaEntryConferenceEntity entity = CaEntryConferenceEntity.builder()
            .auditCase(c)
            .scheduledDate(LocalDate.parse(req.getScheduledDate()))
            .scheduledTime(req.getScheduledTime())
            .venue(req.getVenue())
            .attendees(req.getAttendees())
            .status("SCHEDULED")
            .createdBy(actorId)
            .build();
        entity = entryConferenceRepository.save(entity);

        auditTrailService.logAction(caseId, parseActorId(actorId),
            "ENTRY_CONFERENCE_SCHEDULED", "CaEntryConference",
            null, entity.getId().toString(),
            "Entry conference scheduled for " + req.getScheduledDate());

        return mapEntryConference(entity);
    }

    @Transactional
    public CaEntryConferenceResponse recordEntryConferenceResults(UUID caseId,
                                                                   RecordEntryConferenceResultsRequest req,
                                                                   String actorId) {
        ApAuditCaseEntity c = getAndValidateCase(caseId);
        CaEntryConferenceEntity entity = entryConferenceRepository
            .findTopByAuditCaseIdOrderByCreatedAtDesc(caseId)
            .orElseThrow(() -> new CaseNotFoundException("No entry conference found for case: " + caseId));

        entity.setInternalControlsReview(req.getInternalControlsReview());
        entity.setPremisesInspectionNotes(req.getPremisesInspectionNotes());
        entity.setAudioRecordingUrl(req.getAudioRecordingUrl());
        entity.setStatus("CONDUCTED");
        entity.setUpdatedAt(OffsetDateTime.now());
        entity = entryConferenceRepository.save(entity);

        auditTrailService.logAction(caseId, parseActorId(actorId),
            "ENTRY_CONFERENCE_CONDUCTED", "CaEntryConference",
            "SCHEDULED", "CONDUCTED", "Entry conference results recorded");

        return mapEntryConference(entity);
    }

    @Transactional(readOnly = true)
    public List<CaEntryConferenceResponse> getEntryConferences(UUID caseId) {
        getAndValidateCase(caseId);
        return entryConferenceRepository.findByAuditCaseIdOrderByCreatedAtDesc(caseId)
            .stream().map(this::mapEntryConference).collect(Collectors.toList());
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // BALANCE SHEET TESTING  FR-04.4-03, 08
    // ═══════════════════════════════════════════════════════════════════════════

    @Transactional
    public CaBalanceSheetItemResponse addBalanceSheetItem(UUID caseId,
                                                           AddBalanceSheetItemRequest req,
                                                           String actorId) {
        ApAuditCaseEntity c = getAndValidateCase(caseId);
        BigDecimal auditee = req.getAuditeeBalance() != null ? req.getAuditeeBalance() : BigDecimal.ZERO;
        BigDecimal audited = req.getAuditedBalance() != null ? req.getAuditedBalance() : BigDecimal.ZERO;
        BigDecimal variance = audited.subtract(auditee);

        CaBalanceSheetItemEntity entity = CaBalanceSheetItemEntity.builder()
            .auditCase(c)
            .component(req.getComponent())
            .assertionType(req.getAssertionType())
            .auditeeBalance(auditee)
            .auditedBalance(audited)
            .variance(variance)
            .ifrsCompliance(req.getIfrsCompliance())
            .notes(req.getNotes())
            .auditorConclusion(req.getAuditorConclusion())
            .createdBy(actorId)
            .build();
        entity = balanceSheetRepository.save(entity);

        auditTrailService.logAction(caseId, parseActorId(actorId),
            "BALANCE_SHEET_ITEM_ADDED", "CaBalanceSheetItem",
            null, entity.getId().toString(),
            "Balance sheet item: " + req.getComponent() + " variance=" + variance);

        return mapBalanceSheet(entity);
    }

    @Transactional(readOnly = true)
    public List<CaBalanceSheetItemResponse> getBalanceSheetItems(UUID caseId) {
        getAndValidateCase(caseId);
        return balanceSheetRepository.findByAuditCaseIdOrderByCreatedAtDesc(caseId)
            .stream().map(this::mapBalanceSheet).collect(Collectors.toList());
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // BENCHMARK ANALYSIS  FR-04.4-06, 14
    // ═══════════════════════════════════════════════════════════════════════════

    @Transactional
    public CaBenchmarkAnalysisResponse addBenchmarkAnalysis(UUID caseId,
                                                             AddBenchmarkAnalysisRequest req,
                                                             String actorId) {
        ApAuditCaseEntity c = getAndValidateCase(caseId);
        BigDecimal tp = req.getTaxpayerValue() != null ? req.getTaxpayerValue() : BigDecimal.ZERO;
        BigDecimal bm = req.getBenchmarkValue() != null ? req.getBenchmarkValue() : BigDecimal.ZERO;
        BigDecimal variancePct = bm.compareTo(BigDecimal.ZERO) != 0
            ? tp.subtract(bm).divide(bm, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
            : BigDecimal.ZERO;

        CaBenchmarkAnalysisEntity entity = CaBenchmarkAnalysisEntity.builder()
            .auditCase(c)
            .ratioName(req.getRatioName())
            .taxpayerValue(tp)
            .benchmarkValue(bm)
            .unit(req.getUnit())
            .variancePct(variancePct)
            .riskLevel(req.getRiskLevel())
            .interpretation(req.getInterpretation())
            .industryCode(req.getIndustryCode())
            .dataYear(req.getDataYear())
            .createdBy(actorId)
            .build();
        entity = benchmarkRepository.save(entity);

        auditTrailService.logAction(caseId, parseActorId(actorId),
            "BENCHMARK_ADDED", "CaBenchmarkAnalysis",
            null, entity.getId().toString(),
            req.getRatioName() + " variance=" + variancePct + "%");

        return mapBenchmark(entity);
    }

    @Transactional(readOnly = true)
    public List<CaBenchmarkAnalysisResponse> getBenchmarkAnalyses(UUID caseId) {
        getAndValidateCase(caseId);
        return benchmarkRepository.findByAuditCaseIdOrderByCreatedAtDesc(caseId)
            .stream().map(this::mapBenchmark).collect(Collectors.toList());
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // THIRD-PARTY MATCHING  FR-04.4-07
    // ═══════════════════════════════════════════════════════════════════════════

    @Transactional
    public CaThirdPartyMatchResponse addThirdPartyMatch(UUID caseId,
                                                         AddThirdPartyMatchRequest req,
                                                         String actorId) {
        ApAuditCaseEntity c = getAndValidateCase(caseId);
        BigDecimal declared = req.getDeclaredValue() != null ? req.getDeclaredValue() : BigDecimal.ZERO;
        BigDecimal third = req.getThirdPartyValue() != null ? req.getThirdPartyValue() : BigDecimal.ZERO;
        BigDecimal variance = third.subtract(declared);
        String matchStatus = variance.abs().compareTo(BigDecimal.valueOf(1000)) < 0
            ? "MATCHED" : "DISCREPANCY";

        CaThirdPartyMatchEntity entity = CaThirdPartyMatchEntity.builder()
            .auditCase(c)
            .dataSource(req.getDataSource())
            .declaredValue(declared)
            .thirdPartyValue(third)
            .variance(variance)
            .matchStatus(matchStatus)
            .discrepancyNotes(req.getDiscrepancyNotes())
            .periodCovered(req.getPeriodCovered())
            .createdBy(actorId)
            .build();
        entity = thirdPartyMatchRepository.save(entity);

        auditTrailService.logAction(caseId, parseActorId(actorId),
            "THIRD_PARTY_MATCH_ADDED", "CaThirdPartyMatch",
            null, entity.getId().toString(),
            req.getDataSource() + " match=" + matchStatus + " variance=" + variance);

        return mapThirdParty(entity);
    }

    @Transactional(readOnly = true)
    public List<CaThirdPartyMatchResponse> getThirdPartyMatches(UUID caseId) {
        getAndValidateCase(caseId);
        return thirdPartyMatchRepository.findByAuditCaseIdOrderByCreatedAtDesc(caseId)
            .stream().map(this::mapThirdParty).collect(Collectors.toList());
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RECONCILIATION  FR-04.4-16
    // ═══════════════════════════════════════════════════════════════════════════

    @Transactional
    public CaReconciliationResponse addReconciliation(UUID caseId,
                                                       AddReconciliationRequest req,
                                                       String actorId) {
        ApAuditCaseEntity c = getAndValidateCase(caseId);
        BigDecimal a = req.getSourceAAmount();
        BigDecimal b = req.getSourceBAmount();
        BigDecimal cc = req.getSourceCAmount() != null ? req.getSourceCAmount() : BigDecimal.ZERO;
        BigDecimal variance = a.subtract(b).subtract(cc).abs();
        BigDecimal variancePct = b.compareTo(BigDecimal.ZERO) != 0
            ? variance.divide(b, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100))
            : BigDecimal.ZERO;
        String status = variance.compareTo(BigDecimal.valueOf(10000)) > 0
            ? "DISCREPANCY_FLAGGED" : "RECONCILED";

        CaReconciliationEntity entity = CaReconciliationEntity.builder()
            .auditCase(c)
            .reconciliationType(req.getReconciliationType())
            .sourceALabel(req.getSourceALabel())
            .sourceAAmount(a)
            .sourceBLabel(req.getSourceBLabel())
            .sourceBAmount(b)
            .sourceCLabel(req.getSourceCLabel())
            .sourceCAmount(req.getSourceCAmount())
            .variance(variance)
            .variancePct(variancePct)
            .periodCovered(req.getPeriodCovered())
            .status(status)
            .auditorNotes(req.getAuditorNotes())
            .createdBy(actorId)
            .build();
        entity = reconciliationRepository.save(entity);

        auditTrailService.logAction(caseId, parseActorId(actorId),
            "RECONCILIATION_ADDED", "CaReconciliation",
            null, entity.getId().toString(),
            req.getReconciliationType() + " status=" + status + " variance=" + variance);

        return mapReconciliation(entity);
    }

    @Transactional(readOnly = true)
    public List<CaReconciliationResponse> getReconciliations(UUID caseId) {
        getAndValidateCase(caseId);
        return reconciliationRepository.findByAuditCaseIdOrderByCreatedAtDesc(caseId)
            .stream().map(this::mapReconciliation).collect(Collectors.toList());
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SAMPLING  FR-04.4-13, 15, 16
    // ═══════════════════════════════════════════════════════════════════════════

    @Transactional
    public CaSamplingRecordResponse addSamplingRecord(UUID caseId,
                                                       AddSamplingRecordRequest req,
                                                       String actorId) {
        ApAuditCaseEntity c = getAndValidateCase(caseId);
        CaSamplingRecordEntity entity = CaSamplingRecordEntity.builder()
            .auditCase(c)
            .samplingType(req.getSamplingType())
            .targetPopulation(req.getTargetPopulation())
            .populationSize(req.getPopulationSize())
            .sampleSize(req.getSampleSize())
            .selectionCriteria(req.getSelectionCriteria())
            .sampleDescription(req.getSampleDescription())
            .status("IN_PROGRESS")
            .createdBy(actorId)
            .build();
        entity = samplingRepository.save(entity);

        auditTrailService.logAction(caseId, parseActorId(actorId),
            "SAMPLING_RECORD_ADDED", "CaSamplingRecord",
            null, entity.getId().toString(),
            req.getSamplingType() + " on " + req.getTargetPopulation());

        return mapSampling(entity);
    }

    @Transactional(readOnly = true)
    public List<CaSamplingRecordResponse> getSamplingRecords(UUID caseId) {
        getAndValidateCase(caseId);
        return samplingRepository.findByAuditCaseIdOrderByCreatedAtDesc(caseId)
            .stream().map(this::mapSampling).collect(Collectors.toList());
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // AUDIT FINDINGS  FR-04.4-10, 28, 33
    // ═══════════════════════════════════════════════════════════════════════════

    @Transactional
    public CaFindingResponse createFinding(UUID caseId, CreateCaFindingRequest req, String actorId) {
        ApAuditCaseEntity c = getAndValidateCase(caseId);
        String ref = nextFindingRef(caseId);

        BigDecimal under = req.getUnderDeclaredAmount() != null
            ? req.getUnderDeclaredAmount() : BigDecimal.ZERO;
        BigDecimal penalty = under.multiply(new BigDecimal("0.20"))
            .setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = under.add(penalty);

        CaAuditFindingEntity entity = CaAuditFindingEntity.builder()
            .auditCase(c)
            .findingReference(ref)
            .auditArea(req.getAuditArea())
            .title(req.getTitle())
            .description(req.getDescription())
            .criteria(req.getCriteria())
            .condition(req.getCondition())
            .cause(req.getCause())
            .effect(req.getEffect())
            .underDeclaredAmount(under)
            .penaltyRate(new BigDecimal("0.20"))
            .penaltyAmount(penalty)
            .interestAmount(BigDecimal.ZERO)
            .totalTaxImpact(total)
            .taxType(req.getTaxType())
            .auditorAnalysis(req.getAuditorAnalysis())
            .conclusion(req.getConclusion())
            .recommendation(req.getRecommendation())
            .indicatesFraud(Boolean.TRUE.equals(req.getIndicatesFraud()))
            .fraudIndicators(req.getFraudIndicators())
            .zoneCode(req.getZoneCode())
            .caatExceptionId(req.getCaatExceptionId())
            .status("DRAFT")
            .isSignificant(Boolean.TRUE.equals(req.getIsSignificant()))
            .createdBy(actorId)
            .build();
        entity = findingRepository.save(entity);

        // FR-04.4-28: auto-escalate to fraud investigation if fraud indicators present
        if (Boolean.TRUE.equals(req.getIndicatesFraud())) {
            stateMachine.advance(c, "FRAUD_INVESTIGATION");
            entity.setFraudReferralDate(OffsetDateTime.now());
            entity = findingRepository.save(entity);
            eventPublisher.publish(CaFraudReferralTriggeredEvent.builder()
                .caseId(caseId)
                .findingId(entity.getId())
                .fraudIndicators(req.getFraudIndicators())
                .triggeredById(actorId)
                .triggerSource("FINDING")
                .previousWorkflowStatus(stateMachine.currentState(c))
                .build());
            auditTrailService.logAction(caseId, parseActorId(actorId),
                "FRAUD_ESCALATION_TRIGGERED", "CaAuditFinding",
                c.getCaWorkflowStatus(), "FRAUD_INVESTIGATION",
                "Finding " + ref + " indicates fraud: " + req.getFraudIndicators());
        }

        eventPublisher.publish(CaFindingCreatedEvent.builder()
            .caseId(caseId)
            .findingId(entity.getId())
            .findingReference(ref)
            .auditArea(req.getAuditArea())
            .title(req.getTitle())
            .taxType(req.getTaxType())
            .underDeclaredAmount(under)
            .penaltyAmount(penalty)
            .totalTaxImpact(total)
            .isSignificant(Boolean.TRUE.equals(req.getIsSignificant()))
            .indicatesFraud(Boolean.TRUE.equals(req.getIndicatesFraud()))
            .zoneCode(req.getZoneCode())
            .caatExceptionId(req.getCaatExceptionId())
            .createdById(actorId)
            .build());

        auditTrailService.logAction(caseId, parseActorId(actorId),
            "FINDING_CREATED", "CaAuditFinding",
            null, ref, "Finding created: " + req.getTitle() + " | ETB " + total);

        return mapFinding(entity);
    }

    @Transactional(readOnly = true)
    public List<CaFindingResponse> getFindings(UUID caseId) {
        getAndValidateCase(caseId);
        return findingRepository.findByAuditCaseIdOrderByCreatedAtDesc(caseId)
            .stream().map(this::mapFinding).collect(Collectors.toList());
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // WORKING PAPERS  FR-04.2-10
    // ═══════════════════════════════════════════════════════════════════════════

    @Transactional
    public CaWorkingPaperResponse createWorkingPaper(UUID caseId,
                                                      CreateWorkingPaperRequest req,
                                                      String actorId) {
        ApAuditCaseEntity c = getAndValidateCase(caseId);
        String ref = nextWorkingPaperRef(caseId);

        CaWorkingPaperEntity entity = CaWorkingPaperEntity.builder()
            .auditCase(c)
            .paperReference(ref)
            .title(req.getTitle())
            .category(req.getCategory())
            .workPerformed(req.getWorkPerformed())
            .conclusions(req.getConclusions())
            .documentUrl(req.getDocumentUrl())
            .status("DRAFT")
            .preparedBy(actorId)
            .preparedAt(OffsetDateTime.now())
            .build();
        entity = workingPaperRepository.save(entity);

        auditTrailService.logAction(caseId, parseActorId(actorId),
            "WORKING_PAPER_CREATED", "CaWorkingPaper",
            null, ref, "Working paper: " + req.getTitle());

        return mapWorkingPaper(entity);
    }

    @Transactional(readOnly = true)
    public List<CaWorkingPaperResponse> getWorkingPapers(UUID caseId) {
        getAndValidateCase(caseId);
        return workingPaperRepository.findByAuditCaseIdOrderByCreatedAtDesc(caseId)
            .stream().map(this::mapWorkingPaper).collect(Collectors.toList());
    }

    // Removed duplicates

    // ═══════════════════════════════════════════════════════════════════════════
    // QUERY SHEETS  (existing, enhanced)
    // ═══════════════════════════════════════════════════════════════════════════

    @Transactional
    public CaQuerySheetEntity createQuerySheet(UUID caseId,
                                                CreateQuerySheetRequest request,
                                                String actorId) {
        ApAuditCaseEntity c = getAndValidateCase(caseId);
        CaQuerySheetEntity entity = CaQuerySheetEntity.builder()
            .auditCase(c)
            .question(request.getQuestion())
            .supportingContext(request.getSupportingContext())
            .requestedInformation(request.getRequestedInformation())
            .dueDate(request.getDueDate() != null ? OffsetDateTime.parse(request.getDueDate()) : null)
            .status("OPEN")
            .auditorComments(null)
            .build();
        entity = querySheetRepository.save(entity);

        auditTrailService.logAction(caseId, parseActorId(actorId),
            "QUERY_SHEET_CREATED", "CaQuerySheet",
            null, entity.getId().toString(),
            "Query: " + request.getQuestion());

        return entity;
    }

    @Transactional(readOnly = true)
    public List<CaQuerySheetEntity> getQuerySheets(UUID caseId) {
        getAndValidateCase(caseId);
        return querySheetRepository.findByAuditCaseId(caseId);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DOCUMENT REQUESTS (FR-04.4-04)
    // ═══════════════════════════════════════════════════════════════════════════

    @Transactional
    public CaDocumentRequestEntity addDocumentRequest(UUID caseId, AddDocumentRequestDto request, String actorId) {
        ApAuditCaseEntity c = getAndValidateCase(caseId);

        mor.itas.domain.model.ca.CaDocumentRequest domainRequest = mor.itas.domain.model.ca.CaDocumentRequest.builder()
            .caseId(caseId)
            .requestDescription(request.getRequestDescription())
            .requestedDocument(request.getRequestedDocument())
            .dueDate(request.getDueDate() != null ? OffsetDateTime.parse(request.getDueDate()) : OffsetDateTime.now().plusDays(14))
            .status("REQUESTED")
            .requestingAuditor(actorId)
            .createdAt(OffsetDateTime.now())
            .build();

        CaDocumentRequestEntity entity = CaDocumentRequestEntity.builder()
            .auditCase(c)
            .requestDescription(domainRequest.getRequestDescription())
            .requestedDocument(domainRequest.getRequestedDocument())
            .dueDate(domainRequest.getDueDate())
            .status(domainRequest.getStatus())
            .requestingAuditor(domainRequest.getRequestingAuditor())
            .build();

        entity = documentRequestRepository.save(entity);

        auditTrailService.logAction(caseId, parseActorId(actorId),
            "DOCUMENT_REQUEST_CREATED", "CaDocumentRequest",
            null, entity.getId().toString(),
            "Requested: " + request.getRequestedDocument());

        return entity;
    }

    @Transactional(readOnly = true)
    public List<CaDocumentRequestEntity> getDocumentRequests(UUID caseId) {
        getAndValidateCase(caseId);
        return documentRequestRepository.findByAuditCaseId(caseId);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ASSERTIONS  (existing, enhanced)
    // ═══════════════════════════════════════════════════════════════════════════

    @Transactional
    public CaAuditAssertionEntity recordAssertion(UUID caseId,
                                                   AddAuditAssertionRequest request,
                                                   String actorId) {
        ApAuditCaseEntity c = getAndValidateCase(caseId);
        
        mor.itas.domain.model.ca.CaAuditAssertion domainAssertion = mor.itas.domain.model.ca.CaAuditAssertion.builder()
            .caseId(caseId)
            .financialArea(request.getFinancialArea())
            .assertionType(request.getAssertionType())
            .expectedValue(request.getExpectedValue())
            .actualValue(request.getActualValue())
            .verificationResult(request.getVerificationResult())
            .explanation(request.getExplanation())
            .finding(request.getFinding())
            .conclusion(request.getConclusion())
            .createdBy(actorId)
            .createdAt(OffsetDateTime.now())
            .build();

        CaAuditAssertionEntity entity = CaAuditAssertionEntity.builder()
            .auditCase(c)
            .financialArea(domainAssertion.getFinancialArea())
            .assertionType(domainAssertion.getAssertionType())
            .expectedValue(domainAssertion.getExpectedValue())
            .actualValue(domainAssertion.getActualValue())
            .verificationResult(domainAssertion.getVerificationResult())
            .explanation(domainAssertion.getExplanation())
            .finding(domainAssertion.getFinding())
            .conclusion(domainAssertion.getConclusion())
            .createdBy(domainAssertion.getCreatedBy())
            .build();
            
        entity = assertionRepository.save(entity);

        auditTrailService.logAction(caseId, parseActorId(actorId),
            "ASSERTION_RECORDED", "CaAuditAssertion",
            null, entity.getId().toString(),
            request.getFinancialArea() + " → " + request.getVerificationResult());

        return entity;
    }

    @Transactional(readOnly = true)
    public List<CaAuditAssertionEntity> getAssertions(UUID caseId) {
        getAndValidateCase(caseId);
        return assertionRepository.findByAuditCaseId(caseId);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // EXECUTION REPORT  FR-04.4-10 (existing flow, full audit trail)
    // ═══════════════════════════════════════════════════════════════════════════

    @Transactional
    public CaExecutionReportEntity submitExecutionReport(UUID caseId,
                                                          SubmitCaReportRequest request,
                                                          String actorId) {
        ApAuditCaseEntity c = getAndValidateCase(caseId);

        CaExecutionReportEntity report = CaExecutionReportEntity.builder()
            .auditCase(c)
            .reportContent(request.getReportContent())
            .status("SUBMITTED")
            .approvalLevel(1)
            .caatEligible(request.getCaatEligible())
            .createdBy(actorId)
            .build();

        stateMachine.advance(c, "EXECUTION_REPORT");
        report = executionReportRepository.save(report);

        auditTrailService.logAction(caseId, parseActorId(actorId),
            "EXECUTION_REPORT_SUBMITTED", "CaExecutionReport",
            "FIELDWORK", "EXECUTION_REPORT",
            "Execution report submitted for Team Leader review");

        return report;
    }

    @Transactional
    public CaExecutionReportEntity reviewExecutionReport(UUID caseId,
                                                          ReviewCaReportRequest request,
                                                          String actorId) {
        ApAuditCaseEntity c = getAndValidateCase(caseId);
        CaExecutionReportEntity report = executionReportRepository
            .findTopByAuditCaseIdOrderByCreatedAtDesc(caseId)
            .orElseThrow(() -> new CaseNotFoundException("No execution report found for case: " + caseId));

        String prevStatus = report.getStatus();

        if ("APPROVED".equals(request.getDecision())) {
            if (report.getApprovalLevel() == 1) {
                report.setApprovalLevel(2);
                report.setStatus("TEAM_LEADER_APPROVED");
                stateMachine.advance(c, "DRAFT_REPORT");
            } else {
                report.setStatus("FINAL_APPROVED");
                stateMachine.advance(c, "DRAFT_REPORT");
            }
        } else if ("REJECTED".equals(request.getDecision())) {
            report.setStatus("REJECTED");
            stateMachine.advance(c, "FIELDWORK");
        }

        saveApprovalStep(c, "EXECUTION_REPORT", report.getId(),
            report.getApprovalLevel() == 1 ? (short)1 : (short)2,
            report.getApprovalLevel() == 1 ? "TEAM_LEADER" : "DIRECTOR",
            actorId, request.getDecision(), request.getComments());

        auditTrailService.logAction(caseId, parseActorId(actorId),
            "EXECUTION_REPORT_REVIEWED", "CaExecutionReport",
            prevStatus, report.getStatus(),
            "Decision: " + request.getDecision()
                + (request.getComments() != null ? " — " + request.getComments() : ""));

        return executionReportRepository.save(report);
    }

    @Transactional(readOnly = true)
    public List<CaExecutionReportEntity> getExecutionReports(UUID caseId) {
        getAndValidateCase(caseId);
        return executionReportRepository.findByAuditCaseId(caseId);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DRAFT REPORT  FR-04.4-18, 19, 20
    // ═══════════════════════════════════════════════════════════════════════════

    @Transactional
    public CaDraftReportResponse submitDraftReport(UUID caseId,
                                                    SubmitDraftReportRequest req,
                                                    String actorId) {
        ApAuditCaseEntity c = getAndValidateCase(caseId);

        // Auto-compute totals from confirmed findings
        BigDecimal principal = findingRepository.sumTotalTaxImpact(caseId);
        if (principal == null) principal = BigDecimal.ZERO;
        BigDecimal penalty = principal.multiply(new BigDecimal("0.20"))
            .setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = principal.add(penalty);

        String ref = nextReportRef(caseId);

        CaDraftReportEntity entity = CaDraftReportEntity.builder()
            .auditCase(c)
            .reportReference(ref)
            .executiveSummary(req.getExecutiveSummary())
            .scopeAndObjectives(req.getScopeAndObjectives())
            .methodology(req.getMethodology())
            .findingsSummary(req.getFindingsSummary())
            .recommendedAdjustments(req.getRecommendedAdjustments())
            .statutoryRecommendations(req.getStatutoryRecommendations())
            .ifrsComplianceNotes(req.getIfrsComplianceNotes())
            .totalPrincipalTax(principal)
            .totalPenalty(penalty)
            .totalInterest(BigDecimal.ZERO)
            .totalAssessment(total)
            .status("SUBMITTED_TO_TL")
            .createdBy(actorId)
            .build();
        entity = draftReportRepository.save(entity);

        stateMachine.advance(c, "APPROVALS");

        eventPublisher.publish(CaDraftReportSubmittedEvent.builder()
            .caseId(caseId)
            .draftReportId(entity.getId())
            .reportReference(ref)
            .totalPrincipalTax(principal)
            .totalPenalty(penalty)
            .totalAssessment(total)
            .submittedById(actorId)
            .build());

        auditTrailService.logAction(caseId, parseActorId(actorId),
            "DRAFT_REPORT_SUBMITTED", "CaDraftReport",
            "DRAFT_REPORT", "APPROVALS",
            "Draft report " + ref + " submitted — ETB " + total);

        return mapDraftReport(entity);
    }

    @Transactional
    public CaDraftReportResponse reviewDraftReport(UUID caseId,
                                                    ReviewDraftReportRequest req,
                                                    String actorId) {
        ApAuditCaseEntity c = getAndValidateCase(caseId);
        CaDraftReportEntity entity = draftReportRepository
            .findTopByAuditCaseIdOrderByCreatedAtDesc(caseId)
            .orElseThrow(() -> new CaseNotFoundException("No draft report found for case: " + caseId));

        String prevStatus = entity.getStatus();

        // FR-04.4-28 — fraud flag during review
        if (Boolean.TRUE.equals(req.getTriggerFraudInvestigation())) {
            stateMachine.advance(c, "FRAUD_INVESTIGATION");
            entity.setStatus("FRAUD_ESCALATED");
            auditTrailService.logAction(caseId, parseActorId(actorId),
                "FRAUD_ESCALATION_TRIGGERED", "CaDraftReport",
                prevStatus, "FRAUD_INVESTIGATION", req.getFraudReason());
            return mapDraftReport(draftReportRepository.save(entity));
        }

        if ("APPROVED".equals(req.getDecision())) {
            if ("SUBMITTED_TO_TL".equals(entity.getStatus())) {
                entity.setStatus("SUBMITTED_TO_DIRECTOR");
                entity.setTeamLeaderComments(req.getComments());
                entity.setTeamLeaderReviewedAt(OffsetDateTime.now());
                entity.setTeamLeaderReviewedBy(actorId);
                saveApprovalStep(c, "DRAFT_REPORT", entity.getId(), (short)1,
                    "TEAM_LEADER", actorId, "APPROVED", req.getComments());
            } else {
                entity.setStatus("FINALIZED");
                entity.setDirectorComments(req.getComments());
                entity.setDirectorReviewedAt(OffsetDateTime.now());
                entity.setDirectorReviewedBy(actorId);
                saveApprovalStep(c, "DRAFT_REPORT", entity.getId(), (short)2,
                    "DIRECTOR", actorId, "APPROVED", req.getComments());
            }
        } else if ("REJECTED".equals(req.getDecision())) {
            entity.setStatus("REJECTED");
            if ("SUBMITTED_TO_TL".equals(prevStatus)) {
                entity.setTeamLeaderComments(req.getComments());
                entity.setTeamLeaderReviewedAt(OffsetDateTime.now());
                entity.setTeamLeaderReviewedBy(actorId);
                saveApprovalStep(c, "DRAFT_REPORT", entity.getId(), (short)1,
                    "TEAM_LEADER", actorId, "REJECTED", req.getComments());
            } else {
                entity.setDirectorComments(req.getComments());
                entity.setDirectorReviewedAt(OffsetDateTime.now());
                entity.setDirectorReviewedBy(actorId);
                saveApprovalStep(c, "DRAFT_REPORT", entity.getId(), (short)2,
                    "DIRECTOR", actorId, "REJECTED", req.getComments());
            }
            stateMachine.advance(c, "DRAFT_REPORT");
        }

        entity.setUpdatedAt(OffsetDateTime.now());
        entity = draftReportRepository.save(entity);

        auditTrailService.logAction(caseId, parseActorId(actorId),
            "DRAFT_REPORT_REVIEWED", "CaDraftReport",
            prevStatus, entity.getStatus(),
            "Decision: " + req.getDecision());

        return mapDraftReport(entity);
    }

    @Transactional
    public CaDraftReportResponse dispatchReportToTaxpayer(UUID caseId,
                                                           DispatchReportRequest req,
                                                           String actorId) {
        ApAuditCaseEntity c = getAndValidateCase(caseId);
        CaDraftReportEntity entity = draftReportRepository
            .findTopByAuditCaseIdOrderByCreatedAtDesc(caseId)
            .orElseThrow(() -> new CaseNotFoundException("No draft report found"));

        if (!"FINALIZED".equals(entity.getStatus())) {
            throw new InvalidCaseStateException(
                "Report must be FINALIZED before dispatch", entity.getStatus());
        }

        OffsetDateTime sentAt = OffsetDateTime.now();
        OffsetDateTime objectionDeadline = sentAt.plusDays(req.getObjectionWindowDays());
        entity.setSentToTaxpayerAt(sentAt);
        entity.setSentBy(actorId);
        entity.setTaxpayerObjectionDeadline(objectionDeadline);
        entity.setStatus("DISPATCHED");
        entity.setUpdatedAt(OffsetDateTime.now());
        entity = draftReportRepository.save(entity);

        stateMachine.advance(c, "NOTICE_SENT");

        auditTrailService.logAction(caseId, parseActorId(actorId),
            "REPORT_DISPATCHED_TO_TAXPAYER", "CaDraftReport",
            "FINALIZED", "DISPATCHED",
            "Objection window: " + req.getObjectionWindowDays() + " days");

        return mapDraftReport(entity);
    }

    @Transactional(readOnly = true)
    public List<CaDraftReportResponse> getDraftReports(UUID caseId) {
        getAndValidateCase(caseId);
        return draftReportRepository.findByAuditCaseIdOrderByCreatedAtDesc(caseId)
            .stream().map(this::mapDraftReport).collect(Collectors.toList());
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // EXIT CONFERENCE  FR-04.4-18, 19
    // ═══════════════════════════════════════════════════════════════════════════

    @Transactional
    public CaExitConferenceResponse scheduleExitConference(UUID caseId,
                                                            ScheduleExitConferenceRequest req,
                                                            String actorId) {
        ApAuditCaseEntity c = getAndValidateCase(caseId);
        CaExitConferenceEntity entity = CaExitConferenceEntity.builder()
            .auditCase(c)
            .scheduledDate(LocalDate.parse(req.getScheduledDate()))
            .scheduledTime(req.getScheduledTime())
            .venue(req.getVenue())
            .agendaItems(req.getAgendaItems())
            .attendees(req.getAttendees())
            .status("SCHEDULED")
            .createdBy(actorId)
            .build();
        entity = exitConferenceRepository.save(entity);

        auditTrailService.logAction(caseId, parseActorId(actorId),
            "EXIT_CONFERENCE_SCHEDULED", "CaExitConference",
            null, entity.getId().toString(),
            "Exit conference scheduled for " + req.getScheduledDate());

        return mapExitConference(entity);
    }

    @Transactional
    public CaExitConferenceResponse recordExitConferenceResults(UUID caseId,
                                                                 RecordExitConferenceResultsRequest req,
                                                                 String actorId) {
        ApAuditCaseEntity c = getAndValidateCase(caseId);
        CaExitConferenceEntity entity = exitConferenceRepository
            .findTopByAuditCaseIdOrderByCreatedAtDesc(caseId)
            .orElseThrow(() -> new CaseNotFoundException("No exit conference found"));

        entity.setDiscussionNotes(req.getDiscussionNotes());
        entity.setTaxpayerResponseNotes(req.getTaxpayerResponseNotes());
        entity.setAttendanceConfirmed(Boolean.TRUE.equals(req.getAttendanceConfirmed()));
        entity.setSignedByTaxpayer(Boolean.TRUE.equals(req.getSignedByTaxpayer()));
        if (req.getSignedDate() != null) entity.setSignedDate(LocalDate.parse(req.getSignedDate()));
        entity.setStatus(Boolean.TRUE.equals(req.getSignedByTaxpayer()) ? "SIGNED" : "CONDUCTED");
        entity.setUpdatedAt(OffsetDateTime.now());
        entity = exitConferenceRepository.save(entity);

        auditTrailService.logAction(caseId, parseActorId(actorId),
            "EXIT_CONFERENCE_COMPLETED", "CaExitConference",
            "SCHEDULED", entity.getStatus(), "Exit conference conducted");

        return mapExitConference(entity);
    }

    @Transactional(readOnly = true)
    public List<CaExitConferenceResponse> getExitConferences(UUID caseId) {
        getAndValidateCase(caseId);
        return exitConferenceRepository.findByAuditCaseIdOrderByCreatedAtDesc(caseId)
            .stream().map(this::mapExitConference).collect(Collectors.toList());
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ASSESSMENT NOTICE  FR-04.4-29, 30, 31, 32
    // ═══════════════════════════════════════════════════════════════════════════

    @Transactional
    public CaAssessmentNoticeResponse generateAssessmentNotice(UUID caseId,
                                                                GenerateAssessmentNoticeRequest req,
                                                                String actorId) {
        ApAuditCaseEntity c = getAndValidateCase(caseId);
        CaAssessmentNoticeEntity notice = noticeGenerator.generate(c, req, actorId);

        auditTrailService.logAction(caseId, parseActorId(actorId),
            "ASSESSMENT_NOTICE_GENERATED", "CaAssessmentNotice",
            null, notice.getNoticeNumber(),
            "Assessment notice " + notice.getNoticeNumber()
                + " — total ETB " + notice.getTotalAssessmentDue());

        return mapNotice(notice);
    }

    @Transactional
    public CaAssessmentNoticeResponse issueAssessmentNotice(UUID caseId, UUID noticeId,
                                                             String actorId) {
        getAndValidateCase(caseId);
        CaAssessmentNoticeEntity notice = noticeRepository.findById(noticeId)
            .orElseThrow(() -> new CaseNotFoundException("Notice not found: " + noticeId));
        notice.setStatus("ISSUED");
        notice.setUpdatedAt(OffsetDateTime.now());
        notice = noticeRepository.save(notice);

        eventPublisher.publish(CaAssessmentNoticeIssuedEvent.builder()
            .caseId(caseId)
            .noticeId(notice.getId())
            .noticeNumber(notice.getNoticeNumber())
            .taxpayerId(getAndValidateCase(caseId).getTaxpayerId())
            .totalAssessmentDue(notice.getTotalAssessmentDue())
            .statutoryDueDate(notice.getStatutoryDueDate())
            .issuedById(actorId)
            .build());

        auditTrailService.logAction(caseId, parseActorId(actorId),
            "ASSESSMENT_NOTICE_ISSUED", "CaAssessmentNotice",
            "DRAFT", "ISSUED", "Notice " + notice.getNoticeNumber() + " issued to taxpayer");

        return mapNotice(notice);
    }

    @Transactional(readOnly = true)
    public List<CaAssessmentNoticeResponse> getAssessmentNotices(UUID caseId) {
        getAndValidateCase(caseId);
        return noticeRepository.findByAuditCaseIdOrderByCreatedAtDesc(caseId)
            .stream().map(this::mapNotice).collect(Collectors.toList());
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TAXPAYER RESPONSE  FR-04.4-27, 30
    // ═══════════════════════════════════════════════════════════════════════════

    @Transactional
    public CaTaxpayerResponseDto recordTaxpayerResponse(UUID caseId,
                                                         RecordTaxpayerResponseRequest req,
                                                         String actorId) {
        ApAuditCaseEntity c = getAndValidateCase(caseId);

        CaAssessmentNoticeEntity notice = req.getNoticeId() != null
            ? noticeRepository.findById(req.getNoticeId()).orElse(null) : null;
        CaDraftReportEntity report = req.getDraftReportId() != null
            ? draftReportRepository.findById(req.getDraftReportId()).orElse(null) : null;

        CaTaxpayerResponseEntity entity = CaTaxpayerResponseEntity.builder()
            .auditCase(c)
            .notice(notice)
            .draftReport(report)
            .responseType(req.getResponseType())
            .responseText(req.getResponseText())
            .submittedBy(req.getSubmittedBy())
            .documentUrls(req.getDocumentUrls())
            .status("RECEIVED")
            .build();
        entity = taxpayerResponseRepository.save(entity);

        // If objection, update notice status
        if ("OBJECTION".equals(req.getResponseType()) && notice != null) {
            notice.setObjectionStatus("OBJECTION_LODGED");
            notice.setObjectionLodgedAt(OffsetDateTime.now());
            notice.setObjectionDetails(req.getResponseText());
            notice.setUpdatedAt(OffsetDateTime.now());
            noticeRepository.save(notice);
        }

        stateMachine.advance(c, "TAXPAYER_RESPONSE");

        auditTrailService.logAction(caseId, parseActorId(actorId),
            "TAXPAYER_RESPONSE_RECEIVED", "CaTaxpayerResponse",
            "NOTICE_SENT", "TAXPAYER_RESPONSE",
            req.getResponseType() + " from " + req.getSubmittedBy());

        return mapTaxpayerResponse(entity);
    }

    @Transactional(readOnly = true)
    public List<CaTaxpayerResponseDto> getTaxpayerResponses(UUID caseId) {
        getAndValidateCase(caseId);
        return taxpayerResponseRepository.findByAuditCaseIdOrderByCreatedAtDesc(caseId)
            .stream().map(this::mapTaxpayerResponse).collect(Collectors.toList());
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CLOSE CASE
    // ═══════════════════════════════════════════════════════════════════════════

    @Transactional
    public CaCaseOverviewResponse closeCase(UUID caseId, String actorId) {
        ApAuditCaseEntity c = getAndValidateCase(caseId);
        stateMachine.advance(c, "COMPLETED");
        c.setStatus("COMPLETED");
        caseRepository.save(c);

        BigDecimal totalAssessed = findingRepository.sumTotalTaxImpact(caseId);
        eventPublisher.publish(CaCaseClosedEvent.builder()
            .caseId(caseId)
            .caseNumber(c.getCaseNumber())
            .taxpayerId(c.getTaxpayerId())
            .taxpayerName(c.getTaxpayerName())
            .taxCenterCode(c.getTaxCenterCode())
            .segment(c.getSegment())
            .sector(c.getSector())
            .grandTotalAssessed(totalAssessed)
            .fraudReferralMade(findingRepository.existsByAuditCaseIdAndIndicatesFraudTrue(caseId))
            .closedById(actorId)
            .build());

        auditTrailService.logAction(caseId, parseActorId(actorId),
            "COMPREHENSIVE_AUDIT_CLOSED", "ApAuditCase",
            "TAXPAYER_RESPONSE", "COMPLETED", "Comprehensive audit closed");

        return getCaseOverview(caseId);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PRIVATE HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    public ApAuditCaseEntity getAndValidateCase(UUID caseId) {
        ApAuditCaseEntity c = caseRepository.findById(caseId)
            .orElseThrow(() -> new CaseNotFoundException("Case not found: " + caseId));
        if (!"COMPREHENSIVE_AUDIT".equalsIgnoreCase(c.getAuditType()) && !"COMPREHENSIVE".equalsIgnoreCase(c.getAuditType())) {
            throw new InvalidCaseStateException(
                "Case is not a Comprehensive Audit.", c.getStatus());
        }
        return c;
    }

    public String resolveUserDisplayName(String userId, String defaultName) {
        if (userId == null || userId.isBlank()) return defaultName;
        if (userJpaRepository != null) {
            try {
                var uOpt = userJpaRepository.findByUsername(userId);
                if (uOpt.isPresent() && uOpt.get().getFullName() != null) {
                    return uOpt.get().getFullName();
                }
            } catch (Exception ignored) {}
        }
        return userId;
    }

    private void saveApprovalStep(ApAuditCaseEntity c, String entityType, UUID entityId,
                                   short level, String role, String actorId,
                                   String decision, String comments) {
        approvalStepRepository.save(CaApprovalStepEntity.builder()
            .auditCase(c)
            .entityType(entityType)
            .entityId(entityId)
            .approvalLevel(level)
            .approverRole(role)
            .approverId(actorId)
            .decision(decision)
            .comments(comments)
            .build());
    }

    // ── Mappers ───────────────────────────────────────────────────────────────
    private CaCaatEligibilityResponse mapEligibility(CaCaatEligibilityEntity e) {
        return CaCaatEligibilityResponse.builder()
            .id(e.getId()).auditCaseId(e.getAuditCase().getId())
            .isEligible(e.getIsEligible()).eligibilityReason(e.getEligibilityReason())
            .annualTurnover(e.getAnnualTurnover()).hasErpSystem(e.getHasErpSystem())
            .hasElectronicRecords(e.getHasElectronicRecords())
            .taxpayerSegment(e.getTaxpayerSegment()).status(e.getStatus())
            .assessedBy(e.getAssessedBy()).assessedAt(e.getAssessedAt())
            .overridden(e.getOverridden()).overrideReason(e.getOverrideReason())
            .createdAt(e.getCreatedAt()).build();
    }

    private CaCaatRunResponse mapCaatRun(CaCaatRunEntity e) {
        List<CaCaatRunResponse.CaCaatRuleSummary> rules = e.getRules().stream()
            .map(r -> CaCaatRunResponse.CaCaatRuleSummary.builder()
                .id(r.getId()).ruleCode(r.getRuleCode()).ruleName(r.getRuleName())
                .category(r.getCategory()).discrepanciesCount(r.getDiscrepanciesCount())
                .varianceAmount(r.getVarianceAmount()).status(r.getStatus()).build())
            .collect(Collectors.toList());
        List<CaCaatRunResponse.CaBenfordDigitSummary> benford = e.getBenfordStats().stream()
            .map(b -> CaCaatRunResponse.CaBenfordDigitSummary.builder()
                .digit(b.getDigit()).expectedPct(b.getExpectedPct())
                .observedPct(b.getObservedPct()).observedCount(b.getObservedCount())
                .deviation(b.getDeviation()).isAnomalous(b.getIsAnomalous()).build())
            .collect(Collectors.toList());
        return CaCaatRunResponse.builder()
            .id(e.getId()).auditCaseId(e.getAuditCase().getId())
            .runReference(e.getRunReference()).caatToolName(e.getCaatToolName())
            .samplingMethod(e.getSamplingMethod()).status(e.getStatus())
            .totalRecordsMined(e.getTotalRecordsMined()).totalFlagged(e.getTotalFlagged())
            .totalFlaggedExposure(e.getTotalFlaggedExposure())
            .auditorNotes(e.getAuditorNotes()).executionLog(e.getExecutionLog())
            .executedBy(e.getExecutedBy()).startedAt(e.getStartedAt())
            .completedAt(e.getCompletedAt()).createdAt(e.getCreatedAt())
            .rules(rules).benfordStats(benford)
            .exceptionsCount(e.getExceptions() != null ? e.getExceptions().size() : 0)
            .build();
    }

    private CaCaatExceptionResponse mapException(CaCaatExceptionEntity e) {
        return CaCaatExceptionResponse.builder()
            .id(e.getId()).auditCaseId(e.getAuditCase().getId())
            .caatRunId(e.getCaatRun().getId()).ruleCode(e.getRuleCode())
            .transactionRef(e.getTransactionRef()).transactionDate(e.getTransactionDate())
            .accountName(e.getAccountName()).counterparty(e.getCounterparty())
            .amount(e.getAmount()).anomalyType(e.getAnomalyType())
            .riskLevel(e.getRiskLevel()).taxHead(e.getTaxHead()).details(e.getDetails())
            .actionTakenNotes(e.getActionTakenNotes())
            .convertedToFinding(e.getConvertedToFinding()).findingId(e.getFindingId())
            .status(e.getStatus()).createdAt(e.getCreatedAt()).build();
    }

    private CaEntryConferenceResponse mapEntryConference(CaEntryConferenceEntity e) {
        return CaEntryConferenceResponse.builder()
            .id(e.getId()).auditCaseId(e.getAuditCase().getId())
            .scheduledDate(e.getScheduledDate()).scheduledTime(e.getScheduledTime())
            .venue(e.getVenue()).internalControlsReview(e.getInternalControlsReview())
            .premisesInspectionNotes(e.getPremisesInspectionNotes())
            .audioRecordingUrl(e.getAudioRecordingUrl()).attendees(e.getAttendees())
            .taxpayerConfirmedReceipt(e.getTaxpayerConfirmedReceipt())
            .taxpayerReceiptDate(e.getTaxpayerReceiptDate())
            .status(e.getStatus()).createdBy(e.getCreatedBy())
            .teamLeaderApproved(e.getTeamLeaderApproved())
            .reviewedBy(e.getReviewedBy()).reviewedAt(e.getReviewedAt())
            .createdAt(e.getCreatedAt()).build();
    }

    private CaBalanceSheetItemResponse mapBalanceSheet(CaBalanceSheetItemEntity e) {
        return CaBalanceSheetItemResponse.builder()
            .id(e.getId()).auditCaseId(e.getAuditCase().getId())
            .component(e.getComponent()).assertionType(e.getAssertionType())
            .auditeeBalance(e.getAuditeeBalance()).auditedBalance(e.getAuditedBalance())
            .variance(e.getVariance()).ifrsCompliance(e.getIfrsCompliance())
            .notes(e.getNotes()).auditorConclusion(e.getAuditorConclusion())
            .createdBy(e.getCreatedBy()).createdAt(e.getCreatedAt()).build();
    }

    private CaBenchmarkAnalysisResponse mapBenchmark(CaBenchmarkAnalysisEntity e) {
        return CaBenchmarkAnalysisResponse.builder()
            .id(e.getId()).auditCaseId(e.getAuditCase().getId())
            .ratioName(e.getRatioName()).taxpayerValue(e.getTaxpayerValue())
            .benchmarkValue(e.getBenchmarkValue()).unit(e.getUnit())
            .variancePct(e.getVariancePct()).riskLevel(e.getRiskLevel())
            .interpretation(e.getInterpretation()).industryCode(e.getIndustryCode())
            .dataYear(e.getDataYear()).createdBy(e.getCreatedBy()).createdAt(e.getCreatedAt()).build();
    }

    private CaThirdPartyMatchResponse mapThirdParty(CaThirdPartyMatchEntity e) {
        return CaThirdPartyMatchResponse.builder()
            .id(e.getId()).auditCaseId(e.getAuditCase().getId())
            .dataSource(e.getDataSource()).declaredValue(e.getDeclaredValue())
            .thirdPartyValue(e.getThirdPartyValue()).variance(e.getVariance())
            .matchStatus(e.getMatchStatus()).discrepancyNotes(e.getDiscrepancyNotes())
            .periodCovered(e.getPeriodCovered()).createdBy(e.getCreatedBy())
            .createdAt(e.getCreatedAt()).build();
    }

    private CaReconciliationResponse mapReconciliation(CaReconciliationEntity e) {
        return CaReconciliationResponse.builder()
            .id(e.getId()).auditCaseId(e.getAuditCase().getId())
            .reconciliationType(e.getReconciliationType())
            .sourceALabel(e.getSourceALabel()).sourceAAmount(e.getSourceAAmount())
            .sourceBLabel(e.getSourceBLabel()).sourceBAmount(e.getSourceBAmount())
            .sourceCLabel(e.getSourceCLabel()).sourceCAmount(e.getSourceCAmount())
            .variance(e.getVariance()).variancePct(e.getVariancePct())
            .periodCovered(e.getPeriodCovered()).status(e.getStatus())
            .auditorNotes(e.getAuditorNotes()).createdBy(e.getCreatedBy())
            .createdAt(e.getCreatedAt()).build();
    }

    private CaSamplingRecordResponse mapSampling(CaSamplingRecordEntity e) {
        return CaSamplingRecordResponse.builder()
            .id(e.getId()).auditCaseId(e.getAuditCase().getId())
            .samplingType(e.getSamplingType()).targetPopulation(e.getTargetPopulation())
            .populationSize(e.getPopulationSize()).sampleSize(e.getSampleSize())
            .selectionCriteria(e.getSelectionCriteria()).sampleDescription(e.getSampleDescription())
            .findingsSummary(e.getFindingsSummary()).status(e.getStatus())
            .createdBy(e.getCreatedBy()).createdAt(e.getCreatedAt()).build();
    }

    private CaFindingResponse mapFinding(CaAuditFindingEntity e) {
        return CaFindingResponse.builder()
            .id(e.getId()).auditCaseId(e.getAuditCase().getId())
            .findingReference(e.getFindingReference()).auditArea(e.getAuditArea())
            .title(e.getTitle()).description(e.getDescription()).criteria(e.getCriteria())
            .condition(e.getCondition()).cause(e.getCause()).effect(e.getEffect())
            .underDeclaredAmount(e.getUnderDeclaredAmount()).penaltyRate(e.getPenaltyRate())
            .penaltyAmount(e.getPenaltyAmount()).interestAmount(e.getInterestAmount())
            .totalTaxImpact(e.getTotalTaxImpact()).taxType(e.getTaxType())
            .auditorAnalysis(e.getAuditorAnalysis()).conclusion(e.getConclusion())
            .recommendation(e.getRecommendation()).indicatesFraud(e.getIndicatesFraud())
            .fraudIndicators(e.getFraudIndicators()).zoneCode(e.getZoneCode())
            .caatExceptionId(e.getCaatExceptionId()).status(e.getStatus())
            .isSignificant(e.getIsSignificant()).createdBy(e.getCreatedBy())
            .createdAt(e.getCreatedAt()).build();
    }

    private CaWorkingPaperResponse mapWorkingPaper(CaWorkingPaperEntity e) {
        return CaWorkingPaperResponse.builder()
            .id(e.getId()).auditCaseId(e.getAuditCase().getId())
            .paperReference(e.getPaperReference()).title(e.getTitle())
            .category(e.getCategory()).workPerformed(e.getWorkPerformed())
            .conclusions(e.getConclusions()).documentUrl(e.getDocumentUrl())
            .status(e.getStatus()).preparedBy(e.getPreparedBy()).preparedAt(e.getPreparedAt())
            .reviewedBy(e.getReviewedBy()).reviewedAt(e.getReviewedAt())
            .createdAt(e.getCreatedAt()).build();
    }

    private CaDraftReportResponse mapDraftReport(CaDraftReportEntity e) {
        return CaDraftReportResponse.builder()
            .id(e.getId()).auditCaseId(e.getAuditCase().getId())
            .reportReference(e.getReportReference()).executiveSummary(e.getExecutiveSummary())
            .scopeAndObjectives(e.getScopeAndObjectives()).methodology(e.getMethodology())
            .findingsSummary(e.getFindingsSummary())
            .recommendedAdjustments(e.getRecommendedAdjustments())
            .statutoryRecommendations(e.getStatutoryRecommendations())
            .ifrsComplianceNotes(e.getIfrsComplianceNotes())
            .totalPrincipalTax(e.getTotalPrincipalTax()).totalPenalty(e.getTotalPenalty())
            .totalInterest(e.getTotalInterest()).totalAssessment(e.getTotalAssessment())
            .status(e.getStatus()).teamLeaderComments(e.getTeamLeaderComments())
            .teamLeaderReviewedAt(e.getTeamLeaderReviewedAt())
            .teamLeaderReviewedBy(e.getTeamLeaderReviewedBy())
            .directorComments(e.getDirectorComments())
            .directorReviewedAt(e.getDirectorReviewedAt())
            .directorReviewedBy(e.getDirectorReviewedBy())
            .sentToTaxpayerAt(e.getSentToTaxpayerAt())
            .taxpayerObjectionDeadline(e.getTaxpayerObjectionDeadline())
            .undelivered(e.getUndelivered()).createdBy(e.getCreatedBy())
            .createdAt(e.getCreatedAt()).build();
    }

    private CaExitConferenceResponse mapExitConference(CaExitConferenceEntity e) {
        return CaExitConferenceResponse.builder()
            .id(e.getId()).auditCaseId(e.getAuditCase().getId())
            .scheduledDate(e.getScheduledDate()).scheduledTime(e.getScheduledTime())
            .venue(e.getVenue()).agendaItems(e.getAgendaItems())
            .discussionNotes(e.getDiscussionNotes())
            .taxpayerResponseNotes(e.getTaxpayerResponseNotes()).attendees(e.getAttendees())
            .attendanceConfirmed(e.getAttendanceConfirmed()).signedByTaxpayer(e.getSignedByTaxpayer())
            .signedDate(e.getSignedDate()).status(e.getStatus())
            .createdBy(e.getCreatedBy()).createdAt(e.getCreatedAt()).build();
    }

    private CaAssessmentNoticeResponse mapNotice(CaAssessmentNoticeEntity e) {
        List<CaAssessmentNoticeResponse.CaZoneAllocationSummary> zones =
            e.getZoneAllocations() == null ? List.of() :
                e.getZoneAllocations().stream().map(z ->
                    CaAssessmentNoticeResponse.CaZoneAllocationSummary.builder()
                        .id(z.getId()).zoneName(z.getZoneName()).branchCode(z.getBranchCode())
                        .taxDeclared(z.getTaxDeclared()).auditAdjustment(z.getAuditAdjustment())
                        .netPayable(z.getNetPayable()).taxType(z.getTaxType())
                        .periodCovered(z.getPeriodCovered()).build())
                .collect(Collectors.toList());
        return CaAssessmentNoticeResponse.builder()
            .id(e.getId()).auditCaseId(e.getAuditCase().getId())
            .noticeNumber(e.getNoticeNumber()).issueDate(e.getIssueDate())
            .statutoryDueDate(e.getStatutoryDueDate())
            .principalCit(e.getPrincipalCit()).principalVat(e.getPrincipalVat())
            .principalPaye(e.getPrincipalPaye()).principalWht(e.getPrincipalWht())
            .principalTotal(e.getPrincipalTotal()).penaltyPct(e.getPenaltyPct())
            .penaltyAmount(e.getPenaltyAmount()).interestRateAnnual(e.getInterestRateAnnual())
            .interestDays(e.getInterestDays()).interestAmount(e.getInterestAmount())
            .totalAssessmentDue(e.getTotalAssessmentDue()).objectionStatus(e.getObjectionStatus())
            .objectionLodgedAt(e.getObjectionLodgedAt()).objectionDetails(e.getObjectionDetails())
            .taxpayerSigned(e.getTaxpayerSigned()).taxpayerSignedAt(e.getTaxpayerSignedAt())
            .fraudReferralTriggered(e.getFraudReferralTriggered())
            .fraudReferralReason(e.getFraudReferralReason())
            .status(e.getStatus()).issuedBy(e.getIssuedBy()).createdAt(e.getCreatedAt())
            .zoneAllocations(zones).build();
    }

    private CaTaxpayerResponseDto mapTaxpayerResponse(CaTaxpayerResponseEntity e) {
        return CaTaxpayerResponseDto.builder()
            .id(e.getId()).auditCaseId(e.getAuditCase().getId())
            .noticeId(e.getNotice() != null ? e.getNotice().getId() : null)
            .draftReportId(e.getDraftReport() != null ? e.getDraftReport().getId() : null)
            .responseType(e.getResponseType()).responseText(e.getResponseText())
            .submittedBy(e.getSubmittedBy()).submittedAt(e.getSubmittedAt())
            .documentUrls(e.getDocumentUrls()).status(e.getStatus())
            .reviewedBy(e.getReviewedBy()).reviewedAt(e.getReviewedAt())
            .auditorNotes(e.getAuditorNotes()).createdAt(e.getCreatedAt()).build();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // WORKSPACE & FULL DATA INTEGRATION (FR-04.4 End-to-End)
    // ═══════════════════════════════════════════════════════════════════════════

    private boolean isMatchingAuditor(String assignedAuditorId, String filterAuditor) {
        if (assignedAuditorId == null || filterAuditor == null) return false;
        if (assignedAuditorId.equalsIgnoreCase(filterAuditor)) return true;
        String aNorm = assignedAuditorId.replaceFirst("^u-aud-", "").replaceFirst("^auditor-", "").toLowerCase();
        String fNorm = filterAuditor.replaceFirst("^u-aud-", "").replaceFirst("^auditor-", "").toLowerCase();
        if (aNorm.equals(fNorm)) return true;
        try {
            Optional<mor.itas.persistence.jpa.entity.ap.UserEntity> u = userJpaRepository.findByUsername(filterAuditor);
            if (u.isPresent() && u.get().getUserId() != null && u.get().getUserId().toString().equalsIgnoreCase(assignedAuditorId)) {
                return true;
            }
        } catch (Exception ignored) {}
        return false;
    }

    private boolean isMatchingTeamLeader(String assignedTlId, String filterTl) {
        if (assignedTlId == null || filterTl == null) return false;
        if (assignedTlId.equalsIgnoreCase(filterTl)) return true;
        String tNorm = assignedTlId.replaceFirst("^u-tl-", "").replaceFirst("^teamleader-", "").toLowerCase();
        String fNorm = filterTl.replaceFirst("^u-tl-", "").replaceFirst("^teamleader-", "").toLowerCase();
        if (tNorm.equals(fNorm)) return true;
        try {
            Optional<mor.itas.persistence.jpa.entity.ap.UserEntity> u = userJpaRepository.findByUsername(filterTl);
            if (u.isPresent() && u.get().getUserId() != null && u.get().getUserId().toString().equalsIgnoreCase(assignedTlId)) {
                return true;
            }
        } catch (Exception ignored) {}
        return false;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listComprehensiveCases(
            String taxCenter, String auditorId, String teamLeaderId, String status, String actorId) {

        String effectiveTaxCenter = taxCenter;
        String effectiveAuditorId = auditorId;
        String effectiveTeamLeaderId = teamLeaderId;

        if (actorId != null && !actorId.isBlank()) {
            String actorLower = actorId.toLowerCase();
            if (effectiveTaxCenter == null || effectiveTaxCenter.isBlank()) {
                if (actorLower.contains("federal-lto1") || actorLower.contains("lto1")) {
                    effectiveTaxCenter = "federal-lto1";
                } else if (actorLower.contains("federal-lto2") || actorLower.contains("lto2")) {
                    effectiveTaxCenter = "federal-lto2";
                } else if (actorLower.contains("addis_ababa-tc1") || actorLower.contains("tc-aa-01") || actorLower.contains("aa-tc1")) {
                    effectiveTaxCenter = "TC-AA-01";
                } else if (actorLower.contains("addis_ababa-tc2") || actorLower.contains("tc-aa-02") || actorLower.contains("aa-tc2")) {
                    effectiveTaxCenter = "TC-AA-02";
                } else if (actorLower.contains("amhara-tc1") || actorLower.contains("tc-ba-01")) {
                    effectiveTaxCenter = "TC-BA-01";
                }
            }
            if (actorLower.contains("auditor") && (effectiveAuditorId == null || effectiveAuditorId.isBlank())) {
                effectiveAuditorId = actorId;
            } else if (actorLower.contains("teamleader") && (effectiveTeamLeaderId == null || effectiveTeamLeaderId.isBlank())) {
                effectiveTeamLeaderId = actorId;
            }
        }

        final String filterTc = effectiveTaxCenter;
        final String filterAuditor = effectiveAuditorId;
        final String filterTl = effectiveTeamLeaderId;
        final String filterStatus = status;

        List<ApAuditCaseEntity> allCases = caseRepository.findAll().stream()
                .filter(c -> "COMPREHENSIVE_AUDIT".equalsIgnoreCase(c.getAuditType()) || "COMPREHENSIVE".equalsIgnoreCase(c.getAuditType()))
                .collect(Collectors.toList());

        return allCases.stream()
                .filter(c -> {
                    if (filterTc != null && !filterTc.isBlank()) {
                        String tcCode = c.getTaxCenterCode() != null ? c.getTaxCenterCode() : c.getTaxCenter();
                        if (tcCode == null && c.getCaseNumber() != null && c.getCaseNumber().toUpperCase().contains(filterTc.toUpperCase())) {
                            tcCode = filterTc;
                        }
                        if (tcCode != null && !tcCode.equalsIgnoreCase(filterTc)
                                && !tcCode.replace("-", "").equalsIgnoreCase(filterTc.replace("-", ""))
                                && !tcCode.contains(filterTc) && !filterTc.contains(tcCode)) {
                            return false;
                        }
                    }
                    if (filterAuditor != null && !filterAuditor.isBlank()) {
                        if (!isMatchingAuditor(c.getAssignedAuditorId(), filterAuditor)) {
                            return false;
                        }
                    }
                    if (filterTl != null && !filterTl.isBlank()) {
                        if (!isMatchingTeamLeader(c.getAssignedTeamLeaderId(), filterTl)) {
                            return false;
                        }
                    }
                    if (filterStatus != null && !filterStatus.isBlank() && !"ALL".equalsIgnoreCase(filterStatus)) {
                        if (c.getStatus() == null || !c.getStatus().equalsIgnoreCase(filterStatus)) {
                            return false;
                        }
                    }
                    return true;
                })
                .map(c -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", c.getId().toString());
                    m.put("caseNumber", c.getCaseNumber());
                    m.put("tin", c.getTin() != null ? c.getTin() : c.getTaxpayerId());
                    m.put("taxpayerName", c.getTaxpayerName() != null ? c.getTaxpayerName() : c.getTaxpayerId());
                    m.put("taxPeriod", "2024-2025");
                    m.put("auditType", "COMPREHENSIVE_AUDIT");
                    m.put("status", c.getStatus() != null ? c.getStatus() : "IN_PROGRESS");
                    m.put("riskScore", c.getRiskScore() != null ? c.getRiskScore() : 80);
                    m.put("riskCategory", c.getRiskCategory() != null ? c.getRiskCategory() : "HIGH");
                    m.put("dueDate", c.getDueDate() != null ? c.getDueDate().toString() : "2026-11-15");
                    m.put("assignedAuditor", resolveUserDisplayName(c.getAssignedAuditorId(), "Unassigned"));
                    m.put("teamLeader", resolveUserDisplayName(c.getAssignedTeamLeaderId(), "Unassigned"));
                    m.put("requiresAction", "SUBMITTED".equals(c.getStatus()) || "PENDING_DIRECTOR_APPROVAL".equals(c.getStatus()));

                    Map<String, Object> stats = new LinkedHashMap<>();
                    stats.put("proceduresCompleted", 6);
                    stats.put("proceduresTotal", 8);
                    stats.put("evidenceCollected", 4);
                    stats.put("evidenceRequired", 4);
                    stats.put("queriesResolved", 1);
                    stats.put("queriesTotal", 2);
                    stats.put("findings", 3);
                    stats.put("workingPapers", 5);
                    m.put("stats", stats);
                    return m;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> getCaseSnapshot(UUID caseId, String actorId) {
        log.info("Fetching comprehensive audit case snapshot for case: {}", caseId);
        ApAuditCaseEntity auditCase = getAndValidateCase(caseId);

        String tin = auditCase.getTin() != null && !auditCase.getTin().isBlank()
                ? auditCase.getTin() : auditCase.getTaxpayerId();

        Map<String, Object> tpData = null;
        if (mockTaxpayerAdapter != null && tin != null) {
            tpData = mockTaxpayerAdapter.getTaxpayerById(tin);
            if (tpData == null && tin.length() >= 8) {
                String tc = auditCase.getTaxCenterCode() != null ? auditCase.getTaxCenterCode() : auditCase.getTaxCenter();
                for (Map<String, Object> candidate : mockTaxpayerAdapter.getTaxpayersForTaxCenter(tc)) {
                    String cTin = (String) candidate.get("tin");
                    if (cTin != null && (cTin.contains(tin) || tin.contains(cTin))) {
                        tpData = candidate;
                        break;
                    }
                }
            }
        }

        String auditorId = auditCase.getAssignedAuditorId();
        String auditorName = resolveUserDisplayName(auditorId, "Unassigned Auditor");
        String auditorEmail = auditorId != null ? auditorId + "@mor.gov.et" : "auditor@mor.gov.et";

        String tlId = auditCase.getAssignedTeamLeaderId();
        String tlName = resolveUserDisplayName(tlId, "Unassigned Team Leader");
        String tlEmail = tlId != null ? tlId + "@mor.gov.et" : "teamleader@mor.gov.et";

        String tpName = auditCase.getTaxpayerName() != null ? auditCase.getTaxpayerName()
                : (tpData != null && tpData.get("name") != null ? (String) tpData.get("name") : "Taxpayer " + tin);
        String tradeName = tpData != null && tpData.get("trade_name") != null ? (String) tpData.get("trade_name")
                : (tpData != null && tpData.get("legal_name") != null ? (String) tpData.get("legal_name") : tpName);

        // Financial Baseline Calculations
        double baseRev = 70220000.0;
        if (tpData != null) {
            if (tpData.get("annualRevenue") instanceof Number) {
                baseRev = ((Number) tpData.get("annualRevenue")).doubleValue();
            } else if (tpData.get("financial_statements") instanceof List) {
                List<?> stmts = (List<?>) tpData.get("financial_statements");
                if (!stmts.isEmpty() && stmts.get(stmts.size() - 1) instanceof Map) {
                    Map<?, ?> latest = (Map<?, ?>) stmts.get(stmts.size() - 1);
                    if (latest.get("revenue") instanceof Number) {
                        baseRev = ((Number) latest.get("revenue")).doubleValue();
                    }
                }
            }
        }

        double annualCitGross = baseRev;
        double annualVatSales = Math.round(baseRev * 0.974);
        double timsInvoices = Math.round(baseRev * 0.968);
        double vatVariance = annualCitGross - annualVatSales;
        double vatAdjTax = Math.round(vatVariance * 0.15);

        double payrollPnl = Math.round(baseRev * 0.055);
        double payrollPayeRemitted = Math.round(payrollPnl * 0.887);
        double payeVariance = payrollPnl - payrollPayeRemitted;
        double payeAdjTax = Math.round(payeVariance * 0.30);

        double glImportCosts = Math.round(baseRev * 0.375);
        double asycudaImports = Math.round(glImportCosts * 0.915);
        double customsVariance = glImportCosts - asycudaImports;
        double citAdjTax = Math.round(customsVariance * 0.15);

        double principalTax = vatAdjTax + payeAdjTax + citAdjTax;
        double penaltyAmount = Math.round(principalTax * 0.20);
        double interestAmount = Math.round(principalTax * 0.14);
        double totalAssessmentDue = principalTax + penaltyAmount + interestAmount;

        // 1. Audit Case DTO
        Map<String, Object> auditCaseDto = new LinkedHashMap<>();
        auditCaseDto.put("id", auditCase.getId().toString());
        auditCaseDto.put("caseNumber", auditCase.getCaseNumber());
        auditCaseDto.put("taxpayerName", tpName);
        auditCaseDto.put("tradeName", tradeName);
        auditCaseDto.put("taxpayerId", tin);
        auditCaseDto.put("tin", tin);
        auditCaseDto.put("taxPeriod", "2024-2025");
        auditCaseDto.put("taxYear", 2024);
        auditCaseDto.put("auditType", "COMPREHENSIVE_AUDIT");
        auditCaseDto.put("riskScore", auditCase.getRiskScore() != null ? auditCase.getRiskScore()
                : (tpData != null && tpData.get("riskScore") != null ? ((Number) tpData.get("riskScore")).intValue() : 85));
        auditCaseDto.put("riskCategory", auditCase.getRiskPriority() != null ? auditCase.getRiskPriority()
                : (auditCase.getRiskCategory() != null ? auditCase.getRiskCategory() : "HIGH"));
        auditCaseDto.put("riskInformation", tpData != null && tpData.get("riskReason") != null ? (String) tpData.get("riskReason")
                : "Comprehensive multi-tax audit flagged material variance in VAT zero-rated export declarations and related-party asset additions.");
        auditCaseDto.put("auditScope", auditCase.getAuditScope() != null ? auditCase.getAuditScope()
                : "Full-scope audit covering Corporate Income Tax (CIT), Value Added Tax (VAT), Employment PAYE, and Withholding Tax for FY2022-2024.");
        auditCaseDto.put("status", auditCase.getStatus() != null ? auditCase.getStatus() : "IN_PROGRESS");
        auditCaseDto.put("caCurrentPhase", auditCase.getCaCurrentPhase() != null ? auditCase.getCaCurrentPhase() : "FIELDWORK");
        auditCaseDto.put("caWorkflowStatus", auditCase.getCaWorkflowStatus() != null ? auditCase.getCaWorkflowStatus() : "ACTIVE");
        auditCaseDto.put("assignedAuditorId", auditorId);
        auditCaseDto.put("assignedAuditor", auditorName);
        auditCaseDto.put("auditorEmail", auditorEmail);
        auditCaseDto.put("assignedTeamLeaderId", tlId);
        auditCaseDto.put("teamLeader", tlName);
        auditCaseDto.put("teamLeaderEmail", tlEmail);
        auditCaseDto.put("taxCenter", auditCase.getTaxCenter() != null ? auditCase.getTaxCenter() : auditCase.getTaxCenterCode());
        auditCaseDto.put("taxCenterCode", auditCase.getTaxCenterCode());
        auditCaseDto.put("sector", auditCase.getSector());
        auditCaseDto.put("segment", auditCase.getSegment());
        auditCaseDto.put("startDate", auditCase.getStartDate() != null ? auditCase.getStartDate().toString() : "2026-09-01");
        auditCaseDto.put("dueDate", auditCase.getDueDate() != null ? auditCase.getDueDate().toString() : "2026-11-15");
        auditCaseDto.put("createdAt", auditCase.getCreatedAt() != null ? auditCase.getCreatedAt().toString() : OffsetDateTime.now().toString());
        auditCaseDto.put("lastSaved", OffsetDateTime.now().toLocalTime().toString());
        if (tpData != null) {
            auditCaseDto.put("taxpayerDetail", tpData);
        }

        // 2. Procedures
        List<Map<String, Object>> procedures = new ArrayList<>();
        procedures.add(createProcedure(caseId, "AP-C01", "Balance Sheet Financial Assertions & Fixed Assets Audit",
                "Substantiate existence, completeness, and rights of capital equipment and verify wear-and-tear allowances.",
                "Conduct on-site tag verification; match fixed asset additions against ASYCUDA import entries.",
                "COMPLETED", auditorName, "2026-09-15",
                "Verified asset additions against customs Single Administrative Documents. Capital allowance schedules validated.",
                "No material variance in PPE depreciation deductions.",
                "Asset register maintained with serial numbers; physical condition aligns with declared age.",
                List.of("EVD-C01", "EVD-C04"), true, "Existence", "Automated Asset Tag Reconciliation"));

        procedures.add(createProcedure(caseId, "AP-C02", "12-Month VAT Returns vs Profit Tax Gross Sales Reconciliation",
                "Reconcile turnover declared on monthly VAT-03 filings against annual CIT gross income statement revenues.",
                "Run automated script matching TIMS electronic fiscal receipts, monthly VAT declarations, and audited income statements.",
                "COMPLETED", auditorName, "2026-09-25",
                "Identified unexplained turnover variance of ETB " + String.format("%,.0f", vatVariance) + " in monthly VAT declarations.",
                "Additional output VAT of ETB " + String.format("%,.0f", vatAdjTax) + " payable plus 20% statutory penalty.",
                "Taxpayer recorded domestic sales dispatches as zero-rated exports without valid customs documentation.",
                List.of("EVD-C03"), true, "Completeness", "TIMS High-Frequency Sales Matcher"));

        procedures.add(createProcedure(caseId, "AP-C03", "Payroll PAYE Remittances vs P&L Salaries Expense Reconciliation",
                "Verify that all remuneration and executive perquisites deducted in P&L were subjected to statutory PAYE withholding.",
                "Match annual payroll general ledger debits against aggregate 12-month PAYE returns.",
                "COMPLETED", auditorName, "2026-09-30",
                "Variance of ETB " + String.format("%,.0f", payeVariance) + " traced to un-taxed executive housing allowances and offshore bonus payments.",
                "Taxable PAYE shortfall of ETB " + String.format("%,.0f", payeAdjTax) + " assessed.",
                "Executive contracts structured with offshore allowances not declared in local payroll filings.",
                List.of("EVD-C01"), true, "Completeness", "Payroll Ledger Reconciliation Tool"));

        procedures.add(createProcedure(caseId, "AP-C04", "Customs ASYCUDA Import Valuation vs Purchase Ledger Testing",
                "Cross-check import declarations with raw material purchases in cost of goods sold.",
                "Extract customs CIF values; cross-match with general ledger vendor accounts.",
                "COMPLETED", auditorName, "2026-10-10",
                "ETB " + String.format("%,.0f", customsVariance) + " transfer pricing cost uplift added to purchase ledger after customs clearance.",
                "Disallowance of ETB " + String.format("%,.0f", customsVariance) + " non-substantiated cost uplift from taxable income.",
                "Purchase invoices from related entity marked up without economic substance.",
                List.of("EVD-C02"), true, "Valuation", "ASYCUDA Automated Import Bridge"));

        procedures.add(createProcedure(caseId, "AP-C05", "CAAT Forensic Ledger Mining & Benford Statistical Testing",
                "Apply forensic algorithms to manual journal entries and vendor disbursements.",
                "Execute Benford Law first-digit test, weekend posting test, and round-sum threshold queries.",
                "COMPLETED", auditorName, "2026-10-15",
                "Isolated abnormal weekend manual journal entries crediting affiliate accounts.",
                "Finding established under FND-C02 for offshore management charge disallowance.",
                "Journal entries lacked supporting documentation or approvals from CFO.",
                List.of("EVD-C01"), true, "Valuation", "Benford Law Forensic Engine"));

        procedures.add(createProcedure(caseId, "AP-C06", "Inventory Feedstock Shrinkage & Fuel Losses Verification",
                "Test legitimacy of inventory write-off claimed as technical handling evaporation.",
                "Audit technical refinery mass-balance logs, meter readings, and industry evaporation thresholds.",
                "IN_PROGRESS", auditorName, "2026-10-25",
                "Technical standard is 0.4%; taxpayer claimed 3.8% write-off. Excess variance unsupported.",
                "Proposed disallowance of excess shrinkage pending final technical review.",
                "Plant engineering logs do not indicate any catastrophic leakage events.",
                List.of("EVD-C01"), true, "Valuation", "Mass Balance Variance Analyzer"));

        procedures.add(createProcedure(caseId, "AP-C07", "IFRS Method of Accounting & Long-Term Contracts Review",
                "Assess compliance with IFRS 15 and revenue recognition standards.",
                "Review percentage-of-completion calculations for multi-year contracts.",
                "IN_PROGRESS", auditorName, "2026-10-30",
                "Revenue recognized prematurely on uncompleted phase expansion.",
                "Timing adjustment required under IFRS 15 guidelines.",
                "Taxpayer deferred billings while accelerating cost recognition.",
                List.of("EVD-C01"), false, "Presentation", "Contract Milestones Analyzer"));

        procedures.add(createProcedure(caseId, "AP-C08", "Multi-Zone Regional Turnover Consolidation Audit",
                "Verify consolidated regional reporting across operational branch jurisdictions.",
                "Segregate revenues and costs by regional jurisdiction to ensure correct revenue apportionment.",
                "COMPLETED", auditorName, "2026-11-02",
                "Apportioned audit adjustments across regional operational zones; consolidated assessment validated.",
                "Regional assessment schedules ready for multi-zone issuance.",
                "Central Head Office accounts for 51.5% of total tax adjustment.",
                List.of("EVD-C01"), true, "Allocation", "Multi-Jurisdiction Consolidation Tool"));

        // 3. Evidence
        List<Map<String, Object>> evidence = new ArrayList<>();
        evidence.add(createEvidence(caseId, "EVD-C01", "Audited Financial Statements & Tax Computations FY2022-2024",
                "Taxpayer Submission", "2026-09-02", "AP-C01", "Verified",
                "Audited_Financial_Statements_2022_2024_Signed.pdf", "8.4 MB", auditorName,
                "Certified by licensed chartered auditor; validated with corporate register."));
        evidence.add(createEvidence(caseId, "EVD-C02", "ASYCUDA Customs Single Administrative Documents & Manifests",
                "Customs Authority ASYCUDA Bridge", "2026-09-05", "AP-C04", "Verified",
                "ASYCUDA_Import_Declarations_Manifests_FY2024.xlsx", "3.2 MB", auditorName,
                "Extracted directly via automated secure Customs EDI interface."));
        evidence.add(createEvidence(caseId, "EVD-C03", "TIMS Electronic Fiscal Memory Register & Invoice Logs",
                "TIMS Direct API Feed", "2026-09-10", "AP-C02", "Verified",
                "TIMS_Fiscal_Device_Audit_Dump_FY2024.csv", "14.8 MB", auditorName,
                "Cryptographic signature verified across 68,400 fiscal transactions."));
        evidence.add(createEvidence(caseId, "EVD-C04", "Fixed Asset Register, Depreciation Schedules & Physical Tag Log",
                "On-Site Fieldwork Audit", "2026-09-14", "AP-C01", "Verified",
                "Fixed_Asset_Register_Tag_Verification.xlsx", "2.1 MB", auditorName,
                "Physical tag numbers cross-checked during premises inspection."));

        // 4. Analysis (Synthesized from Taxpayer Profile)
        Map<String, Object> analysis = new LinkedHashMap<>();
        analysis.put("caseId", caseId.toString());

        List<Map<String, Object>> annualFinancials = new ArrayList<>();
        annualFinancials.add(createAnnualFinancial("2022", baseRev * 0.78, baseRev * 0.78 * 0.65, baseRev * 0.78 * 0.18));
        annualFinancials.add(createAnnualFinancial("2023", baseRev * 0.89, baseRev * 0.89 * 0.66, baseRev * 0.89 * 0.19));
        annualFinancials.add(createAnnualFinancial("2024", baseRev, baseRev * 0.68, baseRev * 0.20));
        analysis.put("annualFinancials", annualFinancials);

        List<Map<String, Object>> ratios = new ArrayList<>();
        ratios.add(Map.of(
                "name", "Gross Profit Margin",
                "taxpayerValue", 32.0,
                "benchmarkValue", 36.5,
                "unit", "%",
                "variancePct", -4.5,
                "riskLevel", "HIGH",
                "interpretation", "Steady 450 bps margin compression below sector peer average attributable to related-party raw material cost uplifts and unrecorded domestic sales."
        ));
        ratios.add(Map.of(
                "name", "Effective Corporate Tax Rate",
                "taxpayerValue", 11.2,
                "benchmarkValue", 18.5,
                "unit", "%",
                "variancePct", -7.3,
                "riskLevel", "HIGH",
                "interpretation", "Sharp decline in effective tax contribution despite 28% top-line expansion; driven by aggressive offshore management fee deductions."
        ));
        ratios.add(Map.of(
                "name", "Inventory Shrinkage & Loss Ratio",
                "taxpayerValue", 3.8,
                "benchmarkValue", 0.4,
                "unit", "%",
                "variancePct", 3.4,
                "riskLevel", "HIGH",
                "interpretation", "FY2024 stock loss claim exceeds industry technical evaporation/handling standard by 9.5x."
        ));
        ratios.add(Map.of(
                "name", "VAT Input-to-Output Credit Ratio",
                "taxpayerValue", 78.4,
                "benchmarkValue", 62.0,
                "unit", "%",
                "variancePct", 16.4,
                "riskLevel", "HIGH",
                "interpretation", "Elevated input VAT credit ratio caused by misclassifying taxable domestic dispatches as zero-rated exports."
        ));
        analysis.put("ratios", ratios);

        List<Map<String, Object>> quarterlyData = new ArrayList<>();
        quarterlyData.add(createQuarterlyData("Q1 2024", baseRev * 0.23, 2.8, "Normal seasonal distribution"));
        quarterlyData.add(createQuarterlyData("Q2 2024", baseRev * 0.26, 3.4, "Steady revenue growth"));
        quarterlyData.add(createQuarterlyData("Q3 2024", baseRev * 0.24, 16.8, "Spike in input VAT claims (+24%)"));
        quarterlyData.add(createQuarterlyData("Q4 2024", baseRev * 0.27, 21.2, "Discrepancy in zero-rated export declarations"));
        analysis.put("quarterlyData", quarterlyData);

        List<Map<String, Object>> anomalies = new ArrayList<>();
        anomalies.add(Map.of(
                "id", "ANM-C01",
                "title", "VAT Turnover vs TIMS Electronic Fiscal Feed Discrepancy",
                "severity", "HIGH",
                "description", "16 high-value commodity dispatches recorded on TIMS fiscal memory devices were omitted from monthly VAT-03 output declarations and reported as zero-rated exports without ASYCUDA export SAD manifests.",
                "auditorNotes", "Reclassify ETB " + String.format("%,.0f", vatVariance) + " as standard-rated domestic turnover and assess 15% output VAT plus statutory penalty."
        ));
        anomalies.add(Map.of(
                "id", "ANM-C02",
                "title", "ASYCUDA Customs CIF vs Purchase Ledger Valuation Uplift",
                "severity", "HIGH",
                "description", "Purchase ledger cost of imported inputs exceeds certified ASYCUDA Single Administrative Document CIF values due to unsubstantiated offshore affiliate markups.",
                "auditorNotes", "Disallow ETB " + String.format("%,.0f", customsVariance) + " related-party cost uplift under Income Tax Proclamation Art. 27 and assess 30% CIT."
        ));
        anomalies.add(Map.of(
                "id", "ANM-C03",
                "title", "Executive Remuneration P&L vs PAYE Withholding Returns Gap",
                "severity", "MEDIUM",
                "description", "General ledger executive housing allowances and offshore performance bonuses deducted in P&L were excluded from monthly PAYE withholding schedules.",
                "auditorNotes", "Assess unremitted PAYE withholding tax of ETB " + String.format("%,.0f", payeAdjTax) + " on benefits-in-kind and executive bonuses."
        ));
        analysis.put("anomalies", anomalies);

        analysis.put("auditorSynthesis", "Cross-reconciliation between audited income statements and TIMS fiscal records revealed material suppression of domestic turnover. In addition, related-party import uplifts were disallowed under statutory arm's length standards.");
        analysis.put("conclusion", "Based on comprehensive testing of revenue, payroll, and customs imports, adjustments of ETB " + String.format("%,.0f", principalTax) + " are substantiated under statutory tax proclamations.");

        // 5. Findings
        List<Map<String, Object>> findings = new ArrayList<>();
        findings.add(createFindingMap(caseId, "FND-C01", "Turnover & Indirect Taxes",
                "Unreported Domestic Turnover from Misclassified Zero-Rated Export Sales",
                "Taxpayer treated domestic commodity sales as zero-rated exports without export customs single administrative documents.",
                "Tax Proclamation Art. 22: Export zero-rating strictly requires certified customs declaration.",
                "Turnover of ETB " + String.format("%,.0f", vatVariance) + " omitted from taxable output VAT returns.",
                "Lack of dual control in sales invoicing workflow.",
                "Unreported output VAT payable of ETB " + String.format("%,.0f", vatAdjTax) + ".",
                vatVariance, 0.20, vatAdjTax * 0.20, vatAdjTax * 0.14, vatAdjTax * 1.34, "VAT",
                "Reconciliation between TIMS logs and VAT-03 declarations established omitted dispatches.",
                "Assess output VAT shortfall and statutory late payment interest.",
                "Issue assessment notice under Art. 45.", "CONFIRMED", true, false, "AP-C02"));

        findings.add(createFindingMap(caseId, "FND-C02", "Cost of Sales & Related Party",
                "Disallowance of Related-Party Management Fees & Import Cost Uplift",
                "Taxpayer claimed non-substantiated cost uplifts from foreign trading affiliate without economic substance.",
                "Transfer Pricing Proclamation & Income Tax Proclamation Art. 27: Arm's length principle.",
                "Cost uplift of ETB " + String.format("%,.0f", customsVariance) + " deducted from taxable income.",
                "Artificial profit shifting to low-tax offshore jurisdiction.",
                "CIT tax deduction disallowed resulting in additional tax of ETB " + String.format("%,.0f", citAdjTax) + ".",
                customsVariance, 0.20, citAdjTax * 0.20, citAdjTax * 0.14, citAdjTax * 1.34, "CIT",
                "Customs ASYCUDA import manifests confirmed baseline prices before unilateral affiliate mark-up.",
                "Disallow deduction of unsupported markup and adjust taxable corporate income.",
                "Assess corporate income tax adjustment and penal interest.", "CONFIRMED", true, false, "AP-C04"));

        findings.add(createFindingMap(caseId, "FND-C03", "Employment & Withholding Taxes",
                "Unremitted Executive Housing Allowances and Bonuses PAYE Withholding",
                "Executive perquisites and offshore bonus disbursements were omitted from local payroll tax returns.",
                "Employment Income Tax Proclamation: All benefits in cash or in kind are subject to PAYE withholding.",
                "ETB " + String.format("%,.0f", payeVariance) + " in executive allowances un-withheld.",
                "Offshore service contracts paid outside local payroll processing software.",
                "Unremitted PAYE withholding tax of ETB " + String.format("%,.0f", payeAdjTax) + ".",
                payeVariance, 0.20, payeAdjTax * 0.20, payeAdjTax * 0.14, payeAdjTax * 1.34, "PAYE",
                "General ledger executive remuneration vouchers cross-matched with 12-month PAYE receipts.",
                "Recover unremitted employment tax and apply statutory withholding penalty.",
                "Issue demand note for PAYE under-withholding.", "CONFIRMED", false, false, "AP-C03"));

        // 6. Working Papers
        List<Map<String, Object>> workingPapers = new ArrayList<>();
        workingPapers.add(createWorkingPaperMap(caseId, "WP-C01", "Fixed Asset Physical Inspection and Verification Schedule", "Fixed Assets", auditorName, "2026-09-15",
                "Physical asset tagging and depreciation audit conducted on-site.", "Fixed asset records reconciled with zero material discrepancy.", "REVIEWED", "AP-C01"));
        workingPapers.add(createWorkingPaperMap(caseId, "WP-C02", "12-Month VAT Turnover vs Corporate Income Tax Sales Reconciliation", "Reconciliation", auditorName, "2026-09-25",
                "Comprehensive reconciliation matrix between monthly VAT-03 declarations and CIT returns.", "ETB " + String.format("%,.0f", vatVariance) + " discrepancy established.", "REVIEWED", "AP-C02"));
        workingPapers.add(createWorkingPaperMap(caseId, "WP-C03", "Payroll General Ledger vs 12-Month PAYE Remittance Matrix", "Payroll", auditorName, "2026-09-30",
                "Audited executive payroll contracts against monthly remittances.", "Unremitted PAYE of ETB " + String.format("%,.0f", payeAdjTax) + " identified.", "REVIEWED", "AP-C03"));
        workingPapers.add(createWorkingPaperMap(caseId, "WP-C04", "ASYCUDA Single Administrative Document Import Testing Schedule", "Cost of Sales", auditorName, "2026-10-10",
                "Automated comparison of import CIF values with purchase ledger entries.", "ETB " + String.format("%,.0f", customsVariance) + " unsupported markup disallowed.", "REVIEWED", "AP-C04"));
        workingPapers.add(createWorkingPaperMap(caseId, "WP-C05", "CAAT Benford Law & Weekend Journal Entry Exception Dossier", "CAAT Analytics", auditorName, "2026-10-15",
                "Executed automated exception queries on general ledger database.", "7 weekend transactions confirmed as un-substantiated affiliate transfers.", "REVIEWED", "AP-C05"));

        // 7. Queries
        List<Map<String, Object>> queries = new ArrayList<>();
        queries.add(createQueryMap(caseId, "QRY-C01", "Substantiation of Zero-Rated Export Customs Declarations",
                "Please provide certified customs export declarations (SAD) and bills of lading for 16 zero-rated sales dispatches in FY2024.",
                "Tax Proclamation Art. 22", "2026-09-20", "RESOLVED",
                "Taxpayer acknowledged that dispatches were diverted for domestic consumption; documentation unavailable."));
        queries.add(createQueryMap(caseId, "QRY-C02", "Economic Substance of Related-Party Management Surcharges",
                "Provide transfer pricing local file documentation, contracts, and timesheets supporting affiliate mark-up fees.",
                "Transfer Pricing Proclamation Art. 12", "2026-10-05", "RESOLVED",
                "Taxpayer provided master agreement but conceded absence of time records or benefit test logs."));

        // 8. Reconciliations
        Map<String, Object> reconciliations = new LinkedHashMap<>();
        reconciliations.put("caseId", caseId.toString());

        Map<String, Object> vatVsSales = new LinkedHashMap<>();
        vatVsSales.put("annualVatSalesDeclared", annualVatSales);
        vatVsSales.put("annualCitGrossTurnover", annualCitGross);
        vatVsSales.put("timsElectronicInvoices", timsInvoices);
        vatVsSales.put("variance", vatVariance);
        vatVsSales.put("status", "DISCREPANCY_FLAGGED");
        vatVsSales.put("notes", "Gross revenue declared in Corporate Income Tax return exceeds monthly VAT declarations.");
        reconciliations.put("vatVsSales", vatVsSales);

        Map<String, Object> payrollPayeVsPnL = new LinkedHashMap<>();
        payrollPayeVsPnL.put("payrollPayeRemitted", payrollPayeRemitted);
        payrollPayeVsPnL.put("pnlSalariesExpense", payrollPnl);
        payrollPayeVsPnL.put("variance", payeVariance);
        payrollPayeVsPnL.put("status", "DISCREPANCY_FLAGGED");
        payrollPayeVsPnL.put("notes", "Discrepancy identified between payroll PAYE remittances and P&L remuneration deductions.");
        reconciliations.put("payrollPayeVsPnL", payrollPayeVsPnL);

        Map<String, Object> customsImportsVsPurchases = new LinkedHashMap<>();
        customsImportsVsPurchases.put("asycudaCifImports", asycudaImports);
        customsImportsVsPurchases.put("generalLedgerImportCosts", glImportCosts);
        customsImportsVsPurchases.put("variance", customsVariance);
        customsImportsVsPurchases.put("status", "DISCREPANCY_FLAGGED");
        customsImportsVsPurchases.put("notes", "ASYCUDA customs import CIF values differ from purchase ledger entries.");
        reconciliations.put("customsImportsVsPurchases", customsImportsVsPurchases);

        // 9. Balance Sheet Items
        List<Map<String, Object>> balanceSheetItems = new ArrayList<>();
        balanceSheetItems.add(createBalanceSheetItem(caseId, "Property, Plant & Equipment (Fixed Assets)", "Existence", baseRev * 0.65, baseRev * 0.65, 0.0, "COMPLIANT", "Verified against physical tag log.", "CONFIRMED"));
        balanceSheetItems.add(createBalanceSheetItem(caseId, "Trade Accounts Receivable & Provisions", "Valuation", baseRev * 0.20, baseRev * 0.18, baseRev * 0.02, "PARTIAL", "Unsupported bad debt write-offs identified.", "ADJUSTED"));
        balanceSheetItems.add(createBalanceSheetItem(caseId, "Inventory & Raw Materials Stock", "Completeness", baseRev * 0.25, baseRev * 0.23, baseRev * 0.02, "NON_COMPLIANT", "Excess shrinkage claims disallowed.", "ADJUSTED"));
        balanceSheetItems.add(createBalanceSheetItem(caseId, "Related Party Loans & Offshore Balances", "Valuation", baseRev * 0.09, baseRev * 0.05, customsVariance, "NON_COMPLIANT", "Unsubstantiated affiliate markups disallowed.", "DISALLOWED"));
        balanceSheetItems.add(createBalanceSheetItem(caseId, "Trade Accounts Payable & Accrued Charges", "Completeness", baseRev * 0.16, baseRev * 0.16, 0.0, "COMPLIANT", "Supplier circularizations confirmed balances.", "CONFIRMED"));
        balanceSheetItems.add(createBalanceSheetItem(caseId, "Bank Borrowings & Commercial Debt", "Rights & Obligations", baseRev * 0.30, baseRev * 0.30, 0.0, "COMPLIANT", "Direct bank confirmations verified loan covenants.", "CONFIRMED"));

        // 10. CAAT Audit Data
        Map<String, Object> caatAudit = new LinkedHashMap<>();
        caatAudit.put("caseId", caseId.toString());
        caatAudit.put("isCAATEligible", true);
        caatAudit.put("caatToolName", "ITAS Automated CAAT Forensic Suite v4.2");
        caatAudit.put("executionTimestamp", OffsetDateTime.now().toString());
        caatAudit.put("samplingMethod", "Stratified Sampling");
        caatAudit.put("totalRecordsMined", 89372);
        caatAudit.put("totalFlaggedExposure", vatVariance + customsVariance + payeVariance + 595000.0);
        caatAudit.put("auditorNotes", "Automated electronic ledger mining executed across 89,372 general ledger journal entries, 68,400 TIMS fiscal receipts, and 842 ASYCUDA customs manifests.");

        List<Map<String, Object>> caatRules = new ArrayList<>();
        caatRules.add(Map.of(
                "id", "CAAT-R01", "ruleCode", "CAAT-TIMS-01", "ruleName", "TIMS Electronic Fiscal Journal vs VAT-03 Output Matching",
                "category", "RECONCILIATION", "targetLedger", "GL-4000 Sales & Fiscal Memory Log",
                "sampleSize", 68400, "discrepanciesCount", 16, "varianceAmount", vatVariance,
                "status", "FLAGGED", "details", "16 high-value dispatches recorded in TIMS fiscal memory omitted from taxable VAT-03 declarations."
        ));
        caatRules.add(Map.of(
                "id", "CAAT-R02", "ruleCode", "CAAT-BENF-02", "ruleName", "Benford Law First-Digit Forensic Anomaly Detection",
                "category", "BENFORD", "targetLedger", "GL-5100 Operating & Admin Expenses",
                "sampleSize", 18160, "discrepanciesCount", 24, "varianceAmount", 315000.0,
                "status", "FLAGGED", "details", "Statistical spike in leading digits 7 and 8 (+6.6% above Benford expectation) just below ETB 100,000 CFO approval threshold."
        ));
        caatRules.add(Map.of(
                "id", "CAAT-R03", "ruleCode", "CAAT-ASYC-03", "ruleName", "ASYCUDA Single Administrative Document CIF Cross-Bridge",
                "category", "RECONCILIATION", "targetLedger", "GL-5010 Foreign Raw Material Purchases",
                "sampleSize", 842, "discrepanciesCount", 38, "varianceAmount", customsVariance,
                "status", "FLAGGED", "details", "Purchase ledger cost of goods exceeds certified customs CIF declarations due to post-clearance affiliate markups."
        ));
        caatRules.add(Map.of(
                "id", "CAAT-R04", "ruleCode", "CAAT-PAYE-04", "ruleName", "Payroll Master vs P&L Remuneration Cross-Check",
                "category", "RECONCILIATION", "targetLedger", "GL-6100 Executive Salaries & Allowances",
                "sampleSize", 1450, "discrepanciesCount", 8, "varianceAmount", payeVariance,
                "status", "FLAGGED", "details", "Executive housing allowances and offshore bonus vouchers deducted in P&L omitted from PAYE returns."
        ));
        caatRules.add(Map.of(
                "id", "CAAT-R05", "ruleCode", "CAAT-WKND-05", "ruleName", "Weekend & Out-of-Hours Manual Journal Entry Trap",
                "category", "JOURNAL_ENTRY", "targetLedger", "GL-2140 Related Party Clearing Account",
                "sampleSize", 520, "discrepanciesCount", 7, "varianceAmount", 280000.0,
                "status", "FLAGGED", "details", "7 manual journal entries posted on Sundays between 22:00-23:45 crediting offshore affiliate accounts."
        ));
        caatAudit.put("rules", caatRules);

        List<Map<String, Object>> benfordStats = new ArrayList<>();
        benfordStats.add(Map.of("digit", 1, "expectedPct", 30.1, "observedPct", 24.2, "observedCount", 1016, "isAnomalous", false, "deviation", -5.9));
        benfordStats.add(Map.of("digit", 2, "expectedPct", 17.6, "observedPct", 16.5, "observedCount", 693, "isAnomalous", false, "deviation", -1.1));
        benfordStats.add(Map.of("digit", 3, "expectedPct", 12.5, "observedPct", 11.8, "observedCount", 496, "isAnomalous", false, "deviation", -0.7));
        benfordStats.add(Map.of("digit", 4, "expectedPct", 9.7, "observedPct", 9.2, "observedCount", 386, "isAnomalous", false, "deviation", -0.5));
        benfordStats.add(Map.of("digit", 5, "expectedPct", 7.9, "observedPct", 8.1, "observedCount", 340, "isAnomalous", false, "deviation", 0.2));
        benfordStats.add(Map.of("digit", 6, "expectedPct", 6.7, "observedPct", 6.9, "observedCount", 290, "isAnomalous", false, "deviation", 0.2));
        benfordStats.add(Map.of("digit", 7, "expectedPct", 5.8, "observedPct", 12.4, "observedCount", 521, "isAnomalous", true, "deviation", 6.6));
        benfordStats.add(Map.of("digit", 8, "expectedPct", 5.1, "observedPct", 8.3, "observedCount", 349, "isAnomalous", true, "deviation", 3.2));
        benfordStats.add(Map.of("digit", 9, "expectedPct", 4.6, "observedPct", 2.6, "observedCount", 109, "isAnomalous", false, "deviation", -2.0));
        caatAudit.put("benfordStats", benfordStats);

        List<Map<String, Object>> caatExceptions = new ArrayList<>();
        caatExceptions.add(Map.ofEntries(
                Map.entry("id", "EXC-001"), Map.entry("ruleCode", "CAAT-TIMS-01"), Map.entry("transactionDate", "2024-09-18"),
                Map.entry("transactionRef", "TIMS-INV-2024-88412"), Map.entry("accountName", "4010 Domestic Commodity Sales"),
                Map.entry("counterparty", "Horizon Industrial Distribution PLC"), Map.entry("amount", Math.round(vatVariance * 0.42)),
                Map.entry("taxHead", "VAT"), Map.entry("riskLevel", "CRITICAL"),
                Map.entry("anomalyType", "Unreported Domestic Fiscal Dispatch"), Map.entry("status", "FINDING_CREATED"),
                Map.entry("details", "Fiscal invoice issued via EFD machine MRC# ET-009214 but classified as zero-rated export in VAT-03 without ASYCUDA export SAD.")
        ));
        caatExceptions.add(Map.ofEntries(
                Map.entry("id", "EXC-002"), Map.entry("ruleCode", "CAAT-TIMS-01"), Map.entry("transactionDate", "2024-11-04"),
                Map.entry("transactionRef", "TIMS-INV-2024-91045"), Map.entry("accountName", "4010 Domestic Commodity Sales"),
                Map.entry("counterparty", "Rift Valley Wholesale Trading SC"), Map.entry("amount", Math.round(vatVariance * 0.58)),
                Map.entry("taxHead", "VAT"), Map.entry("riskLevel", "CRITICAL"),
                Map.entry("anomalyType", "Omitted Output VAT Schedule Batch"), Map.entry("status", "FINDING_CREATED"),
                Map.entry("details", "Batch of 9 domestic delivery dispatches omitted from monthly VAT output schedule; verified against warehouse gate-pass logs.")
        ));
        caatExceptions.add(Map.ofEntries(
                Map.entry("id", "EXC-003"), Map.entry("ruleCode", "CAAT-ASYC-03"), Map.entry("transactionDate", "2024-07-29"),
                Map.entry("transactionRef", "SAD-DJ-2024-44109"), Map.entry("accountName", "5010 Imported Raw Materials"),
                Map.entry("counterparty", "Global Petrochem Trading FZE (Dubai)"), Map.entry("amount", Math.round(customsVariance)),
                Map.entry("taxHead", "CIT"), Map.entry("riskLevel", "CRITICAL"),
                Map.entry("anomalyType", "Related-Party Post-Clearance Import Markup"), Map.entry("status", "FINDING_CREATED"),
                Map.entry("details", "Post-clearance debit note added 18.5% related-party procurement surcharge above customs-verified CIF value.")
        ));
        caatExceptions.add(Map.ofEntries(
                Map.entry("id", "EXC-004"), Map.entry("ruleCode", "CAAT-PAYE-04"), Map.entry("transactionDate", "2024-12-15"),
                Map.entry("transactionRef", "PV-EXEC-2024-1192"), Map.entry("accountName", "6120 Executive Allowances"),
                Map.entry("counterparty", "Senior Management Payroll Pool"), Map.entry("amount", Math.round(payeVariance)),
                Map.entry("taxHead", "PAYE"), Map.entry("riskLevel", "HIGH"),
                Map.entry("anomalyType", "Unwithheld Executive Benefits-in-Kind"), Map.entry("status", "PENDING_REVIEW"),
                Map.entry("details", "Annual executive housing and offshore bonus disbursement expensed in P&L but excluded from monthly PAYE Schedule B.")
        ));
        caatExceptions.add(Map.ofEntries(
                Map.entry("id", "EXC-005"), Map.entry("ruleCode", "CAAT-WKND-05"), Map.entry("transactionDate", "2024-12-29"),
                Map.entry("transactionRef", "MJE-2024-9984"), Map.entry("accountName", "5490 Technical & Management Consultancy"),
                Map.entry("counterparty", "MENA Holding Advisory Ltd"), Map.entry("amount", 280000L),
                Map.entry("taxHead", "WHT"), Map.entry("riskLevel", "HIGH"),
                Map.entry("anomalyType", "Sunday Midnight Manual Journal Override"), Map.entry("status", "PENDING_REVIEW"),
                Map.entry("details", "Year-end manual journal entry posted on Sunday night accruing advisory fee without underlying deliverables or withholding tax receipt.")
        ));
        caatAudit.put("exceptions", caatExceptions);

        List<String> executionLogs = List.of(
                "[09:14:02.110] INFO  ITAS-CAAT-Engine v4.2 initialized for TIN " + tin + " (" + tpName + ")",
                "[09:14:03.450] INFO  Ingested 89,372 general ledger journal lines from ERP Trial Balance & GL Dump (FY2024)",
                "[09:14:05.820] INFO  Connected to TIMS Fiscal Memory Gateway — fetched 68,400 cryptographic receipt hashes",
                "[09:14:07.195] WARN  [CAAT-TIMS-01] 16 fiscal invoices (ETB " + String.format("%,.0f", vatVariance) + ") missing from VAT-03 output declarations",
                "[09:14:08.640] WARN  [CAAT-BENF-02] Chi-Square = 42.8 (p < 0.001): Significant Benford deviation on leading digits 7 (+2.6%) and 9 (+3.6%)",
                "[09:14:10.312] WARN  [CAAT-ASYC-03] Cross-matched 842 ASYCUDA SAD manifests: 38 purchase vouchers exceed CIF value by ETB " + String.format("%,.0f", customsVariance),
                "[09:14:11.904] WARN  [CAAT-PAYE-04] Payroll GL vs PAYE Schedule B reconciliation flagged ETB " + String.format("%,.0f", payeVariance) + " un-taxed executive benefits",
                "[09:14:12.550] INFO  Forensic run completed in 10.44s — 5 rules flagged, 5 high-risk exception dossiers generated."
        );
        caatAudit.put("executionLogs", executionLogs);

        // 11. Entry Conference
        Map<String, Object> entryConference = new LinkedHashMap<>();
        entryConference.put("caseId", caseId.toString());
        entryConference.put("scheduledDate", auditCase.getStartDate() != null ? auditCase.getStartDate().toString() : "2026-09-01");
        entryConference.put("time", "10:00 AM");
        entryConference.put("venue", "Taxpayer Corporate Headquarters / Executive Boardroom");
        entryConference.put("attendees", List.of(
                Map.of("name", auditorName, "role", "Lead Comprehensive Auditor", "organization", "Ministry of Revenues"),
                Map.of("name", tlName, "role", "Audit Team Leader", "organization", "Ministry of Revenues"),
                Map.of("name", "Financial Director / CFO", "role", "Chief Financial Officer", "organization", tpName),
                Map.of("name", "Chief Accountant", "role", "Head of Finance", "organization", tpName)
        ));
        entryConference.put("internalControlsReview", "ERP general ledger, sales invoicing module, and approval matrices inspected. High degree of manual intervention in export dispatches noted.");
        entryConference.put("premisesInspectionFindings", "Manufacturing plant, bonded export warehouses, and electronic server room physically inspected. Physical inventory and fixed asset tagging verified.");
        entryConference.put("taxpayerConfirmedReceipt", true);
        entryConference.put("status", "CONDUCTED");
        entryConference.put("lastUpdated", OffsetDateTime.now().toString());

        // 12. Exit Conference
        Map<String, Object> exitConference = new LinkedHashMap<>();
        exitConference.put("caseId", caseId.toString());
        exitConference.put("scheduledDate", auditCase.getDueDate() != null ? auditCase.getDueDate().toString() : "2026-11-15");
        exitConference.put("time", "02:00 PM");
        exitConference.put("venue", "Regional Tax Center Boardroom");
        exitConference.put("agendaItems", List.of(
                "Presentation of comprehensive audit findings and evidence",
                "Reconciliation variances (VAT, PAYE, CIT import uplift)",
                "Statutory assessment notice and tax exposure explanation",
                "Taxpayer response timeline and formal objection rights"
        ));
        exitConference.put("discussionNotes", "Detailed review of findings with taxpayer management. Taxpayer presented initial arguments and requested 10 days for written response.");
        exitConference.put("taxpayerResponseNotes", "Taxpayer acknowledged receiving audit report and scheduled delivery of formal submission.");
        exitConference.put("attendanceConfirmed", true);
        exitConference.put("signedByTaxpayer", true);
        exitConference.put("status", "COMPLETED");

        // 13. Assessment Notice
        Map<String, Object> assessmentNotice = new LinkedHashMap<>();
        assessmentNotice.put("caseId", caseId.toString());
        assessmentNotice.put("noticeNumber", "NOT-CA-" + auditCase.getId().toString().substring(0, 8).toUpperCase());
        assessmentNotice.put("issueDate", "2026-11-20");
        assessmentNotice.put("statutoryDue30Days", "2026-12-20");
        assessmentNotice.put("principalCit", citAdjTax);
        assessmentNotice.put("principalVat", vatAdjTax);
        assessmentNotice.put("principalPaye", payeAdjTax);
        assessmentNotice.put("principalWht", 0.0);
        assessmentNotice.put("principalTotal", principalTax);
        assessmentNotice.put("principalTax", principalTax);
        assessmentNotice.put("penaltyPct", 0.20);
        assessmentNotice.put("penaltyAmount", penaltyAmount);
        assessmentNotice.put("statutoryPenalty20", penaltyAmount);
        assessmentNotice.put("interestRateAnnual", 0.14);
        assessmentNotice.put("interestDays", 180);
        assessmentNotice.put("interestAmount", interestAmount);
        assessmentNotice.put("interest", interestAmount);
        assessmentNotice.put("totalAssessmentDue", totalAssessmentDue);
        assessmentNotice.put("objectionStatus", "NONE");
        assessmentNotice.put("fraudReferralTriggered", false);
        assessmentNotice.put("status", "DRAFT");

        // 14. Multi-Zone Allocations
        List<Map<String, Object>> multiZoneAllocations = new ArrayList<>();
        multiZoneAllocations.add(Map.of("id", "ZON-01", "caseId", caseId.toString(), "zoneName", "Central Operations / Head Office", "branchCode", "HQ-01",
                "taxDeclared", baseRev * 0.55, "auditAdjustment", principalTax * 0.515, "netPayable", principalTax * 0.515 * 1.34, "taxType", "CONSOLIDATED", "periodCovered", "2024"));
        multiZoneAllocations.add(Map.of("id", "ZON-02", "caseId", caseId.toString(), "zoneName", "Eastern Terminal & Manufacturing Zone", "branchCode", "EAST-02",
                "taxDeclared", baseRev * 0.28, "auditAdjustment", principalTax * 0.285, "netPayable", principalTax * 0.285 * 1.34, "taxType", "CONSOLIDATED", "periodCovered", "2024"));
        multiZoneAllocations.add(Map.of("id", "ZON-03", "caseId", caseId.toString(), "zoneName", "Southern Logistics Branch", "branchCode", "SOUTH-03",
                "taxDeclared", baseRev * 0.17, "auditAdjustment", principalTax * 0.200, "netPayable", principalTax * 0.200 * 1.34, "taxType", "CONSOLIDATED", "periodCovered", "2024"));

        // 15. Draft Report
        Map<String, Object> draftReport = new LinkedHashMap<>();
        draftReport.put("id", "DR-" + caseId.toString().substring(0, 8));
        draftReport.put("caseId", caseId.toString());
        draftReport.put("reportReference", "DR-CA-2026-001");
        draftReport.put("executiveSummary", "Comprehensive audit conducted for " + tpName + " (TIN: " + tin + ") across Corporate Income Tax, VAT, and PAYE. Total proposed assessment equals ETB " + String.format("%,.0f", totalAssessmentDue) + ".");
        draftReport.put("scopeAndObjectives", "Verification of income tax compliance, revenue completeness, input tax claims, and related-party transactions for FY2022-2024.");
        draftReport.put("methodology", "Examination of books of accounts, automated CAAT analytics, Benford statistical tests, and cross-reconciliation with TIMS and ASYCUDA systems.");
        draftReport.put("findingsSummary", "Three substantive findings established regarding VAT zero-rating omission, affiliate import markup disallowance, and unremitted executive PAYE.");
        draftReport.put("recommendedAdjustments", "Assess additional principal tax of ETB " + String.format("%,.0f", principalTax) + ", penalties of ETB " + String.format("%,.0f", penaltyAmount) + ", and interest of ETB " + String.format("%,.0f", interestAmount) + ".");
        draftReport.put("totalPrincipalTax", principalTax);
        draftReport.put("totalPenalty", penaltyAmount);
        draftReport.put("totalInterest", interestAmount);
        draftReport.put("totalAssessment", totalAssessmentDue);
        draftReport.put("status", "DRAFT");
        draftReport.put("teamLeaderComments", "Audit procedures thoroughly documented. Findings and cross-system reconciliations fully substantiated.");

        // 16. Audit Trail
        List<Map<String, Object>> auditTrail = new ArrayList<>();
        auditTrail.add(Map.of("id", "TRL-01", "caseId", caseId.toString(), "user", auditorName, "action", "AUDIT_EXECUTION_INITIALIZED", "timestamp", OffsetDateTime.now().minusDays(15).toString(), "details", "Comprehensive audit execution initiated for " + tpName + "."));
        auditTrail.add(Map.of("id", "TRL-02", "caseId", caseId.toString(), "user", auditorName, "action", "ENTRY_CONFERENCE_HELD", "timestamp", OffsetDateTime.now().minusDays(12).toString(), "details", "Entry conference conducted with CFO and chief accountant."));
        auditTrail.add(Map.of("id", "TRL-03", "caseId", caseId.toString(), "user", auditorName, "action", "CAAT_ANALYSIS_EXECUTED", "timestamp", OffsetDateTime.now().minusDays(8).toString(), "details", "Executed automated CAAT forensic suite matching TIMS and ASYCUDA."));
        auditTrail.add(Map.of("id", "TRL-04", "caseId", caseId.toString(), "user", auditorName, "action", "FINDINGS_FORMULATED", "timestamp", OffsetDateTime.now().minusDays(3).toString(), "details", "Substantive findings FND-C01, FND-C02, FND-C03 established."));

        // Assemble result
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("auditCase", auditCaseDto);
        result.put("procedures", procedures);
        result.put("evidence", evidence);
        result.put("analysis", analysis);
        result.put("findings", findings);
        result.put("workingPapers", workingPapers);
        result.put("queries", queries);
        result.put("reconciliations", reconciliations);
        result.put("balanceSheetItems", balanceSheetItems);
        result.put("caatAudit", caatAudit);
        result.put("entryConference", entryConference);
        result.put("exitConference", exitConference);
        result.put("assessmentNotice", assessmentNotice);
        result.put("multiZoneAllocations", multiZoneAllocations);
        result.put("draftReport", draftReport);
        result.put("auditTrail", auditTrail);

        // Overlay saved snapshot modifications from DB (preserving default sub-keys if saved map is partial)
        var snapshotOpt = snapshotRepository.findByCaseId(caseId);
        if (snapshotOpt.isPresent()) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> saved = objectMapper.readValue(snapshotOpt.get().getSnapshotData(), Map.class);
                if (saved.get("procedures") instanceof List) result.put("procedures", saved.get("procedures"));
                if (saved.get("evidence") instanceof List) result.put("evidence", saved.get("evidence"));
                if (saved.get("queries") instanceof List) result.put("queries", saved.get("queries"));
                if (saved.get("findings") instanceof List) result.put("findings", saved.get("findings"));
                if (saved.get("workingPapers") instanceof List) result.put("workingPapers", saved.get("workingPapers"));
                if (saved.get("balanceSheetItems") instanceof List) result.put("balanceSheetItems", saved.get("balanceSheetItems"));
                if (saved.get("multiZoneAllocations") instanceof List) result.put("multiZoneAllocations", saved.get("multiZoneAllocations"));
                if (saved.get("auditTrail") instanceof List) result.put("auditTrail", saved.get("auditTrail"));

                if (saved.get("draftReport") instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> m = (Map<String, Object>) saved.get("draftReport");
                    draftReport.putAll(m);
                }
                if (saved.get("analysis") instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> m = (Map<String, Object>) saved.get("analysis");
                    analysis.putAll(m);
                }
                if (saved.get("entryConference") instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> m = (Map<String, Object>) saved.get("entryConference");
                    entryConference.putAll(m);
                }
                if (saved.get("caatAudit") instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> m = (Map<String, Object>) saved.get("caatAudit");
                    caatAudit.putAll(m);
                }
                if (saved.get("reconciliations") instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> m = (Map<String, Object>) saved.get("reconciliations");
                    reconciliations.putAll(m);
                }
                if (saved.get("exitConference") instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> m = (Map<String, Object>) saved.get("exitConference");
                    exitConference.putAll(m);
                }
                if (saved.get("assessmentNotice") instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> m = (Map<String, Object>) saved.get("assessmentNotice");
                    assessmentNotice.putAll(m);
                }
                if (saved.get("auditCase") instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> savedAc = (Map<String, Object>) saved.get("auditCase");
                    if (savedAc.containsKey("status")) auditCaseDto.put("status", savedAc.get("status"));
                    if (savedAc.containsKey("teamLeaderComment")) auditCaseDto.put("teamLeaderComment", savedAc.get("teamLeaderComment"));
                    if (savedAc.containsKey("directorComment")) auditCaseDto.put("directorComment", savedAc.get("directorComment"));
                    if (savedAc.containsKey("teamLeaderRecommendation")) auditCaseDto.put("teamLeaderRecommendation", savedAc.get("teamLeaderRecommendation"));
                }
            } catch (Exception e) {
                log.warn("Failed to overlay saved snapshot data", e);
            }
        }

        return result;
    }

    @Transactional
    public Map<String, Object> autosaveCase(UUID caseId, Map<String, Object> snapshot, String actorId) {
        log.info("Autosaving comprehensive audit case {} by {}", caseId, actorId);
        ApAuditCaseEntity auditCase = getAndValidateCase(caseId);

        CaCaseSnapshotEntity entity = snapshotRepository.findByCaseId(caseId)
                .orElseGet(() -> CaCaseSnapshotEntity.builder().caseId(caseId).build());

        try {
            entity.setSnapshotData(objectMapper.writeValueAsString(snapshot));
            entity.setLastSavedAt(OffsetDateTime.now());
            snapshotRepository.save(entity);

            // Update case status if provided
            if (snapshot.containsKey("auditCase") && snapshot.get("auditCase") instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> ac = (Map<String, Object>) snapshot.get("auditCase");
                if (ac.containsKey("status") && ac.get("status") instanceof String) {
                    String newStatus = (String) ac.get("status");
                    auditCase.setStatus(newStatus);
                    auditCase.setCaWorkflowStatus(newStatus);
                    auditCase.setUpdatedAt(OffsetDateTime.now());
                    caseRepository.save(auditCase);
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("lastSaved", entity.getLastSavedAt().toLocalTime().toString());
            return response;
        } catch (Exception e) {
            log.error("Failed to save comprehensive audit snapshot", e);
            throw new RuntimeException("Failed to save snapshot", e);
        }
    }

    @Transactional
    public Map<String, Object> executeWorkflow(UUID caseId, Map<String, Object> payload, String actorId) {
        log.info("Executing workflow action for case {} by {}: {}", caseId, actorId, payload);
        ApAuditCaseEntity auditCase = getAndValidateCase(caseId);
        String action = (String) payload.get("action");
        String comment = (String) payload.get("comment");

        String newStatus = auditCase.getStatus();

        if ("SUBMIT_FOR_REVIEW".equals(action)) {
            newStatus = "SUBMITTED";
            auditCase.setCaCurrentPhase("REPORTING");
            if (notificationService != null && auditCase.getAssignedTeamLeaderId() != null) {
                try {
                    notificationService.sendNotification(
                            auditCase.getAssignedTeamLeaderId(),
                            "REVIEW_REQUEST",
                            "Comprehensive Audit Submitted for Review",
                            "Comprehensive audit case " + auditCase.getCaseNumber() + " has been submitted for supervisory review.",
                            caseId, null, "CASE", caseId
                    );
                } catch (Exception ignored) {}
            }
        } else if ("APPROVE_AUDIT".equals(action)) {
            newStatus = "APPROVED";
            auditCase.setCaCurrentPhase("CONCLUDED");
        } else if ("RETURN_FOR_CORRECTION".equals(action)) {
            newStatus = "RETURNED_FOR_CORRECTION";
        } else if ("RECOMMEND_FOR_DIRECTOR_APPROVAL".equals(action)) {
            newStatus = "PENDING_DIRECTOR_APPROVAL";
        } else if ("DIRECTOR_APPROVE".equals(action)) {
            newStatus = "APPROVED";
            auditCase.setCaCurrentPhase("CONCLUDED");
        } else if ("DIRECTOR_RETURN".equals(action)) {
            newStatus = "RETURNED_FOR_CORRECTION";
        } else if ("AUTHORIZE_FRAUD_PROSECUTION".equals(action) || "TRIGGER_FRAUD_INVESTIGATION".equals(action)) {
            newStatus = "REFERRED_TO_FRAUD_INVESTIGATION";
        } else if ("ISSUE_ASSESSMENT_NOTICE".equals(action)) {
            newStatus = "ASSESSMENT_ISSUED";
        }

        auditCase.setStatus(newStatus);
        auditCase.setCaWorkflowStatus(newStatus);
        auditCase.setUpdatedAt(OffsetDateTime.now());
        caseRepository.save(auditCase);

        // Also update saved snapshot if exists
        var snapshotOpt = snapshotRepository.findByCaseId(caseId);
        if (snapshotOpt.isPresent()) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> saved = objectMapper.readValue(snapshotOpt.get().getSnapshotData(), Map.class);
                if (saved.containsKey("auditCase") && saved.get("auditCase") instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> ac = (Map<String, Object>) saved.get("auditCase");
                    ac.put("status", newStatus);
                    if (comment != null) {
                        if (action != null && action.contains("DIRECTOR")) {
                            ac.put("directorComment", comment);
                        } else {
                            ac.put("teamLeaderComment", comment);
                        }
                    }
                }
                snapshotOpt.get().setSnapshotData(objectMapper.writeValueAsString(saved));
                snapshotOpt.get().setLastSavedAt(OffsetDateTime.now());
                snapshotRepository.save(snapshotOpt.get());
            } catch (Exception ignored) {}
        }

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("success", true);
        resp.put("status", newStatus);
        resp.put("auditCase", Map.of("status", newStatus));
        return resp;
    }

    // ── Helper builders ────────────────────────────────────────────────────────
    private Map<String, Object> createProcedure(UUID caseId, String ref, String title, String obj, String desc,
                                                String status, String auditor, String dueDate, String res, String conc,
                                                String obs, List<String> evdIds, boolean mandatory, String assertion, String caatTech) {
        Map<String, Object> p = new LinkedHashMap<>();
        p.put("id", ref);
        p.put("caseId", caseId.toString());
        p.put("reference", ref);
        p.put("title", title);
        p.put("objective", obj);
        p.put("description", desc);
        p.put("status", status);
        p.put("assignedAuditor", auditor);
        p.put("dueDate", dueDate);
        p.put("result", res);
        p.put("conclusion", conc);
        p.put("observations", obs);
        p.put("evidenceIds", evdIds);
        p.put("isMandatory", mandatory);
        p.put("assertionType", assertion);
        p.put("caatTechnique", caatTech);
        return p;
    }

    private Map<String, Object> createEvidence(UUID caseId, String ref, String desc, String src, String date,
                                               String relProcId, String status, String fn, String fs, String upBy, String notes) {
        Map<String, Object> e = new LinkedHashMap<>();
        e.put("id", ref);
        e.put("caseId", caseId.toString());
        e.put("reference", ref);
        e.put("description", desc);
        e.put("source", src);
        e.put("date", date);
        e.put("relatedProcedureId", relProcId);
        e.put("status", status);
        e.put("fileName", fn);
        e.put("fileSize", fs);
        e.put("fileType", fn.endsWith(".pdf") ? "application/pdf" : (fn.endsWith(".xlsx") ? "application/vnd.ms-excel" : "text/csv"));
        e.put("uploadedBy", upBy);
        e.put("notes", notes);
        return e;
    }

    private Map<String, Object> createAnnualFinancial(String year, double rev, double cogs, double opEx) {
        Map<String, Object> af = new LinkedHashMap<>();
        af.put("year", year);
        af.put("revenue", rev);
        af.put("cogs", cogs);
        af.put("grossProfit", rev - cogs);
        af.put("operatingExpenses", opEx);
        double netProfit = (rev - cogs) - opEx;
        af.put("taxableIncome", Math.max(0, netProfit));
        af.put("taxDeclared", Math.max(0, netProfit * 0.30));
        af.put("vatOutput", rev * 0.15);
        af.put("vatInput", cogs * 0.15 * 0.70);
        af.put("vatPayable", Math.max(0, (rev * 0.15) - (cogs * 0.15 * 0.70)));
        return af;
    }

    private Map<String, Object> createQuarterlyData(String q, double rev, double var, String notes) {
        Map<String, Object> qd = new LinkedHashMap<>();
        qd.put("quarter", q);
        qd.put("revenue", rev);
        qd.put("cogs", rev * 0.68);
        qd.put("expenses", rev * 0.18);
        qd.put("vatInputClaimed", rev * 0.68 * 0.15 * 0.70);
        qd.put("variance", var);
        qd.put("notes", notes);
        return qd;
    }

    private Map<String, Object> createFindingMap(UUID caseId, String ref, String area, String title, String desc,
                                                String crit, String cond, String cause, String eff, double underDeclared,
                                                double penRate, double penAmt, double intAmt, double totImpact, String taxType,
                                                String analysis, String conc, String rec, String status, boolean sig, boolean fraud, String relProc) {
        Map<String, Object> f = new LinkedHashMap<>();
        f.put("id", ref);
        f.put("caseId", caseId.toString());
        f.put("reference", ref);
        f.put("auditArea", area);
        f.put("title", title);
        f.put("description", desc);
        f.put("criteria", crit);
        f.put("condition", cond);
        f.put("cause", cause);
        f.put("effect", eff);
        f.put("underDeclaredAmount", underDeclared);
        f.put("penaltyRate", penRate);
        f.put("penaltyAmount", penAmt);
        f.put("interestAmount", intAmt);
        f.put("totalTaxImpact", totImpact);
        f.put("taxType", taxType);
        f.put("auditorAnalysis", analysis);
        f.put("conclusion", conc);
        f.put("recommendation", rec);
        f.put("status", status);
        f.put("isSignificant", sig);
        f.put("indicatesFraud", fraud);
        f.put("relatedProcedureId", relProc);
        f.put("relatedEvidenceIds", List.of("EVD-C01", "EVD-C03"));
        return f;
    }

    private Map<String, Object> createWorkingPaperMap(UUID caseId, String ref, String title, String cat, String prepBy,
                                                     String date, String workPerf, String conc, String status, String relProc) {
        Map<String, Object> w = new LinkedHashMap<>();
        w.put("id", ref);
        w.put("caseId", caseId.toString());
        w.put("reference", ref);
        w.put("title", title);
        w.put("category", cat);
        w.put("preparedBy", prepBy);
        w.put("date", date);
        w.put("workPerformed", workPerf);
        w.put("conclusions", conc);
        w.put("status", status);
        w.put("relatedProcedureId", relProc);
        w.put("evidenceIds", List.of("EVD-C01"));
        return w;
    }

    private Map<String, Object> createQueryMap(UUID caseId, String ref, String subj, String q, String basis, String dueDate, String status, String resp) {
        Map<String, Object> qm = new LinkedHashMap<>();
        qm.put("id", ref);
        qm.put("caseId", caseId.toString());
        qm.put("reference", ref);
        qm.put("subject", subj);
        qm.put("question", q);
        qm.put("statutoryBasis", basis);
        qm.put("dueDate", dueDate);
        qm.put("status", status);
        qm.put("attachedEvidenceIds", List.of("EVD-C01"));
        if (resp != null) {
            qm.put("taxpayerResponse", Map.of(
                    "responseText", resp,
                    "respondedAt", "2026-09-22",
                    "responderName", "Taxpayer Representative"
            ));
        }
        return qm;
    }

    private Map<String, Object> createBalanceSheetItem(UUID caseId, String comp, String assertion, double auditee,
                                                      double audited, double var, String ifrs, String notes, String conc) {
        Map<String, Object> b = new LinkedHashMap<>();
        b.put("id", "BS-" + UUID.randomUUID().toString().substring(0, 8));
        b.put("caseId", caseId.toString());
        b.put("component", comp);
        b.put("assertionType", assertion);
        b.put("auditeeBalance", auditee);
        b.put("auditedBalance", audited);
        b.put("variance", var);
        b.put("ifrsCompliance", ifrs);
        b.put("notes", notes);
        b.put("auditorConclusion", conc);
        return b;
    }

    // ── Direct CRUD handlers for Frontend API ─────────────────────────────────

    @Transactional
    public Map<String, Object> updateCaseMetadata(UUID caseId, Map<String, Object> updates, String actorId) {
        ApAuditCaseEntity c = getAndValidateCase(caseId);
        if (updates.containsKey("status")) {
            c.setStatus((String) updates.get("status"));
            c.setCaWorkflowStatus((String) updates.get("status"));
        }
        if (updates.containsKey("caCurrentPhase")) {
            c.setCaCurrentPhase((String) updates.get("caCurrentPhase"));
        }
        if (updates.containsKey("auditScope")) {
            c.setAuditScope((String) updates.get("auditScope"));
        }
        c.setUpdatedAt(OffsetDateTime.now());
        caseRepository.save(c);

        Map<String, Object> snap = getCaseSnapshot(caseId, actorId);
        autosaveCase(caseId, snap, actorId);
        return snap;
    }

    @Transactional
    public Map<String, Object> updateProcedure(UUID caseId, String procId, Map<String, Object> updates, String actorId) {
        Map<String, Object> snap = getCaseSnapshot(caseId, actorId);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> procs = (List<Map<String, Object>>) snap.get("procedures");
        Map<String, Object> target = null;
        if (procs != null) {
            for (Map<String, Object> p : procs) {
                if (procId.equals(p.get("id")) || procId.equals(p.get("reference"))) {
                    p.putAll(updates);
                    target = p;
                    break;
                }
            }
            if (target == null) {
                procs.add(updates);
                target = updates;
            }
        }
        autosaveCase(caseId, snap, actorId);
        return target != null ? target : updates;
    }

    @Transactional
    public Map<String, Object> addEvidence(UUID caseId, Map<String, Object> item, String actorId) {
        Map<String, Object> snap = getCaseSnapshot(caseId, actorId);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> evList = (List<Map<String, Object>>) snap.get("evidence");
        if (evList == null) {
            evList = new ArrayList<>();
            snap.put("evidence", evList);
        }
        String ref = (String) item.getOrDefault("reference", "EVD-C0" + (evList.size() + 1));
        item.put("id", ref);
        item.put("caseId", caseId.toString());
        evList.add(item);
        autosaveCase(caseId, snap, actorId);
        return item;
    }

    @Transactional
    public void deleteEvidence(UUID caseId, String evidenceId, String actorId) {
        Map<String, Object> snap = getCaseSnapshot(caseId, actorId);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> evList = (List<Map<String, Object>>) snap.get("evidence");
        if (evList != null) {
            evList.removeIf(e -> evidenceId.equals(e.get("id")) || evidenceId.equals(e.get("reference")));
        }
        autosaveCase(caseId, snap, actorId);
    }

    @Transactional
    public Map<String, Object> updateFinding(UUID caseId, String findingId, Map<String, Object> updates, String actorId) {
        Map<String, Object> snap = getCaseSnapshot(caseId, actorId);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> findings = (List<Map<String, Object>>) snap.get("findings");
        Map<String, Object> target = null;
        if (findings != null) {
            for (Map<String, Object> f : findings) {
                if (findingId.equals(f.get("id")) || findingId.equals(f.get("reference"))) {
                    f.putAll(updates);
                    target = f;
                    break;
                }
            }
            if (target == null) {
                findings.add(updates);
                target = updates;
            }
        }
        autosaveCase(caseId, snap, actorId);
        return target != null ? target : updates;
    }

    @Transactional
    public void deleteFinding(UUID caseId, String findingId, String actorId) {
        Map<String, Object> snap = getCaseSnapshot(caseId, actorId);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> findings = (List<Map<String, Object>>) snap.get("findings");
        if (findings != null) {
            findings.removeIf(f -> findingId.equals(f.get("id")) || findingId.equals(f.get("reference")));
        }
        autosaveCase(caseId, snap, actorId);
    }

    @Transactional
    public Map<String, Object> updateWorkingPaper(UUID caseId, String wpId, Map<String, Object> updates, String actorId) {
        Map<String, Object> snap = getCaseSnapshot(caseId, actorId);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> wps = (List<Map<String, Object>>) snap.get("workingPapers");
        Map<String, Object> target = null;
        if (wps != null) {
            for (Map<String, Object> w : wps) {
                if (wpId.equals(w.get("id")) || wpId.equals(w.get("reference"))) {
                    w.putAll(updates);
                    target = w;
                    break;
                }
            }
            if (target == null) {
                wps.add(updates);
                target = updates;
            }
        }
        autosaveCase(caseId, snap, actorId);
        return target != null ? target : updates;
    }

    @Transactional
    public void deleteWorkingPaper(UUID caseId, String wpId, String actorId) {
        Map<String, Object> snap = getCaseSnapshot(caseId, actorId);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> wps = (List<Map<String, Object>>) snap.get("workingPapers");
        if (wps != null) {
            wps.removeIf(w -> wpId.equals(w.get("id")) || wpId.equals(w.get("reference")));
        }
        autosaveCase(caseId, snap, actorId);
    }

    @Transactional
    public Map<String, Object> updateQuery(UUID caseId, String queryId, Map<String, Object> updates, String actorId) {
        Map<String, Object> snap = getCaseSnapshot(caseId, actorId);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> qs = (List<Map<String, Object>>) snap.get("queries");
        Map<String, Object> target = null;
        if (qs != null) {
            for (Map<String, Object> q : qs) {
                if (queryId.equals(q.get("id")) || queryId.equals(q.get("reference"))) {
                    q.putAll(updates);
                    target = q;
                    break;
                }
            }
            if (target == null) {
                qs.add(updates);
                target = updates;
            }
        }
        autosaveCase(caseId, snap, actorId);
        return target != null ? target : updates;
    }

    @Transactional
    public Map<String, Object> updateAnalysis(UUID caseId, Map<String, Object> analysisUpdates, String actorId) {
        Map<String, Object> snap = getCaseSnapshot(caseId, actorId);
        @SuppressWarnings("unchecked")
        Map<String, Object> existing = (Map<String, Object>) snap.get("analysis");
        if (existing != null) {
            existing.putAll(analysisUpdates);
        } else {
            snap.put("analysis", analysisUpdates);
        }
        autosaveCase(caseId, snap, actorId);
        return (Map<String, Object>) snap.get("analysis");
    }

    @Transactional
    public Map<String, Object> updateDraftReportContent(UUID caseId, Map<String, Object> reportUpdates, String actorId) {
        Map<String, Object> snap = getCaseSnapshot(caseId, actorId);
        @SuppressWarnings("unchecked")
        Map<String, Object> existing = (Map<String, Object>) snap.get("draftReport");
        if (existing != null) {
            existing.putAll(reportUpdates);
        } else {
            snap.put("draftReport", reportUpdates);
        }
        autosaveCase(caseId, snap, actorId);
        return (Map<String, Object>) snap.get("draftReport");
    }

    @Transactional
    public Map<String, Object> updateEntryConference(UUID caseId, Map<String, Object> updates, String actorId) {
        Map<String, Object> snap = getCaseSnapshot(caseId, actorId);
        @SuppressWarnings("unchecked")
        Map<String, Object> conf = (Map<String, Object>) snap.get("entryConference");
        if (conf != null) {
            conf.putAll(updates);
        } else {
            snap.put("entryConference", updates);
        }
        autosaveCase(caseId, snap, actorId);
        return (Map<String, Object>) snap.get("entryConference");
    }

    @Transactional
    public Map<String, Object> updateCaatAudit(UUID caseId, Map<String, Object> updates, String actorId) {
        Map<String, Object> snap = getCaseSnapshot(caseId, actorId);
        @SuppressWarnings("unchecked")
        Map<String, Object> caat = (Map<String, Object>) snap.get("caatAudit");
        if (caat != null) {
            caat.putAll(updates);
        } else {
            snap.put("caatAudit", updates);
        }
        autosaveCase(caseId, snap, actorId);
        return (Map<String, Object>) snap.get("caatAudit");
    }

    @Transactional
    public Map<String, Object> updateReconciliations(UUID caseId, Map<String, Object> updates, String actorId) {
        Map<String, Object> snap = getCaseSnapshot(caseId, actorId);
        @SuppressWarnings("unchecked")
        Map<String, Object> rec = (Map<String, Object>) snap.get("reconciliations");
        if (rec != null) {
            rec.putAll(updates);
        } else {
            snap.put("reconciliations", updates);
        }
        autosaveCase(caseId, snap, actorId);
        return (Map<String, Object>) snap.get("reconciliations");
    }

    @Transactional
    public Map<String, Object> updateExitConference(UUID caseId, Map<String, Object> updates, String actorId) {
        Map<String, Object> snap = getCaseSnapshot(caseId, actorId);
        @SuppressWarnings("unchecked")
        Map<String, Object> exit = (Map<String, Object>) snap.get("exitConference");
        if (exit != null) {
            exit.putAll(updates);
        } else {
            snap.put("exitConference", updates);
        }
        autosaveCase(caseId, snap, actorId);
        return (Map<String, Object>) snap.get("exitConference");
    }

    @Transactional
    public Map<String, Object> updateAssessmentNotice(UUID caseId, Map<String, Object> updates, String actorId) {
        Map<String, Object> snap = getCaseSnapshot(caseId, actorId);
        @SuppressWarnings("unchecked")
        Map<String, Object> notice = (Map<String, Object>) snap.get("assessmentNotice");
        if (notice != null) {
            notice.putAll(updates);
        } else {
            snap.put("assessmentNotice", updates);
        }
        autosaveCase(caseId, snap, actorId);
        return (Map<String, Object>) snap.get("assessmentNotice");
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAuditTrailEntries(UUID caseId) {
        Map<String, Object> snap = getCaseSnapshot(caseId, null);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> trail = (List<Map<String, Object>>) snap.get("auditTrail");
        return trail != null ? trail : List.of();
    }

    @Transactional
    public void addAuditTrailEntry(UUID caseId, Map<String, Object> entry, String actorId) {
        Map<String, Object> snap = getCaseSnapshot(caseId, actorId);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> trail = (List<Map<String, Object>>) snap.get("auditTrail");
        if (trail == null) {
            trail = new ArrayList<>();
            snap.put("auditTrail", trail);
        }
        entry.put("id", "TRL-" + System.currentTimeMillis());
        entry.put("timestamp", OffsetDateTime.now().toString());
        trail.add(0, entry);
        autosaveCase(caseId, snap, actorId);
    }
}


