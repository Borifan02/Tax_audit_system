package mor.itas.application.service.qa;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import mor.itas.api.dto.request.qa.QaReviewRequests;
import mor.itas.api.dto.response.qa.QaCaseSummaryResponse;
import mor.itas.api.dto.response.qa.QaSamplingRuleResponse;
import mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity;
import mor.itas.persistence.jpa.entity.qa.QaReviewCaseEntity;
import mor.itas.persistence.jpa.repository.ap.ApAuditCaseRepository;
import mor.itas.persistence.repository.qa.QaReviewCaseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.ArrayList;
import java.util.Random;

@Slf4j
@Service
@RequiredArgsConstructor
public class QaSamplingService {

    private final ApAuditCaseRepository auditCaseRepository;
    private final QaReviewCaseRepository qaReviewCaseRepository;

    public List<QaSamplingRuleResponse> getRules() {
        return Collections.emptyList(); // Mock rules
    }

    @Transactional
    public List<QaCaseSummaryResponse> runSampling(QaReviewRequests.SamplingRunRequest req, String actorId) {
        // FR-04.9.2-01: Automated QA Case Selection/Sampling
        // We find all closed audits, and sample a percentage (e.g., 10%)
        List<ApAuditCaseEntity> eligibleCases = auditCaseRepository.findAll().stream()
            .filter(c -> "CLOSED".equalsIgnoreCase(c.getStatus()) || "COMPLETED".equalsIgnoreCase(c.getStatus()))
            .collect(Collectors.toList());
            
        int sampleSize = Math.max(1, (int) (eligibleCases.size() * 0.10)); // 10% sampling
        Collections.shuffle(eligibleCases, new Random());
        List<ApAuditCaseEntity> sampledCases = eligibleCases.stream().limit(sampleSize).collect(Collectors.toList());
        
        List<QaCaseSummaryResponse> result = new ArrayList<>();
        
        for (ApAuditCaseEntity auditCase : sampledCases) {
            // Check if already in QA
            if (!qaReviewCaseRepository.existsByAuditCaseId(auditCase.getId())) {
                QaReviewCaseEntity qaCase = QaReviewCaseEntity.builder()
                    .auditCaseId(auditCase.getId())
                    .auditCaseNumber(auditCase.getCaseNumber())
                    .auditType(auditCase.getAuditType())
                    .taxpayerName(auditCase.getTaxpayerName())
                    .tin(auditCase.getTin())
                    .status("UNASSIGNED")
                    .build();
                qaCase = qaReviewCaseRepository.save(qaCase);
                
                result.add(QaCaseSummaryResponse.builder()
                    .id(qaCase.getId().toString())
                    .auditCaseId(qaCase.getAuditCaseId().toString())
                    .caseNumber(qaCase.getCaseNumber())
                    .status(qaCase.getStatus())
                    .build());
            }
        }
        
        return result;
    }

    @Transactional
    public QaCaseSummaryResponse selectCaseManually(UUID auditCaseId, String reason, String actorId) {
        ApAuditCaseEntity auditCase = auditCaseRepository.findById(auditCaseId)
            .orElseThrow(() -> new RuntimeException("Case not found"));
            
        QaReviewCaseEntity qaCase = QaReviewCaseEntity.builder()
            .auditCaseId(auditCase.getId())
            .auditCaseNumber(auditCase.getCaseNumber())
            .auditType(auditCase.getAuditType())
            .taxpayerName(auditCase.getTaxpayerName())
            .tin(auditCase.getTin())
            .status("UNASSIGNED")
            .build();
        qaCase = qaReviewCaseRepository.save(qaCase);
        
        return QaCaseSummaryResponse.builder()
            .id(qaCase.getId().toString())
            .auditCaseId(qaCase.getAuditCaseId().toString())
            .caseNumber(qaCase.getCaseNumber())
            .status(qaCase.getStatus())
            .build();
    }
}
