import React, { useState, useMemo } from 'react';
import { 
  Layers, FileText, CheckCircle2, AlertTriangle, 
  Building2, Check, ArrowRight, ShieldCheck, Clock,
  Plus, Send, Eye, FileCheck, Info, UserCheck, Search,
  Briefcase, MapPin, Calendar, ExternalLink, ChevronDown, 
  ChevronUp, Edit3, Trash2, Save, Download, AlertOctagon, 
  Sliders, Shield, DollarSign, Database, FileSpreadsheet, Lock
} from 'lucide-react';
import { Card, Button, Badge, Input, Textarea, Select } from '../../../../components/ui/index.jsx';

// Default IDR Log Entries under Art. 46
const DEFAULT_IDRS = [
  {
    id: 'IDR-TP-2026-001',
    subject: 'Transfer Pricing Master File, Local File & Schedule 5 Disclosures (FY 2020-2024)',
    category: 'MANDATORY_TP_DOCUMENTATION',
    requestDate: '2026-08-15',
    responseDueDate: '2026-08-30',
    daysRemaining: 0,
    status: 'RECEIVED_VERIFIED',
    statusLabel: 'Received & Verified',
    recipient: 'Ato Dawit Tadesse (Managing Director)',
    deliveredVia: 'Official In-Person Service & ITAS Portal',
    attachmentName: 'TP_LocalFile_Consolidated_FY20_FY24.pdf',
    attachmentPages: 142,
    auditorEvaluation: 'Master file and Local file provided. However, intercompany management service benchmark and timesheets are missing from Exhibit C.'
  },
  {
    id: 'IDR-TP-2026-002',
    subject: 'Headquarter Central Management & IT Services Agreement, Time-Sheets & Benefit Proof',
    category: 'INTRA_GROUP_SERVICES',
    requestDate: '2026-08-20',
    responseDueDate: '2026-09-04',
    daysRemaining: 0,
    status: 'PARTIALLY_PROVIDED',
    statusLabel: 'Partially Provided (Deficient)',
    recipient: 'W/ro Bethlehem Girma (CFO)',
    deliveredVia: 'Formal Registered Mail & Email',
    attachmentName: 'HQ_Service_Contract_CrestMauritius_2021.pdf',
    attachmentPages: 28,
    auditorEvaluation: 'Provided contract mentions general technical oversight, but failed to provide detailed auditor timesheets, activity logs, or cost-allocation pool accounting.'
  },
  {
    id: 'IDR-TP-2026-003',
    subject: 'Trademark & Patent Licensing Agreements with Apex IP Holdings Sarl (Switzerland)',
    category: 'INTANGIBLE_PROPERTY',
    requestDate: '2026-08-25',
    responseDueDate: '2026-09-09',
    daysRemaining: 0,
    status: 'RECEIVED_VERIFIED',
    statusLabel: 'Received & Verified',
    recipient: 'Tax Director / External Counsel (PwC Ethiopia)',
    deliveredVia: 'In-Person Bailiff Service',
    attachmentName: 'IP_Licensing_Apex_Swiss_2019.pdf',
    attachmentPages: 45,
    auditorEvaluation: 'Agreement establishes 3.5% royalty on gross turnover. However, all promotional advertising and customer brand loyalty creation is funded solely by Ethiopian OpCo.'
  },
  {
    id: 'IDR-TP-2026-004',
    subject: 'Intercompany Loan Agreements, Interest Computation & NBE External Debt Registration',
    category: 'FINANCIAL_TRANSACTIONS',
    requestDate: '2026-09-01',
    responseDueDate: '2026-09-16',
    daysRemaining: 0,
    status: 'RECEIVED_VERIFIED',
    statusLabel: 'Received & Verified',
    recipient: 'W/ro Bethlehem Girma (CFO)',
    deliveredVia: 'ITAS Portal Electronic Notification',
    attachmentName: 'Loan_Facility_ApexFinance_Ireland_2022.pdf',
    attachmentPages: 36,
    auditorEvaluation: 'Loan principal EUR 3.5M. Debt-to-equity ratio exceeds statutory thin-capitalization limit 2:1 under Art. 79(3).'
  },
  {
    id: 'IDR-TP-2026-005',
    subject: 'Segmental Cost Accounting, SAP ERP General Ledger Extracts & Customs Import Declarations',
    category: 'FINANCIAL_ACCOUNTS',
    requestDate: '2026-09-08',
    responseDueDate: '2026-09-23',
    daysRemaining: 0,
    status: 'RECEIVED_VERIFIED',
    statusLabel: 'Received & Verified',
    recipient: 'Ato Solomon Teklu (Head of Accounting)',
    deliveredVia: 'On-Site Auditor Physical Handoff',
    attachmentName: 'SAP_Segmental_Accounts_FY20_FY24.xlsx',
    attachmentPages: 18,
    auditorEvaluation: 'Segmental P&L reconciles to audited financial statements. Demonstrates 1.50% operating margin on controlled segment versus 7.80% on uncontrolled domestic segment.'
  }
];

// Default FAR Functions Matrix
const DEFAULT_FAR_FUNCTIONS = [
  {
    id: 'func-1',
    functionName: 'Strategic Management & Business Policy',
    category: 'GOVERNANCE',
    testedPartyLevel: 'LOW',
    foreignAffiliateLevel: 'HIGH',
    foreignEntity: 'Apex Global HQ (Switzerland / Mauritius)',
    auditorFindings: 'Strategic multi-year operational plans, pricing bands, and corporate governance are mandated exclusively by foreign HQ. Local management possesses purely ministerial execution authority.',
    evidenceRef: 'Board Minutes 2021-2024 & Group Delegations of Authority Policy (IDR-01/Ex. B)'
  },
  {
    id: 'func-2',
    functionName: 'Research, Formulation & Product Development (R&D)',
    category: 'DEVELOPMENT',
    testedPartyLevel: 'NONE',
    foreignAffiliateLevel: 'HIGH',
    foreignEntity: 'Apex Pharma Research Centre (Switzerland)',
    auditorFindings: 'Taxpayer owns zero local R&D laboratories or registered patents in Ethiopia. All active chemical formulations, technical blueprints, and product dossiers are developed abroad.',
    evidenceRef: 'EFDA Product Dossier Registrations & Intellectual Property Contracts (IDR-03)'
  },
  {
    id: 'func-3',
    functionName: 'Contract Manufacturing & Packaging Operations',
    category: 'PRODUCTION',
    testedPartyLevel: 'HIGH',
    foreignAffiliateLevel: 'LOW',
    foreignEntity: 'PharmaTech International BV (Technical Specs)',
    auditorFindings: 'Akaki-Kality manufacturing plant operates 2 full daily shifts producing pharmaceutical formulations following rigid standard operating procedures (SOPs) handed down by foreign principal.',
    evidenceRef: 'Walkthrough Test Report #04 & Factory Operational Logbooks'
  },
  {
    id: 'func-4',
    functionName: 'Procurement of Active Ingredients & Raw Materials',
    category: 'SUPPLY_CHAIN',
    testedPartyLevel: 'LOW',
    foreignAffiliateLevel: 'HIGH',
    foreignEntity: 'PharmaTech International BV (Netherlands)',
    auditorFindings: 'Contractual terms restrict the Ethiopian affiliate from sourcing active ingredients on the open market. 100% of raw materials are centrally procured and shipped by related affiliates at fixed transfer prices.',
    evidenceRef: 'Intercompany Supply Agreement Sec. 4.2 & Ethiopian Customs Declarations'
  },
  {
    id: 'func-5',
    functionName: 'Brand Advertising, Marketing & Promotion',
    category: 'COMMERCIAL',
    testedPartyLevel: 'HIGH',
    foreignAffiliateLevel: 'MEDIUM',
    foreignEntity: 'Apex IP Holdings Sarl (Brand Guideline Control)',
    auditorFindings: 'Local entity finances all nationwide marketing, medical detailing to doctors, hospital symposia, and brand awareness campaigns (ETB 34M across 5 years) with zero reimbursement from Swiss trademark owner.',
    evidenceRef: 'Ledger Account #6120 Marketing & Sales Invoices; Field Audit Interviews'
  },
  {
    id: 'func-6',
    functionName: 'Warehousing, Cold-Chain Storage & Nationwide Distribution',
    category: 'LOGISTICS',
    testedPartyLevel: 'HIGH',
    foreignAffiliateLevel: 'NONE',
    foreignEntity: 'None (Purely Domestic Responsibility)',
    auditorFindings: 'Taxpayer operates central temperature-controlled pharmaceutical depot at Mojo and regional depots in Hawassa, Dire Dawa, and Bahir Dar, bearing all physical storage logistics.',
    evidenceRef: 'Physical Inventory Inspection Log #Mojo-2026; Transport Fleet Leases'
  },
  {
    id: 'func-7',
    functionName: 'Sales Negotiation, Customer Invoicing & Debt Collection',
    category: 'SALES',
    testedPartyLevel: 'HIGH',
    foreignAffiliateLevel: 'NONE',
    foreignEntity: 'None (Purely Domestic Responsibility)',
    auditorFindings: 'Domestic sales team negotiates purchase orders with private pharmacies, government tenders (EPSS), and regional health bureaus within centrally set floor prices.',
    evidenceRef: 'Sales Invoices Sample #01-150; Customer Credit Contracts'
  },
  {
    id: 'func-8',
    functionName: 'Corporate Administration, Local Finance & IT Systems',
    category: 'ADMINISTRATION',
    testedPartyLevel: 'MEDIUM',
    foreignAffiliateLevel: 'HIGH',
    foreignEntity: 'Crest Global Services Ltd (Mauritius)',
    auditorFindings: 'Local finance team maintains daily statutory accounts and local tax returns; however, core SAP S/4HANA cloud instance and financial reporting infrastructure are controlled from Mauritius.',
    evidenceRef: 'IT Architecture Review & Mauritius Management Agreement'
  }
];

// Default DEMPE & Tangibles Register
const DEFAULT_DEMPE_ASSETS = [
  {
    id: 'asset-1',
    assetName: 'Apex Healthcare Registered Trademarks & Brand Equity',
    type: 'INTANGIBLE_MARKETING',
    legalOwner: 'Apex IP Holdings Sarl (Switzerland)',
    economicConduct: 'Shared (Local entity conducts intensive local brand promotion)',
    devEntity: 'Apex IP Holdings Sarl',
    enhEntity: 'Ethiopian Affiliate (OpCo via marketing spend)',
    maintEntity: 'Apex IP Holdings Sarl',
    protEntity: 'Apex IP Holdings Sarl',
    explEntity: 'Ethiopian Affiliate (OpCo)',
    auditorAssessment: 'Taxpayer has created significant local marketing intangible value. 3.5% royalty payment is excessive and non-arm’s length given lack of DEMPE cost-sharing contribution from legal owner.'
  },
  {
    id: 'asset-2',
    assetName: 'Proprietary Pharmaceutical Formulation Dossiers & GMP Specs',
    type: 'INTANGIBLE_TRADE',
    legalOwner: 'Apex Pharma Research Centre (Switzerland)',
    economicConduct: 'Foreign Parent Exclusively',
    devEntity: 'Apex Pharma Research Centre',
    enhEntity: 'Apex Pharma Research Centre',
    maintEntity: 'Apex Pharma Research Centre',
    protEntity: 'Apex Pharma Research Centre',
    explEntity: 'Ethiopian Affiliate (Toll Manufacturer)',
    auditorAssessment: 'Economic ownership aligns with legal ownership. Routine contract manufacturing characterization is supported for formulation patents.'
  },
  {
    id: 'asset-3',
    assetName: 'Enterprise SAP S/4HANA Cloud ERP Platform & Licenses',
    type: 'INTANGIBLE_SOFTWARE',
    legalOwner: 'Crest Global Services Ltd (Mauritius)',
    economicConduct: 'Central IT Shared Service',
    devEntity: 'Third-Party SAP SE',
    enhEntity: 'Crest Global Services Ltd',
    maintEntity: 'Crest Global Services Ltd',
    protEntity: 'Crest Global Services Ltd',
    explEntity: 'Global Group Entities',
    auditorAssessment: 'Software is third-party commercial off-the-shelf. The ETB 38.5M management fee billed from Mauritius represents an exorbitant markup over routine software maintenance.'
  },
  {
    id: 'asset-4',
    assetName: 'Akaki-Kality High-Capacity Manufacturing Plant & Equipment',
    type: 'TANGIBLE_FIXED',
    legalOwner: 'Ethiopian Affiliate (OpCo)',
    economicConduct: 'Local Operational Ownership',
    netBookValue: 145000000,
    depreciationRate: '10% Straight Line (Art. 25 Procl. 979/2016)',
    auditorAssessment: 'Routine tangible asset base. Fully maintained on local balance sheet; generates routine return on capital.'
  },
  {
    id: 'asset-5',
    assetName: 'Mojo Cold-Chain Distribution Depot & Logistics Fleet',
    type: 'TANGIBLE_FIXED',
    legalOwner: 'Ethiopian Affiliate (OpCo)',
    economicConduct: 'Local Operational Ownership',
    netBookValue: 110000000,
    depreciationRate: '15% Reducing Balance',
    auditorAssessment: 'Routine tangible warehousing and transport infrastructure supporting nationwide pharmaceutical delivery.'
  }
];

// Default 6 Key Business Risks Allocation Matrix
const DEFAULT_RISKS = [
  {
    id: 'risk-1',
    riskName: 'Market & Product Demand Fluctuation Risk',
    category: 'COMMERCIAL',
    contractualBearer: 'Foreign Parent (Apex Global)',
    actualConductBearer: 'Ethiopian Affiliate (OpCo)',
    financialCapacity: 'Foreign Parent has high equity; Local OpCo has declining net worth',
    auditorEvaluation: 'While contract characterizes OpCo as a limited-risk distributor guaranteed target margins, actual financial outcomes show OpCo absorbed massive revenue downturns while foreign prices remained unchanged.',
    realignment: 'RECLASSIFIED: Economic substance demonstrates OpCo improperly bore market volume risk.'
  },
  {
    id: 'risk-2',
    riskName: 'Inventory Obsolescence & Expiry Risk',
    category: 'OPERATIONAL',
    contractualBearer: 'Foreign Parent (Guaranteed return of expired stock)',
    actualConductBearer: 'Ethiopian Affiliate (OpCo)',
    financialCapacity: 'Local OpCo depleted operating reserves to write off expired drugs',
    auditorEvaluation: 'In FY 2023, OpCo wrote off ETB 12,400,000 in expired pharmaceutical inventories. Foreign parent refused reimbursement, directly contradicting contract Clause 6.1.',
    realignment: 'RECLASSIFIED: Recharacterize write-offs as transfer price adjustment to parent.'
  },
  {
    id: 'risk-3',
    riskName: 'Foreign Exchange (FX) & Birr Devaluation Risk',
    category: 'FINANCIAL',
    contractualBearer: 'Foreign Parent (Contractual FX Adjustment Clause)',
    actualConductBearer: 'Ethiopian Affiliate (OpCo)',
    financialCapacity: 'Local OpCo suffered severe foreign currency working capital deficits',
    auditorEvaluation: 'Intercompany purchase invoices are denominated in EUR and USD. Ethiopian Birr depreciation created ETB 28.6M foreign exchange losses absorbed 100% by local entity without parent compensatory adjustment.',
    realignment: 'RECLASSIFIED: Under arm’s length limited-risk distribution, foreign principal must insulate distributor from currency risk.'
  },
  {
    id: 'risk-4',
    riskName: 'Credit & Customer Default Risk',
    category: 'CREDIT',
    contractualBearer: 'Ethiopian Affiliate (OpCo)',
    actualConductBearer: 'Ethiopian Affiliate (OpCo)',
    financialCapacity: 'Local OpCo bears bad debt reserves',
    auditorEvaluation: 'Local entity assesses customer creditworthiness and bears bad debt write-offs on domestic sales. Conduct aligns with contractual terms.',
    realignment: 'CONFIRMED: Borne by local affiliate as routine distributor.'
  },
  {
    id: 'risk-5',
    riskName: 'Product Liability & Health Regulatory Risk',
    category: 'LEGAL',
    contractualBearer: 'Foreign Parent (Apex Global)',
    actualConductBearer: 'Ethiopian Affiliate (OpCo as Marketing Authorization Holder)',
    financialCapacity: 'Foreign Parent maintains global product liability insurance',
    auditorEvaluation: 'Ethiopian Food and Drug Authority (EFDA) regulations hold the local marketing authorization holder strictly liable for pharmacovigilance and drug quality recalls.',
    realignment: 'CONFIRMED: Dual regulatory responsibility.'
  },
  {
    id: 'risk-6',
    riskName: 'Working Capital & Financing Liquidity Risk',
    category: 'FINANCIAL',
    contractualBearer: 'Ethiopian Affiliate (OpCo)',
    actualConductBearer: 'Ethiopian Affiliate (OpCo)',
    financialCapacity: 'OpCo forced to borrow EUR 3.5M from related affiliate at high interest',
    auditorEvaluation: 'Cash flow constraints caused by low operating margins forced OpCo into high-leverage intercompany borrowing from Ireland affiliate, triggering thin-capitalization issues.',
    realignment: 'RECLASSIFIED: Liquidity distress was directly created by non-arm’s length transfer pricing.'
  }
];

// Default Operational Walkthrough & Interviews
const DEFAULT_INSPECTIONS = [
  {
    id: 'insp-1',
    date: '2026-08-22',
    location: 'Akaki-Kality Manufacturing Facility & Packaging Lines',
    attendees: 'Lead TP Auditor, MoR Chemical Engineer Specialist, Factory General Manager',
    focusArea: 'Verification of Contract Toll Manufacturing vs Proprietary Production',
    findings: 'Inspected raw material intake dock, formulation blending vats, packaging lines, and finished goods quarantine. Confirmed factory processes active ingredients received in bulk from PharmaTech BV. Plant operates strictly per Swiss standard operating procedures. Local engineers have zero discretion over ingredient proportions.',
    status: 'COMPLETED_VERIFIED'
  },
  {
    id: 'insp-2',
    date: '2026-08-28',
    location: 'Mojo Central Cold-Chain Distribution Depot',
    attendees: 'Lead TP Auditor, Inventory Audit Officer, Depot Operations Manager',
    focusArea: 'Inventory Holding, Barcode Tracking & Quarantine Reconciliation',
    findings: 'Physical sample count of 45 high-value pharmaceutical lines against SAP inventory balances. Verified barcode scans and temperature-controlled storage logs (2°C - 8°C). Observed quarantine bay containing ETB 12.4M of expired stock awaiting destruction approval.',
    status: 'COMPLETED_VERIFIED'
  },
  {
    id: 'insp-3',
    date: '2026-09-02',
    location: 'Kazanchis Corporate Head Office — Finance & Executive Suites',
    attendees: 'Lead TP Auditor, IT Forensic Specialist, Chief Financial Officer',
    focusArea: 'SAP ERP Server Audit, Management Fee Invoicing & Email Approvals',
    findings: 'Live SAP workstation review. Inspected monthly management fee debit notes received from Crest Global Services (Mauritius). Auditor noted all debit notes are calculated as a flat 8.5% surcharge on Ethiopian turnover without any detailed timesheet or deliverable evidence.',
    status: 'COMPLETED_VERIFIED'
  }
];

const DEFAULT_INTERVIEWS = [
  {
    id: 'int-1',
    interviewee: 'Ato Dawit Tadesse',
    role: 'Country Managing Director (Ethiopia)',
    date: '2026-08-24',
    keyQuestions: '1. Who establishes annual revenue and pricing targets?\n2. What autonomy does the local executive committee have over supplier selection?',
    verbatimNotes: 'Ato Dawit confirmed: "Annual revenue targets, distributor discounts, and hospital tender floor prices are approved by the Regional VP in Geneva. We cannot change product prices by more than 2% without written headquarters sign-off. Supplier selection for all active ingredients is 100% centralized with our parent company."',
    significance: 'Confirms tested party functions as a limited-risk distributor and toll-manufacturer with low strategic decision-making authority.'
  },
  {
    id: 'int-2',
    interviewee: 'W/ro Bethlehem Girma',
    role: 'Chief Financial Officer (CFO)',
    date: '2026-08-26',
    keyQuestions: '1. What documentation backs the ETB 38.5M management fee billed from Mauritius?\n2. How are foreign exchange losses treated under the intercompany contracts?',
    verbatimNotes: 'W/ro Bethlehem stated: "The Mauritius management charge is calculated by group treasury based on our annual turnover budget. We receive regular corporate IT and governance emails, but we do not receive timesheets of individual consultants. Regarding FX, although our contract mentions price adjustments, in practice our local margin bore the brunt of Birr devaluation."',
    significance: 'Critical evidence establishing non-compliance with the Benefit Test under Directive 43/2015 Art. 13 and contractual vs actual risk misalignment.'
  },
  {
    id: 'int-3',
    interviewee: 'Ato Yohannes Bekele',
    role: 'Plant Operations Director (Akaki Factory)',
    date: '2026-08-30',
    keyQuestions: '1. Are any local chemical patents or formulations developed in your plant?\n2. What is the scope of local quality assurance testing?',
    verbatimNotes: 'Ato Yohannes stated: "We are an operational packaging and tableting facility. We do not do chemical synthesis or drug discovery here. All master batch records are approved by Switzerland. We run batch quality control to ensure conformity with EFDA standards, but we do not modify the chemical formulations."',
    significance: 'Refutes any claim that local entity owns valuable manufacturing intangibles; confirms characterization as routine contract manufacturer.'
  }
];

export default function Phase3SubSteps({
  subStepId,
  onSelectSubStep,
  onProceedToPhase,
  isReadOnly,
  fullState,
  accountingNotes,
  setAccountingNotes,
  factSummary,
  setFactSummary,
  interviewMinutes,
  setInterviewMinutes,
  completedSubSteps = [],
  onToggleComplete,
  saving,
  executeApiAction,
  onOpenIdrModal
}) {
  const isDone = completedSubSteps.includes(subStepId);

  // Local state for interactive editing and enrichment
  const [idrs, setIdrs] = useState(DEFAULT_IDRS);
  const [farFunctions, setFarFunctions] = useState(DEFAULT_FAR_FUNCTIONS);
  const [dempeAssets, setDempeAssets] = useState(DEFAULT_DEMPE_ASSETS);
  const [risks, setRisks] = useState(DEFAULT_RISKS);
  const [inspections, setInspections] = useState(DEFAULT_INSPECTIONS);
  const [interviews, setInterviews] = useState(DEFAULT_INTERVIEWS);

  // Statement of Facts state
  const [sofStatus, setSofStatus] = useState('DRAFT_UNDER_REVIEW');
  const [taxpayerSigned, setTaxpayerSigned] = useState(true);
  const [agreedFacts, setAgreedFacts] = useState([
    'Taxpayer operates as a contract toll-manufacturer and routine distributor in Ethiopia.',
    'All active pharmaceutical ingredient procurement is controlled by foreign parent (PharmaTech BV).',
    'Akaki manufacturing plant operates under foreign standard operating procedures with no local R&D.',
    'Local entity finances all nationwide brand advertising and promotional symposia (ETB 34M across FY 2020-2024).',
    'Management fees of ETB 38.5M remitted to Mauritius affiliate lack individual time-sheet documentation.'
  ]);
  const [disputedFacts, setDisputedFacts] = useState([
    'Taxpayer asserts that local Birr currency devaluation losses should be treated as legitimate local operating expense rather than an intercompany price adjustment.',
    'Taxpayer contends that headquarter management services provided intangible synergies not capturable by hourly timesheets.'
  ]);
  const [newAgreedFact, setNewAgreedFact] = useState('');
  const [newDisputedFact, setNewDisputedFact] = useState('');

  // IDR modal state
  const [showNewIdrModal, setShowNewIdrModal] = useState(false);
  const [newIdrSubject, setNewIdrSubject] = useState('');
  const [newIdrCategory, setNewIdrCategory] = useState('INTRA_GROUP_SERVICES');
  const [newIdrRecipient, setNewIdrRecipient] = useState('W/ro Bethlehem Girma (CFO)');
  const [newIdrDelivery, setNewIdrDelivery] = useState('Official In-Person Service & ITAS Portal');

  // Handle adding new IDR
  const handleCreateIdr = () => {
    if (!newIdrSubject.trim()) return;
    const nextNum = idrs.length + 1;
    const nextCode = `IDR-TP-2026-${String(nextNum).padStart(3, '0')}`;
    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const newEntry = {
      id: nextCode,
      subject: newIdrSubject,
      category: newIdrCategory,
      requestDate: today,
      responseDueDate: dueDate,
      daysRemaining: 15,
      status: 'PENDING_TAXPAYER_RESPONSE',
      statusLabel: 'Statutory 15-Day Clock Active',
      recipient: newIdrRecipient,
      deliveredVia: newIdrDelivery,
      attachmentName: 'Formal_Notice_Dispatched.pdf',
      attachmentPages: 4,
      auditorEvaluation: 'Awaiting taxpayer response pursuant to Article 46 of Proclamation 983/2016.'
    };

    setIdrs(prev => [newEntry, ...prev]);
    setShowNewIdrModal(false);
    setNewIdrSubject('');
  };

  // Sub-step navigation helper
  const navigateSubStep = (step) => {
    if (onSelectSubStep) onSelectSubStep(step);
  };

  // ==========================================
  // 3.1 Information Document Request (IDR) Log
  // ==========================================
  if (subStepId === '3.1') {
    const totalIssued = idrs.length;
    const verifiedCount = idrs.filter(i => i.status === 'RECEIVED_VERIFIED').length;
    const partialCount = idrs.filter(i => i.status === 'PARTIALLY_PROVIDED').length;
    const pendingCount = idrs.filter(i => i.status === 'PENDING_TAXPAYER_RESPONSE').length;

    return (
      <div className="space-y-6">
        {/* Statutory Header */}
        <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-sky-950/20 border border-blue-200 dark:border-blue-800 rounded-2xl shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white uppercase tracking-wider">
                  Phase 3.1 Field Work
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  Tax Administration Proclamation No. 983/2016 Art. 46 & 86
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
                <Clock className="text-blue-600 dark:text-blue-400" size={18} />
                Information Document Request (IDR) Statutory Register
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-3xl">
                Every document request issued under Article 46 grants the taxpayer a mandatory 15-day compliance window. 
                Failure to comply triggers Article 86 non-compliance penalties (ETB 50,000 per violation plus administrative sanctions).
              </p>
            </div>
            {!isReadOnly && (
              <Button 
                size="sm" 
                onClick={() => setShowNewIdrModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm shrink-0"
              >
                <Plus size={15} className="mr-1.5" /> Issue New Statutory IDR
              </Button>
            )}
          </div>

          {/* Metric Summary Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-blue-200/60 dark:border-blue-800/60">
            <div className="bg-white/80 dark:bg-slate-900/60 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">Total IDRs Dispatched</span>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{totalIssued}</p>
            </div>
            <div className="bg-white/80 dark:bg-slate-900/60 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900">
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase">Received & Verified</span>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">{verifiedCount}</p>
            </div>
            <div className="bg-white/80 dark:bg-slate-900/60 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900">
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase">Deficient / Incomplete</span>
              <p className="text-lg font-bold text-amber-700 dark:text-amber-300 mt-0.5">{partialCount}</p>
            </div>
            <div className="bg-white/80 dark:bg-slate-900/60 p-2.5 rounded-xl border border-sky-100 dark:border-sky-900">
              <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 uppercase">Active 15-Day Clocks</span>
              <p className="text-lg font-bold text-sky-700 dark:text-sky-300 mt-0.5">{pendingCount}</p>
            </div>
          </div>
        </div>

        {/* Detailed IDR Register Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Formal Document Requests Log ({idrs.length} Records)
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Click any request row to review compliance status and evidentiary assessment notes.
              </p>
            </div>
            <Badge variant="outline" className="text-xs font-mono">
              Statutory 15-Day Rule Active
            </Badge>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {idrs.map((item) => {
              const isVerified = item.status === 'RECEIVED_VERIFIED';
              const isDeficient = item.status === 'PARTIALLY_PROVIDED';
              return (
                <div key={item.id} className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-slate-300 dark:border-slate-700">
                          {item.id}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isVerified 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : isDeficient
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}>
                          {item.statusLabel}
                        </span>
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          Category: <span className="font-semibold text-slate-700 dark:text-slate-200">{item.category}</span>
                        </span>
                      </div>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white pt-1">
                        {item.subject}
                      </h5>
                      <div className="flex flex-wrap gap-y-1 gap-x-4 text-[11px] text-slate-600 dark:text-slate-400">
                        <span>Recipient: <strong className="text-slate-800 dark:text-slate-200">{item.recipient}</strong></span>
                        <span>Dispatched: <span className="font-mono">{item.requestDate}</span></span>
                        <span>Due Date: <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{item.responseDueDate}</span></span>
                        <span>Service: <span>{item.deliveredVia}</span></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right text-[11px] pr-2">
                        <span className="text-slate-500 dark:text-slate-400 block">Dossier File</span>
                        <span className="font-mono font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1 justify-end">
                          <FileText size={12} /> {item.attachmentName} ({item.attachmentPages} pp.)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Auditor Evidentiary Assessment Note Box */}
                  <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <FileCheck size={12} className="text-blue-500" /> Auditor Verification Finding:
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">
                      {item.auditorEvaluation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal for Issuing New IDR */}
        {showNewIdrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="text-blue-600" size={16} /> Issue Statutory Information Document Request (Art. 46)
                </h3>
                <button 
                  onClick={() => setShowNewIdrModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Subject / Specific Documents Requested *
                  </label>
                  <Textarea
                    rows={2}
                    value={newIdrSubject}
                    onChange={(e) => setNewIdrSubject(e.target.value)}
                    placeholder="e.g. Schedule of foreign consultant timesheets, invoices, and deliverable reports for Mauritius management fees..."
                    className="text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Request Category
                    </label>
                    <Select
                      value={newIdrCategory}
                      onChange={(e) => setNewIdrCategory(e.target.value)}
                      className="text-xs w-full"
                    >
                      <option value="INTRA_GROUP_SERVICES">Intra-Group Management Services</option>
                      <option value="INTANGIBLE_PROPERTY">Intangibles & Royalty Agreements</option>
                      <option value="FINANCIAL_TRANSACTIONS">Intercompany Financing & Loans</option>
                      <option value="TANGIBLE_GOODS">Raw Material & Inventory Pricing</option>
                      <option value="FINANCIAL_ACCOUNTS">Segmental Cost Allocations</option>
                      <option value="MANDATORY_TP_DOCUMENTATION">Master File / Local File Update</option>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Taxpayer Liaison Recipient
                    </label>
                    <Input
                      value={newIdrRecipient}
                      onChange={(e) => setNewIdrRecipient(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Proof of Delivery Mechanism
                  </label>
                  <Select
                    value={newIdrDelivery}
                    onChange={(e) => setNewIdrDelivery(e.target.value)}
                    className="text-xs w-full"
                  >
                    <option value="Official In-Person Service & ITAS Portal">Official In-Person Service & ITAS Portal</option>
                    <option value="Formal Registered Post with Acknowledgment">Formal Registered Post with Acknowledgment</option>
                    <option value="Court Bailiff Statutory Service">Court Bailiff Statutory Service</option>
                    <option value="Electronic Certified Taxpayer Portal">Electronic Certified Taxpayer Portal</option>
                  </Select>
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <AlertTriangle size={13} /> Statutory Legal Notice
                  </div>
                  <p>
                    Taxpayer is granted strictly 15 working days from receipt to supply the records. If unprovided, auditor will issue formal Demand Notice under Article 86 with ETB 50,000 penalty.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowNewIdrModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleCreateIdr}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  <Send size={13} className="mr-1.5" /> Dispatch IDR & Start 15-Day Clock
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onProceedToPhase && onProceedToPhase('AUDIT_PLANNING')}
            className="text-slate-600 dark:text-slate-300 text-xs"
          >
            ← Back to Phase 2: Audit Planning
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={async () => {
                await executeApiAction('/field-work', {
                  idrs,
                  subStep: '3.1',
                  status: 'COMPLETED'
                }, 'IDR Register saved and Article 46 compliance logged.');
                onToggleComplete('3.1', !isDone, { idrs });
              }}
              disabled={saving}
              className={isDone ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
            >
              <Check size={14} className="mr-1.5" />
              {isDone ? 'Sub-Step 3.1 Completed ✓ (Click to Re-Save)' : 'Mark Sub-Step 3.1 Complete'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigateSubStep('3.2')}
              className="text-xs"
            >
              Continue to 3.2 FAR Analysis <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 3.2 Functional Analysis (FAR - Functions)
  // ==========================================
  if (subStepId === '3.2') {
    return (
      <div className="space-y-6">
        {/* Statutory Header */}
        <div className="p-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-blue-950/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white uppercase tracking-wider">
              Phase 3.2 Field Work
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Directive No. 43/2015 Art. 6 & UN TP Practical Manual Ch. 5
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <Layers className="text-indigo-600 dark:text-indigo-400" size={18} />
            FAR Functional Analysis Matrix (8 Operational Functions)
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-4xl">
            Ascertain whether the Ethiopian affiliate performs economically significant entrepreneurial functions 
            or operates as a routine contract toll-manufacturer and limited-risk distributor. 
            Economic substance prevails over contractual form.
          </p>

          <div className="mt-3 p-3 bg-white/80 dark:bg-slate-900/60 rounded-xl border border-indigo-100 dark:border-indigo-900 flex flex-wrap gap-4 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Tested Party Characterization</span>
              <strong className="text-indigo-700 dark:text-indigo-300 text-sm">Limited-Risk Toll Manufacturer & Routine Distributor</strong>
            </div>
            <div className="border-l border-slate-200 dark:border-slate-700 pl-4">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Foreign Principal Role</span>
              <strong className="text-slate-800 dark:text-slate-200 text-sm">Full Entrepreneur, Brand Owner & Strategic Decision Maker</strong>
            </div>
            <div className="border-l border-slate-200 dark:border-slate-700 pl-4">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Economic Implication</span>
              <strong className="text-emerald-700 dark:text-emerald-300 text-sm">Routine Target Return Required (TNMM Operating Margin)</strong>
            </div>
          </div>
        </div>

        {/* 8 Functions Comprehensive Matrix */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex justify-between items-center">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Operational Functions Breakdown (Tested Party vs. Foreign Parent)
            </h4>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Assessed via on-site walkthroughs & SAP audit
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3.5 w-1/4">Operational Function</th>
                  <th className="p-3.5 w-28 text-center">Local Affiliate (OpCo)</th>
                  <th className="p-3.5 w-28 text-center">Foreign Principal</th>
                  <th className="p-3.5">Auditor Evidentiary Findings & Field Notes</th>
                  <th className="p-3.5 w-1/5">Statutory Evidence Citation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {farFunctions.map((fn) => {
                  const getLevelBadge = (level) => {
                    switch (level) {
                      case 'HIGH':
                        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">HIGH</span>;
                      case 'MEDIUM':
                        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">MEDIUM</span>;
                      case 'LOW':
                        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">LOW</span>;
                      default:
                        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">NONE</span>;
                    }
                  };

                  return (
                    <tr key={fn.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 align-top">
                        <strong className="text-slate-900 dark:text-white block font-semibold">{fn.functionName}</strong>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">{fn.category}</span>
                      </td>
                      <td className="p-3.5 align-top text-center">
                        {getLevelBadge(fn.testedPartyLevel)}
                      </td>
                      <td className="p-3.5 align-top text-center">
                        {getLevelBadge(fn.foreignAffiliateLevel)}
                        <span className="block text-[9px] text-slate-400 mt-1 truncate max-w-[120px]">{fn.foreignEntity}</span>
                      </td>
                      <td className="p-3.5 align-top text-slate-700 dark:text-slate-300 leading-relaxed">
                        {fn.auditorFindings}
                      </td>
                      <td className="p-3.5 align-top font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {fn.evidenceRef}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Auditor Analytical Synthesis Card */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 size={15} className="text-indigo-600" />
            Statutory Functional Characterization Conclusion
          </h4>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            Based on the physical inspection of the Akaki-Kality factory and interviews with operational leadership, 
            the Ethiopian affiliate possesses neither product design autonomy nor strategic pricing power. 
            Consequently, under Article 6 of Directive No. 43/2015, the taxpayer is conclusively characterized as a 
            <strong> routine contract toll-manufacturer and limited-risk distributor</strong>. 
            Under the arm’s length principle, a limited-risk entity must not be exposed to multi-year losses 
            and is entitled to a stable, routine operating margin.
          </p>
        </div>

        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateSubStep('3.1')}
            className="text-xs"
          >
            ← Back to 3.1 IDR Log
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={async () => {
                await executeApiAction('/field-work', {
                  farFunctions,
                  characterization: 'LIMITED_RISK_DISTRIBUTOR_TOLL_MANUFACTURER',
                  subStep: '3.2',
                  status: 'COMPLETED'
                }, 'FAR Functional Analysis recorded.');
                onToggleComplete('3.2', !isDone, { farFunctions });
              }}
              disabled={saving}
              className={isDone ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
            >
              <Check size={14} className="mr-1.5" />
              {isDone ? 'Sub-Step 3.2 Completed ✓ (Click to Re-Save)' : 'Mark Sub-Step 3.2 Complete'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigateSubStep('3.3')}
              className="text-xs"
            >
              Continue to 3.3 DEMPE Assets <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 3.3 Asset Utilization Verification (DEMPE)
  // ==========================================
  if (subStepId === '3.3') {
    return (
      <div className="space-y-6">
        {/* Statutory Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-blue-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white uppercase tracking-wider">
              Phase 3.3 Field Work
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              OECD BEPS Action 8-10 & Directive No. 43/2015 Art. 12
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <Shield className="text-emerald-600 dark:text-emerald-400" size={18} />
            Asset Utilization & DEMPE Analysis (Development, Enhancement, Maintenance, Protection, Exploitation)
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-4xl">
            Legal ownership of intangibles alone does not confer the right to retain all returns derived from those intangibles. 
            Entities that perform DEMPE functions, contribute assets, or bear risks must receive an arm’s length return.
          </p>
        </div>

        {/* DEMPE Matrix Table */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex justify-between items-center">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Intangible Property DEMPE Verification Schedule
            </h4>
            <Badge variant="outline" className="text-xs">
              OECD BEPS Action 8-10 Aligned
            </Badge>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {dempeAssets.map((asset) => (
              <div key={asset.id} className="p-4 space-y-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {asset.type}
                      </span>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                        {asset.assetName}
                      </h5>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Legal Owner: <strong className="text-slate-800 dark:text-slate-200">{asset.legalOwner}</strong> • 
                      Economic Conduct: <span className="text-slate-700 dark:text-slate-300">{asset.economicConduct}</span>
                      {asset.netBookValue && (
                        <span> • Net Book Value: <strong className="text-slate-900 dark:text-white font-mono">ETB {asset.netBookValue.toLocaleString()}</strong></span>
                      )}
                    </p>
                  </div>
                </div>

                {/* DEMPE Functions Breakdown Badges (for intangibles) */}
                {asset.devEntity && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-[10px] pt-1">
                    <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700">
                      <span className="text-slate-400 uppercase block font-bold">Development (D)</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block mt-0.5">{asset.devEntity}</span>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700">
                      <span className="text-slate-400 uppercase block font-bold">Enhancement (E)</span>
                      <span className="font-semibold text-indigo-700 dark:text-indigo-300 truncate block mt-0.5">{asset.enhEntity}</span>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700">
                      <span className="text-slate-400 uppercase block font-bold">Maintenance (M)</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block mt-0.5">{asset.maintEntity}</span>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700">
                      <span className="text-slate-400 uppercase block font-bold">Protection (P)</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block mt-0.5">{asset.protEntity}</span>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700">
                      <span className="text-slate-400 uppercase block font-bold">Exploitation (E)</span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-300 truncate block mt-0.5">{asset.explEntity}</span>
                    </div>
                  </div>
                )}

                {/* Auditor Evidentiary Assessment */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <ShieldCheck size={12} className="text-emerald-500" /> Auditor DEMPE Evaluation:
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">
                    {asset.auditorAssessment}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tangible Fixed Asset Summary Box */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Total Audited Tangible Asset Base (Akaki Plant & Mojo Depot)
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Verified physical plant machinery and cold chain logistics equipment totaled ETB 255,000,000 net book value.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Net Fixed Assets</span>
            <p className="text-base font-bold text-slate-900 dark:text-white font-mono">ETB 255,000,000</p>
          </div>
        </div>

        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateSubStep('3.2')}
            className="text-xs"
          >
            ← Back to 3.2 FAR Analysis
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={async () => {
                await executeApiAction('/field-work', {
                  dempeAssets,
                  subStep: '3.3',
                  status: 'COMPLETED'
                }, 'DEMPE Intangible & Asset verification saved.');
                onToggleComplete('3.3', !isDone, { dempeAssets });
              }}
              disabled={saving}
              className={isDone ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
            >
              <Check size={14} className="mr-1.5" />
              {isDone ? 'Sub-Step 3.3 Completed ✓ (Click to Re-Save)' : 'Mark Sub-Step 3.3 Complete'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigateSubStep('3.4')}
              className="text-xs"
            >
              Continue to 3.4 Risk Assessment <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 3.4 Risk Allocation & Assumption Assessment
  // ==========================================
  if (subStepId === '3.4') {
    return (
      <div className="space-y-6">
        {/* Statutory Header */}
        <div className="p-4 bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-red-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-600 text-white uppercase tracking-wider">
              Phase 3.4 Field Work
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Directive No. 43/2015 Art. 6 & OECD Transfer Pricing Guidelines Ch. 1 Sec. D.1
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <AlertTriangle className="text-amber-600 dark:text-amber-400" size={18} />
            Risk Allocation & Assumption Assessment (6 Key Business Risks)
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-4xl">
            Under transfer pricing rules, contractual allocation of risk is respected only if:
            (1) The party exercises managerial control over the risk, and 
            (2) Possesses the financial capacity to bear the negative consequences if the risk materializes.
          </p>
        </div>

        {/* 6 Key Risks Realignment Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {risks.map((risk) => {
            const isReclassified = risk.realignment.includes('RECLASSIFIED');
            return (
              <div 
                key={risk.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isReclassified 
                    ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                } shadow-sm space-y-3`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {risk.category} RISK
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                      {risk.riskName}
                    </h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                    isReclassified
                      ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}>
                    {isReclassified ? 'Risk Misalignment Found' : 'Contract & Conduct Aligned'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="p-2 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Contractual Bearer</span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium block mt-0.5">{risk.contractualBearer}</span>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Actual Conduct Bearer</span>
                    <span className="text-amber-700 dark:text-amber-300 font-medium block mt-0.5">{risk.actualConductBearer}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Financial Capacity:</span> {risk.financialCapacity}
                </div>

                <div className="p-2.5 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <strong className="text-slate-900 dark:text-white block text-[11px]">Auditor Substance Finding:</strong>
                  {risk.auditorEvaluation}
                </div>

                <div className={`p-2 rounded-lg text-[11px] font-medium ${
                  isReclassified
                    ? 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800'
                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                }`}>
                  {risk.realignment}
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateSubStep('3.3')}
            className="text-xs"
          >
            ← Back to 3.3 DEMPE Assets
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={async () => {
                await executeApiAction('/field-work', {
                  risks,
                  subStep: '3.4',
                  status: 'COMPLETED'
                }, 'Risk Allocation & Conduct Assessment saved.');
                onToggleComplete('3.4', !isDone, { risks });
              }}
              disabled={saving}
              className={isDone ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
            >
              <Check size={14} className="mr-1.5" />
              {isDone ? 'Sub-Step 3.4 Completed ✓ (Click to Re-Save)' : 'Mark Sub-Step 3.4 Complete'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigateSubStep('3.5')}
              className="text-xs"
            >
              Continue to 3.5 Site Inspections <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ==============================================================
  // 3.5 On-Site Operational Inspection & Personnel Interviews
  // ==============================================================
  if (subStepId === '3.5') {
    return (
      <div className="space-y-6">
        {/* Statutory Header */}
        <div className="p-4 bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 dark:from-sky-950/40 dark:via-blue-950/30 dark:to-indigo-950/20 border border-sky-200 dark:border-sky-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-600 text-white uppercase tracking-wider">
              Phase 3.5 Field Work
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Tax Administration Proclamation No. 983/2016 Art. 47 & 48
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <Building2 className="text-sky-600 dark:text-sky-400" size={18} />
            On-Site Operational Walkthroughs & Structured Executive Interviews
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-4xl">
            Under Article 47, authorized tax officers possess the statutory power to enter business premises, 
            inspect operational equipment, examine live ERP electronic systems, and interview officers under formal caution.
          </p>
        </div>

        {/* Section 1: Physical Inspections Log */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex justify-between items-center">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <MapPin size={14} className="text-sky-600" /> Physical Facility Walkthrough Inspections ({inspections.length} Locations)
            </h4>
            <Badge variant="outline" className="text-xs">Art. 47 Power Exercised</Badge>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {inspections.map((insp) => (
              <div key={insp.id} className="p-4 space-y-2 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                      {insp.date}
                    </span>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      {insp.location}
                    </h5>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Inspection Verified
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Attendees: <strong className="text-slate-700 dark:text-slate-300">{insp.attendees}</strong> • 
                  Focus Area: <span className="font-medium text-slate-800 dark:text-slate-200">{insp.focusArea}</span>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700">
                  {insp.findings}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Structured Key Personnel Interviews */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex justify-between items-center">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck size={14} className="text-indigo-600" /> Formal Personnel Interview Records ({interviews.length} Key Officers)
            </h4>
            <Badge variant="outline" className="text-xs">Formal Witness Testimony</Badge>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {interviews.map((intv) => (
              <div key={intv.id} className="p-4 space-y-2 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {intv.date}
                    </span>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                      {intv.interviewee} — <span className="text-slate-500 dark:text-slate-400 font-normal">{intv.role}</span>
                    </h5>
                  </div>
                  <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
                    Signed Statement On File
                  </span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs space-y-2">
                  <div className="text-slate-600 dark:text-slate-400 italic whitespace-pre-line text-[11px]">
                    {intv.keyQuestions}
                  </div>
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 leading-relaxed font-serif">
                    {intv.verbatimNotes}
                  </div>
                  <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 pt-0.5">
                    <strong>Auditor Evidentiary Significance:</strong> {intv.significance}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateSubStep('3.4')}
            className="text-xs"
          >
            ← Back to 3.4 Risk Assessment
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={async () => {
                await executeApiAction('/field-work', {
                  inspections,
                  interviews,
                  subStep: '3.5',
                  status: 'COMPLETED'
                }, 'Operational Inspections and Interview records saved.');
                onToggleComplete('3.5', !isDone, { inspections, interviews });
              }}
              disabled={saving}
              className={isDone ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
            >
              <Check size={14} className="mr-1.5" />
              {isDone ? 'Sub-Step 3.5 Completed ✓ (Click to Re-Save)' : 'Mark Sub-Step 3.5 Complete'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigateSubStep('3.6')}
              className="text-xs"
            >
              Continue to 3.6 Statement of Facts <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ==============================================================
  // 3.6 Formal Statement of Facts Compilation
  // ==============================================================
  if (subStepId === '3.6') {
    return (
      <div className="space-y-6">
        {/* Statutory Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-blue-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white uppercase tracking-wider">
              Phase 3.6 Milestone Closure
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Tax Administration Proclamation No. 983/2016 Art. 79 & Directive 43/2015
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <FileCheck className="text-emerald-600 dark:text-emerald-400" size={18} />
            Formal Statement of Facts (SoF) Compilation & Taxpayer Joint Protocol
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-4xl">
            Establishing an agreed factual foundation prior to undertaking economic benchmarking prevents late factual disputes. 
            The Statement of Facts catalogs accepted operational truths alongside any taxpayer reservations.
          </p>
        </div>

        {/* Official Statement of Facts Document Preview */}
        <div className="border-2 border-slate-300 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-md space-y-6 max-w-4xl mx-auto">
          {/* Official Letterhead */}
          <div className="text-center border-b-2 border-slate-200 dark:border-slate-800 pb-4 space-y-1">
            <div className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">
              Federal Democratic Republic of Ethiopia • Ministry of Revenues
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-wide pt-1">
              TRANSFER PRICING AUDIT STATEMENT OF FACTS (SoF)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Statutory Instrument Ref: MOR/LTO/TP-SOF/2026/0042 • Tax Years: FY 2020 - FY 2024
            </p>
          </div>

          {/* Dossier Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-bold">Taxpayer</span>
              <strong className="text-slate-800 dark:text-slate-200">Apex Healthcare Ethiopia SC</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-bold">Taxpayer TIN</span>
              <strong className="text-slate-800 dark:text-slate-200 font-mono">0002847192</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-bold">Tax Center</span>
              <strong className="text-slate-800 dark:text-slate-200">Federal LTO-1</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block font-bold">Audit Status</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                Facts Finalized
              </span>
            </div>
          </div>

          {/* Characterization Finding */}
          <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl space-y-1">
            <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider">
              1. Agreed Functional Characterization of Tested Party
            </h4>
            <p className="text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed">
              Taxpayer operates within the multinational structure as a <strong>Limited-Risk Toll Manufacturer & Routine Distributor</strong>. 
              All strategic planning, active ingredient formulation, and core intellectual property belong to foreign affiliates. 
              The taxpayer has generated ETB 34M in local brand marketing enhancements without corresponding compensation.
            </p>
          </div>

          {/* Agreed Operational Facts */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-600" /> 2. Confirmed & Agreed Operational Facts ({agreedFacts.length})
            </h4>
            <div className="space-y-1.5">
              {agreedFacts.map((fact, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2.5 bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-xl text-xs text-slate-800 dark:text-slate-200">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">{idx + 1}.</span>
                  <span className="flex-1 leading-relaxed">{fact}</span>
                </div>
              ))}
            </div>

            {!isReadOnly && (
              <div className="flex gap-2 pt-1">
                <Input
                  size="sm"
                  value={newAgreedFact}
                  onChange={(e) => setNewAgreedFact(e.target.value)}
                  placeholder="Add another verified factual finding..."
                  className="text-xs"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (newAgreedFact.trim()) {
                      setAgreedFacts(prev => [...prev, newAgreedFact.trim()]);
                      setNewAgreedFact('');
                    }
                  }}
                  className="shrink-0 text-xs"
                >
                  <Plus size={13} className="mr-1" /> Add Fact
                </Button>
              </div>
            )}
          </div>

          {/* Taxpayer Contested Points & Reservations */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-amber-600" /> 3. Taxpayer Contested Points & Stated Reservations ({disputedFacts.length})
            </h4>
            <div className="space-y-1.5">
              {disputedFacts.map((disp, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2.5 bg-amber-50/40 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 rounded-xl text-xs text-slate-800 dark:text-slate-200">
                  <span className="font-bold text-amber-600 dark:text-amber-400 text-xs">{idx + 1}.</span>
                  <span className="flex-1 leading-relaxed">{disp}</span>
                </div>
              ))}
            </div>

            {!isReadOnly && (
              <div className="flex gap-2 pt-1">
                <Input
                  size="sm"
                  value={newDisputedFact}
                  onChange={(e) => setNewDisputedFact(e.target.value)}
                  placeholder="Record additional taxpayer reservation..."
                  className="text-xs"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (newDisputedFact.trim()) {
                      setDisputedFacts(prev => [...prev, newDisputedFact.trim()]);
                      setNewDisputedFact('');
                    }
                  }}
                  className="shrink-0 text-xs"
                >
                  <Plus size={13} className="mr-1" /> Add Reservation
                </Button>
              </div>
            )}
          </div>

          {/* Joint Sign-Off Block */}
          <div className="border-t-2 border-slate-200 dark:border-slate-800 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Lead Transfer Pricing Auditor</span>
              <strong className="text-slate-900 dark:text-white block">Audit Officer — TP Directorate</strong>
              <p className="text-[11px] text-slate-500 font-mono">Signed digitally via ITAS PKI on 2026-09-10</p>
              <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 pt-1">
                <CheckCircle2 size={12} /> Formal Auditor Certification Verified
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Taxpayer Authorized Representative</span>
              <strong className="text-slate-900 dark:text-white block">Ato Dawit Tadesse (Managing Director)</strong>
              <p className="text-[11px] text-slate-500 font-mono">Acknowledged receipt with reservations on 2026-09-12</p>
              <div className="text-[10px] text-blue-600 font-bold flex items-center gap-1 pt-1">
                <CheckCircle2 size={12} /> Taxpayer Signature Received
              </div>
            </div>
          </div>
        </div>

        {/* Milestone Governance Complete Card */}
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck size={16} /> Phase 3 Field Work Substantively Concluded
            </h4>
            <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
              All 6 field work sub-steps (IDRs, FAR, DEMPE, Risks, Inspections, SoF) are fully documented. 
              The case is ready for Phase 4 Economic Analysis & IQR Benchmarking.
            </p>
          </div>
          {onProceedToPhase && (
            <Button
              size="sm"
              onClick={() => {
                onProceedToPhase('ANALYSIS');
                if (onSelectSubStep) onSelectSubStep('4.1');
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shrink-0 shadow-sm"
            >
              Proceed to Phase 4: Economic Analysis <ArrowRight size={14} className="ml-1.5" />
            </Button>
          )}
        </div>

        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateSubStep('3.5')}
            className="text-xs"
          >
            ← Back to 3.5 Site Inspections
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={async () => {
                await executeApiAction('/field-work', {
                  statementOfFacts: {
                    agreedFacts,
                    disputedFacts,
                    taxpayerSigned,
                    status: 'FINALIZED'
                  },
                  subStep: '3.6',
                  status: 'COMPLETED'
                }, 'Statement of Facts finalized and locked into evidence repository.');
                onToggleComplete('3.6', !isDone, { agreedFacts, disputedFacts });
              }}
              disabled={saving}
              className={isDone ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
            >
              <Check size={14} className="mr-1.5" />
              {isDone ? 'Sub-Step 3.6 Completed ✓ (Click to Re-Save)' : 'Finalize & Mark Sub-Step 3.6 Complete'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
