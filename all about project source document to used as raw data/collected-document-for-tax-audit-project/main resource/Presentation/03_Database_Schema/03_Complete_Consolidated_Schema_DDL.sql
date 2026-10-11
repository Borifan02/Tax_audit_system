--
-- PostgreSQL database dump
--

\restrict RChqCe2av3drAw65yyCwvJH0Dkf5hexbqwPPlxfSJK8Yr0SdkhlSu2vPUATKmof

-- Dumped from database version 18.4 (Ubuntu 18.4-1.pgdg24.04+1)
-- Dumped by pg_dump version 18.4 (Ubuntu 18.4-1.pgdg24.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: ap_log_director_approval(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ap_log_director_approval() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO ap_plan_audit_logs (plan_id, action, actor_id, actor_role, reason, changed_fields)
    VALUES (
        NEW.plan_id,
        'DIRECTOR_' || NEW.decision,
        NEW.director_id,
        'DIRECTOR',
        NEW.reason,
        jsonb_build_object('decision', NEW.decision, 'comment', NEW.comment)
    );
    RETURN NEW;
END;
$$;


--
-- Name: ap_log_regional_deployment(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ap_log_regional_deployment() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO ap_plan_audit_logs (plan_id, action, actor_id, actor_role, reason, changed_fields)
    VALUES (
        NEW.plan_id,
        'REGIONAL_DEPLOYMENT',
        NEW.director_id,
        'DIRECTOR',
        'Plan sent to region ' || NEW.region_code,
        jsonb_build_object('region_code', NEW.region_code, 'allocated_cases', NEW.region_allocated_cases)
    );
    RETURN NEW;
END;
$$;


--
-- Name: ap_prevent_audit_log_update(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ap_prevent_audit_log_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  RAISE EXCEPTION 'Updates and Deletes are forbidden on ap_plan_audit_logs (Compliance Rule)';
END;
$$;


--
-- Name: ap_sync_regional_access_from_deployment(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ap_sync_regional_access_from_deployment() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO ap_regional_plan_access (plan_id, region_code, access_granted_at, reason)
    VALUES (NEW.plan_id, NEW.region_code, NEW.sent_at, 'DIRECTOR_SENT')
    ON CONFLICT (plan_id, region_code) 
    DO UPDATE SET access_granted_at = EXCLUDED.access_granted_at;
    RETURN NEW;
END;
$$;


--
-- Name: ap_update_director_approval_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ap_update_director_approval_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: ap_update_plan_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ap_update_plan_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: ap_update_regional_access_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ap_update_regional_access_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: ap_update_regional_deployment_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.ap_update_regional_deployment_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- Name: prevent_audit_trail_update(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.prevent_audit_trail_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    RAISE EXCEPTION 'Updates and Deletes are forbidden on the audit trail table (Compliance Rule).';
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ap_annual_audit_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ap_annual_audit_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    plan_year integer NOT NULL,
    plan_name character varying(256) NOT NULL,
    status character varying(32) DEFAULT 'DRAFT'::character varying NOT NULL,
    created_by character varying(64) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    submitted_to_director_by character varying(64),
    submitted_to_director_at timestamp with time zone,
    director_approved_by character varying(64),
    director_approved_at timestamp with time zone,
    director_approval_reason text,
    submitted_to_regional_by character varying(64),
    submitted_to_regional_at timestamp with time zone,
    regional_director_approved_by character varying(64),
    regional_director_approved_at timestamp with time zone,
    regional_director_approval_reason text,
    sent_to_tax_center_at timestamp with time zone,
    distribution_json jsonb,
    sent_to_regions_at timestamp with time zone,
    sent_to_regions_by character varying(64),
    regions_received_count integer DEFAULT 0,
    updated_at timestamp with time zone,
    version bigint DEFAULT 0,
    director_comment text,
    senior_comment text,
    amendment_comment text,
    estimated_revenue numeric(19,2),
    estimated_revenue_distribution jsonb
);


--
-- Name: ap_audit_cases; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ap_audit_cases (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    plan_id uuid NOT NULL,
    allocation_id uuid,
    case_number character varying(64) NOT NULL,
    taxpayer_id character varying(64) NOT NULL,
    audit_type character varying(32),
    risk_score integer,
    status character varying(32) DEFAULT 'PENDING_ASSIGNMENT'::character varying NOT NULL,
    assigned_team_leader_id character varying(64),
    assigned_auditor_id character varying(64),
    created_by character varying(64) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    updated_at timestamp with time zone,
    estimated_revenue bigint,
    tax_center_code character varying(64),
    region_code character varying(10),
    taxpayer_name character varying(256),
    sector character varying(128),
    tp_current_phase character varying(64) DEFAULT NULL::character varying,
    tp_working_hypothesis_id uuid,
    committee_id uuid,
    assigned_at timestamp(6) with time zone,
    assigned_by character varying(64),
    handoff_at timestamp(6) with time zone,
    handoff_by character varying(64),
    handoff_comment text,
    risk_priority character varying(16),
    segment character varying(32),
    handoff_date timestamp with time zone,
    handoff_reason text,
    audit_scope text,
    ca_current_phase character varying(64),
    ca_workflow_status character varying(64),
    da_current_phase character varying(64),
    due_date date,
    qa_current_phase character varying(64),
    risk_category character varying(16),
    start_date date,
    tax_center character varying(128),
    taxpayer_segment character varying(16),
    tin character varying(32)
);


--
-- Name: ap_director_approvals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ap_director_approvals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    plan_id uuid NOT NULL,
    director_id character varying(64) NOT NULL,
    decision character varying(50) NOT NULL,
    reason text,
    comment text,
    approved_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone,
    version bigint DEFAULT 0,
    CONSTRAINT ap_director_approvals_decision_check CHECK (((decision)::text = ANY ((ARRAY['APPROVED'::character varying, 'REJECTED'::character varying, 'AMENDMENT_REQUIRED'::character varying])::text[])))
);


--
-- Name: ap_plan_allocations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ap_plan_allocations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    plan_id uuid NOT NULL,
    tax_center_code character varying(64),
    region_code character varying(10) NOT NULL,
    proposed_count integer NOT NULL,
    regional_divided_count integer,
    regional_division_reason text,
    tc_adjusted_count integer,
    tc_justification text,
    tc_feedback_submitted boolean DEFAULT false,
    tc_feedback_submitted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone,
    tc_adjusted_allocations jsonb,
    tc_original_count integer,
    tc_adjustment_reason character varying(500),
    allocation_by_audit_type jsonb,
    estimated_revenue numeric(19,2),
    revenue_by_audit_type jsonb
);


--
-- Name: COLUMN ap_plan_allocations.tc_adjusted_allocations; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ap_plan_allocations.tc_adjusted_allocations IS 'JSON object storing per-audit-type adjustments: {desk_audit: 40, comprehensive_audit: 60, ...}';


--
-- Name: COLUMN ap_plan_allocations.tc_original_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ap_plan_allocations.tc_original_count IS 'Original proposed count sent to tax center before adjustments';


--
-- Name: COLUMN ap_plan_allocations.tc_adjustment_reason; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.ap_plan_allocations.tc_adjustment_reason IS 'Reason for adjustment (e.g., staffing shortage, equipment maintenance)';


--
-- Name: ap_plan_audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ap_plan_audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    plan_id uuid NOT NULL,
    action character varying(64) NOT NULL,
    actor_id character varying(64) NOT NULL,
    actor_role character varying(64) NOT NULL,
    reason text,
    changed_fields jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ap_plan_revisions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ap_plan_revisions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    plan_id uuid NOT NULL,
    comment text NOT NULL,
    revision_type character varying(32),
    created_by character varying(64) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ap_plan_timeline; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ap_plan_timeline (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    plan_id uuid NOT NULL,
    status character varying(64) NOT NULL,
    actor_id character varying(64) NOT NULL,
    comment text,
    event_timestamp timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ap_planning_configuration; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ap_planning_configuration (
    id character varying(64) NOT NULL,
    config_data jsonb NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    updated_by character varying(128) DEFAULT 'SYSTEM_DEFAULT'::character varying NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ap_regional_deployments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ap_regional_deployments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    plan_id uuid NOT NULL,
    region_code character varying(10) NOT NULL,
    director_id character varying(64) NOT NULL,
    sent_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deployment_note text,
    region_allocated_cases jsonb,
    received_at timestamp with time zone,
    acknowledged_by character varying(64),
    acknowledged_at timestamp with time zone,
    updated_at timestamp with time zone,
    version bigint DEFAULT 0,
    estimated_revenue bigint DEFAULT 0,
    revenue_by_audit_type jsonb,
    deployed_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    deployed_by character varying(64),
    region_id character varying(64),
    status character varying(32)
);


--
-- Name: ap_regional_feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ap_regional_feedback (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    plan_id uuid NOT NULL,
    region_id character varying(64) NOT NULL,
    feedback_text text,
    submitted_by character varying(64),
    submitted_at timestamp with time zone,
    is_overridden boolean DEFAULT false,
    override_comment text,
    override_by character varying(64),
    override_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ap_regional_plan_access; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ap_regional_plan_access (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    plan_id uuid NOT NULL,
    region_code character varying(10) NOT NULL,
    access_granted_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    access_expires_at timestamp with time zone,
    reason character varying(100),
    updated_at timestamp with time zone
);


--
-- Name: ap_regional_tc_deployments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ap_regional_tc_deployments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    plan_id uuid NOT NULL,
    region_id character varying(64) NOT NULL,
    deployed_by character varying(64) NOT NULL,
    deployed_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status character varying(32) DEFAULT 'DEPLOYED'::character varying
);


--
-- Name: audit_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(64) NOT NULL,
    name character varying(128) NOT NULL,
    requires_committee boolean DEFAULT false NOT NULL,
    initial_assignment_role character varying(64) DEFAULT 'TEAM_LEADER'::character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ca_approval_steps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ca_approval_steps (
    id uuid NOT NULL,
    approval_level smallint NOT NULL,
    approver_id character varying(64) NOT NULL,
    approver_role character varying(64) NOT NULL,
    comments text,
    created_at timestamp(6) with time zone,
    decided_at timestamp(6) with time zone,
    decision character varying(16) NOT NULL,
    entity_id uuid NOT NULL,
    entity_type character varying(32) NOT NULL,
    audit_case_id uuid NOT NULL
);


--
-- Name: ca_assessment_notices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ca_assessment_notices (
    id uuid NOT NULL,
    created_at timestamp(6) with time zone,
    fraud_referral_at timestamp(6) with time zone,
    fraud_referral_reason character varying(255),
    fraud_referral_triggered boolean,
    interest_amount numeric(18,2),
    interest_days integer,
    interest_rate_annual numeric(6,4),
    issue_date date NOT NULL,
    issued_by character varying(255),
    notice_number character varying(64) NOT NULL,
    objection_details text,
    objection_lodged_at timestamp(6) with time zone,
    objection_status character varying(32),
    penalty_amount numeric(18,2),
    penalty_pct numeric(6,4),
    principal_cit numeric(18,2),
    principal_paye numeric(18,2),
    principal_total numeric(18,2),
    principal_vat numeric(18,2),
    principal_wht numeric(18,2),
    status character varying(32) NOT NULL,
    statutory_due_date date NOT NULL,
    taxpayer_signed boolean,
    taxpayer_signed_at timestamp(6) with time zone,
    total_assessment_due numeric(18,2),
    updated_at timestamp(6) with time zone,
    audit_case_id uuid NOT NULL
);


--
-- Name: ca_audit_assertions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ca_audit_assertions (
    id uuid NOT NULL,
    actual_value numeric(38,2),
    assertion_type character varying(255) NOT NULL,
    conclusion character varying(255),
    created_at timestamp(6) with time zone,
    created_by character varying(255),
    expected_value numeric(38,2),
    explanation character varying(255),
    financial_area character varying(255) NOT NULL,
    finding character varying(255),
    updated_at timestamp(6) with time zone,
    verification_result character varying(255),
    audit_case_id uuid NOT NULL
);


--
-- Name: ca_audit_findings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ca_audit_findings (
    id uuid NOT NULL,
    audit_area character varying(128) NOT NULL,
    auditor_analysis text,
    caat_exception_id uuid,
    cause text,
    conclusion text,
    condition text,
    created_at timestamp(6) with time zone,
    created_by character varying(255),
    criteria text,
    description text NOT NULL,
    effect text,
    finding_reference character varying(64) NOT NULL,
    fraud_indicators text,
    fraud_referral_date timestamp(6) with time zone,
    indicates_fraud boolean,
    interest_amount numeric(18,2),
    is_significant boolean,
    penalty_amount numeric(18,2),
    penalty_rate numeric(6,4),
    recommendation text,
    status character varying(32) NOT NULL,
    tax_type character varying(16),
    title character varying(256) NOT NULL,
    total_tax_impact numeric(18,2),
    under_declared_amount numeric(18,2),
    updated_at timestamp(6) with time zone,
    zone_code character varying(64),
    audit_case_id uuid NOT NULL
);


--
-- Name: ca_balance_sheet_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ca_balance_sheet_items (
    id uuid NOT NULL,
    assertion_type character varying(64) NOT NULL,
    audited_balance numeric(18,2),
    auditee_balance numeric(18,2),
    auditor_conclusion character varying(32),
    component character varying(128) NOT NULL,
    created_at timestamp(6) with time zone,
    created_by character varying(255),
    ifrs_compliance character varying(32),
    notes text,
    updated_at timestamp(6) with time zone,
    variance numeric(18,2),
    audit_case_id uuid NOT NULL
);


--
-- Name: ca_benchmark_analyses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ca_benchmark_analyses (
    id uuid NOT NULL,
    benchmark_value numeric(10,4),
    created_at timestamp(6) with time zone,
    created_by character varying(255),
    data_year smallint,
    industry_code character varying(32),
    interpretation text,
    ratio_name character varying(128) NOT NULL,
    risk_level character varying(16),
    taxpayer_value numeric(10,4),
    unit character varying(32),
    variance_pct numeric(10,4),
    audit_case_id uuid NOT NULL
);


--
-- Name: ca_benford_analysis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ca_benford_analysis (
    id uuid NOT NULL,
    created_at timestamp(6) with time zone,
    deviation numeric(6,3),
    digit smallint NOT NULL,
    expected_pct numeric(6,3) NOT NULL,
    is_anomalous boolean,
    observed_count integer,
    observed_pct numeric(6,3) NOT NULL,
    audit_case_id uuid NOT NULL,
    caat_run_id uuid NOT NULL
);


--
-- Name: ca_caat_eligibility; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ca_caat_eligibility (
    id uuid NOT NULL,
    annual_turnover numeric(18,2),
    assessed_at timestamp(6) with time zone,
    assessed_by character varying(255),
    created_at timestamp(6) with time zone,
    eligibility_reason text,
    has_electronic_records boolean,
    has_erp_system boolean,
    is_eligible boolean NOT NULL,
    overridden boolean,
    override_by character varying(255),
    override_reason character varying(255),
    status character varying(32) NOT NULL,
    taxpayer_segment character varying(16),
    updated_at timestamp(6) with time zone,
    audit_case_id uuid NOT NULL
);


--
-- Name: ca_caat_exceptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ca_caat_exceptions (
    id uuid NOT NULL,
    account_name character varying(255),
    action_taken_notes text,
    amount numeric(18,2),
    anomaly_type character varying(255) NOT NULL,
    converted_to_finding boolean,
    counterparty character varying(255),
    created_at timestamp(6) with time zone,
    details text,
    finding_id uuid,
    risk_level character varying(16) NOT NULL,
    rule_code character varying(32) NOT NULL,
    status character varying(32) NOT NULL,
    tax_head character varying(16),
    transaction_date date,
    transaction_ref character varying(255),
    updated_at timestamp(6) with time zone,
    audit_case_id uuid NOT NULL,
    caat_run_id uuid NOT NULL
);


--
-- Name: ca_caat_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ca_caat_rules (
    id uuid NOT NULL,
    category character varying(64) NOT NULL,
    created_at timestamp(6) with time zone,
    details text,
    discrepancies_count integer,
    last_executed_at timestamp(6) with time zone,
    rule_code character varying(32) NOT NULL,
    rule_name character varying(128) NOT NULL,
    sample_size integer,
    status character varying(32) NOT NULL,
    target_ledger character varying(64),
    threshold_amount numeric(18,2),
    variance_amount numeric(18,2),
    caat_run_id uuid NOT NULL
);


--
-- Name: ca_caat_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ca_caat_runs (
    id uuid NOT NULL,
    auditor_notes text,
    caat_tool_name character varying(128) NOT NULL,
    completed_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone,
    executed_by character varying(255),
    execution_log text,
    run_reference character varying(64) NOT NULL,
    sampling_method character varying(64) NOT NULL,
    started_at timestamp(6) with time zone,
    status character varying(32) NOT NULL,
    total_flagged integer,
    total_flagged_exposure numeric(18,2),
    total_records_mined integer,
    updated_at timestamp(6) with time zone,
    audit_case_id uuid NOT NULL
);


--
-- Name: ca_case_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ca_case_snapshots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    case_id uuid NOT NULL,
    snapshot_data text,
    last_saved_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ca_document_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ca_document_requests (
    id uuid NOT NULL,
    created_at timestamp(6) with time zone,
    due_date timestamp(6) with time zone,
    request_description character varying(255) NOT NULL,
    requested_document character varying(255) NOT NULL,
    requesting_auditor character varying(255),
    response_notes character varying(255),
    status character varying(255) NOT NULL,
    updated_at timestamp(6) with time zone,
    audit_case_id uuid NOT NULL
);


--
-- Name: ca_draft_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ca_draft_reports (
    id uuid NOT NULL,
    created_at timestamp(6) with time zone,
    created_by character varying(255),
    director_comments text,
    director_reviewed_at timestamp(6) with time zone,
    director_reviewed_by character varying(255),
    executive_summary text,
    findings_summary text,
    ifrs_compliance_notes text,
    methodology text,
    recommended_adjustments text,
    report_reference character varying(64) NOT NULL,
    scope_and_objectives text,
    sent_by character varying(255),
    sent_to_taxpayer_at timestamp(6) with time zone,
    status character varying(64) NOT NULL,
    statutory_recommendations text,
    taxpayer_objection_deadline timestamp(6) with time zone,
    taxpayer_signed_at timestamp(6) with time zone,
    team_leader_comments text,
    team_leader_reviewed_at timestamp(6) with time zone,
    team_leader_reviewed_by character varying(255),
    total_assessment numeric(18,2),
    total_interest numeric(18,2),
    total_penalty numeric(18,2),
    total_principal_tax numeric(18,2),
    undelivered boolean,
    undelivered_reason character varying(255),
    updated_at timestamp(6) with time zone,
    audit_case_id uuid NOT NULL
);


--
-- Name: ca_entry_conferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ca_entry_conferences (
    id uuid NOT NULL,
    attendees jsonb,
    audio_recording_url character varying(512),
    created_at timestamp(6) with time zone,
    created_by character varying(255),
    internal_controls_review text,
    premises_inspection_notes text,
    reviewed_at timestamp(6) with time zone,
    reviewed_by character varying(255),
    scheduled_date date NOT NULL,
    scheduled_time character varying(16),
    status character varying(32) NOT NULL,
    taxpayer_confirmed_receipt boolean,
    taxpayer_receipt_date date,
    team_leader_approved boolean,
    updated_at timestamp(6) with time zone,
    venue character varying(256),
    audit_case_id uuid NOT NULL
);


--
-- Name: ca_execution_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ca_execution_reports (
    id uuid NOT NULL,
    approval_level integer,
    caat_eligible boolean,
    created_at timestamp(6) with time zone,
    created_by character varying(255),
    report_content character varying(255) NOT NULL,
    status character varying(255) NOT NULL,
    updated_at timestamp(6) with time zone,
    audit_case_id uuid NOT NULL
);


--
-- Name: ca_exit_conferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ca_exit_conferences (
    id uuid NOT NULL,
    agenda_items jsonb,
    attendance_confirmed boolean,
    attendees jsonb,
    created_at timestamp(6) with time zone,
    created_by character varying(255),
    discussion_notes text,
    scheduled_date date NOT NULL,
    scheduled_time character varying(16),
    signed_by_taxpayer boolean,
    signed_date date,
    status character varying(32) NOT NULL,
    taxpayer_response_notes text,
    updated_at timestamp(6) with time zone,
    venue character varying(256),
    audit_case_id uuid NOT NULL
);


--
-- Name: ca_multi_zone_allocations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ca_multi_zone_allocations (
    id uuid NOT NULL,
    audit_adjustment numeric(18,2),
    branch_code character varying(32),
    created_at timestamp(6) with time zone,
    net_payable numeric(18,2),
    period_covered character varying(32),
    tax_declared numeric(18,2),
    tax_type character varying(16),
    zone_name character varying(128) NOT NULL,
    audit_case_id uuid NOT NULL,
    notice_id uuid
);


--
-- Name: ca_query_sheets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ca_query_sheets (
    id uuid NOT NULL,
    auditor_comments character varying(255),
    created_at timestamp(6) with time zone,
    due_date timestamp(6) with time zone,
    question character varying(255) NOT NULL,
    requested_information character varying(255),
    status character varying(255) NOT NULL,
    supporting_context character varying(255),
    taxpayer_response character varying(255),
    updated_at timestamp(6) with time zone,
    audit_case_id uuid NOT NULL
);


--
-- Name: ca_reconciliations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ca_reconciliations (
    id uuid NOT NULL,
    auditor_notes text,
    created_at timestamp(6) with time zone,
    created_by character varying(255),
    period_covered character varying(32),
    reconciliation_type character varying(64) NOT NULL,
    sourceaamount numeric(18,2) NOT NULL,
    sourcealabel character varying(128) NOT NULL,
    sourcebamount numeric(18,2) NOT NULL,
    sourceblabel character varying(128) NOT NULL,
    sourcecamount numeric(18,2),
    sourceclabel character varying(128),
    status character varying(32) NOT NULL,
    updated_at timestamp(6) with time zone,
    variance numeric(18,2),
    variance_pct numeric(8,4),
    audit_case_id uuid NOT NULL
);


--
-- Name: ca_sampling_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ca_sampling_records (
    id uuid NOT NULL,
    created_at timestamp(6) with time zone,
    created_by character varying(255),
    findings_summary text,
    population_size integer,
    sample_description text,
    sample_size integer,
    sampling_type character varying(64) NOT NULL,
    selection_criteria text,
    status character varying(32) NOT NULL,
    target_population character varying(128) NOT NULL,
    updated_at timestamp(6) with time zone,
    audit_case_id uuid NOT NULL
);


--
-- Name: ca_taxpayer_responses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ca_taxpayer_responses (
    id uuid NOT NULL,
    auditor_notes text,
    created_at timestamp(6) with time zone,
    document_urls jsonb,
    response_text text NOT NULL,
    response_type character varying(32) NOT NULL,
    reviewed_at timestamp(6) with time zone,
    reviewed_by character varying(255),
    status character varying(32) NOT NULL,
    submitted_at timestamp(6) with time zone,
    submitted_by character varying(255),
    audit_case_id uuid NOT NULL,
    draft_report_id uuid,
    notice_id uuid
);


--
-- Name: ca_third_party_matches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ca_third_party_matches (
    id uuid NOT NULL,
    created_at timestamp(6) with time zone,
    created_by character varying(255),
    data_source character varying(128) NOT NULL,
    declared_value numeric(18,2),
    discrepancy_notes text,
    match_status character varying(32) NOT NULL,
    period_covered character varying(32),
    third_party_value numeric(18,2),
    updated_at timestamp(6) with time zone,
    variance numeric(18,2),
    audit_case_id uuid NOT NULL
);


--
-- Name: ca_working_papers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ca_working_papers (
    id uuid NOT NULL,
    category character varying(64) NOT NULL,
    conclusions text,
    created_at timestamp(6) with time zone,
    document_url character varying(512),
    paper_reference character varying(64) NOT NULL,
    prepared_at timestamp(6) with time zone,
    prepared_by character varying(255),
    reviewed_at timestamp(6) with time zone,
    reviewed_by character varying(255),
    status character varying(32) NOT NULL,
    title character varying(256) NOT NULL,
    updated_at timestamp(6) with time zone,
    work_performed text NOT NULL,
    audit_case_id uuid NOT NULL
);


--
-- Name: case_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.case_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    case_id uuid NOT NULL,
    region_id uuid,
    tax_center_id uuid,
    audit_type_id uuid,
    committee_id uuid,
    team_id uuid,
    team_leader_id uuid,
    assigned_user_id uuid,
    assigned_by character varying(128) NOT NULL,
    assignment_type character varying(64) NOT NULL,
    assignment_reason text,
    effective_from timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    effective_to timestamp with time zone,
    status character varying(32) DEFAULT 'ACTIVE'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: case_auditor_assignment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.case_auditor_assignment (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    case_id uuid NOT NULL,
    auditor_id uuid NOT NULL,
    assigned_by_id uuid NOT NULL,
    assigned_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status character varying(32) DEFAULT 'ACTIVE'::character varying NOT NULL,
    superseded_at timestamp with time zone,
    superseded_by_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: case_handoff; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.case_handoff (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    case_id uuid NOT NULL,
    team_leader_id uuid NOT NULL,
    assigned_by_id uuid NOT NULL,
    assignment_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    assignment_reason text,
    status character varying(32) DEFAULT 'ACTIVE'::character varying NOT NULL,
    cancelled_at timestamp with time zone,
    cancelled_by_id uuid,
    cancellation_reason text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: committees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.committees (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(128) NOT NULL,
    name character varying(256) NOT NULL,
    tax_center_id uuid NOT NULL,
    audit_type_id uuid NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: da_audit_procedures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.da_audit_procedures (
    id uuid NOT NULL,
    conclusion text,
    created_at timestamp(6) with time zone,
    created_by character varying(64),
    finding text,
    issue_identified boolean,
    observation text,
    procedure_description text NOT NULL,
    updated_at timestamp(6) with time zone,
    audit_case_id uuid NOT NULL
);


--
-- Name: da_case_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.da_case_snapshots (
    id uuid NOT NULL,
    case_id uuid NOT NULL,
    last_saved_at timestamp(6) with time zone,
    snapshot_data text
);


--
-- Name: da_draft_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.da_draft_reports (
    id uuid NOT NULL,
    created_at timestamp(6) with time zone,
    created_by character varying(64),
    escalated_to_comprehensive boolean,
    escalation_reason text,
    report_content text NOT NULL,
    reviewed_at timestamp(6) with time zone,
    reviewed_by character varying(64),
    significant_issues_identified boolean,
    status character varying(32) NOT NULL,
    submitted_at timestamp(6) with time zone,
    team_leader_comments text,
    updated_at timestamp(6) with time zone,
    audit_case_id uuid NOT NULL
);


--
-- Name: da_evidence; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.da_evidence (
    id uuid NOT NULL,
    created_at timestamp(6) with time zone,
    document_name character varying(255) NOT NULL,
    document_source character varying(64) NOT NULL,
    document_url character varying(512),
    status character varying(32) NOT NULL,
    updated_at timestamp(6) with time zone,
    uploaded_at timestamp(6) with time zone,
    uploaded_by character varying(64),
    audit_case_id uuid NOT NULL
);


--
-- Name: da_findings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.da_findings (
    id uuid NOT NULL,
    audit_area character varying(128),
    case_id uuid NOT NULL,
    auditor_analysis text,
    cause text,
    conclusion text,
    condition text,
    created_at timestamp(6) with time zone,
    criteria text,
    description text,
    effect text,
    finding_reference character varying(64),
    interest_amount double precision,
    is_significant boolean,
    penalty_amount double precision,
    penalty_rate double precision,
    recommendation text,
    related_procedure_id character varying(64),
    related_query_id character varying(64),
    related_working_paper_id character varying(64),
    status character varying(64),
    title text,
    total_tax_impact double precision,
    under_declared_amount double precision,
    updated_at timestamp(6) with time zone
);


--
-- Name: da_queries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.da_queries (
    id uuid NOT NULL,
    case_id uuid NOT NULL,
    created_at timestamp(6) with time zone,
    due_date character varying(255),
    question text,
    reference character varying(64),
    resolution_notes text,
    status character varying(64),
    statutory_basis text,
    subject character varying(255),
    taxpayer_response text,
    updated_at timestamp(6) with time zone
);


--
-- Name: da_working_papers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.da_working_papers (
    id uuid NOT NULL,
    case_id uuid NOT NULL,
    category character varying(128),
    conclusions text,
    created_at timestamp(6) with time zone,
    paper_date character varying(255),
    prepared_by character varying(128),
    reference character varying(64),
    related_finding_id character varying(64),
    related_procedure_id character varying(64),
    status character varying(64),
    title text,
    updated_at timestamp(6) with time zone,
    work_performed text
);


--
-- Name: flyway_schema_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.flyway_schema_history (
    installed_rank integer NOT NULL,
    version character varying(50),
    description character varying(200) NOT NULL,
    type character varying(20) NOT NULL,
    script character varying(1000) NOT NULL,
    checksum integer,
    installed_by character varying(100) NOT NULL,
    installed_on timestamp without time zone DEFAULT now() NOT NULL,
    execution_time integer NOT NULL,
    success boolean NOT NULL
);


--
-- Name: issue_audit_details; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.issue_audit_details (
    id uuid NOT NULL,
    current_phase character varying(64),
    decision_date timestamp(6) with time zone,
    director_comments text,
    evidence_data_json text,
    field_visit_findings_json text,
    field_visit_required boolean,
    follow_up_decision character varying(64),
    identified_issue character varying(512),
    notification_date timestamp(6) with time zone,
    notification_recipient_channel character varying(256),
    notification_required boolean,
    notification_sent boolean,
    process_owner_comments text,
    referral_reference_number character varying(128),
    report_status character varying(64),
    report_summary text,
    report_title character varying(256),
    report_version integer,
    selection_data_json text,
    selection_rationale text,
    team_leader_comments text,
    total_adjusted_amount double precision,
    audit_case_id uuid NOT NULL
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    recipient_user_id character varying(64) NOT NULL,
    notification_type character varying(64) NOT NULL,
    title character varying(256) NOT NULL,
    body text,
    task_id uuid,
    case_id uuid,
    artifact_type character varying(128),
    artifact_id uuid,
    is_read boolean DEFAULT false NOT NULL,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: organizational_units; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organizational_units (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(64) NOT NULL,
    name character varying(256) NOT NULL,
    unit_type character varying(64) NOT NULL,
    parent_id uuid,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(128) NOT NULL,
    description text,
    module character varying(64),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: qa_action_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.qa_action_plans (
    id uuid NOT NULL,
    approved_at timestamp(6) with time zone,
    checklist_items jsonb NOT NULL,
    comments text,
    created_at timestamp(6) with time zone,
    decision character varying(32),
    decision_comments text,
    objectives text NOT NULL,
    plan_title character varying(256),
    qa_review_case_id uuid,
    returned_count integer NOT NULL,
    review_methodology text,
    review_scope text NOT NULL,
    reviewed_at timestamp(6) with time zone,
    reviewed_by character varying(64),
    reviewer character varying(64),
    risk_focus_areas jsonb NOT NULL,
    sample_criteria text,
    sample_size integer,
    status character varying(32) NOT NULL,
    submitted_at timestamp(6) with time zone,
    submitted_by character varying(64),
    updated_at timestamp(6) with time zone,
    version bigint NOT NULL,
    audit_case_id uuid NOT NULL
);


--
-- Name: qa_deficiencies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.qa_deficiencies (
    id uuid NOT NULL,
    corrective_action_mandate character varying(255),
    dimension_id character varying(255),
    dimension_title character varying(255),
    finding_description character varying(255),
    qa_case_id uuid,
    severity character varying(255),
    status character varying(255),
    statutory_breach character varying(255),
    title character varying(255)
);


--
-- Name: qa_exit_conferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.qa_exit_conferences (
    id uuid NOT NULL,
    auditor_comments text,
    minutes text,
    qa_case_id uuid NOT NULL,
    resolved_flag boolean,
    scheduled_date character varying(255),
    status character varying(255)
);


--
-- Name: qa_follow_up_action; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.qa_follow_up_action (
    id uuid NOT NULL,
    action_kind character varying(32) NOT NULL,
    audit_case_id uuid,
    completed_at timestamp(6) with time zone,
    completed_by character varying(64),
    completion_evidence text,
    created_at timestamp(6) with time zone NOT NULL,
    decided_at timestamp(6) with time zone NOT NULL,
    decided_by character varying(64),
    due_date date,
    narrative text,
    qa_review_case_id uuid NOT NULL,
    status character varying(32) NOT NULL,
    target_actor_id character varying(64),
    target_actor_name character varying(128),
    target_department character varying(128),
    title character varying(256) NOT NULL,
    updated_at timestamp(6) with time zone,
    verified_at timestamp(6) with time zone,
    verified_by character varying(64)
);


--
-- Name: qa_follow_ups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.qa_follow_ups (
    id uuid NOT NULL,
    corrective_action_proof text,
    deficiency_id uuid NOT NULL,
    due_date character varying(255),
    original_auditor_id character varying(255),
    qa_case_id uuid NOT NULL,
    status character varying(255)
);


--
-- Name: qa_recommendations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.qa_recommendations (
    id uuid NOT NULL,
    assigned_to character varying(64),
    auditor_response text,
    corrective_action_mandate text,
    created_at timestamp(6) with time zone,
    created_by character varying(64),
    deadline timestamp(6) with time zone,
    dimension_code character varying(16),
    dimension_title character varying(256),
    display_order integer NOT NULL,
    due_date date,
    evidence_of_correction text,
    finding_description text,
    qa_review_case_id uuid,
    recommendation text NOT NULL,
    remediation_evidence_ref character varying(256),
    resolved_at timestamp(6) with time zone,
    responded_at timestamp(6) with time zone,
    responded_by character varying(64),
    severity character varying(32) NOT NULL,
    status character varying(32) NOT NULL,
    statutory_breach text,
    title character varying(256),
    updated_at timestamp(6) with time zone,
    version bigint NOT NULL,
    audit_case_id uuid NOT NULL
);


--
-- Name: qa_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.qa_reports (
    id uuid NOT NULL,
    critical_deficiencies_count integer,
    executive_summary text,
    generated_date character varying(255),
    key_strengths text,
    major_deficiencies_count integer,
    mandatory_corrective_actions text,
    overall_rating character varying(255),
    qa_case_id uuid,
    recommendations_for_director text,
    systemic_vulnerabilities text,
    total_weighted_score integer
);


--
-- Name: qa_review_case; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.qa_review_case (
    id uuid NOT NULL,
    assigned_at timestamp(6) with time zone,
    assigned_by character varying(64),
    assigned_qa_officer character varying(128),
    assigned_qa_officer_id character varying(64),
    audit_case_id uuid NOT NULL,
    audit_case_number character varying(64),
    audit_team_leader character varying(128),
    audit_team_leader_id character varying(64),
    audit_team_responded_by character varying(64),
    audit_team_response_date timestamp(6) with time zone,
    audit_team_response_notes text,
    audit_type character varying(32),
    case_number character varying(64) NOT NULL,
    closed_at timestamp(6) with time zone,
    closure_checked_at timestamp(6) with time zone,
    closure_checked_by character varying(64),
    closure_note text,
    created_at timestamp(6) with time zone NOT NULL,
    created_by character varying(64) NOT NULL,
    current_step character varying(16),
    director_executive_comment text,
    director_executive_decision_date timestamp(6) with time zone,
    director_statutory_order character varying(64),
    due_date date,
    last_saved_at timestamp(6) with time zone,
    lead_auditor character varying(128),
    lead_auditor_id character varying(64),
    overall_score integer NOT NULL,
    qa_director_id character varying(64),
    qa_team_leader character varying(128),
    qa_team_leader_comment text,
    qa_team_leader_decision_date timestamp(6) with time zone,
    qa_team_leader_id character varying(64),
    rating character varying(32),
    recommendations_addressed boolean,
    sampling_rule_code character varying(64),
    sampling_score integer,
    sampling_strategy character varying(32) NOT NULL,
    selected_by character varying(64),
    selection_date date NOT NULL,
    selection_reason character varying(32) NOT NULL,
    status character varying(32) NOT NULL,
    status_reason text,
    tax_period character varying(64),
    taxpayer_name character varying(256),
    tin character varying(32),
    total_tax_assessment numeric(18,2) NOT NULL,
    trade_name character varying(256),
    updated_at timestamp(6) with time zone,
    version bigint NOT NULL
);


--
-- Name: qa_review_dimension; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.qa_review_dimension (
    id uuid NOT NULL,
    category character varying(48) NOT NULL,
    checkpoints jsonb NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    dimension_code character varying(16) NOT NULL,
    display_order integer NOT NULL,
    qa_review_case_id uuid NOT NULL,
    reviewer_notes text,
    score integer NOT NULL,
    scored_at timestamp(6) with time zone,
    scored_by character varying(64),
    standards_reference character varying(256),
    status character varying(32) NOT NULL,
    title character varying(256) NOT NULL,
    updated_at timestamp(6) with time zone,
    weight integer NOT NULL
);


--
-- Name: qa_review_event; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.qa_review_event (
    id uuid NOT NULL,
    actor_id character varying(64),
    actor_name character varying(128),
    actor_role character varying(64),
    event_type character varying(64) NOT NULL,
    from_status character varying(32),
    metadata jsonb,
    notes text,
    occurred_at timestamp(6) with time zone NOT NULL,
    qa_review_case_id uuid NOT NULL,
    step_code character varying(16),
    to_status character varying(32)
);


--
-- Name: qa_review_report; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.qa_review_report (
    id uuid NOT NULL,
    adjusted_at timestamp(6) with time zone,
    adjusted_by character varying(64),
    adjustment_reason text,
    created_at timestamp(6) with time zone NOT NULL,
    critical_deficiencies_count integer NOT NULL,
    director_approval_signature character varying(128),
    executive_summary text,
    generated_by character varying(64),
    generated_date date NOT NULL,
    key_strengths jsonb NOT NULL,
    kind character varying(16) NOT NULL,
    lead_qa_officer_signature character varying(128),
    major_deficiencies_count integer NOT NULL,
    mandatory_corrective_actions jsonb NOT NULL,
    overall_rating character varying(32),
    qa_review_case_id uuid NOT NULL,
    qa_team_leader_signature character varying(128),
    recommendations_for_director text,
    report_reference character varying(64),
    return_reason text,
    signed_date timestamp(6) with time zone,
    status character varying(32) NOT NULL,
    systemic_vulnerabilities jsonb NOT NULL,
    tl_comment text,
    tl_decided_by character varying(64),
    tl_decision_at timestamp(6) with time zone,
    total_weighted_score integer NOT NULL,
    updated_at timestamp(6) with time zone,
    version bigint NOT NULL
);


--
-- Name: qa_sampling_rule; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.qa_sampling_rule (
    id uuid NOT NULL,
    is_active boolean NOT NULL,
    audit_types jsonb NOT NULL,
    code character varying(64) NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    created_by character varying(64) NOT NULL,
    effective_from date,
    effective_to date,
    exposure_threshold numeric(18,2),
    max_sample_size integer,
    name character varying(256) NOT NULL,
    sample_percentage numeric(5,2),
    selection_reason character varying(32) NOT NULL,
    strategy character varying(32) NOT NULL,
    updated_at timestamp(6) with time zone
);


--
-- Name: qa_sampling_run; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.qa_sampling_run (
    id uuid NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    created_count integer NOT NULL,
    dry_run boolean NOT NULL,
    evaluated_count integer NOT NULL,
    notes text,
    rule_code character varying(64),
    selected_count integer NOT NULL,
    strategy character varying(32),
    triggered_by character varying(64),
    window_from date,
    window_to date
);


--
-- Name: regions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.regions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(64) NOT NULL,
    name character varying(256) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL,
    granted_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    granted_by character varying(64)
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(64) NOT NULL,
    name character varying(128) NOT NULL,
    description text,
    is_system boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: security_audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.security_audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying(64),
    username character varying(64),
    action character varying(128) NOT NULL,
    resource_type character varying(128),
    resource_id character varying(128),
    ip_address character varying(64),
    user_agent text,
    outcome character varying(32) NOT NULL,
    detail jsonb,
    logged_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: shared_audit_trail_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shared_audit_trail_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entity_type character varying(64) NOT NULL,
    entity_id uuid NOT NULL,
    actor_id character varying(64) NOT NULL,
    action character varying(64) NOT NULL,
    reason text,
    state_before jsonb,
    state_after jsonb,
    occurred_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: shared_outbox_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shared_outbox_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    aggregate_type character varying(64) NOT NULL,
    aggregate_id uuid NOT NULL,
    event_type character varying(128) NOT NULL,
    payload jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    processed_at timestamp with time zone
);


--
-- Name: sla_tracking; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sla_tracking (
    task_id uuid NOT NULL,
    case_id uuid NOT NULL,
    assigned_role character varying(64) NOT NULL,
    due_at timestamp with time zone NOT NULL,
    warning_sent boolean DEFAULT false NOT NULL,
    warning_sent_at timestamp with time zone,
    escalation_sent boolean DEFAULT false NOT NULL,
    escalation_sent_at timestamp with time zone,
    resolved_at timestamp with time zone
);


--
-- Name: t_advisory_voting; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.t_advisory_voting (
    voting_id uuid NOT NULL,
    consensus_threshold integer,
    created_at timestamp(6) with time zone NOT NULL,
    status character varying(50) NOT NULL,
    voting_closed_at timestamp(6) with time zone,
    voting_started_at timestamp(6) with time zone NOT NULL,
    case_id uuid NOT NULL
);


--
-- Name: t_audit_document; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.t_audit_document (
    id uuid NOT NULL,
    case_id uuid NOT NULL,
    content_type character varying(128),
    created_at timestamp(6) with time zone NOT NULL,
    file_name character varying(256) NOT NULL,
    file_size bigint,
    file_url text,
    rejection_reason text,
    request_id uuid,
    status character varying(32),
    uploaded_by character varying(64) NOT NULL,
    verified_at timestamp(6) with time zone,
    verified_by character varying(255)
);


--
-- Name: t_audit_finding; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.t_audit_finding (
    id uuid NOT NULL,
    approved_at timestamp(6) with time zone,
    approved_by character varying(255),
    case_id uuid NOT NULL,
    category character varying(64),
    concluded_at timestamp(6) with time zone,
    concluded_by character varying(64),
    conclusion text,
    created_at timestamp(6) with time zone NOT NULL,
    created_by character varying(64) NOT NULL,
    description text,
    final_amount numeric(15,2),
    responded_at timestamp(6) with time zone,
    response_type character varying(32),
    revision_notes text,
    severity character varying(32),
    status character varying(32),
    taxpayer_evidence text,
    taxpayer_explanation text,
    title character varying(256) NOT NULL,
    updated_at timestamp(6) with time zone,
    interest_amount numeric(15,2),
    penalty_amount numeric(15,2),
    principal_amount numeric(15,2)
);


--
-- Name: t_audit_plan_record; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.t_audit_plan_record (
    id uuid NOT NULL,
    approved_at timestamp(6) with time zone,
    approved_by character varying(255),
    case_id uuid NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    methodology text,
    objectives text,
    resource_plan text,
    review_comments text,
    review_timestamp timestamp(6) with time zone,
    reviewed_by character varying(255),
    revision_notes text,
    scope text,
    status character varying(32),
    submitted_by character varying(64) NOT NULL,
    team_lead_id character varying(255),
    timeline text,
    updated_at timestamp(6) with time zone
);


--
-- Name: t_audit_team; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.t_audit_team (
    team_id uuid NOT NULL,
    active boolean NOT NULL,
    auditor_ids text NOT NULL,
    auditor_names text,
    capacity integer NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    current_cases integer NOT NULL,
    description character varying(500),
    team_leader_id uuid NOT NULL,
    team_leader_name character varying(255) NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    version bigint,
    tax_center character varying(100)
);


--
-- Name: t_auditor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.t_auditor (
    auditor_id uuid NOT NULL,
    active boolean NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    current_cases integer,
    email character varying(100),
    expertise character varying(100) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    max_cases integer,
    phone character varying(50),
    seniority character varying(50) NOT NULL,
    tax_center character varying(100),
    updated_at timestamp(6) with time zone,
    years_of_experience integer NOT NULL
);


--
-- Name: t_auditor_nomination; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.t_auditor_nomination (
    nomination_id uuid NOT NULL,
    justification text NOT NULL,
    nominated_at timestamp(6) with time zone NOT NULL,
    nominated_auditor_id uuid NOT NULL,
    nominating_member_id uuid NOT NULL,
    role character varying(20) NOT NULL,
    selected boolean NOT NULL,
    version bigint,
    case_id uuid NOT NULL
);


--
-- Name: t_caat_anomaly; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.t_caat_anomaly (
    id uuid NOT NULL,
    analysis_type character varying(128) NOT NULL,
    case_id uuid NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    description text NOT NULL,
    details text,
    run_at timestamp(6) with time zone NOT NULL,
    run_by character varying(64) NOT NULL,
    severity character varying(32),
    validated_at timestamp(6) with time zone,
    validated_by character varying(255),
    validation_notes text,
    validation_status character varying(32),
    amended_amount numeric(18,2),
    data_source character varying(160),
    evidence_ref character varying(128),
    expected_amount numeric(18,2),
    original_amount numeric(18,2),
    reported_amount numeric(18,2),
    rule_code character varying(64),
    tax_period character varying(64),
    tax_type character varying(96)
);


--
-- Name: t_case_status_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.t_case_status_history (
    history_id uuid NOT NULL,
    new_status character varying(50) NOT NULL,
    old_status character varying(50),
    transition_reason text,
    transitioned_at timestamp(6) with time zone NOT NULL,
    transitioned_by uuid NOT NULL,
    case_id uuid NOT NULL
);


--
-- Name: t_committee_audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.t_committee_audit_log (
    log_id uuid NOT NULL,
    action_hash character varying(64),
    action_reason text,
    action_timestamp timestamp(6) with time zone NOT NULL,
    action_type character varying(100) NOT NULL,
    actor_id uuid NOT NULL,
    after_state jsonb,
    before_state jsonb,
    ip_address character varying(45),
    case_id uuid NOT NULL
);


--
-- Name: t_committee_case; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.t_committee_case (
    case_id uuid NOT NULL,
    address character varying(255),
    assessment_score character varying(50),
    business_type character varying(100),
    case_code character varying(255),
    chairperson_id uuid,
    city character varying(100),
    committee_deadline timestamp(6) with time zone NOT NULL,
    compliance_issues jsonb,
    created_at timestamp(6) with time zone NOT NULL,
    created_by uuid NOT NULL,
    created_date timestamp(6) with time zone NOT NULL,
    current_owner_id uuid,
    decision character varying(50),
    decision_date timestamp(6) with time zone,
    decision_reason text,
    description text,
    extended_deadline timestamp(6) with time zone,
    extension_count integer,
    handoff_date timestamp(6) with time zone,
    handoff_record_id uuid,
    industry character varying(100),
    original_case_id uuid NOT NULL,
    ownership_acquired_at timestamp(6) with time zone,
    region character varying(100),
    representatives jsonb,
    risk_criteria jsonb,
    risk_indicators jsonb,
    risk_priority character varying(20),
    risk_score integer NOT NULL,
    segment character varying(50),
    status character varying(50) NOT NULL,
    tax_center character varying(100),
    tax_id_number character varying(50) NOT NULL,
    taxpayer_id uuid NOT NULL,
    taxpayer_name character varying(255) NOT NULL,
    team_lead_id uuid,
    total_amount numeric(38,2),
    updated_at timestamp(6) with time zone,
    version bigint,
    team_id uuid
);


--
-- Name: t_committee_session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.t_committee_session (
    session_id uuid NOT NULL,
    actual_end_time timestamp(6) with time zone,
    actual_start_time timestamp(6) with time zone,
    agenda text,
    chairperson_id uuid NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    location character varying(255),
    scheduled_date timestamp(6) with time zone NOT NULL,
    session_minutes text,
    session_name character varying(255) NOT NULL,
    status character varying(50) NOT NULL,
    updated_at timestamp(6) with time zone,
    version bigint
);


--
-- Name: t_committee_vote; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.t_committee_vote (
    vote_id uuid NOT NULL,
    member_id uuid NOT NULL,
    reasoning text,
    version bigint,
    vote_option character varying(20) NOT NULL,
    voted_at timestamp(6) with time zone NOT NULL,
    case_id uuid NOT NULL,
    voting_id uuid NOT NULL
);


--
-- Name: t_conference_record; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.t_conference_record (
    id uuid NOT NULL,
    agenda text,
    approved_at timestamp(6) with time zone,
    approved_by character varying(255),
    case_id uuid NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    location character varying(128),
    minutes text,
    minutes_recorded_by character varying(255),
    scheduled_by character varying(64),
    scheduled_date timestamp(6) with time zone,
    status character varying(32),
    updated_at timestamp(6) with time zone
);


--
-- Name: t_document_request_record; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.t_document_request_record (
    id uuid NOT NULL,
    case_id uuid NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    description text,
    document_type character varying(128) NOT NULL,
    due_date timestamp(6) with time zone,
    follow_up_count integer,
    follow_up_message text,
    requested_by character varying(64) NOT NULL,
    status character varying(32),
    updated_at timestamp(6) with time zone
);


--
-- Name: t_handoff_record; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.t_handoff_record (
    handoff_id uuid NOT NULL,
    case_code character varying(50) NOT NULL,
    committee_summary text,
    created_by uuid NOT NULL,
    decision character varying(50) NOT NULL,
    delivered_at timestamp(6) with time zone,
    execution_case_id uuid,
    handoff_date timestamp(6) with time zone NOT NULL,
    key_findings text,
    team_lead_id uuid NOT NULL,
    version bigint,
    case_id uuid NOT NULL
);


--
-- Name: t_handoff_team_member; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.t_handoff_team_member (
    member_id uuid NOT NULL,
    assigned_at timestamp(6) with time zone NOT NULL,
    auditor_id uuid NOT NULL,
    role character varying(50),
    handoff_id uuid NOT NULL
);


--
-- Name: t_research_attachment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.t_research_attachment (
    attachment_id uuid NOT NULL,
    file_name character varying(255) NOT NULL,
    file_path character varying(255) NOT NULL,
    file_size bigint,
    file_type character varying(50),
    uploaded_at timestamp(6) with time zone NOT NULL,
    uploaded_by uuid NOT NULL,
    note_id uuid NOT NULL
);


--
-- Name: t_research_comment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.t_research_comment (
    comment_id uuid NOT NULL,
    author_id uuid NOT NULL,
    author_name character varying(200),
    content text NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    version bigint,
    note_id uuid NOT NULL,
    replied_to_comment_id uuid
);


--
-- Name: t_research_note; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.t_research_note (
    note_id uuid NOT NULL,
    author_id uuid NOT NULL,
    author_name character varying(200),
    category character varying(50) NOT NULL,
    content text NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    updated_at timestamp(6) with time zone,
    version bigint,
    case_id uuid NOT NULL
);


--
-- Name: t_session_attendee; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.t_session_attendee (
    attendee_id uuid NOT NULL,
    attendance_status character varying(50),
    attended_at timestamp(6) with time zone,
    confirmed_at timestamp(6) with time zone,
    created_at timestamp(6) with time zone NOT NULL,
    member_id uuid NOT NULL,
    session_id uuid NOT NULL
);


--
-- Name: t_user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.t_user (
    user_id uuid NOT NULL,
    assigned_level character varying(50) NOT NULL,
    assigned_location character varying(100),
    audit_type character varying(50),
    created_at timestamp(6) with time zone NOT NULL,
    email character varying(150) NOT NULL,
    full_name character varying(255) NOT NULL,
    status character varying(20) NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    user_type character varying(50) NOT NULL,
    username character varying(100) NOT NULL,
    failed_login_count integer,
    last_login_at timestamp(6) with time zone,
    locked_until timestamp(6) with time zone,
    must_change_password boolean,
    password_changed_at timestamp(6) with time zone,
    password_hash character varying(255)
);


--
-- Name: t_voting_tally; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.t_voting_tally (
    tally_id uuid NOT NULL,
    approve_count integer,
    calculated_at timestamp(6) with time zone,
    consensus_percentage numeric(5,2),
    more_info_count integer,
    reject_count integer,
    total_votes_cast integer,
    voting_outcome character varying(50),
    voting_id uuid NOT NULL
);


--
-- Name: t_working_paper; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.t_working_paper (
    id uuid NOT NULL,
    case_id uuid NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    created_by character varying(64) NOT NULL,
    description text,
    evidence_file_name character varying(256),
    evidence_file_url text,
    evidence_summary text,
    status character varying(32),
    title character varying(256) NOT NULL,
    updated_at timestamp(6) with time zone
);


--
-- Name: tax_centers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tax_centers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(64) NOT NULL,
    region_id uuid NOT NULL,
    name character varying(256) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: team_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_members (
    team_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role_in_team character varying(64) DEFAULT 'AUDITOR'::character varying NOT NULL,
    joined_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    left_at timestamp with time zone,
    is_active boolean DEFAULT true NOT NULL,
    id uuid DEFAULT gen_random_uuid(),
    team_leader_id uuid,
    auditor_id uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: teams; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teams (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(64) NOT NULL,
    name character varying(256) NOT NULL,
    team_type character varying(64) DEFAULT 'TP_AUDIT'::character varying NOT NULL,
    org_unit_id uuid NOT NULL,
    team_leader_id uuid,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: tp_analysis_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tp_analysis_data (
    id uuid NOT NULL,
    arms_length_analysis jsonb,
    arms_length_range_max numeric(18,4),
    arms_length_range_min numeric(18,4),
    audit_case_id uuid,
    benchmark_comparisons jsonb,
    cost_expense_selections jsonb,
    created_at timestamp(6) with time zone,
    created_by character varying(255),
    cross_border_assessments jsonb,
    customs_valuation_matches jsonb,
    method_selection jsonb,
    ratio_analyses jsonb,
    selected_tp_method character varying(50),
    status character varying(50),
    taxpayer_actual_result numeric(18,4),
    updated_at timestamp(6) with time zone,
    updated_by character varying(255),
    variance_amount numeric(18,4),
    variance_percentage numeric(10,4)
);


--
-- Name: tp_audit_action_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tp_audit_action_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    audit_case_id uuid NOT NULL,
    action_sequence integer NOT NULL,
    action_type character varying(100) NOT NULL,
    action_phase character varying(100),
    actor_id character varying(255) NOT NULL,
    actor_role character varying(100),
    summary text NOT NULL,
    detail jsonb,
    before_status character varying(100),
    after_status character varying(100),
    reference_id uuid,
    reference_type character varying(100),
    action_timestamp timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: tp_audit_action_history_action_sequence_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tp_audit_action_history_action_sequence_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tp_audit_action_history_action_sequence_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tp_audit_action_history_action_sequence_seq OWNED BY public.tp_audit_action_history.action_sequence;


--
-- Name: tp_audit_notice; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tp_audit_notice (
    id uuid NOT NULL,
    action_plan_details text,
    assessed_principal_tax numeric(18,2),
    audit_case_id uuid,
    audit_period character varying(100),
    created_at timestamp(6) with time zone,
    delivery_method character varying(50),
    delivery_status character varying(50),
    delivery_timestamp timestamp(6) with time zone,
    interest numeric(18,2),
    issue_date date,
    issues_summary text,
    notice_reference_number character varying(100),
    penalties numeric(18,2),
    proposed_adjustments_summary text,
    response_deadline date,
    returned_reason text,
    status character varying(50) NOT NULL,
    taxpayer_name character varying(256),
    tin character varying(64),
    total_assessment_amount numeric(18,2),
    updated_at timestamp(6) with time zone
);


--
-- Name: tp_audit_plan; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tp_audit_plan (
    id uuid NOT NULL,
    audit_case_id uuid NOT NULL,
    objective text,
    scope text,
    materiality_details jsonb,
    industry_research jsonb,
    sampling_method jsonb,
    planned_procedures jsonb,
    status character varying(50) NOT NULL,
    approved_by character varying(255),
    approved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(255),
    updated_by character varying(255)
);


--
-- Name: tp_audit_report; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tp_audit_report (
    id uuid NOT NULL,
    audit_background text,
    audit_case_id uuid,
    author_id character varying(255),
    authorized_official_review jsonb,
    compliance_assessment text,
    created_at timestamp(6) with time zone,
    executive_summary text,
    exit_conference jsonb,
    findings_and_conclusions text,
    issues_analyzed jsonb,
    procedures_performed text,
    process_owner_review jsonb,
    scope text,
    status character varying(100) NOT NULL,
    taxpayer_response jsonb,
    team_leader_review jsonb,
    updated_at timestamp(6) with time zone,
    version integer NOT NULL
);


--
-- Name: tp_competitor_price_uploads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tp_competitor_price_uploads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    audit_case_id uuid NOT NULL,
    upload_reference character varying(50) NOT NULL,
    product_name character varying(512) NOT NULL,
    product_hs_code character varying(20),
    competitor_name character varying(512) NOT NULL,
    competitor_tin character varying(64),
    import_price numeric(19,4) NOT NULL,
    currency character varying(10) DEFAULT 'USD'::character varying NOT NULL,
    price_date date NOT NULL,
    source character varying(50) DEFAULT 'MANUAL'::character varying NOT NULL,
    data_source_ref character varying(255),
    uploaded_by character varying(255) NOT NULL,
    upload_notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: tp_exit_conference; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tp_exit_conference (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    audit_case_id uuid NOT NULL,
    conference_reference character varying(50) NOT NULL,
    proposed_date timestamp with time zone,
    confirmed_date timestamp with time zone,
    venue character varying(512) DEFAULT 'MoR Tax Office — Interview Room'::character varying NOT NULL,
    agenda_template character varying(50) DEFAULT 'STD_TP_EXIT'::character varying,
    taxpayer_contact character varying(255),
    scheduling_status character varying(50) DEFAULT 'PROPOSED'::character varying NOT NULL,
    taxpayer_rescheduled_to timestamp with time zone,
    reschedule_reason text,
    reschedule_approved boolean,
    notification_sent boolean DEFAULT false,
    notification_sent_at timestamp with time zone,
    notification_channel character varying(50),
    meeting_held_at timestamp with time zone,
    auditor_notes text,
    taxpayer_observations text,
    agreed_adjustments jsonb,
    audio_record_ref character varying(512),
    taxpayer_signed boolean DEFAULT false,
    taxpayer_signed_at timestamp with time zone,
    taxpayer_signature_ref character varying(512),
    created_by character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: tp_external_price_match; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tp_external_price_match (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    audit_case_id uuid NOT NULL,
    match_reference character varying(50) NOT NULL,
    product_hs_code character varying(20),
    product_name character varying(512),
    taxpayer_import_price numeric(19,4) NOT NULL,
    market_price_min numeric(19,4),
    market_price_max numeric(19,4),
    market_price_median numeric(19,4),
    price_variance_amount numeric(19,4),
    price_variance_pct numeric(10,4),
    discrepancy_flag boolean DEFAULT false NOT NULL,
    discrepancy_threshold numeric(10,4) DEFAULT 5.00,
    validation_status character varying(50) DEFAULT 'PENDING'::character varying NOT NULL,
    auditor_validation_notes text,
    validated_by character varying(255),
    validated_at timestamp with time zone,
    generated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    generated_by character varying(255) NOT NULL
);


--
-- Name: tp_field_work_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tp_field_work_data (
    id uuid NOT NULL,
    accounting_findings jsonb,
    accounting_methods text,
    audit_case_id uuid,
    created_at timestamp(6) with time zone,
    created_by character varying(255),
    fact_statement jsonb,
    fact_statement_status character varying(50),
    fact_statement_version integer,
    information_requests jsonb,
    sample_selections jsonb,
    status character varying(50),
    structured_discussions jsonb,
    transaction_trails jsonb,
    updated_at timestamp(6) with time zone,
    updated_by character varying(255)
);


--
-- Name: tp_information_request_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tp_information_request_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    audit_case_id uuid NOT NULL,
    request_reference character varying(50) NOT NULL,
    request_type character varying(50) NOT NULL,
    subject character varying(512) NOT NULL,
    description text NOT NULL,
    documents_requested text[],
    deadline_date date,
    status character varying(50) DEFAULT 'DRAFT'::character varying NOT NULL,
    submitted_by character varying(255) NOT NULL,
    submitted_at timestamp with time zone,
    approved_by character varying(255),
    approved_at timestamp with time zone,
    approval_comments text,
    taxpayer_response text,
    evidence_uploaded boolean DEFAULT false,
    evidence_file_refs text[],
    response_received_at timestamp with time zone,
    is_overdue boolean DEFAULT false,
    overdue_flagged_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: tp_management_report_snapshot; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tp_management_report_snapshot (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    report_type character varying(100) NOT NULL,
    report_period character varying(20) NOT NULL,
    tax_center_id character varying(100),
    report_data jsonb NOT NULL,
    generated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    generated_by character varying(255) NOT NULL,
    is_current boolean DEFAULT true
);


--
-- Name: tp_objection; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tp_objection (
    id uuid NOT NULL,
    adjusted_assessment_amount numeric(18,2),
    audit_case_id uuid,
    created_at timestamp(6) with time zone,
    disputed_tp_analysis_sections text,
    factual_explanation text,
    legal_arguments text,
    notice_id uuid,
    notice_provision_referenced text,
    objection_date timestamp(6) with time zone,
    review_comments text,
    review_result character varying(100),
    reviewed_at timestamp(6) with time zone,
    reviewer_id character varying(255),
    status character varying(50) NOT NULL,
    supporting_evidence_refs jsonb,
    taxpayer_id character varying(64),
    updated_at timestamp(6) with time zone
);


--
-- Name: tp_phase_gates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tp_phase_gates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    audit_case_id uuid NOT NULL,
    phase_id character varying(50) NOT NULL,
    status character varying(50) DEFAULT 'DRAFT'::character varying NOT NULL,
    sub_steps_completed jsonb DEFAULT '[]'::jsonb,
    sub_step_data jsonb DEFAULT '{}'::jsonb,
    submitted_at timestamp with time zone,
    submitted_by character varying(100),
    reviewed_at timestamp with time zone,
    reviewed_by character varying(100),
    reviewer_role character varying(50),
    review_decision character varying(50),
    review_comments text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: tp_planning_meeting; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tp_planning_meeting (
    id uuid NOT NULL,
    agenda text,
    audit_case_id uuid,
    created_at timestamp(6) with time zone,
    decision character varying(50),
    decision_timestamp timestamp(6) with time zone,
    discussion_notes text,
    participants jsonb,
    recorded_by character varying(255),
    scheduled_date timestamp(6) with time zone,
    updated_at timestamp(6) with time zone
);


--
-- Name: tp_risk_assessment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tp_risk_assessment (
    id uuid NOT NULL,
    audit_case_id uuid NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    risk_level character varying(50),
    assessment_status character varying(50) NOT NULL,
    risk_details jsonb,
    comments text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(255),
    updated_by character varying(255)
);


--
-- Name: tp_working_hypothesis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tp_working_hypothesis (
    id uuid NOT NULL,
    audit_case_id uuid NOT NULL,
    hypothesis_description text,
    identified_issue text,
    economic_rationale text,
    revenue_at_risk numeric(19,2),
    currency character varying(10) DEFAULT 'ETB'::character varying,
    status character varying(50) NOT NULL,
    calculation_details jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(255),
    updated_by character varying(255)
);


--
-- Name: user_organizational_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_organizational_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    region_id uuid NOT NULL,
    tax_center_id uuid NOT NULL,
    audit_type_id uuid,
    committee_id uuid,
    team_id uuid,
    team_leader_id uuid,
    role_code character varying(64) NOT NULL,
    status character varying(32) DEFAULT 'ACTIVE'::character varying NOT NULL,
    effective_from timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    effective_to timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    user_id uuid NOT NULL,
    role_id uuid NOT NULL,
    assigned_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    assigned_by character varying(64)
);


--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    refresh_token_hash character varying(256) NOT NULL,
    ip_address character varying(64),
    user_agent text,
    issued_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    revoked_at timestamp with time zone,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    username character varying(64) NOT NULL,
    email character varying(256) NOT NULL,
    full_name character varying(256) NOT NULL,
    keycloak_user_id character varying(256),
    employee_id character varying(64),
    org_unit_id uuid,
    is_active boolean DEFAULT true NOT NULL,
    last_login_at timestamp with time zone,
    failed_login_count integer DEFAULT 0 NOT NULL,
    locked_until timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: workflow_definitions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflow_definitions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(128) NOT NULL,
    name character varying(256) NOT NULL,
    audit_type character varying(64) DEFAULT 'TRANSFER_PRICING'::character varying NOT NULL,
    artifact_type character varying(128) NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: workflow_instances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflow_instances (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    definition_id uuid NOT NULL,
    case_id uuid NOT NULL,
    artifact_id uuid NOT NULL,
    artifact_type character varying(128) NOT NULL,
    current_step_id uuid,
    status character varying(64) DEFAULT 'IN_PROGRESS'::character varying NOT NULL,
    initiated_by character varying(64) NOT NULL,
    started_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at timestamp with time zone,
    current_step_number integer,
    version integer DEFAULT 0
);


--
-- Name: workflow_steps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflow_steps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    definition_id uuid NOT NULL,
    step_order integer NOT NULL,
    step_name character varying(128) NOT NULL,
    required_role character varying(64) NOT NULL,
    approval_type character varying(64) DEFAULT 'REQUIRED'::character varying NOT NULL,
    condition_type character varying(64),
    condition_value character varying(128),
    sla_hours integer DEFAULT 72 NOT NULL,
    escalate_after_hours integer DEFAULT 96 NOT NULL,
    escalate_to_role character varying(64),
    is_active boolean DEFAULT true NOT NULL,
    description character varying(255),
    required_permission character varying(64),
    assigned_role character varying(64) NOT NULL,
    can_reject boolean NOT NULL,
    can_return boolean NOT NULL,
    step_number integer NOT NULL
);


--
-- Name: workflow_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workflow_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    instance_id uuid NOT NULL,
    step_id uuid NOT NULL,
    case_id uuid NOT NULL,
    artifact_id uuid NOT NULL,
    artifact_type character varying(128) NOT NULL,
    task_title character varying(256) NOT NULL,
    task_description text,
    assigned_to_user_id character varying(64),
    assigned_to_role character varying(64) NOT NULL,
    assigned_to_org_unit_id uuid,
    status character varying(64) DEFAULT 'PENDING'::character varying NOT NULL,
    priority character varying(16) DEFAULT 'NORMAL'::character varying NOT NULL,
    due_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at timestamp with time zone,
    completed_by character varying(64),
    decision character varying(64),
    comments text,
    return_reason text,
    version_reviewed integer,
    escalated_at timestamp with time zone,
    escalation_reason text
);


--
-- Name: tp_audit_action_history action_sequence; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tp_audit_action_history ALTER COLUMN action_sequence SET DEFAULT nextval('public.tp_audit_action_history_action_sequence_seq'::regclass);


--
-- Name: ap_annual_audit_plans ap_annual_audit_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_annual_audit_plans
    ADD CONSTRAINT ap_annual_audit_plans_pkey PRIMARY KEY (id);


--
-- Name: ap_audit_cases ap_audit_cases_case_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_audit_cases
    ADD CONSTRAINT ap_audit_cases_case_number_key UNIQUE (case_number);


--
-- Name: ap_audit_cases ap_audit_cases_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_audit_cases
    ADD CONSTRAINT ap_audit_cases_pkey PRIMARY KEY (id);


--
-- Name: ap_director_approvals ap_director_approvals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_director_approvals
    ADD CONSTRAINT ap_director_approvals_pkey PRIMARY KEY (id);


--
-- Name: ap_plan_allocations ap_plan_allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_plan_allocations
    ADD CONSTRAINT ap_plan_allocations_pkey PRIMARY KEY (id);


--
-- Name: ap_plan_audit_logs ap_plan_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_plan_audit_logs
    ADD CONSTRAINT ap_plan_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: ap_plan_revisions ap_plan_revisions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_plan_revisions
    ADD CONSTRAINT ap_plan_revisions_pkey PRIMARY KEY (id);


--
-- Name: ap_plan_timeline ap_plan_timeline_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_plan_timeline
    ADD CONSTRAINT ap_plan_timeline_pkey PRIMARY KEY (id);


--
-- Name: ap_planning_configuration ap_planning_configuration_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_planning_configuration
    ADD CONSTRAINT ap_planning_configuration_pkey PRIMARY KEY (id);


--
-- Name: ap_regional_deployments ap_regional_deployments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_regional_deployments
    ADD CONSTRAINT ap_regional_deployments_pkey PRIMARY KEY (id);


--
-- Name: ap_regional_feedback ap_regional_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_regional_feedback
    ADD CONSTRAINT ap_regional_feedback_pkey PRIMARY KEY (id);


--
-- Name: ap_regional_plan_access ap_regional_plan_access_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_regional_plan_access
    ADD CONSTRAINT ap_regional_plan_access_pkey PRIMARY KEY (id);


--
-- Name: ap_regional_tc_deployments ap_regional_tc_deployments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_regional_tc_deployments
    ADD CONSTRAINT ap_regional_tc_deployments_pkey PRIMARY KEY (id);


--
-- Name: audit_types audit_types_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_types
    ADD CONSTRAINT audit_types_code_key UNIQUE (code);


--
-- Name: audit_types audit_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_types
    ADD CONSTRAINT audit_types_pkey PRIMARY KEY (id);


--
-- Name: ca_approval_steps ca_approval_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_approval_steps
    ADD CONSTRAINT ca_approval_steps_pkey PRIMARY KEY (id);


--
-- Name: ca_assessment_notices ca_assessment_notices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_assessment_notices
    ADD CONSTRAINT ca_assessment_notices_pkey PRIMARY KEY (id);


--
-- Name: ca_audit_assertions ca_audit_assertions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_audit_assertions
    ADD CONSTRAINT ca_audit_assertions_pkey PRIMARY KEY (id);


--
-- Name: ca_audit_findings ca_audit_findings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_audit_findings
    ADD CONSTRAINT ca_audit_findings_pkey PRIMARY KEY (id);


--
-- Name: ca_balance_sheet_items ca_balance_sheet_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_balance_sheet_items
    ADD CONSTRAINT ca_balance_sheet_items_pkey PRIMARY KEY (id);


--
-- Name: ca_benchmark_analyses ca_benchmark_analyses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_benchmark_analyses
    ADD CONSTRAINT ca_benchmark_analyses_pkey PRIMARY KEY (id);


--
-- Name: ca_benford_analysis ca_benford_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_benford_analysis
    ADD CONSTRAINT ca_benford_analysis_pkey PRIMARY KEY (id);


--
-- Name: ca_caat_eligibility ca_caat_eligibility_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_caat_eligibility
    ADD CONSTRAINT ca_caat_eligibility_pkey PRIMARY KEY (id);


--
-- Name: ca_caat_exceptions ca_caat_exceptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_caat_exceptions
    ADD CONSTRAINT ca_caat_exceptions_pkey PRIMARY KEY (id);


--
-- Name: ca_caat_rules ca_caat_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_caat_rules
    ADD CONSTRAINT ca_caat_rules_pkey PRIMARY KEY (id);


--
-- Name: ca_caat_runs ca_caat_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_caat_runs
    ADD CONSTRAINT ca_caat_runs_pkey PRIMARY KEY (id);


--
-- Name: ca_case_snapshots ca_case_snapshots_case_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_case_snapshots
    ADD CONSTRAINT ca_case_snapshots_case_id_key UNIQUE (case_id);


--
-- Name: ca_case_snapshots ca_case_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_case_snapshots
    ADD CONSTRAINT ca_case_snapshots_pkey PRIMARY KEY (id);


--
-- Name: ca_document_requests ca_document_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_document_requests
    ADD CONSTRAINT ca_document_requests_pkey PRIMARY KEY (id);


--
-- Name: ca_draft_reports ca_draft_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_draft_reports
    ADD CONSTRAINT ca_draft_reports_pkey PRIMARY KEY (id);


--
-- Name: ca_entry_conferences ca_entry_conferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_entry_conferences
    ADD CONSTRAINT ca_entry_conferences_pkey PRIMARY KEY (id);


--
-- Name: ca_execution_reports ca_execution_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_execution_reports
    ADD CONSTRAINT ca_execution_reports_pkey PRIMARY KEY (id);


--
-- Name: ca_exit_conferences ca_exit_conferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_exit_conferences
    ADD CONSTRAINT ca_exit_conferences_pkey PRIMARY KEY (id);


--
-- Name: ca_multi_zone_allocations ca_multi_zone_allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_multi_zone_allocations
    ADD CONSTRAINT ca_multi_zone_allocations_pkey PRIMARY KEY (id);


--
-- Name: ca_query_sheets ca_query_sheets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_query_sheets
    ADD CONSTRAINT ca_query_sheets_pkey PRIMARY KEY (id);


--
-- Name: ca_reconciliations ca_reconciliations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_reconciliations
    ADD CONSTRAINT ca_reconciliations_pkey PRIMARY KEY (id);


--
-- Name: ca_sampling_records ca_sampling_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_sampling_records
    ADD CONSTRAINT ca_sampling_records_pkey PRIMARY KEY (id);


--
-- Name: ca_taxpayer_responses ca_taxpayer_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_taxpayer_responses
    ADD CONSTRAINT ca_taxpayer_responses_pkey PRIMARY KEY (id);


--
-- Name: ca_third_party_matches ca_third_party_matches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_third_party_matches
    ADD CONSTRAINT ca_third_party_matches_pkey PRIMARY KEY (id);


--
-- Name: ca_working_papers ca_working_papers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_working_papers
    ADD CONSTRAINT ca_working_papers_pkey PRIMARY KEY (id);


--
-- Name: case_assignments case_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.case_assignments
    ADD CONSTRAINT case_assignments_pkey PRIMARY KEY (id);


--
-- Name: case_auditor_assignment case_auditor_assignment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.case_auditor_assignment
    ADD CONSTRAINT case_auditor_assignment_pkey PRIMARY KEY (id);


--
-- Name: case_handoff case_handoff_case_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.case_handoff
    ADD CONSTRAINT case_handoff_case_id_key UNIQUE (case_id);


--
-- Name: case_handoff case_handoff_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.case_handoff
    ADD CONSTRAINT case_handoff_pkey PRIMARY KEY (id);


--
-- Name: committees committees_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.committees
    ADD CONSTRAINT committees_code_key UNIQUE (code);


--
-- Name: committees committees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.committees
    ADD CONSTRAINT committees_pkey PRIMARY KEY (id);


--
-- Name: da_audit_procedures da_audit_procedures_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.da_audit_procedures
    ADD CONSTRAINT da_audit_procedures_pkey PRIMARY KEY (id);


--
-- Name: da_case_snapshots da_case_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.da_case_snapshots
    ADD CONSTRAINT da_case_snapshots_pkey PRIMARY KEY (id);


--
-- Name: da_draft_reports da_draft_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.da_draft_reports
    ADD CONSTRAINT da_draft_reports_pkey PRIMARY KEY (id);


--
-- Name: da_evidence da_evidence_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.da_evidence
    ADD CONSTRAINT da_evidence_pkey PRIMARY KEY (id);


--
-- Name: da_findings da_findings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.da_findings
    ADD CONSTRAINT da_findings_pkey PRIMARY KEY (id);


--
-- Name: da_queries da_queries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.da_queries
    ADD CONSTRAINT da_queries_pkey PRIMARY KEY (id);


--
-- Name: da_working_papers da_working_papers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.da_working_papers
    ADD CONSTRAINT da_working_papers_pkey PRIMARY KEY (id);


--
-- Name: flyway_schema_history flyway_schema_history_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flyway_schema_history
    ADD CONSTRAINT flyway_schema_history_pk PRIMARY KEY (installed_rank);


--
-- Name: issue_audit_details issue_audit_details_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_audit_details
    ADD CONSTRAINT issue_audit_details_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: organizational_units organizational_units_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizational_units
    ADD CONSTRAINT organizational_units_code_key UNIQUE (code);


--
-- Name: organizational_units organizational_units_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizational_units
    ADD CONSTRAINT organizational_units_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_code_key UNIQUE (code);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: qa_action_plans qa_action_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_action_plans
    ADD CONSTRAINT qa_action_plans_pkey PRIMARY KEY (id);


--
-- Name: qa_deficiencies qa_deficiencies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_deficiencies
    ADD CONSTRAINT qa_deficiencies_pkey PRIMARY KEY (id);


--
-- Name: qa_exit_conferences qa_exit_conferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_exit_conferences
    ADD CONSTRAINT qa_exit_conferences_pkey PRIMARY KEY (id);


--
-- Name: qa_follow_up_action qa_follow_up_action_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_follow_up_action
    ADD CONSTRAINT qa_follow_up_action_pkey PRIMARY KEY (id);


--
-- Name: qa_follow_ups qa_follow_ups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_follow_ups
    ADD CONSTRAINT qa_follow_ups_pkey PRIMARY KEY (id);


--
-- Name: qa_recommendations qa_recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_recommendations
    ADD CONSTRAINT qa_recommendations_pkey PRIMARY KEY (id);


--
-- Name: qa_reports qa_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_reports
    ADD CONSTRAINT qa_reports_pkey PRIMARY KEY (id);


--
-- Name: qa_review_case qa_review_case_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_review_case
    ADD CONSTRAINT qa_review_case_pkey PRIMARY KEY (id);


--
-- Name: qa_review_dimension qa_review_dimension_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_review_dimension
    ADD CONSTRAINT qa_review_dimension_pkey PRIMARY KEY (id);


--
-- Name: qa_review_event qa_review_event_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_review_event
    ADD CONSTRAINT qa_review_event_pkey PRIMARY KEY (id);


--
-- Name: qa_review_report qa_review_report_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_review_report
    ADD CONSTRAINT qa_review_report_pkey PRIMARY KEY (id);


--
-- Name: qa_sampling_rule qa_sampling_rule_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_sampling_rule
    ADD CONSTRAINT qa_sampling_rule_pkey PRIMARY KEY (id);


--
-- Name: qa_sampling_run qa_sampling_run_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_sampling_run
    ADD CONSTRAINT qa_sampling_run_pkey PRIMARY KEY (id);


--
-- Name: regions regions_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_code_key UNIQUE (code);


--
-- Name: regions regions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regions
    ADD CONSTRAINT regions_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- Name: roles roles_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_code_key UNIQUE (code);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: security_audit_log security_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_audit_log
    ADD CONSTRAINT security_audit_log_pkey PRIMARY KEY (id);


--
-- Name: shared_audit_trail_entries shared_audit_trail_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shared_audit_trail_entries
    ADD CONSTRAINT shared_audit_trail_entries_pkey PRIMARY KEY (id);


--
-- Name: shared_outbox_entries shared_outbox_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shared_outbox_entries
    ADD CONSTRAINT shared_outbox_entries_pkey PRIMARY KEY (id);


--
-- Name: sla_tracking sla_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sla_tracking
    ADD CONSTRAINT sla_tracking_pkey PRIMARY KEY (task_id);


--
-- Name: t_advisory_voting t_advisory_voting_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_advisory_voting
    ADD CONSTRAINT t_advisory_voting_pkey PRIMARY KEY (voting_id);


--
-- Name: t_audit_document t_audit_document_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_audit_document
    ADD CONSTRAINT t_audit_document_pkey PRIMARY KEY (id);


--
-- Name: t_audit_finding t_audit_finding_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_audit_finding
    ADD CONSTRAINT t_audit_finding_pkey PRIMARY KEY (id);


--
-- Name: t_audit_plan_record t_audit_plan_record_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_audit_plan_record
    ADD CONSTRAINT t_audit_plan_record_pkey PRIMARY KEY (id);


--
-- Name: t_audit_team t_audit_team_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_audit_team
    ADD CONSTRAINT t_audit_team_pkey PRIMARY KEY (team_id);


--
-- Name: t_auditor_nomination t_auditor_nomination_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_auditor_nomination
    ADD CONSTRAINT t_auditor_nomination_pkey PRIMARY KEY (nomination_id);


--
-- Name: t_auditor t_auditor_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_auditor
    ADD CONSTRAINT t_auditor_pkey PRIMARY KEY (auditor_id);


--
-- Name: t_caat_anomaly t_caat_anomaly_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_caat_anomaly
    ADD CONSTRAINT t_caat_anomaly_pkey PRIMARY KEY (id);


--
-- Name: t_case_status_history t_case_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_case_status_history
    ADD CONSTRAINT t_case_status_history_pkey PRIMARY KEY (history_id);


--
-- Name: t_committee_audit_log t_committee_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_committee_audit_log
    ADD CONSTRAINT t_committee_audit_log_pkey PRIMARY KEY (log_id);


--
-- Name: t_committee_case t_committee_case_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_committee_case
    ADD CONSTRAINT t_committee_case_pkey PRIMARY KEY (case_id);


--
-- Name: t_committee_session t_committee_session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_committee_session
    ADD CONSTRAINT t_committee_session_pkey PRIMARY KEY (session_id);


--
-- Name: t_committee_vote t_committee_vote_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_committee_vote
    ADD CONSTRAINT t_committee_vote_pkey PRIMARY KEY (vote_id);


--
-- Name: t_conference_record t_conference_record_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_conference_record
    ADD CONSTRAINT t_conference_record_pkey PRIMARY KEY (id);


--
-- Name: t_document_request_record t_document_request_record_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_document_request_record
    ADD CONSTRAINT t_document_request_record_pkey PRIMARY KEY (id);


--
-- Name: t_handoff_record t_handoff_record_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_handoff_record
    ADD CONSTRAINT t_handoff_record_pkey PRIMARY KEY (handoff_id);


--
-- Name: t_handoff_team_member t_handoff_team_member_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_handoff_team_member
    ADD CONSTRAINT t_handoff_team_member_pkey PRIMARY KEY (member_id);


--
-- Name: t_research_attachment t_research_attachment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_research_attachment
    ADD CONSTRAINT t_research_attachment_pkey PRIMARY KEY (attachment_id);


--
-- Name: t_research_comment t_research_comment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_research_comment
    ADD CONSTRAINT t_research_comment_pkey PRIMARY KEY (comment_id);


--
-- Name: t_research_note t_research_note_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_research_note
    ADD CONSTRAINT t_research_note_pkey PRIMARY KEY (note_id);


--
-- Name: t_session_attendee t_session_attendee_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_session_attendee
    ADD CONSTRAINT t_session_attendee_pkey PRIMARY KEY (attendee_id);


--
-- Name: t_user t_user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_user
    ADD CONSTRAINT t_user_pkey PRIMARY KEY (user_id);


--
-- Name: t_voting_tally t_voting_tally_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_voting_tally
    ADD CONSTRAINT t_voting_tally_pkey PRIMARY KEY (tally_id);


--
-- Name: t_working_paper t_working_paper_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_working_paper
    ADD CONSTRAINT t_working_paper_pkey PRIMARY KEY (id);


--
-- Name: tax_centers tax_centers_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tax_centers
    ADD CONSTRAINT tax_centers_code_key UNIQUE (code);


--
-- Name: tax_centers tax_centers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tax_centers
    ADD CONSTRAINT tax_centers_pkey PRIMARY KEY (id);


--
-- Name: team_members team_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_pkey PRIMARY KEY (team_id, user_id);


--
-- Name: teams teams_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_code_key UNIQUE (code);


--
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- Name: tp_analysis_data tp_analysis_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tp_analysis_data
    ADD CONSTRAINT tp_analysis_data_pkey PRIMARY KEY (id);


--
-- Name: tp_audit_action_history tp_audit_action_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tp_audit_action_history
    ADD CONSTRAINT tp_audit_action_history_pkey PRIMARY KEY (id);


--
-- Name: tp_audit_notice tp_audit_notice_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tp_audit_notice
    ADD CONSTRAINT tp_audit_notice_pkey PRIMARY KEY (id);


--
-- Name: tp_audit_plan tp_audit_plan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tp_audit_plan
    ADD CONSTRAINT tp_audit_plan_pkey PRIMARY KEY (id);


--
-- Name: tp_audit_report tp_audit_report_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tp_audit_report
    ADD CONSTRAINT tp_audit_report_pkey PRIMARY KEY (id);


--
-- Name: tp_competitor_price_uploads tp_competitor_price_uploads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tp_competitor_price_uploads
    ADD CONSTRAINT tp_competitor_price_uploads_pkey PRIMARY KEY (id);


--
-- Name: tp_competitor_price_uploads tp_competitor_price_uploads_upload_reference_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tp_competitor_price_uploads
    ADD CONSTRAINT tp_competitor_price_uploads_upload_reference_key UNIQUE (upload_reference);


--
-- Name: tp_exit_conference tp_exit_conference_audit_case_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tp_exit_conference
    ADD CONSTRAINT tp_exit_conference_audit_case_id_key UNIQUE (audit_case_id);


--
-- Name: tp_exit_conference tp_exit_conference_conference_reference_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tp_exit_conference
    ADD CONSTRAINT tp_exit_conference_conference_reference_key UNIQUE (conference_reference);


--
-- Name: tp_exit_conference tp_exit_conference_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tp_exit_conference
    ADD CONSTRAINT tp_exit_conference_pkey PRIMARY KEY (id);


--
-- Name: tp_external_price_match tp_external_price_match_match_reference_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tp_external_price_match
    ADD CONSTRAINT tp_external_price_match_match_reference_key UNIQUE (match_reference);


--
-- Name: tp_external_price_match tp_external_price_match_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tp_external_price_match
    ADD CONSTRAINT tp_external_price_match_pkey PRIMARY KEY (id);


--
-- Name: tp_field_work_data tp_field_work_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tp_field_work_data
    ADD CONSTRAINT tp_field_work_data_pkey PRIMARY KEY (id);


--
-- Name: tp_information_request_log tp_information_request_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tp_information_request_log
    ADD CONSTRAINT tp_information_request_log_pkey PRIMARY KEY (id);


--
-- Name: tp_information_request_log tp_information_request_log_request_reference_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tp_information_request_log
    ADD CONSTRAINT tp_information_request_log_request_reference_key UNIQUE (request_reference);


--
-- Name: tp_management_report_snapshot tp_management_report_snapshot_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tp_management_report_snapshot
    ADD CONSTRAINT tp_management_report_snapshot_pkey PRIMARY KEY (id);


--
-- Name: tp_objection tp_objection_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tp_objection
    ADD CONSTRAINT tp_objection_pkey PRIMARY KEY (id);


--
-- Name: tp_phase_gates tp_phase_gates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tp_phase_gates
    ADD CONSTRAINT tp_phase_gates_pkey PRIMARY KEY (id);


--
-- Name: tp_planning_meeting tp_planning_meeting_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tp_planning_meeting
    ADD CONSTRAINT tp_planning_meeting_pkey PRIMARY KEY (id);


--
-- Name: tp_risk_assessment tp_risk_assessment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tp_risk_assessment
    ADD CONSTRAINT tp_risk_assessment_pkey PRIMARY KEY (id);


--
-- Name: tp_working_hypothesis tp_working_hypothesis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tp_working_hypothesis
    ADD CONSTRAINT tp_working_hypothesis_pkey PRIMARY KEY (id);


--
-- Name: t_committee_vote uk67yls9sryytxod3vbb97rkgrm; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_committee_vote
    ADD CONSTRAINT uk67yls9sryytxod3vbb97rkgrm UNIQUE (case_id, member_id);


--
-- Name: t_voting_tally uk_2eap1h13gpm5vvuno5m32g7c7; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_voting_tally
    ADD CONSTRAINT uk_2eap1h13gpm5vvuno5m32g7c7 UNIQUE (voting_id);


--
-- Name: qa_sampling_rule uk_3jqigm331qi33ccuqvfhrf9qq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_sampling_rule
    ADD CONSTRAINT uk_3jqigm331qi33ccuqvfhrf9qq UNIQUE (code);


--
-- Name: tp_audit_notice uk_5vcld26yudhj3hxtgclissvic; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tp_audit_notice
    ADD CONSTRAINT uk_5vcld26yudhj3hxtgclissvic UNIQUE (notice_reference_number);


--
-- Name: ap_annual_audit_plans uk_annual_plans_year; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_annual_audit_plans
    ADD CONSTRAINT uk_annual_plans_year UNIQUE (plan_year);


--
-- Name: ap_plan_allocations uk_ap_allocation_regional; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_plan_allocations
    ADD CONSTRAINT uk_ap_allocation_regional UNIQUE (plan_id, region_code, tax_center_code);


--
-- Name: ap_annual_audit_plans uk_ap_plan_year_name; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_annual_audit_plans
    ADD CONSTRAINT uk_ap_plan_year_name UNIQUE (plan_year, plan_name);


--
-- Name: ap_director_approvals uk_director_approval_per_plan; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_director_approvals
    ADD CONSTRAINT uk_director_approval_per_plan UNIQUE (plan_id);


--
-- Name: da_case_snapshots uk_dt4cbwo8mkin0evldwy9tor6t; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.da_case_snapshots
    ADD CONSTRAINT uk_dt4cbwo8mkin0evldwy9tor6t UNIQUE (case_id);


--
-- Name: t_advisory_voting uk_e2v4n8bhqejfgppf1hyxa8xm8; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_advisory_voting
    ADD CONSTRAINT uk_e2v4n8bhqejfgppf1hyxa8xm8 UNIQUE (case_id);


--
-- Name: t_committee_case uk_h084hr3h56q66t4d1li1hvdwb; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_committee_case
    ADD CONSTRAINT uk_h084hr3h56q66t4d1li1hvdwb UNIQUE (case_code);


--
-- Name: t_handoff_record uk_hev8odsttn97q7t2pa9snin1r; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_handoff_record
    ADD CONSTRAINT uk_hev8odsttn97q7t2pa9snin1r UNIQUE (case_code);


--
-- Name: t_user uk_i6qjjoe560mee5ajdg7v1o6mi; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_user
    ADD CONSTRAINT uk_i6qjjoe560mee5ajdg7v1o6mi UNIQUE (email);


--
-- Name: issue_audit_details uk_j799ip695vf7f2xrht7u837vw; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_audit_details
    ADD CONSTRAINT uk_j799ip695vf7f2xrht7u837vw UNIQUE (audit_case_id);


--
-- Name: t_user uk_jhib4legehrm4yscx9t3lirqi; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_user
    ADD CONSTRAINT uk_jhib4legehrm4yscx9t3lirqi UNIQUE (username);


--
-- Name: ca_draft_reports uk_m1kp3thsoea0fi0pu2ca5stet; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_draft_reports
    ADD CONSTRAINT uk_m1kp3thsoea0fi0pu2ca5stet UNIQUE (report_reference);


--
-- Name: t_committee_case uk_o2dy57581jyxqqbsd3asvfr49; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_committee_case
    ADD CONSTRAINT uk_o2dy57581jyxqqbsd3asvfr49 UNIQUE (tax_id_number);


--
-- Name: qa_review_case uk_pf9ttv9p14axvik927smjudda; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_review_case
    ADD CONSTRAINT uk_pf9ttv9p14axvik927smjudda UNIQUE (case_number);


--
-- Name: ca_assessment_notices uk_pgswyeeip8j00y7oqflkob0re; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_assessment_notices
    ADD CONSTRAINT uk_pgswyeeip8j00y7oqflkob0re UNIQUE (notice_number);


--
-- Name: ap_regional_plan_access uk_regional_access_per_plan; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_regional_plan_access
    ADD CONSTRAINT uk_regional_access_per_plan UNIQUE (plan_id, region_code);


--
-- Name: ap_regional_deployments uk_regional_deployment_per_plan; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_regional_deployments
    ADD CONSTRAINT uk_regional_deployment_per_plan UNIQUE (plan_id, region_code);


--
-- Name: ap_regional_tc_deployments uk_regional_tc_deployment_per_plan; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_regional_tc_deployments
    ADD CONSTRAINT uk_regional_tc_deployment_per_plan UNIQUE (plan_id, region_id);


--
-- Name: ca_audit_findings uk_te8jjshttjtxdx8um4wxesx65; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_audit_findings
    ADD CONSTRAINT uk_te8jjshttjtxdx8um4wxesx65 UNIQUE (finding_reference);


--
-- Name: team_members uk_team_membership; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT uk_team_membership UNIQUE (team_leader_id, auditor_id);


--
-- Name: tp_phase_gates uk_tp_phase_gates_case_phase; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tp_phase_gates
    ADD CONSTRAINT uk_tp_phase_gates_case_phase UNIQUE (audit_case_id, phase_id);


--
-- Name: ap_regional_deployments unique_regional_deployment; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_regional_deployments
    ADD CONSTRAINT unique_regional_deployment UNIQUE (plan_id, region_id);


--
-- Name: ap_regional_feedback unique_regional_feedback; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_regional_feedback
    ADD CONSTRAINT unique_regional_feedback UNIQUE (plan_id, region_id);


--
-- Name: ap_regional_tc_deployments unique_regional_tc_deployment; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_regional_tc_deployments
    ADD CONSTRAINT unique_regional_tc_deployment UNIQUE (plan_id, region_id);


--
-- Name: user_organizational_assignments user_organizational_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_organizational_assignments
    ADD CONSTRAINT user_organizational_assignments_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_refresh_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_refresh_token_hash_key UNIQUE (refresh_token_hash);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_keycloak_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_keycloak_user_id_key UNIQUE (keycloak_user_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: workflow_definitions workflow_definitions_code_version_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_definitions
    ADD CONSTRAINT workflow_definitions_code_version_key UNIQUE (code, version);


--
-- Name: workflow_definitions workflow_definitions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_definitions
    ADD CONSTRAINT workflow_definitions_pkey PRIMARY KEY (id);


--
-- Name: workflow_instances workflow_instances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_instances
    ADD CONSTRAINT workflow_instances_pkey PRIMARY KEY (id);


--
-- Name: workflow_steps workflow_steps_definition_id_step_order_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_steps
    ADD CONSTRAINT workflow_steps_definition_id_step_order_key UNIQUE (definition_id, step_order);


--
-- Name: workflow_steps workflow_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_steps
    ADD CONSTRAINT workflow_steps_pkey PRIMARY KEY (id);


--
-- Name: workflow_tasks workflow_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_tasks
    ADD CONSTRAINT workflow_tasks_pkey PRIMARY KEY (id);


--
-- Name: flyway_schema_history_s_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX flyway_schema_history_s_idx ON public.flyway_schema_history USING btree (success);


--
-- Name: idx_allocation_by_audit_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_allocation_by_audit_type ON public.ap_plan_allocations USING gin (allocation_by_audit_type);


--
-- Name: idx_allocations_revenue; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_allocations_revenue ON public.ap_plan_allocations USING btree (estimated_revenue);


--
-- Name: idx_ap_allocations_plan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ap_allocations_plan ON public.ap_plan_allocations USING btree (plan_id);


--
-- Name: idx_ap_allocations_region; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ap_allocations_region ON public.ap_plan_allocations USING btree (region_code);


--
-- Name: idx_ap_allocations_regional_only; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ap_allocations_regional_only ON public.ap_plan_allocations USING btree (plan_id, region_code) WHERE (tax_center_code IS NULL);


--
-- Name: idx_ap_allocations_tax_center; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ap_allocations_tax_center ON public.ap_plan_allocations USING btree (tax_center_code);


--
-- Name: idx_ap_allocations_tc_feedback; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ap_allocations_tc_feedback ON public.ap_plan_allocations USING btree (tc_feedback_submitted);


--
-- Name: idx_ap_audit_cases_audit_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ap_audit_cases_audit_type ON public.ap_audit_cases USING btree (audit_type);


--
-- Name: idx_ap_audit_cases_auditor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ap_audit_cases_auditor ON public.ap_audit_cases USING btree (assigned_auditor_id);


--
-- Name: idx_ap_audit_cases_case_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ap_audit_cases_case_number ON public.ap_audit_cases USING btree (case_number);


--
-- Name: idx_ap_audit_cases_plan_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ap_audit_cases_plan_id ON public.ap_audit_cases USING btree (plan_id);


--
-- Name: idx_ap_audit_cases_region; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ap_audit_cases_region ON public.ap_audit_cases USING btree (region_code);


--
-- Name: idx_ap_audit_cases_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ap_audit_cases_status ON public.ap_audit_cases USING btree (status);


--
-- Name: idx_ap_audit_cases_tax_center; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ap_audit_cases_tax_center ON public.ap_audit_cases USING btree (tax_center_code);


--
-- Name: idx_ap_audit_cases_tc_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ap_audit_cases_tc_status ON public.ap_audit_cases USING btree (tax_center_code, status);


--
-- Name: idx_ap_audit_cases_team_leader; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ap_audit_cases_team_leader ON public.ap_audit_cases USING btree (assigned_team_leader_id);


--
-- Name: idx_ap_audit_cases_tl_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ap_audit_cases_tl_status ON public.ap_audit_cases USING btree (assigned_team_leader_id, status);


--
-- Name: idx_ap_audit_logs_actor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ap_audit_logs_actor ON public.ap_plan_audit_logs USING btree (actor_id);


--
-- Name: idx_ap_audit_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ap_audit_logs_created_at ON public.ap_plan_audit_logs USING btree (created_at);


--
-- Name: idx_ap_audit_logs_plan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ap_audit_logs_plan ON public.ap_plan_audit_logs USING btree (plan_id);


--
-- Name: idx_ap_cases_auditor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ap_cases_auditor ON public.ap_audit_cases USING btree (assigned_auditor_id);


--
-- Name: idx_ap_cases_team_leader; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ap_cases_team_leader ON public.ap_audit_cases USING btree (assigned_team_leader_id);


--
-- Name: idx_ap_plan_revisions_plan_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ap_plan_revisions_plan_id ON public.ap_plan_revisions USING btree (plan_id);


--
-- Name: idx_ap_plan_timeline_plan_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ap_plan_timeline_plan_id ON public.ap_plan_timeline USING btree (plan_id);


--
-- Name: idx_ap_planning_configuration_updated_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ap_planning_configuration_updated_at ON public.ap_planning_configuration USING btree (updated_at DESC);


--
-- Name: idx_ap_plans_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ap_plans_created_at ON public.ap_annual_audit_plans USING btree (created_at);


--
-- Name: idx_ap_plans_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ap_plans_created_by ON public.ap_annual_audit_plans USING btree (created_by);


--
-- Name: idx_ap_plans_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ap_plans_status ON public.ap_annual_audit_plans USING btree (status);


--
-- Name: idx_ap_plans_year; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ap_plans_year ON public.ap_annual_audit_plans USING btree (plan_year);


--
-- Name: idx_ap_regional_deployments_plan_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ap_regional_deployments_plan_id ON public.ap_regional_deployments USING btree (plan_id);


--
-- Name: idx_ap_regional_feedback_plan_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ap_regional_feedback_plan_id ON public.ap_regional_feedback USING btree (plan_id);


--
-- Name: idx_ap_regional_feedback_region; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ap_regional_feedback_region ON public.ap_regional_feedback USING btree (region_id);


--
-- Name: idx_ap_regional_tc_deployments_deployed_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ap_regional_tc_deployments_deployed_by ON public.ap_regional_tc_deployments USING btree (deployed_by);


--
-- Name: idx_ap_regional_tc_deployments_plan_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ap_regional_tc_deployments_plan_id ON public.ap_regional_tc_deployments USING btree (plan_id);


--
-- Name: idx_ap_regional_tc_deployments_region_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ap_regional_tc_deployments_region_id ON public.ap_regional_tc_deployments USING btree (region_id);


--
-- Name: idx_audit_doc_case_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_doc_case_id ON public.t_audit_document USING btree (case_id);


--
-- Name: idx_audit_doc_request_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_doc_request_id ON public.t_audit_document USING btree (request_id);


--
-- Name: idx_audit_plan_case_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_plan_case_id ON public.t_audit_plan_record USING btree (case_id);


--
-- Name: idx_audit_team_tax_center; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_team_tax_center ON public.t_audit_team USING btree (tax_center);


--
-- Name: idx_audit_trail_actor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_trail_actor ON public.shared_audit_trail_entries USING btree (actor_id);


--
-- Name: idx_audit_trail_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_trail_entity ON public.shared_audit_trail_entries USING btree (entity_type, entity_id);


--
-- Name: idx_audit_trail_occurred_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_trail_occurred_at ON public.shared_audit_trail_entries USING btree (occurred_at);


--
-- Name: idx_audit_types_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_types_code ON public.audit_types USING btree (code);


--
-- Name: idx_auditor_assign_auditor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auditor_assign_auditor ON public.case_auditor_assignment USING btree (auditor_id);


--
-- Name: idx_auditor_assign_case; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auditor_assign_case ON public.case_auditor_assignment USING btree (case_id);


--
-- Name: idx_auditor_assign_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auditor_assign_status ON public.case_auditor_assignment USING btree (status);


--
-- Name: idx_ca_assigned_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ca_assigned_user ON public.case_assignments USING btree (assigned_user_id);


--
-- Name: idx_ca_case; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ca_case ON public.case_assignments USING btree (case_id);


--
-- Name: idx_ca_case_snapshots_case_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ca_case_snapshots_case_id ON public.ca_case_snapshots USING btree (case_id);


--
-- Name: idx_caat_case_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_caat_case_id ON public.t_caat_anomaly USING btree (case_id);


--
-- Name: idx_case_handoff_case_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_case_handoff_case_id ON public.case_handoff USING btree (case_id);


--
-- Name: idx_case_handoff_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_case_handoff_created_at ON public.case_handoff USING btree (created_at);


--
-- Name: idx_case_handoff_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_case_handoff_status ON public.case_handoff USING btree (status);


--
-- Name: idx_case_handoff_team_leader; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_case_handoff_team_leader ON public.case_handoff USING btree (team_leader_id);


--
-- Name: idx_cases_estimated_revenue; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cases_estimated_revenue ON public.ap_audit_cases USING btree (estimated_revenue);


--
-- Name: idx_committees_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_committees_at ON public.committees USING btree (audit_type_id);


--
-- Name: idx_committees_tc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_committees_tc ON public.committees USING btree (tax_center_id);


--
-- Name: idx_conference_case_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conference_case_id ON public.t_conference_record USING btree (case_id);


--
-- Name: idx_director_approvals_approved_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_director_approvals_approved_at ON public.ap_director_approvals USING btree (approved_at);


--
-- Name: idx_director_approvals_decision; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_director_approvals_decision ON public.ap_director_approvals USING btree (decision);


--
-- Name: idx_director_approvals_director; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_director_approvals_director ON public.ap_director_approvals USING btree (director_id);


--
-- Name: idx_director_approvals_plan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_director_approvals_plan ON public.ap_director_approvals USING btree (plan_id);


--
-- Name: idx_doc_req_case_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_doc_req_case_id ON public.t_document_request_record USING btree (case_id);


--
-- Name: idx_finding_case_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_finding_case_id ON public.t_audit_finding USING btree (case_id);


--
-- Name: idx_notif_case; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notif_case ON public.notifications USING btree (case_id);


--
-- Name: idx_notif_recipient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notif_recipient ON public.notifications USING btree (recipient_user_id, is_read, created_at DESC);


--
-- Name: idx_notif_unread; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notif_unread ON public.notifications USING btree (recipient_user_id) WHERE (is_read = false);


--
-- Name: idx_org_units_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_org_units_code ON public.organizational_units USING btree (code);


--
-- Name: idx_org_units_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_org_units_parent ON public.organizational_units USING btree (parent_id);


--
-- Name: idx_org_units_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_org_units_type ON public.organizational_units USING btree (unit_type);


--
-- Name: idx_outbox_entries_processed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_outbox_entries_processed ON public.shared_outbox_entries USING btree (processed_at) WHERE (processed_at IS NULL);


--
-- Name: idx_plan_created_at_desc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_plan_created_at_desc ON public.t_audit_plan_record USING btree (created_at DESC);


--
-- Name: idx_plan_team_lead_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_plan_team_lead_status ON public.t_audit_plan_record USING btree (team_lead_id, status);


--
-- Name: idx_qa_followup_kind; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qa_followup_kind ON public.qa_follow_up_action USING btree (action_kind);


--
-- Name: idx_qa_followup_review; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qa_followup_review ON public.qa_follow_up_action USING btree (qa_review_case_id);


--
-- Name: idx_qa_followup_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qa_followup_status ON public.qa_follow_up_action USING btree (status);


--
-- Name: idx_qa_report_kind; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qa_report_kind ON public.qa_review_report USING btree (qa_review_case_id, kind);


--
-- Name: idx_qa_report_review; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qa_report_review ON public.qa_review_report USING btree (qa_review_case_id);


--
-- Name: idx_qa_review_case_audit_case; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qa_review_case_audit_case ON public.qa_review_case USING btree (audit_case_id);


--
-- Name: idx_qa_review_case_officer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qa_review_case_officer ON public.qa_review_case USING btree (assigned_qa_officer_id);


--
-- Name: idx_qa_review_case_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qa_review_case_status ON public.qa_review_case USING btree (status);


--
-- Name: idx_qa_review_case_tl; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qa_review_case_tl ON public.qa_review_case USING btree (qa_team_leader_id);


--
-- Name: idx_qa_review_event_review; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qa_review_event_review ON public.qa_review_event USING btree (qa_review_case_id);


--
-- Name: idx_qa_review_event_step; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qa_review_event_step ON public.qa_review_event USING btree (step_code);


--
-- Name: idx_qa_review_event_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qa_review_event_time ON public.qa_review_event USING btree (occurred_at DESC);


--
-- Name: idx_qa_sampling_run_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qa_sampling_run_created ON public.qa_sampling_run USING btree (created_at DESC);


--
-- Name: idx_regional_access_granted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_regional_access_granted_at ON public.ap_regional_plan_access USING btree (access_granted_at);


--
-- Name: idx_regional_access_plan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_regional_access_plan ON public.ap_regional_plan_access USING btree (plan_id);


--
-- Name: idx_regional_access_region; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_regional_access_region ON public.ap_regional_plan_access USING btree (region_code);


--
-- Name: idx_regional_access_region_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_regional_access_region_active ON public.ap_regional_plan_access USING btree (region_code, access_expires_at) WHERE (access_expires_at IS NULL);


--
-- Name: idx_regional_deployments_director; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_regional_deployments_director ON public.ap_regional_deployments USING btree (director_id);


--
-- Name: idx_regional_deployments_plan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_regional_deployments_plan ON public.ap_regional_deployments USING btree (plan_id);


--
-- Name: idx_regional_deployments_region; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_regional_deployments_region ON public.ap_regional_deployments USING btree (region_code);


--
-- Name: idx_regional_deployments_region_plan; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_regional_deployments_region_plan ON public.ap_regional_deployments USING btree (region_code, plan_id);


--
-- Name: idx_regional_deployments_sent_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_regional_deployments_sent_at ON public.ap_regional_deployments USING btree (sent_at);


--
-- Name: idx_regions_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_regions_code ON public.regions USING btree (code);


--
-- Name: idx_sec_log_action; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sec_log_action ON public.security_audit_log USING btree (action);


--
-- Name: idx_sec_log_outcome; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sec_log_outcome ON public.security_audit_log USING btree (outcome) WHERE ((outcome)::text = 'FAILURE'::text);


--
-- Name: idx_sec_log_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sec_log_time ON public.security_audit_log USING btree (logged_at DESC);


--
-- Name: idx_sec_log_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sec_log_user ON public.security_audit_log USING btree (user_id);


--
-- Name: idx_sessions_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_active ON public.user_sessions USING btree (is_active, expires_at);


--
-- Name: idx_sessions_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_token ON public.user_sessions USING btree (refresh_token_hash);


--
-- Name: idx_sessions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_user ON public.user_sessions USING btree (user_id);


--
-- Name: idx_sla_case; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sla_case ON public.sla_tracking USING btree (case_id);


--
-- Name: idx_sla_due; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sla_due ON public.sla_tracking USING btree (due_at) WHERE (resolved_at IS NULL);


--
-- Name: idx_tax_centers_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tax_centers_code ON public.tax_centers USING btree (code);


--
-- Name: idx_tax_centers_region; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tax_centers_region ON public.tax_centers USING btree (region_id);


--
-- Name: idx_tc_adjusted_allocations; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tc_adjusted_allocations ON public.ap_plan_allocations USING gin (tc_adjusted_allocations);


--
-- Name: idx_team_members_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_members_active ON public.team_members USING btree (team_leader_id) WHERE ((is_active = true) AND (left_at IS NULL));


--
-- Name: idx_team_members_auditor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_members_auditor ON public.team_members USING btree (auditor_id, team_leader_id);


--
-- Name: idx_team_members_team_leader; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_members_team_leader ON public.team_members USING btree (team_leader_id, is_active, left_at);


--
-- Name: idx_team_members_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_team_members_user ON public.team_members USING btree (user_id);


--
-- Name: idx_teams_leader; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_teams_leader ON public.teams USING btree (team_leader_id);


--
-- Name: idx_teams_org_unit; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_teams_org_unit ON public.teams USING btree (org_unit_id);


--
-- Name: idx_tp_audit_plan_case; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tp_audit_plan_case ON public.tp_audit_plan USING btree (audit_case_id);


--
-- Name: idx_tp_cpu_case; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tp_cpu_case ON public.tp_competitor_price_uploads USING btree (audit_case_id);


--
-- Name: idx_tp_cpu_hs_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tp_cpu_hs_code ON public.tp_competitor_price_uploads USING btree (product_hs_code);


--
-- Name: idx_tp_cpu_price_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tp_cpu_price_date ON public.tp_competitor_price_uploads USING btree (price_date);


--
-- Name: idx_tp_epm_case; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tp_epm_case ON public.tp_external_price_match USING btree (audit_case_id);


--
-- Name: idx_tp_idrl_case; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tp_idrl_case ON public.tp_information_request_log USING btree (audit_case_id);


--
-- Name: idx_tp_idrl_deadline; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tp_idrl_deadline ON public.tp_information_request_log USING btree (deadline_date) WHERE ((status)::text <> 'CLOSED'::text);


--
-- Name: idx_tp_idrl_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tp_idrl_status ON public.tp_information_request_log USING btree (status);


--
-- Name: idx_tp_mrs_current; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tp_mrs_current ON public.tp_management_report_snapshot USING btree (is_current) WHERE (is_current = true);


--
-- Name: idx_tp_mrs_type_period; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tp_mrs_type_period ON public.tp_management_report_snapshot USING btree (report_type, report_period);


--
-- Name: idx_tp_phase_gates_case; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tp_phase_gates_case ON public.tp_phase_gates USING btree (audit_case_id);


--
-- Name: idx_tp_phase_gates_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tp_phase_gates_status ON public.tp_phase_gates USING btree (status);


--
-- Name: idx_tp_risk_assessment_case; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tp_risk_assessment_case ON public.tp_risk_assessment USING btree (audit_case_id);


--
-- Name: idx_tp_tah_actor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tp_tah_actor ON public.tp_audit_action_history USING btree (actor_id);


--
-- Name: idx_tp_tah_case; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tp_tah_case ON public.tp_audit_action_history USING btree (audit_case_id);


--
-- Name: idx_tp_tah_phase; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tp_tah_phase ON public.tp_audit_action_history USING btree (action_phase);


--
-- Name: idx_tp_tah_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tp_tah_timestamp ON public.tp_audit_action_history USING btree (action_timestamp DESC);


--
-- Name: idx_tp_working_hypothesis_case; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tp_working_hypothesis_case ON public.tp_working_hypothesis USING btree (audit_case_id);


--
-- Name: idx_uniq_active_user_tc; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_uniq_active_user_tc ON public.user_organizational_assignments USING btree (user_id) WHERE ((status)::text = 'ACTIVE'::text);


--
-- Name: idx_uoa_tc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_uoa_tc ON public.user_organizational_assignments USING btree (tax_center_id);


--
-- Name: idx_uoa_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_uoa_user ON public.user_organizational_assignments USING btree (user_id);


--
-- Name: idx_user_roles_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_roles_user ON public.user_roles USING btree (user_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_org_unit; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_org_unit ON public.users USING btree (org_unit_id);


--
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_username ON public.users USING btree (username);


--
-- Name: idx_wi_artifact; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wi_artifact ON public.workflow_instances USING btree (artifact_id);


--
-- Name: idx_wi_case; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wi_case ON public.workflow_instances USING btree (case_id);


--
-- Name: idx_wi_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wi_status ON public.workflow_instances USING btree (status);


--
-- Name: idx_wp_case_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wp_case_id ON public.t_working_paper USING btree (case_id);


--
-- Name: idx_ws_definition; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ws_definition ON public.workflow_steps USING btree (definition_id);


--
-- Name: idx_wt_assigned_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wt_assigned_role ON public.workflow_tasks USING btree (assigned_to_role);


--
-- Name: idx_wt_assigned_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wt_assigned_user ON public.workflow_tasks USING btree (assigned_to_user_id);


--
-- Name: idx_wt_case; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wt_case ON public.workflow_tasks USING btree (case_id);


--
-- Name: idx_wt_due; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wt_due ON public.workflow_tasks USING btree (due_at) WHERE ((status)::text = 'PENDING'::text);


--
-- Name: idx_wt_inbox; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wt_inbox ON public.workflow_tasks USING btree (assigned_to_user_id, status, due_at) WHERE ((status)::text = 'PENDING'::text);


--
-- Name: idx_wt_instance; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wt_instance ON public.workflow_tasks USING btree (instance_id);


--
-- Name: idx_wt_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wt_status ON public.workflow_tasks USING btree (status);


--
-- Name: uk_case_auditor_active; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uk_case_auditor_active ON public.case_auditor_assignment USING btree (case_id) WHERE ((status)::text = 'ACTIVE'::text);


--
-- Name: ap_director_approvals trg_ap_log_director_approval; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_ap_log_director_approval AFTER INSERT ON public.ap_director_approvals FOR EACH ROW EXECUTE FUNCTION public.ap_log_director_approval();


--
-- Name: ap_regional_deployments trg_ap_log_regional_deployment; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_ap_log_regional_deployment AFTER INSERT ON public.ap_regional_deployments FOR EACH ROW EXECUTE FUNCTION public.ap_log_regional_deployment();


--
-- Name: ap_plan_audit_logs trg_ap_prevent_audit_log_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_ap_prevent_audit_log_update BEFORE DELETE OR UPDATE ON public.ap_plan_audit_logs FOR EACH ROW EXECUTE FUNCTION public.ap_prevent_audit_log_update();


--
-- Name: ap_regional_deployments trg_ap_sync_regional_access; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_ap_sync_regional_access AFTER INSERT ON public.ap_regional_deployments FOR EACH ROW EXECUTE FUNCTION public.ap_sync_regional_access_from_deployment();


--
-- Name: ap_plan_allocations trg_ap_update_allocation_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_ap_update_allocation_timestamp BEFORE UPDATE ON public.ap_plan_allocations FOR EACH ROW EXECUTE FUNCTION public.ap_update_plan_timestamp();


--
-- Name: ap_director_approvals trg_ap_update_director_approval_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_ap_update_director_approval_timestamp BEFORE UPDATE ON public.ap_director_approvals FOR EACH ROW EXECUTE FUNCTION public.ap_update_director_approval_timestamp();


--
-- Name: ap_annual_audit_plans trg_ap_update_plan_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_ap_update_plan_timestamp BEFORE UPDATE ON public.ap_annual_audit_plans FOR EACH ROW EXECUTE FUNCTION public.ap_update_plan_timestamp();


--
-- Name: ap_regional_plan_access trg_ap_update_regional_access_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_ap_update_regional_access_timestamp BEFORE UPDATE ON public.ap_regional_plan_access FOR EACH ROW EXECUTE FUNCTION public.ap_update_regional_access_timestamp();


--
-- Name: ap_regional_deployments trg_ap_update_regional_deployment_timestamp; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_ap_update_regional_deployment_timestamp BEFORE UPDATE ON public.ap_regional_deployments FOR EACH ROW EXECUTE FUNCTION public.ap_update_regional_deployment_timestamp();


--
-- Name: shared_audit_trail_entries trg_prevent_audit_trail_update; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_prevent_audit_trail_update BEFORE DELETE OR UPDATE ON public.shared_audit_trail_entries FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_trail_update();


--
-- Name: ap_plan_allocations ap_plan_allocations_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_plan_allocations
    ADD CONSTRAINT ap_plan_allocations_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.ap_annual_audit_plans(id) ON DELETE CASCADE;


--
-- Name: ap_regional_deployments ap_regional_deployments_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_regional_deployments
    ADD CONSTRAINT ap_regional_deployments_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.ap_annual_audit_plans(id) ON DELETE CASCADE;


--
-- Name: ap_regional_tc_deployments ap_regional_tc_deployments_plan_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_regional_tc_deployments
    ADD CONSTRAINT ap_regional_tc_deployments_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.ap_annual_audit_plans(id) ON DELETE CASCADE;


--
-- Name: ca_case_snapshots ca_case_snapshots_case_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_case_snapshots
    ADD CONSTRAINT ca_case_snapshots_case_id_fkey FOREIGN KEY (case_id) REFERENCES public.ap_audit_cases(id) ON DELETE CASCADE;


--
-- Name: t_session_attendee fk15fifino13it9cmgrc4dsyxq; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_session_attendee
    ADD CONSTRAINT fk15fifino13it9cmgrc4dsyxq FOREIGN KEY (session_id) REFERENCES public.t_committee_session(session_id);


--
-- Name: t_research_comment fk16teqoslyltouaulj2jqfkw5i; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_research_comment
    ADD CONSTRAINT fk16teqoslyltouaulj2jqfkw5i FOREIGN KEY (note_id) REFERENCES public.t_research_note(note_id);


--
-- Name: ca_benford_analysis fk1fyet9in9tt1rvgfaadfre9ve; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_benford_analysis
    ADD CONSTRAINT fk1fyet9in9tt1rvgfaadfre9ve FOREIGN KEY (audit_case_id) REFERENCES public.ap_audit_cases(id);


--
-- Name: ca_reconciliations fk1lulnefr14cnhc4advhiiw62h; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_reconciliations
    ADD CONSTRAINT fk1lulnefr14cnhc4advhiiw62h FOREIGN KEY (audit_case_id) REFERENCES public.ap_audit_cases(id);


--
-- Name: ca_caat_eligibility fk2o5s855jqrvt5aq1uacpd92tj; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_caat_eligibility
    ADD CONSTRAINT fk2o5s855jqrvt5aq1uacpd92tj FOREIGN KEY (audit_case_id) REFERENCES public.ap_audit_cases(id);


--
-- Name: t_research_comment fk2pk1mb1091emhs7k3q2n80dov; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_research_comment
    ADD CONSTRAINT fk2pk1mb1091emhs7k3q2n80dov FOREIGN KEY (replied_to_comment_id) REFERENCES public.t_research_comment(comment_id);


--
-- Name: ca_audit_assertions fk2qiaqx40ay9c3xfsx8crv9c9c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_audit_assertions
    ADD CONSTRAINT fk2qiaqx40ay9c3xfsx8crv9c9c FOREIGN KEY (audit_case_id) REFERENCES public.ap_audit_cases(id);


--
-- Name: da_evidence fk2uyb9ih0xw19i17e6lqgeqfyd; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.da_evidence
    ADD CONSTRAINT fk2uyb9ih0xw19i17e6lqgeqfyd FOREIGN KEY (audit_case_id) REFERENCES public.ap_audit_cases(id);


--
-- Name: t_voting_tally fk330bww3xbiq30mo3gegeg2ht0; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_voting_tally
    ADD CONSTRAINT fk330bww3xbiq30mo3gegeg2ht0 FOREIGN KEY (voting_id) REFERENCES public.t_advisory_voting(voting_id);


--
-- Name: ca_multi_zone_allocations fk3nkxtg1t5pwdo6k90paroev6n; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_multi_zone_allocations
    ADD CONSTRAINT fk3nkxtg1t5pwdo6k90paroev6n FOREIGN KEY (audit_case_id) REFERENCES public.ap_audit_cases(id);


--
-- Name: ca_caat_rules fk46d9m62ww543bpje8gnm6i2q8; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_caat_rules
    ADD CONSTRAINT fk46d9m62ww543bpje8gnm6i2q8 FOREIGN KEY (caat_run_id) REFERENCES public.ca_caat_runs(id);


--
-- Name: ca_caat_exceptions fk4c4p0etv95o89pwainan9itgu; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_caat_exceptions
    ADD CONSTRAINT fk4c4p0etv95o89pwainan9itgu FOREIGN KEY (audit_case_id) REFERENCES public.ap_audit_cases(id);


--
-- Name: ca_taxpayer_responses fk52aij5iyvappa59yj47p6vos; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_taxpayer_responses
    ADD CONSTRAINT fk52aij5iyvappa59yj47p6vos FOREIGN KEY (draft_report_id) REFERENCES public.ca_draft_reports(id);


--
-- Name: ca_caat_runs fk5572vdl4mgxbb12gdd18l5s11; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_caat_runs
    ADD CONSTRAINT fk5572vdl4mgxbb12gdd18l5s11 FOREIGN KEY (audit_case_id) REFERENCES public.ap_audit_cases(id);


--
-- Name: da_audit_procedures fk5d1y7awhw8wai2fyi0hdgnvpo; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.da_audit_procedures
    ADD CONSTRAINT fk5d1y7awhw8wai2fyi0hdgnvpo FOREIGN KEY (audit_case_id) REFERENCES public.ap_audit_cases(id);


--
-- Name: ca_sampling_records fk7exiann3nwatq5yuik5wr7s8i; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_sampling_records
    ADD CONSTRAINT fk7exiann3nwatq5yuik5wr7s8i FOREIGN KEY (audit_case_id) REFERENCES public.ap_audit_cases(id);


--
-- Name: ca_benford_analysis fk7fho9jge846u89cxui214mthi; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_benford_analysis
    ADD CONSTRAINT fk7fho9jge846u89cxui214mthi FOREIGN KEY (caat_run_id) REFERENCES public.ca_caat_runs(id);


--
-- Name: ca_query_sheets fk7fig9qelbt67wfuxqhruhbyok; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_query_sheets
    ADD CONSTRAINT fk7fig9qelbt67wfuxqhruhbyok FOREIGN KEY (audit_case_id) REFERENCES public.ap_audit_cases(id);


--
-- Name: tp_audit_notice fk8pjbdwjgl5mp2ue5khqiyqklp; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tp_audit_notice
    ADD CONSTRAINT fk8pjbdwjgl5mp2ue5khqiyqklp FOREIGN KEY (audit_case_id) REFERENCES public.ap_audit_cases(id);


--
-- Name: case_auditor_assignment fk_auditor_assign_assigned_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.case_auditor_assignment
    ADD CONSTRAINT fk_auditor_assign_assigned_by FOREIGN KEY (assigned_by_id) REFERENCES public.users(id);


--
-- Name: case_auditor_assignment fk_auditor_assign_auditor; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.case_auditor_assignment
    ADD CONSTRAINT fk_auditor_assign_auditor FOREIGN KEY (auditor_id) REFERENCES public.users(id);


--
-- Name: case_auditor_assignment fk_auditor_assign_case; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.case_auditor_assignment
    ADD CONSTRAINT fk_auditor_assign_case FOREIGN KEY (case_id) REFERENCES public.ap_audit_cases(id) ON DELETE CASCADE;


--
-- Name: case_assignments fk_ca_case; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.case_assignments
    ADD CONSTRAINT fk_ca_case FOREIGN KEY (case_id) REFERENCES public.ap_audit_cases(id) ON DELETE CASCADE;


--
-- Name: committees fk_com_at; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.committees
    ADD CONSTRAINT fk_com_at FOREIGN KEY (audit_type_id) REFERENCES public.audit_types(id) ON DELETE CASCADE;


--
-- Name: committees fk_com_tc; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.committees
    ADD CONSTRAINT fk_com_tc FOREIGN KEY (tax_center_id) REFERENCES public.tax_centers(id) ON DELETE CASCADE;


--
-- Name: tp_competitor_price_uploads fk_cpu_case; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tp_competitor_price_uploads
    ADD CONSTRAINT fk_cpu_case FOREIGN KEY (audit_case_id) REFERENCES public.ap_audit_cases(id) ON DELETE CASCADE;


--
-- Name: tp_external_price_match fk_epm_case; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tp_external_price_match
    ADD CONSTRAINT fk_epm_case FOREIGN KEY (audit_case_id) REFERENCES public.ap_audit_cases(id) ON DELETE CASCADE;


--
-- Name: tp_exit_conference fk_exc_case; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tp_exit_conference
    ADD CONSTRAINT fk_exc_case FOREIGN KEY (audit_case_id) REFERENCES public.ap_audit_cases(id) ON DELETE CASCADE;


--
-- Name: case_handoff fk_handoff_assigned_by; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.case_handoff
    ADD CONSTRAINT fk_handoff_assigned_by FOREIGN KEY (assigned_by_id) REFERENCES public.users(id);


--
-- Name: case_handoff fk_handoff_case; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.case_handoff
    ADD CONSTRAINT fk_handoff_case FOREIGN KEY (case_id) REFERENCES public.ap_audit_cases(id) ON DELETE CASCADE;


--
-- Name: case_handoff fk_handoff_team_leader; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.case_handoff
    ADD CONSTRAINT fk_handoff_team_leader FOREIGN KEY (team_leader_id) REFERENCES public.users(id);


--
-- Name: tp_information_request_log fk_idrl_case; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tp_information_request_log
    ADD CONSTRAINT fk_idrl_case FOREIGN KEY (audit_case_id) REFERENCES public.ap_audit_cases(id) ON DELETE CASCADE;


--
-- Name: organizational_units fk_org_parent; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizational_units
    ADD CONSTRAINT fk_org_parent FOREIGN KEY (parent_id) REFERENCES public.organizational_units(id);


--
-- Name: role_permissions fk_rp_permission; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT fk_rp_permission FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_permissions fk_rp_role; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT fk_rp_role FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: user_sessions fk_session_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: sla_tracking fk_sla_task; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sla_tracking
    ADD CONSTRAINT fk_sla_task FOREIGN KEY (task_id) REFERENCES public.workflow_tasks(id) ON DELETE CASCADE;


--
-- Name: tp_audit_action_history fk_tah_case; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tp_audit_action_history
    ADD CONSTRAINT fk_tah_case FOREIGN KEY (audit_case_id) REFERENCES public.ap_audit_cases(id) ON DELETE CASCADE;


--
-- Name: tax_centers fk_tc_region; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tax_centers
    ADD CONSTRAINT fk_tc_region FOREIGN KEY (region_id) REFERENCES public.regions(id) ON DELETE CASCADE;


--
-- Name: teams fk_team_org_unit; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT fk_team_org_unit FOREIGN KEY (org_unit_id) REFERENCES public.organizational_units(id);


--
-- Name: teams fk_team_team_leader; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT fk_team_team_leader FOREIGN KEY (team_leader_id) REFERENCES public.users(id);


--
-- Name: team_members fk_tm_team; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT fk_tm_team FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;


--
-- Name: team_members fk_tm_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT fk_tm_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: tp_audit_plan fk_tp_audit_plan_case; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tp_audit_plan
    ADD CONSTRAINT fk_tp_audit_plan_case FOREIGN KEY (audit_case_id) REFERENCES public.ap_audit_cases(id) ON DELETE CASCADE;


--
-- Name: tp_phase_gates fk_tp_phase_gates_case; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tp_phase_gates
    ADD CONSTRAINT fk_tp_phase_gates_case FOREIGN KEY (audit_case_id) REFERENCES public.ap_audit_cases(id) ON DELETE CASCADE;


--
-- Name: tp_risk_assessment fk_tp_risk_assessment_case; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tp_risk_assessment
    ADD CONSTRAINT fk_tp_risk_assessment_case FOREIGN KEY (audit_case_id) REFERENCES public.ap_audit_cases(id) ON DELETE CASCADE;


--
-- Name: tp_working_hypothesis fk_tp_working_hypothesis_case; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tp_working_hypothesis
    ADD CONSTRAINT fk_tp_working_hypothesis_case FOREIGN KEY (audit_case_id) REFERENCES public.ap_audit_cases(id) ON DELETE CASCADE;


--
-- Name: user_organizational_assignments fk_uoa_at; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_organizational_assignments
    ADD CONSTRAINT fk_uoa_at FOREIGN KEY (audit_type_id) REFERENCES public.audit_types(id);


--
-- Name: user_organizational_assignments fk_uoa_com; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_organizational_assignments
    ADD CONSTRAINT fk_uoa_com FOREIGN KEY (committee_id) REFERENCES public.committees(id);


--
-- Name: user_organizational_assignments fk_uoa_region; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_organizational_assignments
    ADD CONSTRAINT fk_uoa_region FOREIGN KEY (region_id) REFERENCES public.regions(id);


--
-- Name: user_organizational_assignments fk_uoa_tc; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_organizational_assignments
    ADD CONSTRAINT fk_uoa_tc FOREIGN KEY (tax_center_id) REFERENCES public.tax_centers(id);


--
-- Name: user_organizational_assignments fk_uoa_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_organizational_assignments
    ADD CONSTRAINT fk_uoa_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_roles fk_ur_role; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: user_roles fk_ur_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users fk_user_org_unit; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_user_org_unit FOREIGN KEY (org_unit_id) REFERENCES public.organizational_units(id);


--
-- Name: workflow_instances fk_wi_case; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_instances
    ADD CONSTRAINT fk_wi_case FOREIGN KEY (case_id) REFERENCES public.ap_audit_cases(id);


--
-- Name: workflow_instances fk_wi_definition; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_instances
    ADD CONSTRAINT fk_wi_definition FOREIGN KEY (definition_id) REFERENCES public.workflow_definitions(id);


--
-- Name: workflow_steps fk_ws_definition; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_steps
    ADD CONSTRAINT fk_ws_definition FOREIGN KEY (definition_id) REFERENCES public.workflow_definitions(id) ON DELETE CASCADE;


--
-- Name: workflow_tasks fk_wt_case; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_tasks
    ADD CONSTRAINT fk_wt_case FOREIGN KEY (case_id) REFERENCES public.ap_audit_cases(id);


--
-- Name: workflow_tasks fk_wt_instance; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_tasks
    ADD CONSTRAINT fk_wt_instance FOREIGN KEY (instance_id) REFERENCES public.workflow_instances(id);


--
-- Name: workflow_tasks fk_wt_step; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workflow_tasks
    ADD CONSTRAINT fk_wt_step FOREIGN KEY (step_id) REFERENCES public.workflow_steps(id);


--
-- Name: t_advisory_voting fkbtnm6tsblx4bth000jabmi5gy; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_advisory_voting
    ADD CONSTRAINT fkbtnm6tsblx4bth000jabmi5gy FOREIGN KEY (case_id) REFERENCES public.t_committee_case(case_id);


--
-- Name: ca_balance_sheet_items fkcfr0elghxsbnih5h2ln3igsga; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_balance_sheet_items
    ADD CONSTRAINT fkcfr0elghxsbnih5h2ln3igsga FOREIGN KEY (audit_case_id) REFERENCES public.ap_audit_cases(id);


--
-- Name: ca_audit_findings fkcp1jshk9m3ckji4xed9nb9l2x; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_audit_findings
    ADD CONSTRAINT fkcp1jshk9m3ckji4xed9nb9l2x FOREIGN KEY (audit_case_id) REFERENCES public.ap_audit_cases(id);


--
-- Name: t_case_status_history fkcpjkgkeuds2wp6cs1h4k8c11j; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_case_status_history
    ADD CONSTRAINT fkcpjkgkeuds2wp6cs1h4k8c11j FOREIGN KEY (case_id) REFERENCES public.t_committee_case(case_id);


--
-- Name: ca_document_requests fkcwqy6s0bdphtjjt9ovj5vucnn; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_document_requests
    ADD CONSTRAINT fkcwqy6s0bdphtjjt9ovj5vucnn FOREIGN KEY (audit_case_id) REFERENCES public.ap_audit_cases(id);


--
-- Name: tp_analysis_data fkcx61joljhaesp6h4djxy8ms7j; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tp_analysis_data
    ADD CONSTRAINT fkcx61joljhaesp6h4djxy8ms7j FOREIGN KEY (audit_case_id) REFERENCES public.ap_audit_cases(id);


--
-- Name: t_research_note fkd8ebkitecaq6pe3mvfnu2t570; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_research_note
    ADD CONSTRAINT fkd8ebkitecaq6pe3mvfnu2t570 FOREIGN KEY (case_id) REFERENCES public.t_committee_case(case_id);


--
-- Name: ca_caat_exceptions fkdav6a6ydl25090hrq5943l806; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_caat_exceptions
    ADD CONSTRAINT fkdav6a6ydl25090hrq5943l806 FOREIGN KEY (caat_run_id) REFERENCES public.ca_caat_runs(id);


--
-- Name: ca_taxpayer_responses fkdost1575isvlkunnd8ww085j2; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_taxpayer_responses
    ADD CONSTRAINT fkdost1575isvlkunnd8ww085j2 FOREIGN KEY (audit_case_id) REFERENCES public.ap_audit_cases(id);


--
-- Name: da_draft_reports fkedov6gd1hvih2rsj56kg8kuxm; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.da_draft_reports
    ADD CONSTRAINT fkedov6gd1hvih2rsj56kg8kuxm FOREIGN KEY (audit_case_id) REFERENCES public.ap_audit_cases(id);


--
-- Name: ca_exit_conferences fkeklrdlwk7deron6lo6oq2ianv; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_exit_conferences
    ADD CONSTRAINT fkeklrdlwk7deron6lo6oq2ianv FOREIGN KEY (audit_case_id) REFERENCES public.ap_audit_cases(id);


--
-- Name: qa_recommendations fkeu6h372ljyvrqldn3ia1au3gt; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_recommendations
    ADD CONSTRAINT fkeu6h372ljyvrqldn3ia1au3gt FOREIGN KEY (audit_case_id) REFERENCES public.ap_audit_cases(id);


--
-- Name: tp_objection fkf99wyh6btgd7yo0lkjuyycw75; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tp_objection
    ADD CONSTRAINT fkf99wyh6btgd7yo0lkjuyycw75 FOREIGN KEY (audit_case_id) REFERENCES public.ap_audit_cases(id);


--
-- Name: t_handoff_record fkfmajdxdwsv8urq1qxcigogpr1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_handoff_record
    ADD CONSTRAINT fkfmajdxdwsv8urq1qxcigogpr1 FOREIGN KEY (case_id) REFERENCES public.t_committee_case(case_id);


--
-- Name: ca_entry_conferences fkgrioibmkvln0nciin5o8lt2tj; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_entry_conferences
    ADD CONSTRAINT fkgrioibmkvln0nciin5o8lt2tj FOREIGN KEY (audit_case_id) REFERENCES public.ap_audit_cases(id);


--
-- Name: tp_planning_meeting fkh2ip8qmpebh2jfkc5orf433ca; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tp_planning_meeting
    ADD CONSTRAINT fkh2ip8qmpebh2jfkc5orf433ca FOREIGN KEY (audit_case_id) REFERENCES public.ap_audit_cases(id);


--
-- Name: ca_draft_reports fki28oq1x0up8v0poqhibx5hvx5; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_draft_reports
    ADD CONSTRAINT fki28oq1x0up8v0poqhibx5hvx5 FOREIGN KEY (audit_case_id) REFERENCES public.ap_audit_cases(id);


--
-- Name: tp_field_work_data fki3e6hvjuw8psf5kaev0d6y4fb; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tp_field_work_data
    ADD CONSTRAINT fki3e6hvjuw8psf5kaev0d6y4fb FOREIGN KEY (audit_case_id) REFERENCES public.ap_audit_cases(id);


--
-- Name: t_research_attachment fkia4ou7xfqq2gdw7okruvpop8o; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_research_attachment
    ADD CONSTRAINT fkia4ou7xfqq2gdw7okruvpop8o FOREIGN KEY (note_id) REFERENCES public.t_research_note(note_id);


--
-- Name: issue_audit_details fkjqcxl6kq7ib5gk0h0hci5lb2f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_audit_details
    ADD CONSTRAINT fkjqcxl6kq7ib5gk0h0hci5lb2f FOREIGN KEY (audit_case_id) REFERENCES public.ap_audit_cases(id);


--
-- Name: t_committee_vote fkke96tmubkpb9y64d5aqmcdldy; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_committee_vote
    ADD CONSTRAINT fkke96tmubkpb9y64d5aqmcdldy FOREIGN KEY (voting_id) REFERENCES public.t_advisory_voting(voting_id);


--
-- Name: t_handoff_team_member fkkn81nx78gmcdobptypbosavwm; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_handoff_team_member
    ADD CONSTRAINT fkkn81nx78gmcdobptypbosavwm FOREIGN KEY (handoff_id) REFERENCES public.t_handoff_record(handoff_id);


--
-- Name: ca_third_party_matches fkks3g0i4o1vgh1yb6onpobd14p; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_third_party_matches
    ADD CONSTRAINT fkks3g0i4o1vgh1yb6onpobd14p FOREIGN KEY (audit_case_id) REFERENCES public.ap_audit_cases(id);


--
-- Name: t_auditor_nomination fkny63jdjh6hvxpmft8w64pdm1g; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_auditor_nomination
    ADD CONSTRAINT fkny63jdjh6hvxpmft8w64pdm1g FOREIGN KEY (case_id) REFERENCES public.t_committee_case(case_id);


--
-- Name: ca_approval_steps fkofpinqpkaf175lex5q1yul0nh; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_approval_steps
    ADD CONSTRAINT fkofpinqpkaf175lex5q1yul0nh FOREIGN KEY (audit_case_id) REFERENCES public.ap_audit_cases(id);


--
-- Name: ca_taxpayer_responses fkok4ba3eu6f5ylx41ehm2jygq6; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_taxpayer_responses
    ADD CONSTRAINT fkok4ba3eu6f5ylx41ehm2jygq6 FOREIGN KEY (notice_id) REFERENCES public.ca_assessment_notices(id);


--
-- Name: ca_assessment_notices fkom4aotqp5nhm65k8kxbfrnlce; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_assessment_notices
    ADD CONSTRAINT fkom4aotqp5nhm65k8kxbfrnlce FOREIGN KEY (audit_case_id) REFERENCES public.ap_audit_cases(id);


--
-- Name: ap_plan_audit_logs fkonbjsudf7mrjig9p6el6gdt4a; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ap_plan_audit_logs
    ADD CONSTRAINT fkonbjsudf7mrjig9p6el6gdt4a FOREIGN KEY (plan_id) REFERENCES public.ap_annual_audit_plans(id);


--
-- Name: ca_multi_zone_allocations fkpb930r9jvqeocrncndq5vu1qt; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_multi_zone_allocations
    ADD CONSTRAINT fkpb930r9jvqeocrncndq5vu1qt FOREIGN KEY (notice_id) REFERENCES public.ca_assessment_notices(id);


--
-- Name: ca_working_papers fkqq44yfi0xv3uihol7cd6t4xtg; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_working_papers
    ADD CONSTRAINT fkqq44yfi0xv3uihol7cd6t4xtg FOREIGN KEY (audit_case_id) REFERENCES public.ap_audit_cases(id);


--
-- Name: ca_benchmark_analyses fkqwqsbh6at4bfwxjgb9uj6mrmv; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_benchmark_analyses
    ADD CONSTRAINT fkqwqsbh6at4bfwxjgb9uj6mrmv FOREIGN KEY (audit_case_id) REFERENCES public.ap_audit_cases(id);


--
-- Name: t_committee_audit_log fkrt1qrn5rs336clhg69cb8bifu; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_committee_audit_log
    ADD CONSTRAINT fkrt1qrn5rs336clhg69cb8bifu FOREIGN KEY (case_id) REFERENCES public.t_committee_case(case_id);


--
-- Name: qa_action_plans fkry7lwcphwsb31ba7my570c0kc; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.qa_action_plans
    ADD CONSTRAINT fkry7lwcphwsb31ba7my570c0kc FOREIGN KEY (audit_case_id) REFERENCES public.ap_audit_cases(id);


--
-- Name: t_committee_vote fksbyna6vbjcahkr8j4ryscldb9; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.t_committee_vote
    ADD CONSTRAINT fksbyna6vbjcahkr8j4ryscldb9 FOREIGN KEY (case_id) REFERENCES public.t_committee_case(case_id);


--
-- Name: tp_audit_report fktb82k70m7wosfce9nwba9c48k; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tp_audit_report
    ADD CONSTRAINT fktb82k70m7wosfce9nwba9c48k FOREIGN KEY (audit_case_id) REFERENCES public.ap_audit_cases(id);


--
-- Name: ca_execution_reports fktrbuy24gk6yhhfacqvmfq63a2; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ca_execution_reports
    ADD CONSTRAINT fktrbuy24gk6yhhfacqvmfq63a2 FOREIGN KEY (audit_case_id) REFERENCES public.ap_audit_cases(id);


--
-- Name: team_members team_members_auditor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_auditor_id_fkey FOREIGN KEY (auditor_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: team_members team_members_team_leader_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_team_leader_id_fkey FOREIGN KEY (team_leader_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict RChqCe2av3drAw65yyCwvJH0Dkf5hexbqwPPlxfSJK8Yr0SdkhlSu2vPUATKmof

