package mor.itas.application.usecase.ap;

import mor.itas.api.dto.request.ap.jac.AddSessionAttendeeRequest;
import mor.itas.api.dto.request.ap.jac.CreateCommitteeSessionRequest;
import mor.itas.api.dto.response.ap.jac.CommitteeSessionResponse;
import mor.itas.api.dto.response.ap.jac.SessionAttendeeResponse;
import mor.itas.observability.audit.ActorContextHolder;
import mor.itas.persistence.jpa.entity.ap.CommitteeSessionEntity;
import mor.itas.persistence.jpa.entity.ap.SessionAttendeeEntity;
import mor.itas.persistence.jpa.repository.ap.CommitteeSessionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Use Case: Committee Session Management
 * Handles creation, retrieval, and attendee management of committee sessions
 */
@Component
@RequiredArgsConstructor
@Transactional
@Slf4j
public class SessionManagementUseCase {

    private final CommitteeSessionRepository sessionRepository;

    public CommitteeSessionResponse createSession(CreateCommitteeSessionRequest request) {
        log.info("Creating committee session: {}", request.getSessionName());

        UUID chairpersonId;
        try {
            chairpersonId = UUID.fromString(ActorContextHolder.getActorId());
        } catch (Exception e) {
            chairpersonId = UUID.nameUUIDFromBytes("CHAIRPERSON".getBytes());
        }

        String agenda = request.getAgenda() != null && !request.getAgenda().trim().isEmpty()
            ? request.getAgenda().trim()
            : "General committee review and deliberation session";

        String location = request.getLocation() != null && !request.getLocation().trim().isEmpty()
            ? request.getLocation().trim()
            : "Committee Conference Room / Virtual";

        CommitteeSessionEntity session = CommitteeSessionEntity.builder()
            .sessionName(request.getSessionName().trim())
            .agenda(agenda)
            .scheduledDate(request.getScheduledDate() != null
                ? request.getScheduledDate().atOffset(java.time.ZoneOffset.UTC)
                : OffsetDateTime.now().plusDays(7))
            .location(location)
            .status("SCHEDULED")
            .chairpersonId(chairpersonId)
            .attendees(new ArrayList<>())
            .build();

        session = sessionRepository.save(session);
        log.info("Session created: {}", session.getSessionId());
        return toResponse(session);
    }

    @Transactional(readOnly = true)
    public Page<CommitteeSessionResponse> listSessions(Pageable pageable) {
        log.info("Listing committee sessions");
        return sessionRepository.findByOrderByScheduledDateDesc(pageable)
            .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public CommitteeSessionResponse getSession(UUID sessionId) {
        log.info("Retrieving session: {}", sessionId);
        CommitteeSessionEntity session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));
        return toResponse(session);
    }

    public CommitteeSessionResponse addAttendees(UUID sessionId, AddSessionAttendeeRequest request) {
        log.info("Adding {} attendees to session: {}", request.getMemberIds().size(), sessionId);
        CommitteeSessionEntity session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        for (UUID memberId : request.getMemberIds()) {
            boolean alreadyAdded = session.getAttendees().stream()
                .anyMatch(a -> a.getMemberId().equals(memberId));
            if (!alreadyAdded) {
                SessionAttendeeEntity attendee = SessionAttendeeEntity.builder()
                    .sessionEntity(session)
                    .memberId(memberId)
                    .attendanceStatus("PENDING")
                    .build();
                session.getAttendees().add(attendee);
            }
        }

        session = sessionRepository.save(session);
        return toResponse(session);
    }

    @Transactional(readOnly = true)
    public Page<SessionAttendeeResponse> getAttendees(UUID sessionId, Pageable pageable) {
        log.info("Retrieving attendees for session: {}", sessionId);
        CommitteeSessionEntity session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));

        List<SessionAttendeeResponse> allAttendees = session.getAttendees().stream()
            .map(this::toAttendeeResponse)
            .toList();

        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), allAttendees.size());
        List<SessionAttendeeResponse> page = start < allAttendees.size()
            ? allAttendees.subList(start, end)
            : List.of();

        return new org.springframework.data.domain.PageImpl<>(page, pageable, allAttendees.size());
    }

    private CommitteeSessionResponse toResponse(CommitteeSessionEntity session) {
        return CommitteeSessionResponse.builder()
            .sessionId(session.getSessionId())
            .sessionName(session.getSessionName())
            .agenda(session.getAgenda())
            .scheduledDate(session.getScheduledDate() != null
                ? session.getScheduledDate().toLocalDateTime()
                : null)
            .location(session.getLocation())
            .status(session.getStatus())
            .actualStartTime(session.getActualStartTime())
            .actualEndTime(session.getActualEndTime())
            .build();
    }

    private SessionAttendeeResponse toAttendeeResponse(SessionAttendeeEntity attendee) {
        return SessionAttendeeResponse.builder()
            .attendeeId(attendee.getAttendeeId())
            .memberId(attendee.getMemberId())
            .memberName("Member " + attendee.getMemberId().toString().substring(0, 8))
            .attendanceStatus(attendee.getAttendanceStatus())
            .confirmedAt(attendee.getConfirmedAt())
            .attendedAt(attendee.getAttendedAt())
            .build();
    }
}
