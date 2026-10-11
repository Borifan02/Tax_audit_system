import { QACaseReview, QADimensionScore } from '../types/audit';

export function createDefaultQADimensions(): QADimensionScore[] {
  return [
    {
      id: 'DIM-01',
      category: 'PLANNING_AND_RISK',
      title: 'Audit Planning, Scope & Materiality Determination',
      standardsReference: 'SOR FR-04.5-01 / ISO 19011 Clause 6.2',
      weight: 15,
      score: 88,
      status: 'COMPLIANT',
      reviewerNotes: 'Audit charter, scoping memo, and materiality benchmark ($150,000) properly approved before field entrance.',
      checkpoints: [
        {
          id: 'CP-01-1',
          text: 'Comprehensive audit scope formally documented and aligned with ITAS automated risk flags',
          isSatisfied: true,
          isCritical: true,
          auditorEvidenceRef: 'WP-TAX-01'
        },
        {
          id: 'CP-01-2',
          text: 'Materiality threshold calculated using standard revenue/asset formula and signed by Team Leader',
          isSatisfied: true,
          isCritical: true,
          auditorEvidenceRef: 'Case Profile Metadata'
        },
        {
          id: 'CP-01-3',
          text: 'Pre-audit profile identifies all connected entities and offshore associates',
          isSatisfied: true,
          isCritical: false,
          auditorEvidenceRef: 'EVD-C01'
        }
      ]
    },
    {
      id: 'DIM-02',
      category: 'EVIDENCE_AND_CAAT',
      title: 'CAAT Forensic Execution & Third-Party Evidence Sufficiency',
      standardsReference: 'SOR FR-04.5-02 / ISO 19011 Clause 6.4.4',
      weight: 20,
      score: 78,
      status: 'MINOR_DEFICIENCY',
      reviewerNotes: 'CAAT forensic Benford analysis and sampling executed, but third-party confirmation from 2 offshore banking counterparts is pending.',
      checkpoints: [
        {
          id: 'CP-02-1',
          text: 'Computer Assisted Audit Techniques (CAAT) executed on 100% of GL general journal transactions',
          isSatisfied: true,
          isCritical: true,
          auditorEvidenceRef: 'CAAT Forensic Execution Report'
        },
        {
          id: 'CP-02-2',
          text: 'Substantive third-party evidence directly corroborated with official commercial registries / central bank',
          isSatisfied: false,
          isCritical: true,
          auditorEvidenceRef: 'EVD-C02',
          notes: 'Direct bank confirmation received for local operating accounts only; foreign currency accounts unconfirmed.'
        },
        {
          id: 'CP-02-3',
          text: 'Electronic invoicing system (TIMS/e-VAT) logs reconciled against physical turnover declarations',
          isSatisfied: true,
          isCritical: false,
          auditorEvidenceRef: 'Reconciliation Schedule VAT-01'
        }
      ]
    },
    {
      id: 'DIM-03',
      category: 'STATUTORY_PROCEDURES',
      title: 'Mandatory Substantive Audit Procedures Completeness',
      standardsReference: 'SOR FR-04.5-03 / Tax Administration Act S.38',
      weight: 15,
      score: 90,
      status: 'COMPLIANT',
      reviewerNotes: 'All 6 core substantive procedures documented with clear testing methodologies and concluded results.',
      checkpoints: [
        {
          id: 'CP-03-1',
          text: 'Mandatory procedures for Revenue Recognition, COGS, and Balance Sheet items completed',
          isSatisfied: true,
          isCritical: true,
          auditorEvidenceRef: 'AP-01 to AP-06'
        },
        {
          id: 'CP-03-2',
          text: 'Audit sample sizes statistically defensible according to ITAS Sampling Guidelines',
          isSatisfied: true,
          isCritical: true,
          auditorEvidenceRef: 'Sampling Memo Schedule 4'
        },
        {
          id: 'CP-03-3',
          text: 'Procedure deviations explicitly justified in working paper documentation',
          isSatisfied: true,
          isCritical: false,
          auditorEvidenceRef: 'WP-TAX-03'
        }
      ]
    },
    {
      id: 'DIM-04',
      category: 'RECONCILIATIONS',
      title: '3-Way Cross-Tax Reconciliations (VAT, CIT, PAYE, ASYCUDA Customs)',
      standardsReference: 'SOR FR-04.7-20 / Statutory Cross-Tax Compliance',
      weight: 15,
      score: 85,
      status: 'COMPLIANT',
      reviewerNotes: 'Rigorous 3-way tax reconciliations performed. Significant variances ($1.82M VAT vs CIT and $2.25M ASYCUDA imports) identified.',
      checkpoints: [
        {
          id: 'CP-04-1',
          text: 'Monthly VAT return turnover reconciled to annual audited CIT gross sales',
          isSatisfied: true,
          isCritical: true,
          auditorEvidenceRef: 'Reconciliation Schedule 1'
        },
        {
          id: 'CP-04-2',
          text: 'Payroll expense in Profit & Loss reconciled to 12-month PAYE withholding tax returns',
          isSatisfied: true,
          isCritical: true,
          auditorEvidenceRef: 'Reconciliation Schedule 2'
        },
        {
          id: 'CP-04-3',
          text: 'ASYCUDA customs CIF imports reconciled to General Ledger inventory import debits',
          isSatisfied: true,
          isCritical: true,
          auditorEvidenceRef: 'Reconciliation Schedule 3'
        }
      ]
    },
    {
      id: 'DIM-05',
      category: 'LEGAL_APPLICATION',
      title: 'Technical Tax Law Application & Transfer Pricing Standards',
      standardsReference: 'SOR FR-04.5-04 / OECD Guidelines / Tax Code S.24',
      weight: 15,
      score: 72,
      status: 'MATERIAL_DEFICIENCY',
      reviewerNotes: 'Disallowance of polymer shrinkage write-downs lacked formal technical tax law opinion cite on allowable manufacturing normal loss thresholds.',
      checkpoints: [
        {
          id: 'CP-05-1',
          text: 'Proposed adjustments cite statutory sections, tax regulations, and published practice notes',
          isSatisfied: true,
          isCritical: true,
          auditorEvidenceRef: 'Finding FND-2026-01'
        },
        {
          id: 'CP-05-2',
          text: 'Transfer pricing adjustments supported by functional analysis and comparable benchmarking search',
          isSatisfied: false,
          isCritical: true,
          auditorEvidenceRef: 'WP-TAX-04',
          notes: 'Benchmarking study date is 3 years old; updated arm-length range required.'
        },
        {
          id: 'CP-05-3',
          text: 'Applicable Double Taxation Agreements (DTA) and withholding rates validated',
          isSatisfied: true,
          isCritical: false,
          auditorEvidenceRef: 'EVD-C04'
        }
      ]
    },
    {
      id: 'DIM-06',
      category: 'TAXPAYER_RIGHTS',
      title: 'Due Process, Taxpayer Rights & Statutory Notice Protocols',
      standardsReference: 'SOR FR-04.5-05 / Taxpayer Rights Charter / S.42',
      weight: 10,
      score: 95,
      status: 'COMPLIANT',
      reviewerNotes: 'Entry Conference conducted and signed by taxpayer CFO. Exit conference held with minutes recorded. 30-day statutory objection rights clearly stated.',
      checkpoints: [
        {
          id: 'CP-06-1',
          text: 'Statutory Entry Conference conducted within legal timeline and signed minutes on file',
          isSatisfied: true,
          isCritical: true,
          auditorEvidenceRef: 'Entry Conference Protocol'
        },
        {
          id: 'CP-06-2',
          text: 'Formal Tax Queries afforded taxpayer statutory 14-day response period without premature penalty',
          isSatisfied: true,
          isCritical: true,
          auditorEvidenceRef: 'Queries Register'
        },
        {
          id: 'CP-06-3',
          text: 'Exit Conference held and Draft Audit Execution Report presented prior to final assessment notice',
          isSatisfied: true,
          isCritical: true,
          auditorEvidenceRef: 'Exit Conference Minutes'
        }
      ]
    },
    {
      id: 'DIM-07',
      category: 'PENALTY_AND_INTEREST',
      title: 'Statutory Penalty Rates, Mitigation & Late Interest Computation',
      standardsReference: 'SOR FR-04.5-06 / Tax Administration Act S.48-52',
      weight: 10,
      score: 92,
      status: 'COMPLIANT',
      reviewerNotes: 'Standard 20% statutory penalty applied consistently. Late interest computed accurately from statutory return due date.',
      checkpoints: [
        {
          id: 'CP-07-1',
          text: 'Penalty percentage categorized correctly based on negligence vs willful evasion',
          isSatisfied: true,
          isCritical: true,
          auditorEvidenceRef: 'Assessment Notice NOT-COMP-2026-0318'
        },
        {
          id: 'CP-07-2',
          text: 'Statutory interest computed strictly per day of default at prescribed Central Bank benchmark + 2%',
          isSatisfied: true,
          isCritical: true,
          auditorEvidenceRef: 'Interest Schedule'
        }
      ]
    }
  ];
}

export const INITIAL_QA_CASES: Record<string, QACaseReview> = {
  'QA-2026-001': {
    id: 'QA-2026-001',
    caseNumber: 'QA-REV-2026-001',
    auditCaseId: 'CA-2026-101',
    auditCaseNumber: 'COMP-LTO-2026-0318',
    taxpayerName: 'Trans-National Petrochemical Group PLC',
    tradeName: 'Trans-National Chemicals & Polymers Hub',
    tin: 'TIN-7741-9920',
    taxPeriod: '2023-2024 (Multi-Year)',
    totalTaxAssessment: 747520,
    leadAuditor: 'Jane Doe',
    auditTeamLeader: 'John Smith',
    selectionReason: 'MANDATORY_HIGH_EXPOSURE',
    selectionDate: '2026-09-15',
    dueDate: '2026-10-15',
    assignedQAOfficer: 'Elena Rostova',
    qaTeamLeader: 'David Kim',
    status: 'IN_REVIEW',
    overallScore: 84,
    rating: 'SATISFACTORY',
    dimensions: createDefaultQADimensions(),
    deficiencies: [
      {
        id: 'DEF-001',
        dimensionId: 'DIM-05',
        dimensionTitle: 'Technical Tax Law Application',
        severity: 'MAJOR',
        title: 'Transfer Pricing Comparable Study is Outdated',
        findingDescription: 'The benchmarking study utilized to substantiate the 4.5% toll-processing management markup was compiled in 2021 and lacks contemporaneous economic comparability for the 2023-2024 audit window.',
        statutoryBreach: 'Transfer Pricing Regulations 2022 Section 14(3) (Contemporaneous Documentation Requirement)',
        correctiveActionMandate: 'Lead Auditor Jane Doe must run updated 2023-2024 Pan-African Bureau van Dijk comparable set to substantiate intercompany disallowance.',
        status: 'OPEN',
        auditorResponse: 'Auditor has requested Bureau van Dijk database access to refresh intercompany quartile ranges.'
      },
      {
        id: 'DEF-002',
        dimensionId: 'DIM-02',
        dimensionTitle: 'Evidence & CAAT Sufficiency',
        severity: 'MODERATE',
        title: 'Missing Direct Bank Confirmation for Offshore USD Operational Account',
        findingDescription: 'Bank confirmation statements for the Swiss offshore operational account were provided via taxpayer printout rather than direct secure Inter-Bank API confirmation gateway.',
        statutoryBreach: 'ISO 19011 Clause 6.4.4 (Verification of Third-Party Audit Evidence)',
        correctiveActionMandate: 'Obtain authenticated SWIFT confirmation from correspondent bank.',
        status: 'OPEN'
      }
    ],
    report: {
      id: 'REP-QA-2026-001',
      qaReviewId: 'QA-2026-001',
      generatedDate: '2026-09-24',
      executiveSummary: 'Quality Assurance Review of Case COMP-LTO-2026-0318 (Trans-National Petrochemical Group PLC). Overall audit execution meets general substantive standards (weighted score 84/100). Mandatory procedural steps and 3-way reconciliations are thoroughly executed. Two actionable deficiencies require remediation prior to final Director endorsement.',
      overallRating: 'SATISFACTORY',
      totalWeightedScore: 84,
      criticalDeficienciesCount: 0,
      majorDeficienciesCount: 1,
      keyStrengths: [
        'Exemplary 3-way tax reconciliation identifying $1,820,000 in un-declared VAT turnover',
        'Strict adherence to statutory Entry and Exit Conference minutes protocols',
        'Comprehensive CAAT general ledger forensic testing'
      ],
      systemicVulnerabilities: [
        'Contemporaneous transfer pricing benchmarking updates are consistently lagging in LTO audits',
        'Over-reliance on taxpayer-provided offshore bank statements'
      ],
      recommendationsForDirector: 'Recommend conditional endorsement pending updated transfer pricing benchmarking refresh by Lead Auditor.',
      mandatoryCorrectiveActions: [
        'Refresh Bureau van Dijk transfer pricing comparables for FY2023-2024',
        'Issue secure SWIFT bank confirmation verification for offshore Swiss accounts'
      ],
      leadQAOfficerSignature: 'Elena Rostova (Lead QA Inspector)',
      signedDate: '2026-09-24T16:00:00Z'
    },
    lastSaved: '14:20:00',
    auditTrail: [
      {
        id: 'QA-TRL-01',
        caseId: 'QA-2026-001',
        user: 'Elena Rostova (QA Officer)',
        action: 'QA Review Initialized',
        timestamp: '2026-09-15T09:00:00Z',
        details: 'Audit file selected under Mandatory High-Exposure Rule (Exposure > $500k).'
      },
      {
        id: 'QA-TRL-02',
        caseId: 'QA-2026-001',
        user: 'Elena Rostova (QA Officer)',
        action: 'Dimension Scoring Completed',
        timestamp: '2026-09-20T11:30:00Z',
        details: 'Evaluated 7 core dimensions; calculated preliminary weighted score of 84%.'
      },
      {
        id: 'QA-TRL-03',
        caseId: 'QA-2026-001',
        user: 'Elena Rostova (QA Officer)',
        action: 'Quality Deficiencies Logged',
        timestamp: '2026-09-22T14:10:00Z',
        details: 'Logged 1 Major Deficiency (TP Benchmarking) and 1 Moderate Deficiency (Offshore Bank Confirmation).'
      }
    ]
  },

  'QA-2026-002': {
    id: 'QA-2026-002',
    caseNumber: 'QA-REV-2026-002',
    auditCaseId: 'CA-2026-102',
    auditCaseNumber: 'COMP-LTO-2026-0419',
    taxpayerName: 'Apex Mining & Smelting Corporation',
    tradeName: 'Apex Minerals & Refining Hub',
    tin: 'TIN-3321-8840',
    taxPeriod: '2023-2024',
    totalTaxAssessment: 620000,
    leadAuditor: 'Jane Doe',
    auditTeamLeader: 'John Smith',
    selectionReason: 'RISK_BASED_SELECTION',
    selectionDate: '2026-09-18',
    dueDate: '2026-10-18',
    assignedQAOfficer: 'Elena Rostova',
    qaTeamLeader: 'David Kim',
    status: 'PENDING_TL_REVIEW',
    overallScore: 82,
    rating: 'SATISFACTORY',
    dimensions: createDefaultQADimensions(),
    deficiencies: [
      {
        id: 'DEF-003',
        dimensionId: 'DIM-04',
        dimensionTitle: 'Cross-Tax Reconciliations',
        severity: 'MODERATE',
        title: 'Mineral Extraction Royalty vs ASYCUDA Bill of Lading Manifest Discrepancy',
        findingDescription: 'Ore moisture adjustment factors used in calculating net export tonnage lack certified laboratory assay reports.',
        statutoryBreach: 'Mining Tax Act Section 18(2)',
        correctiveActionMandate: 'Attach certified SGS or Bureau Veritas moisture assay certificates.',
        status: 'OPEN'
      }
    ],
    lastSaved: '11:05:00',
    auditTrail: [
      {
        id: 'QA-TRL-04',
        caseId: 'QA-2026-002',
        user: 'Elena Rostova (QA Officer)',
        action: 'Submitted to QA Team Leader',
        timestamp: '2026-09-24T10:00:00Z',
        details: 'Completed QA review and submitted evaluation to QA Team Leader David Kim for technical review.'
      }
    ]
  },

  'QA-2026-003': {
    id: 'QA-2026-003',
    caseNumber: 'QA-REV-2026-003',
    auditCaseId: 'CA-2026-103',
    auditCaseNumber: 'COMP-LTO-2026-0520',
    taxpayerName: 'Global Logistics & Telecom PLC',
    tradeName: 'Global Connect Africa',
    tin: 'TIN-4450-9912',
    taxPeriod: '2023-2024',
    totalTaxAssessment: 890000,
    leadAuditor: 'Jane Doe',
    auditTeamLeader: 'John Smith',
    selectionReason: 'DIRECTOR_REFERRAL',
    selectionDate: '2026-09-12',
    dueDate: '2026-10-12',
    assignedQAOfficer: 'Elena Rostova',
    qaTeamLeader: 'David Kim',
    status: 'DEFICIENCY_ISSUED',
    overallScore: 68,
    rating: 'MARGINAL',
    dimensions: createDefaultQADimensions(),
    deficiencies: [
      {
        id: 'DEF-004',
        dimensionId: 'DIM-05',
        dimensionTitle: 'Technical Tax Law Application',
        severity: 'CRITICAL',
        title: 'Unsubstantiated Intercompany Royalty Disallowance Scope',
        findingDescription: 'The proposed $680,000 royalty disallowance failed to evaluate the patent registered in Ireland under DTA Article 12, exposing the Tax Authority to substantial risk of Tax Appeals Tribunal reversal.',
        statutoryBreach: 'Double Taxation Relief Order Section 7 & Tax Code Section 54',
        correctiveActionMandate: 'Audit Team must revise the legal argument to focus on economic substance rather than blanket treaty disqualification.',
        status: 'OPEN',
        auditorResponse: 'Team Leader John Smith noted: Legal counsel reviewing revised DTA substance brief.'
      }
    ],
    qaTeamLeaderComment: 'Deficiency Notice issued to Audit Team. Critical weakness in treaty interpretation must be resolved before Director submission.',
    qaTeamLeaderDecisionDate: '2026-09-23T15:30:00Z',
    lastSaved: '16:45:00',
    auditTrail: [
      {
        id: 'QA-TRL-05',
        caseId: 'QA-2026-003',
        user: 'David Kim (QA Team Leader)',
        action: 'Deficiency Notice Issued',
        timestamp: '2026-09-23T15:30:00Z',
        details: 'Formal Quality Deficiency Notice served to Lead Auditor Jane Doe & Team Leader John Smith.'
      }
    ]
  },

  'QA-2026-004': {
    id: 'QA-2026-004',
    caseNumber: 'QA-REV-2026-004',
    auditCaseId: 'CA-2026-104',
    auditCaseNumber: 'COMP-LTO-2026-0611',
    taxpayerName: 'Savannah Agro-Commodities Trading Ltd',
    tradeName: 'Savannah Grain & Oil Export Hub',
    tin: 'TIN-1120-7764',
    taxPeriod: '2022-2024',
    totalTaxAssessment: 1860000,
    leadAuditor: 'Jane Doe',
    auditTeamLeader: 'John Smith',
    selectionReason: 'MANDATORY_HIGH_EXPOSURE',
    selectionDate: '2026-09-10',
    dueDate: '2026-10-10',
    assignedQAOfficer: 'Elena Rostova',
    qaTeamLeader: 'David Kim',
    status: 'PENDING_DIRECTOR_SIGNOFF',
    overallScore: 94,
    rating: 'EXCELLENT',
    dimensions: createDefaultQADimensions(),
    deficiencies: [],
    qaTeamLeaderComment: 'Exceptional evidentiary quality. Criminal evasion chain of custody and forensic bank subpoena records verified. Endorsed for Director certification.',
    qaTeamLeaderDecisionDate: '2026-09-24T12:00:00Z',
    lastSaved: '12:00:00',
    auditTrail: [
      {
        id: 'QA-TRL-06',
        caseId: 'QA-2026-004',
        user: 'David Kim (QA Team Leader)',
        action: 'Recommended for Executive Sign-Off',
        timestamp: '2026-09-24T12:00:00Z',
        details: 'Escalated to Director of Quality Assurance Dr. Arthur Pendelton for final Quality Assurance Certification.'
      }
    ]
  }
};
