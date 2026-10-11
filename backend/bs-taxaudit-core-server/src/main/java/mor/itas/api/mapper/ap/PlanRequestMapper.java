package mor.itas.api.mapper.ap;

import mor.itas.api.dto.request.ap.CreatePlanRequest;
import mor.itas.api.dto.request.ap.DivideAllocationRequest;
import mor.itas.application.usecase.ap.PlanManagementUseCase;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * PlanRequestMapper - Maps request DTOs to use case DTOs
 * Simplifies controller code by handling DTO conversions
 */
@Component
public class PlanRequestMapper {

    /**
     * Convert CreatePlanRequest to regional allocation DTOs
     */
    public List<PlanManagementUseCase.RegionalAllocationDto> toRegionalAllocations(
        CreatePlanRequest request) {

        return request.getRegionalAllocations()
            .stream()
            .map(r -> new PlanManagementUseCase.RegionalAllocationDto(
                r.getRegionCode(),
                r.getProposedCount()
            ))
            .collect(Collectors.toList());
    }

    /**
     * Convert DivideAllocationRequest to tax center allocation DTOs
     */
    public List<PlanManagementUseCase.TaxCenterAllocationDto> toTaxCenterAllocations(
        DivideAllocationRequest request) {

        return request.getTaxCenterAllocations()
            .stream()
            .map(t -> new PlanManagementUseCase.TaxCenterAllocationDto(
                t.getTaxCenterCode(),
                t.getAuditCount()
            ))
            .collect(Collectors.toList());
    }
}
