package mor.itas.api.dto.request.qa;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.Map;

/**
 * {@code POST /api/qa/cases/{id}/workflow} and
 * {@code POST /api/v1/backoffice/qa/cases/{caseId}/workflow} — the single
 * workflow entry point for FR-04.9.2-03 → -13.
 *
 * Every action is authorised and state-guarded server-side; the role checks the
 * frontend performs are advisory only.
 *
 * Supported actions, mapped to their SoR clause:
 *   SUBMIT_ACTION_PLAN             -03  QA team submits the review action plan
 *   APPROVE_ACTION_PLAN            -03  TL / process owner approves it
 *   REJECT_ACTION_PLAN             -03  TL / process owner rejects it
 *   START_REVIEW                   -04  audit team reviews the case, determines action
 *   SUBMIT_TO_TL                   -05  QA officer submits execution for approval
 *   RETURN_TO_OFFICER              -05  TL / process owner returns it for correction
 *   GENERATE_DRAFT_REPORT          -05  QA team generates the draft quality review report
 *   SUBMIT_REPORT_TO_TL            -06  QA team submits report + recommendations
 *   APPROVE_REPORT                 -06  TL / process owner reviews report & recommendations
 *   RETURN_REPORT                  -06  TL / process owner returns the report
 *   ISSUE_DEFICIENCY_NOTICE        -06  formal deficiency notice served on the audit team
 *   SUBMIT_AUDIT_RESPONSE          -04  audit team submits remediation
 *   DRAFT_EXIT_AGENDA              -07  QA team drafts the exit-conference agenda
 *   SUBMIT_AUDIT_AGENDA            -08  audit team drafts its own agenda
 *   APPROVE_EXIT_AGENDA            -09  TL / process owner approves the draft agenda
 *   REJECT_EXIT_AGENDA             -09  TL / process owner rejects the draft agenda
 *   SCHEDULE_EXIT_CONFERENCE       -09  QA team schedules and sends the schedule
 *   RECORD_EXIT_CONFERENCE         -10  QA team records the conference outcome
 *   ADJUST_REPORT                  -10  QA team adjusts the report from those inputs
 *   APPROVE_ADJUSTED_REPORT        -10  TL / process owner approves the adjusted report
 *   DETERMINE_FOLLOW_UP            -11  TL / process owner determines follow-up action(s)
 *   RECOMMEND_FOR_DIRECTOR_SIGNOFF -11  QA team leader escalates to the Director
 *   DIRECTOR_CERTIFY_COMPLIANT     -13  Director certifies quality compliance
 *   DIRECTOR_ORDER_REAUDIT         -12  Director mandates a full re-audit
 *   VERIFY_RECOMMENDATIONS         -13  TL / PO checks whether recommendations were addressed
 *   CLOSE_REVIEW                   -13  close the review (guarded on -13 verification)
 */
@Data
public class QaWorkflowRequest {

    @NotBlank
    private String action;

    private String comment;

    private String statutoryOrder;

    /** Optional payload for actions that carry structured data. */
    private Map<String, Object> payload;
}
