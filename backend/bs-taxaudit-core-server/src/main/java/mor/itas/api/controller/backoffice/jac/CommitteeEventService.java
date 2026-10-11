package mor.itas.api.controller.backoffice.jac;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Service for managing Server-Sent Events (SSE) connections.
 * Broadcasts real-time committee events to connected clients:
 *   - vote_cast: Vote tally updated for a case
 *   - ownership_changed: Case ownership taken or released
 *   - research_note_added: New research note on a case
 *   - case_status_changed: Case lifecycle state transition
 *   - auditor_nominated: New auditor nomination
 *   - activity: Generic activity stream event
 *
 * Connection model:
 *   - All clients connect to /events (global dashboard stream)
 *   - Per-case clients connect to /events/cases/{caseId} (case-specific stream)
 *   - Emitters auto-clean on completion or error
 */
@Service
@Slf4j
public class CommitteeEventService {

    private static final long SSE_TIMEOUT = 30 * 60 * 1000L; // 30 minutes

    /** Global subscribers (dashboard activity stream) */
    private final List<SseEmitter> globalEmitters = new CopyOnWriteArrayList<>();

    /** Per-case subscribers (vote tally, case status) */
    private final Map<UUID, List<SseEmitter>> caseEmitters = new ConcurrentHashMap<>();

    // ── Subscription Management ──────────────────────────────────────

    /**
     * Subscribe to the global event stream (dashboard activity).
     */
    public SseEmitter subscribeGlobal() {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);
        globalEmitters.add(emitter);
        log.info("SSE global subscriber added. Total: {}", globalEmitters.size());

        emitter.onCompletion(() -> {
            globalEmitters.remove(emitter);
            log.info("SSE global subscriber removed (completion). Total: {}", globalEmitters.size());
        });
        emitter.onTimeout(() -> {
            globalEmitters.remove(emitter);
            log.info("SSE global subscriber removed (timeout). Total: {}", globalEmitters.size());
        });
        emitter.onError(e -> {
            globalEmitters.remove(emitter);
            log.warn("SSE global subscriber removed (error): {}", e.getMessage());
        });

        // Send initial connection confirmation
        try {
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data(Map.of("status", "connected", "stream", "global")));
        } catch (IOException e) {
            globalEmitters.remove(emitter);
            log.warn("Failed to send SSE connection confirmation: {}", e.getMessage());
        }

        return emitter;
    }

    /**
     * Subscribe to events for a specific case (vote tally, status).
     */
    public SseEmitter subscribeCase(UUID caseId) {
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);
        caseEmitters.computeIfAbsent(caseId, k -> new CopyOnWriteArrayList<>()).add(emitter);
        log.info("SSE subscriber added for caseId={}. Total for case: {}",
                caseId, caseEmitters.get(caseId).size());

        emitter.onCompletion(() -> {
            List<SseEmitter> emitters = caseEmitters.get(caseId);
            if (emitters != null) {
                emitters.remove(emitter);
                if (emitters.isEmpty()) caseEmitters.remove(caseId);
            }
            log.info("SSE subscriber removed for caseId={} (completion)", caseId);
        });
        emitter.onTimeout(() -> {
            List<SseEmitter> emitters = caseEmitters.get(caseId);
            if (emitters != null) {
                emitters.remove(emitter);
                if (emitters.isEmpty()) caseEmitters.remove(caseId);
            }
            log.info("SSE subscriber removed for caseId={} (timeout)", caseId);
        });
        emitter.onError(e -> {
            List<SseEmitter> emitters = caseEmitters.get(caseId);
            if (emitters != null) {
                emitters.remove(emitter);
                if (emitters.isEmpty()) caseEmitters.remove(caseId);
            }
            log.warn("SSE subscriber removed for caseId={} (error): {}", caseId, e.getMessage());
        });

        // Send initial connection confirmation
        try {
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data(Map.of("status", "connected", "stream", "case", "caseId", caseId.toString())));
        } catch (IOException e) {
            List<SseEmitter> emitters = caseEmitters.get(caseId);
            if (emitters != null) {
                emitters.remove(emitter);
                if (emitters.isEmpty()) caseEmitters.remove(caseId);
            }
            log.warn("Failed to send SSE case connection confirmation: {}", e.getMessage());
        }

        return emitter;
    }

    // ── Event Broadcasting ───────────────────────────────────────────

    /**
     * Broadcast an event to all global subscribers.
     *
     * @param eventName SSE event name (e.g. "vote_cast", "activity")
     * @param data      event payload
     */
    public void broadcastGlobal(String eventName, Object data) {
        SseEmitter.SseEventBuilder event = SseEmitter.event()
                .name(eventName)
                .data(data);

        globalEmitters.removeIf(emitter -> {
            try {
                emitter.send(event);
                return false;
            } catch (IOException e) {
                log.warn("Failed to send SSE global event '{}': {}", eventName, e.getMessage());
                return true; // remove broken emitter
            }
        });
    }

    /**
     * Broadcast an event to all subscribers of a specific case.
     *
     * @param caseId    the case ID
     * @param eventName SSE event name (e.g. "vote_tally_updated")
     * @param data      event payload
     */
    public void broadcastToCase(UUID caseId, String eventName, Object data) {
        List<SseEmitter> emitters = caseEmitters.get(caseId);
        if (emitters == null || emitters.isEmpty()) return;

        SseEmitter.SseEventBuilder event = SseEmitter.event()
                .name(eventName)
                .data(data);

        emitters.removeIf(emitter -> {
            try {
                emitter.send(event);
                return false;
            } catch (IOException e) {
                log.warn("Failed to send SSE case event '{}' to caseId={}: {}", eventName, caseId, e.getMessage());
                return true; // remove broken emitter
            }
        });
    }

    /**
     * Broadcast a vote tally update to both global and case-specific subscribers.
     */
    public void broadcastVoteTally(UUID caseId, Object tallyData) {
        broadcastToCase(caseId, "vote_tally_updated", tallyData);
        broadcastGlobal("vote_cast", Map.of(
                "caseId", caseId.toString(),
                "tally", tallyData
        ));
    }

    /**
     * Broadcast an ownership change to both global and case-specific subscribers.
     */
    public void broadcastOwnershipChanged(UUID caseId, String action, Object caseData) {
        broadcastToCase(caseId, "ownership_changed", Map.of(
                "caseId", caseId.toString(),
                "action", action,
                "case", caseData
        ));
        broadcastGlobal("activity", Map.of(
                "type", "ownership",
                "action", action,
                "caseId", caseId.toString(),
                "timestamp", java.time.OffsetDateTime.now().toString()
        ));
    }

    /**
     * Broadcast a research note addition to global subscribers.
     */
    public void broadcastResearchNoteAdded(UUID caseId, Object noteData) {
        broadcastToCase(caseId, "research_note_added", noteData);
        broadcastGlobal("activity", Map.of(
                "type", "research",
                "action", "Research note added",
                "caseId", caseId.toString(),
                "timestamp", java.time.OffsetDateTime.now().toString()
        ));
    }

    /**
     * Broadcast a case status change to global subscribers.
     */
    public void broadcastCaseStatusChanged(UUID caseId, String oldStatus, String newStatus) {
        broadcastToCase(caseId, "case_status_changed", Map.of(
                "caseId", caseId.toString(),
                "oldStatus", oldStatus,
                "newStatus", newStatus,
                "timestamp", java.time.OffsetDateTime.now().toString()
        ));
        broadcastGlobal("activity", Map.of(
                "type", "status_change",
                "action", "Status changed: " + oldStatus + " → " + newStatus,
                "caseId", caseId.toString(),
                "timestamp", java.time.OffsetDateTime.now().toString()
        ));
    }

    /**
     * Broadcast an auditor nomination event.
     */
    public void broadcastAuditorNominated(UUID caseId, Object nominationData) {
        broadcastToCase(caseId, "auditor_nominated", nominationData);
        broadcastGlobal("activity", Map.of(
                "type", "nomination",
                "action", "Auditor nominated",
                "caseId", caseId.toString(),
                "timestamp", java.time.OffsetDateTime.now().toString()
        ));
    }

    /**
     * Broadcast a case assignment event (team leader → auditor).
     * Notifies the assigned auditor via the global event stream.
     */
    public void broadcastCaseAssigned(UUID caseId, String auditorId, String teamLeaderId, Object caseData) {
        // Notify the specific auditor via global stream (auditor subscribes to global)
        broadcastGlobal("case_assigned", Map.of(
                "caseId", caseId.toString(),
                "auditorId", auditorId,
                "teamLeaderId", teamLeaderId,
                "case", caseData,
                "timestamp", java.time.OffsetDateTime.now().toString()
        ));
        // Also broadcast as generic activity
        broadcastGlobal("activity", Map.of(
                "type", "assignment",
                "action", "Case assigned to auditor",
                "caseId", caseId.toString(),
                "auditorId", auditorId,
                "timestamp", java.time.OffsetDateTime.now().toString()
        ));
    }

    // ── Stats ────────────────────────────────────────────────────────

    public int getGlobalSubscriberCount() {
        return globalEmitters.size();
    }

    public int getCaseSubscriberCount(UUID caseId) {
        List<SseEmitter> emitters = caseEmitters.get(caseId);
        return emitters != null ? emitters.size() : 0;
    }
}
