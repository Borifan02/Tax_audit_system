import { useState, useEffect } from 'react';
import {
  CheckCircle, XCircle, RotateCcw, Send, Eye, FileText, Clock,
  CheckSquare, Map, AlertCircle, ArrowRight, Edit3, Zap,
} from 'lucide-react';
import { formatRevenue, formatCaseCount } from '../../utils/revenueFormatter.js';
import { useApp } from '../../../../context/AppContext.jsx';
import { useAuth } from '../../../../context/AuthContext.jsx';
import { Card, StatCard, Button, Modal, Textarea, Alert, Table, Empty, Tabs, Badge } from '../../../../components/ui/index.jsx';
import PlanStatusBadge from '../shared/PlanStatusBadge.jsx';
import PlanDetailModal from '../planning/PlanDetailModal.jsx';
import { DistributionTable } from '../shared/DistributionTable.jsx';
import { DirectorWorkspace } from '../../../ca/components/comprehensive/DirectorWorkspace';

const PLAN_STATUS_ORDER = [
  'SUBMITTED_TO_DIRECTOR',
  'DIRECTOR_APPROVED',
  'AWAITING_REGIONAL_FEEDBACK',
  'FEEDBACK_COLLECTED',
  'AMENDMENT_REQUIRED',
  'SUBMITTED_TO_SENIOR_MGMT',
  'SENIOR_MGMT_APPROVED',
  'FINALIZED',
];

export default function DirectorDashboard({ view }) {
  const { state, actions, selectors } = useApp();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [reviewPlan, setReviewPlan] = useState(null);
  const [tab, setTab] = useState('pending');
  const [comment, setComment] = useState('');
  const [actionType, setActionType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingPendingPlans, setLoadingPendingPlans] = useState(false);
  const [activePlans, setActivePlans] = useState([]);
  const [allRegions, setAllRegions] = useState([]);  // ✅ NEW: Store all regions
  const [revenueStats, setRevenueStats] = useState(null);

  // Sync tab with view from sidebar navigation
  useEffect(() => {
    if (view === 'review') setTab('pending');
    else if (view === 'deploy') setTab('senior_approved');
    else if (view === 'approvals') setTab('approved');
    else if (view === 'dashboard') setTab('pending');
  }, [view]);

  // Load national revenue stats
  useEffect(() => {
    const loadRevenue = async () => {
      try {
        const res = await fetch('/api/v1/backoffice/ap/revenue/national');
        if (res.ok) {
          const data = await res.json();
          setRevenueStats(data);
        }
      } catch (err) {
        console.error('Failed to load revenue stats:', err);
      }
    };
    loadRevenue();
  }, []);

  // Load pending director review plans on mount
  useEffect(() => {
    const loadPendingPlans = async () => {
      if (!user?.id) return;
      setLoadingPendingPlans(true);
      try {
        await actions.loadPendingDirectorPlans(user.id);
        console.log('✅ Pending director plans loaded');
      } catch (error) {
        console.error('❌ Failed to load pending plans:', error);
      } finally {
        setLoadingPendingPlans(false);
      }
    };

    loadPendingPlans();
  }, [user?.id]);

  // ✅ NEW: Load all regions on mount
  useEffect(() => {
    const loadRegions = async () => {
      try {
        const response = await fetch('/api/v1/backoffice/ap/regions', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        if (response.ok) {
          const result = await response.json();
          setAllRegions(result.data || []);
          console.log('✅ Regions loaded:', result.data?.length);
        }
      } catch (error) {
        console.error('❌ Failed to load regions:', error);
      }
    };
    loadRegions();
  }, []);

  // ✅ Load active plans on mount (for stat cards and all tabs)
  useEffect(() => {
    if (user?.id && activePlans.length === 0) {
      const loadActive = async () => {
        try {
          const plans = await actions.loadActivePlans(user.id);
          setActivePlans(plans);
          console.log('✅ Active plans loaded:', plans.length);
        } catch (error) {
          console.error('❌ Failed to load active plans:', error);
        }
      };
      loadActive();
    }
  }, [user?.id]);

  const stats = selectors.getPlanStats();
  // ✅ Use state.plans directly as primary data source (synced via AppContext reloadPlans)
  const allPlans = state.plans.length > 0 ? state.plans : activePlans;
  // First-time submissions (no amendment revisions yet)
  const pending = allPlans.filter(p => p.status === 'SUBMITTED_TO_DIRECTOR' && !p.revisions?.some(r => r.type === 'amendment') && !p.amendmentComment);
  // Resubmissions after amendment cycle (has amendmentComment or amendment revisions)
  const amendedResubmissions = allPlans.filter(p => p.status === 'SUBMITTED_TO_DIRECTOR' && (p.revisions?.some(r => r.type === 'amendment') || p.amendmentComment));
  const readyToSend = allPlans.filter(p => p.status === 'DIRECTOR_APPROVED');
  const feedbackCollected = allPlans.filter(p => p.status === 'FEEDBACK_COLLECTED' || p.status === 'AWAITING_REGIONAL_FEEDBACK');
  const seniorApproved = allPlans.filter(p => p.status === 'SENIOR_MGMT_APPROVED');
  const seniorRejected = allPlans.filter(p => p.status === 'SENIOR_MGMT_REJECTED');
  const submittedToSenior = allPlans.filter(p => p.status === 'SUBMITTED_TO_SENIOR_MGMT');
  const approved = allPlans.filter(p =>
    ['DIRECTOR_APPROVED', 'AWAITING_REGIONAL_FEEDBACK', 'FEEDBACK_COLLECTED',
      'AMENDMENT_REQUIRED', 'SUBMITTED_TO_SENIOR_MGMT', 'SENIOR_MGMT_APPROVED', 'SENIOR_MGMT_REJECTED', 'FINALIZED'].includes(p.status)
  );

  const doAction = () => {
    if (!reviewPlan || !actionType) return;
    if ((actionType === 'revise' || actionType === 'amendment') && !comment.trim()) return;
    setLoading(true);

    (async () => {
      try {
        if (actionType === 'approve') {
          console.log('🔄 Approving plan:', reviewPlan.id);
          await actions.approvePlan(reviewPlan.id, user.id, comment);
          console.log('✅ Plan approved, reloading...');
          // Reload pending plans to refresh status
          await actions.loadPendingDirectorPlans(user.id);
          // ✅ Also reload active plans to show the newly approved plan
          const plans = await actions.loadActivePlans(user.id);
          setActivePlans(plans);
          console.log('✅ Plans reloaded');

        } else if (actionType === 'revise') {
          actions.requestRevision(reviewPlan.id, user.id, comment);
        } else if (actionType === 'amendment') {
          await actions.sendAmendmentToPlanningTeam(reviewPlan.id, user.id, comment);
          await actions.loadPendingDirectorPlans(user.id);
          const plans = await actions.loadActivePlans(user.id);
          setActivePlans(plans);
        } else if (actionType === 'submit_senior') {
          await actions.submitToSeniorMgmt(reviewPlan.id, user.id);
          await actions.loadPendingDirectorPlans(user.id);
          const plans = await actions.loadActivePlans(user.id);
          setActivePlans(plans);
        } else if (actionType === 'send_to_regions_pre') {
          // Now send to regions only after approval
          await actions.sendToRegions(reviewPlan.id, user.id, comment);
          // Reload pending plans to refresh status
          await actions.loadPendingDirectorPlans(user.id);
          // ✅ Also reload active plans to update status
          const plans = await actions.loadActivePlans(user.id);
          setActivePlans(plans);
        } else if (actionType === 'send_regions') {
          await actions.sendApprovedToRegions(reviewPlan.id, user.id);
          await actions.loadPendingDirectorPlans(user.id);
          const plans = await actions.loadActivePlans(user.id);
          setActivePlans(plans);
        }

        setLoading(false);
        setReviewPlan(null);
        setComment('');
        setActionType(null);
      } catch (error) {
        console.error('❌ Action failed:', error);
        alert(`Error: ${error.message}`);
        setLoading(false);
      }
    })();
  };

  const openAction = (plan, type) => {
    setReviewPlan(plan);
    setActionType(type);
    setComment('');
  };

  const planCols = (showActions = true) => [
    { key: 'id', label: 'ID', render: v => <span className="font-mono text-xs text-gray-400 dark:text-gray-500">{v}</span> },
    {
      key: 'name', label: 'Plan', render: (v, row) => (
        <div>
          <p className="font-medium text-sm text-gray-900 dark:text-white">{v || row.planName || 'N/A'}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">FY {row.year || row.planYear}</p>
        </div>
      )
    },
    { key: 'totalCases', label: 'Cases', render: v => <span className="font-semibold tabular-nums">{v?.toLocaleString()}</span> },
    { key: 'status', label: 'Status', render: v => <PlanStatusBadge status={v} /> },
    {
      key: 'submittedToDirectorAt', label: 'Submitted', render: (v, row) => (
        <div className="text-xs">
          <p className="text-gray-600 dark:text-gray-400">{v ? new Date(v).toLocaleDateString() : '-'}</p>
          <p className="text-gray-400 dark:text-gray-500">{row.submittedToDirectorBy || '-'}</p>
        </div>
      )
    },
    ...(showActions ? [{
      key: '_act', label: '', render: (_, row) => (
        <div className="flex gap-1.5 justify-end flex-wrap" onClick={e => e.stopPropagation()}>
          <Button size="xs" variant="ghost" icon={Eye} onClick={() => setSelectedPlan(row)}>View</Button>

          {/* SUBMITTED_TO_DIRECTOR (first time): approve or request revision */}
          {row.status === 'SUBMITTED_TO_DIRECTOR' && !row.revisions?.some(r => r.type === 'amendment') && !row.amendmentComment && (
            <>
              <Button size="xs" variant="success" icon={CheckCircle} onClick={() => openAction(row, 'approve')}>Approve</Button>
              <Button size="xs" variant="primary" icon={Send} onClick={() => openAction(row, 'send_to_regions_pre')}>Route to Regions/LTO</Button>
              <Button size="xs" variant="warning" icon={RotateCcw} onClick={() => openAction(row, 'revise')}>Revise</Button>
            </>
          )}

          {/* SUBMITTED_TO_DIRECTOR (after amendment): approve routes to Senior Mgmt directly, or more revision */}
          {row.status === 'SUBMITTED_TO_DIRECTOR' && (row.revisions?.some(r => r.type === 'amendment') || row.amendmentComment) && (
            <>
              <Button size="xs" variant="success" icon={CheckCircle} onClick={() => openAction(row, 'approve')}>
                ✓ Approve → Sr. Mgmt
              </Button>
              <Button size="xs" variant="primary" icon={Send} onClick={() => openAction(row, 'send_to_regions_pre')}>Route to Regions/LTO</Button>
              <Button size="xs" variant="warning" icon={RotateCcw} onClick={() => openAction(row, 'amendment')}>
                Send for Amendment
              </Button>
            </>
          )}

          {/* DIRECTOR_APPROVED or SUBMITTED_TO_REGIONAL: send/route to regions for feedback */}
          {(row.status === 'DIRECTOR_APPROVED' || row.status === 'SUBMITTED_TO_REGIONAL') && (
            <Button size="xs" variant="primary" icon={Send} onClick={() => openAction(row, 'send_to_regions_pre')}>
              Route to Regions/LTO
            </Button>
          )}

          {/* AWAITING_REGIONAL_FEEDBACK / REGIONAL_APPROVED: Director can forward directly to Senior Mgmt or send for amendment */}
          {(row.status === 'AWAITING_REGIONAL_FEEDBACK' || row.status === 'REGIONAL_APPROVED') && (
            <>
              <Button size="xs" variant="primary" icon={ArrowRight} onClick={() => openAction(row, 'submit_senior')}>
                Forward to Senior Mgmt
              </Button>

              <Button size="xs" variant="secondary" icon={Send} onClick={() => openAction(row, 'send_to_regions_pre')}>
                Re-route to Regions/LTO
              </Button>
              <Button size="xs" variant="ghost" icon={Eye} onClick={() => setSelectedPlan(row)}>
                View Feedback
              </Button>
              <Button size="xs" variant="warning" icon={Edit3} onClick={() => openAction(row, 'amendment')}>
                Send for Amendment
              </Button>
            </>
          )}

          {/* FEEDBACK_COLLECTED: All regions submitted — send for amendment */}
          {row.status === 'FEEDBACK_COLLECTED' && (
            <>
              <Button size="xs" variant="primary" icon={ArrowRight} onClick={() => openAction(row, 'submit_senior')}>
                Forward to Senior Mgmt
              </Button>
              <Button size="xs" variant="warning" icon={Edit3} onClick={() => openAction(row, 'amendment')}>
                Send for Amendment
              </Button>
            </>
          )}

          {/* SENIOR_MGMT_REJECTED: Director handles — resubmit to Senior or send back for amendment */}
          {row.status === 'SENIOR_MGMT_REJECTED' && (
            <>
              <Button size="xs" variant="indigo" icon={ArrowRight} onClick={() => openAction(row, 'submit_senior')}>
                Resubmit to Senior
              </Button>
              <Button size="xs" variant="warning" icon={Edit3} onClick={() => openAction(row, 'amendment')}>
                Send for Amendment
              </Button>
            </>
          )}

          {/* SENIOR_MGMT_APPROVED or FINALIZED: Director deploys the plan */}
          {(row.status === 'SENIOR_MGMT_APPROVED' || row.status === 'FINALIZED') && (
            <Button size="xs" variant="success" icon={Zap} onClick={() => openAction(row, 'send_regions')}>
              Deploy to Regions & LTO
            </Button>
          )}
        </div>
      )
    }] : []),
  ];

  const ACTION_META = {
    approve: { title: 'Approve Plan', variant: 'success', icon: CheckCircle, commentLabel: 'Approval Note (optional)', required: false },
    revise: { title: 'Request Revision', variant: 'warning', icon: RotateCcw, commentLabel: 'Revision Instructions *', required: true },
    amendment: { title: 'Send for Amendment', variant: 'warning', icon: Edit3, commentLabel: 'Amendment Instructions *', required: true },
    submit_senior: { title: 'Submit to Senior Management', variant: 'primary', icon: ArrowRight, commentLabel: 'Notes for Senior Management', required: false },
    send_regions: { title: 'Send Approved Plan to All Regions', variant: 'success', icon: Zap, commentLabel: 'Message to Regions (optional)', required: false },
    send_to_regions_pre: { title: 'Send to Regions for Feedback', variant: 'primary', icon: Send, commentLabel: 'Notes for Regional Directors', required: false },
  };

  const meta = ACTION_META[actionType] || {};

  const tabs = [
    { id: 'ca_execution', label: 'CA Execution Reviews', count: 1 },
    { id: 'pending', label: 'Pending Review', count: pending.length + amendedResubmissions.length },
    { id: 'feedback', label: 'Regional Feedback', count: feedbackCollected.length },
    { id: 'submitted_to_senior', label: 'At Senior Mgmt', count: submittedToSenior.length },
    { id: 'senior_rejected', label: 'Senior Rejected', count: seniorRejected.length },
    { id: 'senior_approved', label: 'Ready to Deploy', count: seniorApproved.length },
    { id: 'approved', label: 'All Active Plans', count: approved.length },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Director Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Overview of audit plans, workflow status, and approval actions</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 font-medium">FY 2026</span>
          <Button variant="primary" size="sm" icon={Zap} onClick={() => actions.loadActivePlans(user?.id)}>
            Refresh Data
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Active Plans" value={approved.length} icon={FileText} color="blue" sub={`${approved.length} total active plans`} />
        <StatCard label="Pending Review" value={pending.length + amendedResubmissions.length} icon={Clock} color="yellow" sub="Awaiting your decision" />
        <StatCard label="Regional Feedback" value={feedbackCollected.length} icon={Map} color="purple" sub="Feedback submitted" />
        <StatCard label="Senior Approved" value={seniorApproved.length} icon={CheckSquare} color="green" sub="Ready for regional deployment" />
        <StatCard label="Est. Revenue" value={revenueStats ? formatRevenue(revenueStats.totalRevenue) : '...'} icon={Zap} color="teal" sub={`${formatCaseCount(revenueStats?.totalCases || 0)} total planned cases`} />
      </div>

      {/* Audit Plan Workflow Stepper */}
      <Card className="p-4 bg-white dark:bg-[#161b26] border border-gray-200 dark:border-[#1e2736]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Audit Plan Workflow Lifecycle</h3>
          <span className="text-xs text-gray-400">Live Stage Tracker</span>
        </div>
        <div className="grid grid-cols-6 gap-2 text-center text-xs font-semibold">
          <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700">
            <p className="text-gray-400 text-[10px]">STAGE 1</p>
            <p className="text-gray-700 dark:text-gray-200 font-bold mt-0.5">Submitted</p>
            <Badge color="yellow" className="mt-1">{pending.length}</Badge>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
            <p className="text-blue-500 text-[10px]">STAGE 2</p>
            <p className="text-blue-700 dark:text-blue-300 font-bold mt-0.5">Director Approved</p>
            <Badge color="blue" className="mt-1">{readyToSend.length}</Badge>
          </div>
          <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/30">
            <p className="text-purple-500 text-[10px]">STAGE 3</p>
            <p className="text-purple-700 dark:text-purple-300 font-bold mt-0.5">Regional Feedback</p>
            <Badge color="purple" className="mt-1">{feedbackCollected.length}</Badge>
          </div>
          <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30">
            <p className="text-indigo-500 text-[10px]">STAGE 4</p>
            <p className="text-indigo-700 dark:text-indigo-300 font-bold mt-0.5">At Senior Mgmt</p>
            <Badge color="indigo" className="mt-1">{submittedToSenior.length}</Badge>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30">
            <p className="text-emerald-500 text-[10px]">STAGE 5</p>
            <p className="text-emerald-700 dark:text-emerald-300 font-bold mt-0.5">Senior Approved</p>
            <Badge color="green" className="mt-1">{seniorApproved.length}</Badge>
          </div>
          <div className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800/30">
            <p className="text-teal-500 text-[10px]">STAGE 6</p>
            <p className="text-teal-700 dark:text-teal-300 font-bold mt-0.5">Deployed</p>
            <Badge color="teal" className="mt-1">{approved.filter(p => p.status === 'FINALIZED').length}</Badge>
          </div>
        </div>
      </Card>

      {/* Main Content Grid: Left Table View & Right Widget Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left 3 columns: Tabbed Plans Table */}
        <div className="lg:col-span-3 space-y-4">
          <Card padding={false}>
            <div className="px-6 pt-4 pb-0 border-b border-gray-100 dark:border-[#1e2736]">
              <Tabs tabs={tabs} active={tab} onChange={setTab} />
            </div>

            {/* Alert banners inside table container */}
            <div className="p-4 space-y-3">
              {(pending.length > 0 || amendedResubmissions.length > 0) && (
                <Alert type="info" title={`${pending.length + amendedResubmissions.length} plan(s) awaiting your review`}>
                  {amendedResubmissions.length > 0 && <span className="font-semibold text-blue-700">{amendedResubmissions.length} amended resubmission(s) ready for Senior Management forwarding. </span>}
                  {pending.length > 0 && 'Approve or request revisions on newly submitted audit plans.'}
                </Alert>
              )}
              {feedbackCollected.length > 0 && (
                <Alert type="warning" title={`${feedbackCollected.length} plan(s) have regional feedback collected`}>
                  Review regional feedback and send back for amendment before forwarding to Senior Management.
                </Alert>
              )}
              {submittedToSenior.length > 0 && (
                <Alert type="info" title={`${submittedToSenior.length} plan(s) with Senior Management`}>
                  These plans have been forwarded to Senior Management for final approval. You can track their progress here.
                </Alert>
              )}
              {seniorApproved.length > 0 && (
                <Alert type="success" title={`${seniorApproved.length} plan(s) approved by Senior Management`}>
                  Click <strong>"Deploy to Regions"</strong> to deploy the plan — this will distribute cases to all regions and tax centers.
                </Alert>
              )}
            </div>

            <div className="p-4 pt-0">
              {tab === 'ca_execution' && (
                <DirectorWorkspace currentUser={user} />
              )}
              {tab === 'pending' && (
                pending.length === 0 && amendedResubmissions.length === 0
                  ? <Empty icon={CheckCircle} title="No pending plans" description="All submitted plans have been reviewed." />
                  : <Table columns={planCols(true)} rows={[...pending, ...amendedResubmissions]} onRowClick={row => setSelectedPlan(row)} />
              )}
              {tab === 'feedback' && (
                feedbackCollected.length === 0
                  ? <Empty icon={Map} title="No regional feedback yet" description="Plans will appear here once regions start submitting their feedback." />
                  : <Table columns={planCols(true)} rows={feedbackCollected} onRowClick={row => setSelectedPlan(row)} />
              )}
              {tab === 'submitted_to_senior' && (
                submittedToSenior.length === 0
                  ? <Empty icon={Clock} title="No plans at Senior Management" description="Plans awaiting senior management approval will appear here." />
                  : <Table columns={planCols(true)} rows={submittedToSenior} onRowClick={row => setSelectedPlan(row)} />
              )}
              {tab === 'senior_rejected' && (
                seniorRejected.length === 0
                  ? <Empty icon={AlertCircle} title="No Senior Management rejections" description="Plans rejected by Senior Management will appear here." />
                  : <Table columns={planCols(true)} rows={seniorRejected} onRowClick={row => setSelectedPlan(row)} />
              )}
              {tab === 'senior_approved' && (
                seniorApproved.length === 0
                  ? <Empty icon={CheckSquare} title="No approved plans awaiting deployment" description="Plans approved by Senior Management will appear here." />
                  : <Table columns={planCols(true)} rows={seniorApproved} onRowClick={row => setSelectedPlan(row)} />
              )}
              {tab === 'approved' && (
                approved.length === 0
                  ? <Empty icon={FileText} title="No active plans yet" />
                  : <Table columns={planCols(true)} rows={approved} onRowClick={row => setSelectedPlan(row)} />
              )}
            </div>
          </Card>
        </div>

        {/* Right 1 column: Sidebar Quick Widgets */}
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Button variant="secondary" className="w-full justify-start" size="sm" icon={Eye} onClick={() => setTab('pending')}>
                Review Pending Plans ({pending.length})
              </Button>
              <Button variant="secondary" className="w-full justify-start" size="sm" icon={Map} onClick={() => setTab('feedback')}>
                Track Regional Feedback ({feedbackCollected.length})
              </Button>
              <Button variant="secondary" className="w-full justify-start" size="sm" icon={CheckSquare} onClick={() => setTab('senior_approved')}>
                Deploy Senior Approved Plans
              </Button>
            </div>
          </Card>

          {/* Regional Coverage Widget */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Regional Coverage</h3>
              <Badge color="blue">{allRegions.length || 11} Regions</Badge>
            </div>
            <p className="text-xs text-gray-500 mb-3">Active regional distribution & feedback collection</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-slate-800">
                <span className="text-gray-600 dark:text-gray-400 font-medium">Feedback Completed</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{feedbackCollected.length}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-slate-800">
                <span className="text-gray-600 dark:text-gray-400 font-medium">Pending Review</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{pending.length}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-600 dark:text-gray-400 font-medium">Ready to Deploy</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{seniorApproved.length}</span>
              </div>
            </div>
          </Card>

          {/* National Revenue Breakdown Widget */}
          {revenueStats && revenueStats.auditTypeBreakdown && (
            <Card className="p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Est. Revenue by Audit Type</h3>
              <div className="space-y-2 text-xs">
                {revenueStats.auditTypeBreakdown.map((item) => (
                  <div key={item.auditType} className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-slate-800 last:border-0">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">{item.auditType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}</span>
                    <span className="font-bold text-gray-900 dark:text-white">{formatRevenue(item.estimatedRevenue)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Action Modal */}
      <Modal
        open={!!reviewPlan && !!actionType}
        onClose={() => { setReviewPlan(null); setActionType(null); setComment(''); }}
        title={`${meta.title || ''} — ${reviewPlan?.planName || reviewPlan?.name || 'Plan'} (FY ${reviewPlan?.planYear || reviewPlan?.year || ''})`}
        size="lg"
        footer={<>
          <Button variant="secondary" onClick={() => { setReviewPlan(null); setActionType(null); setComment(''); }}>Cancel</Button>
          <Button
            variant={meta.variant || 'primary'}
            icon={meta.icon}
            loading={loading}
            onClick={() => {
              // For send_to_regions_pre, call sendToRegions directly
              if (actionType === 'send_to_regions_pre') {
                console.log('🔄 Send to Regions clicked');
                console.log('   Plan ID:', reviewPlan?.id);
                console.log('   User ID:', user?.id);
                console.log('   Comment:', comment);

                if (!reviewPlan?.id) {
                  alert('❌ Error: Plan ID is missing');
                  return;
                }
                if (!user?.id) {
                  alert('❌ Error: User ID is missing. Please log in again.');
                  return;
                }

                setLoading(true);
                (async () => {
                  try {
                    console.log('📤 Calling sendToRegions API...');
                    const result = await actions.sendToRegions(reviewPlan.id, user.id, comment);
                    console.log('✅ Plan sent successfully:', result);

                    // Show success message
                    alert('✅ Plan sent to regions successfully!');

                    setReviewPlan(null);
                    setActionType(null);
                    setComment('');

                    // Reload BOTH pending and active plans to show updated status
                    console.log('🔄 Reloading all plans...');
                    await actions.loadPendingDirectorPlans(user.id);
                    const freshActivePlans = await actions.loadActivePlans(user.id);
                    setActivePlans(freshActivePlans);
                    console.log('✅ All plans reloaded:', freshActivePlans?.length, 'active plans');
                  } catch (error) {
                    console.error('❌ Error sending to regions:', error);
                    console.error('   Error message:', error.message);
                    console.error('   Error details:', JSON.stringify(error, null, 2));
                    alert(`❌ Failed to send plan to regions:\n\n${error.message}`);
                  } finally {
                    setLoading(false);
                  }
                })();
              } else {
                doAction();
              }
            }}
            disabled={meta.required && !comment.trim()}
          >
            {meta.title}
          </Button>
        </>}
      >
        {reviewPlan && (
          <div className="space-y-4">
            {/* Show regional feedback summary for amendment */}
            {actionType === 'amendment' && reviewPlan.regionalFeedback && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700 dark:text-slate-200">Regional Feedback Summary</p>
                {Object.entries(reviewPlan.regionalFeedback).map(([region, fb]) => {
                  const isSubmitted = fb._status === 'submitted' || fb.submitted;
                  const feedbackData = fb.feedback || fb;
                  const totalCases = Object.values(feedbackData).reduce((sum, v) => sum + (v?.totalRequested || v?.totalCapacity || 0), 0);
                  return (
                    <div key={region} className={`rounded-lg p-3 text-xs ${isSubmitted ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-gray-50 dark:bg-slate-700'}`}>
                      <p className="font-medium text-gray-700 dark:text-slate-200 capitalize mb-1">{region.replace(/_/g, ' ')} {isSubmitted ? '✓ Submitted' : '(Default)'}</p>
                      <p className="text-gray-600 dark:text-slate-400">
                        {totalCases.toLocaleString()} total cases across {Object.keys(feedbackData).length} audit types
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Distribution summary for approve/revise */}
            {(actionType === 'approve' || actionType === 'revise') && (
              <div className="bg-gray-50 rounded-xl p-4 dark:bg-slate-700">
                <p className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2">Distribution Summary</p>
                <DistributionTable distribution={reviewPlan.distribution} />
              </div>
            )}

            {/* Warning for send_regions */}
            {actionType === 'send_regions' && (
              <Alert type="info" title="This action will deploy the plan">
                Sending the approved plan to all regions will automatically distribute audit cases to each tax center.
                This action cannot be undone.
              </Alert>
            )}

            {/* ✅ NEW: Show regions and plan details for send_to_regions_pre */}
            {actionType === 'send_to_regions_pre' && (
              <div className="space-y-4">
                {/* Plan Details */}
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <h4 className="font-bold text-sm text-blue-900 dark:text-blue-100 mb-3">Plan Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Plan Name</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{reviewPlan?.planName || reviewPlan?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Fiscal Year</p>
                      <p className="font-semibold text-gray-900 dark:text-white">FY {reviewPlan?.planYear || reviewPlan?.year || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Total Cases</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{reviewPlan?.totalCases?.toLocaleString() || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Status</p>
                      <p className="font-semibold text-blue-600 dark:text-blue-400">DIRECTOR_APPROVED</p>
                    </div>
                  </div>
                </div>

                {/* Distribution Summary */}
                {reviewPlan?.distribution && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-3">Distribution Summary</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-200 dark:bg-gray-700">
                          <tr>
                            <th className="px-2 py-1 text-left text-gray-900 dark:text-white">Region</th>
                            <th className="px-2 py-1 text-right text-gray-900 dark:text-white">Total Cases</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {Object.entries(reviewPlan.distribution).map(([region, auditTypes]) => {
                            const total = Object.values(auditTypes || {}).reduce((sum, count) => sum + (count || 0), 0);
                            return (
                              <tr key={region}>
                                <td className="px-2 py-1 text-gray-900 dark:text-white font-medium">{region}</td>
                                <td className="px-2 py-1 text-right text-gray-900 dark:text-white font-bold">{total}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ✅ NEW: Show all regions that will receive this plan */}
                <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <h4 className="font-bold text-sm text-green-900 dark:text-green-100 mb-3">📍 Regions to Receive This Plan</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {allRegions.map((region) => (
                      <div key={region.code} className="flex items-center gap-2 bg-white dark:bg-gray-700 p-2 rounded border border-green-200 dark:border-green-800">
                        <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">✓</span>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white text-xs">{region.name}</p>
                          <p className="text-gray-500 dark:text-gray-400 text-xs">Code: {region.code}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-3 p-2 bg-green-100 dark:bg-green-900/50 rounded">
                    ✅ This plan will be sent to all {allRegions.length} regions. Each region can then allocate to their tax centers.
                  </p>
                </div>

                {/* Notes */}
                <Alert type="warning" title="Regional directors will be able to allocate cases">
                  Once sent, regional directors can view this plan and allocate cases to their tax centers.
                </Alert>
              </div>
            )}

            <Textarea
              label={meta.commentLabel || 'Notes'}
              placeholder={
                actionType === 'amendment'
                  ? 'Specify what the planning team should change based on regional feedback...'
                  : actionType === 'revise'
                    ? 'Explain what needs to be changed before approval...'
                    : 'Optional notes...'
              }
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
          </div>
        )}
      </Modal>

      {selectedPlan && <PlanDetailModal plan={selectors.getPlanById(selectedPlan.id)} onClose={() => setSelectedPlan(null)} />}
    </div>
  );
}
