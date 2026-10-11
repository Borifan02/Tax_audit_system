package mor.itas.application.usecase.ap;

import mor.itas.application.port.outboundport.repositoryport.ap.AnnualAuditPlanRepositoryPort;
import mor.itas.application.port.outboundport.repositoryport.ap.PlanAuditLogRepositoryPort;
import mor.itas.domain.model.ap.AnnualAuditPlan;
import mor.itas.domain.model.ap.PlanAllocation;
import mor.itas.domain.model.ap.PlanAuditLog;
import mor.itas.domain.model.ap.PlanStatus;
import mor.itas.persistence.jpa.repository.ap.PlanAllocationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * PlanManagementUseCase - Handles all plan operations for the 4-level approval workflow
 * Regional-level allocations: Planning Team creates regional, Regional Director divides into tax centers
 */
@Service
public class PlanManagementUseCase {

    @Autowired
    private AnnualAuditPlanRepositoryPort planRepository;

    @Autowired
    private PlanAuditLogRepositoryPort auditLogRepository;

    @Autowired
    private PlanAllocationRepository allocationRepository;

    /**
     * LEVEL 1: Planning Team creates plan with regional allocations
     */
    @Transactional
    public AnnualAuditPlan createPlanWithRegionalAllocations(
        Integer planYear,
        String planName,
        List<RegionalAllocationDto> regionalAllocations,
        Map<String, Map<String, Integer>> distribution,
        java.math.BigDecimal estimatedRevenue,
        String actorId) {

        // Validate that plan doesn't already exist for this year (year is unique)
        if (planRepository.existsByYear(planYear)) {
            throw new IllegalArgumentException(
                String.format("A plan already exists for fiscal year %d. Each year can have only one audit plan.", planYear)
            );
        }

        // Create plan
        AnnualAuditPlan plan = new AnnualAuditPlan(
            UUID.randomUUID(),
            planYear,
            planName,
            actorId
        );
        
        // Store distribution data
        plan.setDistribution(distribution);

        // Compute Revenue Distribution
        if (estimatedRevenue != null) {
            plan.setEstimatedRevenue(estimatedRevenue);
            
            Map<String, Object> distJson = new java.util.HashMap<>();
            Map<String, java.math.BigDecimal> regionRevenues = new java.util.HashMap<>();
            Map<String, java.math.BigDecimal> typeRevenues = new java.util.HashMap<>();

            // 1. Calculate case totals dynamically from distribution map
            Map<String, Integer> regionCaseTotals = new java.util.HashMap<>();
            Map<String, Integer> typeCaseTotals = new java.util.HashMap<>();
            int totalDistCases = 0;

            if (distribution != null) {
                for (Map.Entry<String, Map<String, Integer>> regEntry : distribution.entrySet()) {
                    String regKey = regEntry.getKey();
                    Map<String, Integer> typeMap = regEntry.getValue();
                    if (typeMap != null) {
                        int regSum = 0;
                        for (Map.Entry<String, Integer> tEntry : typeMap.entrySet()) {
                            String tKey = tEntry.getKey();
                            Integer count = tEntry.getValue();
                            if (count != null && count > 0) {
                                regSum += count;
                                typeCaseTotals.put(tKey, typeCaseTotals.getOrDefault(tKey, 0) + count);
                            }
                        }
                        regionCaseTotals.put(regKey, regSum);
                        totalDistCases += regSum;
                    }
                }
            }

            // Sum of proposed counts across regional allocations as fallback/reference
            int totalProposedCount = regionalAllocations.stream().mapToInt(RegionalAllocationDto::getProposedCount).sum();
            if (totalProposedCount == 0) totalProposedCount = 1;

            // 2. Compute dynamic regional revenue
            for (RegionalAllocationDto regional : regionalAllocations) {
                String code = regional.getRegionCode();
                java.math.BigDecimal regRev;
                if (totalDistCases > 0) {
                    int regCases = regionCaseTotals.getOrDefault(code, regional.getProposedCount());
                    double share = (double) regCases / totalDistCases;
                    regRev = estimatedRevenue.multiply(java.math.BigDecimal.valueOf(share)).setScale(2, java.math.RoundingMode.HALF_UP);
                } else {
                    double share = (double) regional.getProposedCount() / totalProposedCount;
                    regRev = estimatedRevenue.multiply(java.math.BigDecimal.valueOf(share)).setScale(2, java.math.RoundingMode.HALF_UP);
                }
                regionRevenues.put(code, regRev);
            }
            distJson.put("by_region", regionRevenues);

            // 3. Compute national audit type revenues dynamically
            if (totalDistCases > 0) {
                for (Map.Entry<String, Integer> entry : typeCaseTotals.entrySet()) {
                    double typeShare = (double) entry.getValue() / totalDistCases;
                    java.math.BigDecimal tRev = estimatedRevenue.multiply(java.math.BigDecimal.valueOf(typeShare)).setScale(2, java.math.RoundingMode.HALF_UP);
                    typeRevenues.put(entry.getKey(), tRev);
                }
            }
            distJson.put("by_audit_type_national", typeRevenues);

            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                plan.setEstimatedRevenueDistribution(mapper.valueToTree(distJson));
            } catch (Exception e) {
                // Ignore json parsing error
            }

            // 4. Add regional allocations with dynamically computed revenues
            for (RegionalAllocationDto regional : regionalAllocations) {
                PlanAllocation allocation = new PlanAllocation(
                    UUID.randomUUID(),
                    plan.getId(),
                    null,                      // tax_center_code = NULL for regional
                    regional.getRegionCode(),
                    regional.getProposedCount()
                );

                java.math.BigDecimal regRev = regionRevenues.getOrDefault(regional.getRegionCode(), java.math.BigDecimal.ZERO);
                allocation.setEstimatedRevenue(regRev);

                // Break down region revenue by audit types dynamically from distribution
                Map<String, java.math.BigDecimal> regTypeRevenues = new java.util.HashMap<>();
                int regTotalCases = regionCaseTotals.getOrDefault(regional.getRegionCode(), regional.getProposedCount());
                if (regTotalCases > 0 && distribution != null) {
                    Map<String, Integer> regDistMap = distribution.get(regional.getRegionCode());
                    if (regDistMap != null) {
                        for (Map.Entry<String, Integer> tEntry : regDistMap.entrySet()) {
                            String tKey = tEntry.getKey();
                            Integer count = tEntry.getValue();
                            if (count != null && count > 0) {
                                double share = (double) count / regTotalCases;
                                regTypeRevenues.put(tKey, regRev.multiply(java.math.BigDecimal.valueOf(share)).setScale(2, java.math.RoundingMode.HALF_UP));
                            }
                        }
                    }
                }

                try {
                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    allocation.setRevenueByAuditType(mapper.valueToTree(regTypeRevenues));
                } catch (Exception e) {
                    // Ignore json parsing error
                }

                plan.addAllocation(allocation);
            }
        } else {
            // Add regional allocations (one per region) without revenue
            for (RegionalAllocationDto regional : regionalAllocations) {
                PlanAllocation allocation = new PlanAllocation(
                    UUID.randomUUID(),
                    plan.getId(),
                    null,
                    regional.getRegionCode(),
                    regional.getProposedCount()
                );
                plan.addAllocation(allocation);
            }
        }

        // Save plan
        AnnualAuditPlan savedPlan = planRepository.save(plan);

        // Log action
        PlanAuditLog log = PlanAuditLog.createPlan(savedPlan.getId(), actorId);
        auditLogRepository.save(log);

        return savedPlan;
    }

    /**
     * LEVEL 1: Planning Team submits to Director
     */
    @Transactional
    public AnnualAuditPlan submitToDirector(UUID planId, String actorId) throws Exception {
        AnnualAuditPlan plan = planRepository.findById(planId)
            .orElseThrow(() -> new IllegalArgumentException("Plan not found: " + planId));

        if (!plan.canBeSubmittedByPlanningTeam()) {
            throw new IllegalStateException("Plan cannot be submitted in status: " + plan.getStatus());
        }

        plan.submitToDirector(actorId);
        AnnualAuditPlan saved = planRepository.save(plan);

        // Log action
        PlanAuditLog log = PlanAuditLog.submitToDirector(saved.getId(), actorId);
        auditLogRepository.save(log);

        return saved;
    }

    /**
     * LEVEL 2: Director approves and routes forward (NO allocation changes)
     */
    @Transactional
    public AnnualAuditPlan approveByDirector(UUID planId, String actorId, String reason) throws Exception {
        AnnualAuditPlan plan = planRepository.findById(planId)
            .orElseThrow(() -> new IllegalArgumentException("Plan not found: " + planId));

        if (!plan.canBeApprovedByDirector()) {
            throw new IllegalStateException("Plan cannot be approved in status: " + plan.getStatus());
        }

        plan.approveByDirector(actorId, reason);
        AnnualAuditPlan saved = planRepository.save(plan);

        // Log action
        PlanAuditLog log = PlanAuditLog.approvedByDirector(saved.getId(), actorId, reason);
        auditLogRepository.save(log);

        return saved;
    }

    /**
     * LEVEL 2: Director submits to Regional Directors
     */
    @Transactional
    public AnnualAuditPlan submitToRegionalDirectors(UUID planId, String actorId) throws Exception {
        AnnualAuditPlan plan = planRepository.findById(planId)
            .orElseThrow(() -> new IllegalArgumentException("Plan not found: " + planId));

        if (!plan.canBeSubmittedToRegionalByDirector()) {
            throw new IllegalStateException("Plan cannot be submitted to Regional in status: " + plan.getStatus());
        }

        plan.submitToRegionalDirectors(actorId);
        AnnualAuditPlan saved = planRepository.save(plan);

        // Log action
        PlanAuditLog log = PlanAuditLog.submittedToRegional(saved.getId(), actorId);
        auditLogRepository.save(log);

        return saved;
    }

    /**
     * LEVEL 3: Regional Director approves regional allocations
     */
    @Transactional
    public AnnualAuditPlan approveByRegionalDirector(UUID planId, String actorId, String reason) throws Exception {
        AnnualAuditPlan plan = planRepository.findById(planId)
            .orElseThrow(() -> new IllegalArgumentException("Plan not found: " + planId));

        if (!plan.canBeApprovedByRegionalDirector()) {
            throw new IllegalStateException("Plan cannot be approved in status: " + plan.getStatus());
        }

        plan.approveByRegionalDirector(actorId, reason);
        AnnualAuditPlan saved = planRepository.save(plan);

        // Log action
        PlanAuditLog log = PlanAuditLog.approvedByRegional(saved.getId(), actorId, reason);
        auditLogRepository.save(log);

        return saved;
    }

    /**
     * LEVEL 3: Regional Director divides regional allocation into tax center allocations
     */
    @Transactional
    public AnnualAuditPlan divideRegionalAllocationIntoTaxCenters(
        UUID planId,
        String regionCode,
        List<TaxCenterAllocationDto> tcAllocations,
        String actorId) {

        AnnualAuditPlan plan = planRepository.findById(planId)
            .orElseThrow(() -> new IllegalArgumentException("Plan not found: " + planId));

        // ✅ VALIDATION: Prevent duplicate submissions
        // If plan status is SENT_TO_TAX_CENTERS, distribution has already been sent
        if (plan.getStatus() == PlanStatus.SENT_TO_TAX_CENTERS) {
            throw new IllegalStateException(
                "Distribution has already been sent to tax centers. Plan is now read-only. Status: " + plan.getStatus()
            );
        }

        // Get regional allocation for this region
        PlanAllocation regionalAllocation = plan.getAllocations()
            .stream()
            .filter(a -> a.isRegionalAllocation() && a.getRegionCode().equals(regionCode))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Regional allocation not found for region: " + regionCode));

        int totalDivided = 0;
        int proposedTotal = regionalAllocation.getProposedCount();

        // ✅ CRITICAL: Remove old tax center allocations from in-memory plan FIRST
        // Clear the list before deleting from DB to avoid Hibernate stale object errors
        List<PlanAllocation> toRemove = plan.getAllocations().stream()
            .filter(a -> 
                a.isTaxCenterAllocation() && 
                a.getRegionCode() != null && 
                a.getRegionCode().equals(regionCode)
            )
            .collect(Collectors.toList());
        
        for (PlanAllocation a : toRemove) {
            plan.getAllocations().remove(a);
        }
        
        // ✅ FIX: Delete existing tax center allocations from DATABASE for this region
        // This allows regional directors to re-distribute their allocations without constraint violations
        allocationRepository.deleteByPlanIdAndRegionCodeAndTaxCenterCodeNotNull(planId, regionCode);
        
        // ✅ Refresh plan from database to eliminate stale Hibernate cache references
        // This ensures Hibernate doesn't try to update/delete rows that were just removed
        plan = planRepository.findById(planId)
            .orElseThrow(() -> new IllegalArgumentException("Plan not found after refresh: " + planId));
        
        // Re-fetch the regional allocation (it should still be in the list)
        regionalAllocation = plan.getAllocations()
            .stream()
            .filter(a -> a.isRegionalAllocation() && a.getRegionCode().equals(regionCode))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Regional allocation not found after cleanup for region: " + regionCode));

        // Map region codes to distribution keys (e.g., AA -> addis_ababa)
        Map<String, String> regionCodeToDistKey = Map.ofEntries(
            Map.entry("FED", "federal_level"),
            Map.entry("AA", "addis_ababa"), Map.entry("BA", "amhara"),
            Map.entry("BB", "oromia"), Map.entry("AB", "dire_dawa"),
            Map.entry("CA", "snnpr"), Map.entry("SO", "somali")
        );
        Map<String, Object> regionDistribution = null;
        if (plan.getDistribution() != null) {
            String clean = regionCode.replace("REG-", "").toUpperCase();
            String mappedName = regionCodeToDistKey.get(clean);
            List<String> candidates = List.of(
                regionCode,
                regionCode.toUpperCase(),
                regionCode.toLowerCase(),
                clean,
                clean.toLowerCase(),
                "REG-" + clean,
                mappedName != null ? mappedName : "",
                mappedName != null ? mappedName.toLowerCase() : ""
            );
            for (String c : candidates) {
                if (!c.isEmpty() && plan.getDistribution().containsKey(c)) {
                    regionDistribution = (Map<String, Object>) (Map<?, ?>) plan.getDistribution().get(c);
                    break;
                }
            }
        }

        // Create tax center allocations
        for (TaxCenterAllocationDto tcDto : tcAllocations) {
            PlanAllocation tcAllocation = new PlanAllocation(
                UUID.randomUUID(),
                plan.getId(),
                tcDto.getTaxCenterCode(),   // NOW set tax_center_code
                regionCode,
                tcDto.getAuditCount()
            );
            
            // Distribute estimated revenue from region to tax center based on audit count proportion
            if (regionalAllocation.getEstimatedRevenue() != null && proposedTotal > 0) {
                java.math.BigDecimal ratio = new java.math.BigDecimal(tcDto.getAuditCount())
                    .divide(new java.math.BigDecimal(proposedTotal), 4, java.math.RoundingMode.HALF_UP);
                tcAllocation.setEstimatedRevenue(regionalAllocation.getEstimatedRevenue().multiply(ratio));

                if (regionalAllocation.getRevenueByAuditType() != null) {
                    try {
                        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                        Map<String, java.math.BigDecimal> tcRevenueByType = new java.util.HashMap<>();
                        com.fasterxml.jackson.databind.JsonNode regRevByType = regionalAllocation.getRevenueByAuditType();
                        java.util.Iterator<Map.Entry<String, com.fasterxml.jackson.databind.JsonNode>> fields = regRevByType.fields();
                        while (fields.hasNext()) {
                            Map.Entry<String, com.fasterxml.jackson.databind.JsonNode> field = fields.next();
                            java.math.BigDecimal typeRev = new java.math.BigDecimal(field.getValue().asText());
                            tcRevenueByType.put(field.getKey(), typeRev.multiply(ratio));
                        }
                        tcAllocation.setRevenueByAuditType(mapper.valueToTree(tcRevenueByType));
                    } catch (Exception ignored) {}
                }
            }

            if (regionDistribution != null && !regionDistribution.isEmpty()) {
                Map<String, Integer> breakdown = calculateAuditTypeBreakdown(
                    regionDistribution,
                    tcDto.getAuditCount()
                );
                com.fasterxml.jackson.databind.JsonNode jsonNode = 
                    com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.pojoNode(breakdown);
                tcAllocation.setAllocationByAuditType(jsonNode);
            }
            
            plan.addAllocation(tcAllocation);
            totalDivided += tcDto.getAuditCount();

            // Log tax center allocation creation
            PlanAuditLog log = new PlanAuditLog(
                plan.getId(),
                "TAX_CENTER_ALLOCATION_CREATED",
                actorId,
                "REGIONAL_DIRECTOR",
                "Divided from regional allocation"
            );
            auditLogRepository.save(log);
        }

        // Validate division sum
        if (totalDivided != proposedTotal) {
            throw new IllegalArgumentException(
                String.format("Tax center allocations sum (%d) does not match regional allocation (%d)",
                    totalDivided, proposedTotal)
            );
        }

        // Mark regional allocation as divided
        regionalAllocation.divideBetweenTaxCenters(totalDivided, "Divided into " + tcAllocations.size() + " tax centers");

        AnnualAuditPlan saved = planRepository.save(plan);

        // Log action
        PlanAuditLog log = new PlanAuditLog(
            saved.getId(),
            "REGIONAL_DIVIDED_INTO_TAX_CENTERS",
            actorId,
            "REGIONAL_DIRECTOR",
            "Divided regional allocation for " + regionCode
        );
        auditLogRepository.save(log);

        // NOTE: Status transition to SENT_TO_TAX_CENTERS is handled separately
        // when the director confirms all regions have divided.

        return saved;
    }

    /**
     * LEVEL 2: Director sends plan to Tax Centers
     */
    @Transactional
    public AnnualAuditPlan sendToTaxCenters(UUID planId, String actorId) throws Exception {
        AnnualAuditPlan plan = planRepository.findById(planId)
            .orElseThrow(() -> new IllegalArgumentException("Plan not found: " + planId));

        if (!plan.canBeSentToTaxCentersByDirector()) {
            throw new IllegalStateException("Plan cannot be sent to Tax Centers in status: " + plan.getStatus());
        }

        plan.sendToTaxCenters(actorId);
        AnnualAuditPlan saved = planRepository.save(plan);

        // Log action
        PlanAuditLog log = PlanAuditLog.sentToTaxCenters(saved.getId(), actorId);
        auditLogRepository.save(log);

        return saved;
    }

    /**
     * LEVEL 4: Tax Center Manager provides feedback
     */
    @Transactional
    public AnnualAuditPlan submitTaxCenterFeedback(
        UUID planId,
        String taxCenterCode,
        Integer adjustedCount,
        String justification,
        String actorId) {

        AnnualAuditPlan plan = planRepository.findById(planId)
            .orElseThrow(() -> new IllegalArgumentException("Plan not found: " + planId));

        if (!plan.canReceiveTaxCenterFeedback()) {
            throw new IllegalStateException("Plan cannot receive feedback in status: " + plan.getStatus());
        }

        // Get tax center allocation
        PlanAllocation tcAllocation = plan.getAllocations()
            .stream()
            .filter(a -> a.isTaxCenterAllocation() && a.getTaxCenterCode().equals(taxCenterCode))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Tax center allocation not found: " + taxCenterCode));

        // Submit feedback
        tcAllocation.submitFeedback(adjustedCount, justification);

        AnnualAuditPlan saved = planRepository.save(plan);

        // Log action
        PlanAuditLog log = PlanAuditLog.feedbackSubmittedByTaxCenter(saved.getId(), actorId, 
            tcAllocation.getProposedCount(), adjustedCount);
        auditLogRepository.save(log);

        return saved;
    }

    /**
     * Record all tax centers have submitted feedback
     */
    @Transactional
    public AnnualAuditPlan recordAllTaxCenterFeedbackSubmitted(UUID planId, String actorId) {
        AnnualAuditPlan plan = planRepository.findById(planId)
            .orElseThrow(() -> new IllegalArgumentException("Plan not found: " + planId));

        plan.recordTaxCenterFeedbackSubmitted(actorId);
        AnnualAuditPlan saved = planRepository.save(plan);

        // Log action
        PlanAuditLog log = new PlanAuditLog(saved.getId(), "TC_FEEDBACK_SUBMITTED", actorId, "DIRECTOR");
        auditLogRepository.save(log);

        return saved;
    }

    /**
     * Finalize plan
     */
    @Transactional
    public AnnualAuditPlan finalizePlan(UUID planId, String actorId) {
        AnnualAuditPlan plan = planRepository.findById(planId)
            .orElseThrow(() -> new IllegalArgumentException("Plan not found: " + planId));

        plan.finalize(actorId);
        AnnualAuditPlan saved = planRepository.save(plan);

        // Log action
        PlanAuditLog log = PlanAuditLog.planFinalized(saved.getId(), actorId);
        auditLogRepository.save(log);

        return saved;
    }

    /**
     * Get plan by ID
     */
    @Transactional(readOnly = true)
    public AnnualAuditPlan getPlanById(UUID planId) {
        return planRepository.findById(planId)
            .orElseThrow(() -> new IllegalArgumentException("Plan not found: " + planId));
    }

    /**
     * Get all plans
     */
    @Transactional(readOnly = true)
    public List<AnnualAuditPlan> getAllPlans() {
        return planRepository.findAll();
    }

    /**
     * Get all regional allocations for a plan
     */
    @Transactional(readOnly = true)
    public List<PlanAllocation> getRegionalAllocations(UUID planId) {
        AnnualAuditPlan plan = getPlanById(planId);
        return plan.getAllocations()
            .stream()
            .filter(PlanAllocation::isRegionalAllocation)
            .toList();
    }

    /**
     * Get all tax center allocations for a plan
     */
    @Transactional(readOnly = true)
    public List<PlanAllocation> getTaxCenterAllocations(UUID planId) {
        AnnualAuditPlan plan = getPlanById(planId);
        return plan.getAllocations()
            .stream()
            .filter(PlanAllocation::isTaxCenterAllocation)
            .toList();
    }

    /**
     * Get tax center allocations for a specific region
     */
    @Transactional(readOnly = true)
    public List<PlanAllocation> getTaxCenterAllocationsByRegion(UUID planId, String regionCode) {
        AnnualAuditPlan plan = getPlanById(planId);
        return plan.getAllocations()
            .stream()
            .filter(a -> a.isTaxCenterAllocation() && a.getRegionCode().equals(regionCode))
            .toList();
    }

    /**
     * Get audit log for a plan
     */
    @Transactional(readOnly = true)
    public List<PlanAuditLog> getPlanAuditLog(UUID planId) {
        return auditLogRepository.findByPlanIdOrderByCreatedAtDesc(planId);
    }

    /**
     * Calculate per-audit-type breakdown for a tax center allocation
     * Takes the regional distribution percentages and applies them to the tax center's total audit count
     * 
     * @param regionDistribution Map of audit type to count from plan distribution
     * @param totalForTaxCenter Total audit count for this tax center
     * @return Map of audit type to count for this tax center
     */
    private Map<String, Integer> calculateAuditTypeBreakdown(
        Map<String, Object> regionDistribution,
        Integer totalForTaxCenter) {
        
        Map<String, Integer> breakdown = new java.util.HashMap<>();
        
        // Calculate total from region distribution
        int totalInRegion = 0;
        for (Object value : regionDistribution.values()) {
            if (value instanceof Number) {
                totalInRegion += ((Number) value).intValue();
            }
        }
        
        if (totalInRegion == 0) {
            // If no distribution defined, use equal distribution
            int perAuditType = totalForTaxCenter / regionDistribution.size();
            int remainder = totalForTaxCenter % regionDistribution.size();
            int i = 0;
            for (String auditType : regionDistribution.keySet()) {
                int allocation = perAuditType + (i < remainder ? 1 : 0);
                breakdown.put(auditType, allocation);
                i++;
            }
        } else {
            // Apply proportional distribution
            int distributed = 0;
            int i = 0;
            java.util.List<String> auditTypes = new java.util.ArrayList<>(regionDistribution.keySet());
            for (String auditType : auditTypes) {
                Object value = regionDistribution.get(auditType);
                int regionCount = value instanceof Number ? ((Number) value).intValue() : 0;
                
                int allocation;
                if (i == auditTypes.size() - 1) {
                    // Last item: use remainder to ensure exact total
                    allocation = totalForTaxCenter - distributed;
                } else {
                    // Calculate proportional share
                    allocation = Math.round((float) regionCount * totalForTaxCenter / totalInRegion);
                }
                
                breakdown.put(auditType, Math.max(0, allocation));
                distributed += allocation;
                i++;
            }
        }
        
        return breakdown;
    }

    // DTOs for API requests
    public static class RegionalAllocationDto {
        private String regionCode;
        private Integer proposedCount;

        public RegionalAllocationDto(String regionCode, Integer proposedCount) {
            this.regionCode = regionCode;
            this.proposedCount = proposedCount;
        }

        public String getRegionCode() { return regionCode; }
        public Integer getProposedCount() { return proposedCount; }
    }

    public static class TaxCenterAllocationDto {
        private String taxCenterCode;
        private Integer auditCount;

        public TaxCenterAllocationDto(String taxCenterCode, Integer auditCount) {
            this.taxCenterCode = taxCenterCode;
            this.auditCount = auditCount;
        }

        public String getTaxCenterCode() { return taxCenterCode; }
        public Integer getAuditCount() { return auditCount; }
    }
}
