package mor.itas.application.usecase.ap;

import mor.itas.persistence.jpa.entity.ap.AnnualAuditPlanEntity;
import mor.itas.persistence.jpa.entity.ap.RegionalDeploymentEntity;
import mor.itas.persistence.jpa.repository.ap.AnnualAuditPlanJpaRepository;
import mor.itas.persistence.jpa.repository.ap.RegionalDeploymentRepository;
import mor.itas.persistence.jpa.repository.ap.RegionalPlanAccessRepository;
import mor.itas.persistence.jpa.repository.ap.RegionalFeedbackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * GetPlansForRegionUseCase - Regional Director fetches their accessible plans
 * 
 * STEP 3: Regions fetch plans sent to them by director
 * - Only returns plans that have been sent to this specific region
 * - Checks regional access permissions
 * - Returns only the regional allocation data relevant to this region
 * - Includes deployment metadata (when sent, by whom)
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GetPlansForRegionUseCase {

    private final AnnualAuditPlanJpaRepository planRepository;
    private final RegionalDeploymentRepository deploymentRepository;
    private final RegionalPlanAccessRepository accessRepository;
    private final RegionalFeedbackRepository feedbackRepository;

    /**
     * Get all plans accessible to a region with deployment details
     * 
     * @param regionCode Region code (e.g., "AA" for Addis Ababa)
     * @return List of plans with their regional allocation data
     */
    private static final Map<String, String> REGION_CODE_TO_DIST_KEY = Map.of(
        "FED", "federal_level",
        "AA", "addis_ababa",
        "BA", "amhara",
        "BB", "oromia",
        "AB", "dire_dawa",
        "CA", "snnpr",
        "SO", "somali"
    );

    public List<Map<String, Object>> execute(String regionCode) {
        // 1. Get all deployments for this region (permission check)
        List<RegionalDeploymentEntity> deployments = new ArrayList<>(deploymentRepository.findByRegionCode(regionCode));

        // 1b. Auto-synthesize deployment entities for any existing plans that have distribution for this region
        String distKey = REGION_CODE_TO_DIST_KEY.getOrDefault(regionCode, regionCode.toLowerCase());
        List<AnnualAuditPlanEntity> allPlans = planRepository.findAll();
        for (AnnualAuditPlanEntity plan : allPlans) {
            if (plan.getDistribution() != null) {
                Map<String, Integer> regionAlloc = plan.getDistribution().get(distKey);
                if (regionAlloc == null || regionAlloc.isEmpty()) {
                    regionAlloc = plan.getDistribution().get(regionCode);
                }
                if (regionAlloc != null && !regionAlloc.isEmpty()) {
                    boolean alreadyDeployed = deployments.stream()
                        .anyMatch(d -> d.getPlanId().equals(plan.getId()));
                    if (!alreadyDeployed) {
                        RegionalDeploymentEntity autoDeployment = new RegionalDeploymentEntity(plan.getId(), regionCode, "system-auto");
                        autoDeployment.setRegionAllocatedCases(regionAlloc);
                        autoDeployment.setDeploymentNote("Auto-synthesized regional access");
                        RegionalDeploymentEntity saved = deploymentRepository.save(autoDeployment);
                        deployments.add(saved);
                    }
                }
            }
        }

        if (deployments.isEmpty()) {
            return new ArrayList<>();
        }

        // 2. Build plan list with deployment details
        List<Map<String, Object>> results = new ArrayList<>();
        
        for (RegionalDeploymentEntity deployment : deployments) {
            try {
                // Fetch the plan
                AnnualAuditPlanEntity plan = planRepository.findById(deployment.getPlanId())
                    .orElse(null);
                    
                if (plan == null) {
                    continue;
                }

                // Build plan data for this region using a HashMap for better null handling
                Map<String, Object> planData = new java.util.HashMap<>();
                planData.put("planId", plan.getId().toString());
                planData.put("planName", plan.getName());
                planData.put("planYear", plan.getYear());
                planData.put("status", plan.getStatus() != null ? plan.getStatus().toString() : null);
                planData.put("createdBy", plan.getCreatedBy());
                planData.put("createdAt", plan.getCreatedAt());
                planData.put("directorApprovedBy", plan.getDirectorApprovedBy());
                planData.put("directorApprovedAt", plan.getDirectorApprovedAt());
                
                // Regional deployment metadata
                planData.put("deploymentId", deployment.getId().toString());
                planData.put("sentBy", deployment.getDirectorId());
                planData.put("sentAt", deployment.getSentAt());
                planData.put("deploymentNote", deployment.getDeploymentNote());
                
                // Regional allocation data (what this region gets)
                planData.put("regionAllocatedCases", deployment.getRegionAllocatedCases());
                
                // Region acknowledgment status
                planData.put("acknowledged", deployment.getAcknowledgedAt() != null);
                planData.put("acknowledgedAt", deployment.getAcknowledgedAt());
                planData.put("acknowledgedBy", deployment.getAcknowledgedBy());

                // Check if region already submitted feedback to director
                boolean regionalFeedbackSubmitted = feedbackRepository.findByPlanIdAndRegionId(plan.getId(), regionCode).isPresent();
                planData.put("regionalFeedbackSubmitted", regionalFeedbackSubmitted);

                // Check if this region has distributed allocations to tax centers
                boolean hasTcDistributions = plan.getAllocations().stream()
                    .anyMatch(a -> a.getRegionCode() != null && a.getRegionCode().equals(regionCode) && a.getTaxCenterCode() != null);
                
                if (hasTcDistributions) {
                    Map<String, Boolean> tcDistMap = new java.util.HashMap<>();
                    tcDistMap.put(regionCode, true);
                    planData.put("tcDistributions", tcDistMap);

                    // Collect tax center feedback if available
                    Map<String, Map<String, Object>> tcFeedbackRegion = new java.util.HashMap<>();
                    plan.getAllocations().stream()
                        .filter(a -> a.getRegionCode() != null && a.getRegionCode().equals(regionCode) && a.getTaxCenterCode() != null && a.getTcFeedbackSubmitted())
                        .forEach(a -> {
                            Map<String, Object> fbData = new java.util.HashMap<>();
                            fbData.put("feedback", a.getTcJustification());
                            if (a.getTcAdjustedAllocations() != null) {
                                fbData.put("adjustedAllocation", a.getTcAdjustedAllocations());
                            }
                            if (a.getAllocationByAuditType() != null) {
                                fbData.put("originalAllocation", a.getAllocationByAuditType());
                            }
                            tcFeedbackRegion.put(a.getTaxCenterCode(), fbData);
                        });
                    
                    Map<String, Map<String, Map<String, Object>>> taxCenterFeedback = new java.util.HashMap<>();
                    taxCenterFeedback.put(regionCode, tcFeedbackRegion);
                    planData.put("taxCenterFeedback", taxCenterFeedback);
                }

                results.add(planData);
            } catch (Exception e) {
                // Log but continue processing other plans
                System.err.println("Error processing deployment " + deployment.getId() + ": " + e.getMessage());
                e.printStackTrace();
            }
        }

        return results;
    }

    /**
     * Check if a region has access to a specific plan
     */
    public boolean hasAccess(String regionCode, UUID planId) {
        return accessRepository.hasActiveAccess(planId, regionCode);
    }

    /**
     * Get detailed deployment info for a specific plan in this region
     */
    public RegionalDeploymentEntity getDeploymentDetails(String regionCode, UUID planId) {
        return deploymentRepository.findByPlanIdAndRegionCode(planId, regionCode)
            .orElseThrow(() -> new IllegalArgumentException(
                "Region " + regionCode + " does not have access to plan " + planId
            ));
    }
}
