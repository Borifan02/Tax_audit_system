package mor.itas.domain.service.ap;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.OffsetDateTime;
import java.util.*;

/**
 * Domain Service for Immutable Audit Trail Logging
 * Logs all committee case actions immutably
 */
@Service
@RequiredArgsConstructor
public class AuditTrailService {

    private final static int RETENTION_YEARS = 7;

    /**
     * Log action to audit trail
     */
    public AuditLogEntry logAction(UUID caseId, UUID actorId, String actionType,
                                    Map<String, Object> beforeState,
                                    Map<String, Object> afterState) {
        if (caseId == null || actionType == null) {
            throw new IllegalArgumentException("Case ID and action type cannot be null");
        }

        String actionHash = generateHash(caseId, actorId, actionType, afterState);

        return new AuditLogEntry(
                UUID.randomUUID(),
                caseId,
                actorId,
                actionType,
                beforeState != null ? new LinkedHashMap<>(beforeState) : new LinkedHashMap<>(),
                afterState != null ? new LinkedHashMap<>(afterState) : new LinkedHashMap<>(),
                actionHash,
                OffsetDateTime.now()
        );
    }

    /**
     * Overloaded logAction with entity details
     */
    public AuditLogEntry logAction(UUID caseId, UUID actorId, String actionType,
                                    String entityType, String beforeState, String afterState, String comment) {
        Map<String, Object> before = new LinkedHashMap<>();
        if (beforeState != null) before.put("state", beforeState);
        if (entityType != null) before.put("entityType", entityType);

        Map<String, Object> after = new LinkedHashMap<>();
        if (afterState != null) after.put("state", afterState);
        if (comment != null) after.put("comment", comment);

        return logAction(caseId, actorId, actionType, before, after);
    }


    /**
     * Generate hash for audit log entry (for integrity verification)
     */
    public String generateHash(UUID caseId, UUID actorId, String actionType, Map<String, Object> state) {
        StringBuilder sb = new StringBuilder();
        sb.append(caseId).append("|");
        sb.append(actorId).append("|");
        sb.append(actionType).append("|");

        if (state != null) {
            state.entrySet().stream()
                    .sorted(Map.Entry.comparingByKey())
                    .forEach(e -> sb.append(e.getKey()).append("=").append(e.getValue()).append("|"));
        }

        return Integer.toHexString(sb.toString().hashCode());
    }

    /**
     * Verify audit log integrity
     */
    public boolean verifyIntegrity(AuditLogEntry entry) {
        if (entry == null) {
            return false;
        }

        String calculatedHash = generateHash(entry.getCaseId(), entry.getActorId(),
                entry.getActionType(), entry.getAfterState());

        return calculatedHash.equals(entry.getActionHash());
    }

    /**
     * Check if log entry is within retention period
     */
    public boolean isWithinRetentionPeriod(AuditLogEntry entry) {
        if (entry == null || entry.getActionTimestamp() == null) {
            return false;
        }

        OffsetDateTime retentionCutoff = OffsetDateTime.now().minusYears(RETENTION_YEARS);
        return entry.getActionTimestamp().isAfter(retentionCutoff);
    }

    /**
     * Get retention cutoff date (7 years ago)
     */
    public OffsetDateTime getRetentionCutoffDate() {
        return OffsetDateTime.now().minusYears(RETENTION_YEARS);
    }

    /**
     * Filter entries for archival (older than retention period)
     */
    public List<AuditLogEntry> getArchivalCandidates(List<AuditLogEntry> allEntries) {
        if (allEntries == null || allEntries.isEmpty()) {
            return Collections.emptyList();
        }

        List<AuditLogEntry> archivalCandidates = new ArrayList<>();
        OffsetDateTime cutoff = getRetentionCutoffDate();

        for (AuditLogEntry entry : allEntries) {
            if (entry.getActionTimestamp() != null && entry.getActionTimestamp().isBefore(cutoff)) {
                archivalCandidates.add(entry);
            }
        }

        return archivalCandidates;
    }

    /**
     * Immutable audit log entry
     */
    public static class AuditLogEntry {
        private final UUID logId;
        private final UUID caseId;
        private final UUID actorId;
        private final String actionType;
        private final Map<String, Object> beforeState;
        private final Map<String, Object> afterState;
        private final String actionHash;
        private final OffsetDateTime actionTimestamp;

        public AuditLogEntry(UUID logId, UUID caseId, UUID actorId, String actionType,
                             Map<String, Object> beforeState, Map<String, Object> afterState,
                             String actionHash, OffsetDateTime actionTimestamp) {
            this.logId = logId;
            this.caseId = caseId;
            this.actorId = actorId;
            this.actionType = actionType;
            this.beforeState = Collections.unmodifiableMap(beforeState != null ? beforeState : new HashMap<>());
            this.afterState = Collections.unmodifiableMap(afterState != null ? afterState : new HashMap<>());
            this.actionHash = actionHash;
            this.actionTimestamp = actionTimestamp;
        }

        public UUID getLogId() { return logId; }
        public UUID getCaseId() { return caseId; }
        public UUID getActorId() { return actorId; }
        public String getActionType() { return actionType; }
        public Map<String, Object> getBeforeState() { return beforeState; }
        public Map<String, Object> getAfterState() { return afterState; }
        public String getActionHash() { return actionHash; }
        public OffsetDateTime getActionTimestamp() { return actionTimestamp; }

        @Override
        public String toString() {
            return "AuditLogEntry{" +
                    "logId=" + logId +
                    ", caseId=" + caseId +
                    ", actorId=" + actorId +
                    ", actionType='" + actionType + '\'' +
                    ", actionTimestamp=" + actionTimestamp +
                    '}';
        }
    }
}
