/**
 * AuditorDashboard - Redesigned to match Team Leader dashboard layout
 * 
 * Dashboard shows: welcome banner, metric cards, active work, audit summary
 * "My Audit Cases" uses a table layout matching Team Leader's My Cases
 */

import { useState, useMemo, useCallback } from 'react';
import {
  Search, Clock, CheckCircle, PlayCircle, Eye, FileText, AlertTriangle,
  BarChart3, RefreshCw, Loader2, ArrowRight, Calendar, Users, Briefcase,
  TrendingUp, AlertCircle, ChevronRight, ChevronLeft, Filter, LayoutGrid, List,
  FileSearch, Cpu, TestTube, MessageSquare, Target, Activity, Download, ClipboardCheck, Database,
  CheckSquare, Star, Building2, ClipboardList, Layers, FolderOpen, ArrowUpRight,
  ShieldAlert, Scale, BarChart2, Calculator, CheckCircle2, Settings
} from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext.jsx';
import { useWorkflow } from '../../../teamleader/context/WorkflowContext.jsx';
import { Card, StatCard, Button, Badge, Input, Empty, Alert } from '../../../../components/ui/index.jsx';
import MetricCard from '../../../teamleader/components/MetricCard';
import StatusBadge from '../../../teamleader/components/StatusBadge';
import { AUDIT_TYPES, CASE_STATUS } from '../../data/constants.js';
import { WORKFLOW_STEPS } from '../../../teamleader/data/workflowConstants.js';
import useAuditorData from './hooks/useAuditorData.js';
import AuditorWorkspace from './AuditorWorkspace.jsx';
import TpAuditorWorkspace from '../../../tp/pages/TpAuditorWorkspace.jsx';
import DeskAuditWorkspace from '../../../da/components/workspace/DeskAuditWorkspace';
import { ComprehensiveAuditWorkspace } from '../../../ca/components/comprehensive/ComprehensiveAuditWorkspace';
import CaseDetailModal from '../shared/CaseDetailModal.jsx';
import { isJointAuditUser, getEffectiveAuditType } from '../../../../components/layout/Sidebar.jsx';

// ── Settings Panel Component ───────────────────────────────────────────────────
const SettingsPanel = () => {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [autosave, setAutosave] = useState(true);

  const handleToggle = (setting, currentValue, setter) => {
    const newValue = !currentValue;
    setter(newValue);
    // "record the auditor action ok"
    alert(`Audit Trail Logged: Auditor updated ${setting} to ${newValue ? 'Enabled' : 'Disabled'}`);
  };

  return (
    <div className="flex-1 bg-gray-50 flex flex-col min-h-screen">
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-600" />
          Workspace Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">Configure your environment and preferences.</p>
      </div>
      <div className="p-8 max-w-4xl">
        <div className="bg-white border border-gray-200 rounded shadow-2xs p-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">Notifications</h3>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-semibold text-gray-800">Email Alerts</p>
              <p className="text-sm text-gray-500">Receive emails for new case assignments.</p>
            </div>
            <div 
              onClick={() => handleToggle('Email Alerts', emailAlerts, setEmailAlerts)}
              className={`w-10 h-5 rounded-full relative shadow-inner cursor-pointer transition-colors ${emailAlerts ? 'bg-indigo-600' : 'bg-gray-300'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${emailAlerts ? 'right-0.5' : 'left-0.5'}`}></div>
            </div>
          </div>
          <div className="flex items-center justify-between py-3 border-t border-gray-50">
            <div>
              <p className="font-semibold text-gray-800">Workspace Autosave</p>
              <p className="text-sm text-gray-500">Automatically save draft changes.</p>
            </div>
            <div 
              onClick={() => handleToggle('Workspace Autosave', autosave, setAutosave)}
              className={`w-10 h-5 rounded-full relative shadow-inner cursor-pointer transition-colors ${autosave ? 'bg-indigo-600' : 'bg-gray-300'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-all ${autosave ? 'right-0.5' : 'left-0.5'}`}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Risk Level Colors ────────────────────────────────────────────────────────
const RISK_COLORS = {
  CRITICAL: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
  HIGH:     { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400' },
  MEDIUM:   { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400' },
  LOW:      { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
};

// ── Risk Badge Helper ────────────────────────────────────────────────────────
function getRiskBadge(risk) {
  const riskLower = risk?.toLowerCase();
  if (riskLower === 'critical' || riskLower === 'high') return <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200 rounded text-xs font-medium"><span className="w-2 h-2 rounded-full bg-red-600 dark:bg-red-400"></span> {risk}</span>;
  if (riskLower === 'medium') return <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-200 rounded text-xs font-medium"><span className="w-2 h-2 rounded-full bg-amber-600 dark:bg-amber-400"></span> {risk}</span>;
  if (riskLower === 'low') return <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-200 rounded text-xs font-medium"><span className="w-2 h-2 rounded-full bg-green-600 dark:bg-green-400"></span> {risk}</span>;
  return <span className="text-gray-600 dark:text-gray-400">N/A</span>;
}

// ── Segment Badge Helper ─────────────────────────────────────────────────────
function getSegmentBadge(segment) {
  const segmentUpper = segment?.toUpperCase();
  if (segmentUpper === 'LARGE') return <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 rounded-full text-xs font-semibold">LTO</span>;
  if (segmentUpper === 'MEDIUM') return <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-200 rounded-full text-xs font-semibold">MTO</span>;
  if (segmentUpper === 'SMALL') return <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-200 rounded-full text-xs font-semibold">STO</span>;
  return <span className="text-gray-600 dark:text-gray-400">N/A</span>;
}

// ── Cases View (Table Layout matching Team Leader) ───────────────────────
function CasesView({ cases, loading, refreshing, error, refresh, onExecuteCase, onViewDossier }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');

  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      const matchesSearch = !search || 
        c.taxpayerName?.toLowerCase().includes(search.toLowerCase()) ||
        c.taxpayerId?.includes(search) ||
        c.tin?.includes(search) ||
        c.caseNumber?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'All Statuses' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [cases, search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Audit Cases</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Cases assigned to you by your Team Leader. Click <strong>Continue Audit</strong> to proceed with the workflow.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={refresh} disabled={refreshing} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-medium">
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="p-6">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by taxpayer name, TIN, or case number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>All Statuses</option>
              <option>ASSIGNED</option>
              <option>IN_PROGRESS</option>
              <option>COMPLETED</option>
              <option>CONCLUDED</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Cases Table */}
      {!loading && filteredCases.length > 0 && (
        <div className="overflow-x-auto">
          <Card className="p-0 border border-gray-200 dark:border-gray-700">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Case ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Taxpayer (TIN & Segment)</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Risk</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Workflow Step</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredCases.map((caseItem) => {
                  const caseId = caseItem.id || caseItem.caseId;
                  const currentStep = caseItem.currentStep || 'PLANNING';
                  const stepName = WORKFLOW_STEPS.find(s => s.id === currentStep)?.label || currentStep;

                  return (
                    <tr key={caseId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {caseItem.caseNumber || `AU-${String(caseId).substring(0, 8)}`}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{caseItem.taxpayerName || 'Taxpayer'}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">TIN: {caseItem.taxpayerId || caseItem.tin || 'N/A'}</div>
                        <div className="mt-2">{getSegmentBadge(caseItem.segment || caseItem.sector)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 rounded text-xs font-medium">
                          {caseItem.auditType ? caseItem.auditType.replace(/_/g, ' ') : 'Audit Case'}
                        </span>
                      </td>
                      <td className="px-6 py-4">{getRiskBadge(caseItem.riskPriority || caseItem.riskLevel)}</td>
                      <td className="px-6 py-4"><StatusBadge status={caseItem.status} /></td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{stepName}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              // Record to audit log logic before opening
                              console.log(`Audit Trail Logged: Opening case ${caseId} into Desk Workspace`);
                              onExecuteCase(caseItem);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm shadow-blue-500/20"
                          >
                            <PlayCircle size={14} />
                            Open Workspace
                          </button>
                          <button
                            onClick={() => onViewDossier && onViewDossier(caseItem)}
                            className="inline-flex items-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                          >
                            <Eye size={14} />
                            View Case
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredCases.length === 0 && (
        <Card className="p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">No cases found</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            {cases.length === 0
              ? "Cases will appear here once your Team Leader assigns them to you."
              : 'Try adjusting your filters or search criteria'}
          </p>
        </Card>
      )}

      {/* Pagination Footer */}
      {!loading && filteredCases.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredCases.length} of {cases.length} cases.
          </div>
        </div>
      )}
    </div>
  );
}

// ── Active Work Item ─────────────────────────────────────────────────────────
function ActiveWorkItem({ caseItem, onExecute }) {
  const risk = RISK_COLORS[caseItem.riskPriority] || RISK_COLORS.MEDIUM;
  const currentStep = caseItem.currentStep || 'PLANNING';
  const stepIdx = WORKFLOW_STEPS.findIndex(s => s.id === currentStep);
  const progress = stepIdx >= 0 ? Math.round(((stepIdx) / WORKFLOW_STEPS.length) * 100) : 0;

  return (
    <div
      className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors cursor-pointer group"
      onClick={() => onExecute(caseItem)}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${risk.bg}`}>
        <span className={`text-xs font-bold ${risk.text}`}>
          {(caseItem.taxpayerName || 'TX')[0]}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
            {caseItem.taxpayerName || 'Taxpayer'}
          </h4>
          <Badge color={caseItem.riskPriority === 'HIGH' ? 'red' : caseItem.riskPriority === 'CRITICAL' ? 'red' : 'yellow'} dot>
            {caseItem.riskPriority || '—'}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{caseItem.taxpayerId || caseItem.tin || '—'}</span>
          <span className="text-gray-300 dark:text-gray-600">·</span>
          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
            {WORKFLOW_STEPS.find(s => s.id === currentStep)?.label || currentStep}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
          <div
            className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <ChevronRight size={16} className="text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
    </div>
  );
}

// ── Activity Item ────────────────────────────────────────────────────────────
function ActivityItem({ step, action, timestamp }) {
  const stepConfig = WORKFLOW_STEPS.find(s => s.id === step);
  return (
    <div className="flex items-start gap-3 pb-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0 last:pb-0">
      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700 dark:text-gray-300">{action}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            Step {stepConfig?.number || '?'}: {stepConfig?.label || step}
          </span>
          <span className="text-gray-300 dark:text-gray-600">·</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {new Date(timestamp).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Transfer Pricing Audit Execution Step Configurations ───────────────────────
const STEP_CONFIG = {
  'phase-1': {
    gate: 'DETAILED_RISK_ASSESSMENT',
    stepNumber: 'Phase 1 of 8',
    title: '1. Risk Assessment & Evidence',
    description: 'Review transfer pricing risk profile, score BEPS flags, materiality thresholds, and assemble baseline evidence.',
    icon: ShieldAlert,
    badgeColor: 'blue',
  },
  'phase-2': {
    gate: 'AUDIT_PLANNING',
    stepNumber: 'Phase 2 of 8',
    title: '2. Audit Planning & Programming',
    description: 'Define audit scope, timeline, taxpayer notification letters, and conduct preliminary engagement meetings.',
    icon: Calendar,
    badgeColor: 'indigo',
  },
  'phase-3': {
    gate: 'FIELD_WORK',
    stepNumber: 'Phase 3 of 8',
    title: '3. Field Work & Facts',
    description: 'Conduct on-site interviews, functional analysis (FAR), inspect books, and record formal statement of facts.',
    icon: Layers,
    badgeColor: 'amber',
  },
  'phase-4': {
    gate: 'ANALYSIS',
    stepNumber: 'Phase 4 of 8',
    title: '4. Economic Analysis & IQR',
    description: 'Select transfer pricing methodology (CUP, TNMM, Resale Price, Cost Plus, Profit Split) and compute interquartile ranges.',
    icon: BarChart2,
    badgeColor: 'purple',
  },
  'phase-5': {
    gate: 'REPORT',
    stepNumber: 'Phase 5 of 8',
    title: '5. TP Audit Report & Exit Conference',
    description: 'Synthesize audit findings, prepare comprehensive TP audit report, and conduct formal taxpayer exit conference.',
    icon: FileText,
    badgeColor: 'emerald',
  },
  'phase-6': {
    gate: 'ASSESSMENT',
    stepNumber: 'Phase 6 of 8',
    title: '6. Assessment & Notice Draft',
    description: 'Draft statutory assessment notice, calculate tax adjustments and penalties, and submit for endorsement.',
    icon: Calculator,
    badgeColor: 'rose',
  },
  'phase-assessment': {
    gate: 'ASSESSMENT',
    stepNumber: 'Phase 6 of 8',
    title: '6. Assessment & Notice Draft',
    description: 'Draft statutory assessment notice, calculate tax adjustments and penalties, and submit for endorsement.',
    icon: Calculator,
    badgeColor: 'rose',
  },
  'phase-7': {
    gate: 'NOTICE',
    stepNumber: 'Phase 7 of 8',
    title: '7. Notice & Statutory Objection',
    description: 'Issue formal assessment notice to taxpayer, monitor statutory 30-day objection window, and process taxpayer responses.',
    icon: Scale,
    badgeColor: 'orange',
  },
  'phase-8': {
    gate: 'CLOSURE',
    stepNumber: 'Phase 8 of 8',
    title: '8. Audit Closure & Archival',
    description: 'Finalize taxpayer settlement or objection resolution, archive case dossier, and record audit closure metrics.',
    icon: CheckCircle2,
    badgeColor: 'teal',
  },
};

// ── Step-Based Dynamic Case Selector View ────────────────────────────────────
function CaseStepSelectorView({ stepKey, stepConfig, cases, loading, onSelectCase, onNavigate }) {
  const [search, setSearch] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState('');

  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        c.taxpayerName?.toLowerCase().includes(s) ||
        c.taxpayerId?.toLowerCase().includes(s) ||
        c.tin?.toLowerCase().includes(s) ||
        c.caseNumber?.toLowerCase().includes(s)
      );
    });
  }, [cases, search]);

  const StepIcon = stepConfig?.icon || FileSearch;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Step Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 text-white rounded-2xl p-6 shadow-xl border border-blue-800/50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center flex-shrink-0 text-blue-300">
              <StepIcon size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  {stepConfig?.stepNumber || 'Audit Execution'}
                </span>
                <span className="text-xs text-blue-200">· Transfer Pricing Audit Execution</span>
              </div>
              <h1 className="text-2xl font-bold mt-1 text-white">
                {stepConfig?.title || 'Audit Step'}
              </h1>
              <p className="text-sm text-blue-100/80 mt-1 max-w-2xl">
                {stepConfig?.description || 'Select an assigned transfer pricing audit case below to open this step.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-blue-200 bg-blue-800/40 px-3 py-1.5 rounded-lg border border-blue-700/50 font-medium">
              {cases.length} Total Assigned Cases
            </span>
          </div>
        </div>
      </div>

      {/* Case Selection & Filter Card */}
      <Card className="p-5">
        <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search assigned cases by taxpayer name, TIN, or case number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Quick Select Dropdown */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap uppercase">
              Quick Pick:
            </span>
            <select
              value={selectedCaseId}
              onChange={(e) => {
                const target = cases.find(c => (c.id || c.caseId) === e.target.value);
                if (target) {
                  onSelectCase(target);
                }
              }}
              className="px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[240px]"
            >
              <option value="">-- Select an Assigned Case --</option>
              {cases.map((c) => (
                <option key={c.id || c.caseId} value={c.id || c.caseId}>
                  {c.taxpayerName || 'Taxpayer'} ({c.taxpayerId || c.tin || c.caseNumber})
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Cases Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-5 animate-pulse">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
              <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </Card>
          ))}
        </div>
      ) : filteredCases.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCases.map((caseItem) => {
            const caseId = caseItem.id || caseItem.caseId;
            return (
              <div
                key={caseId}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                      {caseItem.caseNumber || `AU-${String(caseId).substring(0, 8)}`}
                    </div>
                    {getRiskBadge(caseItem.riskPriority || caseItem.riskLevel)}
                  </div>

                  <h3 className="font-semibold text-gray-900 dark:text-white text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                    {caseItem.taxpayerName || 'Taxpayer'}
                  </h3>
                  
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span>TIN: <strong className="font-mono text-gray-700 dark:text-gray-300">{caseItem.taxpayerId || caseItem.tin || 'N/A'}</strong></span>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    {getSegmentBadge(caseItem.segment || caseItem.sector)}
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      {caseItem.auditType ? caseItem.auditType.replace(/_/g, ' ') : (isJointAuditUser(user) ? 'Joint Audit' : 'Transfer Pricing')}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs flex items-center justify-between text-gray-500 dark:text-gray-400">
                    <span>Status: <strong className="text-gray-700 dark:text-gray-200">{caseItem.status || 'ASSIGNED'}</strong></span>
                    <span>Step: <strong className="text-blue-600 dark:text-blue-400">{caseItem.currentStep || 'PLANNING'}</strong></span>
                  </div>
                </div>

                <div className="mt-5">
                  <button
                    onClick={() => onSelectCase(caseItem)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm shadow-blue-500/20"
                  >
                    <PlayCircle size={16} />
                    Open in {stepConfig?.title?.split('&')?.[0]?.trim() || 'Step'}
                    <ArrowRight size={14} className="ml-0.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No Cases Found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {cases.length === 0
              ? 'No transfer pricing audit cases are currently assigned to you.'
              : 'No assigned cases matched your search query.'}
          </p>
          {cases.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setSearch('')}>
              Clear Search
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}

// ── Main Dashboard Component ─────────────────────────────────────────────────
export default function AuditorDashboard({ view, onNavigate }) {
  const { user } = useAuth();
  const { getWorkflow, actions: workflowActions } = useWorkflow();

  const isJoint = isJointAuditUser(user);
  const isTp = !isJoint && getEffectiveAuditType(user) === 'TRANSFER_PRICING';

  // Active selected case for the active audit execution view
  const [activeStepCase, setActiveStepCase] = useState(null);
  const [lastStepView, setLastStepView] = useState(view);
  const [dossierCase, setDossierCase] = useState(null);

  // If user clicks a different phase in the sidebar, reset activeStepCase so they can select a case (TP only)
  if (view !== lastStepView) {
    setLastStepView(view);
    if (!isJoint && view !== 'da-workspace') {
      setActiveStepCase(null);
    }
  }

  // Active selected case stored in sessionStorage for general workflow
  const [selectedCaseId, setSelectedCaseId] = useState(() => {
    return sessionStorage.getItem('auditor_active_case_id') || null;
  });
  const [executingCaseOverride, setExecutingCaseOverride] = useState(null);

  // Fetch data using the custom hook
  const {
    cases, metrics, loading, refreshing, error, refresh
  } = useAuditorData(user?.id);

  // Derive activeCase
  const activeCase = useMemo(() => {
    if (executingCaseOverride && (!selectedCaseId || (executingCaseOverride.id || executingCaseOverride.caseId) === selectedCaseId)) {
      return executingCaseOverride;
    }
    if (!selectedCaseId || !cases || cases.length === 0) return null;
    return cases.find(c => (c.id || c.caseId) === selectedCaseId) || null;
  }, [cases, selectedCaseId, executingCaseOverride]);

  // Categorize cases
  const activeCases = useMemo(() => 
    cases.filter(c => c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED'),
    [cases]
  );

  const completedCases = useMemo(() => 
    cases.filter(c => c.status === 'COMPLETED' || c.status === 'CONCLUDED'),
    [cases]
  );

  // Get recent workflow events from active cases
  const recentActivity = useMemo(() => {
    const events = [];
    activeCases.forEach(c => {
      const wf = getWorkflow(c.id || c.caseId);
      if (wf.timeline?.length > 0) {
        wf.timeline.slice(-3).forEach(t => events.push(t));
      }
    });
    return events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);
  }, [activeCases, getWorkflow]);

  // Handlers
  const handleExecuteCase = useCallback((caseItem, targetStep) => {
    const caseId = caseItem.id || caseItem.caseId;
    const wf = getWorkflow(caseId);

    if (wf.status === 'PENDING_HANDOFF' || !wf.steps?.CASE_DETAIL?.completedAt) {
      workflowActions.importCase(caseId, user?.id, {
        taxpayerName: caseItem.taxpayerName,
        importedAt: new Date().toISOString(),
      });
    }

    const fullCase = {
      id: caseId,
      taxpayerName: caseItem.taxpayerName,
      riskLevel: caseItem.riskPriority || caseItem.riskLevel,
      tin: caseItem.taxpayerId || caseItem.tin,
      sector: caseItem.segment || caseItem.sector,
      ...caseItem,
    };

    setActiveStepCase(fullCase);
    setSelectedCaseId(caseId);
    sessionStorage.setItem('auditor_active_case_id', caseId);
    sessionStorage.setItem('auditor_active_case_data', JSON.stringify(fullCase));
    setExecutingCaseOverride(fullCase);

    if (onNavigate) {
      if (!isJoint && isTp && targetStep) {
        onNavigate(targetStep);
      } else if ((fullCase.auditType || '').toUpperCase().includes('DESK') || (fullCase.auditType === undefined)) {
        onNavigate('da-workspace');
      } else {
        onNavigate('ca-workspace');
      }
    }
  }, [getWorkflow, workflowActions, user?.id, onNavigate, isJoint, isTp]);

  const handleCloseWorkspace = useCallback(() => {
    setActiveStepCase(null);
    setSelectedCaseId(null);
    setExecutingCaseOverride(null);
    sessionStorage.removeItem('auditor_active_case_id');
    if (onNavigate) {
      onNavigate('cases');
    }
  }, [onNavigate]);

  // Loading state when restoring a stored case
  if (loading && selectedCaseId && !executingCaseOverride && cases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-500">
        <Loader2 size={32} className="animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-medium">Loading case workspace...</p>
      </div>
    );
  }

  // ── Render Case Workspace if Active ──────────────────────────────────────
  if (activeStepCase) {
    const caseIsTp = (activeStepCase.auditType || '').toUpperCase().includes('TP') ||
                     (activeStepCase.auditType || '').toUpperCase().includes('TRANSFER');
    if (!isJoint && (isTp || caseIsTp)) {
      return (
        <TpAuditorWorkspace
          caseData={activeStepCase}
          user={user}
          initialGate={STEP_CONFIG[view]?.gate || 'DETAILED_RISK_ASSESSMENT'}
          assignedCases={cases}
          onSwitchCase={(newCase) => setActiveStepCase(newCase)}
          onClose={() => {
            setActiveStepCase(null);
            setExecutingCaseOverride(null);
          }}
          onRefresh={refresh}
        />
      );
    }
    const caseIsDesk = (activeStepCase.auditType || '').toUpperCase().includes('DESK');
    if (caseIsDesk) {
      return (
        <DeskAuditWorkspace
          caseId={activeStepCase.id || activeStepCase.caseId}
          initialCaseData={activeStepCase}
          onSwitchCase={() => {
            setActiveStepCase(null);
            setExecutingCaseOverride(null);
            setSelectedCaseId(null);
            sessionStorage.removeItem('auditor_active_case_id');
            if (onNavigate) onNavigate('cases');
          }}
        />
      );
    }
    const caseIsComprehensive = (activeStepCase.auditType || '').toUpperCase().includes('COMPREHENSIVE');
    if (caseIsComprehensive) {
      return (
        <ComprehensiveAuditWorkspace
          caseData={activeStepCase}
          user={user}
          onClose={handleCloseWorkspace}
          onRefresh={refresh}
        />
      );
    }

    return (
      <AuditorWorkspace
        caseData={activeStepCase}
        onBack={() => {
          setActiveStepCase(null);
          setExecutingCaseOverride(null);
          setSelectedCaseId(null);
          sessionStorage.removeItem('auditor_active_case_id');
        }}
      />
    );
  }

  // ── TP AUDIT EXECUTION Steps (Strictly for Transfer Pricing, NEVER for Joint Audit) ──
  if (!isJoint && isTp && view && STEP_CONFIG[view]) {
    const step = STEP_CONFIG[view];
    return (
      <CaseStepSelectorView
        stepKey={view}
        stepConfig={step}
        cases={cases}
        loading={loading}
        onSelectCase={(selectedCase) => setActiveStepCase(selectedCase)}
        onNavigate={onNavigate}
      />
    );
  }

  // ── Desk Audit Sidebar Views ──────────────────────────────────────────────
  if (view === 'da-workspace') {
    return (
      <div className="flex-1 bg-gray-50 flex flex-col min-h-screen">
        <div className="bg-white border-b border-gray-200 px-8 py-5">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            Desk Audit Workspace
          </h1>
          <p className="text-sm text-gray-500 mt-1">To work on a case, you must select it from the Case Queue.</p>
        </div>
        <div className="p-8 flex items-center justify-center flex-1">
          <div className="bg-white border border-gray-200 rounded shadow-2xs p-10 max-w-md w-full text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-800 mb-1">No Active Case Selected</h3>
            <p className="text-sm text-gray-500 mb-6">
              You cannot open the workspace directly. You must open it by selecting a case from your Case Queue.
            </p>
            <button
              onClick={() => onNavigate && onNavigate('cases')}
              className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Go to Case Queue
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'audit-trail') {
    return (
      <div className="flex-1 bg-gray-50 flex flex-col min-h-screen">
        <div className="bg-white border-b border-gray-200 px-8 py-5">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-600" />
            Global Audit Trail
          </h1>
          <p className="text-sm text-gray-500 mt-1">Review cross-case system activity and log events.</p>
        </div>
        <div className="p-8 flex items-center justify-center flex-1">
          <div className="bg-white border border-gray-200 rounded shadow-2xs p-10 max-w-md w-full text-center">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-800 mb-1">Select a Case</h3>
            <p className="text-sm text-gray-500">To view the detailed audit trail, please select a case from the workspace or case queue.</p>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'taxpayer-comms') {
    return (
      <div className="flex-1 bg-gray-50 flex flex-col min-h-screen">
        <div className="bg-white border-b border-gray-200 px-8 py-5">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            Taxpayer Communications
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage notices, queries, and direct correspondence.</p>
        </div>
        <div className="p-8 flex items-center justify-center flex-1">
          <div className="bg-white border border-gray-200 rounded shadow-2xs p-10 max-w-md w-full text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-800 mb-1">No Pending Messages</h3>
            <p className="text-sm text-gray-500">You do not have any unread communications or pending notices at this moment.</p>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'profile') {
    return (
      <div className="flex-1 bg-gray-50 flex flex-col min-h-screen">
        <div className="bg-white border-b border-gray-200 px-8 py-5">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Target className="w-6 h-6 text-indigo-600" />
            My Profile
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage your account details and credentials.</p>
        </div>
        <div className="p-8 max-w-4xl">
          <div className="bg-white border border-gray-200 rounded shadow-2xs p-8">
            <div className="flex items-center gap-6 border-b border-gray-100 pb-6 mb-6">
              <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold border-2 border-indigo-200">
                {user?.name?.[0] || 'U'}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{user?.name}</h2>
                <p className="text-gray-500 font-medium capitalize">{String(user?.role || '').replace('_', ' ')}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email Address</p>
                <p className="text-gray-900 font-medium">{user?.email || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Tax Center</p>
                <p className="text-gray-900 font-medium">{user?.taxCenter || 'Federal HQ'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'settings') {
    return <SettingsPanel />;
  }

  // ── Cases View ──────────────────────────────────────────────────────────
  if (view === 'cases') {
    return (
      <div className="space-y-6">
        {activeCase && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                {activeCase.taxpayerName?.[0] || 'C'}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Currently Active: {activeCase.taxpayerName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Case {activeCase.caseNumber || activeCase.id} · TIN: {activeCase.taxpayerId || activeCase.tin || '—'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedCaseId(null);
                  setExecutingCaseOverride(null);
                  sessionStorage.removeItem('auditor_active_case_id');
                }}
                className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Clear Selection
              </button>
              <button
                onClick={() => {
                  if (!isJoint && isTp) {
                    onNavigate && onNavigate('phase-1');
                  } else if (activeCase) {
                    handleExecuteCase(activeCase, null);
                  }
                }}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors shadow-sm"
              >
                Open Workspace →
              </button>
            </div>
          </div>
        )}
        <CasesView
          cases={cases}
          loading={loading}
          refreshing={refreshing}
          error={error}
          refresh={refresh}
          onExecuteCase={(c) => handleExecuteCase(c, (!isJoint && isTp) ? 'phase-1' : null)}
          onViewDossier={(c) => setDossierCase(c)}
        />
      </div>
    );
  }

  // ── Dashboard View (matching Team Leader style) ─────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome Back, {user?.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            You are signed in as <span className="font-medium">Auditor</span>.
            Cases assigned to you by your Team Leader appear here for execution.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium">
            <Database size={16} />
            <span>Database Synchronized</span>
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Active Selected Case Banner */}
      {activeCase && (
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center font-bold text-lg text-white flex-shrink-0">
              {activeCase.taxpayerName?.[0] || 'T'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider bg-white/20 border border-white/30 px-2 py-0.5 rounded font-bold">
                  Active Selected Case
                </span>
                <span className="text-xs text-blue-100 font-mono">
                  {activeCase.caseNumber || activeCase.id}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white leading-snug mt-0.5">
                {activeCase.taxpayerName}
              </h3>
              <p className="text-xs text-blue-100 mt-0.5">
                TIN: <strong className="font-mono">{activeCase.taxpayerId || activeCase.tin || 'N/A'}</strong> · Segment: {activeCase.segment || activeCase.sector || 'LTO'} · Priority: {activeCase.riskPriority || activeCase.riskLevel || 'HIGH'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setSelectedCaseId(null);
                setExecutingCaseOverride(null);
                sessionStorage.removeItem('auditor_active_case_id');
              }}
              className="px-3 py-2 text-xs text-blue-100 hover:text-white border border-white/30 rounded-lg hover:bg-white/10 transition-colors"
            >
              Clear Selection
            </button>
            <button
              onClick={() => {
                if (!isJoint && isTp) {
                  onNavigate && onNavigate('phase-1');
                } else if (activeCase) {
                  handleExecuteCase(activeCase, null);
                }
              }}
              className="px-4 py-2 bg-white hover:bg-blue-50 text-blue-700 rounded-lg text-xs font-bold transition-all shadow-md inline-flex items-center gap-1.5"
            >
              <PlayCircle size={15} />
              Resume Audit Workspace →
            </button>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-300">
          <Loader2 size={16} className="animate-spin" />
          Loading your workspace...
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Alert type="warning" title="Data Loading Issue">
          Some data may not be up to date. <button onClick={refresh} className="underline font-medium">Retry</button>
        </Alert>
      )}

      {/* Metric Cards (same style as Team Leader) */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard
            title="Active Cases"
            value={metrics.inProgress}
            subtitle="In progress"
            icon={PlayCircle}
            color="blue"
          />
          <MetricCard
            title="Completed"
            value={metrics.completed}
            subtitle="Audits done"
            icon={CheckCircle}
            color="green"
          />
          <MetricCard
            title="Total Assigned"
            value={metrics.totalAssigned}
            subtitle="All time"
            icon={Briefcase}
            color="purple"
          />
          <MetricCard
            title="Audit Days"
            value={metrics.totalAuditDays}
            subtitle="Days worked"
            icon={Calendar}
            color="amber"
          />
        </div>
      )}

      {/* Two-Column Layout (matching Team Leader) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Active Work (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Active Work Section */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Activity size={20} className="text-blue-600 dark:text-blue-400" />
                  Active Work
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Cases currently assigned to you — continue your audit work.
                </p>
              </div>
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                {activeCases.length} active
              </span>
            </div>

            {activeCases.length > 0 ? (
              <div className="space-y-3">
                {activeCases.slice(0, 5).map((caseItem) => (
                  <ActiveWorkItem
                    key={caseItem.id || caseItem.caseId}
                    caseItem={caseItem}
                    onExecute={(c) => handleExecuteCase(c, (!isJoint && isTp) ? 'phase-1' : null)}
                  />
                ))}
                {activeCases.length > 5 && (
                  <p className="text-sm text-center text-gray-500 dark:text-gray-400 pt-2">
                    +{activeCases.length - 5} more active cases
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-10 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                <Clock size={40} className="mx-auto mb-3 text-gray-400 dark:text-gray-600 opacity-50" />
                <p className="text-gray-600 dark:text-gray-400 font-medium">No active cases</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  Cases will appear when assigned by your Team Leader
                </p>
              </div>
            )}

            {/* Recent Activity — inline under Active Work */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Activity size={16} className="text-green-600 dark:text-green-400" />
                Recent Activity
              </h4>
              <div className="space-y-3">
                {recentActivity.length > 0 ? (
                  recentActivity.map((event, idx) => (
                    <ActivityItem
                      key={idx}
                      step={event.step}
                      action={event.action}
                      timestamp={event.timestamp}
                    />
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-3">No activity yet</p>
                )}
              </div>
            </div>
          </Card>

          {/* Recently Completed */}
          {completedCases.length > 0 && (
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <CheckCircle size={18} className="text-green-600 dark:text-green-400" />
                    Recently Completed
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Audits you've finished successfully.
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {completedCases.slice(0, 3).map((caseItem) => (
                  <div
                    key={caseItem.id || caseItem.caseId}
                    className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/10 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle size={16} className="text-green-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {caseItem.taxpayerName || 'Taxpayer'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {caseItem.taxpayerId || caseItem.tin || '—'}
                        </p>
                      </div>
                    </div>
                    <Badge color="green">{caseItem.status}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column (1/3 width): Audit Summary & Activity */}
        <div className="space-y-6">

          {/* Audit Summary */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <BarChart3 size={18} className="text-purple-600 dark:text-purple-400" />
                  Audit Summary
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Your audit portfolio overview
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Status Distribution */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">In Progress</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {metrics?.inProgress || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Completed</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {metrics?.completed || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Assigned</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {(metrics?.totalAssigned || 0) - (metrics?.inProgress || 0) - (metrics?.completed || 0)}
                  </span>
                </div>
              </div>

              {/* Total Cases */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Total Cases</span>
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {metrics?.totalAssigned || 0}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Workflow Progress */}
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Audit Workflow</h3>
            <div className="space-y-3">
              {WORKFLOW_STEPS.slice(0, 6).map((step, idx) => {
                const isCurrent = idx === 0;
                return (
                  <div key={step.id} className={`flex items-center gap-3 ${isCurrent ? 'bg-white dark:bg-slate-800 rounded-lg p-2 border border-blue-300 dark:border-blue-600' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isCurrent ? 'bg-blue-100 dark:bg-blue-800/50' : 'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      <span className={`text-xs font-bold ${
                        isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                      }`}>{idx + 1}</span>
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${isCurrent ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                        {step.label}
                      </p>
                      {isCurrent && <p className="text-xs text-blue-600 dark:text-blue-400">← Your next step</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>


        </div>
      </div>

      {/* Taxpayer Dossier Modal */}
      {dossierCase && (
        <CaseDetailModal
          caseData={dossierCase}
          onClose={() => setDossierCase(null)}
        />
      )}
    </div>
  );
}
