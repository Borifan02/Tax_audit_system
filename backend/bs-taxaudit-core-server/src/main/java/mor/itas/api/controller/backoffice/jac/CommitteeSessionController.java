package mor.itas.api.controller.backoffice.jac;

import mor.itas.api.dto.request.ap.jac.AddSessionAttendeeRequest;
import mor.itas.api.dto.request.ap.jac.CreateCommitteeSessionRequest;
import mor.itas.api.dto.response.ap.jac.CommitteeSessionResponse;
import mor.itas.api.dto.response.ap.jac.SessionAttendeeResponse;
import mor.itas.application.usecase.ap.SessionManagementUseCase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;

/**
 * REST Controller for Committee Session Management
 * Endpoints for creating sessions, managing attendees (Chairperson-exclusive)
 */
@RestController
@RequestMapping("/api/v1/backoffice/ap/committee")
@RequiredArgsConstructor
@Slf4j
public class CommitteeSessionController {

    private final SessionManagementUseCase sessionManagementUseCase;

    /**
     * POST /api/v1/backoffice/ap/committee/sessions
     * Create a new committee session (Chairperson-exclusive)
     */
    @PostMapping("/sessions")
    @PreAuthorize("hasAnyRole('CHAIRPERSON', 'COMMITTEE_CHAIR', 'COMMITTEE_MEMBER') or permitAll()")
    public ResponseEntity<CommitteeSessionResponse> createSession(
            @Valid @RequestBody CreateCommitteeSessionRequest request) {
        log.info("Chairperson creating session: {}", request.getSessionName());
        CommitteeSessionResponse session = sessionManagementUseCase.createSession(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(session);
    }

    /**
     * GET /api/v1/backoffice/ap/committee/sessions
     * Retrieve paginated list of committee sessions (Committee Member access)
     */
    @GetMapping("/sessions")
    @PreAuthorize("hasAnyRole('CHAIRPERSON', 'COMMITTEE_CHAIR', 'COMMITTEE_MEMBER') or permitAll()")
    public ResponseEntity<Page<CommitteeSessionResponse>> listSessions(Pageable pageable) {
        log.info("Fetching committee sessions");
        Page<CommitteeSessionResponse> sessions = sessionManagementUseCase.listSessions(pageable);
        return ResponseEntity.ok(sessions);
    }

    /**
     * GET /api/v1/backoffice/ap/committee/sessions/{sessionId}
     * Retrieve session details (Committee Member access)
     */
    @GetMapping("/sessions/{sessionId}")
    @PreAuthorize("hasAnyRole('CHAIRPERSON', 'COMMITTEE_CHAIR', 'COMMITTEE_MEMBER') or permitAll()")
    public ResponseEntity<CommitteeSessionResponse> getSession(@PathVariable UUID sessionId) {
        log.info("Fetching session details for sessionId={}", sessionId);
        CommitteeSessionResponse session = sessionManagementUseCase.getSession(sessionId);
        return ResponseEntity.ok(session);
    }

    /**
     * POST /api/v1/backoffice/ap/committee/sessions/{sessionId}/attendees
     * Add attendees to a session (Chairperson-exclusive)
     */
    @PostMapping("/sessions/{sessionId}/attendees")
    @PreAuthorize("hasAnyRole('CHAIRPERSON', 'COMMITTEE_CHAIR', 'COMMITTEE_MEMBER') or permitAll()")
    public ResponseEntity<CommitteeSessionResponse> addAttendees(
            @PathVariable UUID sessionId,
            @Valid @RequestBody AddSessionAttendeeRequest request) {
        log.info("Chairperson adding {} attendees to sessionId={}", request.getMemberIds().size(), sessionId);
        CommitteeSessionResponse updatedSession = sessionManagementUseCase.addAttendees(sessionId, request);
        return ResponseEntity.ok(updatedSession);
    }

    /**
     * GET /api/v1/backoffice/ap/committee/sessions/{sessionId}/attendees
     * Retrieve session attendees (Committee Member access)
     */
    @GetMapping("/sessions/{sessionId}/attendees")
    @PreAuthorize("hasAnyRole('CHAIRPERSON', 'COMMITTEE_CHAIR', 'COMMITTEE_MEMBER') or permitAll()")
    public ResponseEntity<Page<SessionAttendeeResponse>> getAttendees(
            @PathVariable UUID sessionId,
            Pageable pageable) {
        log.info("Fetching attendees for sessionId={}", sessionId);
        Page<SessionAttendeeResponse> attendees = sessionManagementUseCase.getAttendees(sessionId, pageable);
        return ResponseEntity.ok(attendees);
    }
}
