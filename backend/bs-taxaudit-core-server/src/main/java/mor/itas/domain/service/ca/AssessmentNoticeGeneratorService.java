package mor.itas.domain.service.ca;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import mor.itas.api.dto.request.ca.GenerateAssessmentNoticeRequest;
import mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity;
import mor.itas.persistence.jpa.entity.ca.CaAssessmentNoticeEntity;
import mor.itas.persistence.jpa.entity.ca.CaMultiZoneAllocationEntity;
import mor.itas.persistence.repository.ca.CaAssessmentNoticeRepository;
import mor.itas.persistence.repository.ca.CaAuditFindingRepository;
import mor.itas.persistence.repository.ca.CaMultiZoneAllocationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Assessment Notice Generator — FR-04.4-29, 30, 31, 32
 *
 * Calculation logic:
 *   1. Pull all CONFIRMED findings for the case, grouped by tax type.
 *   2. Sum under-declared amounts per tax type → principal.
 *   3. Apply statutory 20% penalty on principal total.
 *   4. Compute interest = principal_total × annual_rate × (days / 365).
 *   5. Grand total = principal + penalty + interest.
 *   6. If zone allocations supplied, persist per-zone breakdown.
 *   7. Generate unique notice number: CA-{YEAR}-{TC}-{SEQUENCE}.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AssessmentNoticeGeneratorService {

    private static final BigDecimal PENALTY_RATE     = new BigDecimal("0.20");
    private static final BigDecimal DEFAULT_INT_RATE = new BigDecimal("0.28"); // NBE base rate p.a.
    private static final BigDecimal DAYS_IN_YEAR     = new BigDecimal("365");

    private final CaAssessmentNoticeRepository noticeRepository;
    private final CaAuditFindingRepository     findingRepository;
    private final CaMultiZoneAllocationRepository zoneRepository;

    @Transactional
    public CaAssessmentNoticeEntity generate(ApAuditCaseEntity auditCase,
                                              GenerateAssessmentNoticeRequest request,
                                              String actorId) {

        UUID caseId = auditCase.getId();

        // ── 1. Aggregate confirmed findings by tax type ──────────────────────
        BigDecimal principalCit  = findingRepository.sumTaxImpactByTaxType(caseId, "CIT");
        BigDecimal principalVat  = findingRepository.sumTaxImpactByTaxType(caseId, "VAT");
        BigDecimal principalPaye = findingRepository.sumTaxImpactByTaxType(caseId, "PAYE");
        BigDecimal principalWht  = findingRepository.sumTaxImpactByTaxType(caseId, "WHT");

        // Ensure non-null
        principalCit  = principalCit  == null ? BigDecimal.ZERO : principalCit;
        principalVat  = principalVat  == null ? BigDecimal.ZERO : principalVat;
        principalPaye = principalPaye == null ? BigDecimal.ZERO : principalPaye;
        principalWht  = principalWht  == null ? BigDecimal.ZERO : principalWht;

        BigDecimal principalTotal = principalCit
            .add(principalVat)
            .add(principalPaye)
            .add(principalWht);

        // ── 2. Penalty (20% statutory) ───────────────────────────────────────
        BigDecimal penaltyAmount = principalTotal
            .multiply(PENALTY_RATE)
            .setScale(2, RoundingMode.HALF_UP);

        // ── 3. Interest ──────────────────────────────────────────────────────
        BigDecimal interestRate = request.getInterestRateOverride() != null
            ? request.getInterestRateOverride()
            : DEFAULT_INT_RATE;
        int interestDays = request.getInterestDays() != null ? request.getInterestDays() : 0;
        BigDecimal interestAmount = principalTotal
            .multiply(interestRate)
            .multiply(BigDecimal.valueOf(interestDays))
            .divide(DAYS_IN_YEAR, 2, RoundingMode.HALF_UP);

        // ── 4. Grand total ───────────────────────────────────────────────────
        BigDecimal totalDue = principalTotal
            .add(penaltyAmount)
            .add(interestAmount);

        // ── 5. Dates ─────────────────────────────────────────────────────────
        LocalDate issueDate = LocalDate.now();
        int dueDays = request.getDueDays() != null ? request.getDueDays() : 30;
        LocalDate dueDate = issueDate.plusDays(dueDays);

        // ── 6. Notice number ─────────────────────────────────────────────────
        String noticeNumber = generateNoticeNumber(auditCase);

        // ── 7. Persist notice ─────────────────────────────────────────────────
        CaAssessmentNoticeEntity notice = CaAssessmentNoticeEntity.builder()
            .auditCase(auditCase)
            .noticeNumber(noticeNumber)
            .issueDate(issueDate)
            .statutoryDueDate(dueDate)
            .principalCit(principalCit)
            .principalVat(principalVat)
            .principalPaye(principalPaye)
            .principalWht(principalWht)
            .principalTotal(principalTotal)
            .penaltyPct(PENALTY_RATE)
            .penaltyAmount(penaltyAmount)
            .interestRateAnnual(interestRate)
            .interestDays(interestDays)
            .interestAmount(interestAmount)
            .totalAssessmentDue(totalDue)
            .objectionStatus("NONE")
            .fraudReferralTriggered(false)
            .taxpayerSigned(false)
            .status("DRAFT")
            .issuedBy(actorId)
            .build();

        notice = noticeRepository.save(notice);
        log.info("Assessment notice {} generated for case {} — total ETB {}",
            noticeNumber, caseId, totalDue);

        // ── 8. Zone allocations — FR-04.4-31, 32 ─────────────────────────────
        if (request.getZoneAllocations() != null && !request.getZoneAllocations().isEmpty()) {
            List<CaMultiZoneAllocationEntity> zones = new ArrayList<>();
            for (GenerateAssessmentNoticeRequest.ZoneAllocationLine line
                    : request.getZoneAllocations()) {
                BigDecimal adj = line.getAuditAdjustment() != null
                    ? line.getAuditAdjustment() : BigDecimal.ZERO;
                BigDecimal dec = line.getTaxDeclared() != null
                    ? line.getTaxDeclared() : BigDecimal.ZERO;
                zones.add(CaMultiZoneAllocationEntity.builder()
                    .auditCase(auditCase)
                    .notice(notice)
                    .zoneName(line.getZoneName())
                    .branchCode(line.getBranchCode())
                    .taxDeclared(dec)
                    .auditAdjustment(adj)
                    .netPayable(adj.subtract(dec).abs())
                    .taxType(line.getTaxType())
                    .periodCovered(line.getPeriodCovered())
                    .build());
            }
            zoneRepository.saveAll(zones);
            log.info("Persisted {} zone allocations for notice {}", zones.size(), noticeNumber);
        }

        return notice;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private String generateNoticeNumber(ApAuditCaseEntity auditCase) {
        String year = String.valueOf(LocalDate.now().getYear());
        String tc = auditCase.getTaxCenter() != null
            ? auditCase.getTaxCenter().toUpperCase().replace("-", "_")
            : "TC";
        // Use last 6 chars of case UUID as sequence to avoid DB sequence dependency
        String seq = auditCase.getId().toString().replace("-", "").substring(0, 6).toUpperCase();
        return "CA-NOTICE-" + year + "-" + tc + "-" + seq;
    }
}
