package mor.itas.api.controller.backoffice.ap;

import mor.itas.application.port.inboundport.ap.PlanQueryPort;
import mor.itas.domain.model.ap.AnnualAuditPlan;
import mor.itas.persistence.jpa.entity.ap.RegionalFeedbackEntity;
import mor.itas.persistence.jpa.entity.ap.AnnualAuditPlanEntity;
import mor.itas.persistence.jpa.repository.ap.RegionalFeedbackRepository;
import mor.itas.persistence.jpa.repository.ap.AnnualAuditPlanJpaRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.Data;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.time.OffsetDateTime;
import mor.itas.persistence.mapper.ap.ApResponseDtoMapper;
import mor.itas.api.dto.response.ap.PlanResponse;
import mor.itas.api.dto.response.ap.GenericResponse;

/**
 * Plan Query REST Controller
 * 
 * REST Adapter for Plan Query use cases.
 * Depends on inbound ports (PlanQueryPort), not directly on use cases.
 * This is the driving adapter - converts HTTP to domain operations.
 * 
 * Hexagonal/DDD: REST Controller is an adapter that uses inbound ports
 */
@RestController
@RequestMapping("/api/v1/backoffice/ap/plans")
@RequiredArgsConstructor
public class PlanQueryController {

    private final PlanQueryPort planQueryPort;
    private final ApResponseDtoMapper dtoMapper;
    private final RegionalFeedbackRepository regionalFeedbackRepository;
    private final AnnualAuditPlanJpaRepository planJpaRepository;
    private final ObjectMapper objectMapper;

    /**
     * 7.1 Get all plans with optional filters
     */
    @GetMapping
    public ResponseEntity<GenericResponse<Object>> getPlans(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String fiscalYear,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        List<AnnualAuditPlan> plans = planQueryPort.getPlans(status, 
            fiscalYear != null ? Integer.parseInt(fiscalYear) : null, page, size);
        
        var plansResponse = plans.stream()
            .map(dtoMapper::toPlanResponse)
            .toList();
        
        // Enrich each plan with regionalFeedback (submitted + defaults)
        plansResponse.forEach(this::enrichPlanWithRegionalFeedback);
        
        return ResponseEntity.ok(GenericResponse.success(plansResponse, plansResponse.size(), (long) plansResponse.size()));
    }

    /**
     * Enrich a PlanResponse with regionalFeedback:
     * - Submitted regions: actual feedback data
     * - Pending regions: plan distribution defaults
     */
    private void enrichPlanWithRegionalFeedback(PlanResponse response) {
        if (response == null || response.getId() == null) return;
        
        Map<String, Object> regionalFeedback = new HashMap<>();
        List<String> allRegionCodes = Arrays.asList("FED", "AA", "BA", "BB", "AB", "CA", "SO");
        
        // Map backend codes ↔ frontend IDs
        Map<String, String> codeToId = Map.of(
            "FED", "federal_level",
            "AA", "addis_ababa", "BA", "amhara", "BB", "oromia",
            "AB", "dire_dawa", "CA", "snnpr", "SO", "somali"
        );
        
        // Get submitted feedback from database
        List<RegionalFeedbackEntity> submittedFeedback = regionalFeedbackRepository
            .findByPlanId(response.getId());
        Map<String, RegionalFeedbackEntity> submittedMap = new HashMap<>();
        for (RegionalFeedbackEntity fb : submittedFeedback) {
            submittedMap.put(fb.getRegionId(), fb);
        }
        
        // Get distribution (may use backend codes OR frontend IDs)
        Map<String, Map<String, Integer>> dist = response.getDistribution();
        if (dist == null) dist = new HashMap<>();
        
        for (String regionCode : allRegionCodes) {
            String frontendId = codeToId.getOrDefault(regionCode, regionCode);
            RegionalFeedbackEntity submitted = submittedMap.get(regionCode);
            
            if (submitted != null) {
                try {
                    Map<String, Object> feedbackData = objectMapper.readValue(
                        submitted.getFeedbackText(), Map.class);
                    regionalFeedback.put(regionCode, Map.of(
                        "status", "submitted",
                        "feedback", feedbackData,
                        "submittedBy", submitted.getSubmittedBy() != null ? submitted.getSubmittedBy() : "",
                        "submittedAt", submitted.getSubmittedAt() != null ? submitted.getSubmittedAt().toString() : ""
                    ));
                } catch (Exception e) {
                    regionalFeedback.put(regionCode, Map.of("status", "submitted", "feedback", submitted.getFeedbackText()));
                }
            } else {
                // Try both backend code and frontend ID to find distribution
                Map<String, Integer> regionDist = dist.get(regionCode);
                if (regionDist == null) regionDist = dist.get(frontendId);
                if (regionDist == null) regionDist = new HashMap<>();
                
                Map<String, Object> defaultFeedback = new HashMap<>();
                for (Map.Entry<String, Integer> entry : regionDist.entrySet()) {
                    defaultFeedback.put(entry.getKey(), Map.of(
                        "totalRequested", entry.getValue(),
                        "totalCapacity", entry.getValue(),
                        "totalGap", 0,
                        "gapPercentage", 0.0
                    ));
                }
                
                regionalFeedback.put(regionCode, Map.of(
                    "status", "pending",
                    "feedback", defaultFeedback,
                    "isDefault", true
                ));
            }
        }
        
        response.setRegionalFeedback(regionalFeedback);
    }

    /**
     * 7.2 Get plan by ID
     */
    @GetMapping("/{planId}")
    public ResponseEntity<GenericResponse<PlanResponse>> getPlanById(@PathVariable UUID planId) {
        AnnualAuditPlan plan = planQueryPort.getPlanById(planId);
        PlanResponse response = dtoMapper.toPlanResponse(plan);
        return ResponseEntity.ok(GenericResponse.success(response));
    }

    /**
     * 7.3 Get regional allocations for a plan
     */
    @GetMapping("/{planId}/regional-allocations")
    public ResponseEntity<GenericResponse<Object>> getRegionalAllocations(@PathVariable UUID planId) {
        List<?> allocations = planQueryPort.getRegionalAllocations(planId);
        return ResponseEntity.ok(GenericResponse.success(allocations));
    }

    /**
     * 7.4 Get tax center allocations for a plan
     */
    @GetMapping("/{planId}/tax-center-allocations")
    public ResponseEntity<GenericResponse<Object>> getTaxCenterAllocations(@PathVariable UUID planId) {
        List<?> allocations = planQueryPort.getTaxCenterAllocations(planId);
        return ResponseEntity.ok(GenericResponse.success(allocations));
    }

    /**
     * 7.5 Get tax center allocations by region
     */
    @GetMapping("/{planId}/tax-center-allocations/region/{regionCode}")
    public ResponseEntity<GenericResponse<Object>> getTaxCenterAllocationsByRegion(
            @PathVariable UUID planId,
            @PathVariable String regionCode) {
        List<?> allocations = planQueryPort.getTaxCenterAllocationsByRegion(planId, regionCode);
        return ResponseEntity.ok(GenericResponse.success(allocations));
    }

    /**
     * 7.6 Get audit log for a plan
     */
    @GetMapping("/{planId}/audit-log")
    public ResponseEntity<GenericResponse<Object>> getAuditLog(@PathVariable UUID planId) {
        List<?> auditLog = planQueryPort.getAuditLog(planId);
        return ResponseEntity.ok(GenericResponse.success(auditLog));
    }

    /**
     * 7.7 Get plan statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<GenericResponse<Object>> getPlanStatistics() {
        Map<String, Long> stats = planQueryPort.getPlanStatistics();
        return ResponseEntity.ok(GenericResponse.success(stats));
    }

    /**
     * 7.8 Get plans for a specific region (Regional Director view)
     * Only returns plans with allocations for that region
     */
    @GetMapping("/region/{regionCode}")
    public ResponseEntity<GenericResponse<Object>> getPlansByRegion(
            @PathVariable String regionCode) {
        
        List<AnnualAuditPlan> plans = planQueryPort.getPlansByRegion(regionCode);
        
        var plansResponse = plans.stream()
            .map(dtoMapper::toPlanResponse)
            .toList();
        
        return ResponseEntity.ok(GenericResponse.success(plansResponse, plansResponse.size(), (long) plansResponse.size()));
    }

    // ==================== REQUEST DTOs ====================

    @Data
    static class GetPlansResponse {
        private int count;
        private long total;
        private Object plans;

        public GetPlansResponse(int count, long total, Object plans) {
            this.count = count;
            this.total = total;
            this.plans = plans;
        }
    }
}
