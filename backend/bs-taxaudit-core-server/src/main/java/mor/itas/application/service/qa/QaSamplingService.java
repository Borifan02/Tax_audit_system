package mor.itas.application.service.qa;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import mor.itas.api.dto.request.qa.QaReviewRequests;
import mor.itas.api.dto.response.qa.QaCaseSummaryResponse;
import mor.itas.api.dto.response.qa.QaSamplingRuleResponse;
import mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity;
import mor.itas.persistence.jpa.entity.qa.QaReviewCaseEntity;
import mor.itas.persistence.jpa.entity.qa.QaReviewDimensionEntity;
import mor.itas.persistence.jpa.repository.ap.ApAuditCaseRepository;
import mor.itas.persistence.repository.qa.QaReviewCaseRepository;
import mor.itas.persistence.repository.qa.QaReviewDimensionRepository;
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
public class QaSamplingService {

    private final ApAuditCaseRepository auditCaseRepository;
    private final QaReviewCaseRepository qaReviewCaseRepository;
    private final QaReviewDimensionRepository qaReviewDimensionRepository;

    public List<QaSamplingRuleResponse> getRules() {
        return List.of(
                QaSamplingRuleResponse.builder()
                        .code("SOR-FR-04.9.2-R01")
                        .name("Mandatory High-Exposure LTO Threshold (> ETB 5,000,000)")
                        .strategy("MANDATORY_HIGH_EXPOSURE")
                        .samplePercentage(new BigDecimal("100"))
                        .active(true)
                        .build(),
                QaSamplingRuleResponse.builder()
                        .code("SOR-FR-04.9.2-R02")
                        .name("Risk-Weighted Multi-Tax & Cross-Border Audit Selection")
                        .strategy("RISK_BASED_SELECTION")
                        .samplePercentage(new BigDecimal("25"))
                        .active(true)
                        .build(),
                QaSamplingRuleResponse.builder()
                        .code("SOR-FR-04.9.2-R03")
                        .name("Statutory Random Quality Surveillance Sample (10%)")
                        .strategy("RANDOM_STATUTORY_SAMPLE")
                        .samplePercentage(new BigDecimal("10"))
                        .active(true)
                        .build()
        );
    }

    @Transactional
    public List<QaCaseSummaryResponse> runSampling(QaReviewRequests.SamplingRunRequest req, String actorId) {
        List<ApAuditCaseEntity> allCases = auditCaseRepository.findAll();
        List<ApAuditCaseEntity> unsampledClosed = allCases.stream()
                .filter(c -> ("CLOSED".equalsIgnoreCase(c.getStatus())
                        || "COMPLETED".equalsIgnoreCase(c.getStatus())
                        || "ASSESSMENT_ISSUED".equalsIgnoreCase(c.getStatus())
                        || "UNDER_REVIEW".equalsIgnoreCase(c.getStatus()))
                        && !qaReviewCaseRepository.existsByAuditCaseId(c.getId()))
                .collect(Collectors.toList());

        List<ApAuditCaseEntity> pool = !unsampledClosed.isEmpty()
                ? unsampledClosed
                : allCases.stream()
                        .filter(c -> !qaReviewCaseRepository.existsByAuditCaseId(c.getId()))
                        .collect(Collectors.toList());

        int sampleSize = Math.min(3, Math.max(1, (int) Math.ceil(pool.size() * 0.10)));
        Collections.shuffle(pool, new Random());
        List<ApAuditCaseEntity> sampledCases = pool.stream().limit(sampleSize).collect(Collectors.toList());

        long baseIndex = qaReviewCaseRepository.count() + 1;
        List<QaCaseSummaryResponse> result = new ArrayList<>();

        for (ApAuditCaseEntity auditCase : sampledCases) {
            if (!qaReviewCaseRepository.existsByAuditCaseId(auditCase.getId())) {
                String caseNum = String.format("QA-REV-2026-%03d", baseIndex++);
                BigDecimal assessment = auditCase.getEstimatedRevenue() != null && auditCase.getEstimatedRevenue() > 0
                        ? BigDecimal.valueOf(auditCase.getEstimatedRevenue())
                        : new BigDecimal("3250000.00");

                QaReviewCaseEntity qaCase = QaReviewCaseEntity.builder()
                        .caseNumber(caseNum)
                        .auditCaseId(auditCase.getId())
                        .auditCaseNumber(auditCase.getCaseNumber())
                        .auditType(auditCase.getAuditType() != null ? auditCase.getAuditType() : "Comprehensive")
                        .taxpayerName(auditCase.getTaxpayerName())
                        .tradeName(auditCase.getTaxpayerName() != null ? auditCase.getTaxpayerName() + " PLC" : "Registered Taxpayer")
                        .tin(auditCase.getTin() != null ? auditCase.getTin() : auditCase.getTaxpayerId())
                        .taxPeriod(auditCase.getStartDate() != null ? ("FY " + auditCase.getStartDate().getYear() + " (12M)") : "FY 2024/2025")
                        .totalTaxAssessment(assessment)
                        .leadAuditor("Mekdes Abebe (Senior Auditor)")
                        .leadAuditorId(auditCase.getAssignedAuditorId())
                        .auditTeamLeader("Berhanu Bekele (Audit Team Leader)")
                        .auditTeamLeaderId(auditCase.getAssignedTeamLeaderId())
                        .selectionReason("RANDOM_STATUTORY_SAMPLE")
                        .samplingStrategy("RANDOM_STATUTORY_SAMPLE")
                        .samplingRuleCode("SOR-FR-04.9.2-R03")
                        .samplingScore(auditCase.getRiskScore() != null ? auditCase.getRiskScore() : 80)
                        .selectionDate(LocalDate.now())
                        .selectedBy(actorId)
                        .dueDate(LocalDate.now().plusDays(14))
                        .assignedQaOfficer("Rahel Tesfaye (QA-OFF-01)")
                        .assignedQaOfficerId("u-qa-officer-1")
                        .assignedAt(OffsetDateTime.now())
                        .assignedBy(actorId)
                        .qaTeamLeader("Tewodros Mekonnen (QA-TL-01)")
                        .qaTeamLeaderId("u-qa-tl-1")
                        .qaDirectorId("u-qa-director-1")
                        .status(QaReviewCaseEntity.STATUS_IN_REVIEW)
                        .currentStep("FR-04.9.2-04")
                        .overallScore(75)
                        .rating("SATISFACTORY")
                        .lastSavedAt(OffsetDateTime.now())
                        .build();

                qaCase = qaReviewCaseRepository.save(qaCase);
                List<QaReviewDimensionEntity> dims = QaDimensionCatalogue.buildFor(qaCase.getId());
                qaReviewDimensionRepository.saveAll(dims);

                result.add(QaCaseSummaryResponse.builder()
                        .id(qaCase.getId().toString())
                        .auditCaseId(qaCase.getAuditCaseId().toString())
                        .caseNumber(qaCase.getCaseNumber())
                        .auditCaseNumber(qaCase.getAuditCaseNumber())
                        .taxpayerName(qaCase.getTaxpayerName())
                        .tin(qaCase.getTin())
                        .status(qaCase.getStatus())
                        .overallScore(qaCase.getOverallScore())
                        .rating(qaCase.getRating())
                        .build());
            }
        }

        return result;
    }

    @Transactional
    public QaCaseSummaryResponse selectCaseManually(UUID auditCaseId, String reason, String actorId) {
        ApAuditCaseEntity auditCase = auditCaseRepository.findById(auditCaseId)
                .orElseThrow(() -> new RuntimeException("Case not found"));

        long nextIdx = qaReviewCaseRepository.count() + 1;
        String caseNum = String.format("QA-REV-2026-%03d", nextIdx);

        QaReviewCaseEntity qaCase = QaReviewCaseEntity.builder()
                .caseNumber(caseNum)
                .auditCaseId(auditCase.getId())
                .auditCaseNumber(auditCase.getCaseNumber())
                .auditType(auditCase.getAuditType() != null ? auditCase.getAuditType() : "Comprehensive")
                .taxpayerName(auditCase.getTaxpayerName())
                .tradeName(auditCase.getTaxpayerName() != null ? auditCase.getTaxpayerName() + " PLC" : "Registered Taxpayer")
                .tin(auditCase.getTin() != null ? auditCase.getTin() : auditCase.getTaxpayerId())
                .taxPeriod(auditCase.getStartDate() != null ? ("FY " + auditCase.getStartDate().getYear() + " (12M)") : "FY 2024/2025")
                .totalTaxAssessment(auditCase.getEstimatedRevenue() != null && auditCase.getEstimatedRevenue() > 0
                        ? BigDecimal.valueOf(auditCase.getEstimatedRevenue()) : new BigDecimal("3500000.00"))
                .selectionReason(reason != null ? reason : "DIRECTOR_REFERRAL")
                .samplingStrategy(reason != null ? reason : "DIRECTOR_REFERRAL")
                .selectionDate(LocalDate.now())
                .selectedBy(actorId)
                .dueDate(LocalDate.now().plusDays(14))
                .assignedQaOfficer("Rahel Tesfaye (QA-OFF-01)")
                .assignedQaOfficerId("u-qa-officer-1")
                .qaTeamLeader("Tewodros Mekonnen (QA-TL-01)")
                .qaTeamLeaderId("u-qa-tl-1")
                .qaDirectorId("u-qa-director-1")
                .status(QaReviewCaseEntity.STATUS_IN_REVIEW)
                .currentStep("FR-04.9.2-04")
                .overallScore(75)
                .rating("SATISFACTORY")
                .lastSavedAt(OffsetDateTime.now())
                .build();
        qaCase = qaReviewCaseRepository.save(qaCase);
        qaReviewDimensionRepository.saveAll(QaDimensionCatalogue.buildFor(qaCase.getId()));

        return QaCaseSummaryResponse.builder()
                .id(qaCase.getId().toString())
                .auditCaseId(qaCase.getAuditCaseId().toString())
                .caseNumber(qaCase.getCaseNumber())
                .auditCaseNumber(qaCase.getAuditCaseNumber())
                .taxpayerName(qaCase.getTaxpayerName())
                .tin(qaCase.getTin())
                .status(qaCase.getStatus())
                .overallScore(qaCase.getOverallScore())
                .rating(qaCase.getRating())
                .build();
    }
}
