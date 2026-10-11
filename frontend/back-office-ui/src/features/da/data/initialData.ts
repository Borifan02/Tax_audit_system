import {
  AuditCase,
  EvidenceItem,
  AuditProcedure,
  TaxAnalysis,
  TaxQuery,
  AuditFinding,
  WorkingPaper,
  DraftReport,
  AuditTrailEntry
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
}

export const INITIAL_CASES_DATA: Record<string, CaseFullData> = {
  'DA-2026-001': {
    auditCase: {
      id: 'DA-2026-001',
      caseNumber: 'DA-2026-001-CASE',
      tin: 'TIN-123456789',
      taxpayerName: 'Acme Corp',
      tradeName: 'Acme Corp IT Services & Cloud Hosting',
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
  }
};
