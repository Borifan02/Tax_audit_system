package mor.itas.application.usecase.ap;

import mor.itas.api.dto.response.ap.jac.AuditTrailEntryResponse;
import mor.itas.domain.service.ap.AuditTrailService;
import mor.itas.persistence.jpa.entity.ap.CommitteeAuditLogEntity;
import mor.itas.persistence.jpa.entity.ap.PlanAuditLogEntity;
import mor.itas.persistence.jpa.entity.tp.TpAuditActionHistoryEntity;
import mor.itas.persistence.jpa.repository.ap.CommitteeAuditLogRepository;
import mor.itas.persistence.jpa.repository.ap.PlanAuditLogJpaRepository;
import mor.itas.persistence.jpa.repository.tp.TpAuditActionHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.Data;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.time.OffsetDateTime;
import java.util.stream.Collectors;

/**
 * Use Case: Get Audit Trail
 * Unifies all compliance & governance audit logs across:
 * 1. Annual Audit Planning & Approvals (Planning Team, Directors, Senior Management)
 * 2. Audit Execution & Case Progression (Auditors, Team Leaders, Process Owners)
 * 3. Committee Deliberations & Governance (Joint Committee, Chair, Members)
 */
@Component
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class GetAuditTrailUseCase {
    private final CommitteeAuditLogRepository auditLogRepository;
    private final PlanAuditLogJpaRepository planAuditLogRepository;
    private final TpAuditActionHistoryRepository tpActionHistoryRepository;
    private final AuditTrailService auditTrailService;
    
    /**
     * Retrieve audit trail for a specific case or plan (paginated)
     */
    public Page<AuditTrailEntryResponse> getCaseAuditTrail(UUID caseId, Pageable pageable) {
        if (caseId == null) {
            throw new IllegalArgumentException("Case ID cannot be null");
        }

        List<AuditTrailEntryResponse> entries = new ArrayList<>();

        // 1. Audit Case Execution Actions (Auditor / Team Leader)
        try {
            List<TpAuditActionHistoryEntity> tpLogs = tpActionHistoryRepository.findByAuditCaseIdOrderByActionTimestampDesc(caseId);
            for (TpAuditActionHistoryEntity tp : tpLogs) {
                entries.add(fromTpHistory(tp));
            }
        } catch (Exception ignored) {}

        // 2. Annual Plan Actions (if caseId is a Plan ID)
        try {
            List<PlanAuditLogEntity> planLogs = planAuditLogRepository.findByAnnualPlanIdOrderByCreatedAtDesc(caseId);
            for (PlanAuditLogEntity pl : planLogs) {
                entries.add(fromPlanLog(pl));
            }
        } catch (Exception ignored) {}

        // 3. Committee Logs
        try {
            List<CommitteeAuditLogEntity> committeeLogs = auditLogRepository
                .findByCommitteeCaseEntityCaseIdOrderByActionTimestampDesc(caseId, Pageable.unpaged()).getContent();
            for (CommitteeAuditLogEntity cl : committeeLogs) {
                entries.add(fromCommitteeLog(cl));
            }
        } catch (Exception ignored) {}

        entries.sort(Comparator.comparing(AuditTrailEntryResponse::getActionTimestamp, Comparator.nullsLast(Comparator.reverseOrder())));

        int total = entries.size();
        int pageNum = pageable.getPageNumber();
        int pageSize = pageable.getPageSize();
        int start = Math.min(pageNum * pageSize, total);
        int end = Math.min(start + pageSize, total);

        return new PageImpl<>(entries.subList(start, end), pageable, total);
    }
    
    public Page<AuditTrailEntryResponse> getGlobalAuditTrail(String actionType, String actorIdStr, String taxCenter, Pageable pageable) {
        return getGlobalAuditTrail(actionType, actorIdStr, null, null, taxCenter, pageable);
    }

    /**
     * Retrieve global audit trail with optional filtering (paginated)
     * Collects all actions across Planning, Auditor Execution, and Governance
     */
    public Page<AuditTrailEntryResponse> getGlobalAuditTrail(String actionType, String actorIdStr, String category, String search, String taxCenter, Pageable pageable) {
        List<AuditTrailEntryResponse> allEntries = new ArrayList<>();

        // 1. Collect Planning Team & Director Actions (ap_plan_audit_logs)
        try {
            List<PlanAuditLogEntity> planLogs = planAuditLogRepository.findAllByOrderByCreatedAtDesc();
            for (PlanAuditLogEntity pl : planLogs) {
                allEntries.add(fromPlanLog(pl));
            }
        } catch (Exception e) {
            System.err.println("⚠️ Warning: Failed to fetch plan audit logs: " + e.getMessage());
        }

        // 2. Collect Auditor & Team Leader Execution Actions (tp_audit_action_history)
        try {
            List<TpAuditActionHistoryEntity> tpLogs = tpActionHistoryRepository.findAllByOrderByActionTimestampDesc();
            for (TpAuditActionHistoryEntity tp : tpLogs) {
                allEntries.add(fromTpHistory(tp));
            }
        } catch (Exception e) {
            System.err.println("⚠️ Warning: Failed to fetch TP audit action history: " + e.getMessage());
        }

        // 3. Collect Committee Governance Actions (t_committee_audit_log)
        try {
            List<CommitteeAuditLogEntity> committeeLogs = auditLogRepository.findAll();
            for (CommitteeAuditLogEntity cl : committeeLogs) {
                allEntries.add(fromCommitteeLog(cl));
            }
        } catch (Exception e) {
            System.err.println("⚠️ Warning: Failed to fetch committee audit logs: " + e.getMessage());
        }

        // Apply filters
        List<AuditTrailEntryResponse> filtered = allEntries.stream()
            .filter(entry -> {
                // Category filter
                if (category != null && !category.isBlank() && !category.equalsIgnoreCase("ALL")) {
                    if (entry.getCategory() == null || !entry.getCategory().equalsIgnoreCase(category.trim())) {
                        return false;
                    }
                }
                // Action Type filter
                if (actionType != null && !actionType.isBlank() && !actionType.equalsIgnoreCase("ALL")) {
                    if (entry.getActionType() == null || !entry.getActionType().equalsIgnoreCase(actionType.trim())) {
                        return false;
                    }
                }
                // Free text search filter
                if (search != null && !search.isBlank()) {
                    String q = search.trim().toLowerCase();
                    boolean match = (entry.getEntityId() != null && entry.getEntityId().toLowerCase().contains(q))
                            || (entry.getCaseId() != null && entry.getCaseId().toLowerCase().contains(q))
                            || (entry.getActorName() != null && entry.getActorName().toLowerCase().contains(q))
                            || (entry.getActorId() != null && entry.getActorId().toLowerCase().contains(q))
                            || (entry.getDescription() != null && entry.getDescription().toLowerCase().contains(q))
                            || (entry.getActionType() != null && entry.getActionType().toLowerCase().contains(q));
                    if (!match) {
                        return false;
                    }
                }
                // Actor ID filter
                if (actorIdStr != null && !actorIdStr.isBlank()) {
                    String query = actorIdStr.trim().toLowerCase();
                    boolean matchActorId = entry.getActorId() != null && entry.getActorId().toLowerCase().contains(query);
                    boolean matchActorName = entry.getActorName() != null && entry.getActorName().toLowerCase().contains(query);
                    if (!matchActorId && !matchActorName) {
                        return false;
                    }
                }
                return true;
            })
            .sorted(Comparator.comparing(AuditTrailEntryResponse::getActionTimestamp, Comparator.nullsLast(Comparator.reverseOrder())))
            .collect(Collectors.toList());

        int total = filtered.size();
        int pageNum = pageable.getPageNumber();
        int pageSize = pageable.getPageSize();
        int start = Math.min(pageNum * pageSize, total);
        int end = Math.min(start + pageSize, total);

        return new PageImpl<>(filtered.subList(start, end), pageable, total);
    }
    
    /**
     * Export audit trail as CSV bytes
     */
    public byte[] exportAuditTrail(UUID caseId, String format) {
        List<AuditTrailEntryResponse> logs;
        if (caseId != null) {
            logs = getCaseAuditTrail(caseId, Pageable.unpaged()).getContent();
        } else {
            logs = getGlobalAuditTrail(null, null, null, Pageable.unpaged()).getContent();
        }
        
        StringBuilder csv = new StringBuilder();
        csv.append("LogID,Category,EntityType,ReferenceID,ActorID,ActorName,ActorRole,ActionType,Description,Timestamp\n");
        for (AuditTrailEntryResponse log : logs) {
            csv.append(log.getLogId()).append(",")
               .append(escapeCsv(log.getCategory())).append(",")
               .append(escapeCsv(log.getEntityType())).append(",")
               .append(escapeCsv(log.getEntityId() != null ? log.getEntityId() : log.getCaseId())).append(",")
               .append(escapeCsv(log.getActorId())).append(",")
               .append(escapeCsv(log.getActorName())).append(",")
               .append(escapeCsv(log.getActorRole())).append(",")
               .append(escapeCsv(log.getActionType())).append(",")
               .append(escapeCsv(log.getDescription() != null ? log.getDescription() : log.getActionReason())).append(",")
               .append(log.getActionTimestamp()).append("\n");
        }
        return csv.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }
    
    private String escapeCsv(String val) {
        if (val == null) return "";
        return "\"" + val.replace("\"", "\"\"") + "\"";
    }

    private AuditTrailEntryResponse fromPlanLog(PlanAuditLogEntity entity) {
        String planRef = "Annual Audit Plan";
        String planIdStr = null;
        try {
            if (entity.getAnnualPlan() != null) {
                planRef = entity.getAnnualPlan().getName() != null
                    ? (entity.getAnnualPlan().getName() + " (FY " + entity.getAnnualPlan().getYear() + ")")
                    : ("Annual Plan " + entity.getAnnualPlan().getYear());
                planIdStr = entity.getAnnualPlan().getId() != null ? entity.getAnnualPlan().getId().toString() : null;
            }
        } catch (Exception ignored) {}

        Map<String, Object> stateMap = null;
        if (entity.getChangedFields() != null && !entity.getChangedFields().isEmpty()) {
            stateMap = new LinkedHashMap<>(entity.getChangedFields());
        }

        return AuditTrailEntryResponse.builder()
            .logId(entity.getId())
            .caseId(planIdStr)
            .entityId(planRef)
            .entityType("PLAN")
            .category("PLANNING & STRATEGY")
            .actorId(entity.getActorId())
            .actorName(resolveActorName(entity.getActorId(), entity.getActorRole()))
            .actorRole(entity.getActorRole() != null ? entity.getActorRole() : "PLANNING_TEAM")
            .actionType(entity.getAction())
            .description(entity.getReason() != null && !entity.getReason().isBlank() ? entity.getReason() : ("Plan action: " + entity.getAction()))
            .actionReason(entity.getReason())
            .beforeState(null)
            .afterState(stateMap)
            .actionTimestamp(entity.getCreatedAt())
            .actionHash(Integer.toHexString(Objects.hash(entity.getId(), entity.getAction(), entity.getCreatedAt())))
            .build();
    }

    private AuditTrailEntryResponse fromTpHistory(TpAuditActionHistoryEntity entity) {
        String caseRef = entity.getAuditCaseId() != null
            ? ("Case #" + entity.getAuditCaseId().toString().substring(0, 8).toUpperCase())
            : "Audit Case";
        try {
            if (entity.getAuditCase() != null && entity.getAuditCase().getCaseNumber() != null) {
                caseRef = entity.getAuditCase().getCaseNumber();
            }
        } catch (Exception ignored) {}
        String caseIdStr = entity.getAuditCaseId() != null ? entity.getAuditCaseId().toString() : null;

        Map<String, Object> beforeMap = entity.getBeforeStatus() != null ? Map.of("status", entity.getBeforeStatus()) : null;
        Map<String, Object> afterMap = entity.getAfterStatus() != null ? Map.of("status", entity.getAfterStatus()) : null;

        return AuditTrailEntryResponse.builder()
            .logId(entity.getId())
            .caseId(caseIdStr)
            .entityId(caseRef)
            .entityType("AUDIT_CASE")
            .category("AUDIT EXECUTION")
            .actorId(entity.getActorId())
            .actorName(resolveActorName(entity.getActorId(), entity.getActorRole()))
            .actorRole(entity.getActorRole() != null ? entity.getActorRole() : "AUDITOR")
            .actionType(entity.getActionType())
            .description(entity.getSummary() != null ? entity.getSummary() : entity.getActionType())
            .actionReason(entity.getSummary())
            .beforeState(beforeMap)
            .afterState(afterMap)
            .actionTimestamp(entity.getActionTimestamp())
            .actionHash(Integer.toHexString(Objects.hash(entity.getId(), entity.getActionType(), entity.getActionTimestamp())))
            .build();
    }

    private AuditTrailEntryResponse fromCommitteeLog(CommitteeAuditLogEntity entity) {
        String caseIdStr = entity.getCommitteeCaseEntity() != null ? entity.getCommitteeCaseEntity().getCaseId().toString() : null;
        String actorIdStr = entity.getActorId() != null ? entity.getActorId().toString() : "System";

        return AuditTrailEntryResponse.builder()
            .logId(entity.getLogId())
            .caseId(caseIdStr)
            .entityId(caseIdStr)
            .entityType("COMMITTEE")
            .category("GOVERNANCE & COMMITTEE")
            .actorId(actorIdStr)
            .actorName(resolveActorName(actorIdStr, "COMMITTEE_MEMBER"))
            .actorRole("COMMITTEE_MEMBER")
            .actionType(entity.getActionType())
            .description(entity.getActionReason() != null ? entity.getActionReason() : entity.getActionType())
            .actionReason(entity.getActionReason())
            .beforeState(entity.getBeforeState())
            .afterState(entity.getAfterState())
            .actionTimestamp(entity.getActionTimestamp())
            .actionHash(entity.getActionHash())
            .build();
    }

    private String resolveActorName(String actorId, String role) {
        if (actorId == null || actorId.isBlank()) return "System";
        String lower = actorId.toLowerCase();
        if (lower.contains("planning") || lower.equals("u-pt-01") || lower.equals("u-planning-1")) {
            return "Eden Haile (Planning Team)";
        }
        if (lower.equals("director_001") || lower.contains("audit_director") || lower.contains("director")) {
            return "Director of Audit";
        }
        if (lower.startsWith("u-aud-")) {
            return "Auditor (" + actorId + ")";
        }
        if (lower.startsWith("u-tl-")) {
            return "Team Leader (" + actorId + ")";
        }
        if (lower.startsWith("u-com-") || lower.startsWith("u-cc-") || lower.startsWith("u-cm-")) {
            return "Committee Member (" + actorId + ")";
        }
        return actorId;
    }
    
    /**
     * Legacy execute method for compatibility
     */
    public Page<AuditTrailResponse> execute(UUID caseId, Pageable pageable) {
        if (caseId == null) {
            throw new IllegalArgumentException("Case ID cannot be null");
        }
        Page<CommitteeAuditLogEntity> auditLogs = auditLogRepository.findByCommitteeCaseEntityCaseIdOrderByActionTimestampDesc(caseId, pageable);
        return auditLogs.map(this::toResponse);
    }
    
    /**
     * Legacy executeByActionType method for compatibility
     */
    public Page<AuditTrailResponse> executeByActionType(UUID caseId, String actionType, Pageable pageable) {
        if (caseId == null || actionType == null) {
            throw new IllegalArgumentException("Case ID and action type cannot be null");
        }
        Page<CommitteeAuditLogEntity> auditLogs = auditLogRepository.findByCaseIdAndActionType(
            caseId, actionType, pageable);
        return auditLogs.map(this::toResponse);
    }
    
    private AuditTrailResponse toResponse(CommitteeAuditLogEntity entity) {
        UUID logCaseId = entity.getCommitteeCaseEntity() != null ? entity.getCommitteeCaseEntity().getCaseId() : null;
        return AuditTrailResponse.builder()
            .logId(entity.getLogId())
            .caseId(logCaseId)
            .actorId(entity.getActorId())
            .actionType(entity.getActionType())
            .actionReason(entity.getActionReason())
            .actionTimestamp(entity.getActionTimestamp())
            .build();
    }
    
    @Data
    public static class AuditTrailResponse {
        private UUID logId;
        private UUID caseId;
        private UUID actorId;
        private String actionType;
        private String actionReason;
        private OffsetDateTime actionTimestamp;
        
        public static AuditTrailResponseBuilder builder() {
            return new AuditTrailResponseBuilder();
        }
        
        public static class AuditTrailResponseBuilder {
            private UUID logId;
            private UUID caseId;
            private UUID actorId;
            private String actionType;
            private String actionReason;
            private OffsetDateTime actionTimestamp;
            
            public AuditTrailResponseBuilder logId(UUID logId) {
                this.logId = logId;
                return this;
            }
            
            public AuditTrailResponseBuilder caseId(UUID caseId) {
                this.caseId = caseId;
                return this;
            }
            
            public AuditTrailResponseBuilder actorId(UUID actorId) {
                this.actorId = actorId;
                return this;
            }
            
            public AuditTrailResponseBuilder actionType(String actionType) {
                this.actionType = actionType;
                return this;
            }
            
            public AuditTrailResponseBuilder actionReason(String reason) {
                this.actionReason = reason;
                return this;
            }
            
            public AuditTrailResponseBuilder actionTimestamp(OffsetDateTime timestamp) {
                this.actionTimestamp = timestamp;
                return this;
            }
            
            public AuditTrailResponse build() {
                AuditTrailResponse response = new AuditTrailResponse();
                response.logId = this.logId;
                response.caseId = this.caseId;
                response.actorId = this.actorId;
                response.actionType = this.actionType;
                response.actionReason = this.actionReason;
                response.actionTimestamp = this.actionTimestamp;
                return response;
            }
        }
    }
}
