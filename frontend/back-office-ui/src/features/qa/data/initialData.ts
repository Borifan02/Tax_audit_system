import {
  AuditCase,
  EvidenceItem,
  AuditProcedure,
  TaxAnalysis,
  TaxQuery,
  AuditFinding,
  WorkingPaper,
  DraftReport,
  AuditTrailEntry,
  EntryConference,
  CAATAuditData,
  BalanceSheetItem,
  ComprehensiveReconciliation,
  ExitConference,
  AssessmentNotice,
  MultiZoneAllocation
} from '../types/audit';

export interface CaseFullData {
  auditCase: AuditCase;
  evidence: EvidenceItem[];
  procedures: AuditProcedure[];
  analysis: TaxAnalysis;
  queries: TaxQuery[];
  findings: AuditFinding[];
  workingPapers: WorkingPaper[];
  draftReport: DraftReport;
  auditTrail: AuditTrailEntry[];
  // Comprehensive Tax Audit Modules (SOR FR-04.4 & FR-04.7)
  entryConference?: EntryConference;
  caatAudit?: CAATAuditData;
  balanceSheetItems?: BalanceSheetItem[];
  reconciliations?: ComprehensiveReconciliation;
  exitConference?: ExitConference;
  assessmentNotice?: AssessmentNotice;
  multiZoneAllocations?: MultiZoneAllocation[];
}

export const INITIAL_CASES_DATA: Record<string, CaseFullData> = {
  'DA-2026-001': {
    auditCase: {
      id: 'DA-2026-001',
      caseNumber: 'CASE-HQ-2026-0842',
      tin: 'TIN-9843-0211',
      taxpayerName: 'Global Tech Solutions LLC',
      tradeName: 'GlobalTech IT Services & Cloud Hosting',
      taxPeriod: '2024-2025',
      taxYear: 2024,
      auditType: 'DESK_AUDIT',
      assignedAuditor: 'Jane Doe',
      auditorEmail: 'jane.doe@itas.gov.tax',
      teamLeader: 'John Smith',
      teamLeaderEmail: 'john.smith@itas.gov.tax',
      startDate: '2026-09-01',
      dueDate: '2026-10-15',
      auditScope: 'Verification of Cost of Goods Sold, Revenue Recognition, and Input VAT compliance for Q1-Q4 FY2024.',
      status: 'IN_PROGRESS',
      riskScore: 78,
      riskCategory: 'HIGH',
      riskInformation: 'Automated Risk Profiling: System flagged high variance in operational expenses (+38% vs sector benchmark) and mismatch between TIMS electronic invoices and self-declared turnover in Schedule 3.',
      lastSaved: '13:45:12',
      createdAt: '2026-09-01T08:30:00Z'
    },
    evidence: [
      {
        id: 'EVD-001',
        caseId: 'DA-2026-001',
        reference: 'EVD-2026-001',
        description: 'Audited Financial Statements & Tax Computation FY2024 signed by certified public auditor',
        source: 'Taxpayer Submission',
        date: '2026-09-03',
        relatedProcedureId: 'AP-01',
        status: 'Verified',
        fileName: 'AFS_Tax_Computation_FY2024_Signed.pdf',
        fileSize: '4.2 MB',
        fileType: 'application/pdf',
        uploadedBy: 'Jane Doe',
        notes: 'Cross-checked with corporate register; auditor license validated.'
      },
      {
        id: 'EVD-002',
        caseId: 'DA-2026-001',
        reference: 'EVD-2026-002',
        description: 'Third-party commercial bank statements showing all deposit transactions for Operating Account',
        source: 'Third-Party Bank Confirmation',
        date: '2026-09-06',
        relatedProcedureId: 'AP-01',
        status: 'Verified',
        fileName: 'Bank_Statement_Reconciliation_Q1_Q4.xlsx',
        fileSize: '1.8 MB',
        fileType: 'application/vnd.ms-excel',
        uploadedBy: 'Jane Doe',
        notes: 'Confirmed directly through secure Inter-Bank API gateway.'
      },
      {
        id: 'EVD-003',
        caseId: 'DA-2026-001',
        reference: 'EVD-2026-003',
        description: 'Electronic Invoicing System (TIMS) transmitted invoice register for 12 months',
        source: 'Electronic Invoicing System (TIMS)',
        date: '2026-09-08',
        relatedProcedureId: 'AP-05',
        relatedFindingId: 'FND-02',
        status: 'Verified',
        fileName: 'TIMS_Sales_Register_FY2024.csv',
        fileSize: '890 KB',
        fileType: 'text/csv',
        uploadedBy: 'Jane Doe',
        notes: 'Identified 14 invoices flagged with zero-rated status lacking export customs proofs.'
      }
    ],
    procedures: [
      {
        id: 'AP-01',
        caseId: 'DA-2026-001',
        reference: 'AP-01',
        title: 'Gross Revenue Reconciliation against Bank & TIMS Data',
        objective: 'Reconcile turnover declared in the annual CIT return with third-party bank lodgements and TIMS invoices.',
        description: 'Extract 12-month electronic invoice logs, compare total taxable supplies against audited income statement and commercial bank deposit totals.',
        status: 'COMPLETED',
        assignedAuditor: 'Jane Doe',
        dueDate: '2026-09-12',
        result: 'Reconciled turnover of $4,850,000 against declared $4,690,000. Variance of $160,000 identified.',
        conclusion: 'Unexplained revenue suppression in Q3 of $160,000 traced to omitted foreign client billings.',
        observations: 'Three foreign service contracts billed outside local TIMS portal without exemption approval.',
        evidenceIds: ['EVD-001', 'EVD-002'],
        isMandatory: true
      },
      {
        id: 'AP-02',
        caseId: 'DA-2026-001',
        reference: 'AP-02',
        title: 'Cost of Goods Sold (COGS) & Direct Costs Substantiation',
        objective: 'Verify validity of hosting fees, server licenses, and subcontractor expenses claimed under COGS.',
        description: 'Sample top 20 provider invoices for cloud infrastructure and technical consulting to ensure valid tax invoices.',
        status: 'COMPLETED',
        assignedAuditor: 'Jane Doe',
        dueDate: '2026-09-15',
        result: 'Subcontracting fees of $110,000 paid to related entity without withholding tax deduction or valid contract.',
        conclusion: 'Disallowance of $110,000 recommended under Section 16(2) of Corporate Tax Act.',
        observations: 'No transfer pricing documentation or proof of services rendered provided by taxpayer.',
        evidenceIds: ['EVD-001'],
        isMandatory: true
      },
      {
        id: 'AP-03',
        caseId: 'DA-2026-001',
        reference: 'AP-03',
        title: 'Operating Expenses Documentation & Disallowables Review',
        objective: 'Identify non-deductible personal expenses, fines, penalties, and excessive management fees.',
        description: 'Examine detailed general ledger expense codes for management fees, legal charges, travel, and entertainment allowances.',
        status: 'IN_PROGRESS',
        assignedAuditor: 'Jane Doe',
        dueDate: '2026-09-22',
        result: 'Initial sampling indicates $24,500 in overseas travel and director club memberships expensed as staff training.',
        conclusion: 'Pending taxpayer justification on Query QRY-02.',
        observations: 'Vouchers lack receipts; credit card statements reflect non-business merchant categories.',
        evidenceIds: [],
        isMandatory: true
      },
      {
        id: 'AP-04',
        caseId: 'DA-2026-001',
        reference: 'AP-04',
        title: 'Withholding Tax (WHT) Compliance & Remittance Audit',
        objective: 'Ascertain whether applicable WHT on professional services and royalties was deducted and remitted on time.',
        description: 'Match professional and management fee general ledger accounts against monthly WHT return receipts.',
        status: 'NOT_STARTED',
        assignedAuditor: 'Jane Doe',
        dueDate: '2026-09-28',
        result: '',
        conclusion: '',
        observations: '',
        evidenceIds: [],
        isMandatory: true
      },
      {
        id: 'AP-05',
        caseId: 'DA-2026-001',
        reference: 'AP-05',
        title: 'Input VAT Claim Authenticity & Timeliness Verification',
        objective: 'Test input tax credits against the electronic tax invoice database to prevent fictitious invoice claims.',
        description: 'Match input VAT claims of $142,000 on monthly VAT returns against vendor registered output VAT filings.',
        status: 'COMPLETED',
        assignedAuditor: 'Jane Doe',
        dueDate: '2026-09-18',
        result: '$32,000 in input VAT claimed on invalid fiscal receipts from deregistered vendor.',
        conclusion: 'Disallowed input VAT of $32,000 plus 20% statutory penalty.',
        observations: 'Supplier TIN-3391-4402 was canceled in January 2024 prior to invoice dates.',
        evidenceIds: ['EVD-003'],
        isMandatory: true
      },
      {
        id: 'AP-06',
        caseId: 'DA-2026-001',
        reference: 'AP-06',
        title: 'Related-Party Transactions & Transfer Pricing Disclosures',
        objective: 'Review transactions between taxpayer and offshore parent company in Mauritius for arm’s length compliance.',
        description: 'Inspect intercompany software license agreements, royalty allocation keys, and cross-border bank outflows.',
        status: 'NOT_STARTED',
        assignedAuditor: 'Jane Doe',
        dueDate: '2026-10-02',
        result: '',
        conclusion: '',
        observations: '',
        evidenceIds: [],
        isMandatory: true
      },
      {
        id: 'AP-07',
        caseId: 'DA-2026-001',
        reference: 'AP-07',
        title: 'Depreciation & Capital Allowance Computations',
        objective: 'Verify asset additions, disposals, and applicable tax wear-and-tear allowance rates on server hardware.',
        description: 'Inspect fixed asset additions register and invoices for datacenter hardware totaling $420,000.',
        status: 'NOT_STARTED',
        assignedAuditor: 'Jane Doe',
        dueDate: '2026-10-05',
        result: '',
        conclusion: '',
        observations: '',
        evidenceIds: [],
        isMandatory: false
      },
      {
        id: 'AP-08',
        caseId: 'DA-2026-001',
        reference: 'AP-08',
        title: 'Statutory Filing Timeliness & Penalties Verification',
        objective: 'Review historical filing timestamps against statutory deadlines to assess late filing penalties and interest.',
        description: 'Check filing dates for Q1-Q4 provisional returns, annual return, and monthly VAT returns.',
        status: 'NOT_STARTED',
        assignedAuditor: 'Jane Doe',
        dueDate: '2026-10-10',
        result: '',
        conclusion: '',
        observations: '',
        evidenceIds: [],
        isMandatory: false
      }
    ],
    analysis: {
      caseId: 'DA-2026-001',
      annualFinancials: [
        {
          year: '2022',
          revenue: 3450000,
          cogs: 1820000,
          grossProfit: 1630000,
          operatingExpenses: 1050000,
          taxableIncome: 580000,
          taxDeclared: 174000,
          vatOutput: 552000,
          vatInput: 291200,
          vatPayable: 260800
        },
        {
          year: '2023',
          revenue: 4120000,
          cogs: 2180000,
          grossProfit: 1940000,
          operatingExpenses: 1290000,
          taxableIncome: 650000,
          taxDeclared: 195000,
          vatOutput: 659200,
          vatInput: 348800,
          vatPayable: 310400
        },
        {
          year: '2024',
          revenue: 4690000,
          cogs: 2910000,
          grossProfit: 1780000,
          operatingExpenses: 1540000,
          taxableIncome: 240000,
          taxDeclared: 72000,
          vatOutput: 750400,
          vatInput: 608400,
          vatPayable: 142000
        }
      ],
      quarterlyData: [
        { quarter: 'Q1 2024', revenue: 1120000, cogs: 680000, expenses: 360000, vatInputClaimed: 132000, variance: 4.2, notes: 'Normal seasonal billing' },
        { quarter: 'Q2 2024', revenue: 1180000, cogs: 710000, expenses: 375000, vatInputClaimed: 139000, variance: 5.1, notes: 'Steady cloud service growth' },
        { quarter: 'Q3 2024', revenue: 1140000, cogs: 790000, expenses: 410000, vatInputClaimed: 178000, variance: 22.4, notes: 'Unusual spike in input VAT claims (+28%)' },
        { quarter: 'Q4 2024', revenue: 1250000, cogs: 730000, expenses: 395000, vatInputClaimed: 159400, variance: 8.7, notes: 'Year-end contract renewals' }
      ],
      ratios: [
        {
          name: 'Gross Profit Margin',
          taxpayerValue: 37.9,
          benchmarkValue: 47.0,
          unit: '%',
          variancePct: -19.4,
          riskLevel: 'HIGH',
          interpretation: 'Gross margin compressed by 9.1 percentage points compared to peer software service providers.'
        },
        {
          name: 'Operating Expense Ratio',
          taxpayerValue: 32.8,
          benchmarkValue: 24.5,
          unit: '%',
          variancePct: 33.9,
          riskLevel: 'HIGH',
          interpretation: 'Operating expenses are 33.9% higher than industry average due to substantial unverified consulting fees.'
        },
        {
          name: 'Effective Tax Rate',
          taxpayerValue: 1.53,
          benchmarkValue: 4.75,
          unit: '% of Revenue',
          variancePct: -67.8,
          riskLevel: 'HIGH',
          interpretation: 'Declared tax liability plunged from $195k (2023) to $72k (2024) despite 13.8% topline revenue growth.'
        },
        {
          name: 'Input VAT / Output VAT Ratio',
          taxpayerValue: 81.1,
          benchmarkValue: 53.0,
          unit: '%',
          variancePct: 53.0,
          riskLevel: 'HIGH',
          interpretation: 'Disproportionately high input VAT claims relative to typical service industry profiles.'
        }
      ],
      anomalies: [
        {
          id: 'ANM-01',
          severity: 'CRITICAL',
          title: 'Topline Growth with 63% Taxable Profit Plunge',
          description: 'Turnover grew by $570,000 (+13.8%) while declared taxable income plummeted by $410,000 (-63.1%), triggered by $730,000 increase in COGS.',
          identifiedAt: '2026-09-02',
          auditorNotes: 'Audit Procedure AP-02 confirmed $110,000 in fictitious or unverified subcontracting fees to offshore entity.',
          status: 'FLAGGED'
        },
        {
          id: 'ANM-02',
          severity: 'HIGH',
          title: 'Q3 Input VAT Surge (+28.1%) Without Asset Expansion',
          description: 'Input VAT surged to $178,000 in Q3 without corresponding increase in capital asset acquisitions or verifiable hardware purchases.',
          identifiedAt: '2026-09-04',
          auditorNotes: 'Procedure AP-05 revealed $32,000 in invalid fiscal invoices from deregistered supplier TIN-3391-4402.',
          status: 'INVESTIGATED'
        },
        {
          id: 'ANM-03',
          severity: 'MEDIUM',
          title: 'Unreported Export Turnover in TIMS System',
          description: 'Turnover in audited accounts exceeds TIMS electronic invoicing records by $160,000 in foreign exchange receipts.',
          identifiedAt: '2026-09-08',
          auditorNotes: 'Procedure AP-01 established offshore client billings without electronic receipt issuance or export customs certification.',
          status: 'INVESTIGATED'
        }
      ],
      auditorSynthesis: 'Comparative analysis shows a high-risk pattern of income deflation. Topline grew while taxable profit decreased precipitously through inflated subcontracting costs and invalid input VAT claims. Reconciliations with TIMS electronic invoices confirm $160,000 in unrecorded sales and $32,000 in fraudulent input tax credits.',
      conclusion: 'Material risk of tax avoidance identified. Specific adjustments required in COGS disallowances, Input VAT denials, and omitted sales turnover.'
    },
    queries: [
      {
        id: 'QRY-01',
        caseId: 'DA-2026-001',
        reference: 'QRY-2026-01',
        subject: 'Clarification on Q3 Subcontracting Invoices & Service Contracts',
        question: 'Please furnish certified vendor contracts, proof of service delivery, and Withholding Tax remittance receipts for the $110,000 in cloud development services paid to Nexus Tech Solutions FZE during Q3 FY2024.',
        statutoryBasis: 'Tax Administration Act 2015, Section 42(1) & (2) - Request for Information',
        dueDate: '2026-09-16',
        status: 'RESOLVED',
        attachedEvidenceIds: ['EVD-001'],
        taxpayerResponse: {
          respondedAt: '2026-09-14T11:20:00Z',
          responseText: 'We attach the consultancy agreement dated 10 Jan 2024. Regarding WHT, we believed this was covered under Double Taxation Agreement (DTA) exemption, though formal exemption certificate was pending.',
          attachedDocuments: ['Nexus_Tech_Consultancy_Agreement.pdf'],
          responderName: 'Marcus Vance, CFO'
        },
        resolutionNotes: 'Taxpayer failed to produce valid Tax Exemption Certificate issued by Authority. Statutory 15% WHT applies plus CIT disallowance for lack of substantiation under Sec 16(2).',
        resolvedAt: '2026-09-15T15:00:00Z',
        resolvedBy: 'Jane Doe'
      },
      {
        id: 'QRY-02',
        caseId: 'DA-2026-001',
        reference: 'QRY-2026-02',
        subject: 'Justification for Input VAT Credits from Supplier TIN-3391-4402',
        question: 'Provide original fiscal electronic tax receipts (ETRs) and physical proof of goods received for three invoices totaling $32,000 claimed as input tax credit in August 2024 from Apex Data Networks.',
        statutoryBasis: 'Value Added Tax Act, Section 17 - Substantiation of Input Tax Claims',
        dueDate: '2026-09-25',
        status: 'PENDING_RESPONSE',
        attachedEvidenceIds: ['EVD-003']
      }
    ],
    findings: [
      {
        id: 'FND-01',
        caseId: 'DA-2026-001',
        reference: 'FND-2026-01',
        auditArea: 'Corporate Income Tax',
        title: 'Disallowance of Unsubstantiated Offshore Subcontracting Fees',
        description: 'Taxpayer deducted $110,000 in software consulting fees paid to offshore entity without valid service deliverables, timesheets, or WHT compliance.',
        criteria: 'Corporate Income Tax Act Section 16(1) and Section 35 (Non-deductible expenditure without proof of production of income).',
        condition: 'General ledger entry shows $110,000 debited to direct expenses. No engineering deliverables, milestone sign-offs, or foreign contractor WHT certificates were maintained.',
        cause: 'Taxpayer attempted to shift taxable profits to low-tax jurisdiction entity without arm’s-length economic substance.',
        effect: 'Under-declaration of taxable profit by $110,000, resulting in unpaid Corporate Income Tax of $33,000.',
        underDeclaredAmount: 110000,
        penaltyRate: 20,
        penaltyAmount: 6600,
        interestAmount: 2970,
        totalTaxImpact: 42570,
        auditorAnalysis: 'Expenditure failed the statutory test of being incurred wholly and exclusively in the production of taxable income. Furthermore, no WHT was withheld at source.',
        conclusion: 'Full disallowance of $110,000 added back to taxable income.',
        recommendation: 'Issue assessment for $33,000 additional CIT plus $6,600 statutory penalty (20%) and statutory interest.',
        status: 'CONFIRMED',
        isSignificant: true,
        relatedProcedureId: 'AP-02',
        relatedEvidenceIds: ['EVD-001'],
        relatedQueryId: 'QRY-01',
        relatedWorkingPaperId: 'WP-02'
      },
      {
        id: 'FND-02',
        caseId: 'DA-2026-001',
        reference: 'FND-2026-02',
        auditArea: 'Value Added Tax (VAT)',
        title: 'Inadmissible Input Tax Deduction from Deregistered Vendor',
        description: 'Input VAT of $32,000 claimed on three invoices issued by vendor whose VAT registration was canceled prior to transaction dates.',
        criteria: 'Value Added Tax Act Section 17(3) (Only invoices issued by registered persons with valid electronic fiscal signatures are deductible).',
        condition: 'Cross-verification against the National Taxpayer Database confirms vendor TIN-3391-4402 was canceled in January 2024. Invoices dated August 2024 carried fabricated fiscal signatures.',
        cause: 'Negligence in vendor master file verification and failure to validate supplier tax compliance status.',
        effect: 'Direct tax loss of $32,000 in unlawful VAT credit reduction.',
        underDeclaredAmount: 32000,
        penaltyRate: 20,
        penaltyAmount: 6400,
        interestAmount: 1920,
        totalTaxImpact: 40320,
        auditorAnalysis: 'The taxpayer cannot claim input VAT without a valid electronic invoice issued by a live VAT-registered taxpayer.',
        conclusion: 'Denial of $32,000 input tax credit and clawback assessment.',
        recommendation: 'Assess $32,000 VAT payable plus mandatory 20% penalty for incorrect return.',
        status: 'CONFIRMED',
        isSignificant: false,
        relatedProcedureId: 'AP-05',
        relatedEvidenceIds: ['EVD-003'],
        relatedQueryId: 'QRY-02',
        relatedWorkingPaperId: 'WP-03'
      }
    ],
    workingPapers: [
      {
        id: 'WP-01',
        caseId: 'DA-2026-001',
        reference: 'WP-REV-01',
        title: 'Turnover & Bank Account Reconciliation Schedule',
        category: 'Revenue Reconciliation',
        preparedBy: 'Jane Doe',
        date: '2026-09-07',
        workPerformed: 'Reconciled audited gross revenue ($4,690,000) against total bank credits ($4,850,000) across 4 commercial bank accounts. Identified $160,000 variance in foreign exchange transfers.',
        conclusions: 'Unrecorded foreign service revenue identified; verified as taxable service rendered from domestic office.',
        status: 'COMPLETED',
        evidenceIds: ['EVD-001', 'EVD-002'],
        relatedProcedureId: 'AP-01'
      },
      {
        id: 'WP-02',
        caseId: 'DA-2026-001',
        reference: 'WP-EXP-02',
        title: 'Subcontracting & Direct Costs Substantiation Test',
        category: 'Expense Sampling & Testing',
        preparedBy: 'Jane Doe',
        date: '2026-09-11',
        workPerformed: 'Sampled 100% of subcontracting expenses over $25,000. Verified contracts, deliverable work logs, and WHT certificates for Nexus Tech Solutions FZE.',
        conclusions: 'Subcontractor failed to demonstrate physical or remote service delivery. Lack of WHT withholding substantiated under FND-01.',
        status: 'COMPLETED',
        evidenceIds: ['EVD-001'],
        relatedProcedureId: 'AP-02',
        relatedFindingId: 'FND-01'
      },
      {
        id: 'WP-03',
        caseId: 'DA-2026-001',
        reference: 'WP-VAT-03',
        title: 'Input Tax Verification & TIMS Invoicing Cross-Check',
        category: 'Input VAT Claim Verification',
        preparedBy: 'Jane Doe',
        date: '2026-09-13',
        workPerformed: 'Downloaded all monthly input VAT schedules and ran automated cross-match against Central TIMS Tax Ledger. 3 invalid invoices detected.',
        conclusions: '$32,000 in invalid input VAT disallowed. Finding FND-02 established.',
        status: 'COMPLETED',
        evidenceIds: ['EVD-003'],
        relatedProcedureId: 'AP-05',
        relatedFindingId: 'FND-02'
      },
      {
        id: 'WP-04',
        caseId: 'DA-2026-001',
        reference: 'WP-EXP-04',
        title: 'Executive Travel & Administrative Expenses Audit',
        category: 'Expense Sampling & Testing',
        preparedBy: 'Jane Doe',
        date: '2026-09-17',
        workPerformed: 'Tested 45 vouchers relating to executive hospitality, overseas travel, and seminar registrations.',
        conclusions: 'Identified personal expenditures expensed to corporate account. Query QRY-02 issued.',
        status: 'DRAFT',
        evidenceIds: [],
        relatedProcedureId: 'AP-03'
      },
      {
        id: 'WP-05',
        caseId: 'DA-2026-001',
        reference: 'WP-TAX-05',
        title: 'Revised Tax Computation & Additional Liability Schedule',
        category: 'Tax Reconciliation',
        preparedBy: 'Jane Doe',
        date: '2026-09-19',
        workPerformed: 'Synthesized verified findings into the statutory tax computation model, incorporating penalty and late interest schedules.',
        conclusions: 'Total additional tax assessment calculated at $82,890 including penalties and interest.',
        status: 'DRAFT',
        evidenceIds: ['EVD-001', 'EVD-003']
      }
    ],
    draftReport: {
      caseId: 'DA-2026-001',
      reportReference: 'REP-DA-2026-001-DRAFT',
      generatedDate: '2026-09-20',
      executiveSummary: 'A desk audit was conducted on Global Tech Solutions LLC (TIN-9843-0211) covering Corporate Income Tax and Value Added Tax for the fiscal period 2024. The audit established material discrepancies comprising $110,000 in unsubstantiated offshore subcontractor expenses and $32,000 in fictitious input VAT deductions. Total additional assessment proposed is $82,890.',
      scopeAndObjectives: 'The scope of this desk audit was restricted to high-risk areas flagged by the Automated Risk Management System, specifically Cost of Goods Sold, Operating Expenses, and Input VAT claims.',
      methodology: 'The audit was conducted via desk review of audited accounts, electronic TIMS invoice logs, inter-bank confirmation statements, and statutory taxpayer query responses in accordance with Tax Administration Act provisions.',
      findingsSummary: 'Two primary non-compliance findings have been confirmed: (1) Disallowance of offshore consulting fees of $110,000 for failure to demonstrate business purpose and lack of WHT; (2) Inadmissible input tax deduction of $32,000 from a deregistered supplier.',
      recommendedAdjustments: '1. Disallow $110,000 in COGS and increase taxable profit to $350,000.\n2. Disallow $32,000 in input VAT credits.\n3. Levy statutory penalty of 20% on tax shortfalls ($13,000 total penalty).\n4. Compute statutory interest of $4,890 to date of notice.',
      statutoryRecommendations: 'It is recommended that a formal Notice of Additional Assessment be served upon the taxpayer under Section 45 of the Tax Administration Act, with 30 days to settle or lodge objection.',
      status: 'DRAFT',
      lastUpdated: '2026-09-20T14:15:00Z'
    },
    auditTrail: [
      {
        id: 'TRL-01',
        caseId: 'DA-2026-001',
        user: 'Jane Doe (Auditor)',
        action: 'Case Initialized',
        timestamp: '2026-09-01T08:30:00Z',
        details: 'Desk audit case assigned and opened from risk queue.'
      },
      {
        id: 'TRL-02',
        caseId: 'DA-2026-001',
        user: 'Jane Doe (Auditor)',
        action: 'Evidence Registered',
        timestamp: '2026-09-03T10:15:00Z',
        details: 'Uploaded and verified signed AFS & Tax Computation (EVD-2026-001).'
      },
      {
        id: 'TRL-03',
        caseId: 'DA-2026-001',
        user: 'Jane Doe (Auditor)',
        action: 'Procedure Completed',
        timestamp: '2026-09-12T14:40:00Z',
        details: 'Audit Procedure AP-01 marked as Completed with findings.'
      },
      {
        id: 'TRL-04',
        caseId: 'DA-2026-001',
        user: 'Jane Doe (Auditor)',
        action: 'Query Issued',
        timestamp: '2026-09-13T09:00:00Z',
        details: 'Issued formal query QRY-2026-01 regarding offshore consulting fees.'
      },
      {
        id: 'TRL-05',
        caseId: 'DA-2026-001',
        user: 'Jane Doe (Auditor)',
        action: 'Query Resolved',
        timestamp: '2026-09-15T15:00:00Z',
        details: 'Resolved QRY-2026-01 after taxpayer response evaluated; disallowance sustained.'
      },
      {
        id: 'TRL-06',
        caseId: 'DA-2026-001',
        user: 'Jane Doe (Auditor)',
        action: 'Finding Created',
        timestamp: '2026-09-16T11:20:00Z',
        details: 'Created audit finding FND-2026-01: Disallowance of offshore consulting fees ($42,570 tax impact).'
      },
      {
        id: 'TRL-07',
        caseId: 'DA-2026-001',
        user: 'Jane Doe (Auditor)',
        action: 'Working Paper Saved',
        timestamp: '2026-09-19T16:10:00Z',
        details: 'Completed working paper WP-VAT-03 for input tax verification.'
      },
      {
        id: 'TRL-08',
        caseId: 'DA-2026-001',
        user: 'Jane Doe (Auditor)',
        action: 'Draft Saved',
        timestamp: '2026-09-24T13:45:12Z',
        details: 'Autosaved desk audit workspace state.'
      }
    ]
  },

  'DA-2026-002': {
    auditCase: {
      id: 'DA-2026-002',
      caseNumber: 'CASE-HQ-2026-0915',
      tin: 'TIN-5521-8934',
      taxpayerName: 'Apex Logistics Hub Ltd',
      tradeName: 'Apex Freight & Customs Haulage',
      taxPeriod: '2024-2025',
      taxYear: 2024,
      auditType: 'DESK_AUDIT',
      assignedAuditor: 'Jane Doe',
      auditorEmail: 'jane.doe@itas.gov.tax',
      teamLeader: 'John Smith',
      teamLeaderEmail: 'john.smith@itas.gov.tax',
      startDate: '2026-09-05',
      dueDate: '2026-10-25',
      auditScope: 'Audit of Withholding Tax (WHT) deductions on subcontracted fleet hauliers and cross-border fuel expenses.',
      status: 'IN_PROGRESS',
      riskScore: 54,
      riskCategory: 'MEDIUM',
      riskInformation: 'Routine risk selection: High volume of payments to individual truck owner-operators without corresponding monthly WHT remittances.',
      lastSaved: '11:15:30',
      createdAt: '2026-09-05T09:00:00Z'
    },
    evidence: [
      {
        id: 'EVD-201',
        caseId: 'DA-2026-002',
        reference: 'EVD-2026-101',
        description: 'Commercial Fleet Haulage Subcontracts & Waybills Register FY2024',
        source: 'Taxpayer Submission',
        date: '2026-09-09',
        relatedProcedureId: 'AP-201',
        status: 'Verified',
        fileName: 'Haulage_Subcontracts_2024.pdf',
        fileSize: '6.1 MB',
        fileType: 'application/pdf',
        uploadedBy: 'Jane Doe'
      },
      {
        id: 'EVD-202',
        caseId: 'DA-2026-002',
        reference: 'EVD-2026-102',
        description: 'Monthly WHT Returns & Payment Receipts Schedule',
        source: 'Withholding Tax Returns (WHT)',
        date: '2026-09-12',
        relatedProcedureId: 'AP-202',
        status: 'Verified',
        fileName: 'WHT_Receipts_FY2024.xlsx',
        fileSize: '1.2 MB',
        fileType: 'application/vnd.ms-excel',
        uploadedBy: 'Jane Doe'
      }
    ],
    procedures: [
      {
        id: 'AP-201',
        caseId: 'DA-2026-002',
        reference: 'AP-01',
        title: 'Haulage Expense Ledger to WHT Return Cross-Reconciliation',
        objective: 'Reconcile total payments made to independent freight contractors against WHT deducted at statutory rate of 5%.',
        description: 'Examine general ledger accounts 5100-5140 for subcontracted logistics and match against WHT return submissions.',
        status: 'COMPLETED',
        assignedAuditor: 'Jane Doe',
        dueDate: '2026-09-20',
        result: 'Contract payments of $840,000 identified. Total WHT deducted was $22,000 instead of statutory $42,000.',
        conclusion: 'Unremitted WHT of $20,000 on independent truckers without exemption cards.',
        observations: 'Taxpayer claimed truckers were casual laborers, which does not exempt commercial logistics contracts.',
        evidenceIds: ['EVD-201', 'EVD-202'],
        isMandatory: true
      },
      {
        id: 'AP-202',
        caseId: 'DA-2026-002',
        reference: 'AP-02',
        title: 'Fuel Levy and Excise Rebate Claims Audit',
        objective: 'Verify fuel consumption logs and diesel excise credit claims.',
        description: 'Sample fuel delivery receipts and fleet telematics mileage records.',
        status: 'IN_PROGRESS',
        assignedAuditor: 'Jane Doe',
        dueDate: '2026-09-29',
        result: 'Telematics reports received; mileage validation in progress.',
        conclusion: '',
        observations: 'Discrepancy of 14,000 liters between fuel purchase receipts and vehicle trip logs.',
        evidenceIds: [],
        isMandatory: true
      }
    ],
    analysis: {
      caseId: 'DA-2026-002',
      annualFinancials: [
        { year: '2023', revenue: 6200000, cogs: 4400000, grossProfit: 1800000, operatingExpenses: 1100000, taxableIncome: 700000, taxDeclared: 210000, vatOutput: 992000, vatInput: 704000, vatPayable: 288000 },
        { year: '2024', revenue: 7100000, cogs: 5200000, grossProfit: 1900000, operatingExpenses: 1250000, taxableIncome: 650000, taxDeclared: 195000, vatOutput: 1136000, vatInput: 832000, vatPayable: 304000 }
      ],
      quarterlyData: [
        { quarter: 'Q1 2024', revenue: 1680000, cogs: 1240000, expenses: 290000, vatInputClaimed: 198000, variance: 2.1, notes: 'Normal freight ops' },
        { quarter: 'Q2 2024', revenue: 1750000, cogs: 1290000, expenses: 310000, vatInputClaimed: 206000, variance: 3.4, notes: 'Harbor congestion surcharges' },
        { quarter: 'Q3 2024', revenue: 1820000, cogs: 1330000, expenses: 320000, vatInputClaimed: 213000, variance: 1.8, notes: 'Peak agricultural export season' },
        { quarter: 'Q4 2024', revenue: 1850000, cogs: 1340000, expenses: 330000, vatInputClaimed: 215000, variance: 2.0, notes: 'End of year retail restocking' }
      ],
      ratios: [
        { name: 'Gross Profit Margin', taxpayerValue: 26.8, benchmarkValue: 28.5, unit: '%', variancePct: -6.0, riskLevel: 'LOW', interpretation: 'Slightly below benchmark but consistent with fleet diesel price increases.' },
        { name: 'Subcontractor Cost Ratio', taxpayerValue: 16.2, benchmarkValue: 11.0, unit: '%', variancePct: 47.3, riskLevel: 'HIGH', interpretation: 'Subcontractor ratio is significantly higher than industry benchmark.' }
      ],
      anomalies: [
        {
          id: 'ANM-201',
          severity: 'HIGH',
          title: 'Unremitted WHT on Third-Party Hauliers ($20,000 shortfall)',
          description: 'Payment records indicate $840,000 paid to non-employee truckers with only partial withholding tax deductions.',
          identifiedAt: '2026-09-12',
          auditorNotes: 'Taxpayer cited lack of TINs for individual truckers. Statutory penalty applies.',
          status: 'FLAGGED'
        }
      ],
      auditorSynthesis: 'Analysis reflects consistent operations with specific compliance vulnerability in withholding tax deduction on contracted haulage operators.',
      conclusion: 'Issue WHT deficiency notice.'
    },
    queries: [
      {
        id: 'QRY-201',
        caseId: 'DA-2026-002',
        reference: 'QRY-2026-11',
        subject: 'WHT Exemption Proof for Subcontracted Fleet Operators',
        question: 'Provide valid Tax Exemption Certificates or active TIN proofs for the 35 independent truck owners listed in Schedule B.',
        statutoryBasis: 'Income Tax Act Section 82 - Withholding Tax on Commercial Transport Contracts',
        dueDate: '2026-09-30',
        status: 'OPEN',
        attachedEvidenceIds: ['EVD-201']
      }
    ],
    findings: [
      {
        id: 'FND-201',
        caseId: 'DA-2026-002',
        reference: 'FND-2026-11',
        auditArea: 'Withholding Tax (WHT)',
        title: 'Unremitted Withholding Tax on Subcontracted Transport Services',
        description: 'Failure to deduct and remit statutory 5% withholding tax on $400,000 in payments made to independent freight operators.',
        criteria: 'Income Tax Act Section 82(2) & Tax Administration Act Section 53.',
        condition: 'The taxpayer treated hauliers as exempt casual labor without statutory basis.',
        cause: 'Inadequate tax compliance onboarding for logistics partners.',
        effect: 'WHT tax shortfall of $20,000 plus statutory late payment penalties.',
        underDeclaredAmount: 400000,
        penaltyRate: 20,
        penaltyAmount: 4000,
        interestAmount: 1800,
        totalTaxImpact: 25800,
        auditorAnalysis: 'Commercial transport contracts exceed the statutory exemption threshold of $1,000 per transaction.',
        conclusion: 'Additional WHT assessment required.',
        recommendation: 'Assess $20,000 principal WHT, $4,000 penalty, and $1,800 interest.',
        status: 'CONFIRMED',
        isSignificant: false,
        relatedProcedureId: 'AP-201',
        relatedEvidenceIds: ['EVD-201', 'EVD-202'],
        relatedQueryId: 'QRY-201',
        relatedWorkingPaperId: 'WP-201'
      }
    ],
    workingPapers: [
      {
        id: 'WP-201',
        caseId: 'DA-2026-002',
        reference: 'WP-WHT-01',
        title: 'Fleet Haulier Payments & WHT Reconciliation Schedule',
        category: 'Withholding Tax Reconciliation',
        preparedBy: 'Jane Doe',
        date: '2026-09-14',
        workPerformed: 'Tested 140 vouchers for truck rental and freight payments. Computed WHT under-deduction of $20,000.',
        conclusions: 'Substantiated Finding FND-2026-11.',
        status: 'COMPLETED',
        evidenceIds: ['EVD-201', 'EVD-202'],
        relatedProcedureId: 'AP-201',
        relatedFindingId: 'FND-201'
      }
    ],
    draftReport: {
      caseId: 'DA-2026-002',
      reportReference: 'REP-DA-2026-002-DRAFT',
      generatedDate: '2026-09-15',
      executiveSummary: 'Desk audit of Apex Logistics Hub Ltd identified $20,000 in unremitted Withholding Tax on transport subcontracts.',
      scopeAndObjectives: 'Verification of WHT compliance and fuel levy deductions for FY2024.',
      methodology: 'Desk review of general ledger, payment vouchers, and electronic banking summaries.',
      findingsSummary: 'One material finding in respect of WHT under-deduction on fleet subcontracts.',
      recommendedAdjustments: 'Assess $20,000 in WHT plus statutory penalty of $4,000 and interest.',
      statutoryRecommendations: 'Issue WHT demand notice and recommend supplier registration compliance review.',
      status: 'DRAFT',
      lastUpdated: '2026-09-15T12:00:00Z'
    },
    auditTrail: [
      {
        id: 'TRL-201',
        caseId: 'DA-2026-002',
        user: 'Jane Doe (Auditor)',
        action: 'Case Initialized',
        timestamp: '2026-09-05T09:00:00Z',
        details: 'Desk audit assigned for logistics WHT review.'
      }
    ]
  },

  'CA-2026-101': {
    auditCase: {
      id: 'CA-2026-101',
      caseNumber: 'COMP-LTO-2026-0318',
      tin: 'TIN-7741-9920',
      taxpayerName: 'Trans-National Petrochemical Group PLC',
      tradeName: 'TransPetro Refineries & Polymer Logistics',
      taxPeriod: '2023-2024 (Multi-Year)',
      taxYear: 2024,
      auditType: 'COMPREHENSIVE_AUDIT',
      taxpayerSegment: 'LTO',
      materialityThreshold: 125000,
      samplingMethod: 'Stratified Sampling',
      assignedAuditor: 'Jane Doe',
      auditorEmail: 'jane.doe@itas.gov.tax',
      teamLeader: 'John Smith',
      teamLeaderEmail: 'john.smith@itas.gov.tax',
      startDate: '2026-08-15',
      dueDate: '2026-11-30',
      auditScope: 'Comprehensive on-site and CAAT audit covering Corporate Income Tax, VAT, Withholding Tax, PAYE, Customs import valuations, and multi-zone regional refining operations for FY2023-FY2024.',
      status: 'IN_PROGRESS',
      riskScore: 92,
      riskCategory: 'HIGH',
      riskInformation: 'Automated Risk Engine Flag: Turnovers in VAT returns deviate from CIT gross turnover by $1.82M; automated CAAT algorithms detected unusual inventory shrinkage (+41%) and unexplained payments to offshore tax havens.',
      lastSaved: '14:20:10',
      createdAt: '2026-08-15T09:00:00Z'
    },
    entryConference: {
      caseId: 'CA-2026-101',
      scheduledDate: '2026-08-20',
      time: '10:00 AM',
      venue: 'Taxpayer Executive Boardroom & Refinery Site, Industrial Zone Sector 4',
      attendees: [
        { name: 'Jane Doe', role: 'Lead Tax Auditor', organization: 'Tax Authority (MoR)' },
        { name: 'John Smith', role: 'Audit Team Leader', organization: 'Tax Authority (MoR)' },
        { name: 'Arthur Sterling', role: 'Chief Financial Officer', organization: 'Trans-National Petrochemical' },
        { name: 'Elena Rostova', role: 'VP Tax & Compliance', organization: 'Trans-National Petrochemical' },
        { name: 'David Chen', role: 'Chief Operating Officer / Plant Manager', organization: 'Trans-National Petrochemical' }
      ],
      internalControlsReview: 'Assessed ERP SAP S/4HANA segregation of duties. Noted that warehouse inventory write-off approvals below $50,000 do not require dual CFO authorization, creating a material risk of unauthorized stock write-downs. Fixed asset capitalization policies adhere to IFRS 16.',
      premisesInspectionFindings: 'On-site physical tour of Terminal 3 bulk liquid storage tanks and polymer extrusion unit. Flow meters calibrated in March 2024; automated SCADA data logs were extracted for cross-comparison with sales dispatches.',
      audioRecordingFileName: 'Entrance_Conference_Audio_20260820.m4a',
      taxpayerConfirmedReceipt: true,
      taxpayerReceiptDate: '2026-08-21T16:30:00Z',
      status: 'CONFIRMED',
      lastUpdated: '2026-08-22T11:00:00Z'
    },
    caatAudit: {
      caseId: 'CA-2026-101',
      isCAATEligible: true,
      caatToolName: 'ITAS Automated CAAT Forensic Suite (v4.2)',
      executionTimestamp: '2026-08-25T14:15:00Z',
      samplingMethod: 'Stratified Sampling',
      totalRecordsMined: 18160,
      totalFlaggedExposure: 947500,
      rules: [
        {
          id: 'CAAT-01',
          ruleCode: 'BENFORD-FORENSIC',
          ruleName: "Benford's Law First-Digit Analysis on Vendor Invoices",
          category: 'BENFORD',
          targetLedger: 'General Ledger Account 5200 - Plant Maintenance & Chemical Supplies',
          sampleSize: 4200,
          discrepanciesCount: 84,
          varianceAmount: 184500,
          status: 'FLAGGED',
          details: 'Statistically anomalous spike in digits 7 and 8 in offshore consulting invoices indicating potential artificial threshold structuring.'
        },
        {
          id: 'CAAT-02',
          ruleCode: 'TIMS-SALES-GAP',
          ruleName: 'Automated E-Invoicing vs Sales Ledger Reconciliation',
          category: 'E_INVOICING',
          targetLedger: 'Sales Sub-Ledger 4000 vs Central TIMS Gateway',
          sampleSize: 12500,
          discrepanciesCount: 16,
          varianceAmount: 420000,
          status: 'FLAGGED',
          details: '16 high-value bulk liquid sales dispatches totaling $420,000 recorded in SAP but missing corresponding TIMS fiscal signatures.'
        },
        {
          id: 'CAAT-03',
          ruleCode: 'PAYROLL-GHOST-CHECK',
          ruleName: 'Biometric Attendance vs Monthly Payroll Register',
          category: 'PAYROLL',
          targetLedger: 'HR Payroll Account 6100 vs Security Turnstile Biometrics',
          sampleSize: 1150,
          discrepanciesCount: 3,
          varianceAmount: 28000,
          status: 'RESOLVED',
          details: 'Three expatriate technical advisors lacked physical biometric turnstile swipes; verified as remote cloud automation contractors.'
        },
        {
          id: 'CAAT-04',
          ruleCode: 'WEEKEND-POSTING',
          ruleName: 'Manual Journal Entries Posted on Non-Business Days',
          category: 'JOURNAL_ENTRIES',
          targetLedger: 'Manual Journal Entries (MJE) > $50,000',
          sampleSize: 310,
          discrepanciesCount: 7,
          varianceAmount: 315000,
          status: 'FLAGGED',
          details: 'Seven manual journal adjustments crediting intercompany cost of sales posted at 11:45 PM on year-end holiday weekend.'
        },
        {
          id: 'CAAT-05',
          ruleCode: 'SPLIT-PURCHASE-ORDERS',
          ruleName: 'Split Invoices Structured Below $50,000 Approval Limit',
          category: 'THRESHOLD',
          targetLedger: 'Purchasing & Operational Spares Sub-Ledger 5100',
          sampleSize: 680,
          discrepanciesCount: 3,
          varianceAmount: 148500,
          status: 'FLAGGED',
          details: 'Triplicate invoices for identical machinery components issued within 48 hours to circumvent dual-director authorization.'
        },
        {
          id: 'CAAT-06',
          ruleCode: 'ASYCUDA-CIF-VARIANCE',
          ruleName: 'ASYCUDA Customs Declared CIF vs Local GL Import Debits',
          category: 'CUSTOMS',
          targetLedger: 'Inventory Raw Materials 1300 vs Customs Port Single Administrative Documents',
          sampleSize: 842,
          discrepanciesCount: 5,
          varianceAmount: 2250000,
          status: 'FLAGGED',
          details: 'Transfer pricing markup of $2,250,000 added to feedstock purchases after customs clearance without payment of customs import VAT.'
        },
        {
          id: 'CAAT-07',
          ruleCode: 'DUPLICATE-PAYMENTS',
          ruleName: 'Fuzzy Duplicate Payments on Identical Invoice References',
          category: 'DUPLICATES',
          targetLedger: 'Commercial Bank Clearing Account 1100',
          sampleSize: 2470,
          discrepanciesCount: 2,
          varianceAmount: 46000,
          status: 'RESOLVED',
          details: 'Two duplicate wire transfers to chemical reagent supplier identified; auditee provided credit note confirmation.'
        }
      ],
      benfordStats: [
        { digit: 1, expectedPct: 30.1, observedPct: 24.2, observedCount: 1016, isAnomalous: false, deviation: -5.9 },
        { digit: 2, expectedPct: 17.6, observedPct: 16.5, observedCount: 693, isAnomalous: false, deviation: -1.1 },
        { digit: 3, expectedPct: 12.5, observedPct: 11.8, observedCount: 496, isAnomalous: false, deviation: -0.7 },
        { digit: 4, expectedPct: 9.7, observedPct: 9.2, observedCount: 386, isAnomalous: false, deviation: -0.5 },
        { digit: 5, expectedPct: 7.9, observedPct: 8.1, observedCount: 340, isAnomalous: false, deviation: 0.2 },
        { digit: 6, expectedPct: 6.7, observedPct: 6.9, observedCount: 290, isAnomalous: false, deviation: 0.2 },
        { digit: 7, expectedPct: 5.8, observedPct: 12.4, observedCount: 521, isAnomalous: true, deviation: 6.6 },
        { digit: 8, expectedPct: 5.1, observedPct: 8.3, observedCount: 349, isAnomalous: true, deviation: 3.2 },
        { digit: 9, expectedPct: 4.6, observedPct: 2.6, observedCount: 109, isAnomalous: false, deviation: -2.0 }
      ],
      exceptions: [
        {
          id: 'EXC-001',
          ruleCode: 'TIMS-SALES-GAP',
          transactionRef: 'DISP-2026-0819',
          transactionDate: '2026-06-18',
          accountName: 'Sales 4100 - Bulk Polymer Resins',
          counterparty: 'Apex Petrochem Distributors Ltd',
          amount: 145000,
          anomalyType: 'Missing TIMS Fiscal QR Token',
          riskLevel: 'CRITICAL',
          taxHead: 'VAT',
          status: 'PENDING_REVIEW',
          details: 'Physical dispatch weighbridge log confirmed. Billed in SAP sales ledger but omitted from Central TIMS gateway. Output VAT suppressed.'
        },
        {
          id: 'EXC-002',
          ruleCode: 'TIMS-SALES-GAP',
          transactionRef: 'DISP-2026-0944',
          transactionDate: '2026-07-22',
          accountName: 'Sales 4100 - Bulk Polymer Resins',
          counterparty: 'Equatorial Plastics Manufacturing Ltd',
          amount: 175000,
          anomalyType: 'Fictitious Export Zero-Rating',
          riskLevel: 'CRITICAL',
          taxHead: 'VAT',
          status: 'PENDING_REVIEW',
          details: 'Invoice categorized as 0% zero-rated cross-border export. No ASYCUDA exit port customs clearance certificate on record.'
        },
        {
          id: 'EXC-003',
          ruleCode: 'TIMS-SALES-GAP',
          transactionRef: 'DISP-2026-1102',
          transactionDate: '2026-09-04',
          accountName: 'Sales 4200 - Refinery By-Products',
          counterparty: 'Sahara Industrial Solvents',
          amount: 100000,
          anomalyType: 'Voided Invoice with Valid Weighbridge Delivery',
          riskLevel: 'CRITICAL',
          taxHead: 'CIT',
          status: 'PENDING_REVIEW',
          details: 'Invoice marked "Cancelled - Erroneous Order" 4 minutes after printing; refinery gate-pass confirms 22 metric tons of solvent exited terminal.'
        },
        {
          id: 'EXC-004',
          ruleCode: 'WEEKEND-POSTING',
          transactionRef: 'MJE-2026-8801',
          transactionDate: '2026-06-30 23:48',
          accountName: 'Cost of Goods Sold 5010 - Intercompany Feedstock',
          counterparty: 'Trans-Global Trading (Cayman Islands)',
          amount: 195000,
          anomalyType: 'Off-Hour Supervisory Override',
          riskLevel: 'HIGH',
          taxHead: 'CIT',
          status: 'PENDING_REVIEW',
          details: 'Year-end Sunday midnight adjustment crediting intercompany feedstock payables. Lacks required CFO countersignature and goods received note.'
        },
        {
          id: 'EXC-005',
          ruleCode: 'WEEKEND-POSTING',
          transactionRef: 'MJE-2026-8914',
          transactionDate: '2026-08-30 22:15',
          accountName: 'Admin Expenses 6300 - Offshore Advisory Fees',
          counterparty: 'Apex Management Consultancy BV',
          amount: 120000,
          anomalyType: 'Unapproved Sunday Intercompany Debit',
          riskLevel: 'HIGH',
          taxHead: 'WHT',
          status: 'PENDING_REVIEW',
          details: 'Manual journal debiting technical fees without mandatory 15% non-resident withholding tax deduction ($18,000 WHT exposure).'
        },
        {
          id: 'EXC-006',
          ruleCode: 'BENFORD-FORENSIC',
          transactionRef: 'INV-CONS-7740',
          transactionDate: '2026-04-12',
          accountName: 'Professional & Legal Fees 6200',
          counterparty: 'Vanguard Global Petroleum Advisors',
          amount: 78400,
          anomalyType: 'Benford Digit 7 Threshold Clustering',
          riskLevel: 'HIGH',
          taxHead: 'CIT',
          status: 'PENDING_REVIEW',
          details: 'Repeated invoice structuring between $70,000 - $79,000 right below the $80,000 Board audit committee procurement review threshold.'
        },
        {
          id: 'EXC-007',
          ruleCode: 'BENFORD-FORENSIC',
          transactionRef: 'INV-CONS-7822',
          transactionDate: '2026-05-19',
          accountName: 'Professional & Legal Fees 6200',
          counterparty: 'Vanguard Global Petroleum Advisors',
          amount: 76100,
          anomalyType: 'Benford Digit 7 Cluster Duplicate Scope',
          riskLevel: 'MEDIUM',
          taxHead: 'CIT',
          status: 'PENDING_REVIEW',
          details: 'Second advisory fee billing within 3 weeks describing identical scope of "Regional Petroleum Supply-Chain Optimization".'
        },
        {
          id: 'EXC-008',
          ruleCode: 'SPLIT-PURCHASE-ORDERS',
          transactionRef: 'PO-SPLIT-4401',
          transactionDate: '2026-03-14',
          accountName: 'Plant Spares & Catalysts 5300',
          counterparty: 'Titan Industrial Spares FZE',
          amount: 49500,
          anomalyType: 'Deliberate Splitting Below $50k Limit',
          riskLevel: 'HIGH',
          taxHead: 'CIT',
          status: 'PENDING_REVIEW',
          details: 'First of three $49,500 split purchase orders generated on same day to single vendor to bypass mandatory public tender threshold.'
        },
        {
          id: 'EXC-009',
          ruleCode: 'ASYCUDA-CIF-VARIANCE',
          transactionRef: 'CUST-DEC-9931',
          transactionDate: '2026-02-18',
          accountName: 'Raw Materials Import 1300',
          counterparty: 'ASYCUDA Customs Declaration vs GL',
          amount: 180000,
          anomalyType: 'Post-Clearance Import Cost Markup',
          riskLevel: 'HIGH',
          taxHead: 'CUSTOMS',
          status: 'PENDING_REVIEW',
          details: 'Declared customs CIF value was $620,000 with ASYCUDA release stamp. GL shows $800,000 debit. $180,000 untaxed transfer pricing markup.'
        },
        {
          id: 'EXC-010',
          ruleCode: 'PAYROLL-GHOST-CHECK',
          transactionRef: 'PAY-2026-05-G1',
          transactionDate: '2026-05-28',
          accountName: 'Salaries & Wages 6100',
          counterparty: 'Expatriate Senior Advisor (Staff #EA-09)',
          amount: 28000,
          anomalyType: 'Absence of Physical Biometric Attendance',
          riskLevel: 'LOW',
          taxHead: 'PAYE',
          status: 'DISMISSED',
          details: 'Discrepancy investigated: employee approved for remote refinery digitalization consultancy. Valid withholding tax remittance confirmed.'
        }
      ],
      executionLogs: [
        'Initialized ITAS Automated CAAT Engine v4.2 in compliance with SOR FR-04.4-01 & FR-04.4-02.',
        'Extracted 18,160 SAP journal entries, 12,500 TIMS fiscal tokens, and 842 ASYCUDA customs declarations.',
        'Executed Benford First-Digit distribution: Chi-square test rejected null hypothesis (p=0.0012) due to digits 7 & 8 spikes.',
        'Cross-matched Sales Sub-ledger 4000 against TIMS Central Gateway: isolated 16 un-invoiced shipments ($420,000).',
        'Scanned Manual Journal Entries: isolated 7 off-hour adjustments totaling $315,000 without supervisory authorization.',
        'Substantive CAAT testing complete. 110 total exceptions identified with $947,500 tax exposure.'
      ],
      auditorNotes: 'CAAT algorithms successfully mined 18,160 transactions, isolating 110 priority exceptions totaling $947,500 in potential tax adjustments.'
    },
    balanceSheetItems: [
      {
        id: 'BS-01',
        component: 'Cash & Commercial Bank Balances',
        assertionType: 'Existence',
        auditeeBalance: 8450000,
        auditedBalance: 8450000,
        variance: 0,
        ifrsCompliance: 'COMPLIANT',
        notes: 'Confirmed 100% via direct Central Bank / Commercial API confirmations.'
      },
      {
        id: 'BS-02',
        component: 'Trade Accounts Receivable & Omitted Sales',
        assertionType: 'Completeness',
        auditeeBalance: 14200000,
        auditedBalance: 14620000,
        variance: 420000,
        ifrsCompliance: 'NON_COMPLIANT',
        notes: 'Identified $420,000 in unrecorded polymer deliveries omitted from year-end trade receivables balance.'
      },
      {
        id: 'BS-03',
        component: 'Inventories & Refinery Feedstock',
        assertionType: 'Valuation & Allocation',
        auditeeBalance: 22800000,
        auditedBalance: 21950000,
        variance: -850000,
        ifrsCompliance: 'PARTIAL',
        notes: 'Excessive stock write-down of $850,000 claimed as physical evaporation loss. Normal technical benchmark is 0.4%; taxpayer claimed 3.8%.'
      },
      {
        id: 'BS-04',
        component: 'Property, Plant & Equipment (Depreciation)',
        assertionType: 'Valuation & Allocation',
        auditeeBalance: 48600000,
        auditedBalance: 48600000,
        variance: 0,
        ifrsCompliance: 'COMPLIANT',
        notes: 'Wear-and-tear allowance rates recomputed; capitalization of catalyst beds verified under IFRS.'
      },
      {
        id: 'BS-05',
        component: 'Trade Accounts Payable & Accrued Liabilities',
        assertionType: 'Completeness',
        auditeeBalance: 16400000,
        auditedBalance: 16400000,
        variance: 0,
        ifrsCompliance: 'COMPLIANT',
        notes: 'Circularized top 25 vendors; no omitted trade liabilities detected.'
      },
      {
        id: 'BS-06',
        component: 'Intercompany Balances & Offshore Shell Advances',
        assertionType: 'Rights & Obligations',
        auditeeBalance: 6200000,
        auditedBalance: 4900000,
        variance: -1300000,
        ifrsCompliance: 'NON_COMPLIANT',
        notes: '$1,300,000 booked as management charge payable to Cayman affiliate lacking transfer pricing economic substance.'
      }
    ],
    reconciliations: {
      caseId: 'CA-2026-101',
      vatVsSales: {
        annualVatSalesDeclared: 68400000,
        annualCitGrossTurnover: 70220000,
        timsElectronicInvoices: 67980000,
        variance: 1820000,
        status: 'DISCREPANCY_FLAGGED',
        notes: 'Gross revenue declared in audited CIT return exceeds monthly VAT returns by $1,820,000. Taxpayer claimed difference represents exempt bonded exports, but customs bill of lading proofs are absent.'
      },
      payrollPayeVsPnL: {
        payrollPayeRemitted: 3450000,
        pnlSalariesExpense: 3890000,
        variance: 440000,
        status: 'DISCREPANCY_FLAGGED',
        notes: 'Discrepancy of $440,000 between staff cost in Profit & Loss Account and 12-month PAYE returns. Comprises un-taxed executive housing allowances and non-cash vehicle benefits.'
      },
      customsImportsVsPurchases: {
        asycudaCifImports: 24100000,
        generalLedgerImportCosts: 26350000,
        variance: 2250000,
        status: 'DISCREPANCY_FLAGGED',
        notes: 'ASYCUDA customs import CIF values are $2,250,000 lower than purchase debits in GL. Differential relates to transfer pricing uplift added after customs clearance.'
      }
    },
    exitConference: {
      caseId: 'CA-2026-101',
      scheduledDate: '2026-11-05',
      time: '02:00 PM',
      venue: 'Regional Tax Center, Executive Briefing Room A',
      agendaItems: [
        'Presentation of Substantive Comprehensive Audit Findings',
        'Discussion on VAT vs CIT Turnover Discrepancy ($1,820,000)',
        'Review of Disallowed Offshore Intercompany Management Charges',
        'Assessment of Unsubstantiated Polymer Shrinkage Write-Downs',
        'Review of Multi-Zone Regional Allocation Schedule',
        'Formal Notice of Assessment & Statutory 30-Day Objection Rights'
      ],
      discussionNotes: 'Auditor presented findings and statutory grounds. Taxpayer legal counsel requested 14 days to compile additional customs bonded manifests.',
      taxpayerResponseNotes: 'Taxpayer acknowledged PAYE discrepancy on executive housing and agreed to settle $132,000 in principle. Disputed inventory shrinkage disallowance.',
      attendanceConfirmed: true,
      signedByTaxpayer: true,
      signedDate: '2026-11-05T17:15:00Z',
      status: 'COMPLETED'
    },
    assessmentNotice: {
      caseId: 'CA-2026-101',
      noticeNumber: 'NOT-COMP-2026-0318',
      issueDate: '2026-11-10',
      statutoryDue30Days: '2026-12-10',
      principalTax: 584000,
      statutoryPenalty20: 116800,
      interest: 46720,
      totalAssessmentDue: 747520,
      objectionStatus: 'NONE',
      fraudReferralTriggered: false
    },
    multiZoneAllocations: [
      {
        zoneName: 'Northern Terminal & Refinery Zone',
        branchCode: 'ZONE-NORTH-01',
        taxDeclared: 14200000,
        auditAdjustment: 385000,
        netPayable: 14585000
      },
      {
        zoneName: 'Central Polymer Distribution Hub',
        branchCode: 'ZONE-CENTRAL-02',
        taxDeclared: 9800000,
        auditAdjustment: 242520,
        netPayable: 10042520
      },
      {
        zoneName: 'Coastal Port Deep-Water Export Facility',
        branchCode: 'ZONE-COAST-03',
        taxDeclared: 6500000,
        auditAdjustment: 120000,
        netPayable: 6620000
      }
    ],
    evidence: [
      {
        id: 'EVD-C01',
        caseId: 'CA-2026-101',
        reference: 'EVD-2026-301',
        description: 'Audited Financial Statements FY2023-FY2024 signed by Big Four accounting firm with trial balance ledger dump',
        source: 'Taxpayer Submission',
        date: '2026-08-18',
        relatedProcedureId: 'AP-C01',
        status: 'Verified',
        fileName: 'TransPetro_AFS_TrialBalance_2023_2024.pdf',
        fileSize: '14.8 MB',
        fileType: 'application/pdf',
        uploadedBy: 'Jane Doe'
      },
      {
        id: 'EVD-C02',
        caseId: 'CA-2026-101',
        reference: 'EVD-2026-302',
        description: 'Customs ASYCUDA Integrated Import Declarations Register (842 Shipments)',
        source: 'Customs Declaration (ASYCUDA)',
        date: '2026-08-22',
        relatedProcedureId: 'AP-C04',
        status: 'Verified',
        fileName: 'ASYCUDA_Import_Declarations_Crude_Polymers.xlsx',
        fileSize: '8.4 MB',
        fileType: 'application/vnd.ms-excel',
        uploadedBy: 'Jane Doe'
      },
      {
        id: 'EVD-C03',
        caseId: 'CA-2026-101',
        reference: 'EVD-2026-303',
        description: 'Electronic Invoicing System (TIMS) 24-Month Automated Ledger Matching Log',
        source: 'Electronic Invoicing System (TIMS)',
        date: '2026-08-25',
        relatedProcedureId: 'AP-C02',
        status: 'Verified',
        fileName: 'TIMS_Automated_Audit_Log_24M.csv',
        fileSize: '12.1 MB',
        fileType: 'text/csv',
        uploadedBy: 'Jane Doe'
      },
      {
        id: 'EVD-C04',
        caseId: 'CA-2026-101',
        reference: 'EVD-2026-304',
        description: 'Commercial Bank Account API Verifications (6 Accounts across 3 Tier-1 Banks)',
        source: 'Third-Party Bank Confirmation',
        date: '2026-08-28',
        relatedProcedureId: 'AP-C01',
        status: 'Verified',
        fileName: 'Bank_API_Direct_Reconciliations.pdf',
        fileSize: '4.6 MB',
        fileType: 'application/pdf',
        uploadedBy: 'Jane Doe'
      }
    ],
    procedures: [
      {
        id: 'AP-C01',
        caseId: 'CA-2026-101',
        reference: 'AP-C01',
        title: 'Balance Sheet Financial Assertions & Fixed Assets Audit',
        objective: 'Substantiate existence, completeness, and rights of capital refinery equipment ($48.6M) and verify wear-and-tear allowances.',
        description: 'Conduct on-site tag verification of catalytic crackers and distillation columns; match fixed asset additions against ASYCUDA import entries.',
        status: 'COMPLETED',
        assignedAuditor: 'Jane Doe',
        dueDate: '2026-09-15',
        result: 'Verified $48.6M asset base. Capital allowance computations accurate under Tax Act Sixth Schedule.',
        conclusion: 'No material variance in PPE depreciation deductions.',
        observations: 'Asset register maintained with serial numbers; physical condition aligns with declared age.',
        evidenceIds: ['EVD-C01', 'EVD-C04'],
        isMandatory: true,
        assertionType: 'Existence',
        caatTechnique: 'Automated Asset Tag Reconciliation'
      },
      {
        id: 'AP-C02',
        caseId: 'CA-2026-101',
        reference: 'AP-C02',
        title: '12-Month VAT Returns vs Profit Tax Gross Sales Reconciliation',
        objective: 'Reconcile turnover declared on monthly VAT-03 filings against annual CIT gross income statement revenues.',
        description: 'Run automated script matching TIMS electronic fiscal receipts, monthly VAT declarations, and audited income statements.',
        status: 'COMPLETED',
        assignedAuditor: 'Jane Doe',
        dueDate: '2026-09-25',
        result: 'Identified unexplained turnover suppression of $1,820,000 in monthly VAT declarations.',
        conclusion: 'Additional output VAT of $291,200 (16%) payable plus 20% statutory penalty.',
        observations: 'Taxpayer recorded 16 domestic sales dispatches as zero-rated export sales without valid customs bill of lading.',
        evidenceIds: ['EVD-C03'],
        isMandatory: true,
        assertionType: 'Completeness',
        caatTechnique: 'TIMS High-Frequency Sales Matcher'
      },
      {
        id: 'AP-C03',
        caseId: 'CA-2026-101',
        reference: 'AP-C03',
        title: 'Payroll PAYE Remittances vs P&L Salaries Expense Reconciliation',
        objective: 'Verify that all remuneration and executive perquisites deducted in P&L were subjected to statutory PAYE withholding.',
        description: 'Match annual payroll general ledger debits ($3,890,000) against aggregate 12-month PAYE returns ($3,450,000).',
        status: 'COMPLETED',
        assignedAuditor: 'Jane Doe',
        dueDate: '2026-09-30',
        result: 'Variance of $440,000 traced to un-taxed executive housing allowances and offshore bonus payments.',
        conclusion: 'Taxable PAYE shortfall of $132,000 (30% marginal rate) assessed.',
        observations: 'Executive service contracts structured with offshore allowances not declared in local payroll.',
        evidenceIds: ['EVD-C01'],
        isMandatory: true,
        assertionType: 'Completeness',
        caatTechnique: 'Payroll Ledger Reconciliation Tool'
      },
      {
        id: 'AP-C04',
        caseId: 'CA-2026-101',
        reference: 'AP-C04',
        title: 'Customs ASYCUDA Import Valuation vs Purchase Ledger Testing',
        objective: 'Cross-check chemical feedstock import declarations with raw material purchases in cost of goods sold.',
        description: 'Extract customs CIF values for 842 import containers; cross-match with general ledger vendor accounts.',
        status: 'COMPLETED',
        assignedAuditor: 'Jane Doe',
        dueDate: '2026-10-10',
        result: '$2,250,000 transfer pricing cost uplift added to purchase ledger after customs clearance.',
        conclusion: 'Disallowance of $2,250,000 non-substantiated cost uplift from taxable income.',
        observations: 'Purchase invoices from related Swiss trading entity marked up by 9.3% without economic substance.',
        evidenceIds: ['EVD-C02'],
        isMandatory: true,
        assertionType: 'Valuation',
        caatTechnique: 'ASYCUDA Automated Import Bridge'
      },
      {
        id: 'AP-C05',
        caseId: 'CA-2026-101',
        reference: 'AP-C05',
        title: 'CAAT Forensic Ledger Mining & Benford Statistical Testing',
        objective: 'Apply forensic algorithms to 18,160 manual journal entries and vendor disbursements.',
        description: 'Execute Benford Law first-digit test, weekend posting test, and round-sum threshold queries.',
        status: 'COMPLETED',
        assignedAuditor: 'Jane Doe',
        dueDate: '2026-10-15',
        result: 'Isolated 7 abnormal weekend manual journal entries totaling $315,000 crediting offshore affiliate accounts.',
        conclusion: 'Finding established under FND-C02 for offshore management charge disallowance.',
        observations: 'Journal entries lacked supporting documentation or approvals from CFO.',
        evidenceIds: ['EVD-C01'],
        isMandatory: true,
        assertionType: 'Valuation',
        caatTechnique: 'Benford Law Forensic Engine'
      },
      {
        id: 'AP-C06',
        caseId: 'CA-2026-101',
        reference: 'AP-C06',
        title: 'Inventory Feedstock Shrinkage & Fuel Losses Verification',
        objective: 'Test legitimacy of $850,000 inventory write-off claimed as technical handling evaporation.',
        description: 'Audit technical refinery mass-balance logs, meter readings, and industry evaporation thresholds.',
        status: 'IN_PROGRESS',
        assignedAuditor: 'Jane Doe',
        dueDate: '2026-10-25',
        result: 'Technical standard is 0.4%; taxpayer claimed 3.8% write-off ($850,000). Excess of $640,000 unsupported.',
        conclusion: 'Proposed disallowance of $640,000 excess shrinkage.',
        observations: 'Plant engineering logs do not indicate any catastrophic leakages or venting events.',
        evidenceIds: ['EVD-C01'],
        isMandatory: true,
        assertionType: 'Valuation',
        caatTechnique: 'Mass Balance Variance Analyzer'
      },
      {
        id: 'AP-C07',
        caseId: 'CA-2026-101',
        reference: 'AP-C07',
        title: 'IFRS Method of Accounting & Long-Term Contracts Review',
        objective: 'Assess compliance with IFRS 15 (Revenue from Contracts with Customers) and IFRS 16.',
        description: 'Review percentage-of-completion calculations for 3 long-term petrochemical construction projects.',
        status: 'IN_PROGRESS',
        assignedAuditor: 'Jane Doe',
        dueDate: '2026-10-30',
        result: 'Revenue recognized prematurely on uncompleted phase 2 expansion.',
        conclusion: 'Timing adjustment of $210,000 required.',
        observations: 'Taxpayer deferred billings while accelerating cost recognition.',
        evidenceIds: ['EVD-C01'],
        isMandatory: false,
        assertionType: 'Presentation',
        caatTechnique: 'Contract Milestones Analyzer'
      },
      {
        id: 'AP-C08',
        caseId: 'CA-2026-101',
        reference: 'AP-C08',
        title: 'Multi-Zone Regional Refining Turnover Consolidation Audit',
        objective: 'Verify consolidated regional reporting across Northern, Central, and Coastal operations.',
        description: 'Segregate revenues and costs by regional jurisdiction to ensure correct revenue apportionment.',
        status: 'COMPLETED',
        assignedAuditor: 'Jane Doe',
        dueDate: '2026-11-02',
        result: 'Apportioned audit adjustments across 3 regional branches; consolidated total equals $747,520.',
        conclusion: 'Regional assessment schedules ready for multi-zone issuance.',
        observations: 'Northern Terminal accounts for 51.5% of total tax adjustment.',
        evidenceIds: ['EVD-C01'],
        isMandatory: true,
        assertionType: 'Presentation',
        caatTechnique: 'Multi-Branch Ledger Consolidator'
      }
    ],
    analysis: {
      caseId: 'CA-2026-101',
      annualFinancials: [
        {
          year: '2022',
          revenue: 54200000,
          cogs: 38900000,
          grossProfit: 15300000,
          operatingExpenses: 8900000,
          taxableIncome: 6400000,
          taxDeclared: 1920000,
          vatOutput: 8672000,
          vatInput: 5835000,
          vatPayable: 2837000
        },
        {
          year: '2023',
          revenue: 62800000,
          cogs: 46200000,
          grossProfit: 16600000,
          operatingExpenses: 10400000,
          taxableIncome: 6200000,
          taxDeclared: 1860000,
          vatOutput: 10048000,
          vatInput: 7161000,
          vatPayable: 2887000
        },
        {
          year: '2024',
          revenue: 70220000,
          cogs: 55800000,
          grossProfit: 14420000,
          operatingExpenses: 12100000,
          taxableIncome: 2320000,
          taxDeclared: 696000,
          vatOutput: 11235200,
          vatInput: 9680000,
          vatPayable: 1555200
        }
      ],
      quarterlyData: [
        { quarter: 'Q1 2024', revenue: 16800000, cogs: 13200000, expenses: 2900000, vatInputClaimed: 2280000, variance: 3.8, notes: 'Crude oil refining normal' },
        { quarter: 'Q2 2024', revenue: 17400000, cogs: 13800000, expenses: 3000000, vatInputClaimed: 2390000, variance: 4.2, notes: 'Polymer demand steady' },
        { quarter: 'Q3 2024', revenue: 17600000, cogs: 14400000, expenses: 3100000, vatInputClaimed: 2510000, variance: 14.8, notes: 'Unusual inventory write-off of $850k' },
        { quarter: 'Q4 2024', revenue: 18420000, cogs: 14400000, expenses: 3100000, vatInputClaimed: 2500000, variance: 5.1, notes: 'Year-end intercompany management adjustments' }
      ],
      ratios: [
        {
          name: 'Gross Profit Margin',
          taxpayerValue: 20.5,
          benchmarkValue: 27.8,
          unit: '%',
          variancePct: -26.3,
          riskLevel: 'HIGH',
          interpretation: 'Gross margin collapsed by 7.3% compared to industry petrochemical refineries.'
        },
        {
          name: 'Effective Tax Rate',
          taxpayerValue: 0.99,
          benchmarkValue: 3.45,
          unit: '% of Revenue',
          variancePct: -71.3,
          riskLevel: 'HIGH',
          interpretation: 'Declared CIT plunged by 62.5% despite $7.4M topline revenue expansion.'
        },
        {
          name: 'Feedstock Shrinkage Ratio',
          taxpayerValue: 3.8,
          benchmarkValue: 0.4,
          unit: '% of Stock',
          variancePct: 850.0,
          riskLevel: 'HIGH',
          interpretation: 'Evaporation and transit shrinkage claimed is 9.5 times higher than technical engineering standards.'
        },
        {
          name: 'Input VAT / Output VAT Ratio',
          taxpayerValue: 86.2,
          benchmarkValue: 64.0,
          unit: '%',
          variancePct: 34.7,
          riskLevel: 'HIGH',
          interpretation: 'Input tax claimed heavily exceeds industry norms due to unverified subcontractor fiscal claims.'
        }
      ],
      anomalies: [
        {
          id: 'ANM-C01',
          severity: 'CRITICAL',
          title: 'VAT Return Turnover vs CIT Income Gap ($1.82M)',
          description: 'CIT audited accounts show $70.22M gross turnover while 12 monthly VAT-03 declarations only totaled $68.40M.',
          identifiedAt: '2026-08-20',
          auditorNotes: 'Audit Procedure AP-C02 established omitted domestic sales dispatches misclassified as zero-rated exports.',
          status: 'INVESTIGATED'
        },
        {
          id: 'ANM-C02',
          severity: 'HIGH',
          title: 'Abnormal Feedstock Shrinkage Claim ($850,000)',
          description: 'Taxpayer deducted $850,000 for physical feedstock transit loss, exceeding statutory engineering norm of 0.4% by 850%.',
          identifiedAt: '2026-08-24',
          auditorNotes: 'SCADA flow meters show no pipeline ruptures. $640,000 disallowed under FND-C03.',
          status: 'INVESTIGATED'
        },
        {
          id: 'ANM-C03',
          severity: 'CRITICAL',
          title: 'Offshore Management Fee Outflows ($1.30M)',
          description: 'Payment of $1,300,000 to Cayman shell without transfer pricing documentation or proof of services rendered.',
          identifiedAt: '2026-08-26',
          auditorNotes: 'Procedure AP-C05 and CAAT forensic run isolated manual holiday journal entries with no timesheets.',
          status: 'FLAGGED'
        }
      ],
      auditorSynthesis: 'Comprehensive multi-disciplinary examination confirmed systemic income deflation. The taxpayer suppressed $1.82M in taxable turnover on VAT returns, deducted $1.30M in fictitious offshore management charges, and wrote off $640,000 in unsupported feedstock shrinkage. Total tax exposure exceeds $747,520.',
      conclusion: 'Issue formal Assessment Notice for $747,520 across Northern, Central, and Coastal operations. Retain case for potential fraud referral if objection is unsupported.'
    },
    queries: [
      {
        id: 'QRY-C01',
        caseId: 'CA-2026-101',
        reference: 'QRY-COMP-01',
        subject: 'Reconciliation of $1,820,000 Discrepancy between VAT Returns and Audited CIT Turnover',
        question: 'Provide certified customs export declaration manifests, commercial bills of lading, and foreign currency bank inward remittance proofs for the $1,820,000 in supplies declared as zero-rated exports during FY2024.',
        statutoryBasis: 'Value Added Tax Act Section 14 (Zero-Rating Proof) & Tax Administration Act Section 42',
        dueDate: '2026-09-20',
        status: 'RESOLVED',
        attachedEvidenceIds: ['EVD-C01', 'EVD-C03'],
        taxpayerResponse: {
          respondedAt: '2026-09-18T14:20:00Z',
          responseText: 'The $1,820,000 was delivered to bonded warehouse tanks for regional re-export. We were unable to retrieve full bill of lading copies from shipping agent before deadline.',
          attachedDocuments: ['Bonded_Warehouse_Dispatches_Sample.pdf'],
          responderName: 'Arthur Sterling, CFO'
        },
        resolutionNotes: 'Taxpayer failed to produce statutory export customs documentation. Zero-rated status rejected; 16% standard VAT plus 20% statutory penalty assessed under FND-C01.',
        resolvedAt: '2026-09-22T10:00:00Z',
        resolvedBy: 'Jane Doe'
      },
      {
        id: 'QRY-C02',
        caseId: 'CA-2026-101',
        reference: 'QRY-COMP-02',
        subject: 'Engineering Substantiation for 3.8% Polymer Feedstock Transit Shrinkage ($850,000)',
        question: 'Furnish independent engineering calibration certificates and incident reports justifying feedstock evaporation and transit losses of $850,000 exceeding the 0.4% industry benchmark.',
        statutoryBasis: 'Corporate Income Tax Act Section 16(1) (Wholly & Exclusively Incurred Rule)',
        dueDate: '2026-10-15',
        status: 'RESOLVED',
        attachedEvidenceIds: ['EVD-C01'],
        taxpayerResponse: {
          respondedAt: '2026-10-12T11:00:00Z',
          responseText: 'Our internal engineering log recorded unusually high ambient temperatures in storage tanks during July and August 2024.',
          attachedDocuments: ['Terminal_Temperature_Readings.pdf'],
          responderName: 'David Chen, COO'
        },
        resolutionNotes: 'Ambient temperature variations do not justify polymer granule shrinkage. Normal tolerance applied; $640,000 disallowed under FND-C03.',
        resolvedAt: '2026-10-18T16:00:00Z',
        resolvedBy: 'Jane Doe'
      }
    ],
    findings: [
      {
        id: 'FND-C01',
        caseId: 'CA-2026-101',
        reference: 'FND-COMP-01',
        auditArea: 'Value Added Tax (VAT)',
        title: 'Unreconciled Gross Sales between VAT Returns and Audited Financial Accounts',
        description: 'Taxpayer declared $68,400,000 in monthly VAT returns while audited corporate accounts recorded $70,220,000, leaving $1,820,000 in taxable supplies omitted from VAT declarations.',
        criteria: 'Value Added Tax Act Section 5 & Section 14 (Zero-Rating Proof Requirements).',
        condition: '16 high-value sales dispatches totaling $1,820,000 omitted from TIMS electronic fiscal invoicing and monthly VAT-03 declarations.',
        cause: 'Taxpayer treated bonded sales as export without mandatory customs departure certificates.',
        effect: 'Unremitted Output VAT of $291,200 plus statutory 20% penalty and interest.',
        underDeclaredAmount: 1820000,
        penaltyRate: 20,
        penaltyAmount: 58240,
        interestAmount: 26208,
        totalTaxImpact: 375648,
        auditorAnalysis: 'Supplies delivered domestically without proof of crossing national borders are deemed standard-rated supplies under VAT Act.',
        conclusion: 'Additional output VAT assessment of $291,200 plus statutory penalty of $58,240 and interest.',
        recommendation: 'Issue Section 45 Assessment Notice and require real-time integration of ERP sales dispatch with TIMS gateway.',
        status: 'CONFIRMED',
        isSignificant: true,
        indicatesFraud: false,
        relatedProcedureId: 'AP-C02',
        relatedEvidenceIds: ['EVD-C01', 'EVD-C03'],
        relatedQueryId: 'QRY-C01',
        relatedWorkingPaperId: 'WP-C02',
        zoneAllocation: 'Northern Terminal (55%), Central Hub (45%)'
      },
      {
        id: 'FND-C02',
        caseId: 'CA-2026-101',
        reference: 'FND-COMP-02',
        auditArea: 'Corporate Income Tax',
        title: 'Disallowance of Non-Arm’s Length Offshore Intercompany Management Fees',
        description: 'Deduction of $1,300,000 paid to related entity in Cayman Islands without transfer pricing documentation, timesheets, or evidence of services rendered.',
        criteria: 'Corporate Income Tax Act Section 16(1) and Transfer Pricing Regulations Section 8 (Arm’s Length Principle).',
        condition: 'Manual journal entries posted at year-end debiting management fee expenses and crediting intercompany payables. No deliverables provided.',
        cause: 'Artificial profit shifting to minimize domestic corporate tax liability.',
        effect: 'Understatement of taxable corporate profit by $1,300,000, resulting in unpaid CIT of $390,000.',
        underDeclaredAmount: 1300000,
        penaltyRate: 20,
        penaltyAmount: 78000,
        interestAmount: 35100,
        totalTaxImpact: 503100,
        auditorAnalysis: 'Expenditure fails the statutory wholly and exclusively test. No transfer pricing local file or master file was submitted.',
        conclusion: 'Full disallowance of $1,300,000 added back to taxable income.',
        recommendation: 'Assess $390,000 additional CIT plus mandatory 20% penalty for incorrect return.',
        status: 'CONFIRMED',
        isSignificant: true,
        indicatesFraud: false,
        relatedProcedureId: 'AP-C05',
        relatedEvidenceIds: ['EVD-C01'],
        relatedWorkingPaperId: 'WP-C04',
        zoneAllocation: 'Central Polymer Distribution Hub (100%)'
      },
      {
        id: 'FND-C03',
        caseId: 'CA-2026-101',
        reference: 'FND-COMP-03',
        auditArea: 'Customs & Excise / Inventory',
        title: 'Unsubstantiated Feedstock Evaporation & Shrinkage Write-Down',
        description: 'Excessive inventory write-off of $640,000 exceeding the 0.4% engineering evaporation threshold without statutory loss certificates.',
        criteria: 'Income Tax Act Section 16(2) & Excise Management Act Section 28 (Permissible Manufacturing Losses).',
        condition: 'Stock records reflected 3.8% physical evaporation loss, while SCADA pipeline telemetry confirmed continuous normal operations.',
        cause: 'Fictitious loss claim to depress closing inventory and artificially inflate Cost of Goods Sold.',
        effect: 'Taxable profit understated by $640,000; unpaid CIT of $192,000.',
        underDeclaredAmount: 640000,
        penaltyRate: 20,
        penaltyAmount: 38400,
        interestAmount: 17280,
        totalTaxImpact: 247680,
        auditorAnalysis: 'Technical losses in excess of standard benchmarks require formal notification to the Revenue Authority within 48 hours, which was not done.',
        conclusion: 'Add-back of $640,000 to closing inventory.',
        recommendation: 'Assess $192,000 additional CIT plus 20% penalty. Monitor stock reconciliation monthly.',
        status: 'CONFIRMED',
        isSignificant: true,
        indicatesFraud: true,
        fraudIndicators: 'SCADA flow meters contradict physical loss logs; suspected unrecorded off-book sales of finished polymers.',
        relatedProcedureId: 'AP-C06',
        relatedEvidenceIds: ['EVD-C01'],
        relatedQueryId: 'QRY-C02',
        relatedWorkingPaperId: 'WP-C03',
        zoneAllocation: 'Northern Terminal (80%), Coastal Port (20%)'
      }
    ],
    workingPapers: [
      {
        id: 'WP-C01',
        caseId: 'CA-2026-101',
        reference: 'WP-COMP-01',
        title: 'Balance Sheet Financial Assertions & Fixed Assets Audit File',
        category: 'Asset Register Audit',
        preparedBy: 'Jane Doe',
        date: '2026-09-12',
        workPerformed: 'Substantiated physical existence of $48.6M in catalytic crackers and tank farms. Recomputed tax wear-and-tear allowances.',
        conclusions: 'Fixed assets verified; no audit adjustments required.',
        status: 'COMPLETED',
        evidenceIds: ['EVD-C01', 'EVD-C04'],
        relatedProcedureId: 'AP-C01'
      },
      {
        id: 'WP-C02',
        caseId: 'CA-2026-101',
        reference: 'WP-COMP-02',
        title: 'VAT vs CIT Gross Revenue & TIMS Invoicing Reconciliation Schedule',
        category: 'Revenue Reconciliation',
        preparedBy: 'Jane Doe',
        date: '2026-09-24',
        workPerformed: 'Reconciled monthly VAT-03 declarations against annual audited turnover. Tested 16 omitted sales dispatches against TIMS logs.',
        conclusions: '$1,820,000 omitted turnover confirmed under FND-COMP-01.',
        status: 'COMPLETED',
        evidenceIds: ['EVD-C01', 'EVD-C03'],
        relatedProcedureId: 'AP-C02',
        relatedFindingId: 'FND-C01'
      },
      {
        id: 'WP-C03',
        caseId: 'CA-2026-101',
        reference: 'WP-COMP-03',
        title: 'Inventory Mass-Balance & Evaporation Shrinkage Testing Schedule',
        category: 'Expense Sampling & Testing',
        preparedBy: 'Jane Doe',
        date: '2026-10-14',
        workPerformed: 'Compared mass-balance production logs with SCADA flow meter telemetry. Identified 3.4% excessive shrinkage claim ($640,000).',
        conclusions: 'Substantiated Finding FND-COMP-03 with fraud indicator flag.',
        status: 'COMPLETED',
        evidenceIds: ['EVD-C01'],
        relatedProcedureId: 'AP-C06',
        relatedFindingId: 'FND-C03'
      },
      {
        id: 'WP-C04',
        caseId: 'CA-2026-101',
        reference: 'WP-COMP-04',
        title: 'CAAT Forensic Ledger Mining & Benford Statistical Sampling Schedule',
        category: 'Expense Sampling & Testing',
        preparedBy: 'Jane Doe',
        date: '2026-10-16',
        workPerformed: 'Executed ITAS CAAT Forensic Suite on 18,160 GL transactions. Isolated 7 unapproved holiday journal adjustments.',
        conclusions: 'Substantiated Finding FND-COMP-02 for $1,300,000 offshore fee disallowance.',
        status: 'COMPLETED',
        evidenceIds: ['EVD-C01'],
        relatedProcedureId: 'AP-C05',
        relatedFindingId: 'FND-C02'
      },
      {
        id: 'WP-C05',
        caseId: 'CA-2026-101',
        reference: 'WP-COMP-05',
        title: 'Multi-Zone Regional Turnover & Tax Allocation Schedule',
        category: 'Tax Reconciliation',
        preparedBy: 'Jane Doe',
        date: '2026-11-01',
        workPerformed: 'Apportioned additional tax liability of $747,520 across Northern, Central, and Coastal operations based on verified regional ledgers.',
        conclusions: 'Multi-zone schedule verified and agreed with regional branch coordinators.',
        status: 'COMPLETED',
        evidenceIds: ['EVD-C01'],
        relatedProcedureId: 'AP-C08'
      }
    ],
    draftReport: {
      caseId: 'CA-2026-101',
      reportReference: 'REP-COMP-2026-0318-DRAFT',
      generatedDate: '2026-11-02',
      executiveSummary: 'A comprehensive multi-disciplinary tax audit was conducted on Trans-National Petrochemical Group PLC (TIN: 7741-9920) for fiscal years 2023-2024. The audit established material tax shortfalls totaling $747,520 (comprising principal tax $584,000, statutory penalties $116,800, and interest $46,720) across Corporate Income Tax, VAT, and PAYE, distributed across Northern, Central, and Coastal regional operating zones.',
      scopeAndObjectives: 'The comprehensive audit encompassed on-site physical examinations, automated CAAT forensic ledger interrogation, multi-year VAT vs CIT turnover reconciliations, customs ASYCUDA import matching, and multi-zone operational review under SOR FR-04.4.',
      methodology: 'The audit deployed ITAS CAAT forensic data mining on 18,160 SAP transactions, on-site terminal inspection, circularization of commercial bank accounts, and statutory query sheets under Tax Administration Act provisions.',
      findingsSummary: 'Three confirmed findings: (1) Omission of $1,820,000 in taxable turnover from VAT returns; (2) Disallowance of $1,300,000 in non-arm’s-length offshore management charges; (3) Denial of $640,000 in unsubstantiated feedstock inventory shrinkage write-offs.',
      recommendedAdjustments: '1. Output VAT shortfall assessment: $291,200 plus 20% penalty.\n2. Corporate Income Tax additional assessment on $1,940,000 disallowed costs: $582,000 plus penalty.\n3. PAYE executive allowance adjustments: $132,000.\nTotal assessment notice value: $747,520.',
      statutoryRecommendations: 'Issue formal Notice of Additional Assessment under Section 45 with 30 days statutory objection period. In the event of substantiated off-book sales, trigger referral to Intelligence and Tax Fraud Investigation Directorate.',
      status: 'DRAFT',
      lastUpdated: '2026-11-02T16:00:00Z'
    },
    auditTrail: [
      {
        id: 'TRL-C01',
        caseId: 'CA-2026-101',
        user: 'Risk Directorate',
        action: 'Case Selected on Risk Basis',
        timestamp: '2026-08-15T09:00:00Z',
        details: 'Risk score 92/100 (High) - Flagged turnover mismatch between VAT and CIT.'
      },
      {
        id: 'TRL-C02',
        caseId: 'CA-2026-101',
        user: 'Jane Doe (Auditor)',
        action: 'Entrance Conference Conducted',
        timestamp: '2026-08-20T10:00:00Z',
        details: 'Entrance meeting held with CFO Arthur Sterling. Physical plant tour conducted.'
      },
      {
        id: 'TRL-C03',
        caseId: 'CA-2026-101',
        user: 'Jane Doe (Auditor)',
        action: 'CAAT Automated Execution',
        timestamp: '2026-08-25T14:15:00Z',
        details: 'ITAS CAAT Forensic Suite analyzed 18,160 transactions; isolated 110 anomalies.'
      },
      {
        id: 'TRL-C04',
        caseId: 'CA-2026-101',
        user: 'Jane Doe (Auditor)',
        action: 'Finding Established',
        timestamp: '2026-09-25T16:30:00Z',
        details: 'Confirmed FND-COMP-01: $1.82M VAT vs CIT turnover suppression.'
      },
      {
        id: 'TRL-C05',
        caseId: 'CA-2026-101',
        user: 'Jane Doe (Auditor)',
        action: 'Exit Conference Completed',
        timestamp: '2026-11-05T17:15:00Z',
        details: 'Exit conference conducted; minutes signed by taxpayer CFO.'
      }
    ]
  }
};
