package mor.itas.api.controller.backoffice.ap;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import mor.itas.persistence.jpa.entity.ap.*;
import mor.itas.persistence.jpa.repository.ap.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * RevenueAggregationController
 *
 * Aggregates estimated revenue data at three levels:
 * - National: total revenue across all plans, regions, and audit types
 * - Regional: per-region revenue breakdown by audit type
 * - Tax Center: per-TC revenue breakdown by audit type
 */
@RestController
@RequestMapping("/api/v1/backoffice/ap/revenue")
@RequiredArgsConstructor
public class RevenueAggregationController {

    private final AnnualAuditPlanJpaRepository planRepository;
    private final RegionalDeploymentRepository deploymentRepository;
    private final PlanAllocationRepository allocationRepository;
    private final ApAuditCaseRepository auditCaseRepository;

    /**
     * National-level revenue aggregation
     * GET /api/v1/backoffice/ap/revenue/national
     * GET /api/v1/backoffice/ap/revenue/national?planId=xxx
     */
    @GetMapping("/national")
    public ResponseEntity<Map<String, Object>> getNationalRevenue(
            @RequestParam(required = false) String planId,
            @RequestParam(required = false) Integer planYear) {

        Map<String, Object> result = new LinkedHashMap<>();

        // Get cases for the specified plan or all finalized plans
        List<ApAuditCaseEntity> cases;
        if (planId != null && !planId.isEmpty()) {
            UUID pid = UUID.fromString(planId);
            cases = auditCaseRepository.findByPlanId(pid);
        } else if (planYear != null) {
            cases = auditCaseRepository.findByPlanYear(planYear);
        } else {
            // Get all finalized plans
            List<AnnualAuditPlanEntity> plans = planRepository.findByStatus(PlanStatusEnum.FINALIZED);
            List<UUID> planIds = plans.stream().map(AnnualAuditPlanEntity::getId).collect(Collectors.toList());
            if (planIds.isEmpty()) {
                cases = new ArrayList<>();
            } else {
                cases = auditCaseRepository.findByPlanIdIn(planIds);
            }
        }

        // Aggregate by audit type
        Map<String, Long> revenueByAuditType = new LinkedHashMap<>();
        Map<String, Integer> countByAuditType = new LinkedHashMap<>();
        long totalRevenue = 0;
        int totalCases = 0;

        for (ApAuditCaseEntity c : cases) {
            String type = c.getAuditType() != null ? c.getAuditType() : "UNKNOWN";
            long rev = c.getEstimatedRevenue() != null ? c.getEstimatedRevenue() : 0L;
            revenueByAuditType.merge(type, rev, Long::sum);
            countByAuditType.merge(type, 1, Integer::sum);
            totalRevenue += rev;
            totalCases++;
        }

        // Build response with both revenue and case counts per audit type
        List<Map<String, Object>> auditTypeBreakdown = new ArrayList<>();
        for (String type : revenueByAuditType.keySet()) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("auditType", type);
            item.put("estimatedRevenue", revenueByAuditType.get(type));
            item.put("caseCount", countByAuditType.get(type));
            item.put("averageRevenuePerCase", countByAuditType.get(type) > 0
                ? revenueByAuditType.get(type) / countByAuditType.get(type) : 0);
            auditTypeBreakdown.add(item);
        }

        result.put("level", "NATIONAL");
        result.put("totalRevenue", totalRevenue);
        result.put("totalCases", totalCases);
        result.put("auditTypeBreakdown", auditTypeBreakdown);
        result.put("currency", "ETB");

        return ResponseEntity.ok(result);
    }

    /**
     * Regional-level revenue aggregation
     * GET /api/v1/backoffice/ap/revenue/regional
     * GET /api/v1/backoffice/ap/revenue/regional?regionCode=AA
     * GET /api/v1/backoffice/ap/revenue/regional?planId=xxx
     */
    @GetMapping("/regional")
    public ResponseEntity<Map<String, Object>> getRegionalRevenue(
            @RequestParam(required = false) String regionCode,
            @RequestParam(required = false) String planId) {

        Map<String, Object> result = new LinkedHashMap<>();

        // Get regional deployments
        List<RegionalDeploymentEntity> deployments;
        if (planId != null && !planId.isEmpty()) {
            UUID pid = UUID.fromString(planId);
            if (regionCode != null && !regionCode.isEmpty()) {
                var dep = deploymentRepository.findByPlanIdAndRegionCode(pid, regionCode);
                deployments = dep.map(List::of).orElse(new ArrayList<>());
            } else {
                deployments = deploymentRepository.findByPlanId(pid);
            }
        } else {
            if (regionCode != null && !regionCode.isEmpty()) {
                deployments = deploymentRepository.findByRegionCode(regionCode);
            } else {
                deployments = deploymentRepository.findAll();
            }
        }

        // If no deployment-level revenue, aggregate from cases
        if (deployments.isEmpty() || deployments.stream().allMatch(d -> d.getEstimatedRevenue() == null || d.getEstimatedRevenue() == 0)) {
            // Fall back to case-level aggregation grouped by region
            List<ApAuditCaseEntity> cases;
            if (planId != null && !planId.isEmpty()) {
                cases = auditCaseRepository.findByPlanId(UUID.fromString(planId));
            } else {
                cases = auditCaseRepository.findAll();
            }

            Map<String, Map<String, Long>> regionRevByType = new LinkedHashMap<>();
            Map<String, Integer> regionCaseCount = new LinkedHashMap<>();

            for (ApAuditCaseEntity c : cases) {
                String rc = c.getRegionCode() != null ? c.getRegionCode() : "UNKNOWN";
                String type = c.getAuditType() != null ? c.getAuditType() : "UNKNOWN";
                long rev = c.getEstimatedRevenue() != null ? c.getEstimatedRevenue() : 0L;

                regionRevByType.computeIfAbsent(rc, k -> new LinkedHashMap<>()).merge(type, rev, Long::sum);
                regionCaseCount.merge(rc, 1, Integer::sum);
            }

            // Build response
            List<Map<String, Object>> regionBreakdown = new ArrayList<>();
            for (Map.Entry<String, Map<String, Long>> entry : regionRevByType.entrySet()) {
                Map<String, Object> regionData = new LinkedHashMap<>();
                regionData.put("regionCode", entry.getKey());
                regionData.put("totalRevenue", entry.getValue().values().stream().mapToLong(Long::longValue).sum());
                regionData.put("totalCases", regionCaseCount.getOrDefault(entry.getKey(), 0));
                regionData.put("revenueByAuditType", entry.getValue());
                regionBreakdown.add(regionData);
            }

            long grandTotal = regionRevByType.values().stream()
                .flatMap(m -> m.values().stream())
                .mapToLong(Long::longValue).sum();

            result.put("level", "REGIONAL");
            result.put("totalRevenue", grandTotal);
            result.put("totalCases", cases.size());
            result.put("regionBreakdown", regionBreakdown);
            result.put("currency", "ETB");
        } else {
            // Use deployment-level data
            Map<String, Map<String, Long>> regionRevByType = new LinkedHashMap<>();
            long grandTotal = 0;

            for (RegionalDeploymentEntity dep : deployments) {
                String rc = dep.getRegionCode();
                Map<String, Long> revByType = dep.getRevenueByAuditType();
                long rev = dep.getEstimatedRevenue() != null ? dep.getEstimatedRevenue() : 0L;

                if (revByType != null) {
                    regionRevByType.put(rc, revByType);
                } else {
                    regionRevByType.put(rc, Map.of("TOTAL", rev));
                }
                grandTotal += rev;
            }

            result.put("level", "REGIONAL");
            result.put("totalRevenue", grandTotal);
            result.put("regionBreakdown", regionRevByType);
            result.put("currency", "ETB");
        }

        return ResponseEntity.ok(result);
    }

    /**
     * Tax Center-level revenue aggregation
     * GET /api/v1/backoffice/ap/revenue/taxcenter
     * GET /api/v1/backoffice/ap/revenue/taxcenter?taxCenterCode=AA-TC1
     * GET /api/v1/backoffice/ap/revenue/taxcenter?planId=xxx
     */
    @GetMapping("/taxcenter")
    public ResponseEntity<Map<String, Object>> getTaxCenterRevenue(
            @RequestParam(required = false) String taxCenterCode,
            @RequestParam(required = false) String planId) {

        Map<String, Object> result = new LinkedHashMap<>();

        // Get allocations
        List<PlanAllocationEntity> allocations;
        if (planId != null && !planId.isEmpty()) {
            UUID pid = UUID.fromString(planId);
            if (taxCenterCode != null && !taxCenterCode.isEmpty()) {
                allocations = allocationRepository.findByAnnualPlanIdAndTaxCenterCode(pid, taxCenterCode);
            } else {
                allocations = allocationRepository.findByAnnualPlanId(pid);
            }
        } else {
            allocations = allocationRepository.findAll();
        }

        // Try allocation-level revenue first
        boolean hasAllocationRevenue = allocations.stream()
            .anyMatch(a -> a.getEstimatedRevenue() != null && a.getEstimatedRevenue().compareTo(java.math.BigDecimal.ZERO) > 0);

        if (!hasAllocationRevenue) {
            // Fall back to case-level aggregation
            List<ApAuditCaseEntity> cases;
            if (planId != null && !planId.isEmpty()) {
                cases = auditCaseRepository.findByPlanId(UUID.fromString(planId));
            } else {
                cases = auditCaseRepository.findAll();
            }

            Map<String, Map<String, Long>> tcRevByType = new LinkedHashMap<>();
            Map<String, Integer> tcCaseCount = new LinkedHashMap<>();

            for (ApAuditCaseEntity c : cases) {
                String tc = c.getTaxCenterCode() != null ? c.getTaxCenterCode() : "UNKNOWN";
                String type = c.getAuditType() != null ? c.getAuditType() : "UNKNOWN";
                long rev = c.getEstimatedRevenue() != null ? c.getEstimatedRevenue() : 0L;

                tcRevByType.computeIfAbsent(tc, k -> new LinkedHashMap<>()).merge(type, rev, Long::sum);
                tcCaseCount.merge(tc, 1, Integer::sum);
            }

            List<Map<String, Object>> tcBreakdown = new ArrayList<>();
            for (Map.Entry<String, Map<String, Long>> entry : tcRevByType.entrySet()) {
                Map<String, Object> tcData = new LinkedHashMap<>();
                tcData.put("taxCenterCode", entry.getKey());
                tcData.put("totalRevenue", entry.getValue().values().stream().mapToLong(Long::longValue).sum());
                tcData.put("totalCases", tcCaseCount.getOrDefault(entry.getKey(), 0));
                tcData.put("revenueByAuditType", entry.getValue());
                tcBreakdown.add(tcData);
            }

            long grandTotal = tcRevByType.values().stream()
                .flatMap(m -> m.values().stream())
                .mapToLong(Long::longValue).sum();

            result.put("level", "TAX_CENTER");
            result.put("totalRevenue", grandTotal);
            result.put("totalCases", cases.size());
            result.put("taxCenterBreakdown", tcBreakdown);
            result.put("currency", "ETB");
        } else {
            Map<String, Map<String, Object>> tcBreakdown = new LinkedHashMap<>();
            long grandTotal = 0;

            for (PlanAllocationEntity alloc : allocations) {
                String tc = alloc.getTaxCenterCode();
                long rev = alloc.getEstimatedRevenue() != null
                    ? alloc.getEstimatedRevenue().longValue() : 0;

                Map<String, Object> tcData = new LinkedHashMap<>();
                tcData.put("taxCenterCode", tc);
                tcData.put("estimatedRevenue", rev);

                if (alloc.getRevenueByAuditType() != null) {
                    tcData.put("revenueByAuditType", alloc.getRevenueByAuditType());
                }

                tcBreakdown.put(tc, tcData);
                grandTotal += rev;
            }

            result.put("level", "TAX_CENTER");
            result.put("totalRevenue", grandTotal);
            result.put("taxCenterBreakdown", new ArrayList<>(tcBreakdown.values()));
            result.put("currency", "ETB");
        }

        return ResponseEntity.ok(result);
    }
}
