export type UserRole =
  | 'COMPREHENSIVE_AUDITOR'
  | 'TEAM_LEADER'
  | 'AUDIT_DIRECTOR'
  | 'FRAUD_INVESTIGATOR'
  | 'QA_OFFICER'
  | 'QA_TEAM_LEADER'
  | 'QA_DIRECTOR';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  directorate: string;
  badgeNumber: string;
  clearanceLevel: string;
  avatarUrl?: string;
}

export type AuditStatus =
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'RETURNED_FOR_CORRECTION'
  | 'PENDING_DIRECTOR_APPROVAL'
  | 'APPROVED'
  | 'ASSESSMENT_ISSUED'
  | 'ESCALATED_COMPREHENSIVE'
  | 'REFERRED_TO_FRAUD_INVESTIGATION';

export type SaveStatus = 'saved' | 'saving' | 'unsaved';

export interface SystemNotification {
  id: string;
  recipientRole: UserRole | 'ALL';
  recipientUserId?: string;
  sender: string;
  senderRole: UserRole;
  caseId: string;
  caseNumber: string;
  title: string;
  message: string;
  type:
    | 'SUBMISSION'
    | 'CORRECTION'
    | 'APPROVAL'
    | 'RECOMMENDATION'
    | 'ESCALATION'
    | 'FRAUD_ALERT'
    | 'QUERY_RESPONSE'
    | 'DIRECTOR_DECISION'
    | 'QA_DEFICIENCY'
    | 'QA_ENDORSEMENT'
    | 'QA_DIRECTIVE'
    | 'QA_AUDIT_RESPONSE';
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

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
  teamLeaderDecisionDate?: string;
  teamLeaderRecommendation?: string;
  directorComment?: string;
  directorDecisionDate?: string;
  fraudDossierNotes?: string;
  taxpayerSegment?: 'LTO' | 'MTO' | 'STO';
  materialityThreshold?: number;
  samplingMethod?: 'Stratified Sampling' | 'Random Sampling' | 'Systematic Monetary Unit Sampling';
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
  assertionType?: 'Existence' | 'Completeness' | 'Valuation' | 'Rights & Obligations' | 'Presentation';
  caatTechnique?: string;
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
  indicatesFraud?: boolean;
  fraudIndicators?: string;
  relatedProcedureId?: string;
  relatedEvidenceIds: string[];
  relatedQueryId?: string;
  relatedWorkingPaperId?: string;
  zoneAllocation?: string;
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

// -------------------------------------------------------------
// COMPREHENSIVE TAX AUDIT SPECIFIC TYPES (SOR FR-04.4 & FR-04.7)
// -------------------------------------------------------------

export interface EntryConference {
  caseId: string;
  scheduledDate: string;
  time: string;
  venue: string;
  attendees: Array<{ name: string; role: string; organization: string }>;
  internalControlsReview: string;
  premisesInspectionFindings: string;
  audioRecordingFileName?: string;
  taxpayerConfirmedReceipt: boolean;
  taxpayerReceiptDate?: string;
  status: 'SCHEDULED' | 'CONDUCTED' | 'CONFIRMED';
  lastUpdated: string;
}

export interface CAATExceptionItem {
  id: string;
  ruleCode: string;
  transactionRef: string;
  transactionDate: string;
  accountName: string;
  counterparty: string;
  amount: number;
  anomalyType: string;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  taxHead: 'CIT' | 'VAT' | 'PAYE' | 'CUSTOMS' | 'WHT';
  status: 'PENDING_REVIEW' | 'FINDING_CREATED' | 'QUERY_ISSUED' | 'DISMISSED';
  details: string;
  actionTakenNotes?: string;
}

export interface BenfordDigitStat {
  digit: number;
  expectedPct: number;
  observedPct: number;
  observedCount: number;
  isAnomalous: boolean;
  deviation: number;
}

export interface CAATAuditRule {
  id: string;
  ruleCode: string;
  ruleName: string;
  targetLedger: string;
  sampleSize: number;
  discrepanciesCount: number;
  varianceAmount: number;
  status: 'FLAGGED' | 'VERIFIED' | 'RESOLVED';
  details: string;
  category?: 'BENFORD' | 'E_INVOICING' | 'PAYROLL' | 'JOURNAL_ENTRIES' | 'THRESHOLD' | 'CUSTOMS' | 'DUPLICATES';
  thresholdAmount?: number;
  lastExecuted?: string;
}

export interface CAATAuditData {
  caseId: string;
  isCAATEligible: boolean;
  caatToolName: string;
  executionTimestamp: string;
  samplingMethod: 'Stratified Sampling' | 'Random Sampling' | 'Systematic Monetary Unit Sampling';
  rules: CAATAuditRule[];
  auditorNotes: string;
  totalRecordsMined?: number;
  totalFlaggedExposure?: number;
  exceptions?: CAATExceptionItem[];
  benfordStats?: BenfordDigitStat[];
  executionLogs?: string[];
}

export interface BalanceSheetItem {
  id: string;
  component: string;
  assertionType: 'Existence' | 'Completeness' | 'Valuation & Allocation' | 'Rights & Obligations' | 'Presentation';
  auditeeBalance: number;
  auditedBalance: number;
  variance: number;
  ifrsCompliance: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL';
  notes: string;
}

export interface ComprehensiveReconciliation {
  caseId: string;
  vatVsSales: {
    annualVatSalesDeclared: number;
    annualCitGrossTurnover: number;
    timsElectronicInvoices: number;
    variance: number;
    status: 'DISCREPANCY_FLAGGED' | 'RECONCILED';
    notes: string;
  };
  payrollPayeVsPnL: {
    payrollPayeRemitted: number;
    pnlSalariesExpense: number;
    variance: number;
    status: 'DISCREPANCY_FLAGGED' | 'RECONCILED';
    notes: string;
  };
  customsImportsVsPurchases: {
    asycudaCifImports: number;
    generalLedgerImportCosts: number;
    variance: number;
    status: 'DISCREPANCY_FLAGGED' | 'RECONCILED';
    notes: string;
  };
}

export interface ExitConference {
  caseId: string;
  scheduledDate: string;
  time: string;
  venue: string;
  agendaItems: string[];
  discussionNotes: string;
  taxpayerResponseNotes: string;
  attendanceConfirmed: boolean;
  signedByTaxpayer: boolean;
  signedDate?: string;
  status: 'PENDING_SCHEDULE' | 'SCHEDULED' | 'COMPLETED' | 'SIGNED';
}

export interface AssessmentNotice {
  caseId: string;
  noticeNumber: string;
  issueDate: string;
  statutoryDue30Days: string;
  principalTax: number;
  statutoryPenalty20: number;
  interest: number;
  totalAssessmentDue: number;
  objectionStatus: 'NONE' | 'OBJECTION_LODGED' | 'CONFIRMED' | 'APPEALED';
  objectionDetails?: string;
  fraudReferralTriggered: boolean;
  fraudReferralReason?: string;
}

export interface MultiZoneAllocation {
  zoneName: string;
  branchCode: string;
  taxDeclared: number;
  auditAdjustment: number;
  netPayable: number;
}

// ==========================================
// Audit Quality Assurance (QA) Types (SOR FR-04.5 & ISO 19011)
// ==========================================

export type QAReviewStatus =
  | 'PENDING_ASSIGNMENT'
  | 'IN_REVIEW'
  | 'PENDING_TL_REVIEW'
  | 'RETURNED_TO_OFFICER'
  | 'DEFICIENCY_ISSUED'
  | 'AUDIT_RESPONSE_RECEIVED'
  | 'PENDING_DIRECTOR_SIGNOFF'
  | 'PASSED_COMPLIANT'
  | 'PASSED_WITH_CONDITIONS'
  | 'REJECTED_REAUDIT_MANDATED';

export interface QACheckpoint {
  id: string;
  text: string;
  isSatisfied: boolean;
  isCritical: boolean;
  auditorEvidenceRef?: string;
  notes?: string;
}

export interface QADimensionScore {
  id: string;
  category:
    | 'PLANNING_AND_RISK'
    | 'EVIDENCE_AND_CAAT'
    | 'STATUTORY_PROCEDURES'
    | 'RECONCILIATIONS'
    | 'LEGAL_APPLICATION'
    | 'TAXPAYER_RIGHTS'
    | 'PENALTY_AND_INTEREST'
    | 'WORKING_PAPERS';
  title: string;
  standardsReference: string;
  weight: number; // percentage e.g. 15
  score: number; // 0 - 100
  status: 'COMPLIANT' | 'MINOR_DEFICIENCY' | 'MATERIAL_DEFICIENCY' | 'CRITICAL_FAILURE';
  reviewerNotes: string;
  checkpoints: QACheckpoint[];
}

export interface QADeficiencyItem {
  id: string;
  dimensionId: string;
  dimensionTitle: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MODERATE' | 'OBSERVATION';
  title: string;
  findingDescription: string;
  statutoryBreach: string;
  correctiveActionMandate: string;
  status: 'OPEN' | 'REMEDIATION_SUBMITTED' | 'ACCEPTED_RESOLVED' | 'DISPUTED';
  auditorResponse?: string;
  remediationEvidenceRef?: string;
  resolvedAt?: string;
}

export interface QAReport {
  id: string;
  qaReviewId: string;
  generatedDate: string;
  executiveSummary: string;
  overallRating: 'EXCELLENT' | 'SATISFACTORY' | 'MARGINAL' | 'UNSATISFACTORY';
  totalWeightedScore: number;
  criticalDeficienciesCount: number;
  majorDeficienciesCount: number;
  keyStrengths: string[];
  systemicVulnerabilities: string[];
  recommendationsForDirector: string;
  mandatoryCorrectiveActions: string[];
  leadQAOfficerSignature?: string;
  qaTeamLeaderSignature?: string;
  directorApprovalSignature?: string;
  signedDate?: string;
}

export interface QACaseReview {
  id: string;
  caseNumber: string; // e.g. QA-REV-2026-001
  auditCaseId: string; // e.g. CA-2026-101
  auditCaseNumber: string; // e.g. COMP-LTO-2026-0318
  taxpayerName: string;
  tradeName: string;
  tin: string;
  taxPeriod: string;
  totalTaxAssessment: number;
  leadAuditor: string;
  auditTeamLeader: string;
  selectionReason:
    | 'MANDATORY_HIGH_EXPOSURE'
    | 'RANDOM_STATUTORY_SAMPLE'
    | 'RISK_BASED_SELECTION'
    | 'DIRECTOR_REFERRAL';
  selectionDate: string;
  dueDate: string;
  assignedQAOfficer: string;
  qaTeamLeader: string;
  status: QAReviewStatus;
  overallScore: number; // 0 - 100
  rating: 'EXCELLENT' | 'SATISFACTORY' | 'MARGINAL' | 'UNSATISFACTORY';
  dimensions: QADimensionScore[];
  deficiencies: QADeficiencyItem[];
  report?: QAReport;
  auditTeamResponseNotes?: string;
  auditTeamResponseDate?: string;
  qaTeamLeaderComment?: string;
  qaTeamLeaderDecisionDate?: string;
  directorExecutiveComment?: string;
  directorExecutiveDecisionDate?: string;
  directorStatutoryOrder?: 'CERTIFY_COMPLIANT' | 'REQUIRE_CONDITIONAL_REVISION' | 'ORDER_FULL_REAUDIT' | 'INITIATE_INTERNAL_AFFAIRS_REVIEW';
  lastSaved: string;
  auditTrail: AuditTrailEntry[];
}

