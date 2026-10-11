export type AuditStatus =
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'RETURNED_FOR_CORRECTION'
  | 'APPROVED'
  | 'ESCALATED_COMPREHENSIVE';

export type SaveStatus = 'saved' | 'saving' | 'unsaved';

export interface AuditCase {
  id: string;
  caseNumber: string;
  tin: string;
  taxpayerName: string;
  tradeName: string;
  taxPeriod: string;
  taxYear: number;
  auditType: 'DESK_AUDIT' | 'COMPREHENSIVE_AUDIT';
  assignedAuditor: string;
  auditorEmail: string;
  teamLeader: string;
  teamLeaderEmail: string;
  startDate: string;
  dueDate: string;
  auditScope: string;
  status: AuditStatus;
  riskScore: number;
  riskCategory: 'HIGH' | 'MEDIUM' | 'LOW';
  riskInformation: string;
  teamLeaderComment?: string;
  escalationDetails?: {
    escalatedAt: string;
    escalatedBy: string;
    reason: string;
    extendedScope: string;
    estimatedTaxExposure: number;
  };
  lastSaved: string;
  createdAt: string;
}

export interface EvidenceItem {
  id: string;
  caseId: string;
  reference: string;
  description: string;
  source: string;
  date: string;
  relatedProcedureId: string;
  relatedFindingId?: string;
  status: 'Verified' | 'Pending Verification' | 'Disputed' | 'Rejected';
  fileName: string;
  fileSize: string;
  fileType: string;
  uploadedBy: string;
  notes?: string;
}

export interface AuditProcedure {
  id: string;
  caseId: string;
  reference: string;
  title: string;
  objective: string;
  description: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'WAIVED';
  assignedAuditor: string;
  dueDate: string;
  result: string;
  conclusion: string;
  observations: string;
  evidenceIds: string[];
  isMandatory: boolean;
}

export interface FinancialYearData {
  year: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  operatingExpenses: number;
  taxableIncome: number;
  taxDeclared: number;
  vatOutput: number;
  vatInput: number;
  vatPayable: number;
}

export interface QuarterlyData {
  quarter: string;
  revenue: number;
  cogs: number;
  expenses: number;
  vatInputClaimed: number;
  variance: number;
  notes: string;
}

export interface RatioAnalysis {
  name: string;
  taxpayerValue: number;
  benchmarkValue: number;
  unit: string;
  variancePct: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  interpretation: string;
}

export interface TaxAnomaly {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  title: string;
  description: string;
  identifiedAt: string;
  auditorNotes: string;
  status: 'FLAGGED' | 'INVESTIGATED' | 'DISMISSED';
}

export interface TaxAnalysis {
  caseId: string;
  annualFinancials: FinancialYearData[];
  quarterlyData: QuarterlyData[];
  ratios: RatioAnalysis[];
  anomalies: TaxAnomaly[];
  auditorSynthesis: string;
  conclusion: string;
}

export interface TaxQuery {
  id: string;
  caseId: string;
  reference: string;
  subject: string;
  question: string;
  statutoryBasis: string;
  dueDate: string;
  status: 'OPEN' | 'PENDING_RESPONSE' | 'RESOLVED' | 'OVERDUE';
  attachedEvidenceIds: string[];
  taxpayerResponse?: {
    respondedAt: string;
    responseText: string;
    attachedDocuments?: string[];
    responderName: string;
  };
  resolutionNotes?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface AuditFinding {
  id: string;
  caseId: string;
  reference: string;
  auditArea: string;
  title: string;
  description: string;
  criteria: string;
  condition: string;
  cause: string;
  effect: string;
  underDeclaredAmount: number;
  penaltyRate: number;
  penaltyAmount: number;
  interestAmount: number;
  totalTaxImpact: number;
  auditorAnalysis: string;
  conclusion: string;
  recommendation: string;
  status: 'DRAFT' | 'UNDER_REVIEW' | 'CONFIRMED' | 'WITHDRAWN';
  isSignificant: boolean;
  relatedProcedureId?: string;
  relatedEvidenceIds: string[];
  relatedQueryId?: string;
  relatedWorkingPaperId?: string;
}

export interface WorkingPaper {
  id: string;
  caseId: string;
  reference: string;
  title: string;
  category: string;
  preparedBy: string;
  date: string;
  workPerformed: string;
  conclusions: string;
  status: 'DRAFT' | 'COMPLETED' | 'REVIEWED';
  evidenceIds: string[];
  relatedProcedureId?: string;
  relatedFindingId?: string;
}

export interface DraftReport {
  caseId: string;
  reportReference: string;
  generatedDate: string;
  executiveSummary: string;
  scopeAndObjectives: string;
  methodology: string;
  findingsSummary: string;
  recommendedAdjustments: string;
  statutoryRecommendations: string;
  status: 'DRAFT' | 'FINAL_READY';
  lastUpdated: string;
}

export interface AuditTrailEntry {
  id: string;
  caseId: string;
  user: string;
  action: string;
  timestamp: string;
  oldValue?: string;
  newValue?: string;
  details: string;
}

export interface AuditStats {
  progress: number;
  evidenceCollected: number;
  evidenceRequired: number;
  proceduresCompleted: number;
  proceduresPending: number;
  proceduresTotal: number;
  queriesResolved: number;
  queriesTotal: number;
  findings: number;
  workingPapers: number;
  totalTaxImpact: number;
  status: AuditStatus;
}
