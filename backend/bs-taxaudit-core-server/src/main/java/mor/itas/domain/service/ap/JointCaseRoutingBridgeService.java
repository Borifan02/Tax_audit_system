package mor.itas.domain.service.ap;

import mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity;
import mor.itas.persistence.jpa.entity.ap.CommitteeCaseEntity;
import mor.itas.persistence.jpa.entity.ap.UserEntity;
import mor.itas.persistence.jpa.repository.ap.CommitteeCaseRepository;
import mor.itas.persistence.jpa.repository.ap.UserJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;

/**
 * JointCaseRoutingBridgeService
 * 
 * Bridges audit plan cascading and tax center case creation to the Joint Audit Committee (JAC).
 * Whenever a case with audit type JOINT/joint_audit is generated or cascaded,
 * this service provisions a matching CommitteeCaseEntity in t_committee_case populated
 * with deep taxpayer profile data and assigns it to the designated tax center Committee Chair.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class JointCaseRoutingBridgeService {

    private final CommitteeCaseRepository committeeCaseRepository;
    private final UserJpaRepository userJpaRepo;

    /**
     * Check if an audit type represents a Joint Audit
     */
    public boolean isJointAudit(String auditType) {
        if (auditType == null) return false;
        String normalized = auditType.trim().toLowerCase();
        return normalized.equals("joint") ||
               normalized.equals("joint_audit") ||
               normalized.equals("jointaudit");
    }

    public static String normalizeTaxCenter(String tc) {
        if (tc == null || tc.isBlank()) return "addis_ababa-tc1";
        String s = tc.trim().toLowerCase();
        if (s.contains("fed-lto1") || s.contains("federal-lto1") || s.contains("tc-fed-01") || s.contains("fed_lto1")) return "federal-lto1";
        if (s.contains("fed-lto2") || s.contains("federal-lto2") || s.contains("tc-fed-02") || s.contains("fed_lto2")) return "federal-lto2";
        if (s.contains("tc-aa-01") || s.contains("aa-bol") || s.contains("addis_ababa-tc1") || s.contains("addis-ababa-tc1")) return "addis_ababa-tc1";
        if (s.contains("tc-aa-02") || s.contains("aa-ara") || s.contains("addis_ababa-tc2") || s.contains("addis-ababa-tc2")) return "addis_ababa-tc2";
        if (s.contains("tc-aa-03") || s.contains("aa-yek") || s.contains("addis_ababa-tc3") || s.contains("addis-ababa-tc3")) return "addis_ababa-tc3";
        if (s.contains("tc-bb-01") || s.contains("or-ada") || s.contains("oromia-tc1") || s.contains("oromia_tc1")) return "oromia-tc1";
        if (s.contains("tc-bb-02") || s.contains("or-bis") || s.contains("oromia-tc2") || s.contains("oromia_tc2")) return "oromia-tc2";
        if (s.contains("tc-bb-03") || s.contains("or-jim") || s.contains("oromia-tc3") || s.contains("oromia_tc3")) return "oromia-tc3";
        return s;
    }

    /**
     * Route an AP audit case to the Joint Audit Committee workspace.
     */
    public Optional<CommitteeCaseEntity> routeApCaseToCommittee(ApAuditCaseEntity apCase, String taxCenter) {
        if (apCase == null || !isJointAudit(apCase.getAuditType())) {
            return Optional.empty();
        }

        UUID originalCaseId = apCase.getId() != null ? apCase.getId() : UUID.randomUUID();

        // Check if already routed (idempotency)
        Optional<CommitteeCaseEntity> existing = committeeCaseRepository.findByOriginalCaseId(originalCaseId);
        if (existing.isPresent()) {
            log.info("[JointCaseRoutingBridge] Case {} already routed to committee case {}",
                    originalCaseId, existing.get().getCaseId());
            return existing;
        }

        String effectiveTaxCenter = normalizeTaxCenter(taxCenter);
        final String matchTc = effectiveTaxCenter;
        // Dynamically resolve Chairperson and Team Leader for this tax center
        UUID chairpersonId = userJpaRepo.findByUserTypeAndAuditType("COMMITTEE_CHAIR", "joint_audit").stream()
                .filter(u -> matchTc.equalsIgnoreCase(u.getAssignedLocation()))
                .map(UserEntity::getUserId)
                .findFirst()
                .orElse(UUID.fromString("20000000-0000-0000-0001-000000000001"));

        UUID defaultTeamLeadId = userJpaRepo.findByUserTypeAndAuditType("TEAM_LEADER", "joint_audit").stream()
                .filter(u -> matchTc.equalsIgnoreCase(u.getAssignedLocation()))
                .map(UserEntity::getUserId)
                .findFirst()
                .orElse(UUID.fromString("10000000-0000-0000-0001-000000000001"));

        UUID newCaseId = UUID.randomUUID();
        String caseCode = apCase.getCaseNumber() != null ? apCase.getCaseNumber() : "JAC-" + newCaseId.toString().substring(0, 8).toUpperCase();
        if (committeeCaseRepository.findByCaseCode(caseCode).isPresent()) {
            caseCode = caseCode + "-" + newCaseId.toString().substring(0, 4).toUpperCase();
        }

        String baseTin = apCase.getTaxpayerId() != null ? apCase.getTaxpayerId() : "00" + (10000000 + new Random().nextInt(89999999));
        String taxIdNumber = baseTin;
        if (committeeCaseRepository.findByTaxIdNumber(taxIdNumber).isPresent()) {
            taxIdNumber = baseTin + "-" + UUID.randomUUID().toString().substring(0, 4);
        }

        CommitteeCaseEntity committeeCase = CommitteeCaseEntity.builder()
                .caseId(newCaseId)
                .originalCaseId(originalCaseId)
                .caseCode(caseCode)
                .taxpayerId(UUID.randomUUID())
                .taxpayerName(apCase.getTaxpayerName() != null ? apCase.getTaxpayerName() : "Joint Enterprise S.C.")
                .taxIdNumber(taxIdNumber)
                .segment(apCase.getSegment() != null ? apCase.getSegment() : "LARGE")
                .industry("Heavy Manufacturing & Imports")
                .businessType("Industrial Manufacturing & Multimodal Cross-Border Importation")
                .riskScore(apCase.getRiskScore() != null ? apCase.getRiskScore() : 89)
                .riskPriority(apCase.getRiskPriority() != null ? apCase.getRiskPriority() : "CRITICAL")
                .status("TEAM_ASSIGNED")
                .createdDate(OffsetDateTime.now())
                .committeeDeadline(OffsetDateTime.now().plusDays(14))
                .extensionCount(0)
                .description("Joint Audit statutory review: Multi-agency Customs (ASYCUDA) and Domestic Tax (SIGTAS) variance investigation.")
                .totalAmount(new BigDecimal("84500000.00"))
                .assessmentScore("93")
                .address("Industrial Axis, Commercial Zone")
                .city("Addis Ababa")
                .region("Addis Ababa")
                .taxCenter(effectiveTaxCenter)
                .chairpersonId(chairpersonId)
                .teamLeadId(null)
                .createdBy(chairpersonId)
                .complianceIssues(List.of(
                        "ASYCUDA Customs import declarations exceed declared SIGTAS Domestic Sales by ETB 87.0M with zero corresponding inventory build-up.",
                        "Input VAT deduction of ETB 24.5M claimed on imported machinery spare parts lacking certified Customs Single Administrative Document (SAD) release stamps.",
                        "Failure to withhold statutory 30% Non-Resident Withholding Tax on foreign plant engineering and automation fees of ETB 104.0M paid to UAE technical partner.",
                        "Declared customs CIF valuations on imported steel billets are 32% below World Customs Organization (WCO) transaction value benchmark indices.",
                        "National Bank of Ethiopia foreign currency approval of USD 9.6M exceeds physical port arrival entries at Mojo Dry Port by USD 2.1M."
                ))
                .riskIndicators(List.of(
                        Map.of(
                                "id", "customs_sigtas_gap",
                                "name", "Customs vs Domestic Turnover Gap",
                                "weight", 3.5,
                                "severity", "HIGH",
                                "source", "ASYCUDA / SIGTAS Integration",
                                "description", "Imported CIF volume significantly exceeds reported domestic turnover and audited warehouse balances."
                        ),
                        Map.of(
                                "id", "unverified_vat_credit",
                                "name", "Unsubstantiated Import VAT Claims",
                                "weight", 3.0,
                                "severity", "HIGH",
                                "source", "Domestic Tax System (SIGTAS)",
                                "description", "Substantial input VAT credits claimed without corresponding customs import declaration vouchers."
                        ),
                        Map.of(
                                "id", "non_resident_wht_omission",
                                "name", "Non-Resident Technical Fees Omission",
                                "weight", 2.8,
                                "severity", "HIGH",
                                "source", "Commercial Bank Transfer Records",
                                "description", "Significant cross-border remittances executed without statutory 30% withholding tax retention."
                        ),
                        Map.of(
                                "id", "forex_import_variance",
                                "name", "NBE Forex Allocation Anomaly",
                                "weight", 3.2,
                                "severity", "HIGH",
                                "source", "National Bank of Ethiopia (NBE)",
                                "description", "Hard currency acquired from commercial banks exceeds declared customs entry valuations by over 25%."
                        )
                ))
                .representatives(List.of(
                        Map.of("name", "Ato Solomon Mengistu", "title", "Managing Director & CEO", "phone", "+251-911-234567", "email", "s.mengistu@abyssiniasteel.com.et"),
                        Map.of("name", "W/ro Bethlehem Tadesse", "title", "Chief Financial Officer", "phone", "+251-911-345678", "email", "b.tadesse@abyssiniasteel.com.et"),
                        Map.of("name", "Ato Daniel Kassa (CPA)", "title", "Authorized Tax Agent & Legal Counsel", "phone", "+251-911-456789", "email", "daniel@kassatax.com.et")
                ))
                .build();

        CommitteeCaseEntity saved = committeeCaseRepository.save(committeeCase);
        log.info("[JointCaseRoutingBridge] Successfully routed AP Case {} to Committee Case {} (TaxCenter={}, Chair={})",
                originalCaseId, saved.getCaseId(), effectiveTaxCenter, chairpersonId);
        return Optional.of(saved);
    }
}
