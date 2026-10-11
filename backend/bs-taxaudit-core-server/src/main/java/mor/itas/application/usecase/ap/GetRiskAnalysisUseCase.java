package mor.itas.application.usecase.ap;

import mor.itas.application.port.inboundport.ap.RiskAnalysisPort;
import mor.itas.application.port.outboundport.riskengine.RiskEnginePort;
import mor.itas.application.port.outboundport.taxpayerregistration.TaxpayerRegistrationPort;
import mor.itas.domain.model.ap.*;
import mor.itas.domain.valueobject.RiskDistribution;
import mor.itas.domain.valueobject.TaxpayerStats;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.*;

/**
 * GetRiskAnalysisUseCase - Application Use Case
 * 
 * Implements the RiskAnalysisPort inbound port.
 * 
 * Orchestrates the retrieval and aggregation of risk data from multiple sources:
 * 1. Calls RiskEnginePort to get risk distribution
 * 2. Calls TaxpayerRegistrationPort to get taxpayer counts
 * 3. Aggregates data at national and regional levels
 * 4. Computes plan defaults (case distribution scaled to ~1400 cases)
 * 
 * Returns a RiskAnalysis aggregate root ready for API response.
 */
@Component
public class GetRiskAnalysisUseCase implements RiskAnalysisPort {
    
    private final RiskEnginePort riskEnginePort;
    private final TaxpayerRegistrationPort taxpayerRegistrationPort;
    
    // Audit types (must match frontend constants)
    private static final List<String> AUDIT_TYPE_IDS = Arrays.asList(
            "desk_audit", "field_audit", "joint_audit", "transfer_pricing", "comprehensive", "issue_audit"
    );
    
    private static final Map<String, String> AUDIT_TYPE_NAMES = Map.ofEntries(
            Map.entry("desk_audit", "Desk Audit"),
            Map.entry("field_audit", "Field Audit"),
            Map.entry("joint_audit", "Joint Audit"),
            Map.entry("transfer_pricing", "Transfer Pricing"),
            Map.entry("comprehensive", "Comprehensive"),
            Map.entry("issue_audit", "Issue Audit")
    );

    public GetRiskAnalysisUseCase(
            RiskEnginePort riskEnginePort,
            TaxpayerRegistrationPort taxpayerRegistrationPort) {
        this.riskEnginePort = riskEnginePort;
        this.taxpayerRegistrationPort = taxpayerRegistrationPort;
    }

    public RiskAnalysis getRiskAnalysis() {
        try {
            // Fetch data from adapters
            RiskDistribution nationalRisk = riskEnginePort.getNationalRiskDistribution();
            TaxpayerStats nationalTaxpayers = taxpayerRegistrationPort.getNationalTaxpayerStats();
            Map<String, RiskDistribution> regionalRisk = riskEnginePort.getRiskDistributionByRegion();
            Map<String, TaxpayerStats> regionalTaxpayers = taxpayerRegistrationPort.getTaxpayersByRegion();
            Map<String, Double> auditTypeDistribution = riskEnginePort.getRecommendedAuditTypeDistribution();

            // Build national-level risk data
            NationalRiskData nationalData = buildNationalRiskData(
                    nationalTaxpayers,
                    nationalRisk,
                    auditTypeDistribution
            );

            // Build regional risk data
            List<RegionalRiskData> regionalDataList = buildRegionalRiskData(
                    regionalRisk,
                    regionalTaxpayers,
                    auditTypeDistribution
            );

            // Compute plan defaults
            Map<String, Map<String, Integer>> planDefaults = computePlanDefaults(
                    nationalData,
                    regionalDataList,
                    auditTypeDistribution
            );

            // Create and return RiskAnalysis aggregate
            return new RiskAnalysis(
                    UUID.randomUUID().toString(),
                    OffsetDateTime.now(),
                    "live",
                    nationalData,
                    regionalDataList,
                    planDefaults
            );

        } catch (Exception e) {
            // Fall back to estimated data if live APIs fail
            return getRiskAnalysisEstimated();
        }
    }

    /**
     * Build national-level risk data from adapter responses
     */
    private NationalRiskData buildNationalRiskData(
            TaxpayerStats taxpayers,
            RiskDistribution risk,
            Map<String, Double> auditTypeDistribution) {

        Long totalTaxpayers = taxpayers.total();
        Long totalRisky = risk.critical() + risk.high() + risk.medium() + risk.low();
        BigDecimal percentRisky = totalTaxpayers > 0
                ? new BigDecimal(totalRisky)
                        .divide(new BigDecimal(totalTaxpayers), 4, RoundingMode.HALF_UP)
                        .multiply(new BigDecimal(100))
                : BigDecimal.ZERO;

        // Risk level distribution
        Map<RiskLevel, Long> byRiskLevel = new HashMap<>();
        byRiskLevel.put(RiskLevel.CRITICAL, risk.critical());
        byRiskLevel.put(RiskLevel.HIGH, risk.high());
        byRiskLevel.put(RiskLevel.MEDIUM, risk.medium());
        byRiskLevel.put(RiskLevel.LOW, risk.low());

        // Audit type distribution
        List<AuditTypeDistribution> byAuditType = new ArrayList<>();
        for (String auditTypeId : AUDIT_TYPE_IDS) {
            Double auditTypePercent = auditTypeDistribution.getOrDefault(auditTypeId, 0.0);
            Long count = totalRisky > 0
                    ? Math.round(totalRisky * (auditTypePercent / 100.0))
                    : 0L;
            BigDecimal percentage = new BigDecimal(auditTypePercent).setScale(1, RoundingMode.HALF_UP);
            
            byAuditType.add(new AuditTypeDistribution(
                    auditTypeId,
                    AUDIT_TYPE_NAMES.get(auditTypeId),
                    count,
                    percentage
            ));
        }

        return new NationalRiskData(totalTaxpayers, totalRisky, percentRisky, byRiskLevel, byAuditType);
    }

    /**
     * Build regional-level risk data
     */
    private List<RegionalRiskData> buildRegionalRiskData(
            Map<String, RiskDistribution> regionalRisk,
            Map<String, TaxpayerStats> regionalTaxpayers,
            Map<String, Double> auditTypeDistribution) {

        List<RegionalRiskData> result = new ArrayList<>();

        // Standard region codes and names (should match frontend constants)
        Map<String, String> regionNames = Map.ofEntries(
                Map.entry("AA", "Addis Ababa"),
                Map.entry("AB", "Dire Dawa"),
                Map.entry("BA", "Amhara"),
                Map.entry("BB", "Oromia"),
                Map.entry("CA", "SNNPR"),
                Map.entry("SO", "Somali")
        );

        for (String regionCode : regionNames.keySet()) {
            RiskDistribution regionRiskData = regionalRisk.getOrDefault(regionCode, new RiskDistribution(0, 0, 0, 0));
            TaxpayerStats regionTaxpayerData = regionalTaxpayers.getOrDefault(regionCode, new TaxpayerStats(0, 0, 0));

            Long totalTaxpayers = regionTaxpayerData.total();
            Long totalRisky = regionRiskData.critical() + regionRiskData.high() + regionRiskData.medium() + regionRiskData.low();
            BigDecimal percentRisky = totalTaxpayers > 0
                    ? new BigDecimal(totalRisky)
                            .divide(new BigDecimal(totalTaxpayers), 4, RoundingMode.HALF_UP)
                            .multiply(new BigDecimal(100))
                    : BigDecimal.ZERO;

            // Audit type distribution for this region
            List<AuditTypeDistribution> byAuditType = new ArrayList<>();
            for (String auditTypeId : AUDIT_TYPE_IDS) {
                Double auditTypePercent = auditTypeDistribution.getOrDefault(auditTypeId, 0.0);
                Long count = totalRisky > 0
                        ? Math.round(totalRisky * (auditTypePercent / 100.0))
                        : 0L;
                BigDecimal percentage = new BigDecimal(auditTypePercent).setScale(1, RoundingMode.HALF_UP);

                byAuditType.add(new AuditTypeDistribution(
                        auditTypeId,
                        AUDIT_TYPE_NAMES.get(auditTypeId),
                        count,
                        percentage
                ));
            }

            result.add(new RegionalRiskData(
                    regionCode,
                    regionNames.get(regionCode),
                    regionCode,
                    totalTaxpayers,
                    totalRisky,
                    percentRisky,
                    byAuditType
            ));
        }

        return result;
    }

    /**
     * Compute plan defaults by scaling risk data to target case count
     * 
     * Algorithm:
     * - Calculate total risky taxpayers (national)
     * - Scale to ~1400 cases: PLAN_SCALE = 1400 / totalRisky
     * - For each region × audit type: count × PLAN_SCALE
     */
    private Map<String, Map<String, Integer>> computePlanDefaults(
            NationalRiskData national,
            List<RegionalRiskData> regionalDataList,
            Map<String, Double> auditTypeDistribution) {

        long totalRisky = national.getTotalRisky();
        if (totalRisky == 0) {
            // Return empty defaults if no risky taxpayers
            return new HashMap<>();
        }

        // Target plan size: ~1400 cases
        final long PLAN_TARGET_CASES = 1400;
        double planScale = (double) PLAN_TARGET_CASES / totalRisky;

        Map<String, Map<String, Integer>> planDefaults = new HashMap<>();

        for (RegionalRiskData region : regionalDataList) {
            Map<String, Integer> regionDefaults = new HashMap<>();

            for (AuditTypeDistribution auditType : region.getByAuditType()) {
                long auditTypeCount = auditType.getCount();
                int scaledCount = Math.max(0, Math.round((float) (auditTypeCount * planScale)));
                regionDefaults.put(auditType.getAuditTypeId(), scaledCount);
            }

            planDefaults.put(region.getId(), regionDefaults);
        }

        return planDefaults;
    }

    /**
     * Fallback: Return estimated data if live APIs fail
     */
    private RiskAnalysis getRiskAnalysisEstimated() {
        // Use mock data from adapters as fallback
        RiskDistribution nationalRisk = riskEnginePort.getNationalRiskDistribution();
        TaxpayerStats nationalTaxpayers = taxpayerRegistrationPort.getNationalTaxpayerStats();
        Map<String, RiskDistribution> regionalRisk = riskEnginePort.getRiskDistributionByRegion();
        Map<String, TaxpayerStats> regionalTaxpayers = taxpayerRegistrationPort.getTaxpayersByRegion();
        Map<String, Double> auditTypeDistribution = riskEnginePort.getRecommendedAuditTypeDistribution();

        NationalRiskData nationalData = buildNationalRiskData(
                nationalTaxpayers,
                nationalRisk,
                auditTypeDistribution
        );

        List<RegionalRiskData> regionalDataList = buildRegionalRiskData(
                regionalRisk,
                regionalTaxpayers,
                auditTypeDistribution
        );

        Map<String, Map<String, Integer>> planDefaults = computePlanDefaults(
                nationalData,
                regionalDataList,
                auditTypeDistribution
        );

        return new RiskAnalysis(
                UUID.randomUUID().toString(),
                OffsetDateTime.now(),
                "estimated",
                nationalData,
                regionalDataList,
                planDefaults
        );
    }
}
