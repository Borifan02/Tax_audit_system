package mor.itas.application.service.qa;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import mor.itas.api.dto.request.qa.*;
import mor.itas.api.dto.response.qa.*;
import mor.itas.domain.exception.CaseNotFoundException;
import mor.itas.persistence.jpa.entity.qa.*;
import mor.itas.persistence.repository.qa.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.Collections;
import java.time.LocalDate;

@Slf4j
@Service
@RequiredArgsConstructor
public class QaReviewService {
    private final QaReviewCaseRepository qaReviewCaseRepository;
    private final QaDeficiencyRepository qaDeficiencyRepository;
    private final QaReportRepository qaReportRepository;
    private final QaExitConferenceRepository qaExitConferenceRepository;
    private final QaFollowUpRepository qaFollowUpRepository;

    @Transactional(readOnly = true)
    public List<QaCaseReviewResponse> getQaCases(boolean all) {
        return qaReviewCaseRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public QaCaseReviewResponse getQaCase(UUID id) {
        QaReviewCaseEntity entity = qaReviewCaseRepository.findById(id)
                .orElseThrow(() -> new CaseNotFoundException("QA Case not found: " + id));
        return mapToResponse(entity);
    }

    @Transactional
    public QaCaseReviewResponse executeWorkflow(UUID id, QaWorkflowRequest request, String actorId) {
        QaReviewCaseEntity entity = qaReviewCaseRepository.findById(id)
                .orElseThrow(() -> new CaseNotFoundException("QA Case not found: " + id));

        if ("SUBMIT_FOR_REVIEW".equals(request.getAction())) {
            entity.setStatus(QaReviewCaseEntity.STATUS_PENDING_TL_REVIEW);
        } else if ("ENDORSE".equals(request.getAction())) {
            entity.setStatus(QaReviewCaseEntity.STATUS_PASSED_COMPLIANT);
        } else if ("RETURN".equals(request.getAction())) {
            entity.setStatus(QaReviewCaseEntity.STATUS_RETURNED_TO_OFFICER);
            entity.setQaTeamLeaderComment(request.getComment());
        }

        entity = qaReviewCaseRepository.save(entity);
        return mapToResponse(entity);
    }

    @Transactional
    public QaDeficiencyResponse createDeficiency(UUID caseId, QaDeficiencyRequest request, String actorId) {
        QaReviewCaseEntity caseEntity = qaReviewCaseRepository.findById(caseId)
                .orElseThrow(() -> new CaseNotFoundException("QA Case not found: " + caseId));
        
        QaDeficiencyEntity defEntity = QaDeficiencyEntity.builder()
                .qaCaseId(caseId)
                .dimensionId(request.getDimensionId())
                .dimensionTitle(request.getDimensionTitle())
                .severity(request.getSeverity())
                .title(request.getTitle())
                .findingDescription(request.getFindingDescription())
                .statutoryBreach(request.getStatutoryBreach())
                .correctiveActionMandate(request.getCorrectiveActionMandate())
                .status("OPEN")
                .build();
                
        defEntity = qaDeficiencyRepository.save(defEntity);
        
        // Disciplinary action trigger for critical deficiencies (FR-04.9.2-12)
        if ("CRITICAL".equalsIgnoreCase(request.getSeverity())) {
            log.warn("DISCIPLINARY ALERT: Critical deficiency logged on QA Case {}. Alerting management and HR.", caseId);
        }
        
        return mapToDeficiencyResponse(defEntity);
    }

    @Transactional
    public QaDeficiencyResponse updateDeficiency(UUID caseId, UUID defId, QaDeficiencyRequest request, String actorId) {
        QaDeficiencyEntity defEntity = qaDeficiencyRepository.findById(defId)
                .orElseThrow(() -> new RuntimeException("QA Deficiency not found: " + defId));
                
        if (request.getDimensionId() != null) defEntity.setDimensionId(request.getDimensionId());
        if (request.getDimensionTitle() != null) defEntity.setDimensionTitle(request.getDimensionTitle());
        if (request.getSeverity() != null) defEntity.setSeverity(request.getSeverity());
        if (request.getTitle() != null) defEntity.setTitle(request.getTitle());
        if (request.getFindingDescription() != null) defEntity.setFindingDescription(request.getFindingDescription());
        if (request.getStatutoryBreach() != null) defEntity.setStatutoryBreach(request.getStatutoryBreach());
        if (request.getCorrectiveActionMandate() != null) defEntity.setCorrectiveActionMandate(request.getCorrectiveActionMandate());
        if (request.getStatus() != null) defEntity.setStatus(request.getStatus());

        defEntity = qaDeficiencyRepository.save(defEntity);
        return mapToDeficiencyResponse(defEntity);
    }
    
    @Transactional
    public void deleteDeficiency(UUID caseId, UUID defId, String actorId) {
        qaDeficiencyRepository.deleteById(defId);
    }

    @Transactional
    public QaReportResponse generateReport(UUID caseId, QaReportRequest request, String actorId) {
        QaReportEntity report = qaReportRepository.findByQaCaseId(caseId).orElse(QaReportEntity.builder().qaCaseId(caseId).build());
        
        report.setGeneratedDate(LocalDate.now().toString());
        report.setExecutiveSummary(request.getExecutiveSummary());
        report.setOverallRating(request.getOverallRating());
        report.setTotalWeightedScore(request.getTotalWeightedScore());
        report.setCriticalDeficienciesCount(request.getCriticalDeficienciesCount());
        report.setMajorDeficienciesCount(request.getMajorDeficienciesCount());
        report.setKeyStrengths(request.getKeyStrengths());
        report.setSystemicVulnerabilities(request.getSystemicVulnerabilities());
        report.setRecommendationsForDirector(request.getRecommendationsForDirector());
        report.setMandatoryCorrectiveActions(request.getMandatoryCorrectiveActions());
        
        report = qaReportRepository.save(report);
        
        return QaReportResponse.builder()
                .id(report.getId().toString())
                .qaReviewId(report.getQaCaseId().toString())
                .generatedDate(report.getGeneratedDate())
                .executiveSummary(report.getExecutiveSummary())
                .overallRating(report.getOverallRating())
                .totalWeightedScore(report.getTotalWeightedScore())
                .criticalDeficienciesCount(report.getCriticalDeficienciesCount())
                .majorDeficienciesCount(report.getMajorDeficienciesCount())
                .keyStrengths(report.getKeyStrengths())
                .systemicVulnerabilities(report.getSystemicVulnerabilities())
                .recommendationsForDirector(report.getRecommendationsForDirector())
                .mandatoryCorrectiveActions(report.getMandatoryCorrectiveActions())
                .build();
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
        
        // Auto-close deficiency if follow up is APPROVED (FR-04.9.2-13)
        if ("APPROVED".equals(request.getStatus())) {
            qaDeficiencyRepository.findById(fu.getDeficiencyId()).ifPresent(def -> {
                def.setStatus("CLOSED");
                qaDeficiencyRepository.save(def);
            });
        }
        
        return request;
    }

    private QaCaseReviewResponse mapToResponse(QaReviewCaseEntity entity) {
        List<QaDeficiencyResponse> deficiencies = qaDeficiencyRepository.findByQaCaseId(entity.getId()).stream()
                .map(this::mapToDeficiencyResponse)
                .collect(Collectors.toList());

        return QaCaseReviewResponse.builder()
                .id(entity.getId().toString())
                .caseNumber(entity.getCaseNumber())
                .auditCaseId(entity.getAuditCaseId().toString())
                .auditCaseNumber(entity.getAuditCaseNumber())
                .auditType(entity.getAuditType())
                .status(entity.getStatus())
                .taxpayerName(entity.getTaxpayerName())
                .tin(entity.getTin())
                .assignedQAOfficer(entity.getAssignedQaOfficerId())
                .qaTeamLeader(entity.getQaTeamLeaderId())
                .dimensions(Collections.emptyList())
                .deficiencies(deficiencies)
                .build();
    }
    
    private QaDeficiencyResponse mapToDeficiencyResponse(QaDeficiencyEntity defEntity) {
        return QaDeficiencyResponse.builder()
                .id(defEntity.getId().toString())
                .dimensionId(defEntity.getDimensionId())
                .dimensionTitle(defEntity.getDimensionTitle())
                .severity(defEntity.getSeverity())
                .title(defEntity.getTitle())
                .findingDescription(defEntity.getFindingDescription())
                .statutoryBreach(defEntity.getStatutoryBreach())
                .correctiveActionMandate(defEntity.getCorrectiveActionMandate())
                .status(defEntity.getStatus())
                .build();
    }
}
