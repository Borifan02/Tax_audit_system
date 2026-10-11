package mor.itas.application.usecase.ap;

import mor.itas.application.port.outboundport.taxpayer.TaxpayerPort;
import mor.itas.application.port.outboundport.usermanagement.UserManagementPort;
import mor.itas.persistence.jpa.entity.ap.*;
import mor.itas.persistence.jpa.repository.ap.*;

import java.math.BigDecimal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

/**
 * CascadePlanToCasesUseCase
 *
 * Converts plan allocations into actual audit cases.
 *
 * Key behaviors:
 * 1. Idempotent: deletes existing cases for this plan before re-creating
 * 2. Auto-assigns team leaders by audit type:
 *    - DESK_AUDIT     → Desk Team Leaders (round-robin across 3 TLs)
 *    - COMPREHENSIVE   → Comprehensive Team Leaders (round-robin across 2 TLs)
 *    - ISSUE_AUDIT     → QA Team Leaders (round-robin across 2 TLs)
 *    - JOINT_AUDIT     → JA Committee Members (round-robin, NOT team leaders)
 *    - TRANSFER_PRICING → TP Committee Members (round-robin, NOT team leaders)
 * 3. One taxpayer = one case per plan year per tax center (duplicate prevention)
 */
@Service
@RequiredArgsConstructor
public class CascadePlanToCasesUseCase {

    private final AnnualAuditPlanJpaRepository planRepository;
    private final PlanAllocationRepository allocationRepository;
    private final ApAuditCaseRepository auditCaseRepository;
    private final RegionalDeploymentRepository deploymentRepository;
    private final TaxpayerPort taxpayerPort;
    private final UserManagementPort userManagementPort;
    private final mor.itas.domain.service.ap.JointCaseRoutingBridgeService jointCaseRoutingBridge;

    // Audit type ID mapping (frontend → backend)
    private static final Map<String, String> AUDIT_TYPE_MAP = Map.of(
        "desk_audit", "DESK_AUDIT",
        "joint_audit", "JOINT_AUDIT",
        "transfer_pricing", "TRANSFER_PRICING",
        "comprehensive", "COMPREHENSIVE_AUDIT",
        "comprehensive_audit", "COMPREHENSIVE_AUDIT",
        "issue_audit", "ISSUE_AUDIT"
    );

    // Mapping from backend audit type → team leader audit type code
    // JOINT_AUDIT and TRANSFER_PRICING use committee members, not team leaders
    private static final Map<String, String> TL_AUDIT_TYPE_MAP = Map.of(
        "DESK_AUDIT", "DESK",
        "COMPREHENSIVE_AUDIT", "COMP",
        "ISSUE_AUDIT", "QA"
    );

    // These audit types use committee members instead of team leaders
    private static final Set<String> COMMITTEE_AUDIT_TYPES = Set.of("JOINT_AUDIT", "TRANSFER_PRICING");

    /**
     * Cascade all allocations for a plan into audit cases (no filter)
     */
    @Transactional
    public Map<String, Object> cascade(UUID planId, String actorId) {
        return cascade(planId, actorId, null, null);
    }

    /**
     * Cascade with optional audit type filter.
     */
    @Transactional
    public Map<String, Object> cascade(UUID planId, String actorId, List<String> auditTypeFilter) {
        return cascade(planId, actorId, auditTypeFilter, null);
    }

    /**
     * Cascade with optional audit type filter and tax center filter.
     * This operation is idempotent: preserves existing active cases and fills shortfalls.
     */
    @Transactional
    public Map<String, Object> cascade(UUID planId, String actorId, List<String> auditTypeFilter, String targetTaxCenterCode) {
        // Normalize filter to uppercase backend names
        Set<String> allowedTypes = null;
        if (auditTypeFilter != null && !auditTypeFilter.isEmpty()) {
            allowedTypes = new HashSet<>();
            for (String at : auditTypeFilter) {
                String mapped = AUDIT_TYPE_MAP.getOrDefault(at.toLowerCase(), at.toUpperCase());
                allowedTypes.add(mapped);
            }
            System.err.println("=== CASCADE FILTER: only creating cases for: " + allowedTypes);
        }

        AnnualAuditPlanEntity plan = planRepository.findById(planId)
            .orElseThrow(() -> new IllegalArgumentException("Plan not found: " + planId));

        // ── Pre-Approval Guard: Only post-approved plans can be cascaded into cases ──
        String status = plan.getStatus().name();
        boolean isPostApproval = status.equals("APPROVED_TO_REGIONS") 
            || status.equals("SENT_TO_TAX_CENTERS") 
            || status.equals("REGIONAL_APPROVED") 
            || status.equals("FINALIZED")
            || status.equals("SENIOR_MGMT_APPROVED");
        if (!isPostApproval && !"SYSTEM".equalsIgnoreCase(actorId)) {
            throw new IllegalStateException("Plan is in pre-approval stage (" + status + "). Cases can only be generated after senior management approval and regional deployment.");
        }

        // ── Step 1: Check existing cases for this plan (safe idempotent cascade) ──
        List<ApAuditCaseEntity> existingCases = auditCaseRepository.findByPlanId(planId);
        Set<String> existingTins = existingCases.stream()
            .map(ApAuditCaseEntity::getTaxpayerId)
            .filter(Objects::nonNull)
            .collect(Collectors.toSet());

        // Group existing cases by tax center code (lowercase) and audit type (uppercase)
        Map<String, Map<String, List<ApAuditCaseEntity>>> existingCasesByTcAndType = new HashMap<>();
        for (ApAuditCaseEntity ec : existingCases) {
            String tc = ec.getTaxCenterCode() != null ? ec.getTaxCenterCode().toLowerCase() : "";
            String at = ec.getAuditType() != null ? ec.getAuditType().toUpperCase() : "";
            existingCasesByTcAndType
                .computeIfAbsent(tc, k -> new HashMap<>())
                .computeIfAbsent(at, k -> new ArrayList<>())
                .add(ec);
        }
        System.err.println("🛡️ Existing active cases for plan " + planId + ": " + existingCases.size() + " preserved.");

        // Get all tax center allocations for this plan
        List<PlanAllocationEntity> existingAllocations = allocationRepository.findByAnnualPlanId(planId)
            .stream()
            .filter(a -> a.getTaxCenterCode() != null && !a.getTaxCenterCode().isEmpty())
            .collect(Collectors.toList());

        // Always check for missing tax center allocations across all regions
        List<PlanAllocationEntity> allocations = autoGenerateMissingTaxCenterAllocations(plan, existingAllocations);

        int totalCasesCreated = 0;
        Map<String, Integer> casesByTaxCenter = new LinkedHashMap<>();
        Map<String, Integer> casesByAuditType = new LinkedHashMap<>();
        Map<String, Integer> casesByTeamLeader = new LinkedHashMap<>();
        AtomicInteger caseNumberCounter = new AtomicInteger(existingCases.size() + 1);

        // Revenue tracking: allocationId → auditType → revenue
        Map<UUID, Map<String, Long>> allocationRevenueByType = new HashMap<>();
        // Regional revenue: regionCode → auditType → revenue
        Map<String, Map<String, Long>> regionalRevenueByType = new HashMap<>();

        // ── Step 2: Pre-load team leaders and committee members per tax center ──
        // Structure: taxCenterCode → auditType → List<userId>
        Map<String, Map<String, List<String>>> teamLeaderCache = new HashMap<>();
        Map<String, List<String>> committeeCache = new HashMap<>();

        for (PlanAllocationEntity allocation : allocations) {
            String tcCode = allocation.getTaxCenterCode();
            if (tcCode == null || tcCode.isEmpty()) continue;

            // Map to backend code for team leader lookup: AA-TC1 → AA-01
            String tlCode = mapToFrontendTcCode(tcCode);

            // Load team leaders for this tax center
            Map<String, List<String>> tcLeaders = new HashMap<>();

            // DESK team leaders
            tcLeaders.put("DESK_AUDIT", getTeamLeaderIds(tlCode, "DESK"));
            // COMPREHENSIVE team leaders
            tcLeaders.put("COMPREHENSIVE_AUDIT", getTeamLeaderIds(tlCode, "COMP"));
            // ISSUE → QA team leaders
            tcLeaders.put("ISSUE_AUDIT", getTeamLeaderIds(tlCode, "QA"));

            teamLeaderCache.put(tcCode, tcLeaders);
        }

        // Load committee members
        committeeCache.put("JOINT_AUDIT", getCommitteeMemberIds("JOINT_AUDIT"));
        committeeCache.put("TRANSFER_PRICING", getCommitteeMemberIds("TRANSFER_PRICING"));

        System.err.println("=== TEAM LEADER CACHE ===");
        for (var tcEntry : teamLeaderCache.entrySet()) {
            for (var atEntry : tcEntry.getValue().entrySet()) {
                System.err.println("  " + tcEntry.getKey() + " / " + atEntry.getKey() + " → " + atEntry.getValue().size() + " leaders");
            }
        }
        for (var ce : committeeCache.entrySet()) {
            System.err.println("  COMMITTEE " + ce.getKey() + " → " + ce.getValue().size() + " members");
        }

        // ── Step 3: Create cases per tax center ──
        for (PlanAllocationEntity allocation : allocations) {
            String taxCenterCode = allocation.getTaxCenterCode();
            String regionCode = allocation.getRegionCode();

            if (taxCenterCode == null || taxCenterCode.isEmpty()) continue;

            // Map frontend code to backend code
            String backendTaxCenterCode = taxCenterCode;
            if (taxCenterCode.toLowerCase().startsWith("federal-lto") || taxCenterCode.toLowerCase().startsWith("fed-lto")) {
                backendTaxCenterCode = taxCenterCode;
            } else if (taxCenterCode.toLowerCase().startsWith("addis_ababa-tc")) {
                int num = Integer.parseInt(taxCenterCode.substring("addis_ababa-tc".length()));
                backendTaxCenterCode = String.format("TC-AA-%02d", num);
            } else if (taxCenterCode.toLowerCase().startsWith("amhara-tc") || taxCenterCode.toLowerCase().startsWith("ba-tc")) {
                int num = Integer.parseInt(taxCenterCode.replaceAll("[^0-9]", ""));
                backendTaxCenterCode = String.format("TC-BA-%02d", num);
            } else if (taxCenterCode.toLowerCase().startsWith("oromia-tc") || taxCenterCode.toLowerCase().startsWith("bb-tc")) {
                int num = Integer.parseInt(taxCenterCode.replaceAll("[^0-9]", ""));
                backendTaxCenterCode = String.format("TC-BB-%02d", num);
            } else if (taxCenterCode.toLowerCase().startsWith("dire_dawa-tc") || taxCenterCode.toLowerCase().startsWith("ab-tc")) {
                int num = Integer.parseInt(taxCenterCode.replaceAll("[^0-9]", ""));
                backendTaxCenterCode = String.format("TC-DD-%02d", num);
            } else if (taxCenterCode.toLowerCase().startsWith("snnpr-tc") || taxCenterCode.toLowerCase().startsWith("ca-tc")) {
                int num = Integer.parseInt(taxCenterCode.replaceAll("[^0-9]", ""));
                backendTaxCenterCode = String.format("TC-CA-%02d", num);
            } else if (taxCenterCode.toLowerCase().startsWith("somali-tc") || taxCenterCode.toLowerCase().startsWith("so-tc")) {
                int num = Integer.parseInt(taxCenterCode.replaceAll("[^0-9]", ""));
                backendTaxCenterCode = String.format("TC-SM-%02d", num);
            } else if (!taxCenterCode.startsWith("TC-")) {
                String[] parts = taxCenterCode.split("-TC");
                if (parts.length == 2) {
                    backendTaxCenterCode = String.format("TC-%s-%02d", parts[0], Integer.parseInt(parts[1]));
                }
            }
            System.err.println("=== CASCADE DEBUG: taxCenterCode=" + taxCenterCode + " -> backendCode=" + backendTaxCenterCode);

            // If targetTaxCenterCode is specified, filter to match it
            if (targetTaxCenterCode != null && !targetTaxCenterCode.isBlank()) {
                String targetNorm = targetTaxCenterCode.trim().toLowerCase();
                boolean matches = taxCenterCode.equalsIgnoreCase(targetNorm)
                    || backendTaxCenterCode.equalsIgnoreCase(targetNorm)
                    || taxCenterCode.toLowerCase().replace("-", "").contains(targetNorm.replace("-", ""))
                    || targetNorm.replace("-", "").contains(taxCenterCode.toLowerCase().replace("-", ""));
                if (!matches) {
                    continue;
                }
            }

            // Parse the audit type breakdown from the allocation
            Map<String, Integer> auditTypeBreakdown = parseAuditTypeBreakdown(allocation);

            if (auditTypeBreakdown.isEmpty() || auditTypeBreakdown.values().stream().mapToInt(Integer::intValue).sum() == 0) {
                System.err.println("⚠️ No valid audit type breakdown for " + taxCenterCode + ", using default 45 total");
                int total = allocation.getProposedCount() > 0 ? allocation.getProposedCount() : 45;
                auditTypeBreakdown = new LinkedHashMap<>();
                auditTypeBreakdown.put("desk_audit", Math.max(5, (int)(total * 0.35)));
                auditTypeBreakdown.put("joint_audit", Math.max(2, (int)(total * 0.15)));
                auditTypeBreakdown.put("transfer_pricing", Math.max(2, (int)(total * 0.10)));
                auditTypeBreakdown.put("comprehensive", Math.max(3, (int)(total * 0.20)));
                auditTypeBreakdown.put("issue_audit", Math.max(3, (int)(total * 0.20)));
            }

            // Fetch taxpayers for this tax center
            List<Map<String, Object>> taxpayers;
            try {
                taxpayers = taxpayerPort.getTaxpayersForTaxCenter(backendTaxCenterCode);
            } catch (Exception e) {
                System.err.println("⚠️ Failed to fetch taxpayers for " + backendTaxCenterCode + ": " + e.getMessage());
                continue;
            }

            if (taxpayers == null || taxpayers.isEmpty()) {
                System.err.println("⚠️ No taxpayers found for " + backendTaxCenterCode);
                continue;
            }

            // Group taxpayers by recommended audit type (normalized to uppercase backend type)
            Map<String, List<Map<String, Object>>> taxpayersByType = new HashMap<>();
            for (Map<String, Object> tp : taxpayers) {
                if (tp == null || !(tp instanceof Map)) continue;
                String recType = (String) tp.getOrDefault("recommendedAuditType", "DESK_AUDIT");
                String normRecType = AUDIT_TYPE_MAP.getOrDefault(recType.toLowerCase(), recType.toUpperCase());
                taxpayersByType.computeIfAbsent(normRecType, k -> new ArrayList<>()).add(tp);
            }

            // Sort each group by risk score (highest first)
            taxpayersByType.values().forEach(list ->
                list.sort((a, b) -> ((Integer) b.getOrDefault("riskScore", 0))
                    .compareTo((Integer) a.getOrDefault("riskScore", 0)))
            );

            int tcCasesCreated = 0;
            Set<String> usedTinsInTaxCenter = new HashSet<>();

            // Per tax center round-robin indices for team leaders (per audit type)
            Map<String, Integer> tlRoundRobin = new HashMap<>();

            // For each audit type in the allocation, create cases
            for (Map.Entry<String, Integer> entry : auditTypeBreakdown.entrySet()) {
                String auditType = entry.getKey();
                int requiredCases = entry.getValue();

                if (requiredCases <= 0) continue;

                // If audit type filter is set, skip types not in the filter
                String backendType = AUDIT_TYPE_MAP.getOrDefault(auditType.toLowerCase(), auditType.toUpperCase());
                if (allowedTypes != null && !allowedTypes.contains(backendType)) {
                    continue;
                }

                // Check how many cases already exist for this TC & audit type
                List<ApAuditCaseEntity> existingForThisType = existingCasesByTcAndType
                    .getOrDefault(backendTaxCenterCode.toLowerCase(), Collections.emptyMap())
                    .getOrDefault(backendType, Collections.emptyList());
                if (existingForThisType.isEmpty()) {
                    existingForThisType = existingCasesByTcAndType
                        .getOrDefault(taxCenterCode.toLowerCase(), Collections.emptyMap())
                        .getOrDefault(backendType, Collections.emptyList());
                }

                int alreadyCount = existingForThisType.size();
                int neededCases = Math.max(0, requiredCases - alreadyCount);

                if (alreadyCount > 0) {
                    casesByAuditType.merge(backendType, alreadyCount, Integer::sum);
                    casesByTaxCenter.merge(taxCenterCode, alreadyCount, Integer::sum);
                }

                if (neededCases <= 0) {
                    System.err.println("ℹ️ Tax center " + taxCenterCode + " already has " + alreadyCount + " cases for " + backendType + " (quota: " + requiredCases + ")");
                    continue;
                }

                // Get taxpayers recommended for this audit type (excluding already used in this tax center or existing cases)
                List<Map<String, Object>> candidates = new ArrayList<>();
                for (Map<String, Object> tp : taxpayersByType.getOrDefault(backendType, Collections.emptyList())) {
                    String tin = (String) tp.get("tin");
                    if (tin != null && !usedTinsInTaxCenter.contains(tin) && !existingTins.contains(tin)) {
                        candidates.add(tp);
                    }
                }

                // If not enough candidates, pull from other pools
                if (candidates.size() < neededCases) {
                    for (List<Map<String, Object>> pool : taxpayersByType.values()) {
                        for (Map<String, Object> tp : pool) {
                            if (candidates.size() >= neededCases) break;
                            String tin = (String) tp.get("tin");
                            if (tin != null && !usedTinsInTaxCenter.contains(tin) && !existingTins.contains(tin) && !candidates.contains(tp)) {
                                candidates.add(tp);
                            }
                        }
                        if (candidates.size() >= neededCases) break;
                    }
                }

                int casesToCreate = Math.min(neededCases, candidates.size());

                // Get the right assignees for this audit type
                List<String> assigneeIds;
                boolean isCommittee = COMMITTEE_AUDIT_TYPES.contains(backendType);
                if (isCommittee) {
                    assigneeIds = committeeCache.getOrDefault(backendType, new ArrayList<>());
                } else {
                    assigneeIds = teamLeaderCache
                        .getOrDefault(taxCenterCode, Collections.emptyMap())
                        .getOrDefault(backendType, new ArrayList<>());
                }

                if (assigneeIds.isEmpty()) {
                    System.err.println("⚠️ No team leaders/committee found for " + backendType + " in " + taxCenterCode);
                }

                for (int i = 0; i < casesToCreate; i++) {
                    Map<String, Object> taxpayer = candidates.get(i);
                    String tin = (String) taxpayer.getOrDefault("tin", "UNKNOWN");
                    usedTinsInTaxCenter.add(tin);
                    existingTins.add(tin);

                    ApAuditCaseEntity caseEntity = new ApAuditCaseEntity();
                    caseEntity.setId(UUID.randomUUID());
                    caseEntity.setPlanId(planId);
                    caseEntity.setAllocationId(allocation.getId());

                    // ── Denormalize TC and region for direct queries ──
                    caseEntity.setTaxCenterCode(backendTaxCenterCode);
                    caseEntity.setRegionCode(regionCode != null ? regionCode : "");

                    caseEntity.setCaseNumber(generateCaseNumber(plan, regionCode, backendTaxCenterCode, caseNumberCounter));
                    caseEntity.setTaxpayerId(tin);

                    // ── Denormalize taxpayer display fields ──
                    Object nameObj = taxpayer.get("name");
                    if (nameObj == null) nameObj = taxpayer.get("businessName");
                    if (nameObj == null) nameObj = taxpayer.get("taxpayerName");
                    caseEntity.setTaxpayerName(nameObj != null ? nameObj.toString() : tin);

                    Object sectorObj = taxpayer.get("sector");
                    if (sectorObj == null) sectorObj = taxpayer.get("businessSector");
                    caseEntity.setSector(sectorObj != null ? sectorObj.toString() : "Unknown");

                    caseEntity.setAuditType(backendType);
                    caseEntity.setRiskScore((Integer) taxpayer.getOrDefault("riskScore", 0));
                    Object estRev = taxpayer.get("estimatedRevenue");
                    if (estRev instanceof Number) caseEntity.setEstimatedRevenue(((Number) estRev).longValue());
                    caseEntity.setCreatedBy(actorId != null ? actorId : "SYSTEM");
                    caseEntity.setCreatedAt(OffsetDateTime.now());
                    caseEntity.setUpdatedAt(OffsetDateTime.now());

                    // ── All cases start as PENDING_ASSIGNMENT ──
                    // Manual or explicit assignment happens after case creation via Case Management / Committee UI
                    caseEntity.setAssignedTeamLeaderId(null);
                    caseEntity.setAssignedAuditorId(null);
                    caseEntity.setStatus(ApAuditCaseEntity.STATUS_PENDING_ASSIGNMENT);

                    // Save to database
                    ApAuditCaseEntity savedCase = auditCaseRepository.save(caseEntity);
                    tcCasesCreated++;
                    totalCasesCreated++;

                    // Bridge Joint Audit cases into Joint Audit Committee system
                    if (jointCaseRoutingBridge != null && jointCaseRoutingBridge.isJointAudit(backendType)) {
                        try {
                            jointCaseRoutingBridge.routeApCaseToCommittee(savedCase, backendTaxCenterCode);
                        } catch (Exception e) {
                            System.err.println("⚠️ Warning: Failed to route case to Joint Committee: " + e.getMessage());
                        }
                    }

                    casesByAuditType.merge(backendType, 1, Integer::sum);

                    // ── Revenue tracking ──
                    long caseRevenue = caseEntity.getEstimatedRevenue() != null ? caseEntity.getEstimatedRevenue() : 0L;
                    if (caseRevenue > 0) {
                        allocationRevenueByType
                            .computeIfAbsent(allocation.getId(), k -> new HashMap<>())
                            .merge(backendType, caseRevenue, Long::sum);
                        regionalRevenueByType
                            .computeIfAbsent(regionCode != null ? regionCode : "UNKNOWN", k -> new HashMap<>())
                            .merge(backendType, caseRevenue, Long::sum);
                    }
                }
            }

            casesByTaxCenter.merge(taxCenterCode, tcCasesCreated, Integer::sum);
            System.err.println("✅ " + taxCenterCode + ": " + tcCasesCreated + " new cases created");
        }

        // ── Update allocations with revenue data ──
        for (PlanAllocationEntity allocation : allocations) {
            Map<String, Long> revByType = allocationRevenueByType.getOrDefault(allocation.getId(), Collections.emptyMap());
            if (!revByType.isEmpty()) {
                long totalRev = revByType.values().stream().mapToLong(Long::longValue).sum();
                allocation.setEstimatedRevenue(java.math.BigDecimal.valueOf(totalRev));
                try {
                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    allocation.setRevenueByAuditType(mapper.valueToTree(revByType));
                } catch (Exception e) {
                    System.err.println("⚠️ Failed to serialize revenue by audit type: " + e.getMessage());
                }
                allocationRepository.save(allocation);
                System.err.println("💰 Allocation " + allocation.getTaxCenterCode() + " revenue: " + totalRev + " ETB (" + revByType + ")");
            }
        }

        // ── Update regional deployments with revenue data ──
        for (Map.Entry<String, Map<String, Long>> regionEntry : regionalRevenueByType.entrySet()) {
            String regionCode = regionEntry.getKey();
            Map<String, Long> revByType = regionEntry.getValue();
            long totalRev = revByType.values().stream().mapToLong(Long::longValue).sum();
            try {
                var deploymentOpt = deploymentRepository.findByPlanIdAndRegionCode(planId, regionCode);
                if (deploymentOpt.isPresent()) {
                    var deployment = deploymentOpt.get();
                    deployment.setEstimatedRevenue(totalRev);
                    deployment.setRevenueByAuditType(revByType);
                    deploymentRepository.save(deployment);
                    System.err.println("💰 Regional deployment " + regionCode + " revenue: " + totalRev + " ETB");
                }
            } catch (Exception e) {
                System.err.println("⚠️ Failed to update regional deployment for " + regionCode + ": " + e.getMessage());
            }
        }

        // Update plan status to FINALIZED if cases were created or exist
        if (totalCasesCreated > 0 || !existingCases.isEmpty()) {
            plan.setStatus(PlanStatusEnum.FINALIZED);
            plan.setUpdatedAt(OffsetDateTime.now());
            planRepository.save(plan);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("planId", planId.toString());
        result.put("planName", plan.getName());
        result.put("planYear", plan.getYear());
        result.put("previousCasesPreserved", existingCases.size());
        result.put("previousCasesDeleted", 0);
        result.put("totalCasesCreated", totalCasesCreated);
        result.put("totalCases", existingCases.size() + totalCasesCreated);
        result.put("casesByTaxCenter", casesByTaxCenter);
        result.put("casesByAuditType", casesByAuditType);
        result.put("casesByTeamLeader", casesByTeamLeader);
        result.put("taxCentersProcessed", casesByTaxCenter.size());
        result.put("status", (totalCasesCreated > 0 || !existingCases.isEmpty()) ? "FINALIZED" : "NO_CASES_CREATED");
        result.put("message", totalCasesCreated > 0
            ? "Plan cascaded: " + totalCasesCreated + " new cases created, " + existingCases.size() + " existing cases active across tax centers."
            : "Plan already fully cascaded: " + existingCases.size() + " active audit cases across tax centers.");

        return result;
    }

    /**
     * Get team leader IDs for a tax center and audit type
     * Tax center code for team leaders: AA-01 format (not TC-AA-01)
     */
    private List<String> getTeamLeaderIds(String tlTaxCenterCode, String auditTypeCode) {
        try {
            List<Map<String, Object>> leaders = userManagementPort.getTeamLeaders(tlTaxCenterCode, auditTypeCode);
            return leaders.stream()
                .map(m -> (String) m.get("userId"))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("⚠️ Failed to get team leaders for " + tlTaxCenterCode + "/" + auditTypeCode + ": " + e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * Get committee member IDs for Joint Audit or Transfer Pricing
     */
    private List<String> getCommitteeMemberIds(String auditType) {
        try {
            List<Map<String, Object>> members = userManagementPort.getCommitteeMembers(auditType);
            return members.stream()
                .map(m -> (String) m.get("userId"))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("⚠️ Failed to get committee members for " + auditType + ": " + e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * Map backend tax center code (AA-TC1) to team leader lookup format (AA-01)
     */
    private String mapToFrontendTcCode(String taxCenterCode) {
        // AA-TC1 → AA-01
        // AA-TC2 → AA-02
        if (taxCenterCode.contains("-TC")) {
            String[] parts = taxCenterCode.split("-TC");
            if (parts.length == 2) {
                return parts[0] + "-" + String.format("%02d", Integer.parseInt(parts[1]));
            }
        }
        return taxCenterCode;
    }

    /**
     * Parse audit type breakdown from allocation's JSON field
     */
    private Map<String, Integer> parseAuditTypeBreakdown(PlanAllocationEntity allocation) {
        Map<String, Integer> breakdown = new LinkedHashMap<>();

        try {
            JsonNode auditTypeJson = allocation.getAllocationByAuditType();
            if (auditTypeJson != null && !auditTypeJson.isNull() && auditTypeJson.isObject()) {
                auditTypeJson.fields().forEachRemaining(entry -> {
                    try {
                        breakdown.put(entry.getKey(), entry.getValue().asInt());
                    } catch (Exception e) {
                        // Skip non-integer values
                    }
                });
            }
        } catch (Exception e) {
            System.err.println("⚠️ Failed to parse audit type breakdown: " + e.getMessage());
        }

        return breakdown;
    }

    /**
     * Generate a globally unique case number: YEAR-PLANSHORT-REGION-TC-NNNN
     * PLANSHORT is first 8 chars of plan UUID to avoid cross-plan conflicts
     */
    private String generateCaseNumber(AnnualAuditPlanEntity plan, String region, String taxCenter, AtomicInteger counter) {
        String year = String.valueOf(plan.getYear());
        String planShort = plan.getId().toString().substring(0, 8);
        String seq = String.format("%04d", counter.getAndIncrement());
        return year + "-" + planShort + "-" + region + "-" + taxCenter + "-" + seq;
    }

    private List<PlanAllocationEntity> autoGenerateMissingTaxCenterAllocations(AnnualAuditPlanEntity plan, List<PlanAllocationEntity> existingAllocations) {
        if (existingAllocations != null && !existingAllocations.isEmpty()) {
            return existingAllocations;
        }
        List<PlanAllocationEntity> allAllocations = new ArrayList<>();
        Set<String> existingTcCodes = Collections.emptySet();
        
        Map<String, List<String>> regionToTaxCenters = Map.of(
            "FED", List.of("federal-lto1", "federal-lto2"),
            "AA", List.of("addis_ababa-tc1", "addis_ababa-tc2", "addis_ababa-tc3"),
            "BA", List.of("amhara-tc1", "amhara-tc2", "amhara-tc3"),
            "BB", List.of("oromia-tc1", "oromia-tc2", "oromia-tc3"),
            "AB", List.of("dire_dawa-tc1", "dire_dawa-tc2", "dire_dawa-tc3"),
            "CA", List.of("snnpr-tc1", "snnpr-tc2", "snnpr-tc3"),
            "SO", List.of("somali-tc1", "somali-tc2", "somali-tc3")
        );

        Map<String, String> regionCodeToDistKey = Map.of(
            "FED", "federal_level", "AA", "addis_ababa", "BA", "amhara",
            "BB", "oromia", "AB", "dire_dawa", "CA", "snnpr", "SO", "somali"
        );

        Map<String, Map<String, Integer>> distribution = plan.getDistribution();
        boolean createdNew = false;

        for (Map.Entry<String, List<String>> entry : regionToTaxCenters.entrySet()) {
            String regionCode = entry.getKey();
            List<String> tcCodes = entry.getValue();
            String distKey = regionCodeToDistKey.get(regionCode);

            Map<String, Integer> regionAuditTypes = null;
            if (distribution != null) {
                regionAuditTypes = distribution.get(distKey);
                if (regionAuditTypes == null) regionAuditTypes = distribution.get(regionCode);
            }

            if (regionAuditTypes == null || regionAuditTypes.isEmpty() || regionAuditTypes.values().stream().mapToInt(Integer::intValue).sum() == 0) {
                regionAuditTypes = Map.of(
                    "desk_audit", 15, "joint_audit", 5, "transfer_pricing", 5,
                    "comprehensive", 10, "issue_audit", 10
                );
            }

            int numTc = tcCodes.size();
            for (String tcCode : tcCodes) {
                if (existingTcCodes.contains(tcCode.toLowerCase())) {
                    continue; // Already has allocation
                }

                Map<String, Integer> tcBreakdown = new LinkedHashMap<>();
                int totalTcCount = 0;

                for (Map.Entry<String, Integer> atEntry : regionAuditTypes.entrySet()) {
                    int tcShare = Math.max(1, atEntry.getValue() / numTc);
                    tcBreakdown.put(atEntry.getKey(), tcShare);
                    totalTcCount += tcShare;
                }

                PlanAllocationEntity alloc = new PlanAllocationEntity();
                alloc.setId(UUID.randomUUID());
                alloc.setAnnualPlan(plan);
                alloc.setRegionCode(regionCode);
                alloc.setTaxCenterCode(tcCode);
                alloc.setProposedCount(totalTcCount);
                try {
                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    alloc.setAllocationByAuditType(mapper.valueToTree(tcBreakdown));
                } catch (Exception e) {
                    // Ignore
                }
                allocationRepository.save(alloc);
                allAllocations.add(alloc);
                createdNew = true;
            }
        }
        if (createdNew) {
            allocationRepository.flush();
        }
        return allAllocations;
    }
}
