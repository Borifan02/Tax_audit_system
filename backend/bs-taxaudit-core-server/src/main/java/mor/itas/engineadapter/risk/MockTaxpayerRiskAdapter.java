package mor.itas.engineadapter.risk;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Mock Taxpayer Risk Adapter - Provides comprehensive risk assessment data
 * 
 * Contains risk profiles for 10,000+ taxpayers with:
 * - 5 independent risk scores (0-100 scale):
 *   1. Compliance Risk: Based on filing/payment history
 *   2. Reporting Risk: Based on financial reporting quality
 *   3. Internationalization Risk: Based on cross-border transactions
 *   4. Sector Risk: Based on industry characteristics
 *   5. Behavioral Risk: Based on pattern deviations
 * - Overall risk level: HIGH/MEDIUM/LOW
 * - Recommended audit types with probabilities
 * - Transfer Pricing (TP) and Joint Audit (JA) risk flags
 * 
 * Phase 1 mock implementation - will be replaced with real Risk Engine API in Phase 2+
 */
@Component
@Profile("mock")
public class MockTaxpayerRiskAdapter {

    private static final Map<String, Map<String, Object>> RISK_PROFILES = new HashMap<>();
    private static final Random RANDOM = new Random(12345); // Seeded for consistency

    static {
        initializeRiskProfiles();
    }

    private static void initializeRiskProfiles() {
        // Generate risk profiles for same taxpayers as MockTaxpayerAdapter
        // 10,000+ taxpayers distributed across tax centers
        
        int taxpayerId = 1;
        
        // Tax center quotas (must match MockTaxpayerAdapter)
        Map<String, Integer> taxCenterQuotas = new LinkedHashMap<>();
        taxCenterQuotas.put("TC-AA-01", 750);
        taxCenterQuotas.put("TC-AA-02", 650);
        taxCenterQuotas.put("TC-AA-03", 580);
        taxCenterQuotas.put("TC-AA-04", 520);
        taxCenterQuotas.put("TC-AB-01", 380);
        taxCenterQuotas.put("TC-AB-02", 320);
        taxCenterQuotas.put("TC-AB-03", 300);
        taxCenterQuotas.put("TC-BA-01", 620);
        taxCenterQuotas.put("TC-BA-02", 540);
        taxCenterQuotas.put("TC-BA-03", 480);
        taxCenterQuotas.put("TC-BB-01", 650);
        taxCenterQuotas.put("TC-BB-02", 580);
        taxCenterQuotas.put("TC-BB-03", 520);
        taxCenterQuotas.put("TC-CA-01", 420);
        taxCenterQuotas.put("TC-CA-02", 380);
        taxCenterQuotas.put("TC-SO-01", 280);
        
        for (int quota : taxCenterQuotas.values()) {
            for (int i = 1; i <= quota; i++) {
                String tin = String.format("ETH%06d", taxpayerId);
                
                Map<String, Object> riskProfile = new HashMap<>();
                riskProfile.put("tin", tin);
                riskProfile.put("taxpayerId", "TP-" + taxpayerId);
                
                // Calculate 5 independent risk scores
                int complianceRisk = calculateComplianceRisk(taxpayerId);
                int reportingRisk = calculateReportingRisk(taxpayerId);
                int internationalizationRisk = calculateInternationalizationRisk(taxpayerId);
                int sectorRisk = calculateSectorRisk(taxpayerId);
                int behavioralRisk = calculateBehavioralRisk(taxpayerId);
                
                riskProfile.put("complianceRisk", complianceRisk);
                riskProfile.put("reportingRisk", reportingRisk);
                riskProfile.put("internationalizationRisk", internationalizationRisk);
                riskProfile.put("sectorRisk", sectorRisk);
                riskProfile.put("behavioralRisk", behavioralRisk);
                
                // Calculate overall risk level
                int overallScore = (complianceRisk + reportingRisk + internationalizationRisk + sectorRisk + behavioralRisk) / 5;
                String overallLevel = determineRiskLevel(overallScore);
                riskProfile.put("overallRiskScore", overallScore);
                riskProfile.put("overallRiskLevel", overallLevel);
                
                // Risk flags for specific audit types
                riskProfile.put("tpRiskFlag", internationalizationRisk > 60 || (taxpayerId % 11) == 0);
                riskProfile.put("jaRiskFlag", (complianceRisk + reportingRisk) / 2 > 65 || (taxpayerId % 13) == 0);
                
                // Recommended audit types based on risk profile
                Map<String, Double> recommendedAuditTypes = getRecommendedAuditTypes(
                    complianceRisk, reportingRisk, internationalizationRisk, sectorRisk, behavioralRisk
                );
                riskProfile.put("recommendedAuditTypes", recommendedAuditTypes);
                
                // Audit priority (based on overall risk and TP/JA flags)
                riskProfile.put("auditPriority", calculateAuditPriority(overallScore, riskProfile));
                
                // Last audit info
                riskProfile.put("lastAuditDate", generateLastAuditDate(taxpayerId));
                riskProfile.put("lastAuditType", generateLastAuditType(taxpayerId));
                
                // Monitoring level
                riskProfile.put("monitoringLevel", getMonitoringLevel(overallScore));
                
                RISK_PROFILES.put(tin, riskProfile);
                taxpayerId++;
            }
        }
    }

    private static int calculateComplianceRisk(int id) {
        // Based on filing and payment history
        int base = (id * 7) % 100;
        
        // Adjust based on patterns
        if ((id % 3) == 0) base = Math.max(0, base - 30); // Generally compliant
        if ((id % 5) == 0) base = Math.min(100, base + 25); // Generally non-compliant
        if ((id % 7) == 0) base = Math.min(100, base + 15); // Some issues
        
        return Math.max(0, Math.min(100, base));
    }

    private static int calculateReportingRisk(int id) {
        // Based on financial reporting quality
        int base = (id * 11) % 100;
        
        if ((id % 4) == 0) base = Math.max(0, base - 25); // Good reporting
        if ((id % 6) == 0) base = Math.min(100, base + 30); // Poor reporting
        if ((id % 9) == 0) base = Math.min(100, base + 20); // Inconsistent reporting
        
        return Math.max(0, Math.min(100, base));
    }

    private static int calculateInternationalizationRisk(int id) {
        // Based on cross-border operations
        int base = (id * 13) % 100;
        
        // Most taxpayers are domestic (low risk)
        if ((id % 7) != 0) base = Math.max(0, base - 60); // No international ops
        else base = Math.min(100, base + 40); // Has international ops
        
        // Transfer pricing risk for large entities with international exposure
        if ((id % 11) == 0) base = Math.min(100, base + 35);
        
        return Math.max(0, Math.min(100, base));
    }

    private static int calculateSectorRisk(int id) {
        // Based on industry characteristics
        int base = (id * 17) % 100;
        
        String[] sectors = {"Manufacturing", "Trade", "Services", "Agriculture", "Technology", "Transportation", "Construction", "Wholesale", "Retail", "Finance"};
        String sector = sectors[id % sectors.length];
        
        // Sector-specific adjustments
        switch (sector) {
            case "Trade":
            case "Wholesale":
                base = Math.min(100, base + 25); // Higher cash handling risk
                break;
            case "Construction":
                base = Math.min(100, base + 20); // Compliance risk
                break;
            case "Agriculture":
                base = Math.max(0, base - 20); // Lower reporting risk
                break;
            case "Finance":
                base = Math.min(100, base + 15); // Regulatory risk
                break;
        }
        
        return Math.max(0, Math.min(100, base));
    }

    private static int calculateBehavioralRisk(int id) {
        // Based on deviation from expected patterns
        int base = (id * 19) % 100;
        
        // Unusual activity patterns
        if ((id % 8) == 0) base = Math.min(100, base + 35); // Unusual patterns
        if ((id % 12) == 0) base = Math.max(0, base - 20); // Consistent patterns
        if ((id % 15) == 0) base = Math.min(100, base + 15); // Gradual deviation
        
        return Math.max(0, Math.min(100, base));
    }

    private static String determineRiskLevel(int score) {
        if (score >= 70) return "HIGH";
        if (score >= 40) return "MEDIUM";
        return "LOW";
    }

    private static Map<String, Double> getRecommendedAuditTypes(
            int complianceRisk, int reportingRisk, int internationalizationRisk, 
            int sectorRisk, int behavioralRisk) {
        
        Map<String, Double> recommendations = new HashMap<>();
        
        // Base audit type probabilities
        recommendations.put("DESK", 35.0); // Always candidate
        recommendations.put("COMPREHENSIVE", 25.0); // Regular tracking
        
        // Compliance-driven recommendations
        if (complianceRisk > 70) {
            recommendations.put("COMPREHENSIVE", 50.0);
            recommendations.put("DESK", 30.0);
        }
        
        // Reporting-driven recommendations
        if (reportingRisk > 65) {
            recommendations.put("COMPREHENSIVE", 55.0);
        }
        
        // Internationalization-driven recommendations
        if (internationalizationRisk > 60) {
            recommendations.put("TRANSFER_PRICING", 60.0);
            recommendations.put("JOINT_AUDIT", 40.0);
        }
        
        // Behavioral-driven recommendations
        if (behavioralRisk > 70) {
            recommendations.put("COMPREHENSIVE", 60.0);
            recommendations.put("QUALITY_ASSURANCE", 30.0);
        }
        
        // Sector-driven recommendations
        if (sectorRisk > 70) {
            recommendations.put("COMPREHENSIVE", 45.0);
        }
        
        // Normalize so sum ~= 100
        normalizeRecommendations(recommendations);
        
        return recommendations;
    }

    private static void normalizeRecommendations(Map<String, Double> recommendations) {
        double total = recommendations.values().stream().mapToDouble(Double::doubleValue).sum();
        if (total > 0) {
            for (String key : recommendations.keySet()) {
                recommendations.put(key, (recommendations.get(key) / total) * 100);
            }
        }
    }

    private static String calculateAuditPriority(int overallScore, Map<String, Object> riskProfile) {
        if (overallScore >= 80) return "CRITICAL";
        if (overallScore >= 65) return "HIGH";
        if (overallScore >= 40) return "MEDIUM";
        return "LOW";
    }

    private static String generateLastAuditDate(int id) {
        // Generate realistic last audit dates (spread over last 3 years)
        int yearsAgo = (id % 3);
        int month = 1 + (id % 12);
        int day = 1 + (id % 28);
        int year = 2025 - yearsAgo;
        return String.format("%04d-%02d-%02d", year, month, day);
    }

    private static String generateLastAuditType(int id) {
        String[] types = {"DESK", "COMPREHENSIVE", "TRANSFER_PRICING", "JOINT_AUDIT", null};
        return types[id % types.length];
    }

    private static String getMonitoringLevel(int overallScore) {
        if (overallScore >= 75) return "INTENSIVE";
        if (overallScore >= 50) return "REGULAR";
        if (overallScore >= 25) return "PERIODIC";
        return "MINIMAL";
    }

    // Public APIs for frontend consumption

    public Map<String, Object> getRiskProfile(String tin) {
        return RISK_PROFILES.getOrDefault(tin, new HashMap<>());
    }

    public Map<String, Object> assessRisk(String tin) {
        Map<String, Object> profile = RISK_PROFILES.get(tin);
        if (profile == null) {
            return new HashMap<>();
        }
        
        // Build comprehensive assessment
        Map<String, Object> assessment = new HashMap<>();
        assessment.put("tin", tin);
        assessment.put("assessmentDate", java.time.LocalDate.now().toString());
        assessment.put("riskScores", new HashMap<String, Object>() {{
            put("compliance", profile.get("complianceRisk"));
            put("reporting", profile.get("reportingRisk"));
            put("internationalization", profile.get("internationalizationRisk"));
            put("sector", profile.get("sectorRisk"));
            put("behavioral", profile.get("behavioralRisk"));
        }});
        assessment.put("overallScore", profile.get("overallRiskScore"));
        assessment.put("overallLevel", profile.get("overallRiskLevel"));
        assessment.put("priority", profile.get("auditPriority"));
        assessment.put("flags", new HashMap<String, Object>() {{
            put("transferPricingRisk", profile.get("tpRiskFlag"));
            put("jointAuditRisk", profile.get("jaRiskFlag"));
        }});
        
        return assessment;
    }

    public Map<String, Object> recommendAuditTypes(String tin) {
        Map<String, Object> profile = RISK_PROFILES.get(tin);
        if (profile == null) {
            return new HashMap<>();
        }
        
        Map<String, Object> recommendation = new HashMap<>();
        recommendation.put("tin", tin);
        recommendation.put("recommendedTypes", profile.get("recommendedAuditTypes"));
        recommendation.put("priority", profile.get("auditPriority"));
        recommendation.put("lastAudit", new HashMap<String, Object>() {{
            put("date", profile.get("lastAuditDate"));
            put("type", profile.get("lastAuditType"));
        }});
        recommendation.put("monitoringLevel", profile.get("monitoringLevel"));
        
        return recommendation;
    }

    public List<Map<String, Object>> getRiskProfilesByLevel(String level) {
        return RISK_PROFILES.values().stream()
            .filter(profile -> level.equals(profile.get("overallRiskLevel")))
            .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getRiskProfilesByPriority(String priority) {
        return RISK_PROFILES.values().stream()
            .filter(profile -> priority.equals(profile.get("auditPriority")))
            .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getTaxpayersWithTPRisk() {
        return RISK_PROFILES.values().stream()
            .filter(profile -> (Boolean) profile.getOrDefault("tpRiskFlag", false))
            .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getTaxpayersWithJARisk() {
        return RISK_PROFILES.values().stream()
            .filter(profile -> (Boolean) profile.getOrDefault("jaRiskFlag", false))
            .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getTaxpayersRequiringAuditType(String auditType) {
        return RISK_PROFILES.values().stream()
            .filter(profile -> {
                @SuppressWarnings("unchecked")
                Map<String, Double> recommendations = (Map<String, Double>) profile.get("recommendedAuditTypes");
                return recommendations != null && recommendations.containsKey(auditType) && recommendations.get(auditType) > 0;
            })
            .collect(Collectors.toList());
    }

    public Map<String, Object> getRiskStatistics() {
        Map<String, Object> stats = new HashMap<>();
        
        stats.put("totalAssessed", RISK_PROFILES.size());
        stats.put("byRiskLevel", RISK_PROFILES.values().stream()
            .collect(Collectors.groupingBy(p -> p.get("overallRiskLevel"), Collectors.counting())));
        stats.put("byPriority", RISK_PROFILES.values().stream()
            .collect(Collectors.groupingBy(p -> p.get("auditPriority"), Collectors.counting())));
        stats.put("byMonitoringLevel", RISK_PROFILES.values().stream()
            .collect(Collectors.groupingBy(p -> p.get("monitoringLevel"), Collectors.counting())));
        
        stats.put("withTPRisk", RISK_PROFILES.values().stream()
            .filter(p -> (Boolean) p.getOrDefault("tpRiskFlag", false))
            .count());
        stats.put("withJARisk", RISK_PROFILES.values().stream()
            .filter(p -> (Boolean) p.getOrDefault("jaRiskFlag", false))
            .count());
        
        // Average scores
        double avgCompliance = RISK_PROFILES.values().stream()
            .mapToInt(p -> (Integer) p.get("complianceRisk")).average().orElse(0);
        double avgReporting = RISK_PROFILES.values().stream()
            .mapToInt(p -> (Integer) p.get("reportingRisk")).average().orElse(0);
        double avgIntl = RISK_PROFILES.values().stream()
            .mapToInt(p -> (Integer) p.get("internationalizationRisk")).average().orElse(0);
        double avgSector = RISK_PROFILES.values().stream()
            .mapToInt(p -> (Integer) p.get("sectorRisk")).average().orElse(0);
        double avgBehavioral = RISK_PROFILES.values().stream()
            .mapToInt(p -> (Integer) p.get("behavioralRisk")).average().orElse(0);
        
        Map<String, Double> averageScores = new HashMap<>();
        averageScores.put("compliance", avgCompliance);
        averageScores.put("reporting", avgReporting);
        averageScores.put("internationalization", avgIntl);
        averageScores.put("sector", avgSector);
        averageScores.put("behavioral", avgBehavioral);
        stats.put("averageScores", averageScores);
        
        return stats;
    }

    public void updateRiskProfile(String tin, String reason, String actorId, String date) {
        Map<String, Object> profile = RISK_PROFILES.get(tin);
        if (profile != null) {
            profile.put("overallRiskLevel", "HIGH");
            profile.put("auditPriority", "CRITICAL");
            profile.put("lastRiskUpdateReason", reason);
            profile.put("lastRiskUpdateActor", actorId);
            profile.put("lastRiskUpdateDate", date);
        }
    }
}
