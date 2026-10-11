package mor.itas.seeders.generators;

import mor.itas.persistence.jpa.entity.ap.CommitteeCaseEntity;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Committee Case Data Generator
 * Programmatically generates realistic committee case data with:
 * - Varied statuses and lifecycle stages
 * - Risk scores correlated with industry and segment
 * - Realistic dates and timelines
 * - Ownership distribution
 * - Business relationships and constraints
 */
@Component
@Profile("mock")
@Slf4j
public class CommitteeCaseGenerator {

    private static final String[] INDUSTRIES = {
        "Manufacturing", "Services", "Trading", "Financial Services",
        "Retail", "Construction", "Healthcare", "Technology", "Energy"
    };

    private static final String[] SEGMENTS = {"LARGE", "MEDIUM", "SMALL"};

    private static final String[] TAX_CENTERS = {
        "addis_ababa-tc1", "addis_ababa-tc2", "addis_ababa-tc3",
        "oromia-tc1", "oromia-tc2", "oromia-tc3",
        "amhara-tc1", "amhara-tc2", "amhara-tc3",
        "dire_dawa-tc1", "dire_dawa-tc2", "dire_dawa-tc3",
        "snnpr-tc1", "snnpr-tc2", "snnpr-tc3",
        "somali-tc1", "somali-tc2", "somali-tc3"
    };

    private static final String[] CASE_STATUSES = {
        "PENDING_VOTES",
        "PENDING_VIABILITY"
    };

    // Tax center-specific case data for realistic distribution
    private static final Map<String, List<Map<String, String>>> TAX_CENTER_CASES = Map.of(
        "addis_ababa-tc1", List.of(
            Map.of("name", "Ethiopian Mining Corporation", "industry", "Manufacturing", "segment", "LARGE", "tin", "01-1001234", "city", "Addis Ababa", "region", "Addis Ababa"),
            Map.of("name", "Blue Nile Construction PLC", "industry", "Construction", "segment", "MEDIUM", "tin", "01-1005678", "city", "Addis Ababa", "region", "Addis Ababa"),
            Map.of("name", "Habesha Trading Enterprise", "industry", "Trading", "segment", "MEDIUM", "tin", "01-1009012", "city", "Addis Ababa", "region", "Addis Ababa"),
            Map.of("name", "Sheger Floriculture PLC", "industry", "Services", "segment", "LARGE", "tin", "01-1003456", "city", "Addis Ababa", "region", "Addis Ababa")
        ),
        "addis_ababa-tc2", List.of(
            Map.of("name", "Dashen Bank S.C.", "industry", "Financial Services", "segment", "LARGE", "tin", "01-2007890", "city", "Addis Ababa", "region", "Addis Ababa"),
            Map.of("name", "Addis Ababa Pharmaceuticals", "industry", "Healthcare", "segment", "MEDIUM", "tin", "01-2001234", "city", "Addis Ababa", "region", "Addis Ababa"),
            Map.of("name", "Rift Valley Retail Group", "industry", "Retail", "segment", "LARGE", "tin", "01-2005678", "city", "Addis Ababa", "region", "Addis Ababa"),
            Map.of("name", "Titan Energy Solutions", "industry", "Energy", "segment", "MEDIUM", "tin", "01-2009012", "city", "Addis Ababa", "region", "Addis Ababa")
        ),
        "addis_ababa-tc3", List.of(
            Map.of("name", "Hawassa Industrial Park PLC", "industry", "Manufacturing", "segment", "LARGE", "tin", "03-3001234", "city", "Hawassa", "region", "Sidama"),
            Map.of("name", "Sidama Coffee Exporters", "industry", "Trading", "segment", "MEDIUM", "tin", "03-3005678", "city", "Hawassa", "region", "Sidama"),
            Map.of("name", "Rift Valley Tech Solutions", "industry", "Technology", "segment", "SMALL", "tin", "03-3009012", "city", "Hawassa", "region", "Sidama"),
            Map.of("name", "Lake Awassa Hospitality Group", "industry", "Services", "segment", "MEDIUM", "tin", "03-3003456", "city", "Hawassa", "region", "Sidama")
        ),
        "oromia-tc1", List.of(
            Map.of("name", "Jimma Agricultural Industries", "industry", "Manufacturing", "segment", "LARGE", "tin", "06-4001234", "city", "Jimma", "region", "Oromia"),
            Map.of("name", "Oromia Mining & Minerals", "industry", "Energy", "segment", "LARGE", "tin", "06-4005678", "city", "Adama", "region", "Oromia"),
            Map.of("name", "Bale Pastoral Enterprises", "industry", "Trading", "segment", "MEDIUM", "tin", "06-4009012", "city", "Robe", "region", "Oromia"),
            Map.of("name", "Finfinne Real Estate PLC", "industry", "Construction", "segment", "MEDIUM", "tin", "06-4003456", "city", "Addis Ababa", "region", "Oromia")
        )
    );

    private final Random random;

    public CommitteeCaseGenerator() {
        this.random = new Random(12345); // Seeded for reproducibility
    }

    /**
     * Generate a collection of committee cases
     */
    public List<CommitteeCaseEntity> generateCases(int count) {
        log.debug("Generating {} committee cases", count);
        List<CommitteeCaseEntity> cases = new ArrayList<>();

        for (int i = 0; i < count; i++) {
            CommitteeCaseEntity entity = generateCase(i);
            cases.add(entity);
        }

        return cases;
    }

    /**
     * Generate a single committee case
     */
    private CommitteeCaseEntity generateCase(int index) {
        CommitteeCaseEntity entity = new CommitteeCaseEntity();

        // Generate UUIDs
        entity.setCaseId(generateDeterministicUUID("case", index));
        entity.setOriginalCaseId(generateDeterministicUUID("original", index));

        // Determine tax center and get tax center-specific data
        String taxCenter = TAX_CENTERS[index % TAX_CENTERS.length];
        List<Map<String, String>> tcCases = TAX_CENTER_CASES.getOrDefault(taxCenter, TAX_CENTER_CASES.get("addis_ababa-tc1"));
        Map<String, String> caseData = tcCases.get(index / TAX_CENTERS.length % tcCases.size());

        // Generate taxpayer information from tax center-specific data
        String industry = caseData.get("industry");
        String segment = caseData.get("segment");

        entity.setTaxpayerId(generateDeterministicUUID("taxpayer", index));
        entity.setTaxpayerName(caseData.get("name"));
        entity.setTaxIdNumber(caseData.get("tin") + "-" + String.format("%03d", index));
        entity.setSegment(segment);
        entity.setIndustry(industry);

        // Generate risk assessment (correlate with industry and segment)
        int riskScore = calculateRiskScore(index, industry, segment);
        entity.setRiskScore(riskScore);
        entity.setRiskPriority(getRiskLevel(riskScore));

        // Generate case lifecycle
        OffsetDateTime createdDate = generateCreatedDate(index);
        entity.setCreatedDate(createdDate);
        entity.setCommitteeDeadline(createdDate.plusDays(14));

        // Add SLA extension for some cases
        if (index % 7 == 0) {
            entity.setExtensionCount(1);
            entity.setExtendedDeadline(createdDate.plusDays(21));
        } else {
            entity.setExtensionCount(0);
        }

        // Generate status
        String status = CASE_STATUSES[index % CASE_STATUSES.length];
        entity.setStatus(status);

        int tcIdx = (index % TAX_CENTERS.length) + 1;
        UUID tcChairUuid = UUID.fromString(String.format("20000000-0000-0000-%04d-000000000001", tcIdx));
        UUID tcMemberUuid = UUID.fromString(String.format("20000000-0000-0000-%04d-000000000002", tcIdx));

        entity.setChairpersonId(tcChairUuid);
        entity.setCreatedBy(tcChairUuid);

        // Seeded cases begin at the committee level; team lead is assigned only after committee appointment
        entity.setTeamLeadId(null);

        // Generate ownership (assigned to TC Member or Chair)
        if ((index % 3) != 0) {
            entity.setCurrentOwnerId((index % 2 == 0) ? tcMemberUuid : tcChairUuid);
            entity.setOwnershipAcquiredAt(OffsetDateTime.now().minusDays(random.nextInt(7) + 1));
        }

        entity.setDecision(null);
        entity.setDecisionDate(null);
        entity.setHandoffRecordId(null);
        entity.setHandoffDate(null);

        // Generate extended case details
        entity.setDescription(generateDescription(index, industry, segment));
        entity.setBusinessType(industry);
        entity.setTotalAmount(new java.math.BigDecimal(100000 + random.nextInt(900000)));
        entity.setAssessmentScore(String.valueOf(50 + random.nextInt(50)));
        entity.setAddress(generateAddress(index));
        entity.setCity(caseData.get("city"));
        entity.setRegion(caseData.get("region"));
        entity.setComplianceIssues(generateComplianceIssues(index, industry));
        entity.setRiskIndicators(generateRiskIndicators(index, industry, segment, riskScore));
        entity.setRepresentatives(generateRepresentatives(index));

        // Assign tax center
        entity.setTaxCenter(taxCenter);

        // Audit metadata
        entity.setCreatedBy(generateDeterministicUUID("system", 0));
        entity.setCreatedAt(OffsetDateTime.now());

        return entity;
    }

    /**
     * Calculate risk score based on industry, segment, and index
     * Risk scores are correlated with real-world audit risk patterns
     */
    private int calculateRiskScore(int index, String industry, String segment) {
        int baseScore = (index * 7) % 100;

        // Industry-specific risk adjustments
        switch (industry) {
            case "Financial Services":
                baseScore += 18; // Compliance-heavy
                break;
            case "Manufacturing":
                baseScore += 12; // Inventory complexities
                break;
            case "Trading":
                baseScore += 15; // Cash handling, revenue recognition
                break;
            case "Healthcare":
                baseScore += 10; // Billing complexities
                break;
            case "Construction":
                baseScore += 14; // Contract accounting
                break;
            case "Technology":
                baseScore -= 5; // Generally lower risk
                break;
            case "Services":
                baseScore += 5;
                break;
        }

        // Segment-specific risk adjustments
        switch (segment) {
            case "LARGE":
                baseScore += 8; // Complexity increases risk
                break;
            case "MEDIUM":
                baseScore += 2;
                break;
            case "SMALL":
                baseScore -= 5; // Simpler structures
                break;
        }

        // Add some variation
        baseScore += random.nextInt(15) - 7;

        return Math.min(100, Math.max(0, baseScore));
    }

    /**
     * Determine risk level based on score
     */
    private String getRiskLevel(int score) {
        if (score >= 70) return "HIGH";
        if (score >= 40) return "MEDIUM";
        return "LOW";
    }

    /**
     * Generate company name - uses tax center-specific data
     */
    private String generateCompanyName(int index) {
        String taxCenter = TAX_CENTERS[index % TAX_CENTERS.length];
        List<Map<String, String>> tcCases = TAX_CENTER_CASES.getOrDefault(taxCenter, TAX_CENTER_CASES.get("addis_ababa-tc1"));
        Map<String, String> caseData = tcCases.get(index / TAX_CENTERS.length % tcCases.size());
        return caseData.get("name");
    }

    /**
     * Generate Tax ID Number - uses tax center-specific TIN
     */
    private String generateTIN(int index) {
        String taxCenter = TAX_CENTERS[index % TAX_CENTERS.length];
        List<Map<String, String>> tcCases = TAX_CENTER_CASES.getOrDefault(taxCenter, TAX_CENTER_CASES.get("addis_ababa-tc1"));
        Map<String, String> caseData = tcCases.get(index / TAX_CENTERS.length % tcCases.size());
        return caseData.get("tin");
    }

    /**
     * Generate creation date - spread over past 20 days
     */
    private OffsetDateTime generateCreatedDate(int index) {
        int daysAgo = 5 + (index % 20);
        return OffsetDateTime.now().minusDays(daysAgo);
    }

    /**
     * Generate owner ID - cycles through 5 committee members
     */
    private UUID generateMemberId(int index) {
        int memberId = 1 + (index % 5);
        return generateDeterministicUUID("member", memberId);
    }

    /**
     * Generate deterministic UUID from components
     * Ensures reproducible UUIDs across runs
     */
    private UUID generateDeterministicUUID(String namespace, int id) {
        String input = namespace + "-" + id;
        return UUID.nameUUIDFromBytes(input.getBytes());
    }

    // ── Extended field generators ──────────────────────────────────

    private String generateDescription(int index, String industry, String segment) {
        String[] templates = {
            "Tax audit case for %s company operating in the %s sector. Segment: %s. Initial risk assessment indicates potential compliance gaps requiring detailed examination.",
            "Routine compliance review of %s enterprise. Industry: %s. The case was flagged due to %s risk indicators and requires committee evaluation.",
            "Investigation case involving %s organization in %s. %s taxpayer segment. Multiple financial anomalies detected during preliminary screening.",
            "Audit referral for %s entity operating in %s. Classified as %s segment. Revenue discrepancies and unusual transaction patterns identified.",
            "Joint audit case for %s business in the %s industry. %s segment taxpayer. Transfer pricing and VAT compliance issues under review."
        };
        String[] riskReasons = {"high", "medium", "elevated", "significant", "moderate"};
        String reason = riskReasons[index % riskReasons.length];
        return String.format(templates[index % templates.length],
            generateCompanyName(index).split(" ")[0], industry, segment.toLowerCase(), reason);
    }

    private String generateAddress(int index) {
        String[] streets = {
            "Bole Road, Building 12", "Churchill Avenue, Floor 3",
            "Africa Avenue, Tower Block", "Ras Mekonnen Street, Suite 201",
            "Meskel Square, Office Complex", "Mercato Area, Block 5",
            "Kazanchis, Commercial Center", "Arat Kilo, Government Road"
        };
        return streets[index % streets.length];
    }



    private List<String> generateComplianceIssues(int index, String industry) {
        List<String> issues = new ArrayList<>();
        issues.add("VAT non-compliance detected");
        if (index % 3 == 0) issues.add("Transfer pricing anomaly");
        if (index % 4 == 0) issues.add("Unreported income streams");
        if (index % 5 == 0) issues.add("Improper expense deductions");
        if (index % 6 == 0) issues.add("Missing withholding tax documentation");
        if ("Financial Services".equals(industry)) issues.add("Regulatory capital adequacy concerns");
        if ("Manufacturing".equals(industry)) issues.add("Inventory valuation discrepancies");
        if ("Trading".equals(industry)) issues.add("Revenue recognition irregularities");
        return issues;
    }

    /**
     * Generate structured risk indicators from the config library.
     * Each case gets 2-5 indicators based on industry, segment, and risk score.
     */
    private List<Map<String, Object>> generateRiskIndicators(int index, String industry, String segment, int riskScore) {
        // Full risk indicator library (mirrors auditConfig.js riskIndicators)
        List<Map<String, Object>> allIndicators = List.of(
            Map.of("id", "late_filing", "name", "Late Filing", "weight", 2.0, "description", "Repeated late tax return filing", "source", "Admin Data"),
            Map.of("id", "late_payment", "name", "Late Payment", "weight", 2.0, "description", "Pattern of late tax payments", "source", "Payment Records"),
            Map.of("id", "vat_mismatch", "name", "VAT Mismatch", "weight", 3.0, "description", "Input VAT exceeds Output VAT consistently", "source", "VAT Returns"),
            Map.of("id", "import_sales_variance", "name", "Import vs Sales Variance", "weight", 2.5, "description", "Imports significantly exceed sales", "source", "Customs, Returns"),
            Map.of("id", "continuous_loss", "name", "Continuous Losses", "weight", 2.0, "description", "Business reports losses for multiple years", "source", "Financial Statements"),
            Map.of("id", "income_variance", "name", "Income Variance", "weight", 2.0, "description", "Significant income fluctuations", "source", "Returns Analysis"),
            Map.of("id", "undisclosed_assets", "name", "Undisclosed Assets", "weight", 3.0, "description", "Assets not declared or inconsistent", "source", "Third Party Info"),
            Map.of("id", "industry_anomaly", "name", "Industry Anomaly", "weight", 2.0, "description", "Performance differs significantly from industry", "source", "Benchmarking"),
            Map.of("id", "cash_intensive", "name", "Cash Intensive Business", "weight", 1.5, "description", "Business operates primarily on cash", "source", "Industry Classification"),
            Map.of("id", "new_business", "name", "New Business Establishment", "weight", 1.0, "description", "Business in first 2 years", "source", "Registration Date")
        );

        List<Map<String, Object>> selected = new ArrayList<>();
        String severity = riskScore >= 70 ? "HIGH" : riskScore >= 40 ? "MEDIUM" : "LOW";

        // Always include industry-relevant indicators
        switch (industry) {
            case "Manufacturing":
                addIndicator(selected, allIndicators, "vat_mismatch", severity);
                addIndicator(selected, allIndicators, "inventory_valuation", severity);
                addIndicator(selected, allIndicators, "import_sales_variance", severity);
                break;
            case "Trading":
                addIndicator(selected, allIndicators, "cash_intensive", severity);
                addIndicator(selected, allIndicators, "income_variance", severity);
                addIndicator(selected, allIndicators, "late_filing", severity);
                break;
            case "Financial Services":
                addIndicator(selected, allIndicators, "undisclosed_assets", severity);
                addIndicator(selected, allIndicators, "vat_mismatch", severity);
                addIndicator(selected, allIndicators, "industry_anomaly", severity);
                break;
            case "Construction":
                addIndicator(selected, allIndicators, "late_payment", severity);
                addIndicator(selected, allIndicators, "income_variance", severity);
                addIndicator(selected, allIndicators, "continuous_loss", severity);
                break;
            case "Services":
                addIndicator(selected, allIndicators, "income_variance", severity);
                addIndicator(selected, allIndicators, "cash_intensive", severity);
                break;
            case "Healthcare":
                addIndicator(selected, allIndicators, "vat_mismatch", severity);
                addIndicator(selected, allIndicators, "industry_anomaly", severity);
                break;
            case "Technology":
                addIndicator(selected, allIndicators, "new_business", severity);
                addIndicator(selected, allIndicators, "industry_anomaly", severity);
                break;
            case "Energy":
                addIndicator(selected, allIndicators, "undisclosed_assets", severity);
                addIndicator(selected, allIndicators, "import_sales_variance", severity);
                break;
            case "Retail":
                addIndicator(selected, allIndicators, "cash_intensive", severity);
                addIndicator(selected, allIndicators, "late_filing", severity);
                addIndicator(selected, allIndicators, "income_variance", severity);
                break;
        }

        // Add segment-based indicators
        if ("LARGE".equals(segment)) {
            addIndicator(selected, allIndicators, "import_sales_variance", severity);
        }
        if (riskScore >= 60) {
            addIndicator(selected, allIndicators, "continuous_loss", severity);
        }
        if (index % 7 == 0) {
            addIndicator(selected, allIndicators, "new_business", severity);
        }

        return selected;
    }

    private void addIndicator(List<Map<String, Object>> selected, List<Map<String, Object>> all, String id, String severity) {
        all.stream()
            .filter(i -> id.equals(i.get("id")))
            .findFirst()
            .ifPresent(template -> {
                if (selected.stream().noneMatch(s -> id.equals(s.get("id")))) {
                    Map<String, Object> indicator = new HashMap<>(template);
                    indicator.put("severity", severity);
                    selected.add(indicator);
                }
            });
    }

    private List<Map<String, String>> generateRepresentatives(int index) {
        String[] firstNames = {"Abebe", "Bekele", "Dawit", "Fikru", "Girma"};
        String[] lastNames = {"Haile", "Tadesse", "Mulugeta", "Alemayehu", "Worku"};
        String[] titles = {"Finance Director", "Managing Director", "CFO", "Head of Tax", "Compliance Officer"};
        List<Map<String, String>> reps = new ArrayList<>();
        Map<String, String> rep = new HashMap<>();
        rep.put("name", firstNames[index % firstNames.length] + " " + lastNames[index % lastNames.length]);
        rep.put("title", titles[index % titles.length]);
        reps.add(rep);
        if (index % 3 == 0) {
            Map<String, String> rep2 = new HashMap<>();
            rep2.put("name", firstNames[(index + 2) % firstNames.length] + " " + lastNames[(index + 1) % lastNames.length]);
            rep2.put("title", "Tax Manager");
            reps.add(rep2);
        }
        return reps;
    }
}
