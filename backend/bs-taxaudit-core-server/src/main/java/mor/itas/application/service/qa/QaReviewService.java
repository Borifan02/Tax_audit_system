package mor.itas.application.service.qa;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import mor.itas.api.dto.request.qa.*;
import mor.itas.api.dto.response.qa.*;
import mor.itas.application.service.ca.ComprehensiveAuditService;
import mor.itas.engineadapter.taxpayer.MockTaxpayerAdapter;
import mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity;
import mor.itas.persistence.jpa.entity.ap.UserEntity;
import mor.itas.persistence.jpa.entity.qa.*;
import mor.itas.persistence.jpa.repository.ap.ApAuditCaseRepository;
import mor.itas.persistence.jpa.repository.ap.UserJpaRepository;
import mor.itas.persistence.repository.qa.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class QaReviewService {

    private final QaReviewCaseRepository qaReviewCaseRepository;
    private final QaReviewDimensionRepository qaReviewDimensionRepository;
    private final QaDeficiencyRepository qaDeficiencyRepository;
    private final QaReportRepository qaReportRepository;
    private final QaExitConferenceRepository qaExitConferenceRepository;
    private final QaFollowUpRepository qaFollowUpRepository;
    private final QaReviewEventRepository qaReviewEventRepository;
    private final ApAuditCaseRepository apAuditCaseRepository;
    private final UserJpaRepository userJpaRepository;
    private final MockTaxpayerAdapter mockTaxpayerAdapter;
    private final ComprehensiveAuditService comprehensiveAuditService;

    private static final String DEFAULT_QA_OFFICER_NAME = "Rahel Tesfaye (QA-OFF-01)";
    private static final String DEFAULT_QA_OFFICER_ID   = "u-qa-officer-1";
    private static final String DEFAULT_QA_TL_NAME      = "Tewodros Mekonnen (QA-TL-01)";
    private static final String DEFAULT_QA_TL_ID        = "u-qa-tl-1";
    private static final String DEFAULT_QA_DIR_ID       = "u-qa-director-1";

    @Transactional
    public List<QaCaseReviewResponse> getQaCases(boolean all) {
        ensureInitialQaCasesSeeded();
        return qaReviewCaseRepository.findAll().stream()
                .sorted(Comparator.comparing(QaReviewCaseEntity::getCaseNumber, Comparator.nullsLast(String::compareTo)))
                .map(this::ensureEnrichedAndMap)
                .collect(Collectors.toList());
    }

    @Transactional
    public QaCaseReviewResponse getQaCase(String id) {
        ensureInitialQaCasesSeeded();
        QaReviewCaseEntity entity = resolveEntity(id);
        return ensureEnrichedAndMap(entity);
    }

    @Transactional
    public Object getUnderlyingAuditCaseDossier(String auditCaseId) {
        UUID resolvedId = null;
        try {
            resolvedId = UUID.fromString(auditCaseId);
        } catch (Exception ignored) {
            Optional<ApAuditCaseEntity> byCaseNum = apAuditCaseRepository.findByCaseNumber(auditCaseId);
            if (byCaseNum.isPresent()) {
                resolvedId = byCaseNum.get().getId();
            } else {
                List<ApAuditCaseEntity> all = apAuditCaseRepository.findAll();
                if (!all.isEmpty()) {
                    resolvedId = all.get(0).getId();
                }
            }
        }
        if (resolvedId == null) {
            return Map.of();
        }
        try {
            return comprehensiveAuditService.getCaseSnapshot(resolvedId, DEFAULT_QA_OFFICER_ID);
        } catch (Exception e) {
            Optional<ApAuditCaseEntity> acOpt = apAuditCaseRepository.findById(resolvedId);
            Map<String, Object> fallbackDossier = new LinkedHashMap<>();
            Map<String, Object> auditCaseMap = new LinkedHashMap<>();
            if (acOpt.isPresent()) {
                ApAuditCaseEntity ac = acOpt.get();
                auditCaseMap.put("id", ac.getId().toString());
                auditCaseMap.put("caseNumber", ac.getCaseNumber());
                auditCaseMap.put("taxpayerName", ac.getTaxpayerName());
                auditCaseMap.put("tin", ac.getTin() != null ? ac.getTin() : ac.getTaxpayerId());
                auditCaseMap.put("auditType", ac.getAuditType());
                auditCaseMap.put("status", ac.getStatus());
                auditCaseMap.put("riskScore", ac.getRiskScore());
                auditCaseMap.put("assignedAuditor", ac.getAssignedAuditorId());
                auditCaseMap.put("teamLeader", ac.getAssignedTeamLeaderId());
            } else {
                auditCaseMap.put("id", resolvedId.toString());
            }
            fallbackDossier.put("auditCase", auditCaseMap);
            fallbackDossier.put("procedures", List.of(
                    Map.of("id", "AP-01", "code", "AP-01", "title", "Revenue Completeness & Invoicing Cut-off", "status", "Completed", "completed", true, "notes", "Substantive verification of declared turnover vs third-party customs and EFD receipts."),
                    Map.of("id", "AP-02", "code", "AP-02", "title", "Input VAT Credit & Withholding Tax Verification", "status", "Completed", "completed", true, "notes", "Cross-matched purchase invoices against SIGTAS VAT supplier annexes."),
                    Map.of("id", "AP-03", "code", "AP-03", "title", "Statutory Books & Working Paper Indexing", "status", "Completed", "completed", true, "notes", "Reviewed general ledger trial balance and statutory working paper references.")
            ));
            fallbackDossier.put("reconciliations", List.of(
                    Map.of("id", "REC-01", "category", "VAT Turnover vs CIT Gross Sales", "sourceALabel", "VAT Returns", "sourceAAmount", 12450000, "sourceBLabel", "CIT Gross", "sourceBAmount", 14270000, "variance", -1820000),
                    Map.of("id", "REC-02", "category", "PAYE Salaries vs P&L Payroll", "sourceALabel", "P&L Expense", "sourceAAmount", 3210000, "sourceBLabel", "PAYE Returns", "sourceBAmount", 3210000, "variance", 0),
                    Map.of("id", "REC-03", "category", "ASYCUDA Customs CIF vs Purchases", "sourceALabel", "Customs CIF", "sourceAAmount", 8940000, "sourceBLabel", "GL Imports", "sourceBAmount", 6690000, "variance", -2250000)
            ));
            fallbackDossier.put("evidence", List.of());
            fallbackDossier.put("findings", List.of());
            fallbackDossier.put("workingPapers", List.of());
            fallbackDossier.put("queries", List.of());
            return fallbackDossier;
        }
    }

    @Transactional
    public QaStatsResponse getStats() {
        ensureInitialQaCasesSeeded();
        List<QaReviewCaseEntity> allCases = qaReviewCaseRepository.findAll();
        List<QaDeficiencyEntity> allDefs = qaDeficiencyRepository.findAll();

        long totalReviews = allCases.size();
        int averageScore = totalReviews == 0 ? 0 : (int) Math.round(
                allCases.stream()
                        .mapToInt(c -> c.getOverallScore() != null ? c.getOverallScore() : 0)
                        .average()
                        .orElse(0.0)
        );
        long compliantCount = allCases.stream()
                .filter(c -> "PASSED_COMPLIANT".equalsIgnoreCase(c.getStatus())
                        || "PASSED_WITH_CONDITIONS".equalsIgnoreCase(c.getStatus())
                        || (c.getOverallScore() != null && c.getOverallScore() >= 75))
                .count();
        int compliancePassRate = totalReviews == 0 ? 0 : (int) Math.round((compliantCount * 100.0) / totalReviews);

        long totalDeficiencies = allDefs.size();
        long criticalDeficiencies = allDefs.stream()
                .filter(d -> "CRITICAL".equalsIgnoreCase(d.getSeverity()) && !"CLOSED".equalsIgnoreCase(d.getStatus()) && !"ACCEPTED_RESOLVED".equalsIgnoreCase(d.getStatus()))
                .count();

        long pendingDirectorActions = allCases.stream()
                .filter(c -> "PENDING_DIRECTOR_SIGNOFF".equalsIgnoreCase(c.getStatus()))
                .count();
        long pendingTLReviews = allCases.stream()
                .filter(c -> "PENDING_TL_REVIEW".equalsIgnoreCase(c.getStatus()) || "AUDIT_RESPONSE_RECEIVED".equalsIgnoreCase(c.getStatus()))
                .count();
        long pendingOfficerReviews = allCases.stream()
                .filter(c -> "IN_REVIEW".equalsIgnoreCase(c.getStatus()) || "RETURNED_TO_OFFICER".equalsIgnoreCase(c.getStatus()) || "PENDING_ASSIGNMENT".equalsIgnoreCase(c.getStatus()))
                .count();
        long pendingAuditTeamResponses = allCases.stream()
                .filter(c -> "DEFICIENCY_ISSUED".equalsIgnoreCase(c.getStatus()))
                .count();
        long mandatoryReaudits = allCases.stream()
                .filter(c -> "REJECTED_REAUDIT_MANDATED".equalsIgnoreCase(c.getStatus()))
                .count();
        long closedReviews = allCases.stream()
                .filter(c -> "PASSED_COMPLIANT".equalsIgnoreCase(c.getStatus())
                        || "PASSED_WITH_CONDITIONS".equalsIgnoreCase(c.getStatus())
                        || "REJECTED_REAUDIT_MANDATED".equalsIgnoreCase(c.getStatus()))
                .count();
        long openReviews = totalReviews - closedReviews;

        Map<String, Long> byStatus = allCases.stream()
                .collect(Collectors.groupingBy(
                        c -> c.getStatus() != null ? c.getStatus() : "IN_REVIEW",
                        Collectors.counting()
                ));
        Map<String, Long> byRating = allCases.stream()
                .collect(Collectors.groupingBy(
                        c -> c.getRating() != null ? c.getRating() : "SATISFACTORY",
                        Collectors.counting()
                ));
        Map<String, Long> bySelectionReason = allCases.stream()
                .collect(Collectors.groupingBy(
                        c -> c.getSelectionReason() != null ? c.getSelectionReason() : "RISK_BASED_SELECTION",
                        Collectors.counting()
                ));
        Map<String, Long> byAuditType = allCases.stream()
                .collect(Collectors.groupingBy(
                        c -> c.getAuditType() != null ? c.getAuditType() : "Comprehensive",
                        Collectors.counting()
                ));

        return QaStatsResponse.builder()
                .totalReviews(totalReviews)
                .averageScore(averageScore)
                .compliancePassRate(compliancePassRate)
                .totalDeficiencies(totalDeficiencies)
                .criticalDeficiencies(criticalDeficiencies)
                .pendingDirectorActions(pendingDirectorActions)
                .pendingTLReviews(pendingTLReviews)
                .openReviews(openReviews)
                .closedReviews(closedReviews)
                .pendingOfficerReviews(pendingOfficerReviews)
                .pendingAuditTeamResponses(pendingAuditTeamResponses)
                .pendingExitConferences(0)
                .pendingFollowUps(totalDeficiencies)
                .mandatoryReaudits(mandatoryReaudits)
                .recommendationsAddressed(closedReviews)
                .recommendationsNotAddressed(openReviews)
                .byStatus(byStatus)
                .byRating(byRating)
                .bySelectionReason(bySelectionReason)
                .byAuditType(byAuditType)
                .build();
    }

    @Transactional
    public QaCaseReviewResponse updateQaCase(String caseId, Map<String, Object> updates, String actorId) {
        QaReviewCaseEntity entity = resolveEntity(caseId);
        if (updates.containsKey("overallScore") && updates.get("overallScore") instanceof Number n) {
            entity.setOverallScore(n.intValue());
        }
        if (updates.containsKey("rating") && updates.get("rating") != null) {
            entity.setRating(String.valueOf(updates.get("rating")));
        }
        if (updates.containsKey("status") && updates.get("status") != null) {
            entity.setStatus(String.valueOf(updates.get("status")));
        }
        if (updates.containsKey("assignedQAOfficer") && updates.get("assignedQAOfficer") != null) {
            entity.setAssignedQaOfficer(String.valueOf(updates.get("assignedQAOfficer")));
        }
        if (updates.containsKey("qaTeamLeader") && updates.get("qaTeamLeader") != null) {
            entity.setQaTeamLeader(String.valueOf(updates.get("qaTeamLeader")));
        }
        entity.setLastSavedAt(OffsetDateTime.now());
        entity = qaReviewCaseRepository.save(entity);

        recordEvent(entity.getId(), "FR-04.9.2-04", "CASE_DRAFT_SAVED",
                entity.getStatus(), entity.getStatus(), actorId, "QA Officer",
                "Saved QA review working progress (Score: " + entity.getOverallScore() + "%, Rating: " + entity.getRating() + ").");

        return ensureEnrichedAndMap(entity);
    }

    @Transactional
    @SuppressWarnings("unchecked")
    public Map<String, Object> updateDimension(String caseId, String dimId, Map<String, Object> updates, String actorId) {
        QaReviewCaseEntity caseEntity = resolveEntity(caseId);
        ensureDimensionsExist(caseEntity);

        QaReviewDimensionEntity dimEntity = qaReviewDimensionRepository
                .findByQaReviewCaseIdAndDimensionCode(caseEntity.getId(), dimId)
                .orElseGet(() -> {
                    try {
                        return qaReviewDimensionRepository.findById(UUID.fromString(dimId)).orElse(null);
                    } catch (Exception ignored) {
                        return null;
                    }
                });

        if (dimEntity == null) {
            List<QaReviewDimensionEntity> allDims = qaReviewDimensionRepository
                    .findByQaReviewCaseIdOrderByDisplayOrderAsc(caseEntity.getId());
            if (!allDims.isEmpty()) {
                dimEntity = allDims.get(0);
            }
        }

        if (dimEntity != null) {
            if (updates.containsKey("reviewerNotes") && updates.get("reviewerNotes") != null) {
                dimEntity.setReviewerNotes(String.valueOf(updates.get("reviewerNotes")));
            }
            if (updates.containsKey("checkpoints") && updates.get("checkpoints") instanceof List<?> rawCps) {
                List<Map<String, Object>> cpList = new ArrayList<>();
                for (Object item : rawCps) {
                    if (item instanceof Map<?, ?> m) {
                        Map<String, Object> cp = new LinkedHashMap<>();
                        m.forEach((k, v) -> cp.put(String.valueOf(k), v));
                        cpList.add(cp);
                    }
                }
                dimEntity.setCheckpoints(cpList);

                int total = cpList.size();
                long passed = cpList.stream()
                        .filter(cp -> Boolean.TRUE.equals(cp.get("isSatisfied")) || "true".equalsIgnoreCase(String.valueOf(cp.get("isSatisfied"))))
                        .count();
                boolean criticalFailed = cpList.stream()
                        .anyMatch(cp -> (Boolean.TRUE.equals(cp.get("isCritical")) || "true".equalsIgnoreCase(String.valueOf(cp.get("isCritical"))))
                                && !(Boolean.TRUE.equals(cp.get("isSatisfied")) || "true".equalsIgnoreCase(String.valueOf(cp.get("isSatisfied")))));

                int computedScore = total > 0 ? (int) Math.round((passed * 100.0) / total) : dimEntity.getScore();
                dimEntity.setScore(computedScore);

                String computedStatus;
                if (computedScore >= 85 && !criticalFailed) {
                    computedStatus = "COMPLIANT";
                } else if (computedScore >= 70 && !criticalFailed) {
                    computedStatus = "MINOR_DEFICIENCY";
                } else if (computedScore >= 50) {
                    computedStatus = "MATERIAL_DEFICIENCY";
                } else {
                    computedStatus = "CRITICAL_FAILURE";
                }
                dimEntity.setStatus(computedStatus);
            } else {
                if (updates.containsKey("score") && updates.get("score") instanceof Number n) {
                    dimEntity.setScore(n.intValue());
                }
                if (updates.containsKey("status") && updates.get("status") != null) {
                    dimEntity.setStatus(String.valueOf(updates.get("status")));
                }
            }

            dimEntity.setScoredBy(actorId);
            dimEntity.setScoredAt(OffsetDateTime.now());
            dimEntity = qaReviewDimensionRepository.save(dimEntity);
        }

        // Recompute overall weighted score across all 7 ISO 19011 dimensions
        List<QaReviewDimensionEntity> allDims = qaReviewDimensionRepository
                .findByQaReviewCaseIdOrderByDisplayOrderAsc(caseEntity.getId());
        int totalWeight = allDims.stream().mapToInt(d -> d.getWeight() != null ? d.getWeight() : 0).sum();
        double weightedSum = allDims.stream()
                .mapToDouble(d -> (d.getScore() != null ? d.getScore() : 0) * (d.getWeight() != null ? d.getWeight() : 0))
                .sum();
        int overallScore = totalWeight > 0 ? (int) Math.round(weightedSum / totalWeight) : 0;
        String rating = computeRating(overallScore);

        caseEntity.setOverallScore(overallScore);
        caseEntity.setRating(rating);
        caseEntity.setLastSavedAt(OffsetDateTime.now());
        caseEntity = qaReviewCaseRepository.save(caseEntity);

        // Sync report score/rating if a report exists
        syncReportWithCase(caseEntity);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", true);
        result.put("dimension", dimEntity != null ? mapToDimensionResponse(dimEntity) : null);
        result.put("overallScore", overallScore);
        result.put("rating", rating);
        return result;
    }

    @Transactional
    public Map<String, Object> executeWorkflow(String id, QaWorkflowRequest request, String actorId) {
        QaReviewCaseEntity entity = resolveEntity(id);
        String oldStatus = entity.getStatus();
        String action = request.getAction() != null ? request.getAction().trim().toUpperCase() : "";
        String comment = request.getComment();
        String stepCode = "FR-04.9.2-05";
        String actorRole = "QA_OFFICER";

        switch (action) {
            case "SUBMIT_TO_TL":
            case "SUBMIT_FOR_REVIEW":
            case "SUBMIT_REPORT_TO_TL":
                entity.setStatus(QaReviewCaseEntity.STATUS_PENDING_TL_REVIEW);
                entity.setCurrentStep("FR-04.9.2-05");
                stepCode = "FR-04.9.2-05";
                actorRole = "QA_OFFICER";
                break;

            case "RECOMMEND_FOR_DIRECTOR_SIGNOFF":
            case "ENDORSE":
            case "APPROVE_REPORT":
            case "APPROVE_ADJUSTED_REPORT":
                entity.setStatus(QaReviewCaseEntity.STATUS_PENDING_DIRECTOR_SIGNOFF);
                entity.setCurrentStep("FR-04.9.2-11");
                if (comment != null && !comment.isBlank()) {
                    entity.setQaTeamLeaderComment(comment);
                }
                entity.setQaTeamLeaderDecisionDate(OffsetDateTime.now());
                stepCode = "FR-04.9.2-11";
                actorRole = "QA_TEAM_LEADER";
                break;

            case "ISSUE_DEFICIENCY_NOTICE":
                entity.setStatus(QaReviewCaseEntity.STATUS_DEFICIENCY_ISSUED);
                entity.setCurrentStep("FR-04.9.2-06");
                if (comment != null && !comment.isBlank()) {
                    entity.setQaTeamLeaderComment(comment);
                }
                entity.setQaTeamLeaderDecisionDate(OffsetDateTime.now());
                stepCode = "FR-04.9.2-06";
                actorRole = "QA_TEAM_LEADER";
                break;

            case "RETURN_TO_OFFICER":
            case "RETURN":
            case "RETURN_REPORT":
                entity.setStatus(QaReviewCaseEntity.STATUS_RETURNED_TO_OFFICER);
                entity.setCurrentStep("FR-04.9.2-05");
                if (comment != null && !comment.isBlank()) {
                    entity.setQaTeamLeaderComment(comment);
                }
                entity.setQaTeamLeaderDecisionDate(OffsetDateTime.now());
                stepCode = "FR-04.9.2-05";
                actorRole = "QA_TEAM_LEADER";
                break;

            case "SUBMIT_AUDIT_RESPONSE":
                entity.setStatus(QaReviewCaseEntity.STATUS_AUDIT_RESPONSE_RECEIVED);
                entity.setCurrentStep("FR-04.9.2-04");
                entity.setAuditTeamResponseNotes(comment);
                entity.setAuditTeamResponseDate(OffsetDateTime.now());
                entity.setAuditTeamRespondedBy(actorId);
                stepCode = "FR-04.9.2-04";
                actorRole = "AUDITOR";
                // Update open deficiencies with auditor response
                List<QaDeficiencyEntity> openDefs = qaDeficiencyRepository.findByQaCaseId(entity.getId());
                for (QaDeficiencyEntity def : openDefs) {
                    if ("OPEN".equalsIgnoreCase(def.getStatus())) {
                        def.setStatus("REMEDIATION_SUBMITTED");
                        qaDeficiencyRepository.save(def);
                    }
                }
                break;

            case "DIRECTOR_CERTIFY_COMPLIANT":
            case "CLOSE_REVIEW":
                entity.setStatus(QaReviewCaseEntity.STATUS_PASSED_COMPLIANT);
                entity.setCurrentStep("FR-04.9.2-13");
                if (comment != null && !comment.isBlank()) {
                    entity.setDirectorExecutiveComment(comment);
                }
                entity.setDirectorExecutiveDecisionDate(OffsetDateTime.now());
                entity.setDirectorStatutoryOrder("CERTIFY_COMPLIANT");
                entity.setRecommendationsAddressed(true);
                entity.setClosureCheckedBy(actorId);
                entity.setClosureCheckedAt(OffsetDateTime.now());
                entity.setClosedAt(OffsetDateTime.now());
                stepCode = "FR-04.9.2-13";
                actorRole = "QA_DIRECTOR";
                List<QaDeficiencyEntity> defsToClose = qaDeficiencyRepository.findByQaCaseId(entity.getId());
                for (QaDeficiencyEntity def : defsToClose) {
                    def.setStatus("ACCEPTED_RESOLVED");
                    qaDeficiencyRepository.save(def);
                }
                break;

            case "DIRECTOR_ORDER_REAUDIT":
                entity.setStatus(QaReviewCaseEntity.STATUS_REJECTED_REAUDIT_MANDATED);
                entity.setCurrentStep("FR-04.9.2-12");
                if (comment != null && !comment.isBlank()) {
                    entity.setDirectorExecutiveComment(comment);
                }
                entity.setDirectorExecutiveDecisionDate(OffsetDateTime.now());
                entity.setDirectorStatutoryOrder("ORDER_FULL_REAUDIT");
                entity.setRecommendationsAddressed(false);
                stepCode = "FR-04.9.2-12";
                actorRole = "QA_DIRECTOR";
                break;

            default:
                log.info("Executing generic QA workflow action {} on case {}", action, id);
                break;
        }

        entity.setLastSavedAt(OffsetDateTime.now());
        entity = qaReviewCaseRepository.save(entity);
        syncReportWithCase(entity);

        recordEvent(entity.getId(), stepCode, action, oldStatus, entity.getStatus(),
                actorId, actorRole, comment != null ? comment : ("Executed " + action));

        QaCaseReviewResponse reviewResponse = ensureEnrichedAndMap(entity);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("review", reviewResponse);
        response.put("message", "QA workflow transition " + action + " executed successfully.");
        return response;
    }

    @Transactional
    public QaDeficiencyResponse createDeficiency(String caseId, QaDeficiencyRequest request, String actorId) {
        QaReviewCaseEntity caseEntity = resolveEntity(caseId);

        QaDeficiencyEntity defEntity = QaDeficiencyEntity.builder()
                .qaCaseId(caseEntity.getId())
                .dimensionId(request.getDimensionId() != null ? request.getDimensionId() : "DIM-01")
                .dimensionTitle(request.getDimensionTitle() != null ? request.getDimensionTitle() : "Audit Quality Standard")
                .severity(request.getSeverity() != null ? request.getSeverity() : "MAJOR")
                .title(request.getTitle())
                .findingDescription(request.getFindingDescription())
                .statutoryBreach(request.getStatutoryBreach() != null ? request.getStatutoryBreach() : "SOR FR-04.5 / ISO 19011")
                .correctiveActionMandate(request.getCorrectiveActionMandate())
                .status("OPEN")
                .build();

        defEntity = qaDeficiencyRepository.save(defEntity);

        if ("CRITICAL".equalsIgnoreCase(request.getSeverity())) {
            log.warn("DISCIPLINARY ALERT: Critical deficiency logged on QA Case {}. Alerting management and HR.", caseId);
        }

        caseEntity.setLastSavedAt(OffsetDateTime.now());
        qaReviewCaseRepository.save(caseEntity);
        syncReportWithCase(caseEntity);

        recordEvent(caseEntity.getId(), "FR-04.9.2-06", "LOG_DEFICIENCY",
                caseEntity.getStatus(), caseEntity.getStatus(), actorId, "QA_OFFICER",
                "Logged " + defEntity.getSeverity() + " deficiency: " + defEntity.getTitle());

        return mapToDeficiencyResponse(defEntity, caseEntity.getAuditTeamResponseNotes());
    }

    @Transactional
    public QaDeficiencyResponse updateDeficiency(String caseId, String defId, QaDeficiencyRequest request, String actorId) {
        QaReviewCaseEntity caseEntity = resolveEntity(caseId);
        QaDeficiencyEntity defEntity = null;
        try {
            defEntity = qaDeficiencyRepository.findById(UUID.fromString(defId)).orElse(null);
        } catch (IllegalArgumentException e) {
            return QaDeficiencyResponse.builder().id(defId).status(request.getStatus()).build();
        }
        if (defEntity == null) {
            return QaDeficiencyResponse.builder().id(defId).status(request.getStatus()).build();
        }

        if (request.getDimensionId() != null) defEntity.setDimensionId(request.getDimensionId());
        if (request.getDimensionTitle() != null) defEntity.setDimensionTitle(request.getDimensionTitle());
        if (request.getSeverity() != null) defEntity.setSeverity(request.getSeverity());
        if (request.getTitle() != null) defEntity.setTitle(request.getTitle());
        if (request.getFindingDescription() != null) defEntity.setFindingDescription(request.getFindingDescription());
        if (request.getStatutoryBreach() != null) defEntity.setStatutoryBreach(request.getStatutoryBreach());
        if (request.getCorrectiveActionMandate() != null) defEntity.setCorrectiveActionMandate(request.getCorrectiveActionMandate());
        if (request.getStatus() != null) defEntity.setStatus(request.getStatus());

        defEntity = qaDeficiencyRepository.save(defEntity);
        syncReportWithCase(caseEntity);
        return mapToDeficiencyResponse(defEntity, caseEntity.getAuditTeamResponseNotes());
    }

    @Transactional
    public void deleteDeficiency(String caseId, String defId, String actorId) {
        QaReviewCaseEntity caseEntity = resolveEntity(caseId);
        try {
            qaDeficiencyRepository.deleteById(UUID.fromString(defId));
            syncReportWithCase(caseEntity);
            recordEvent(caseEntity.getId(), "FR-04.9.2-06", "DELETE_DEFICIENCY",
                    caseEntity.getStatus(), caseEntity.getStatus(), actorId, "QA_OFFICER",
                    "Removed deficiency item " + defId);
        } catch (Exception ignored) {}
    }

    @Transactional
    public QaReportResponse generateReport(String caseId, QaReportRequest request, String actorId) {
        QaReviewCaseEntity caseEntity = resolveEntity(caseId);
        QaReportEntity report = qaReportRepository.findByQaCaseId(caseEntity.getId())
                .orElse(QaReportEntity.builder().qaCaseId(caseEntity.getId()).build());

        report.setGeneratedDate(LocalDate.now().toString());
        report.setExecutiveSummary(request.getExecutiveSummary());
        report.setOverallRating(request.getOverallRating() != null ? request.getOverallRating() : caseEntity.getRating());
        report.setTotalWeightedScore(request.getTotalWeightedScore() != null ? request.getTotalWeightedScore() : caseEntity.getOverallScore());
        report.setCriticalDeficienciesCount(request.getCriticalDeficienciesCount() != null ? request.getCriticalDeficienciesCount() : 0);
        report.setMajorDeficienciesCount(request.getMajorDeficienciesCount() != null ? request.getMajorDeficienciesCount() : 0);
        report.setKeyStrengths(request.getKeyStrengths());
        report.setSystemicVulnerabilities(request.getSystemicVulnerabilities());
        report.setRecommendationsForDirector(request.getRecommendationsForDirector());
        report.setMandatoryCorrectiveActions(request.getMandatoryCorrectiveActions());

        report = qaReportRepository.save(report);
        recordEvent(caseEntity.getId(), "FR-04.9.2-05", "GENERATE_QA_REPORT",
                caseEntity.getStatus(), caseEntity.getStatus(), actorId, "QA_OFFICER",
                "Generated formal ISO 19011 Quality Assurance Review Report.");

        return mapToReportResponse(report, caseEntity);
    }

    @Transactional
    public QaExitConferenceDto saveExitConference(UUID caseId, QaExitConferenceDto request, String actorId) {
        QaExitConferenceEntity conf = qaExitConferenceRepository.findByQaCaseId(caseId)
                .orElse(QaExitConferenceEntity.builder().qaCaseId(caseId).build());

        conf.setScheduledDate(request.getScheduledDate());
        conf.setStatus(request.getStatus());
        conf.setMinutes(request.getMinutes());
        conf.setAuditorComments(request.getAuditorComments());
        conf.setResolvedFlag(request.getResolvedFlag());

        conf = qaExitConferenceRepository.save(conf);
        request.setId(conf.getId().toString());
        return request;
    }

    @Transactional
    public QaFollowUpDto saveFollowUp(UUID caseId, QaFollowUpDto request, String actorId) {
        QaFollowUpEntity fu = null;
        if (request.getId() != null && !request.getId().isEmpty()) {
            fu = qaFollowUpRepository.findById(UUID.fromString(request.getId())).orElse(null);
        }
        if (fu == null) {
            fu = QaFollowUpEntity.builder()
                    .qaCaseId(caseId)
                    .deficiencyId(UUID.fromString(request.getDeficiencyId()))
                    .build();
        }

        fu.setOriginalAuditorId(request.getOriginalAuditorId());
        fu.setStatus(request.getStatus());
        fu.setDueDate(request.getDueDate());
        fu.setCorrectiveActionProof(request.getCorrectiveActionProof());

        fu = qaFollowUpRepository.save(fu);
        request.setId(fu.getId().toString());

        if ("APPROVED".equals(request.getStatus())) {
            qaDeficiencyRepository.findById(fu.getDeficiencyId()).ifPresent(def -> {
                def.setStatus("ACCEPTED_RESOLVED");
                qaDeficiencyRepository.save(def);
            });
        }

        return request;
    }

    // ── Internal Resolution, Seeding & Mapping Helpers ───────────────────────

    private QaReviewCaseEntity resolveEntity(String caseId) {
        if (caseId == null || caseId.isBlank() || "null".equalsIgnoreCase(caseId) || "undefined".equalsIgnoreCase(caseId)) {
            List<QaReviewCaseEntity> all = qaReviewCaseRepository.findAll();
            if (!all.isEmpty()) {
                return all.stream()
                        .sorted(Comparator.comparing(QaReviewCaseEntity::getCaseNumber, Comparator.nullsLast(String::compareTo)))
                        .findFirst()
                        .get();
            }
        }

        // 1. Try UUID lookup
        try {
            UUID uuid = UUID.fromString(caseId);
            Optional<QaReviewCaseEntity> byId = qaReviewCaseRepository.findById(uuid);
            if (byId.isPresent()) return byId.get();
        } catch (IllegalArgumentException ignored) {}

        // 2. Try direct caseNumber lookup (e.g. QA-REV-2026-001 or QA-2026-001)
        Optional<QaReviewCaseEntity> byNum = qaReviewCaseRepository.findByCaseNumber(caseId);
        if (byNum.isPresent()) return byNum.get();

        // 3. Try normalized QA-2026-00X <-> QA-REV-2026-00X alias
        if (caseId != null && caseId.startsWith("QA-2026-")) {
            String revCode = caseId.replace("QA-2026-", "QA-REV-2026-");
            Optional<QaReviewCaseEntity> byRev = qaReviewCaseRepository.findByCaseNumber(revCode);
            if (byRev.isPresent()) return byRev.get();
        } else if (caseId != null && caseId.startsWith("QA-REV-2026-")) {
            String shortCode = caseId.replace("QA-REV-2026-", "QA-2026-");
            Optional<QaReviewCaseEntity> byShort = qaReviewCaseRepository.findByCaseNumber(shortCode);
            if (byShort.isPresent()) return byShort.get();
        }

        // 4. Match by auditCaseNumber or auditCaseId
        List<QaReviewCaseEntity> all = qaReviewCaseRepository.findAll();
        for (QaReviewCaseEntity c : all) {
            if (caseId != null && (caseId.equalsIgnoreCase(c.getAuditCaseNumber())
                    || (c.getAuditCaseId() != null && caseId.equalsIgnoreCase(c.getAuditCaseId().toString())))) {
                return c;
            }
        }

        if (!all.isEmpty()) {
            return all.get(0);
        }

        return createQaCaseFromRealAuditCase(caseId, 1, "IN_REVIEW", "MANDATORY_HIGH_EXPOSURE", 76);
    }

    @Transactional
    public void ensureInitialQaCasesSeeded() {
        long existingCount = qaReviewCaseRepository.count();
        if (existingCount >= 4) {
            return;
        }

        List<ApAuditCaseEntity> allAuditCases = apAuditCaseRepository.findAll();
        if (allAuditCases.isEmpty()) {
            return;
        }

        // Select diverse real audit cases across Comprehensive, Joint, Desk, Transfer Pricing, and Issue Audit
        List<ApAuditCaseEntity> selected = new ArrayList<>();
        pickByType(allAuditCases, selected, "Comprehensive");
        pickByType(allAuditCases, selected, "Joint");
        pickByType(allAuditCases, selected, "Desk");
        pickByType(allAuditCases, selected, "Transfer Pricing");
        pickByType(allAuditCases, selected, "Issue");

        for (ApAuditCaseEntity ac : allAuditCases) {
            if (selected.size() >= 5) break;
            if (selected.stream().noneMatch(s -> s.getId().equals(ac.getId()))) {
                selected.add(ac);
            }
        }

        String[] statuses = {
            QaReviewCaseEntity.STATUS_IN_REVIEW,
            QaReviewCaseEntity.STATUS_PENDING_TL_REVIEW,
            QaReviewCaseEntity.STATUS_DEFICIENCY_ISSUED,
            QaReviewCaseEntity.STATUS_PENDING_DIRECTOR_SIGNOFF,
            QaReviewCaseEntity.STATUS_PASSED_COMPLIANT
        };
        String[] reasons = {
            "MANDATORY_HIGH_EXPOSURE",
            "MANDATORY_HIGH_EXPOSURE",
            "RISK_BASED_SELECTION",
            "DIRECTOR_REFERRAL",
            "RANDOM_STATUTORY_SAMPLE"
        };
        int[] targetScores = { 76, 91, 58, 88, 94 };

        for (int i = 0; i < selected.size(); i++) {
            ApAuditCaseEntity ac = selected.get(i);
            String caseNum = String.format("QA-REV-2026-%03d", i + 1);
            if (qaReviewCaseRepository.findByCaseNumber(caseNum).isPresent()
                    || qaReviewCaseRepository.existsByAuditCaseId(ac.getId())) {
                continue;
            }
            seedSingleQaCase(ac, caseNum, i + 1, statuses[i % statuses.length], reasons[i % reasons.length], targetScores[i % targetScores.length]);
        }
    }

    private void pickByType(List<ApAuditCaseEntity> pool, List<ApAuditCaseEntity> target, String typeKeyword) {
        pool.stream()
                .filter(c -> c.getAuditType() != null && c.getAuditType().toLowerCase().contains(typeKeyword.toLowerCase()))
                .filter(c -> target.stream().noneMatch(t -> t.getId().equals(c.getId())))
                .findFirst()
                .ifPresent(target::add);
    }

    private QaReviewCaseEntity createQaCaseFromRealAuditCase(String requestedCaseNum, int index, String status, String reason, int targetScore) {
        List<ApAuditCaseEntity> allAuditCases = apAuditCaseRepository.findAll();
        if (!allAuditCases.isEmpty()) {
            return seedSingleQaCase(allAuditCases.get(0),
                    requestedCaseNum != null && !requestedCaseNum.isBlank() ? requestedCaseNum : "QA-REV-2026-001",
                    index, status, reason, targetScore);
        }
        QaReviewCaseEntity fallback = QaReviewCaseEntity.builder()
                .caseNumber(requestedCaseNum != null ? requestedCaseNum : "QA-REV-2026-001")
                .auditCaseId(UUID.randomUUID())
                .auditCaseNumber("COMP-LTO-2026-0001")
                .auditType("Comprehensive")
                .taxpayerName("Abyssinia Industrial Holdings PLC")
                .tradeName("Abyssinia Holdings")
                .tin("0041982731")
                .taxPeriod("FY 2024/2025")
                .totalTaxAssessment(new BigDecimal("4850000.00"))
                .leadAuditor("Mekdes Abebe")
                .auditTeamLeader("Berhanu Bekele")
                .selectionReason(reason)
                .samplingStrategy(reason)
                .selectionDate(LocalDate.now().minusDays(7))
                .dueDate(LocalDate.now().plusDays(10))
                .assignedQaOfficer(DEFAULT_QA_OFFICER_NAME)
                .assignedQaOfficerId(DEFAULT_QA_OFFICER_ID)
                .qaTeamLeader(DEFAULT_QA_TL_NAME)
                .qaTeamLeaderId(DEFAULT_QA_TL_ID)
                .qaDirectorId(DEFAULT_QA_DIR_ID)
                .status(status)
                .overallScore(targetScore)
                .rating(computeRating(targetScore))
                .lastSavedAt(OffsetDateTime.now())
                .build();
        fallback = qaReviewCaseRepository.save(fallback);
        ensureDimensionsExist(fallback);
        return fallback;
    }

    private QaReviewCaseEntity seedSingleQaCase(ApAuditCaseEntity ac, String caseNum, int index,
                                                String status, String reason, int targetScore) {
        String leadAuditorName = resolveUserName(ac.getAssignedAuditorId(), "Mekdes Abebe (Senior Auditor)");
        String teamLeaderName = resolveUserName(ac.getAssignedTeamLeaderId(), "Berhanu Bekele (Audit Team Leader)");
        BigDecimal assessment = ac.getEstimatedRevenue() != null && ac.getEstimatedRevenue() > 0
                ? BigDecimal.valueOf(ac.getEstimatedRevenue())
                : new BigDecimal(2450000L + (index * 1150000L));

        String resolvedTin = ac.getTin() != null ? ac.getTin() : ac.getTaxpayerId();
        String taxpayerName = ac.getTaxpayerName();
        String tradeName = ac.getTaxpayerName() != null ? ac.getTaxpayerName() + " Enterprise" : "Registered Commercial Taxpayer";
        if (resolvedTin != null) {
            try {
                Map<String, Object> tp = mockTaxpayerAdapter.getTaxpayerById(resolvedTin);
                if (tp != null) {
                    Object nameObj = tp.get("name") != null ? tp.get("name") : tp.get("taxpayer_name");
                    if ((taxpayerName == null || taxpayerName.isBlank()) && nameObj != null) {
                        taxpayerName = String.valueOf(nameObj);
                    }
                    Object sectorObj = tp.get("sector");
                    if (taxpayerName != null && sectorObj != null) {
                        tradeName = taxpayerName + " (" + sectorObj + ")";
                    }
                }
            } catch (Exception ignored) {}
        }

        String periodStr = ac.getStartDate() != null
                ? ("FY " + ac.getStartDate().getYear() + " (12M)")
                : "FY 2024/2025 (12M)";

        QaReviewCaseEntity entity = QaReviewCaseEntity.builder()
                .caseNumber(caseNum)
                .auditCaseId(ac.getId())
                .auditCaseNumber(ac.getCaseNumber())
                .auditType(ac.getAuditType() != null ? ac.getAuditType() : "Comprehensive")
                .taxpayerName(taxpayerName != null ? taxpayerName : ("Taxpayer " + resolvedTin))
                .tradeName(tradeName)
                .tin(resolvedTin != null ? resolvedTin : "0010023456")
                .taxPeriod(periodStr)
                .totalTaxAssessment(assessment)
                .leadAuditor(leadAuditorName)
                .leadAuditorId(ac.getAssignedAuditorId())
                .auditTeamLeader(teamLeaderName)
                .auditTeamLeaderId(ac.getAssignedTeamLeaderId())
                .selectionReason(reason)
                .samplingStrategy(reason)
                .samplingRuleCode("SOR-FR-04.9.2-R0" + index)
                .samplingScore(ac.getRiskScore() != null ? ac.getRiskScore() : (78 + index * 3))
                .selectionDate(LocalDate.now().minusDays(10 - index))
                .dueDate(LocalDate.now().plusDays(7 + index * 3))
                .assignedQaOfficer(DEFAULT_QA_OFFICER_NAME)
                .assignedQaOfficerId(DEFAULT_QA_OFFICER_ID)
                .assignedAt(OffsetDateTime.now().minusDays(9 - index))
                .assignedBy(DEFAULT_QA_TL_ID)
                .qaTeamLeader(DEFAULT_QA_TL_NAME)
                .qaTeamLeaderId(DEFAULT_QA_TL_ID)
                .qaDirectorId(DEFAULT_QA_DIR_ID)
                .status(status)
                .currentStep(stepForStatus(status))
                .overallScore(targetScore)
                .rating(computeRating(targetScore))
                .lastSavedAt(OffsetDateTime.now().minusHours(index * 2L))
                .build();

        if ("DEFICIENCY_ISSUED".equals(status)) {
            entity.setQaTeamLeaderComment("Formal Quality Deficiency Notice issued under SOR FR-04.9.2-06: Audit team must attach corroborated 3-way VAT vs EFD fiscal reconciliation schedules and statutory citations before final assessment clearance.");
            entity.setQaTeamLeaderDecisionDate(OffsetDateTime.now().minusDays(2));
        } else if ("PENDING_DIRECTOR_SIGNOFF".equals(status)) {
            entity.setAuditTeamResponseNotes("Attached rectified Working Paper [WP-RECTIFIED-REV-04] with third-party customs and bank confirmations reconciled to General Ledger.");
            entity.setAuditTeamResponseDate(OffsetDateTime.now().minusDays(2));
            entity.setAuditTeamRespondedBy(ac.getAssignedAuditorId());
            entity.setQaTeamLeaderComment("Quality Assurance standards verified and validated across all 7 ISO 19011 dimensions. Substantive procedures and 3-way reconciliations satisfy MOR quality benchmarks. Recommended for Director Statutory Certification.");
            entity.setQaTeamLeaderDecisionDate(OffsetDateTime.now().minusDays(1));
        } else if ("PASSED_COMPLIANT".equals(status)) {
            entity.setQaTeamLeaderComment("All 7 ISO 19011 dimensions verified compliant. Forwarded for executive statutory certification.");
            entity.setQaTeamLeaderDecisionDate(OffsetDateTime.now().minusDays(3));
            entity.setDirectorExecutiveComment("The Directorate has examined the inspection working papers and hereby issues the official Statutory Quality Assurance Certificate under SOR FR-04.5. The audit findings and assessment notice are cleared for statutory issuance.");
            entity.setDirectorExecutiveDecisionDate(OffsetDateTime.now().minusDays(1));
            entity.setDirectorStatutoryOrder("CERTIFY_COMPLIANT");
            entity.setRecommendationsAddressed(true);
            entity.setClosedAt(OffsetDateTime.now().minusDays(1));
        }

        entity = qaReviewCaseRepository.save(entity);
        seedDimensionsForTargetScore(entity, targetScore);
        seedInitialDeficienciesAndReport(entity, index, status, targetScore);
        seedInitialEvents(entity);
        return entity;
    }

    private void ensureDimensionsExist(QaReviewCaseEntity entity) {
        if (qaReviewDimensionRepository.countByQaReviewCaseId(entity.getId()) == 0) {
            seedDimensionsForTargetScore(entity, entity.getOverallScore() != null && entity.getOverallScore() > 0 ? entity.getOverallScore() : 78);
        }
    }

    private void seedDimensionsForTargetScore(QaReviewCaseEntity entity, int targetScore) {
        List<QaReviewDimensionEntity> dims = QaDimensionCatalogue.buildFor(entity.getId());
        int idx = 0;
        for (QaReviewDimensionEntity dim : dims) {
            List<Map<String, Object>> cps = new ArrayList<>();
            int cpIdx = 0;
            for (Map<String, Object> rawCp : dim.getCheckpoints()) {
                Map<String, Object> cp = new LinkedHashMap<>(rawCp);
                boolean satisfied;
                if (targetScore >= 88) {
                    satisfied = !(idx == 4 && cpIdx == 2); // almost all satisfied
                } else if (targetScore >= 72) {
                    satisfied = (cpIdx < 2) || (idx % 2 == 0);
                } else {
                    satisfied = (cpIdx == 0 && idx % 2 == 0) || (cpIdx == 1 && idx < 3);
                }
                cp.put("isSatisfied", satisfied);
                cp.put("auditorEvidenceRef", "WP-" + dim.getDimensionCode() + "-0" + (cpIdx + 1));
                if (!satisfied) {
                    cp.put("notes", "Requires corroborating working paper cross-reference under " + dim.getStandardsReference());
                }
                cps.add(cp);
                cpIdx++;
            }
            int total = cps.size();
            long passed = cps.stream().filter(c -> Boolean.TRUE.equals(c.get("isSatisfied"))).count();
            int dimScore = total > 0 ? (int) Math.round((passed * 100.0) / total) : 75;
            String dimStatus = dimScore >= 85 ? "COMPLIANT"
                    : dimScore >= 65 ? "MINOR_DEFICIENCY"
                    : dimScore >= 45 ? "MATERIAL_DEFICIENCY" : "CRITICAL_FAILURE";

            dim.setCheckpoints(cps);
            dim.setScore(dimScore);
            dim.setStatus(dimStatus);
            dim.setReviewerNotes("Inspected audit working papers for " + entity.getAuditCaseNumber()
                    + " (" + entity.getAuditType() + "). Verified " + passed + " of " + total + " statutory checkpoints.");
            dim.setScoredBy(DEFAULT_QA_OFFICER_ID);
            dim.setScoredAt(OffsetDateTime.now().minusHours(4));
            idx++;
        }
        qaReviewDimensionRepository.saveAll(dims);

        // Update exact weighted overallScore
        int totalWeight = dims.stream().mapToInt(QaReviewDimensionEntity::getWeight).sum();
        double weightedSum = dims.stream().mapToDouble(d -> d.getScore() * d.getWeight()).sum();
        int computedOverall = totalWeight > 0 ? (int) Math.round(weightedSum / totalWeight) : targetScore;
        entity.setOverallScore(computedOverall);
        entity.setRating(computeRating(computedOverall));
        qaReviewCaseRepository.save(entity);
    }

    private void seedInitialDeficienciesAndReport(QaReviewCaseEntity entity, int index, String status, int score) {
        if (qaDeficiencyRepository.findByQaCaseId(entity.getId()).isEmpty()) {
            if ("IN_REVIEW".equals(status) || "DEFICIENCY_ISSUED".equals(status)) {
                qaDeficiencyRepository.save(QaDeficiencyEntity.builder()
                        .qaCaseId(entity.getId())
                        .dimensionId("DIM-02")
                        .dimensionTitle("CAAT Forensic Execution & Third-Party Evidence Sufficiency")
                        .severity("MAJOR")
                        .title("Incomplete Third-Party Bank & Customs CIF Corroboration")
                        .findingDescription("During QA inspection of " + entity.getAuditCaseNumber() + ", variance between declared VAT sales and EFD/ASYCUDA import records lacked signed third-party bank confirmation schedules.")
                        .statutoryBreach("SOR FR-04.5-02 / ISO 19011 Clause 6.4.4")
                        .correctiveActionMandate("Attach signed bank confirmation schedule and cross-reference CAAT exception log to Working Paper WP-CAAT-02.")
                        .status("OPEN")
                        .build());
            }
            if ("DEFICIENCY_ISSUED".equals(status)) {
                qaDeficiencyRepository.save(QaDeficiencyEntity.builder()
                        .qaCaseId(entity.getId())
                        .dimensionId("DIM-05")
                        .dimensionTitle("Technical Tax Law Application & Statutory Citations")
                        .severity("CRITICAL")
                        .title("Missing Statutory Proclamation Citation on Disallowed Expense Adjustment")
                        .findingDescription("Proposed disallowance of undocumented expenses did not cite the specific article of Federal Income Tax Proclamation No. 979/2016 and Tax Administration Proclamation No. 983/2016.")
                        .statutoryBreach("SOR FR-04.5-04 / Proclamation No. 983/2016")
                        .correctiveActionMandate("Update Assessment Notice draft with explicit statutory article citations and recalculate 20% negligence penalty schedule.")
                        .status("OPEN")
                        .build());
            }
        }
        syncReportWithCase(entity);
    }

    private void seedInitialEvents(QaReviewCaseEntity entity) {
        if (!qaReviewEventRepository.findByQaReviewCaseIdOrderByOccurredAtAsc(entity.getId()).isEmpty()) {
            return;
        }
        recordEvent(entity.getId(), "FR-04.9.2-01", "CASE_SAMPLED_FOR_QA",
                "NONE", "PENDING_ASSIGNMENT", "SYSTEM", "QA_SAMPLING_ENGINE",
                "Audit case " + entity.getAuditCaseNumber() + " (" + entity.getAuditType() + ") selected via " + entity.getSelectionReason() + ".");
        recordEvent(entity.getId(), "FR-04.9.2-02", "ASSIGNED_TO_QA_TEAM",
                "PENDING_ASSIGNMENT", "IN_REVIEW", DEFAULT_QA_TL_ID, "QA_TEAM_LEADER",
                "Assigned to QA Officer " + entity.getAssignedQaOfficer() + " under supervision of " + entity.getQaTeamLeader() + ".");
        if (!"IN_REVIEW".equals(entity.getStatus())) {
            recordEvent(entity.getId(), entity.getCurrentStep() != null ? entity.getCurrentStep() : "FR-04.9.2-05",
                    "WORKFLOW_TRANSITION", "IN_REVIEW", entity.getStatus(),
                    DEFAULT_QA_OFFICER_ID, "QA_OFFICER",
                    "Completed 7-dimension ISO 19011 scoring (Overall Score: " + entity.getOverallScore() + "% - " + entity.getRating() + ").");
        }
    }

    private void syncReportWithCase(QaReviewCaseEntity entity) {
        List<QaDeficiencyEntity> defs = qaDeficiencyRepository.findByQaCaseId(entity.getId());
        int critCount = (int) defs.stream().filter(d -> "CRITICAL".equalsIgnoreCase(d.getSeverity())).count();
        int majCount = (int) defs.stream().filter(d -> "MAJOR".equalsIgnoreCase(d.getSeverity())).count();

        QaReportEntity report = qaReportRepository.findByQaCaseId(entity.getId())
                .orElse(QaReportEntity.builder().qaCaseId(entity.getId()).build());
        report.setGeneratedDate(LocalDate.now().toString());
        report.setOverallRating(entity.getRating() != null ? entity.getRating() : computeRating(entity.getOverallScore() != null ? entity.getOverallScore() : 75));
        report.setTotalWeightedScore(entity.getOverallScore() != null ? entity.getOverallScore() : 75);
        report.setCriticalDeficienciesCount(critCount);
        report.setMajorDeficienciesCount(majCount);

        if (report.getExecutiveSummary() == null || report.getExecutiveSummary().isBlank()) {
            report.setExecutiveSummary("Independent Quality Assurance inspection of " + entity.getAuditType()
                    + " Audit File " + entity.getAuditCaseNumber() + " (" + entity.getTaxpayerName()
                    + ", TIN: " + entity.getTin() + ") conducted under MOR SOR FR-04.5 & ISO 19011 standards. "
                    + "Weighted quality score achieved: " + report.getTotalWeightedScore() + "% (" + report.getOverallRating() + ").");
        }
        if (report.getKeyStrengths() == null || report.getKeyStrengths().isBlank()) {
            report.setKeyStrengths(String.join("||", List.of(
                    "Audit scope and risk profiling aligned with ITAS automated risk indicators",
                    "CAAT forensic scripts executed across General Ledger, VAT, and EFD/ASYCUDA datasets",
                    "3-Way cross-tax reconciliations (CIT vs VAT vs Withholding/Customs) documented in working papers"
            )));
        }
        if (report.getSystemicVulnerabilities() == null || report.getSystemicVulnerabilities().isBlank()) {
            report.setSystemicVulnerabilities(defs.isEmpty()
                    ? "No material systemic vulnerabilities identified during inspection."
                    : defs.stream().map(QaDeficiencyEntity::getTitle).collect(Collectors.joining("||")));
        }
        if (report.getRecommendationsForDirector() == null || report.getRecommendationsForDirector().isBlank()) {
            report.setRecommendationsForDirector(report.getTotalWeightedScore() >= 75
                    ? "Recommend statutory quality certification under SOR FR-04.9.2-13 and release of final Assessment Notice."
                    : "Mandate audit team remediation of open deficiency items prior to statutory assessment release.");
        }
        if (report.getMandatoryCorrectiveActions() == null || report.getMandatoryCorrectiveActions().isBlank()) {
            report.setMandatoryCorrectiveActions(defs.isEmpty()
                    ? "Maintain standard archival of digital working papers."
                    : defs.stream().map(QaDeficiencyEntity::getCorrectiveActionMandate).filter(Objects::nonNull).collect(Collectors.joining("||")));
        }
        qaReportRepository.save(report);
    }

    private QaCaseReviewResponse ensureEnrichedAndMap(QaReviewCaseEntity entity) {
        boolean dirty = false;

        // Enrich from underlying ApAuditCaseEntity if fields are missing
        if (entity.getAuditCaseId() != null && (entity.getLeadAuditor() == null || entity.getTaxPeriod() == null || entity.getTotalTaxAssessment() == null || entity.getTotalTaxAssessment().compareTo(BigDecimal.ZERO) == 0)) {
            Optional<ApAuditCaseEntity> acOpt = apAuditCaseRepository.findById(entity.getAuditCaseId());
            if (acOpt.isPresent()) {
                ApAuditCaseEntity ac = acOpt.get();
                if (entity.getAuditCaseNumber() == null) { entity.setAuditCaseNumber(ac.getCaseNumber()); dirty = true; }
                if (entity.getAuditType() == null) { entity.setAuditType(ac.getAuditType()); dirty = true; }
                if (entity.getTaxpayerName() == null) { entity.setTaxpayerName(ac.getTaxpayerName()); dirty = true; }
                if (entity.getTin() == null) { entity.setTin(ac.getTin() != null ? ac.getTin() : ac.getTaxpayerId()); dirty = true; }
                if (entity.getTaxPeriod() == null) {
                    entity.setTaxPeriod(ac.getStartDate() != null ? ("FY " + ac.getStartDate().getYear() + " (12M)") : "FY 2024/2025 (12M)");
                    dirty = true;
                }
                if (entity.getTotalTaxAssessment() == null || entity.getTotalTaxAssessment().compareTo(BigDecimal.ZERO) == 0) {
                    entity.setTotalTaxAssessment(ac.getEstimatedRevenue() != null && ac.getEstimatedRevenue() > 0
                            ? BigDecimal.valueOf(ac.getEstimatedRevenue()) : new BigDecimal("3650000.00"));
                    dirty = true;
                }
                if (entity.getLeadAuditor() == null) {
                    entity.setLeadAuditor(resolveUserName(ac.getAssignedAuditorId(), "Mekdes Abebe (Senior Auditor)"));
                    entity.setLeadAuditorId(ac.getAssignedAuditorId());
                    dirty = true;
                }
                if (entity.getAuditTeamLeader() == null) {
                    entity.setAuditTeamLeader(resolveUserName(ac.getAssignedTeamLeaderId(), "Berhanu Bekele (Audit Team Leader)"));
                    entity.setAuditTeamLeaderId(ac.getAssignedTeamLeaderId());
                    dirty = true;
                }
            }
        }

        if (entity.getTradeName() == null) {
            entity.setTradeName((entity.getTaxpayerName() != null ? entity.getTaxpayerName() : "Taxpayer") + " Commercial PLC");
            dirty = true;
        }
        if (entity.getTaxPeriod() == null) {
            entity.setTaxPeriod("FY 2024/2025 (12M)");
            dirty = true;
        }
        if (entity.getLeadAuditor() == null) {
            entity.setLeadAuditor("Mekdes Abebe (Senior Auditor)");
            dirty = true;
        }
        if (entity.getAuditTeamLeader() == null) {
            entity.setAuditTeamLeader("Berhanu Bekele (Audit Team Leader)");
            dirty = true;
        }
        if (entity.getAssignedQaOfficer() == null) {
            entity.setAssignedQaOfficer(DEFAULT_QA_OFFICER_NAME);
            entity.setAssignedQaOfficerId(DEFAULT_QA_OFFICER_ID);
            dirty = true;
        }
        if (entity.getQaTeamLeader() == null) {
            entity.setQaTeamLeader(DEFAULT_QA_TL_NAME);
            entity.setQaTeamLeaderId(DEFAULT_QA_TL_ID);
            dirty = true;
        }
        if (entity.getDueDate() == null) {
            entity.setDueDate(LocalDate.now().plusDays(10));
            dirty = true;
        }
        if (entity.getSelectionReason() == null) {
            entity.setSelectionReason("MANDATORY_HIGH_EXPOSURE");
            dirty = true;
        }
        if (entity.getOverallScore() == null || entity.getOverallScore() == 0) {
            entity.setOverallScore(78);
            entity.setRating(computeRating(78));
            dirty = true;
        }
        if (entity.getRating() == null) {
            entity.setRating(computeRating(entity.getOverallScore()));
            dirty = true;
        }
        if ("UNASSIGNED".equalsIgnoreCase(entity.getStatus())) {
            entity.setStatus(QaReviewCaseEntity.STATUS_IN_REVIEW);
            dirty = true;
        }

        if (dirty) {
            entity = qaReviewCaseRepository.save(entity);
        }
        final QaReviewCaseEntity savedEntity = entity;

        ensureDimensionsExist(savedEntity);

        List<QaDimensionResponse> dimensions = qaReviewDimensionRepository
                .findByQaReviewCaseIdOrderByDisplayOrderAsc(savedEntity.getId())
                .stream()
                .map(this::mapToDimensionResponse)
                .collect(Collectors.toList());

        final String auditTeamResp = savedEntity.getAuditTeamResponseNotes();
        List<QaDeficiencyResponse> deficiencies = qaDeficiencyRepository.findByQaCaseId(savedEntity.getId()).stream()
                .map(d -> mapToDeficiencyResponse(d, auditTeamResp))
                .collect(Collectors.toList());

        QaReportEntity reportEntity = qaReportRepository.findByQaCaseId(savedEntity.getId()).orElseGet(() -> {
            syncReportWithCase(savedEntity);
            return qaReportRepository.findByQaCaseId(savedEntity.getId()).orElse(null);
        });
        QaReportResponse reportResponse = reportEntity != null ? mapToReportResponse(reportEntity, savedEntity) : null;

        List<QaAuditTrailEntryResponse> trail = qaReviewEventRepository
                .findByQaReviewCaseIdOrderByOccurredAtAsc(savedEntity.getId())
                .stream()
                .map(e -> QaAuditTrailEntryResponse.builder()
                        .id(e.getId().toString())
                        .caseId(savedEntity.getCaseNumber())
                        .user(e.getActorName() != null ? e.getActorName() : e.getActorId())
                        .action(e.getEventType())
                        .timestamp(e.getOccurredAt())
                        .oldValue(e.getFromStatus())
                        .newValue(e.getToStatus())
                        .details(e.getNotes())
                        .stepCode(e.getStepCode())
                        .actorRole(e.getActorRole())
                        .build())
                .collect(Collectors.toList());

        return QaCaseReviewResponse.builder()
                .id(entity.getId().toString())
                .caseNumber(entity.getCaseNumber())
                .auditCaseId(entity.getAuditCaseId() != null ? entity.getAuditCaseId().toString() : "")
                .auditCaseNumber(entity.getAuditCaseNumber())
                .auditType(entity.getAuditType())
                .taxpayerName(entity.getTaxpayerName())
                .tradeName(entity.getTradeName())
                .tin(entity.getTin())
                .taxPeriod(entity.getTaxPeriod())
                .totalTaxAssessment(entity.getTotalTaxAssessment() != null ? entity.getTotalTaxAssessment() : BigDecimal.ZERO)
                .leadAuditor(entity.getLeadAuditor())
                .auditTeamLeader(entity.getAuditTeamLeader())
                .selectionReason(entity.getSelectionReason())
                .samplingStrategy(entity.getSamplingStrategy())
                .samplingRuleCode(entity.getSamplingRuleCode())
                .samplingScore(entity.getSamplingScore())
                .selectionDate(entity.getSelectionDate())
                .dueDate(entity.getDueDate())
                .assignedQAOfficer(entity.getAssignedQaOfficer())
                .qaTeamLeader(entity.getQaTeamLeader())
                .status(entity.getStatus())
                .overallScore(entity.getOverallScore())
                .rating(entity.getRating())
                .dimensions(dimensions)
                .deficiencies(deficiencies)
                .report(reportResponse)
                .auditTeamResponseNotes(entity.getAuditTeamResponseNotes())
                .auditTeamResponseDate(entity.getAuditTeamResponseDate())
                .auditTeamRespondedBy(entity.getAuditTeamRespondedBy())
                .qaTeamLeaderComment(entity.getQaTeamLeaderComment())
                .qaTeamLeaderDecisionDate(entity.getQaTeamLeaderDecisionDate())
                .directorExecutiveComment(entity.getDirectorExecutiveComment())
                .directorExecutiveDecisionDate(entity.getDirectorExecutiveDecisionDate())
                .directorStatutoryOrder(entity.getDirectorStatutoryOrder())
                .lastSaved(entity.getLastSavedAt() != null ? entity.getLastSavedAt() : entity.getUpdatedAt())
                .auditTrail(trail)
                .currentStep(entity.getCurrentStep() != null ? entity.getCurrentStep() : stepForStatus(entity.getStatus()))
                .recommendationsAddressed(entity.getRecommendationsAddressed())
                .closureNote(entity.getClosureNote())
                .closedAt(entity.getClosedAt())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    private QaDimensionResponse mapToDimensionResponse(QaReviewDimensionEntity dim) {
        List<QaCheckpointResponse> cps = dim.getCheckpoints() == null ? List.of() :
                dim.getCheckpoints().stream()
                        .map(QaCheckpointResponse::fromMap)
                        .filter(Objects::nonNull)
                        .collect(Collectors.toList());
        return QaDimensionResponse.builder()
                .id(dim.getDimensionCode())
                .category(dim.getCategory())
                .title(dim.getTitle())
                .standardsReference(dim.getStandardsReference())
                .weight(dim.getWeight())
                .score(dim.getScore())
                .status(dim.getStatus())
                .reviewerNotes(dim.getReviewerNotes() != null ? dim.getReviewerNotes() : "")
                .checkpoints(cps)
                .build();
    }

    private QaDeficiencyResponse mapToDeficiencyResponse(QaDeficiencyEntity defEntity, String caseAuditorResponse) {
        return QaDeficiencyResponse.builder()
                .id(defEntity.getId().toString())
                .dimensionId(defEntity.getDimensionId())
                .dimensionTitle(defEntity.getDimensionTitle())
                .severity(defEntity.getSeverity())
                .title(defEntity.getTitle())
                .findingDescription(defEntity.getFindingDescription())
                .statutoryBreach(defEntity.getStatutoryBreach())
                .correctiveActionMandate(defEntity.getCorrectiveActionMandate())
                .status(defEntity.getStatus() != null ? defEntity.getStatus() : "OPEN")
                .auditorResponse(caseAuditorResponse)
                .build();
    }

    private QaReportResponse mapToReportResponse(QaReportEntity report, QaReviewCaseEntity caseEntity) {
        return QaReportResponse.builder()
                .id(report.getId().toString())
                .qaReviewId(report.getQaCaseId().toString())
                .generatedDate(report.getGeneratedDate())
                .executiveSummary(report.getExecutiveSummary())
                .overallRating(report.getOverallRating())
                .totalWeightedScore(report.getTotalWeightedScore())
                .criticalDeficienciesCount(report.getCriticalDeficienciesCount())
                .majorDeficienciesCount(report.getMajorDeficienciesCount())
                .keyStrengths(splitList(report.getKeyStrengths(), "Complete substantive procedures and CAAT execution."))
                .systemicVulnerabilities(splitList(report.getSystemicVulnerabilities(), "No material vulnerabilities flagged."))
                .recommendationsForDirector(report.getRecommendationsForDirector())
                .mandatoryCorrectiveActions(splitList(report.getMandatoryCorrectiveActions(), "Maintain statutory working paper archive."))
                .leadQAOfficerSignature(caseEntity.getAssignedQaOfficer())
                .qaTeamLeaderSignature(caseEntity.getQaTeamLeader())
                .directorApprovalSignature(caseEntity.getDirectorStatutoryOrder() != null ? "Dr. Mesfin Alemayehu (QA Director)" : null)
                .signedDate(report.getGeneratedDate())
                .build();
    }

    private List<String> splitList(String raw, String fallbackItem) {
        if (raw == null || raw.isBlank()) {
            return List.of(fallbackItem);
        }
        String[] parts = raw.contains("||") ? raw.split("\\|\\|") : raw.split("\\r?\\n");
        List<String> out = Arrays.stream(parts)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
        return out.isEmpty() ? List.of(fallbackItem) : out;
    }

    private void recordEvent(UUID qaCaseId, String stepCode, String eventType,
                             String fromStatus, String toStatus, String actorId,
                             String actorRole, String notes) {
        try {
            QaReviewEventEntity evt = QaReviewEventEntity.builder()
                    .qaReviewCaseId(qaCaseId)
                    .stepCode(stepCode)
                    .eventType(eventType)
                    .fromStatus(fromStatus)
                    .toStatus(toStatus)
                    .actorId(actorId)
                    .actorName(resolveUserName(actorId, actorId))
                    .actorRole(actorRole)
                    .notes(notes)
                    .occurredAt(OffsetDateTime.now())
                    .build();
            qaReviewEventRepository.save(evt);
        } catch (Exception e) {
            log.warn("Failed to record QA review event: {}", e.getMessage());
        }
    }

    private String resolveUserName(String userIdOrAlias, String fallback) {
        if (userIdOrAlias == null || userIdOrAlias.isBlank()) return fallback;
        try {
            UUID parsedUuid = UUID.fromString(userIdOrAlias);
            Optional<UserEntity> byId = userJpaRepository.findById(parsedUuid);
            if (byId.isPresent() && byId.get().getFullName() != null) {
                return byId.get().getFullName();
            }
        } catch (Exception ignored) {}
        try {
            Optional<UserEntity> byUsername = userJpaRepository.findByUsername(userIdOrAlias);
            if (byUsername.isPresent() && byUsername.get().getFullName() != null) {
                return byUsername.get().getFullName();
            }
        } catch (Exception ignored) {}
        return fallback;
    }

    public static String computeRating(int score) {
        if (score >= 85) return "EXCELLENT";
        if (score >= 70) return "SATISFACTORY";
        if (score >= 55) return "MARGINAL";
        return "UNSATISFACTORY";
    }

    private static String stepForStatus(String status) {
        if (status == null) return "FR-04.9.2-04";
        return switch (status) {
            case "PENDING_ASSIGNMENT" -> "FR-04.9.2-02";
            case "IN_REVIEW", "RETURNED_TO_OFFICER" -> "FR-04.9.2-04";
            case "PENDING_TL_REVIEW" -> "FR-04.9.2-05";
            case "DEFICIENCY_ISSUED", "AUDIT_RESPONSE_RECEIVED" -> "FR-04.9.2-06";
            case "PENDING_DIRECTOR_SIGNOFF" -> "FR-04.9.2-11";
            case "REJECTED_REAUDIT_MANDATED" -> "FR-04.9.2-12";
            case "PASSED_COMPLIANT", "PASSED_WITH_CONDITIONS" -> "FR-04.9.2-13";
            default -> "FR-04.9.2-04";
        };
    }
}
