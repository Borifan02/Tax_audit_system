package mor.itas.api.dto.request.qa;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Assignment, action-plan, follow-up and closure payloads
 * (FR-04.9.2-02, -03, -11, -12, -13).
 */
public final class QaGovernanceRequests {

    private QaGovernanceRequests() {}

    /**
     * FR-04.9.2-02 — assign the review to the QA team.
     * Every field is optional: anything omitted is resolved from the configured
     * auto-assignment criteria, anything supplied wins (manual override).
     */
    @Data
    public static class AssignmentRequest {
        private String qaOfficerId;
        private String qaTeamLeaderId;
        private String qaDirectorId;
        private LocalDate dueDate;
        private String reason;
    }

    /** FR-04.9.2-03 — QA team prepares and submits the review action plan. */
    @Data
    public static class PlanSubmitRequest {
        private String planTitle;
        @NotBlank
        private String objectives;
        @NotBlank
        private String reviewScope;
        private String reviewMethodology;
        private List<String> riskFocusAreas;
        private List<Map<String, Object>> checklistItems;
        private Integer sampleSize;
        private String sampleCriteria;
    }

    /** FR-04.9.2-03 — TL / process owner approves or rejects the action plan. */
    @Data
    public static class PlanReviewRequest {
        @NotBlank
        private String decision;
        private String comments;
    }

    /**
     * FR-04.9.2-11 / -12 — the follow-up actions the TL / process owner determines.
     *
     * {@code actionKind} must be one of:
     *   PROCEDURAL_ADJUSTMENT   -12(i)
     *   STAKEHOLDER_NOTIFICATION-12(ii)
     *   DISCIPLINARY_ACTION     -12(iii)
     *   RE_AUDIT_ORDER          mandated re-audit
     */
    @Data
    public static class FollowUpDecisionRequest {
        @NotBlank
        private List<FollowUpItem> actions;

        @Data
        public static class FollowUpItem {
            @NotBlank
            private String actionKind;
            @NotBlank
            private String title;
            private String narrative;
            private String targetActorId;
            private String targetDepartment;
            private LocalDate dueDate;
            /** -12(ii) — notify the pertinent stakeholders. Defaults to true. */
            private Boolean notify;
        }
    }

    /** FR-04.9.2-12 — progress on an already-determined follow-up action. */
    @Data
    public static class FollowUpProgressRequest {
        @NotBlank
        private String status;
        private String completionEvidence;
        private String comment;
    }

    /** FR-04.9.2-13 — raise a formal recommendation against the audit team. */
    @Data
    public static class RecommendationRequest {
        @NotBlank
        private String recommendation;
        private String assignedTo;
        private LocalDate deadline;
        private List<String> linkedDeficiencyIds;
    }

    /** FR-04.9.2-13 — record the audit team's remediation evidence. */
    @Data
    public static class RecommendationResolveRequest {
        /** IN_PROGRESS | ACCEPTED_RESOLVED | NOT_ADDRESSED | DISPUTED */
        @NotBlank
        private String status;
        private String evidenceOfCorrection;
        private String comment;
    }

    /**
     * FR-04.9.2-13 — "enable audit team leader / process owner to check whether the
     * audit team addressed recommendations of the quality assurance team or not".
     */
    @Data
    public static class ClosureCheckRequest {
        @NotNull
        private Boolean addressed;
        private String closureNote;
        /** When true the review is closed in the same call if it is closable. */
        private Boolean closeReview;
    }
}
