package mor.itas.api.controller.backoffice.ap;

import mor.itas.api.dto.response.ap.GenericResponse;
import mor.itas.application.usecase.ap.CascadePlanToCasesUseCase;
import mor.itas.persistence.jpa.entity.ap.AnnualAuditPlanEntity;
import mor.itas.persistence.jpa.entity.ap.ApAuditCaseEntity;
import mor.itas.persistence.jpa.entity.ap.PlanAllocationEntity;
import mor.itas.persistence.jpa.repository.ap.AnnualAuditPlanJpaRepository;
import mor.itas.persistence.jpa.repository.ap.ApAuditCaseRepository;
import mor.itas.persistence.jpa.repository.ap.PlanAllocationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * TaxCenterCasesController - Returns audit cases for a specific tax center
 * 
 * After the plan → case cascade, this endpoint provides the cases
 * that belong to a specific tax center, grouped by audit type with risk scores.
 */
@RestController
@RequestMapping("/api/v1/backoffice/ap/tax-center")
@RequiredArgsConstructor
public class TaxCenterCasesController {
    
    private final ApAuditCaseRepository auditCaseRepository;
    private final PlanAllocationRepository allocationRepository;
    private final AnnualAuditPlanJpaRepository planRepository;
    private final CascadePlanToCasesUseCase cascadePlanToCasesUseCase;
    private final mor.itas.application.usecase.ap.UserManagementUseCase userManagementUseCase;
    
    /**
     * Get all audit cases for a tax center
     * 
     * Endpoint: GET /api/v1/backoffice/ap/tax-center/cases?taxCenterCode=federal-lto1
     */
    @GetMapping("/cases")
    public ResponseEntity<GenericResponse<Map<String, Object>>> getTaxCenterCases(
        @RequestParam String taxCenterCode,
        @RequestParam(defaultValue = "200") int limit,
        @RequestParam(defaultValue = "0") int offset) {
        
        try {
            List<String> tcVariants = getTaxCenterVariants(taxCenterCode);
            List<ApAuditCaseEntity> tcCases = new ArrayList<>();

            for (String variant : tcVariants) {
                tcCases.addAll(auditCaseRepository.findByTaxCenterCode(variant));
            }

            // If zero cases found for this tax center and database has no cases at all, attempt initial cascade
            if (tcCases.isEmpty() && auditCaseRepository.count() == 0) {
                List<AnnualAuditPlanEntity> plans = planRepository.findAll();
                if (!plans.isEmpty()) {
                    AnnualAuditPlanEntity latestPlan = plans.stream()
                        .max(Comparator.comparing(AnnualAuditPlanEntity::getCreatedAt))
                        .orElse(plans.get(0));

                    System.err.println("⚡ Auto-triggering plan cascade for " + taxCenterCode + " on plan " + latestPlan.getId());
                    cascadePlanToCasesUseCase.cascade(latestPlan.getId(), "SYSTEM");

                    // Query again after cascade
                    for (String variant : tcVariants) {
                        tcCases.addAll(auditCaseRepository.findByTaxCenterCode(variant));
                    }
                }
            }
            
            // Deduplicate by case ID
            tcCases = tcCases.stream()
                .collect(Collectors.toMap(ApAuditCaseEntity::getId, c -> c, (c1, c2) -> c1))
                .values()
                .stream()
                .collect(Collectors.toList());

            // Collect all plan IDs
            Set<UUID> planIds = tcCases.stream()
                .map(ApAuditCaseEntity::getPlanId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

            // Group by audit type
            Map<String, Integer> countByAuditType = new LinkedHashMap<>();
            for (ApAuditCaseEntity c : tcCases) {
                String auditType = c.getAuditType() != null ? c.getAuditType() : "UNKNOWN";
                countByAuditType.merge(auditType, 1, Integer::sum);
            }
            
            // Group by audit type and sort each by risk score
            Map<String, List<ApAuditCaseEntity>> byType = tcCases.stream()
                .collect(Collectors.groupingBy(
                    c -> c.getAuditType() != null ? c.getAuditType() : "UNKNOWN",
                    LinkedHashMap::new,
                    Collectors.toList()
                ));
            byType.values().forEach(list -> 
                list.sort(Comparator.comparing(c -> c.getRiskScore() != null ? c.getRiskScore() : 0, Comparator.reverseOrder())));
            
            int paginatedTotal = tcCases.size();
            List<ApAuditCaseEntity> paginated = new ArrayList<>();
            if (limit > 0 && paginatedTotal > 0) {
                // True round-robin interleaving across audit types
                List<List<ApAuditCaseEntity>> typeLists = new ArrayList<>(byType.values());
                int[] idx = new int[typeLists.size()];
                while (paginated.size() < limit) {
                    boolean added = false;
                    for (int t = 0; t < typeLists.size(); t++) {
                        if (paginated.size() >= limit) break;
                        if (idx[t] < typeLists.get(t).size()) {
                            paginated.add(typeLists.get(t).get(idx[t]++));
                            added = true;
                        }
                    }
                    if (!added) break;
                }
            }
            int end = Math.min(offset + limit, paginatedTotal);
            if (offset > 0 && offset < paginated.size()) {
                paginated = new ArrayList<>(paginated.subList(offset, Math.min(offset + limit, paginated.size())));
            } else if (limit < paginated.size()) {
                paginated = new ArrayList<>(paginated.subList(0, limit));
            }
            
            // Build response
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("taxCenterCode", taxCenterCode);
            result.put("planIds", planIds.stream().map(UUID::toString).collect(Collectors.toList()));
            result.put("totalCases", paginatedTotal);
            result.put("casesByAuditType", countByAuditType);
            result.put("offset", offset);
            result.put("limit", limit);
            result.put("hasMore", end < paginatedTotal);
            result.put("cases", paginated.stream()
                .map(c -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", c.getId().toString());
                    m.put("planId", c.getPlanId() != null ? c.getPlanId().toString() : null);
                    m.put("caseNumber", c.getCaseNumber());
                    m.put("taxpayerId", c.getTaxpayerId());
                    m.put("taxpayerName", c.getTaxpayerName() != null ? c.getTaxpayerName() : c.getTaxpayerId());
                    m.put("sector", c.getSector());
                    m.put("auditType", c.getAuditType());
                    m.put("riskScore", c.getRiskScore());
                    m.put("status", c.getStatus());
                    m.put("assignedTeamLeaderId", c.getAssignedTeamLeaderId());
                    m.put("assignedTeamLeaderName", resolveUserDisplayName(c.getAssignedTeamLeaderId()));
                    m.put("assignedAuditorId", c.getAssignedAuditorId());
                    m.put("assignedAuditorName", resolveUserDisplayName(c.getAssignedAuditorId()));
                    m.put("estimatedRevenue", c.getEstimatedRevenue());
                    String cn = c.getCaseNumber();
                    m.put("planYear", cn != null && cn.contains("-") ? cn.substring(0, cn.indexOf("-")) : null);
                    return m;
                })
                .collect(Collectors.toList()));
            result.put("status", tcCases.isEmpty() ? "NO_CASES" : "CASES_READY");
            result.put("message", tcCases.isEmpty()
                ? "No cases yet. Run plan cascade first."
                : tcCases.size() + " audit cases ready for assignment");
            
            return ResponseEntity.ok(GenericResponse.success(result));
            
        } catch (Exception e) {
            return ResponseEntity.ok(GenericResponse.error("ERROR", "Failed to fetch cases: " + e.getMessage()));
        }
    }

    private List<String> getTaxCenterVariants(String code) {
        return CaseManagementController.getTaxCenterVariants(code);
    }

    private String resolveUserDisplayName(String identifier) {
        if (identifier == null || identifier.isBlank()) return null;
        if (identifier.endsWith("-committee")) {
            String type = identifier.replace("-committee", "").toUpperCase();
            return switch (type) {
                case "JOINT" -> "Joint Audit Committee";
                case "TP", "TRANSFER" -> "Transfer Pricing Committee";
                case "DESK" -> "Desk Audit Committee";
                case "COMP" -> "Comprehensive Audit Committee";
                case "ISSUE" -> "Issue Audit Committee";
                default -> type + " Committee";
            };
        }
        if (userManagementUseCase != null) {
            try {
                for (mor.itas.domain.model.ap.User u : userManagementUseCase.getAllUsers()) {
                    boolean match = (u.getUsername() != null && u.getUsername().equalsIgnoreCase(identifier))
                                 || (u.getUserId() != null && u.getUserId().toString().equalsIgnoreCase(identifier))
                                 || (u.getEmail() != null && u.getEmail().equalsIgnoreCase(identifier));
                    if (match) {
                        return u.getFullName();
                    }
                }
            } catch (Exception ignored) {}
        }
        if (identifier.startsWith("u-tl-") || identifier.startsWith("u-aud-")) {
            String[] parts = identifier.split("-");
            if (parts.length >= 4) {
                boolean isTl = parts[1].equals("tl");
                String role = isTl ? "TL" : "Auditor";
                String type = parts[parts.length - 2].toUpperCase();
                String num = parts[parts.length - 1];
                StringBuilder tcB = new StringBuilder();
                for (int i = 2; i < parts.length - 2; i++) {
                    if (tcB.length() > 0) tcB.append(" ");
                    tcB.append(parts[i].replace("_", " ").toUpperCase());
                }
                String tc = tcB.toString();
                return type + " " + role + "-" + num + (tc.isEmpty() ? "" : " (" + tc + ")");
            }
        }
        return identifier;
    }
}
