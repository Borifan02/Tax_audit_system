package mor.itas.api.controller.backoffice.jac;

import mor.itas.api.dto.response.ap.jac.AuditTrailEntryResponse;
import mor.itas.application.usecase.ap.GetAuditTrailUseCase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.UUID;

/**
 * REST Controller for Audit Trail Queries
 * Endpoints for retrieving immutable audit logs for compliance and audit purposes
 */
@RestController
@RequestMapping("/api/v1/backoffice/ap/committee")
@RequiredArgsConstructor
@Slf4j
public class CommitteeAuditTrailController {

    private final GetAuditTrailUseCase getAuditTrailUseCase;

    /**
     * GET /api/v1/backoffice/ap/committee/cases/{caseId}/audit-trail
     * Retrieve audit trail for a specific case
     */
    @GetMapping("/cases/{caseId}/audit-trail")
    public ResponseEntity<Page<AuditTrailEntryResponse>> getCaseAuditTrail(
            @PathVariable UUID caseId,
            Pageable pageable) {
        log.info("Fetching audit trail for caseId={}", caseId);
        Page<AuditTrailEntryResponse> auditTrail = getAuditTrailUseCase.getCaseAuditTrail(caseId, pageable);
        return ResponseEntity.ok(auditTrail);
    }

    /**
     * GET /api/v1/backoffice/ap/committee/audit-trail
     * Retrieve global audit trail for committee cases (filtered by tax center)
     */
    @GetMapping("/audit-trail")
    public ResponseEntity<Page<AuditTrailEntryResponse>> getGlobalAuditTrail(
            @RequestParam(required = false) String actionType,
            @RequestParam(required = false) String actorId,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String taxCenter,
            Pageable pageable) {
        log.info("Fetching global audit trail with actionType={}, actorId={}, category={}, search={}, taxCenter={}",
                actionType, actorId, category, search, taxCenter);
        Page<AuditTrailEntryResponse> auditTrail = getAuditTrailUseCase.getGlobalAuditTrail(
                actionType, actorId, category, search, taxCenter, pageable);
        return ResponseEntity.ok(auditTrail);
    }

    /**
     * GET /api/v1/backoffice/ap/committee/audit-trail/export
     * Export audit trail to CSV for external compliance systems
     */
    @GetMapping("/audit-trail/export")
    public ResponseEntity<byte[]> exportAuditTrail(
            @RequestParam(required = false) UUID caseId,
            @RequestParam(required = false) String format) {
        log.info("Exporting audit trail for caseId={}, format={}", caseId, format);
        byte[] exportData = getAuditTrailUseCase.exportAuditTrail(caseId, format);
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=audit-trail.csv")
                .body(exportData);
    }
}
