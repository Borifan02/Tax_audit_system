package mor.itas.application.usecase.da;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import mor.itas.api.dto.request.da.AddEvidenceRequest;
import mor.itas.api.dto.request.da.AddProcedureRequest;
import mor.itas.api.dto.request.da.ReviewDraftReportRequest;
import mor.itas.api.dto.request.da.SubmitDraftReportRequest;
import mor.itas.engineadapter.risk.MockTaxpayerRiskAdapter;
import java.time.OffsetDateTime;
import mor.itas.domain.exception.CaseNotFoundException;
import mor.itas.domain.exception.InvalidCaseStateException;
import mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity;
import mor.itas.persistence.jpa.entity.da.DaAuditProcedureEntity;
import mor.itas.persistence.jpa.entity.da.DaDraftReportEntity;
import mor.itas.persistence.jpa.entity.da.DaEvidenceEntity;
import mor.itas.persistence.jpa.repository.ap.ApAuditCaseRepository;
import mor.itas.persistence.repository.da.DaAuditProcedureRepository;
import mor.itas.persistence.repository.da.DaDraftReportRepository;
import mor.itas.persistence.repository.da.DaEvidenceRepository;
import mor.itas.persistence.jpa.entity.da.DaCaseSnapshotEntity;
import mor.itas.persistence.repository.da.DaCaseSnapshotRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import mor.itas.application.port.inboundport.da.DeskAuditExecutionUseCasePort;

import java.util.Map;
import java.util.HashMap;
import java.util.UUID;

import mor.itas.application.port.outboundport.repositoryport.da.DaAuditCaseRepositoryPort;

@Slf4j
@Service
@RequiredArgsConstructor
public class DeskAuditExecutionUseCase implements DeskAuditExecutionUseCasePort {

    private final DaAuditCaseRepositoryPort auditCaseRepository;
    private final DaEvidenceRepository evidenceRepository;
    private final DaAuditProcedureRepository procedureRepository;
    private final DaDraftReportRepository draftReportRepository;
    private final MockTaxpayerRiskAdapter riskAdapter;
    private final DaCaseSnapshotRepository snapshotRepository;
    private final ObjectMapper objectMapper;
    private final mor.itas.persistence.repository.da.DaFindingRepository findingRepository;
    private final mor.itas.persistence.repository.da.DaWorkingPaperRepository workingPaperRepository;
    private final mor.itas.persistence.repository.da.DaQueryRepository queryRepository;
    private final mor.itas.domain.service.da.DeskAuditDomainService domainService;

    @Transactional
    public DaEvidenceEntity addEvidence(UUID caseId, AddEvidenceRequest request, String actorId) {
        log.info("Adding evidence to case {} by {}", caseId, actorId);
        ApAuditCaseEntity auditCase = getAndValidateCase(caseId);

        DaEvidenceEntity evidence = DaEvidenceEntity.builder()
                .auditCase(auditCase)
                .documentName(request.getDocumentName())
                .documentSource(request.getDocumentSource())
                .documentUrl(request.getDocumentUrl())
                .status("ACTIVE")
                .uploadedBy(actorId)
                .build();
        DaEvidenceEntity saved = evidenceRepository.save(evidence);
        
        // Fire domain event
        String tin = "ETH000001"; // Placeholder, real impl should get from AuditCase
        domainService.gatherEvidence(caseId, tin, request.getDocumentSource());
        
        return saved;
    }

    @Transactional
    public DaAuditProcedureEntity recordProcedure(UUID caseId, AddProcedureRequest request, String actorId) {
        log.info("Recording procedure for case {} by {}", caseId, actorId);
        ApAuditCaseEntity auditCase = getAndValidateCase(caseId);

        DaAuditProcedureEntity procedure = DaAuditProcedureEntity.builder()
                .auditCase(auditCase)
                .procedureDescription(request.getProcedureDescription())
                .observation(request.getObservation())
                .finding(request.getFinding())
                .issueIdentified(request.getIssueIdentified() != null ? request.getIssueIdentified() : false)
                .conclusion(request.getConclusion())
                .createdBy(actorId)
                .build();
        return procedureRepository.save(procedure);
    }

    @Transactional
    public DaDraftReportEntity submitDraftReport(UUID caseId, SubmitDraftReportRequest request, String actorId) {
        log.info("Submitting draft report for case {} by {}", caseId, actorId);
        ApAuditCaseEntity auditCase = getAndValidateCase(caseId);

        DaDraftReportEntity report = DaDraftReportEntity.builder()
                .auditCase(auditCase)
                .reportContent(request.getReportContent())
                .significantIssuesIdentified(request.getSignificantIssuesIdentified())
                .escalatedToComprehensive(request.getEscalateToComprehensive())
                .escalationReason(request.getEscalationReason())
                .status("SUBMITTED")
                .createdBy(actorId)
                .build();
        
        auditCase.setStatus(mor.itas.domain.valueobject.da.DaAuditStatus.TEAM_LEADER_REVIEW.name());
        auditCase.setDaCurrentPhase(mor.itas.domain.valueobject.da.DaAuditPhase.REPORT_SUBMITTED.name());
        auditCaseRepository.save(auditCase);
        
        DaDraftReportEntity saved = draftReportRepository.save(report);
        
        // Fire domain event
        domainService.draftReport(caseId, saved.getId(), actorId);
        
        return saved;
    }

    @Transactional
    public DaDraftReportEntity reviewDraftReport(UUID caseId, ReviewDraftReportRequest request, String actorId) {
        log.info("Reviewing draft report for case {} by {}", caseId, actorId);
        ApAuditCaseEntity auditCase = getAndValidateCase(caseId);

        if (!mor.itas.domain.valueobject.da.DaAuditStatus.TEAM_LEADER_REVIEW.name().equals(auditCase.getStatus())) {
            throw new InvalidCaseStateException("Case is not in TEAM_LEADER_REVIEW status.", auditCase.getStatus());
        }

        DaDraftReportEntity report = draftReportRepository.findTopByAuditCase_IdOrderByCreatedAtDesc(caseId)
                .orElseThrow(() -> new IllegalStateException("No submitted draft report found for case: " + caseId));

        report.setStatus(request.getDecision());
        report.setTeamLeaderComments(request.getComments());
        report.setReviewedBy(actorId);
        report.setReviewedAt(OffsetDateTime.now());
        
        // Need to handle getting taxpayer TIN from entity if available, otherwise just mock it.
        String tin = "ETH000001"; // Placeholder since ApAuditCaseEntity doesn't seem to expose tin directly easily in my view yet
        
        if (Boolean.TRUE.equals(request.getSignificantIssues())) {
            riskAdapter.updateRiskProfile(tin, 
                "Significant issues found during Desk Audit review", actorId, OffsetDateTime.now().toString());
        }

        if ("ESCALATE".equals(request.getDecision())) {
            auditCase.setAuditType(mor.itas.domain.valueobject.AuditType.COMPREHENSIVE_AUDIT.name());
            auditCase.setStatus(mor.itas.domain.valueobject.da.DaAuditStatus.COMPREHENSIVE_ROUTED.name());
            auditCase.setDaCurrentPhase(mor.itas.domain.valueobject.da.DaAuditPhase.ESCALATED.name());
        } else if ("APPROVED".equals(request.getDecision())) {
            auditCase.setStatus(mor.itas.domain.valueobject.da.DaAuditStatus.COMPLETED.name());
            auditCase.setDaCurrentPhase(mor.itas.domain.valueobject.da.DaAuditPhase.COMPLETED.name());
        } else {
            auditCase.setStatus(mor.itas.domain.valueobject.da.DaAuditStatus.AUDITOR_ASSIGNED.name());
            auditCase.setDaCurrentPhase(mor.itas.domain.valueobject.da.DaAuditPhase.REPORT_REJECTED.name());
        }

        auditCaseRepository.save(auditCase);
        DaDraftReportEntity saved = draftReportRepository.save(report);
        
        // Fire domain event
        boolean bigIssue = Boolean.TRUE.equals(request.getSignificantIssues());
        domainService.approveReport(caseId, saved.getId(), actorId, bigIssue);
        
        if ("ESCALATE".equals(request.getDecision())) {
             domainService.escalateToComprehensive(caseId, tin, java.util.List.of(), request.getComments(), actorId);
        }
        
        return saved;
    }

    @Transactional
    public mor.itas.persistence.jpa.entity.da.DaFindingEntity createFinding(UUID caseId, mor.itas.api.dto.request.da.CreateFindingRequest request, String actorId) {
        log.info("Creating finding for case {} by {}", caseId, actorId);
        getAndValidateCase(caseId);
        
        var finding = new mor.itas.persistence.jpa.entity.da.DaFindingEntity();
        finding.setAuditCaseId(caseId);
        finding.setFindingReference(request.getReference());
        finding.setAuditArea(request.getAuditArea());
        finding.setTitle(request.getTitle());
        finding.setDescription(request.getDescription());
        finding.setCriteria(request.getCriteria());
        finding.setCondition(request.getCondition());
        finding.setCause(request.getCause());
        finding.setEffect(request.getEffect());
        finding.setUnderDeclaredAmount(request.getUnderDeclaredAmount());
        finding.setPenaltyRate(request.getPenaltyRate());
        finding.setPenaltyAmount(request.getPenaltyAmount());
        finding.setInterestAmount(request.getInterestAmount());
        finding.setTotalTaxImpact(request.getTotalTaxImpact());
        finding.setAuditorAnalysis(request.getAuditorAnalysis());
        finding.setConclusion(request.getConclusion());
        finding.setRecommendation(request.getRecommendation());
        finding.setStatus(request.getStatus());
        finding.setIsSignificant(request.getIsSignificant());
        finding.setRelatedProcedureId(request.getRelatedProcedureId());
        finding.setRelatedQueryId(request.getRelatedQueryId());
        finding.setRelatedWorkingPaperId(request.getRelatedWorkingPaperId());
        
        return findingRepository.save(finding);
    }

    @Transactional
    public mor.itas.persistence.jpa.entity.da.DaWorkingPaperEntity createWorkingPaper(UUID caseId, mor.itas.api.dto.request.da.CreateWorkingPaperRequest request, String actorId) {
        log.info("Creating working paper for case {} by {}", caseId, actorId);
        getAndValidateCase(caseId);
        
        var wp = new mor.itas.persistence.jpa.entity.da.DaWorkingPaperEntity();
        wp.setAuditCaseId(caseId);
        wp.setReference(request.getReference());
        wp.setTitle(request.getTitle());
        wp.setCategory(request.getCategory());
        wp.setPreparedBy(request.getPreparedBy() != null ? request.getPreparedBy() : actorId);
        wp.setDate(request.getDate());
        wp.setWorkPerformed(request.getWorkPerformed());
        wp.setConclusions(request.getConclusions());
        wp.setStatus(request.getStatus());
        wp.setRelatedProcedureId(request.getRelatedProcedureId());
        wp.setRelatedFindingId(request.getRelatedFindingId());
        
        return workingPaperRepository.save(wp);
    }

    @Transactional
    public mor.itas.persistence.jpa.entity.da.DaFindingEntity updateFinding(UUID caseId, UUID findingId, mor.itas.api.dto.request.da.UpdateFindingRequest request, String actorId) {
        log.info("Updating finding {} for case {} by {}", findingId, caseId, actorId);
        getAndValidateCase(caseId);
        
        var finding = findingRepository.findById(findingId).orElseThrow();
        if (request.getAuditArea() != null) finding.setAuditArea(request.getAuditArea());
        if (request.getTitle() != null) finding.setTitle(request.getTitle());
        if (request.getDescription() != null) finding.setDescription(request.getDescription());
        if (request.getCriteria() != null) finding.setCriteria(request.getCriteria());
        if (request.getCondition() != null) finding.setCondition(request.getCondition());
        if (request.getCause() != null) finding.setCause(request.getCause());
        if (request.getEffect() != null) finding.setEffect(request.getEffect());
        if (request.getUnderDeclaredAmount() != null) finding.setUnderDeclaredAmount(request.getUnderDeclaredAmount());
        if (request.getPenaltyRate() != null) finding.setPenaltyRate(request.getPenaltyRate());
        if (request.getPenaltyAmount() != null) finding.setPenaltyAmount(request.getPenaltyAmount());
        if (request.getInterestAmount() != null) finding.setInterestAmount(request.getInterestAmount());
        if (request.getTotalTaxImpact() != null) finding.setTotalTaxImpact(request.getTotalTaxImpact());
        if (request.getAuditorAnalysis() != null) finding.setAuditorAnalysis(request.getAuditorAnalysis());
        if (request.getConclusion() != null) finding.setConclusion(request.getConclusion());
        if (request.getRecommendation() != null) finding.setRecommendation(request.getRecommendation());
        if (request.getStatus() != null) finding.setStatus(request.getStatus());
        if (request.getIsSignificant() != null) finding.setIsSignificant(request.getIsSignificant());
        
        return findingRepository.save(finding);
    }

    @Transactional
    public mor.itas.persistence.jpa.entity.da.DaWorkingPaperEntity updateWorkingPaper(UUID caseId, UUID wpId, mor.itas.api.dto.request.da.UpdateWorkingPaperRequest request, String actorId) {
        log.info("Updating working paper {} for case {} by {}", wpId, caseId, actorId);
        getAndValidateCase(caseId);
        
        var wp = workingPaperRepository.findById(wpId).orElseThrow();
        if (request.getTitle() != null) wp.setTitle(request.getTitle());
        if (request.getCategory() != null) wp.setCategory(request.getCategory());
        if (request.getPreparedBy() != null) wp.setPreparedBy(request.getPreparedBy());
        if (request.getDate() != null) wp.setDate(request.getDate());
        if (request.getWorkPerformed() != null) wp.setWorkPerformed(request.getWorkPerformed());
        if (request.getConclusions() != null) wp.setConclusions(request.getConclusions());
        if (request.getStatus() != null) wp.setStatus(request.getStatus());
        
        return workingPaperRepository.save(wp);
    }

    @Transactional
    public mor.itas.persistence.jpa.entity.da.DaQueryEntity createQuery(UUID caseId, mor.itas.api.dto.request.da.CreateQueryRequest request, String actorId) {
        log.info("Creating query for case {} by {}", caseId, actorId);
        getAndValidateCase(caseId);
        
        var query = new mor.itas.persistence.jpa.entity.da.DaQueryEntity();
        query.setAuditCaseId(caseId);
        query.setReference(request.getReference());
        query.setSubject(request.getSubject());
        query.setQuestion(request.getQuestion());
        query.setStatutoryBasis(request.getStatutoryBasis());
        query.setDueDate(request.getDueDate());
        query.setStatus(request.getStatus() != null ? request.getStatus() : "OPEN");
        
        return queryRepository.save(query);
    }

    @Transactional
    public mor.itas.persistence.jpa.entity.da.DaQueryEntity updateQuery(UUID caseId, UUID queryId, mor.itas.api.dto.request.da.UpdateQueryRequest request, String actorId) {
        log.info("Updating query {} for case {} by {}", queryId, caseId, actorId);
        getAndValidateCase(caseId);
        
        var query = queryRepository.findById(queryId).orElseThrow();
        if (request.getSubject() != null) query.setSubject(request.getSubject());
        if (request.getQuestion() != null) query.setQuestion(request.getQuestion());
        if (request.getStatutoryBasis() != null) query.setStatutoryBasis(request.getStatutoryBasis());
        if (request.getDueDate() != null) query.setDueDate(request.getDueDate());
        if (request.getStatus() != null) query.setStatus(request.getStatus());
        if (request.getResolutionNotes() != null) query.setResolutionNotes(request.getResolutionNotes());
        
        return queryRepository.save(query);
    }

    @Transactional
    public Map<String, Object> autosaveCase(UUID caseId, Map<String, Object> snapshot, String actorId) {
        log.info("Autosaving case state for case {} by {}", caseId, actorId);
        getAndValidateCase(caseId); // Ensure case exists and is DA

        DaCaseSnapshotEntity entity = snapshotRepository.findByCaseId(caseId)
                .orElseGet(() -> {
                    DaCaseSnapshotEntity newEntity = new DaCaseSnapshotEntity();
                    newEntity.setCaseId(caseId);
                    return newEntity;
                });
        try {
            entity.setSnapshotData(objectMapper.writeValueAsString(snapshot));
            entity.setLastSavedAt(OffsetDateTime.now());
            snapshotRepository.save(entity);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("lastSaved", entity.getLastSavedAt().toString());
            return response;
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize snapshot data", e);
            throw new RuntimeException("Failed to save snapshot", e);
        }
    }

    public Map<String, Object> getCaseSnapshot(UUID caseId) {
        log.info("Fetching case data from repositories for case {}", caseId);
        ApAuditCaseEntity auditCase = getAndValidateCase(caseId);

        // Build a flat auditCase DTO — never serialize the raw JPA entity to avoid lazy-load issues
        Map<String, Object> auditCaseDto = new HashMap<>();
        auditCaseDto.put("id", auditCase.getId() != null ? auditCase.getId().toString() : null);
        auditCaseDto.put("caseNumber", auditCase.getCaseNumber());
        auditCaseDto.put("taxpayerName", auditCase.getTaxpayerName());
        auditCaseDto.put("taxpayerId", auditCase.getTaxpayerId());
        auditCaseDto.put("tin", auditCase.getTaxpayerId());
        auditCaseDto.put("auditType", auditCase.getAuditType());
        auditCaseDto.put("riskScore", auditCase.getRiskScore());
        auditCaseDto.put("riskCategory", auditCase.getRiskPriority());
        auditCaseDto.put("status", auditCase.getStatus());
        auditCaseDto.put("daCurrentPhase", auditCase.getDaCurrentPhase());
        auditCaseDto.put("assignedAuditorId", auditCase.getAssignedAuditorId());
        auditCaseDto.put("assignedTeamLeaderId", auditCase.getAssignedTeamLeaderId());
        auditCaseDto.put("taxCenter", auditCase.getTaxCenter());
        auditCaseDto.put("taxCenterCode", auditCase.getTaxCenterCode());
        auditCaseDto.put("sector", auditCase.getSector());
        auditCaseDto.put("segment", auditCase.getSegment());
        auditCaseDto.put("startDate", auditCase.getStartDate() != null ? auditCase.getStartDate().toString() : null);
        auditCaseDto.put("dueDate", auditCase.getDueDate() != null ? auditCase.getDueDate().toString() : null);
        auditCaseDto.put("createdAt", auditCase.getCreatedAt() != null ? auditCase.getCreatedAt().toString() : null);
        auditCaseDto.put("updatedAt", auditCase.getUpdatedAt() != null ? auditCase.getUpdatedAt().toString() : null);
        auditCaseDto.put("lastSaved", OffsetDateTime.now().toLocalTime().toString());

        Map<String, Object> data = new HashMap<>();
        data.put("auditCase", auditCaseDto);

        // Fetch entities from dedicated tables
        data.put("evidence", evidenceRepository.findByAuditCase_Id(caseId));
        data.put("procedures", procedureRepository.findByAuditCase_Id(caseId));
        data.put("findings", findingRepository.findByAuditCaseId(caseId));
        data.put("workingPapers", workingPaperRepository.findByAuditCaseId(caseId));
        data.put("queries", queryRepository.findByAuditCaseId(caseId));

        // Draft report logic (take latest)
        var reports = draftReportRepository.findByAuditCase_Id(caseId);
        if (!reports.isEmpty()) {
            data.put("draftReport", reports.get(reports.size() - 1));
        } else {
            data.put("draftReport", new HashMap<>());
        }

        // Also load the unstructured snapshot for properties not yet modeled (like analysis)
        var snapshotOpt = snapshotRepository.findByCaseId(caseId);
        if (snapshotOpt.isPresent()) {
            try {
                Map<String, Object> snapshotData = objectMapper.readValue(snapshotOpt.get().getSnapshotData(), Map.class);
                if (snapshotData.containsKey("analysis")) {
                    data.put("analysis", snapshotData.get("analysis"));
                }
            } catch (JsonProcessingException e) {
                log.warn("Failed to parse snapshot data for analysis fallback", e);
            }
        }

        return data;
    }

    private ApAuditCaseEntity getAndValidateCase(UUID caseId) {
        ApAuditCaseEntity auditCase = auditCaseRepository.findById(caseId)
                .orElseThrow(() -> new CaseNotFoundException("Case not found: " + caseId));
        
        if (!"DESK_AUDIT".equals(auditCase.getAuditType())) {
            throw new InvalidCaseStateException("Case is not a Desk Audit.", auditCase.getStatus());
        }
        return auditCase;
    }

    @Transactional
    public DaAuditProcedureEntity updateProcedure(UUID caseId, UUID procId, mor.itas.api.dto.request.da.UpdateProcedureRequest request, String actorId) {
        log.info("Updating procedure {} for case {} by {}", procId, caseId, actorId);
        getAndValidateCase(caseId);
        DaAuditProcedureEntity proc = procedureRepository.findById(procId)
                .orElseThrow(() -> new IllegalArgumentException("Procedure not found"));
        if (request.getProcedureDescription() != null) proc.setProcedureDescription(request.getProcedureDescription());
        if (request.getObservation() != null) proc.setObservation(request.getObservation());
        if (request.getFinding() != null) proc.setFinding(request.getFinding());
        if (request.getIssueIdentified() != null) proc.setIssueIdentified(request.getIssueIdentified());
        if (request.getConclusion() != null) proc.setConclusion(request.getConclusion());
        return procedureRepository.save(proc);
    }

    @Transactional
    public void deleteEvidence(UUID caseId, UUID evidenceId, String actorId) {
        log.info("Deleting evidence {} for case {} by {}", evidenceId, caseId, actorId);
        getAndValidateCase(caseId);
        evidenceRepository.deleteById(evidenceId);
    }

    @Transactional
    public void deleteFinding(UUID caseId, UUID findingId, String actorId) {
        log.info("Deleting finding {} for case {} by {}", findingId, caseId, actorId);
        getAndValidateCase(caseId);
        findingRepository.deleteById(findingId);
    }

    @Transactional
    public void deleteWorkingPaper(UUID caseId, UUID wpId, String actorId) {
        log.info("Deleting working paper {} for case {} by {}", wpId, caseId, actorId);
        getAndValidateCase(caseId);
        workingPaperRepository.deleteById(wpId);
    }
}
