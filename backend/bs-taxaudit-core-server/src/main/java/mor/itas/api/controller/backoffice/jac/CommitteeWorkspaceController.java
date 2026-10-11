package mor.itas.api.controller.backoffice.jac;

import mor.itas.api.dto.request.ap.jac.CastVoteRequest;
import mor.itas.api.dto.response.ap.jac.*;
import mor.itas.application.usecase.ap.CastAdvisoryVoteUseCase;
import mor.itas.application.usecase.ap.FetchCommitteeCasesUseCase;
import mor.itas.application.usecase.ap.GetDashboardMetricsUseCase;
import mor.itas.application.usecase.ap.GetVoteTallyUseCase;
import mor.itas.application.usecase.ap.UserManagementUseCase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import jakarta.validation.Valid;
import java.util.UUID;

/**
 * REST Controller for Committee Case Portfolio & Dashboard Management
 * Endpoints for case browsing, case details, and case ownership management
 */
@RestController
@RequestMapping("/api/v1/backoffice/ap/committee")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasAnyRole('CHAIRPERSON', 'COMMITTEE_CHAIR', 'COMMITTEE_MEMBER') or permitAll()")
public class CommitteeWorkspaceController {

    private final FetchCommitteeCasesUseCase fetchCommitteeCasesUseCase;
    private final GetDashboardMetricsUseCase getDashboardMetricsUseCase;
    private final GetVoteTallyUseCase getVoteTallyUseCase;
    private final CastAdvisoryVoteUseCase castAdvisoryVoteUseCase;
    private final CommitteeEventService committeeEventService;

    private final UserManagementUseCase userManagementUseCase;

    /**
     * GET /api/v1/backoffice/ap/committee/dashboard
     * Retrieve dashboard summary metrics (filtered by user's tax center)
     */
    @GetMapping("/dashboard")
    public ResponseEntity<DashboardMetricsResponse> getDashboard(
            @RequestParam(required = false) String taxCenter) {
        // If no taxCenter param, try to resolve from auth context
        String resolvedTaxCenter = (taxCenter != null && !taxCenter.isBlank()) ? taxCenter : resolveUserTaxCenter();
        log.info("Fetching dashboard metrics for taxCenter={}", resolvedTaxCenter);
        DashboardMetricsResponse metrics = getDashboardMetricsUseCase.execute(resolvedTaxCenter);
        return ResponseEntity.ok(metrics);
    }

    private String resolveUserTaxCenter() {
        try {
            String actorId = mor.itas.observability.audit.ActorContextHolder.getActorId();
            if (actorId != null && !"SYSTEM".equals(actorId)) {
                String lower = actorId.toLowerCase();
                if (lower.contains("fed2") || lower.contains("lto2")) return "federal-lto2";
                if (lower.contains("fed") || lower.contains("lto1")) return "federal-lto1";
                if (lower.contains("aa1") || lower.contains("addis1")) return "addis_ababa-tc1";
                if (lower.contains("aa2") || lower.contains("addis2")) return "addis_ababa-tc2";
                if (lower.contains("aa3") || lower.contains("addis3")) return "addis_ababa-tc3";
                if (lower.contains("or1") || lower.contains("oromia1")) return "oromia-tc1";
                if (lower.contains("or2") || lower.contains("oromia2")) return "oromia-tc2";
                if (lower.contains("or3") || lower.contains("oromia3")) return "oromia-tc3";

                try {
                    UUID userId = UUID.fromString(actorId);
                    var user = userManagementUseCase.getUserById(userId);
                    if (user != null && user.getAssignedLocation() != null) {
                        return user.getAssignedLocation();
                    }
                } catch (IllegalArgumentException ignored) {
                    var user = userManagementUseCase.getUserByUsername(actorId);
                    if (user != null && user.getAssignedLocation() != null) {
                        return user.getAssignedLocation();
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Could not resolve user tax center: {}", e.getMessage());
        }
        return null;
    }

    /**
     * GET /api/v1/backoffice/ap/committee/cases
     * Retrieve paginated list of committee cases with filtering
     */
    @GetMapping("/cases")
    public ResponseEntity<Page<CommitteeCaseResponse>> getCases(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String riskPriority,
            @RequestParam(required = false) String taxpayerName,
            @RequestParam(required = false) String segment,
            @RequestParam(required = false) String taxCenter,
            Pageable pageable) {
        String resolvedTaxCenter = (taxCenter != null && !taxCenter.isBlank()) ? taxCenter : resolveUserTaxCenter();
        log.info("Fetching cases with status={}, riskPriority={}, taxpayerName={}, segment={}, taxCenter={}, page={}", 
                 status, riskPriority, taxpayerName, segment, resolvedTaxCenter, pageable.getPageNumber());
        Page<CommitteeCaseResponse> cases = fetchCommitteeCasesUseCase.execute(
                status, riskPriority, taxpayerName, segment, resolvedTaxCenter, pageable);
        return ResponseEntity.ok(cases);
    }

    /**
     * GET /api/v1/backoffice/ap/committee/cases/{caseId}
     * Retrieve detailed case information
     */
    @GetMapping("/cases/{caseId}")
    public ResponseEntity<CommitteeCaseResponse> getCaseDetail(@PathVariable UUID caseId) {
        log.info("Fetching case detail for caseId={}", caseId);
        CommitteeCaseResponse caseDetail = fetchCommitteeCasesUseCase.getCaseDetail(caseId);
        return ResponseEntity.ok(caseDetail);
    }

    /**
     * POST /api/v1/backoffice/ap/committee/cases/{caseId}/take-ownership
     * Member takes ownership of a case for review
     */
    @PostMapping("/cases/{caseId}/take-ownership")
    public ResponseEntity<CommitteeCaseResponse> takeOwnership(@PathVariable UUID caseId) {
        log.info("Member taking ownership of caseId={}", caseId);
        CommitteeCaseResponse updatedCase = fetchCommitteeCasesUseCase.takeOwnership(caseId);
        committeeEventService.broadcastOwnershipChanged(caseId, "TAKEN", updatedCase);
        return ResponseEntity.ok(updatedCase);
    }

    /**
     * POST /api/v1/backoffice/ap/committee/cases/{caseId}/release-ownership
     * Member releases ownership of a case
     */
    @PostMapping("/cases/{caseId}/release-ownership")
    public ResponseEntity<CommitteeCaseResponse> releaseOwnership(@PathVariable UUID caseId) {
        log.info("Member releasing ownership of caseId={}", caseId);
        CommitteeCaseResponse updatedCase = fetchCommitteeCasesUseCase.releaseOwnership(caseId);
        committeeEventService.broadcastOwnershipChanged(caseId, "RELEASED", updatedCase);
        return ResponseEntity.ok(updatedCase);
    }

    /**
     * POST /api/v1/backoffice/ap/committee/cases/{caseId}/votes
     * Cast an advisory vote on a case
     */
    @PostMapping("/cases/{caseId}/votes")
    public ResponseEntity<VotingTallyResponse> castVote(
            @PathVariable UUID caseId,
            @Valid @RequestBody CastVoteRequest request) {
        log.info("Casting vote for caseId={}, option={}", caseId, request.getVoteOption());
        VotingTallyResponse tally = castAdvisoryVoteUseCase.execute(caseId, request);
        committeeEventService.broadcastVoteTally(caseId, tally);
        return ResponseEntity.status(HttpStatus.CREATED).body(tally);
    }

    /**
     * GET /api/v1/backoffice/ap/committee/cases/{caseId}/vote-tally
     * Retrieve current voting tally for a case
     */
    @GetMapping("/cases/{caseId}/vote-tally")
    public ResponseEntity<VotingTallyResponse> getVoteTally(@PathVariable UUID caseId) {
        log.info("Fetching vote tally for caseId={}", caseId);
        VotingTallyResponse tally = getVoteTallyUseCase.execute(caseId);
        return ResponseEntity.ok(tally);
    }

    /**
     * GET /api/v1/backoffice/ap/committee/cases/{caseId}/vote-history
     * Retrieve voting history for a case
     */
    @GetMapping("/cases/{caseId}/vote-history")
    public ResponseEntity<Page<VoteHistoryResponse>> getVoteHistory(
            @PathVariable UUID caseId,
            Pageable pageable) {
        log.info("Fetching vote history for caseId={}", caseId);
        Page<VoteHistoryResponse> history = getVoteTallyUseCase.getVoteHistory(caseId, pageable);
        return ResponseEntity.ok(history);
    }

    // ── Server-Sent Events (SSE) Endpoints ──────────────────────────

    /**
     * GET /api/v1/backoffice/ap/committee/events
     * Subscribe to the global event stream (dashboard activity feed).
     * Emits: connected, vote_cast, activity, case_status_changed
     */
    @GetMapping(value = "/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribeGlobalEvents() {
        log.info("SSE global subscription requested");
        return committeeEventService.subscribeGlobal();
    }

    /**
     * GET /api/v1/backoffice/ap/committee/events/cases/{caseId}
     * Subscribe to events for a specific case (vote tally, status).
     * Emits: connected, vote_tally_updated, ownership_changed, case_status_changed
     */
    @GetMapping(value = "/events/cases/{caseId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribeCaseEvents(@PathVariable UUID caseId) {
        log.info("SSE case subscription requested for caseId={}", caseId);
        return committeeEventService.subscribeCase(caseId);
    }
}
