package mor.itas.api.mapper.ap;

import mor.itas.api.dto.response.ap.AllocationResponse;
import mor.itas.api.dto.response.ap.AuditLogResponse;
import mor.itas.api.dto.response.ap.PlanResponse;
import mor.itas.domain.model.ap.AnnualAuditPlan;
import mor.itas.domain.model.ap.PlanAllocation;
import mor.itas.domain.model.ap.PlanAuditLog;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * PlanResponseMapper - Maps domain models to response DTOs
 * Handles conversion of plans, allocations, and audit logs
 */
@Component
public class PlanResponseMapper {

    /**
     * Convert domain plan to response DTO
     */
    public PlanResponse toPlanResponse(AnnualAuditPlan plan) {
        if (plan == null) {
            return null;
        }

        PlanResponse response = new PlanResponse(
            plan.getId(),
            plan.getPlanYear(),
            plan.getPlanName(),
            plan.getStatus() != null ? plan.getStatus().name() : null,
            plan.getCreatedBy()
        );

        // Planning Team phase
        response.setCreatedAt(plan.getCreatedAt());

        // Director approval phase
        response.setSubmittedToDirectorBy(plan.getSubmittedToDirectorBy());
        response.setSubmittedToDirectorAt(plan.getSubmittedToDirectorAt());
        response.setDirectorApprovedBy(plan.getDirectorApprovedBy());
        response.setDirectorApprovedAt(plan.getDirectorApprovedAt());
        response.setDirectorApprovalReason(plan.getDirectorApprovalReason());

        // Regional director phase
        response.setSubmittedToRegionalBy(plan.getSubmittedToRegionalBy());
        response.setSubmittedToRegionalAt(plan.getSubmittedToRegionalAt());
        response.setRegionalDirectorApprovedBy(plan.getRegionalDirectorApprovedBy());
        response.setRegionalDirectorApprovedAt(plan.getRegionalDirectorApprovedAt());
        response.setRegionalDirectorApprovalReason(plan.getRegionalDirectorApprovalReason());

        // Tax center phase
        response.setSentToTaxCenterAt(plan.getSentToTaxCenterAt());

        // Distribution data
        response.setDistribution(plan.getDistribution());

        // Revenue data
        response.setEstimatedRevenue(plan.getEstimatedRevenue());
        response.setEstimatedRevenueDistribution(plan.getEstimatedRevenueDistribution());

        // Metadata
        response.setUpdatedAt(plan.getUpdatedAt());
        response.setVersion(plan.getVersion());

        // Separate allocations into regional and tax center
        List<AllocationResponse> regionalAllocations = plan.getAllocations()
            .stream()
            .filter(PlanAllocation::isRegionalAllocation)
            .map(this::toAllocationResponse)
            .collect(Collectors.toList());

        List<AllocationResponse> taxCenterAllocations = plan.getAllocations()
            .stream()
            .filter(PlanAllocation::isTaxCenterAllocation)
            .map(this::toAllocationResponse)
            .collect(Collectors.toList());

        response.setRegionalAllocations(regionalAllocations);
        response.setTaxCenterAllocations(taxCenterAllocations);

        return response;
    }

    /**
     * Convert domain allocation to response DTO
     */
    public AllocationResponse toAllocationResponse(PlanAllocation allocation) {
        if (allocation == null) {
            return null;
        }

        AllocationResponse response = new AllocationResponse(
            allocation.getId(),
            allocation.getPlanId(),
            allocation.getRegionCode(),
            allocation.getProposedCount()
        );

        response.setTaxCenterCode(allocation.getTaxCenterCode());
        response.setRegionalDividedCount(allocation.getRegionalDividedCount());
        response.setRegionalDivisionReason(allocation.getRegionalDivisionReason());
        response.setTcAdjustedCount(allocation.getTcAdjustedCount());
        response.setTcJustification(allocation.getTcJustification());
        response.setTcFeedbackSubmitted(allocation.getTcFeedbackSubmitted());
        response.setTcFeedbackSubmittedAt(allocation.getTcFeedbackSubmittedAt());
        response.setEffectiveCount(allocation.getEffectiveCount());
        response.setEstimatedRevenue(allocation.getEstimatedRevenue());
        response.setRevenueByAuditType(allocation.getRevenueByAuditType());
        response.setCreatedAt(allocation.getCreatedAt());
        response.setUpdatedAt(allocation.getUpdatedAt());

        // Set allocation type
        if (allocation.isRegionalAllocation()) {
            response.setAllocationType("REGIONAL");
        } else {
            response.setAllocationType("TAX_CENTER");
        }

        return response;
    }

    /**
     * Convert domain audit log to response DTO
     */
    public AuditLogResponse toAuditLogResponse(PlanAuditLog auditLog) {
        if (auditLog == null) {
            return null;
        }

        AuditLogResponse response = new AuditLogResponse(
            auditLog.getId(),
            auditLog.getPlanId(),
            auditLog.getAction(),
            auditLog.getActorId(),
            auditLog.getActorRole(),
            auditLog.getCreatedAt()
        );

        response.setReason(auditLog.getReason());
        response.setChangedFields(auditLog.getChangedFields());

        return response;
    }

    /**
     * Convert list of plans to response DTOs
     */
    public List<PlanResponse> toPlanResponses(List<AnnualAuditPlan> plans) {
        return plans.stream()
            .map(this::toPlanResponse)
            .collect(Collectors.toList());
    }

    /**
     * Convert list of allocations to response DTOs
     */
    public List<AllocationResponse> toAllocationResponses(List<PlanAllocation> allocations) {
        return allocations.stream()
            .map(this::toAllocationResponse)
            .collect(Collectors.toList());
    }

    /**
     * Convert list of audit logs to response DTOs
     */
    public List<AuditLogResponse> toAuditLogResponses(List<PlanAuditLog> auditLogs) {
        return auditLogs.stream()
            .map(this::toAuditLogResponse)
            .collect(Collectors.toList());
    }
}
