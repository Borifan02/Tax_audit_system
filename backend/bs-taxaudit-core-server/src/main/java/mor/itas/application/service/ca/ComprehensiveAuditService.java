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

    // ── Domain services ───────────────────────────────────────────────────────
    private final CaWorkflowStateMachine       stateMachine;
    private final CaatEngineService            caatEngine;
    private final AssessmentNoticeGeneratorService noticeGenerator;
    private final AuditTrailService            auditTrailService;
    private final CaDomainEventPublisher       eventPublisher;

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

    private ApAuditCaseEntity getAndValidateCase(UUID caseId) {
        ApAuditCaseEntity c = caseRepository.findById(caseId)
            .orElseThrow(() -> new CaseNotFoundException("Case not found: " + caseId));
        if (!"COMPREHENSIVE_AUDIT".equals(c.getAuditType())) {
            throw new InvalidCaseStateException(
                "Case is not a Comprehensive Audit.", c.getStatus());
        }
        return c;
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

    // Duplicates removed
}
