/**
 * WorkflowContext
 * Manages the state of a case as it progresses through the 11-step audit execution workflow.
 *
 * Strategy: dispatch to local state immediately for instant UI, then fire the
 * backend API call in the background to persist.  Errors are logged but do not
 * block the user — the local state always remains authoritative for the session.
 */

import React, { createContext, useContext, useReducer, useCallback, useState } from 'react';
import { workflowAPI } from '../services/workflowApi';

const WorkflowContext = createContext(null);

// ── Helpers ────────────────────────────────────────────────────────────────

/** Fire-and-forget API call with error logging */
function fireAPI(label, promise) {
  promise.catch((err) => {
    console.warn(`[WorkflowAPI] ${label} failed:`, err.message || err);
  });
}

// ── Initial state factory ──────────────────────────────────────────────────

function createInitialCaseWorkflow(caseId) {
  return {
    caseId,
    currentStep: 'CASE_DETAIL',
    status: 'IN_EXECUTION',
    steps: {
      CASE_DETAIL:         { status: 'pending', completedAt: null, data: null },
      PLANNING:            { status: 'pending', completedAt: null, data: null },
      ENTRY_CONFERENCE:    { status: 'pending', completedAt: null, data: null },
      INFO_REQUEST:        { status: 'pending', completedAt: null, data: null },
      CAAT_ANALYSIS:       { status: 'pending', completedAt: null, data: null },
      AUDIT_TESTING:       { status: 'pending', completedAt: null, data: null },
      FINDINGS:            { status: 'pending', completedAt: null, data: null },
      TAXPAYER_RESPONSE:   { status: 'pending', completedAt: null, data: null },
      CONCLUSION:          { status: 'pending', completedAt: null, data: null },
    },
    assignment: null,
    plan: null,
    conference: null,
    documentRequests: [],
    documents: [],
    caatResults: null,
    anomalies: [],
    workingPapers: [],
    findings: [],
    conclusions: [],
    timeline: [],
  };
}

// ── Reducer (unchanged — all state transitions stay local + fast) ──────────

function workflowReducer(state, action) {
  switch (action.type) {
    case 'INIT_WORKFLOW':
      return {
        ...state,
        [action.payload.caseId]: state[action.payload.caseId] || createInitialCaseWorkflow(action.payload.caseId),
      };

    case 'LOAD_WORKFLOW': {
      const { caseId, serverData } = action.payload;
      // Merge server state into local shape so UI is hydrated from DB
      const base = createInitialCaseWorkflow(caseId);
      if (!serverData) return state;
      return {
        ...state,
        [caseId]: {
          ...base,
          ...serverData,
          // Ensure nested objects exist
          steps: serverData.steps || base.steps,
          documentRequests: serverData.documentRequests || base.documentRequests,
          documents: serverData.documents || base.documents,
          anomalies: serverData.anomalies || base.anomalies,
          workingPapers: serverData.workingPapers || base.workingPapers,
          findings: serverData.findings || base.findings,
          conclusions: serverData.conclusions || base.conclusions,
          timeline: serverData.timeline || base.timeline,
        },
      };
    }

    case 'IMPORT_CASE':
      return {
        ...state,
        [action.payload.caseId]: {
          ...createInitialCaseWorkflow(action.payload.caseId),
          status: 'IN_EXECUTION',
          currentStep: 'ASSIGNMENT',
          steps: {
            ...createInitialCaseWorkflow(action.payload.caseId).steps,
            CASE_DETAIL: { status: 'completed', completedAt: new Date().toISOString(), data: action.payload.handoffData },
            ASSIGNMENT: { status: 'in_progress', completedAt: null, data: null },
          },
          timeline: [
            { step: 'CASE_DETAIL', action: 'Case reviewed for audit execution', timestamp: new Date().toISOString(), actor: action.payload.actorId },
            { step: 'ASSIGNMENT', action: 'Ready for Team Leader to assign an auditor', timestamp: new Date().toISOString(), actor: action.payload.actorId },
          ],
        },
      };

    case 'ASSIGN_AUDITOR':
      return {
        ...state,
        [action.payload.caseId]: {
          ...state[action.payload.caseId],
          assignment: action.payload.assignment,
          status: 'PLANNING',
          currentStep: 'PLANNING',
          steps: {
            ...state[action.payload.caseId]?.steps,
            CASE_DETAIL: { status: 'completed', completedAt: new Date().toISOString(), data: action.payload.assignment },
          },
          timeline: [...(state[action.payload.caseId]?.timeline || []),
            { step: 'CASE_DETAIL', action: `Case reviewed, assigned to ${action.payload.assignment.auditorName}`, timestamp: new Date().toISOString(), actor: action.payload.actorId }],
        },
      };

    case 'SUBMIT_PLAN':
      return {
        ...state,
        [action.payload.caseId]: {
          ...state[action.payload.caseId],
          plan: action.payload.plan,
          steps: {
            ...state[action.payload.caseId]?.steps,
            PLANNING: { status: 'in_review', completedAt: null, data: action.payload.plan },
          },
          timeline: [...(state[action.payload.caseId]?.timeline || []),
            { step: 'PLANNING', action: 'Audit plan submitted for review', timestamp: new Date().toISOString(), actor: action.payload.actorId }],
        },
      };

    case 'APPROVE_PLAN':
      return {
        ...state,
        [action.payload.caseId]: {
          ...state[action.payload.caseId],
          status: 'ENTRY_CONFERENCE',
          currentStep: 'ENTRY_CONFERENCE',
          steps: {
            ...state[action.payload.caseId]?.steps,
            PLANNING: { status: 'completed', completedAt: new Date().toISOString(), data: state[action.payload.caseId]?.plan },
          },
          timeline: [...(state[action.payload.caseId]?.timeline || []),
            { step: 'PLANNING', action: 'Plan approved', timestamp: new Date().toISOString(), actor: action.payload.actorId }],
        },
      };

    case 'REVISION_PLAN':
      return {
        ...state,
        [action.payload.caseId]: {
          ...state[action.payload.caseId],
          status: 'PLANNING_REVISION',
          steps: {
            ...state[action.payload.caseId]?.steps,
            PLANNING: { status: 'revision', completedAt: null, data: { ...state[action.payload.caseId]?.plan, revisionNotes: action.payload.revisionNotes } },
          },
          timeline: [...(state[action.payload.caseId]?.timeline || []),
            { step: 'PLANNING', action: `Plan sent back: ${action.payload.revisionNotes}`, timestamp: new Date().toISOString(), actor: action.payload.actorId }],
        },
      };

    case 'SCHEDULE_CONFERENCE':
      return {
        ...state,
        [action.payload.caseId]: {
          ...state[action.payload.caseId],
          conference: action.payload.conference,
          steps: {
            ...state[action.payload.caseId]?.steps,
            ENTRY_CONFERENCE: { status: 'in_progress', completedAt: null, data: action.payload.conference },
          },
          timeline: [...(state[action.payload.caseId]?.timeline || []),
            { step: 'ENTRY_CONFERENCE', action: 'Conference scheduled', timestamp: new Date().toISOString(), actor: action.payload.actorId }],
        },
      };

    case 'RECORD_MINUTES':
      return {
        ...state,
        [action.payload.caseId]: {
          ...state[action.payload.caseId],
          conference: { ...state[action.payload.caseId]?.conference, minutes: action.payload.minutes, status: 'COMPLETED' },
          steps: {
            ...state[action.payload.caseId]?.steps,
            ENTRY_CONFERENCE: { status: 'completed', completedAt: new Date().toISOString(), data: { ...state[action.payload.caseId]?.conference, minutes: action.payload.minutes } },
          },
          status: 'INFO_GATHERING',
          currentStep: 'INFO_REQUEST',
          timeline: [...(state[action.payload.caseId]?.timeline || []),
            { step: 'ENTRY_CONFERENCE', action: 'Conference minutes recorded', timestamp: new Date().toISOString(), actor: action.payload.actorId }],
        },
      };

    case 'SKIP_CONFERENCE':
      return {
        ...state,
        [action.payload.caseId]: {
          ...state[action.payload.caseId],
          conference: { status: 'SKIPPED', minutes: action.payload.reason, skippedAt: new Date().toISOString() },
          steps: {
            ...state[action.payload.caseId]?.steps,
            ENTRY_CONFERENCE: { status: 'completed', completedAt: new Date().toISOString(), data: { status: 'SKIPPED', reason: action.payload.reason } },
          },
          status: 'INFO_GATHERING',
          currentStep: 'INFO_REQUEST',
          timeline: [...(state[action.payload.caseId]?.timeline || []),
            { step: 'ENTRY_CONFERENCE', action: `Conference waived: ${action.payload.reason}`, timestamp: new Date().toISOString(), actor: action.payload.actorId }],
        },
      };

    case 'APPROVE_CONFERENCE':
      return {
        ...state,
        [action.payload.caseId]: {
          ...state[action.payload.caseId],
          conference: { ...state[action.payload.caseId]?.conference, status: 'APPROVED' },
          steps: {
            ...state[action.payload.caseId]?.steps,
            ENTRY_CONFERENCE: { status: 'completed', completedAt: new Date().toISOString() },
          },
          timeline: [...(state[action.payload.caseId]?.timeline || []),
            { step: 'ENTRY_CONFERENCE', action: 'Conference approved by Team Leader', timestamp: new Date().toISOString(), actor: action.payload.actorId }],
        },
      };

    case 'CREATE_DOC_REQUEST':
      return {
        ...state,
        [action.payload.caseId]: {
          ...state[action.payload.caseId],
          documentRequests: [...(state[action.payload.caseId]?.documentRequests || []), action.payload.request],
          status: 'INFO_GATHERING',
          currentStep: 'INFO_REQUEST',
          steps: {
            ...state[action.payload.caseId]?.steps,
            INFO_REQUEST: { status: 'in_progress', completedAt: null },
          },
          timeline: [...(state[action.payload.caseId]?.timeline || []),
            { step: 'INFO_REQUEST', action: `Document request sent: ${action.payload.request.title}`, timestamp: new Date().toISOString(), actor: action.payload.actorId }],
        },
      };

    case 'UPLOAD_DOCUMENT':
      return {
        ...state,
        [action.payload.caseId]: {
          ...state[action.payload.caseId],
          documents: [...(state[action.payload.caseId]?.documents || []), action.payload.document],
          timeline: [...(state[action.payload.caseId]?.timeline || []),
            { step: 'INFO_REQUEST', action: `Document recorded: ${action.payload.document.fileName || action.payload.document.title || 'Attachment'}`, timestamp: new Date().toISOString(), actor: action.payload.actorId }],
        },
      };

    case 'COMPLETE_INFO_REQUEST':
      return {
        ...state,
        [action.payload.caseId]: {
          ...state[action.payload.caseId],
          status: 'CAAT_ANALYSIS',
          currentStep: 'CAAT_ANALYSIS',
          steps: {
            ...state[action.payload.caseId]?.steps,
            INFO_REQUEST: { status: 'completed', completedAt: new Date().toISOString() },
            CAAT_ANALYSIS: { status: 'in_progress', completedAt: null },
          },
          timeline: [...(state[action.payload.caseId]?.timeline || []),
            { step: 'INFO_REQUEST', action: 'Information gathering completed — moving to CAAT analysis', timestamp: new Date().toISOString(), actor: action.payload.actorId }],
        },
      };

    case 'VERIFY_DOCUMENT':
      return {
        ...state,
        [action.payload.caseId]: {
          ...state[action.payload.caseId],
          documents: (state[action.payload.caseId]?.documents || []).map(d =>
            d.id === action.payload.documentId ? { ...d, status: 'VERIFIED' } : d
          ),
        },
      };

    case 'RUN_CAAT':
      return {
        ...state,
        [action.payload.caseId]: {
          ...state[action.payload.caseId],
          caatResults: action.payload.results,
          anomalies: action.payload.results?.anomalies || [],
          status: 'CAAT_ANALYSIS',
          currentStep: 'CAAT_ANALYSIS',
          steps: {
            ...state[action.payload.caseId]?.steps,
            INFO_REQUEST: { ...state[action.payload.caseId]?.steps?.INFO_REQUEST, status: 'completed', completedAt: state[action.payload.caseId]?.steps?.INFO_REQUEST?.completedAt || new Date().toISOString() },
            CAAT_ANALYSIS: { status: 'in_progress', completedAt: null },
          },
          timeline: [...(state[action.payload.caseId]?.timeline || []),
            { step: 'CAAT_ANALYSIS', action: `CAAT analysis completed — ${(action.payload.results?.anomalies || []).length} anomalies found`, timestamp: new Date().toISOString(), actor: action.payload.actorId }],
        },
      };

    case 'VALIDATE_ANOMALY':
      return {
        ...state,
        [action.payload.caseId]: {
          ...state[action.payload.caseId],
          anomalies: (state[action.payload.caseId]?.anomalies || []).map(a =>
            a.id === action.payload.anomalyId
              ? {
                  ...a,
                  decision: action.payload.decision,
                  validationStatus: action.payload.decision,
                  notes: action.payload.notes,
                  validationNotes: action.payload.notes,
                  amendedAmount: action.payload.amendedAmount !== undefined && action.payload.amendedAmount !== null
                    ? Number(action.payload.amendedAmount)
                    : (action.payload.decision === 'REJECTED' ? 0 : (a.originalAmount ?? a.amount ?? 0)),
                  validatedAt: new Date().toISOString(),
                }
              : a
          ),
        },
      };

    case 'SET_FINDINGS':
      return {
        ...state,
        [action.payload.caseId]: {
          ...state[action.payload.caseId],
          findings: action.payload.findings || [],
        },
      };

    case 'COMPLETE_CAAT':
      return {
        ...state,
        [action.payload.caseId]: {
          ...state[action.payload.caseId],
          status: 'AUDIT_TESTING',
          currentStep: 'AUDIT_TESTING',
          steps: {
            ...state[action.payload.caseId]?.steps,
            CAAT_ANALYSIS: { status: 'completed', completedAt: new Date().toISOString() },
            AUDIT_TESTING: { status: 'in_progress', completedAt: null },
          },
          timeline: [...(state[action.payload.caseId]?.timeline || []),
            { step: 'CAAT_ANALYSIS', action: 'CAAT analysis complete — moving to manual testing', timestamp: new Date().toISOString(), actor: action.payload.actorId }],
        },
      };

    case 'ADD_WORKING_PAPER':
      return {
        ...state,
        [action.payload.caseId]: {
          ...state[action.payload.caseId],
          workingPapers: [...(state[action.payload.caseId]?.workingPapers || []), action.payload.paper],
        },
      };

    case 'COMPLETE_TESTING':
      return {
        ...state,
        [action.payload.caseId]: {
          ...state[action.payload.caseId],
          status: 'FINDINGS',
          currentStep: 'FINDINGS',
          steps: {
            ...state[action.payload.caseId]?.steps,
            AUDIT_TESTING: { status: 'completed', completedAt: new Date().toISOString() },
            FINDINGS: { status: 'in_progress', completedAt: null },
          },
          timeline: [...(state[action.payload.caseId]?.timeline || []),
            { step: 'AUDIT_TESTING', action: 'Audit testing complete — drafting findings', timestamp: new Date().toISOString(), actor: action.payload.actorId }],
        },
      };

    case 'ADD_FINDING':
      return {
        ...state,
        [action.payload.caseId]: {
          ...state[action.payload.caseId],
          findings: [...(state[action.payload.caseId]?.findings || []), action.payload.finding],
        },
      };

    case 'SUBMIT_FINDINGS':
      return {
        ...state,
        [action.payload.caseId]: {
          ...state[action.payload.caseId],
          findings: (state[action.payload.caseId]?.findings || []).map(f => ({ ...f, status: 'SUBMITTED' })),
          timeline: [...(state[action.payload.caseId]?.timeline || []),
            { step: 'FINDINGS', action: `${(state[action.payload.caseId]?.findings || []).length} findings submitted for TL approval`, timestamp: new Date().toISOString(), actor: action.payload.actorId }],
        },
      };

    case 'APPROVE_FINDINGS':
      return {
        ...state,
        [action.payload.caseId]: {
          ...state[action.payload.caseId],
          status: 'TAXPAYER_RESPONSE',
          currentStep: 'TAXPAYER_RESPONSE',
          findings: (state[action.payload.caseId]?.findings || []).map(f => ({ ...f, status: 'APPROVED' })),
          steps: {
            ...state[action.payload.caseId]?.steps,
            FINDINGS: { status: 'completed', completedAt: new Date().toISOString() },
            TAXPAYER_RESPONSE: { status: 'in_progress', completedAt: null },
          },
          timeline: [...(state[action.payload.caseId]?.timeline || []),
            { step: 'FINDINGS', action: 'Findings approved — sent to taxpayer', timestamp: new Date().toISOString(), actor: action.payload.actorId }],
        },
      };

    case 'TAXPAYER_RESPOND':
      return {
        ...state,
        [action.payload.caseId]: {
          ...state[action.payload.caseId],
          findings: (state[action.payload.caseId]?.findings || []).map(f =>
            f.id === action.payload.findingId ? { ...f, taxpayerResponse: action.payload.response } : f
          ),
        },
      };

    case 'START_CONCLUSION':
      return {
        ...state,
        [action.payload.caseId]: {
          ...state[action.payload.caseId],
          status: 'CONCLUSION',
          currentStep: 'CONCLUSION',
          steps: {
            ...state[action.payload.caseId]?.steps,
            TAXPAYER_RESPONSE: { status: 'completed', completedAt: new Date().toISOString() },
            CONCLUSION: { status: 'in_progress', completedAt: null },
          },
          timeline: [...(state[action.payload.caseId]?.timeline || []),
            { step: 'TAXPAYER_RESPONSE', action: 'Taxpayer response period ended — starting conclusions', timestamp: new Date().toISOString(), actor: action.payload.actorId }],
        },
      };

    case 'ADD_CONCLUSION':
      return {
        ...state,
        [action.payload.caseId]: {
          ...state[action.payload.caseId],
          conclusions: [...(state[action.payload.caseId]?.conclusions || []), action.payload.conclusion],
        },
      };

    case 'CONCLUDE_CASE':
      return {
        ...state,
        [action.payload.caseId]: {
          ...state[action.payload.caseId],
          status: 'CONCLUDED',
          steps: {
            ...state[action.payload.caseId]?.steps,
            CONCLUSION: { status: 'completed', completedAt: new Date().toISOString() },
          },
          timeline: [...(state[action.payload.caseId]?.timeline || []),
            { step: 'CONCLUSION', action: 'Case concluded and locked', timestamp: new Date().toISOString(), actor: action.payload.actorId }],
        },
      };

    default:
      return state;
  }
}

// ── Provider ───────────────────────────────────────────────────────────────

export function WorkflowProvider({ children }) {
  const [caseWorkflows, dispatch] = useReducer(workflowReducer, {});
  const [selectedCaseId, setSelectedCaseId] = useState(null);

  const getWorkflow = useCallback((caseId) => {
    return caseWorkflows[caseId] || createInitialCaseWorkflow(caseId);
  }, [caseWorkflows]);

  const getStepProgress = useCallback((caseId) => {
    const wf = caseWorkflows[caseId];
    if (!wf) return { current: 0, total: 11, percent: 0 };
    const completedSteps = Object.values(wf.steps).filter(s => s.status === 'completed').length;
    return { current: completedSteps, total: 11, percent: Math.round((completedSteps / 11) * 100) };
  }, [caseWorkflows]);

  // ── Actions: local dispatch + backend API ────────────────────────────────

  const actions = {

    // ─── Hydrate from backend ────────────────────────────────────────────
    loadWorkflow: useCallback(async (caseId) => {
      try {
        const raw = await workflowAPI.getCaseWorkflow(caseId);
        // Backend wraps response in { data: {...}, status: 'SUCCESS' } — unwrap
        const data = raw?.data || raw;
        // Backend returns a different step-key scheme; map to local keys
        const backendSteps = data.steps || {};
        const mapBackendStep = (backendKey, frontendKey) => {
          const s = backendSteps[backendKey];
          if (!s) return null;
          return {
            status: s.completed ? 'completed' : 'pending',
            completedAt: s.completed ? new Date().toISOString() : null,
            data: null,
          };
        };

        // Derive currentStep from which steps are completed
        const stepOrder = ['CASE_DETAIL', 'PLANNING', 'ENTRY_CONFERENCE', 'INFO_REQUEST', 'CAAT_ANALYSIS', 'AUDIT_TESTING', 'FINDINGS', 'TAXPAYER_RESPONSE', 'CONCLUSION'];
        const backendKeyMap = {
          CASE_DETAIL: 'HANDOFF',
          PLANNING: 'PLANNING',
          ENTRY_CONFERENCE: 'CONFERENCE',
          INFO_REQUEST: 'INFO_REQUEST',
          CAAT_ANALYSIS: 'CAAT',
          AUDIT_TESTING: 'TESTING',
          FINDINGS: 'FINDINGS',
          TAXPAYER_RESPONSE: 'TAXPAYER_RESPONSE',
          CONCLUSION: 'CONCLUSION',
        };

        const mergedSteps = {};
        let currentStep = 'CASE_DETAIL';
        for (const stepId of stepOrder) {
          const mapped = mapBackendStep(backendKeyMap[stepId], stepId);
          if (mapped) {
            mergedSteps[stepId] = mapped;
          }
          if (mapped?.status === 'completed') {
            const idx = stepOrder.indexOf(stepId);
            currentStep = idx < stepOrder.length - 1 ? stepOrder[idx + 1] : stepId;
          }
        }

        const hydratedAnomalies = (data.anomalies || []).map(a => ({
          ...a,
          decision: a.validationStatus && a.validationStatus !== 'PENDING' ? a.validationStatus : (a.decision || null),
          notes: a.validationNotes || a.notes || '',
          amount: Number(a.originalAmount ?? a.expectedAmount ?? a.amount ?? 0),
          originalAmount: Number(a.originalAmount ?? a.expectedAmount ?? a.amount ?? 0),
          amendedAmount: a.amendedAmount !== null && a.amendedAmount !== undefined ? Number(a.amendedAmount) : Number(a.originalAmount ?? a.amount ?? 0),
        }));

        const serverData = {
          caseId,
          currentStep: currentStep,
          status: data.status || 'IN_EXECUTION',
          steps: Object.keys(mergedSteps).length > 0 ? mergedSteps : undefined,
          assignment: data.assignedAuditorId ? { auditorId: data.assignedAuditorId } : null,
          plan: data.plan || null,
          conference: data.conference || null,
          documentRequests: data.documentRequests || [],
          documents: data.documents || [],
          anomalies: hydratedAnomalies,
          caatResults: hydratedAnomalies.length > 0 ? {
            anomalies: hydratedAnomalies,
            completedAt: hydratedAnomalies[0]?.runAt || new Date().toISOString(),
          } : null,
          workingPapers: data.workingPapers || [],
          findings: data.findings || [],
          conclusions: data.conclusions || [],
          timeline: data.timeline || [],
        };
        dispatch({ type: 'LOAD_WORKFLOW', payload: { caseId, serverData } });
      } catch (err) {
        console.warn('[WorkflowAPI] loadWorkflow failed, using local state:', err.message);
      }
    }, []),

    // ─── Step 1: Case Handoff ────────────────────────────────────────────
    handoffCase: useCallback((caseId, teamLeaderId, comment) => {
      fireAPI('handoffCase', workflowAPI.handoffCase(caseId, teamLeaderId, comment));
    }, []),

    importCase: useCallback((caseId, actorId, handoffData) => {
      dispatch({ type: 'IMPORT_CASE', payload: { caseId, actorId, handoffData } });
      fireAPI('importCase', workflowAPI.importCaseFromCommittee(caseId, actorId));
    }, []),

    // ─── Step 2: Assignment ──────────────────────────────────────────────
    assignAuditor: useCallback((caseId, actorId, assignment) => {
      dispatch({ type: 'ASSIGN_AUDITOR', payload: { caseId, actorId, assignment } });
      fireAPI('assignAuditor', workflowAPI.assignToAuditor(
        caseId,
        assignment.auditorId,
        assignment.dueDate || null,
        assignment.instructions || null,
      ));
    }, []),

    // ─── Step 3: Planning ────────────────────────────────────────────────
    submitPlan: useCallback((caseId, actorId, plan) => {
      dispatch({ type: 'SUBMIT_PLAN', payload: { caseId, actorId, plan } });
      fireAPI('submitPlan', workflowAPI.submitPlan(caseId, plan));
    }, []),

    approvePlan: useCallback((caseId, actorId) => {
      dispatch({ type: 'APPROVE_PLAN', payload: { caseId, actorId } });
      fireAPI('approvePlan', workflowAPI.approvePlan(caseId));
    }, []),

    revisionPlan: useCallback((caseId, actorId, revisionNotes) => {
      dispatch({ type: 'REVISION_PLAN', payload: { caseId, actorId, revisionNotes } });
      fireAPI('revisionPlan', workflowAPI.revisePlan(caseId, revisionNotes));
    }, []),

    // ─── Step 4: Entry Conference ────────────────────────────────────────
    scheduleConference: useCallback((caseId, actorId, conference) => {
      dispatch({ type: 'SCHEDULE_CONFERENCE', payload: { caseId, actorId, conference } });
      fireAPI('scheduleConference', workflowAPI.scheduleConference(caseId, conference));
    }, []),

    recordMinutes: useCallback((caseId, actorId, minutes) => {
      dispatch({ type: 'RECORD_MINUTES', payload: { caseId, actorId, minutes } });
      // Backend expects { minutes: "string" } — the minutes param may be an object
      const minutesPayload = typeof minutes === 'string' ? { minutes } : { minutes: JSON.stringify(minutes) };
      fireAPI('recordMinutes', workflowAPI.recordConferenceMinutes(caseId, minutesPayload));
    }, []),

    skipConference: useCallback((caseId, actorId, reason) => {
      dispatch({ type: 'SKIP_CONFERENCE', payload: { caseId, actorId, reason } });
      fireAPI('skipConference', workflowAPI.skipConference(caseId, reason));
    }, []),

    approveConference: useCallback((caseId, actorId) => {
      dispatch({ type: 'APPROVE_CONFERENCE', payload: { caseId, actorId } });
      fireAPI('approveConference', workflowAPI.approveConference(caseId));
    }, []),

    // ─── Step 5: Information Request ─────────────────────────────────────
    createDocRequest: useCallback((caseId, actorId, request) => {
      dispatch({ type: 'CREATE_DOC_REQUEST', payload: { caseId, actorId, request } });
      // Backend expects flat fields — send what we have
      const requestData = {
        documentType: request.title || 'General',
        description: Array.isArray(request.items) ? request.items.join(', ') : request.title || '',
        dueDate: request.deadline || null,
      };
      fireAPI('createDocRequest', workflowAPI.createDocumentRequest(caseId, requestData));
    }, []),

    completeInfoRequest: useCallback((caseId, actorId) => {
      dispatch({ type: 'COMPLETE_INFO_REQUEST', payload: { caseId, actorId } });
    }, []),

    // ─── Document Uploads ─────────────────────────────────────────────
    uploadDocument: useCallback((caseId, document) => {
      dispatch({ type: 'UPLOAD_DOCUMENT', payload: { caseId, document } });
      // Backend uploadDocument expects (caseId, requestId, file, metadata)
      // Since the workflow currently creates mock documents without a real file,
      // we send the metadata so the backend can record the document reference.
      const metadata = {
        fileName: document.fileName || document.title || 'document',
        contentType: document.contentType || 'application/pdf',
        fileSize: document.fileSize || 0,
        fileUrl: document.fileUrl || '',
        requestId: document.requestId || null,
      };
      fireAPI('uploadDocument', workflowAPI.uploadDocument(
        caseId,
        metadata.requestId,
        metadata.fileUrl || new Blob([], { type: metadata.contentType }),
        metadata,
      ));
    }, []),

    verifyDocument: useCallback((caseId, documentId) => {
      dispatch({ type: 'VERIFY_DOCUMENT', payload: { caseId, documentId } });
      fireAPI('verifyDocument', workflowAPI.verifyDocument(caseId, documentId));
    }, []),

    // ─── Step 7: CAAT Analysis ───────────────────────────────────────────
    runCAAT: useCallback(async (caseId, actorId, results) => {
      const analysisTypes = results?.analysisTypes || [
        'RATIO_ANALYSIS', 'THIRD_PARTY_MATCHING', 'TRANSACTION_ANALYSIS',
        'REVENUE_ANALYSIS', 'EXPENSE_ANALYSIS', 'FRAUD_INDICATORS'
      ];
      try {
        const res = await workflowAPI.runCAATAnalysis(caseId, analysisTypes);
        const backendAnomalies = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        if (backendAnomalies.length > 0) {
          const normalized = backendAnomalies.map(a => ({
            ...a,
            decision: a.validationStatus && a.validationStatus !== 'PENDING' ? a.validationStatus : null,
            notes: a.validationNotes || '',
            amount: Number(a.originalAmount ?? a.expectedAmount ?? 0),
            originalAmount: Number(a.originalAmount ?? a.expectedAmount ?? 0),
            amendedAmount: a.amendedAmount !== null && a.amendedAmount !== undefined ? Number(a.amendedAmount) : Number(a.originalAmount ?? 0),
          }));
          dispatch({
            type: 'RUN_CAAT',
            payload: {
              caseId,
              actorId,
              results: {
                ...(results || {}),
                analysisTypes,
                anomalies: normalized,
                completedAt: new Date().toISOString(),
              },
            },
          });
          return normalized;
        }
      } catch (err) {
        console.warn('[WorkflowAPI] runCAAT failed, using fallback results:', err.message);
      }
      dispatch({ type: 'RUN_CAAT', payload: { caseId, actorId, results } });
      return results?.anomalies || [];
    }, []),

    validateAnomaly: useCallback(async (caseId, anomalyId, decision, notes, amendedAmount = null) => {
      const normDecision = decision === 'ACCEPT' ? 'ACCEPTED' : decision === 'AMEND' ? 'AMENDED' : decision === 'REJECT' ? 'REJECTED' : decision;
      dispatch({ type: 'VALIDATE_ANOMALY', payload: { caseId, anomalyId, decision: normDecision, notes, amendedAmount } });
      try {
        await workflowAPI.validateAnomaly(caseId, anomalyId, normDecision, notes, amendedAmount);
      } catch (err) {
        console.warn('[WorkflowAPI] validateAnomaly failed:', err.message);
      }
    }, []),

    promoteCaatToFindings: useCallback(async (caseId, actorId) => {
      try {
        const res = await workflowAPI.promoteCaatToFindings(caseId);
        const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
        if (list.length > 0) {
          dispatch({ type: 'SET_FINDINGS', payload: { caseId, findings: list } });
          return list;
        }
      } catch (err) {
        console.warn('[WorkflowAPI] promoteCaatToFindings failed:', err.message);
      }
      return [];
    }, []),

    completeCAAT: useCallback((caseId, actorId) => {
      dispatch({ type: 'COMPLETE_CAAT', payload: { caseId, actorId } });
    }, []),

    // ─── Step 8: Audit Testing ───────────────────────────────────────────
    addWorkingPaper: useCallback((caseId, paper) => {
      dispatch({ type: 'ADD_WORKING_PAPER', payload: { caseId, paper } });
      fireAPI('addWorkingPaper', workflowAPI.addWorkingPaper(caseId, paper));
    }, []),

    completeTesting: useCallback((caseId, actorId) => {
      dispatch({ type: 'COMPLETE_TESTING', payload: { caseId, actorId } });
      // No dedicated endpoint — status transition happens via findings creation
    }, []),

    // ─── Step 9: Findings ────────────────────────────────────────────────
    addFinding: useCallback((caseId, finding) => {
      dispatch({ type: 'ADD_FINDING', payload: { caseId, finding } });
      fireAPI('addFinding', workflowAPI.createFinding(caseId, finding));
    }, []),

    submitFindings: useCallback((caseId, actorId) => {
      dispatch({ type: 'SUBMIT_FINDINGS', payload: { caseId, actorId } });
      fireAPI('submitFindings', workflowAPI.submitFindings(caseId));
    }, []),

    approveFindings: useCallback((caseId, actorId) => {
      dispatch({ type: 'APPROVE_FINDINGS', payload: { caseId, actorId } });
      // Get current findings from state to approve each one
      // We use a getter inside the callback to read the latest state
      const wf = caseWorkflows[caseId];
      const submittedFindings = (wf?.findings || []).filter(f => f.status === 'SUBMITTED');
      submittedFindings.forEach(f => {
        fireAPI(`approveFinding:${f.id}`, workflowAPI.approveFinding(caseId, f.id));
      });
    }, [caseWorkflows]),

    // ─── Step 10: Taxpayer Response ──────────────────────────────────────
    taxpayerRespond: useCallback((caseId, findingId, response) => {
      dispatch({ type: 'TAXPAYER_RESPOND', payload: { caseId, findingId, response } });
      fireAPI('taxpayerRespond', workflowAPI.respondToFinding(
        caseId,
        findingId,
        response.responseType || 'AGREE',
        response.explanation || '',
        response.evidence || '',
      ));
    }, []),

    startConclusion: useCallback((caseId, actorId) => {
      dispatch({ type: 'START_CONCLUSION', payload: { caseId, actorId } });
      // No dedicated endpoint — conclusion state is tracked via individual finding conclusions
    }, []),

    // ─── Step 11: Conclusion ─────────────────────────────────────────────
    addConclusion: useCallback((caseId, conclusion) => {
      dispatch({ type: 'ADD_CONCLUSION', payload: { caseId, conclusion } });
      fireAPI('addConclusion', workflowAPI.createConclusion(
        caseId,
        conclusion.findingId,
        { conclusion: conclusion.determination, adjustmentAmount: String(conclusion.adjustmentAmount || ''), rationale: conclusion.rationale || '' },
      ));
    }, []),

    concludeCase: useCallback((caseId, actorId) => {
      dispatch({ type: 'CONCLUDE_CASE', payload: { caseId, actorId } });
      fireAPI('concludeCase', workflowAPI.finalizeCase(caseId));
    }, []),
  };

  return (
    <WorkflowContext.Provider value={{ caseWorkflows, selectedCaseId, setSelectedCaseId, getWorkflow, getStepProgress, actions }}>
      {children}
    </WorkflowContext.Provider>
  );
}

export function useWorkflow() {
  const ctx = useContext(WorkflowContext);
  if (!ctx) throw new Error('useWorkflow must be used within WorkflowProvider');
  return ctx;
}
