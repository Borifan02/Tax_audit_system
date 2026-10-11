package mor.itas.application.usecase.ap;

import mor.itas.application.port.inboundport.ap.DistributeApprovedPlanPort;
import mor.itas.persistence.jpa.entity.ap.AnnualAuditPlanEntity;
import mor.itas.persistence.jpa.entity.ap.PlanStatusEnum;
import mor.itas.persistence.jpa.entity.ap.PlanAuditLogEntity;
import mor.itas.persistence.jpa.entity.ap.RegionalDeploymentEntity;
import mor.itas.persistence.jpa.repository.ap.AnnualAuditPlanJpaRepository;
import mor.itas.persistence.jpa.repository.ap.PlanAuditLogJpaRepository;
import mor.itas.persistence.jpa.repository.ap.RegionalDeploymentRepository;
import mor.itas.persistence.jpa.repository.ap.RegionalPlanAccessRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DistributeApprovedPlanUseCase implements DistributeApprovedPlanPort {
    
    private final AnnualAuditPlanJpaRepository planRepository;
    private final PlanAuditLogJpaRepository auditLogRepository;
    private final RegionalDeploymentRepository deploymentRepository;
    private final RegionalPlanAccessRepository accessRepository;
    
    private static final String[] REGION_CODES = {"FED", "AA", "BA", "BB", "AB", "CA", "SO"};
    private static final Map<String, String> REGION_CODE_TO_DIST_KEY = Map.ofEntries(
        Map.entry("FED", "federal_level"), Map.entry("AA", "addis_ababa"), Map.entry("BA", "amhara"),
        Map.entry("BB", "oromia"), Map.entry("AB", "dire_dawa"),
        Map.entry("CA", "snnpr"), Map.entry("SO", "somali")
    );
    
    @Override
    @Transactional
    public void distributeToRegions(UUID planId, String directorId) {
        AnnualAuditPlanEntity plan = planRepository.findById(planId)
            .orElseThrow(() -> new IllegalArgumentException("Plan not found: " + planId));
        
        if (plan.getStatus() != PlanStatusEnum.SENIOR_MGMT_APPROVED) {
            throw new IllegalStateException("Cannot distribute plan in status: " + plan.getStatus());
        }
        
        Map<String, Map<String, Integer>> distribution = plan.getDistribution();
        if (distribution == null || distribution.isEmpty()) {
            throw new IllegalStateException("Plan has no distribution data");
        }
        
        // Step 1: Clean existing deployment records (access records cleaned by cascade/delete)
        List<RegionalDeploymentEntity> existingDeployments = deploymentRepository.findByPlanId(planId);
        if (!existingDeployments.isEmpty()) {
            deploymentRepository.deleteAll(existingDeployments);
            deploymentRepository.flush();
        }
        
        // Step 2: Create deployment records for each region
        // NOTE: The DB trigger ap_sync_regional_access_from_deployment() automatically
        // creates access records when a deployment is inserted — do NOT create them manually
        int deploymentCount = 0;
        for (String regionCode : REGION_CODES) {
            String distKey = REGION_CODE_TO_DIST_KEY.getOrDefault(regionCode, regionCode.toLowerCase());
            Map<String, Integer> regionAllocation = distribution.get(regionCode);
            if (regionAllocation == null || regionAllocation.isEmpty()) {
                regionAllocation = distribution.get(distKey);
            }
            
            if (regionAllocation != null && !regionAllocation.isEmpty()) {
                RegionalDeploymentEntity deployment = new RegionalDeploymentEntity(planId, regionCode, directorId);
                deployment.setDeploymentNote("Approved plan distributed to regions");
                deployment.setSentAt(OffsetDateTime.now());
                deployment.setRegionAllocatedCases(regionAllocation);
                deploymentRepository.save(deployment);
                deploymentCount++;
            }
        }
        
        if (deploymentCount == 0) {
            throw new IllegalStateException("No valid regional allocations found in plan distribution");
        }
        
        // Step 3: Update plan status
        plan.setStatus(PlanStatusEnum.APPROVED_TO_REGIONS);
        plan.setSentToRegionsBy(directorId);
        plan.setSentToRegionsAt(OffsetDateTime.now());
        plan.setRegionsReceivedCount(deploymentCount);
        plan.setUpdatedAt(OffsetDateTime.now());
        planRepository.save(plan);
        
        // Step 4: Audit log
        auditLogRepository.save(new PlanAuditLogEntity(
            UUID.randomUUID(), plan,
            "APPROVED_PLAN_DISTRIBUTED_TO_REGIONS",
            directorId, "DIRECTOR",
            "Distributed to " + deploymentCount + " regions"
        ));
    }
    
    public static Map<String, Object> distributeToTaxCenters(UUID planId, String regionId, String regionalDirectorId) {
        Map<String, Object> result = new HashMap<>();
        result.put("planId", planId.toString());
        result.put("regionId", regionId);
        result.put("status", "DISTRIBUTED_TO_TAX_CENTERS");
        return result;
    }
}
