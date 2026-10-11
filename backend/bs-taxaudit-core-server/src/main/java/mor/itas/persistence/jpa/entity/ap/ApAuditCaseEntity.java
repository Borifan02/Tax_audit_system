package mor.itas.persistence.jpa.entity.ap;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import mor.itas.persistence.jpa.entity.tp.*;
import mor.itas.persistence.jpa.entity.da.*;
import mor.itas.persistence.jpa.entity.ca.*;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * ApAuditCaseEntity - JPA Entity for ap_audit_cases table
 * Represents audit cases generated from finalized annual audit plans.
 *
 * Status lifecycle:
 *   PENDING_ASSIGNMENT → ASSIGNED_TO_TEAM_LEADER (or ASSIGNED_TO_COMMITTEE for Joint/TP)
 *   ASSIGNED_TO_TEAM_LEADER → IN_PROGRESS (after team leader allocates to auditor)
 *   IN_PROGRESS → COMPLETED
 */
@Entity
@Table(name = "ap_audit_cases", indexes = {
    @Index(name = "idx_ap_audit_cases_plan_id", columnList = "plan_id"),
    @Index(name = "idx_ap_audit_cases_status", columnList = "status"),
    @Index(name = "idx_ap_audit_cases_auditor", columnList = "assigned_auditor_id"),
    @Index(name = "idx_ap_audit_cases_team_leader", columnList = "assigned_team_leader_id"),
    @Index(name = "idx_ap_audit_cases_case_number", columnList = "case_number"),
    @Index(name = "idx_ap_audit_cases_tax_center", columnList = "tax_center_code"),
    @Index(name = "idx_ap_audit_cases_region", columnList = "region_code"),
    @Index(name = "idx_ap_audit_cases_audit_type", columnList = "audit_type"),
    @Index(name = "idx_ap_audit_cases_tc_status", columnList = "tax_center_code, status"),
    @Index(name = "idx_ap_audit_cases_tl_status", columnList = "assigned_team_leader_id, status")
})
@Getter
@Setter
@AllArgsConstructor
@Builder
public class ApAuditCaseEntity {

    // ── Status constants ──────────────────────────────────────────────────────
    /** Newly created — not yet assigned to anyone */
    public static final String STATUS_PENDING_ASSIGNMENT      = "PENDING_ASSIGNMENT";
    /** Assigned to a desk / comprehensive / issue team leader */
    public static final String STATUS_ASSIGNED_TO_TEAM_LEADER = "ASSIGNED_TO_TEAM_LEADER";
    /** Assigned to joint-audit or transfer-pricing committee */
    public static final String STATUS_ASSIGNED_TO_COMMITTEE   = "ASSIGNED_TO_COMMITTEE";
    /** Team leader has further allocated to a specific auditor */
    public static final String STATUS_IN_PROGRESS             = "IN_PROGRESS";
    /** Committee has approved planning meeting and issued statutory mandate */
    public static final String STATUS_PLANNING_TRIGGERED      = "PLANNING_TRIGGERED";
    /** Assigned to committee or team leader — awaiting auditor assignment */
    public static final String STATUS_WAITING_ASSIGNMENT      = "WAITING_ASSIGNMENT";
    /** Audit execution finished */
    public static final String STATUS_COMPLETED               = "COMPLETED";

    @Id
    @Builder.Default
    private UUID id = UUID.randomUUID();

    @Column(nullable = false, name = "plan_id")
    private UUID planId;

    @Column(name = "allocation_id")
    private UUID allocationId;

    /** Direct denormalized reference — avoids join via allocation table */
    @Column(length = 64, name = "tax_center_code")
    private String taxCenterCode;

    @Column(length = 10, name = "region_code")
    private String regionCode;

    @Column(nullable = false, length = 32, name = "case_number", unique = true)
    private String caseNumber;

    /** TIN / taxpayer registration number */
    @Column(nullable = false, length = 64, name = "taxpayer_id")
    private String taxpayerId;

    /** Human-readable taxpayer name for display (denormalized from taxpayer service) */
    @Column(length = 256, name = "taxpayer_name")
    private String taxpayerName;

    /** Business sector (denormalized) */
    @Column(length = 128, name = "sector")
    private String sector;

    @Column(length = 32, name = "audit_type")
    private String auditType;

    @Column(length = 16, name = "risk_priority")
    private String riskPriority;

    @Column(name = "risk_score")
    private Integer riskScore;

    @Column(length = 32, name = "segment")
    private String segment;

    @Column(name = "estimated_revenue")
    private Long estimatedRevenue;

    @Column(nullable = false, length = 32, name = "status")
    @Builder.Default
    private String status = STATUS_PENDING_ASSIGNMENT;

    /**
     * For DESK / COMPREHENSIVE / ISSUE: holds the team leader's userId.
     * For JOINT_AUDIT / TRANSFER_PRICING: holds the committee member's userId.
     */
    @Column(length = 64, name = "assigned_team_leader_id")
    private String assignedTeamLeaderId;

    @Column(name = "committee_id", columnDefinition = "UUID")
    private UUID committeeId;

    @Column(length = 64, name = "assigned_auditor_id")
    private String assignedAuditorId;

    @Column(name = "handoff_at")
    private OffsetDateTime handoffAt;

    @Column(length = 64, name = "handoff_by")
    private String handoffBy;

    @Column(name = "handoff_comment", columnDefinition = "TEXT")
    private String handoffComment;

    @Column(name = "assigned_at")
    private OffsetDateTime assignedAt;

    @Column(length = 64, name = "assigned_by")
    private String assignedBy;

    @Column(nullable = false, length = 64, name = "created_by")
    private String createdBy;

    @Column(nullable = false, name = "created_at")
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "started_at")
    private OffsetDateTime startedAt;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    // ── TP-Specific Child Entities (Changed to OneToMany to avoid N+1 issue) ──
    @JsonIgnore
    @Builder.Default
    @OneToMany(mappedBy = "auditCase", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private java.util.List<TpRiskAssessmentEntity> tpRiskAssessments = new java.util.ArrayList<>();

    @JsonIgnore
    @Builder.Default
    @OneToMany(mappedBy = "auditCase", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private java.util.List<TpWorkingHypothesisEntity> tpWorkingHypotheses = new java.util.ArrayList<>();

    @JsonIgnore
    @Builder.Default
    @OneToMany(mappedBy = "auditCase", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private java.util.List<TpAuditPlanEntity> tpAuditPlans = new java.util.ArrayList<>();

    @JsonIgnore
    @Builder.Default
    @OneToMany(mappedBy = "auditCase", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private java.util.List<TpPlanningMeetingEntity> tpPlanningMeetings = new java.util.ArrayList<>();

    @JsonIgnore
    @Builder.Default
    @OneToMany(mappedBy = "auditCase", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private java.util.List<TpFieldWorkDataEntity> tpFieldWorkDatas = new java.util.ArrayList<>();

    @JsonIgnore
    @Builder.Default
    @OneToMany(mappedBy = "auditCase", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private java.util.List<TpAnalysisDataEntity> tpAnalysisDatas = new java.util.ArrayList<>();

    @JsonIgnore
    @Builder.Default
    @OneToMany(mappedBy = "auditCase", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private java.util.List<TpAuditReportEntity> tpAuditReports = new java.util.ArrayList<>();

    @JsonIgnore
    @Builder.Default
    @OneToMany(mappedBy = "auditCase", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private java.util.List<TpAuditNoticeEntity> tpAuditNotices = new java.util.ArrayList<>();

    @JsonIgnore
    @Builder.Default
    @OneToMany(mappedBy = "auditCase", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private java.util.List<TpObjectionEntity> tpObjections = new java.util.ArrayList<>();

    /** Current workflow phase for TP cases (e.g. DETAILED_RISK_ASSESSMENT, PLANNING, FIELD_WORK…) */
    @Column(name = "tp_current_phase", length = 64)
    private String tpCurrentPhase;

    // ── DA-Specific Child Entities ──
    @JsonIgnore
    @Builder.Default
    @OneToMany(mappedBy = "auditCase", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private java.util.List<DaEvidenceEntity> daEvidences = new java.util.ArrayList<>();

    @JsonIgnore
    @Builder.Default
    @OneToMany(mappedBy = "auditCase", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private java.util.List<DaAuditProcedureEntity> daAuditProcedures = new java.util.ArrayList<>();

    @JsonIgnore
    @Builder.Default
    @OneToMany(mappedBy = "auditCase", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private java.util.List<DaDraftReportEntity> daDraftReports = new java.util.ArrayList<>();

    @Column(name = "da_current_phase", length = 64)
    private String daCurrentPhase;

    @Column(name = "ca_current_phase", length = 64)
    private String caCurrentPhase;

    /** Overall CA workflow status (FR-04.4 state machine) */
    @Column(name = "ca_workflow_status", length = 64)
    private String caWorkflowStatus;

    // ── CA-specific display/query fields (V36) ────────────────────────────────
    /** TIN — convenience alias for taxpayerId; back-filled by V36 migration */
    @Column(name = "tin", length = 32)
    private String tin;

    /** Tax center display name — convenience alias for taxCenterCode */
    @Column(name = "tax_center", length = 128)
    private String taxCenter;

    /** HIGH | MEDIUM | LOW — derived from riskScore by V36, kept in sync */
    @Column(name = "risk_category", length = 16)
    private String riskCategory;

    /** LTO | MTO | STO — mirrors segment field, kept in sync */
    @Column(name = "taxpayer_segment", length = 16)
    private String taxpayerSegment;

    /** Audit start date for display (ISO date string from plan) */
    @Column(name = "start_date")
    private java.time.LocalDate startDate;

    /** Statutory audit completion due date */
    @Column(name = "due_date")
    private java.time.LocalDate dueDate;

    /** Multi-tax scope description (VAT, CIT, PAYE, WHT) */
    @Column(name = "audit_scope", columnDefinition = "TEXT")
    private String auditScope;

    // ── CA Child Entities ──────────────────────────────────────────────────────
    @JsonIgnore @Builder.Default
    @OneToMany(mappedBy = "auditCase", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private java.util.List<CaCaatEligibilityEntity> caCaatEligibilities = new java.util.ArrayList<>();

    @JsonIgnore @Builder.Default
    @OneToMany(mappedBy = "auditCase", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private java.util.List<CaCaatRunEntity> caCaatRuns = new java.util.ArrayList<>();

    @JsonIgnore @Builder.Default
    @OneToMany(mappedBy = "auditCase", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private java.util.List<CaEntryConferenceEntity> caEntryConferences = new java.util.ArrayList<>();

    @JsonIgnore @Builder.Default
    @OneToMany(mappedBy = "auditCase", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private java.util.List<CaAuditFindingEntity> caAuditFindings = new java.util.ArrayList<>();

    @JsonIgnore @Builder.Default
    @OneToMany(mappedBy = "auditCase", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private java.util.List<CaReconciliationEntity> caReconciliations = new java.util.ArrayList<>();

    @JsonIgnore @Builder.Default
    @OneToMany(mappedBy = "auditCase", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private java.util.List<CaDraftReportEntity> caDraftReports = new java.util.ArrayList<>();

    @JsonIgnore @Builder.Default
    @OneToMany(mappedBy = "auditCase", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private java.util.List<CaExitConferenceEntity> caExitConferences = new java.util.ArrayList<>();

    @JsonIgnore @Builder.Default
    @OneToMany(mappedBy = "auditCase", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private java.util.List<CaAssessmentNoticeEntity> caAssessmentNotices = new java.util.ArrayList<>();

    @Column(name = "qa_current_phase", length = 64)
    private String qaCurrentPhase;


    // ── Constructors ──────────────────────────────────────────────────────────
    public ApAuditCaseEntity() {
        this.tpRiskAssessments = new java.util.ArrayList<>();
        this.tpWorkingHypotheses = new java.util.ArrayList<>();
        this.tpAuditPlans = new java.util.ArrayList<>();
        this.tpPlanningMeetings = new java.util.ArrayList<>();
        this.tpFieldWorkDatas = new java.util.ArrayList<>();
        this.tpAnalysisDatas = new java.util.ArrayList<>();
        this.tpAuditReports = new java.util.ArrayList<>();
        this.tpAuditNotices = new java.util.ArrayList<>();
        this.tpObjections = new java.util.ArrayList<>();
    }

    public ApAuditCaseEntity(UUID planId, String caseNumber, String taxpayerId, String auditType,
                             Integer riskScore, String createdBy) {
        this();
        this.planId = planId;
        this.caseNumber = caseNumber;
        this.taxpayerId = taxpayerId;
        this.auditType = auditType;
        this.riskScore = riskScore;
        this.status = STATUS_PENDING_ASSIGNMENT;
        this.createdBy = createdBy;
        this.createdAt = OffsetDateTime.now();
    }

    // ── Helper: is this a committee-type case? ────────────────────────────────
    public boolean isCommitteeCase() {
        return STATUS_ASSIGNED_TO_COMMITTEE.equals(this.status) ||
               "JOINT_AUDIT".equals(this.auditType) ||
               "TRANSFER_PRICING".equals(this.auditType);
    }

    // ── Getters and Setters ───────────────────────────────────────────────────
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getPlanId() { return planId; }
    public void setPlanId(UUID planId) { this.planId = planId; }

    public UUID getAllocationId() { return allocationId; }
    public void setAllocationId(UUID allocationId) { this.allocationId = allocationId; }

    public String getTaxCenterCode() { return taxCenterCode; }
    public void setTaxCenterCode(String taxCenterCode) { this.taxCenterCode = taxCenterCode; }

    public String getRegionCode() { return regionCode; }
    public void setRegionCode(String regionCode) { this.regionCode = regionCode; }

    public String getCaseNumber() { return caseNumber; }
    public void setCaseNumber(String caseNumber) { this.caseNumber = caseNumber; }

    public String getTaxpayerId() { return taxpayerId; }
    public void setTaxpayerId(String taxpayerId) { this.taxpayerId = taxpayerId; }

    public String getTaxpayerName() { return taxpayerName; }
    public void setTaxpayerName(String taxpayerName) { this.taxpayerName = taxpayerName; }

    public String getSector() { return sector; }
    public void setSector(String sector) { this.sector = sector; }

    public String getAuditType() { return auditType; }
    public void setAuditType(String auditType) { this.auditType = auditType; }

    public Integer getRiskScore() { return riskScore; }
    public void setRiskScore(Integer riskScore) { this.riskScore = riskScore; }

    public Long getEstimatedRevenue() { return estimatedRevenue; }
    public void setEstimatedRevenue(Long estimatedRevenue) { this.estimatedRevenue = estimatedRevenue; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getAssignedTeamLeaderId() { return assignedTeamLeaderId; }
    public void setAssignedTeamLeaderId(String assignedTeamLeaderId) { this.assignedTeamLeaderId = assignedTeamLeaderId; }

    public UUID getCommitteeId() { return committeeId; }
    public void setCommitteeId(UUID committeeId) { this.committeeId = committeeId; }

    public String getAssignedAuditorId() { return assignedAuditorId; }
    public void setAssignedAuditorId(String assignedAuditorId) { this.assignedAuditorId = assignedAuditorId; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(OffsetDateTime startedAt) { this.startedAt = startedAt; }

    public OffsetDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(OffsetDateTime completedAt) { this.completedAt = completedAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }

    @com.fasterxml.jackson.annotation.JsonIgnore
    public TpRiskAssessmentEntity getTpRiskAssessment() {
        if (tpRiskAssessments == null) tpRiskAssessments = new java.util.ArrayList<>();
        return tpRiskAssessments.isEmpty() ? null : tpRiskAssessments.get(0);
    }
    public void setTpRiskAssessment(TpRiskAssessmentEntity tpRiskAssessment) {
        if (tpRiskAssessments == null) tpRiskAssessments = new java.util.ArrayList<>();
        this.tpRiskAssessments.clear();
        if (tpRiskAssessment != null) this.tpRiskAssessments.add(tpRiskAssessment);
    }

    @com.fasterxml.jackson.annotation.JsonIgnore
    public TpWorkingHypothesisEntity getTpWorkingHypothesis() {
        if (tpWorkingHypotheses == null) tpWorkingHypotheses = new java.util.ArrayList<>();
        return tpWorkingHypotheses.isEmpty() ? null : tpWorkingHypotheses.get(0);
    }
    public void setTpWorkingHypothesis(TpWorkingHypothesisEntity tpWorkingHypothesis) {
        if (tpWorkingHypotheses == null) tpWorkingHypotheses = new java.util.ArrayList<>();
        this.tpWorkingHypotheses.clear();
        if (tpWorkingHypothesis != null) this.tpWorkingHypotheses.add(tpWorkingHypothesis);
    }

    @com.fasterxml.jackson.annotation.JsonIgnore
    public TpAuditPlanEntity getTpAuditPlan() {
        if (tpAuditPlans == null) tpAuditPlans = new java.util.ArrayList<>();
        return tpAuditPlans.isEmpty() ? null : tpAuditPlans.get(0);
    }
    public void setTpAuditPlan(TpAuditPlanEntity tpAuditPlan) {
        if (tpAuditPlans == null) tpAuditPlans = new java.util.ArrayList<>();
        this.tpAuditPlans.clear();
        if (tpAuditPlan != null) this.tpAuditPlans.add(tpAuditPlan);
    }

    @com.fasterxml.jackson.annotation.JsonIgnore
    public TpPlanningMeetingEntity getTpPlanningMeeting() {
        if (tpPlanningMeetings == null) tpPlanningMeetings = new java.util.ArrayList<>();
        return tpPlanningMeetings.isEmpty() ? null : tpPlanningMeetings.get(0);
    }
    public void setTpPlanningMeeting(TpPlanningMeetingEntity tpPlanningMeeting) {
        if (tpPlanningMeetings == null) tpPlanningMeetings = new java.util.ArrayList<>();
        this.tpPlanningMeetings.clear();
        if (tpPlanningMeeting != null) this.tpPlanningMeetings.add(tpPlanningMeeting);
    }

    @com.fasterxml.jackson.annotation.JsonIgnore
    public TpFieldWorkDataEntity getTpFieldWorkData() {
        if (tpFieldWorkDatas == null) tpFieldWorkDatas = new java.util.ArrayList<>();
        return tpFieldWorkDatas.isEmpty() ? null : tpFieldWorkDatas.get(0);
    }
    public void setTpFieldWorkData(TpFieldWorkDataEntity tpFieldWorkData) {
        if (tpFieldWorkDatas == null) tpFieldWorkDatas = new java.util.ArrayList<>();
        this.tpFieldWorkDatas.clear();
        if (tpFieldWorkData != null) this.tpFieldWorkDatas.add(tpFieldWorkData);
    }

    @com.fasterxml.jackson.annotation.JsonIgnore
    public TpAnalysisDataEntity getTpAnalysisData() {
        if (tpAnalysisDatas == null) tpAnalysisDatas = new java.util.ArrayList<>();
        return tpAnalysisDatas.isEmpty() ? null : tpAnalysisDatas.get(0);
    }
    public void setTpAnalysisData(TpAnalysisDataEntity tpAnalysisData) {
        if (tpAnalysisDatas == null) tpAnalysisDatas = new java.util.ArrayList<>();
        this.tpAnalysisDatas.clear();
        if (tpAnalysisData != null) this.tpAnalysisDatas.add(tpAnalysisData);
    }

    @com.fasterxml.jackson.annotation.JsonIgnore
    public java.util.List<TpAuditReportEntity> getTpAuditReports() {
        if (tpAuditReports == null) tpAuditReports = new java.util.ArrayList<>();
        return tpAuditReports;
    }
    public void setTpAuditReports(java.util.List<TpAuditReportEntity> tpAuditReports) {
        this.tpAuditReports = tpAuditReports != null ? tpAuditReports : new java.util.ArrayList<>();
    }

    @com.fasterxml.jackson.annotation.JsonIgnore
    public TpAuditNoticeEntity getTpAuditNotice() {
        if (tpAuditNotices == null) tpAuditNotices = new java.util.ArrayList<>();
        return tpAuditNotices.isEmpty() ? null : tpAuditNotices.get(0);
    }
    public void setTpAuditNotice(TpAuditNoticeEntity tpAuditNotice) {
        if (tpAuditNotices == null) tpAuditNotices = new java.util.ArrayList<>();
        this.tpAuditNotices.clear();
        if (tpAuditNotice != null) this.tpAuditNotices.add(tpAuditNotice);
    }

    @com.fasterxml.jackson.annotation.JsonIgnore
    public java.util.List<TpObjectionEntity> getTpObjections() {
        if (tpObjections == null) tpObjections = new java.util.ArrayList<>();
        return tpObjections;
    }
    public void setTpObjections(java.util.List<TpObjectionEntity> tpObjections) {
        this.tpObjections = tpObjections != null ? tpObjections : new java.util.ArrayList<>();
    }

    public String getTpCurrentPhase() { return tpCurrentPhase; }
    public void setTpCurrentPhase(String tpCurrentPhase) { this.tpCurrentPhase = tpCurrentPhase; }

    @com.fasterxml.jackson.annotation.JsonIgnore
    public java.util.List<DaEvidenceEntity> getDaEvidences() { return daEvidences; }
    public void setDaEvidences(java.util.List<DaEvidenceEntity> daEvidences) { this.daEvidences = daEvidences; }

    @com.fasterxml.jackson.annotation.JsonIgnore
    public java.util.List<DaAuditProcedureEntity> getDaAuditProcedures() { return daAuditProcedures; }
    public void setDaAuditProcedures(java.util.List<DaAuditProcedureEntity> daAuditProcedures) { this.daAuditProcedures = daAuditProcedures; }

    @com.fasterxml.jackson.annotation.JsonIgnore
    public java.util.List<DaDraftReportEntity> getDaDraftReports() { return daDraftReports; }
    public void setDaDraftReports(java.util.List<DaDraftReportEntity> daDraftReports) { this.daDraftReports = daDraftReports; }

    public String getDaCurrentPhase() { return daCurrentPhase; }
    public void setDaCurrentPhase(String daCurrentPhase) { this.daCurrentPhase = daCurrentPhase; }

    public String getCaCurrentPhase() { return caCurrentPhase; }
    public void setCaCurrentPhase(String caCurrentPhase) { this.caCurrentPhase = caCurrentPhase; }

    public String getCaWorkflowStatus() { return caWorkflowStatus; }
    public void setCaWorkflowStatus(String caWorkflowStatus) { this.caWorkflowStatus = caWorkflowStatus; }

    // ── V36 CA display fields ─────────────────────────────────────────────────
    public String getTin() { return tin; }
    public void setTin(String tin) { this.tin = tin; }

    public String getTaxCenter() { return taxCenter; }
    public void setTaxCenter(String taxCenter) { this.taxCenter = taxCenter; }

    public String getRiskCategory() { return riskCategory; }
    public void setRiskCategory(String riskCategory) { this.riskCategory = riskCategory; }

    public String getTaxpayerSegment() { return taxpayerSegment; }
    public void setTaxpayerSegment(String taxpayerSegment) { this.taxpayerSegment = taxpayerSegment; }

    public java.time.LocalDate getStartDate() { return startDate; }
    public void setStartDate(java.time.LocalDate startDate) { this.startDate = startDate; }

    public java.time.LocalDate getDueDate() { return dueDate; }
    public void setDueDate(java.time.LocalDate dueDate) { this.dueDate = dueDate; }

    public String getAuditScope() { return auditScope; }
    public void setAuditScope(String auditScope) { this.auditScope = auditScope; }

    public String getSegment() { return segment; }
    public void setSegment(String segment) { this.segment = segment; }

    public String getRiskPriority() { return riskPriority; }
    public void setRiskPriority(String riskPriority) { this.riskPriority = riskPriority; }

    public String getQaCurrentPhase() { return qaCurrentPhase; }
    public void setQaCurrentPhase(String qaCurrentPhase) { this.qaCurrentPhase = qaCurrentPhase; }
}
