package mor.itas.application.service.qa;

import mor.itas.persistence.jpa.entity.qa.QaReviewDimensionEntity;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * The canonical ISO-19011 / SoR FR-04.5 review dimension catalogue.
 *
 * Weights are percentages and must sum to 100 so the weighted overall score is
 * directly comparable across reviews. Dimensions are seeded onto every new
 * {@code qa_review_case} so scoring always starts from a consistent baseline.
 */
public final class QaDimensionCatalogue {

    private QaDimensionCatalogue() {}

    /** Immutable description of one catalogue dimension. */
    public record Dim(String code, String category, String title,
                      String standardsReference, int weight, List<String> checkpoints) {}

    /**
     * The first checkpoint of each dimension is treated as critical; the rest are
     * advisory. That mirrors the workspace behaviour where a failed critical
     * checkpoint forces the dimension status to CRITICAL_FAILURE.
     */
    public static final List<Dim> DIMENSIONS = List.of(
        new Dim("DIM-01", "PLANNING_AND_RISK",
            "Audit Planning, Scope & Materiality Determination",
            "SOR FR-04.5-01 / ISO 19011 Clause 6.2", 15,
            List.of("CRITICAL|Comprehensive audit scope formally documented and aligned with ITAS automated risk flags",
                    "Materiality threshold calculated using the standard revenue/asset formula and signed by the Team Leader",
                    "Pre-audit profile identifies all connected entities and offshore associates")),
        new Dim("DIM-02", "EVIDENCE_AND_CAAT",
            "CAAT Forensic Execution & Third-Party Evidence Sufficiency",
            "SOR FR-04.5-02 / ISO 19011 Clause 6.4.4", 20,
            List.of("CRITICAL|CAAT scripts executed over the full statutory period and the exception log retained",
                    "Third-party confirmations obtained directly and independently verified",
                    "Evidence is sufficient, relevant and reliable to support every adjustment")),
        new Dim("DIM-03", "STATUTORY_PROCEDURES",
            "Mandatory Substantive Audit Procedures Completeness",
            "SOR FR-04.5-03 / Tax Administration Act S.38", 15,
            List.of("CRITICAL|All mandatory substantive procedures in the approved audit programme were performed",
                    "Deviations from the programme are documented, justified and approved",
                    "Working papers cross-reference each procedure to its supporting evidence")),
        new Dim("DIM-04", "RECONCILIATIONS",
            "3-Way Cross-Tax Reconciliations (VAT, CIT, PAYE, ASYCUDA Customs)",
            "SOR FR-04.7-20 / Statutory Cross-Tax Compliance", 15,
            List.of("CRITICAL|Turnover per CIT return agrees to the VAT and ASYCUDA customs declarations",
                    "Variances are quantified, explained and escalated where material",
                    "Reconciliation is signed off by both the preparer and the reviewer")),
        new Dim("DIM-05", "LEGAL_APPLICATION",
            "Technical Tax Law Application & Transfer Pricing Standards",
            "SOR FR-04.5-04 / OECD Guidelines / Tax Code S.24", 15,
            List.of("CRITICAL|Proposed adjustments cite statutory sections, tax regulations and published practice notes",
                    "Transfer pricing adjustments are supported by a functional analysis and a current benchmarking study",
                    "Applicable Double Taxation Agreements (DTA) and withholding rates are validated")),
        new Dim("DIM-06", "TAXPAYER_RIGHTS",
            "Due Process, Taxpayer Rights & Statutory Notice Protocols",
            "SOR FR-04.5-05 / Taxpayer Rights Charter / S.42", 10,
            List.of("CRITICAL|Statutory Entry Conference conducted within the legal timeline with signed minutes on file",
                    "All statutory notices were served within the prescribed timelines",
                    "Objection and appeal rights are clearly communicated to the taxpayer")),
        new Dim("DIM-07", "PENALTY_AND_INTEREST",
            "Statutory Penalty Rates, Mitigation & Late Interest Computation",
            "SOR FR-04.5-06 / Tax Administration Act S.48-52", 10,
            List.of("CRITICAL|Penalty rates applied match the statutory schedule for the breach class",
                    "Interest is computed from the correct due date to the assessment date",
                    "Any mitigation or waiver is supported by a documented approval"))
    );

    /** Total weight of the catalogue — asserted to be 100 by maven tests. */
    public static int catalogueWeight() {
        return DIMENSIONS.stream().mapToInt(Dim::weight).sum();
    }

    /** Builds the persisted dimension rows for a newly created QA review. */
    public static List<QaReviewDimensionEntity> buildFor(java.util.UUID qaReviewCaseId) {
        List<QaReviewDimensionEntity> rows = new ArrayList<>();
        int order = 1;
        for (Dim d : DIMENSIONS) {
            rows.add(QaReviewDimensionEntity.builder()
                    .qaReviewCaseId(qaReviewCaseId)
                    .dimensionCode(d.code())
                    .category(d.category())
                    .title(d.title())
                    .standardsReference(d.standardsReference())
                    .weight(d.weight())
                    .score(0)
                    .status("COMPLIANT")
                    .reviewerNotes("")
                    .checkpoints(defaultCheckpoints(d))
                    .displayOrder(order++)
                    .build());
        }
        return rows;
    }

    /**
     * Unscored checkpoints. Seeding them unsatisfied means "not yet verified"
     * rather than "failed" — which is why the initial score is 0 while the status
     * stays COMPLIANT and the review sits in PENDING_ASSIGNMENT.
     */
    public static List<Map<String, Object>> defaultCheckpoints(Dim d) {
        List<Map<String, Object>> out = new ArrayList<>();
        int i = 1;
        for (String raw : d.checkpoints()) {
            boolean critical = raw.startsWith("CRITICAL|");
            String text = critical ? raw.substring("CRITICAL|".length()) : raw;
            out.add(checkpoint(d, i++, text, critical));
        }
        return out;
    }

    private static Map<String, Object> checkpoint(Dim d, int index, String text, boolean critical) {
        Map<String, Object> cp = new LinkedHashMap<>();
        cp.put("id", "CP-" + d.code().substring(4) + "-" + index);
        cp.put("text", text);
        cp.put("isSatisfied", false);
        cp.put("isCritical", critical);
        cp.put("auditorEvidenceRef", null);
        cp.put("notes", null);
        return cp;
    }
}
