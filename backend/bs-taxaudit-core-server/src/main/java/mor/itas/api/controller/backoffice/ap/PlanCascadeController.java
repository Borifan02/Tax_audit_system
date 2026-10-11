package mor.itas.api.controller.backoffice.ap;

import mor.itas.api.dto.response.ap.GenericResponse;
import mor.itas.application.usecase.ap.CascadePlanToCasesUseCase;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * PlanCascadeController - REST endpoint for Plan → Case cascade
 * 
 * Converts tax center allocations into actual audit cases
 * by fetching taxpayers and applying risk engine classification.
 */
@RestController
@RequestMapping("/api/v1/backoffice/ap")
@RequiredArgsConstructor
public class PlanCascadeController {
    
    private final CascadePlanToCasesUseCase cascadePlanToCasesUseCase;
    
    /**
     * Cascade a finalized plan to audit cases
     * 
     * Endpoint: POST /api/v1/backoffice/ap/plans/{planId}/cascade-to-cases
     * 
     * For each tax center allocation:
     * 1. Fetches taxpayers from registration system
     * 2. Risk engine classifies each taxpayer
     * 3. Creates audit cases based on allocation counts
     */
    @PostMapping("/plans/{planId}/cascade-to-cases")
    public ResponseEntity<GenericResponse<Map<String, Object>>> cascadeToCases(
        @PathVariable String planId,
        @RequestHeader(value = "X-Actor-Id", required = false) String actorId,
        @RequestBody(required = false) Map<String, Object> body) {
        
        try {
            UUID planUUID = UUID.fromString(planId);
            @SuppressWarnings("unchecked")
            List<String> auditTypes = body != null ? (List<String>) body.get("auditTypes") : null;
            String taxCenterCode = body != null ? (String) body.get("taxCenterCode") : null;
            Map<String, Object> result = cascadePlanToCasesUseCase.cascade(planUUID, actorId, auditTypes, taxCenterCode);
            return ResponseEntity.ok(GenericResponse.success(result));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.ok(GenericResponse.error("INVALID_INPUT", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.ok(GenericResponse.error("INVALID_STATE", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.ok(GenericResponse.error("CASCADE_ERROR", "Failed to cascade plan: " + e.getMessage()));
        }
    }
}
