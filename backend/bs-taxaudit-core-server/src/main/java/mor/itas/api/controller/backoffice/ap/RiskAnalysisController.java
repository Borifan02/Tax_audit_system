package mor.itas.api.controller.backoffice.ap;

import mor.itas.api.dto.response.ap.GenericResponse;
import mor.itas.api.dto.response.ap.RiskAnalysisResponse;
import mor.itas.application.port.inboundport.ap.RiskAnalysisPort;
import mor.itas.domain.model.ap.RiskAnalysis;
import mor.itas.persistence.mapper.ap.RiskAnalysisDtoMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * RiskAnalysisController - REST Controller for Risk Analysis
 * 
 * Provides endpoints for retrieving risk data needed by Planning Team dashboard.
 * 
 * REST Adapter for Risk Analysis:
 * - Depends on inbound port: RiskAnalysisPort
 * - Injects mapper: RiskAnalysisDtoMapper
 * - Converts domain models to response DTOs
 * 
 * Hexagonal/DDD: REST Adapter → Inbound Port → Use Case → Domain Services
 */
@RestController
@RequestMapping("/api/v1/planning")
@RequiredArgsConstructor
public class RiskAnalysisController {

    private final RiskAnalysisPort riskAnalysisPort;
    private final RiskAnalysisDtoMapper dtoMapper;

    /**
     * Get risk analysis data for plan creation
     * 
     * Endpoint: GET /api/v1/planning/risk-analysis
     * 
     * Returns national and regional risk data along with pre-computed plan defaults.
     * Used by Planning Team dashboard to display risk statistics and provide
     * default case distribution for audit plan creation.
     * 
     * Response: 200 OK with RiskAnalysisResponse
     * - source: "live" (from external APIs) or "estimated" (fallback)
     * - lastUpdated: timestamp when data was fetched
     * - national: National-level aggregates
     * - byRegion: Per-region breakdown
     * - planDefaults: Pre-computed case distribution
     * 
     * @return GenericResponse wrapping RiskAnalysisResponse
     */
    @GetMapping("/risk-analysis")
    public ResponseEntity<GenericResponse<RiskAnalysisResponse>> getRiskAnalysis() {
        try {
            // Get risk analysis from use case (via inbound port)
            RiskAnalysis riskAnalysis = riskAnalysisPort.getRiskAnalysis();

            // Map to response DTO
            RiskAnalysisResponse response = dtoMapper.toRiskAnalysisResponse(riskAnalysis);

            // Wrap in generic response and return
            return ResponseEntity.ok(GenericResponse.success(response));
        } catch (Exception e) {
            return ResponseEntity.ok(GenericResponse.error("RISK_ANALYSIS_ERROR", 
                    "Failed to retrieve risk analysis: " + e.getMessage()));
        }
    }
}
