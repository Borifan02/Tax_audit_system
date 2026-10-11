import React, { useState } from 'react';
import {
  Users,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileText,
  Save,
  ShieldAlert,
  DollarSign,
  Download,
  Printer,
  Scale,
  Send,
  Building,
  Check,
  X,
  FileCheck
} from 'lucide-react';
import { ExitConference, AssessmentNotice, AuditFinding, AuditCase } from '../../types/audit';

interface StepExitConferenceAssessmentProps {
  exitConference: ExitConference;
  assessmentNotice: AssessmentNotice;
  findings: AuditFinding[];
  caseData: AuditCase;
  onUpdateExitConference: (updates: Partial<ExitConference>) => Promise<void>;
  onUpdateAssessmentNotice: (updates: Partial<AssessmentNotice>) => Promise<void>;
  onTriggerFraudReferral: (reason: string) => Promise<void>;
  onTriggerAutosave: () => void;
}

export const StepExitConferenceAssessment: React.FC<StepExitConferenceAssessmentProps> = ({
  exitConference,
  assessmentNotice,
  findings,
  caseData,
  onUpdateExitConference,
  onUpdateAssessmentNotice,
  onTriggerFraudReferral,
  onTriggerAutosave
}) => {
  const [activeTab, setActiveTab] = useState<'exitConference' | 'assessmentNotice'>('exitConference');

  // Exit conference local state
  const [scheduledDate, setScheduledDate] = useState(exitConference.scheduledDate);
  const [time, setTime] = useState(exitConference.time);
  const [venue, setVenue] = useState(exitConference.venue);
  const [discussionNotes, setDiscussionNotes] = useState(exitConference.discussionNotes);
  const [taxpayerResponseNotes, setTaxpayerResponseNotes] = useState(exitConference.taxpayerResponseNotes);
  const [signedByTaxpayer, setSignedByTaxpayer] = useState(exitConference.signedByTaxpayer);
  const [attendanceConfirmed, setAttendanceConfirmed] = useState(exitConference.attendanceConfirmed);
  const [status, setStatus] = useState(exitConference.status);
  const [agendaItems, setAgendaItems] = useState<string[]>(exitConference.agendaItems || []);
  const [newAgendaItem, setNewAgendaItem] = useState('');
  const [isSavingExit, setIsSavingExit] = useState(false);

  // Assessment notice local state
  const [noticeNumber, setNoticeNumber] = useState(assessmentNotice.noticeNumber);
  const [issueDate, setIssueDate] = useState(assessmentNotice.issueDate);
  const [statutoryDue30Days, setStatutoryDue30Days] = useState(assessmentNotice.statutoryDue30Days);
  const [principalTax, setPrincipalTax] = useState(assessmentNotice.principalTax);
  const [penaltyRate, setPenaltyRate] = useState(20);
  const [statutoryPenalty20, setStatutoryPenalty20] = useState(assessmentNotice.statutoryPenalty20);
  const [interest, setInterest] = useState(assessmentNotice.interest);
  const [objectionStatus, setObjectionStatus] = useState(assessmentNotice.objectionStatus);
  const [objectionDetails, setObjectionDetails] = useState(assessmentNotice.objectionDetails || '');
  const [isSavingNotice, setIsSavingNotice] = useState(false);

  // Fraud modal
  const [isFraudModalOpen, setIsFraudModalOpen] = useState(false);
  const [fraudReason, setFraudReason] = useState('');
  const [isSubmittingFraud, setIsSubmittingFraud] = useState(false);

  // Recalculate totals
  const totalCalculated = principalTax + statutoryPenalty20 + interest;

  const handlePrincipalChange = (val: number) => {
    setPrincipalTax(val);
    const pen = Math.round(val * (penaltyRate / 100));
    const intVal = Math.round(val * 0.08); // 8% statutory interest
    setStatutoryPenalty20(pen);
    setInterest(intVal);
  };

  const handleAddAgendaItem = () => {
    if (!newAgendaItem.trim()) return;
    setAgendaItems([...agendaItems, newAgendaItem.trim()]);
    setNewAgendaItem('');
  };

  const handleRemoveAgendaItem = (index: number) => {
    setAgendaItems(agendaItems.filter((_, i) => i !== index));
  };

  const handleSaveExit = async (newStatus?: ExitConference['status']) => {
    setIsSavingExit(true);
    try {
      const updatedStatus = newStatus || status;
      await onUpdateExitConference({
        scheduledDate,
        time,
        venue,
        discussionNotes,
        taxpayerResponseNotes,
        signedByTaxpayer,
        attendanceConfirmed,
        status: updatedStatus,
        agendaItems,
        signedDate: signedByTaxpayer ? new Date().toISOString() : undefined
      });
      if (newStatus) setStatus(newStatus);
      onTriggerAutosave();
    } finally {
      setIsSavingExit(false);
    }
  };

  const handleSaveNotice = async () => {
    setIsSavingNotice(true);
    try {
      await onUpdateAssessmentNotice({
        noticeNumber,
        issueDate,
        statutoryDue30Days,
        principalTax,
        statutoryPenalty20,
        interest,
        totalAssessmentDue: totalCalculated,
        objectionStatus,
        objectionDetails
      });
      onTriggerAutosave();
    } finally {
      setIsSavingNotice(false);
    }
  };

  const handleConfirmFraudReferral = async () => {
    if (!fraudReason.trim()) return;
    setIsSubmittingFraud(true);
    try {
      await onTriggerFraudReferral(fraudReason);
      setIsFraudModalOpen(false);
      setFraudReason('');
    } finally {
      setIsSubmittingFraud(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-900 tracking-tight">
              Exit Conference & Statutory Notice of Assessment (SOR FR-04.7-24 & 26)
            </h3>
            <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              Taxpayer: {caseData.taxpayerName}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Conduct formal statutory audit closure, present assessment determinations, record auditee responses, and issue the statutory Notice of Assessment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFraudModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
            Refer to Tax Fraud Directorate
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('exitConference')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'exitConference'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Exit Conference Minutes & Protocol</span>
          <span
            className={`text-2xs px-1.5 py-0.2 rounded font-mono ${
              status === 'COMPLETED' || status === 'SIGNED'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {status}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('assessmentNotice')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'assessmentNotice'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Statutory Notice of Assessment</span>
          <span className="text-2xs px-1.5 py-0.2 rounded font-mono bg-indigo-100 text-indigo-800">
            ${totalCalculated.toLocaleString()}
          </span>
        </button>
      </div>

      {/* TAB 1: EXIT CONFERENCE */}
      {activeTab === 'exitConference' && (
        <div className="space-y-6">
          {/* Scheduling & Venue Card */}
          <div className="bg-white rounded border border-gray-200 p-5 shadow-2xs space-y-4">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Statutory Exit Meeting Scheduling & Attendance
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Conference Date</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Meeting Time</label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="e.g. 02:00 PM"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Venue / Physical Location</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="e.g. Regional Tax Office Boardroom"
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Attendance & Signature checkboxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div
                onClick={() => setAttendanceConfirmed(!attendanceConfirmed)}
                className={`flex items-start gap-3 p-3.5 rounded border cursor-pointer transition-colors ${
                  attendanceConfirmed
                    ? 'bg-emerald-50/50 border-emerald-300 text-emerald-900'
                    : 'bg-gray-50 border-gray-200 text-gray-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded border flex items-center justify-center mt-0.5 ${
                    attendanceConfirmed ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-400 bg-white'
                  }`}
                >
                  {attendanceConfirmed && <Check className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <div className="font-bold text-xs">Official Quorum & Attendance Confirmed</div>
                  <div className="text-2xs text-gray-500 mt-0.5">
                    Authorized representatives (Lead Auditor, Audit Supervisor, Taxpayer Managing Director, CFO) were physically present.
                  </div>
                </div>
              </div>

              <div
                onClick={() => setSignedByTaxpayer(!signedByTaxpayer)}
                className={`flex items-start gap-3 p-3.5 rounded border cursor-pointer transition-colors ${
                  signedByTaxpayer
                    ? 'bg-emerald-50/50 border-emerald-300 text-emerald-900'
                    : 'bg-gray-50 border-gray-200 text-gray-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded border flex items-center justify-center mt-0.5 ${
                    signedByTaxpayer ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-400 bg-white'
                  }`}
                >
                  {signedByTaxpayer && <Check className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <div className="font-bold text-xs">Exit Conference Protocol Signed by Taxpayer</div>
                  <div className="text-2xs text-gray-500 mt-0.5">
                    Taxpayer signed receipt acknowledging comprehensive presentation of findings (preserves statutory 30-day appeal timeline).
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Agenda Items */}
          <div className="bg-white rounded border border-gray-200 p-5 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center justify-between border-b border-gray-100 pb-2">
              <span>Agenda of Exit Deliberations</span>
              <span className="text-gray-500 font-mono text-2xs">{agendaItems.length} Key Deliberations</span>
            </h4>

            <div className="space-y-2">
              {agendaItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-gray-50 rounded border border-gray-200 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-700 w-6">#{idx + 1}</span>
                    <span className="text-gray-800 font-medium">{item}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveAgendaItem(idx)}
                    className="text-gray-400 hover:text-red-600 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={newAgendaItem}
                onChange={(e) => setNewAgendaItem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddAgendaItem()}
                placeholder="Add formal agenda discussion point (e.g. Valuation of unrecorded offshore receipts)..."
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-500"
              />
              <button
                onClick={handleAddAgendaItem}
                className="px-3 py-1.5 text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border border-gray-300"
              >
                Add Agenda
              </button>
            </div>
          </div>

          {/* Discussion & Taxpayer Response Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded border border-gray-200 p-5 shadow-2xs space-y-2">
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider">
                Auditor Findings Presentation & Arguments
              </label>
              <textarea
                rows={7}
                value={discussionNotes}
                onChange={(e) => setDiscussionNotes(e.target.value)}
                placeholder="Detail technical arguments presented during exit conference..."
                className="w-full p-3 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 font-sans"
              />
            </div>

            <div className="bg-white rounded border border-gray-200 p-5 shadow-2xs space-y-2">
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider">
                Taxpayer Concessions & Formal Defense
              </label>
              <textarea
                rows={7}
                value={taxpayerResponseNotes}
                onChange={(e) => setTaxpayerResponseNotes(e.target.value)}
                placeholder="Detail items conceded by taxpayer and items disputed with documentary grounds..."
                className="w-full p-3 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-500 font-sans"
              />
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between p-4 bg-white rounded border border-gray-200 shadow-2xs">
            <div className="text-xs text-gray-500">
              Exit Conference Status: <span className="font-mono font-bold text-gray-800">{status}</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleSaveExit()}
                disabled={isSavingExit}
                className="px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                {isSavingExit ? 'Saving...' : 'Save Draft Minutes'}
              </button>

              <button
                onClick={() => handleSaveExit('COMPLETED')}
                disabled={isSavingExit}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Finalize & Sign Exit Minutes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STATUTORY NOTICE OF ASSESSMENT */}
      {activeTab === 'assessmentNotice' && (
        <div className="space-y-6">
          {/* Summary Box */}
          <div className="bg-white rounded border border-gray-200 p-6 shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-200 gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 font-mono">
                  Statutory Determination · Section 45 Tax Administration Act
                </span>
                <h4 className="text-lg font-bold text-gray-900 mt-1">
                  Notice of Additional Assessment Determination
                </h4>
                <div className="text-xs text-gray-500 mt-0.5">
                  Notice Reference: <span className="font-mono font-bold text-gray-800">{noticeNumber}</span> · Taxpayer: <span className="font-bold text-gray-800">{caseData.taxpayerName}</span> ({caseData.tin})
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded border border-gray-300 flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Formal Notice
                </button>
              </div>
            </div>

            {/* Statutory Numbers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <label className="text-2xs font-bold uppercase text-gray-500 block mb-1">
                  Principal Tax Shortfall
                </label>
                <div className="flex items-center">
                  <span className="text-gray-500 text-sm font-bold mr-1">$</span>
                  <input
                    type="number"
                    value={principalTax}
                    onChange={(e) => handlePrincipalChange(Number(e.target.value))}
                    className="w-full text-base font-bold font-mono text-gray-900 bg-white border border-gray-300 rounded px-2 py-1"
                  />
                </div>
                <div className="text-2xs text-gray-500 mt-1">
                  Across CIT, VAT & PAYE heads
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-2xs font-bold uppercase text-gray-500 block">
                    Statutory Penalty (20%)
                  </label>
                  <span className="text-2xs font-mono font-bold text-indigo-700 bg-indigo-50 px-1 py-0.2 rounded border border-indigo-200">
                    {penaltyRate}% Rate
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-500 text-sm font-bold mr-1">$</span>
                  <input
                    type="number"
                    value={statutoryPenalty20}
                    onChange={(e) => setStatutoryPenalty20(Number(e.target.value))}
                    className="w-full text-base font-bold font-mono text-amber-700 bg-white border border-gray-300 rounded px-2 py-1"
                  />
                </div>
                <div className="text-2xs text-gray-500 mt-1">
                  Mandatory under Sec 83
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <label className="text-2xs font-bold uppercase text-gray-500 block mb-1">
                  Late Interest Schedule
                </label>
                <div className="flex items-center">
                  <span className="text-gray-500 text-sm font-bold mr-1">$</span>
                  <input
                    type="number"
                    value={interest}
                    onChange={(e) => setInterest(Number(e.target.value))}
                    className="w-full text-base font-bold font-mono text-rose-700 bg-white border border-gray-300 rounded px-2 py-1"
                  />
                </div>
                <div className="text-2xs text-gray-500 mt-1">
                  Calculated to notice date
                </div>
              </div>

              <div className="bg-indigo-900 text-white p-4 rounded border border-indigo-800 shadow-sm">
                <label className="text-2xs font-bold uppercase text-indigo-200 block mb-1">
                  Total Assessment Payable
                </label>
                <div className="text-xl font-bold font-mono tracking-tight text-white mt-1">
                  ${totalCalculated.toLocaleString()}
                </div>
                <div className="text-2xs text-indigo-200 mt-1">
                  Legally enforceable tax debt
                </div>
              </div>
            </div>

            {/* Notice Dates & Objection Period */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Notice Issue Date</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">
                  Statutory 30-Day Objection Deadline (Sec 51)
                </label>
                <input
                  type="date"
                  value={statutoryDue30Days}
                  onChange={(e) => setStatutoryDue30Days(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-xs font-mono font-bold text-rose-700 bg-rose-50/40 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Taxpayer Objection Status</label>
                <select
                  value={objectionStatus}
                  onChange={(e) => setObjectionStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-xs bg-white focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="NONE">NONE (No Objection Lodged)</option>
                  <option value="OBJECTION_LODGED">OBJECTION_LODGED (Under Legal Review)</option>
                  <option value="CONFIRMED">CONFIRMED (Taxpayer Agreed & Signed)</option>
                  <option value="APPEALED">APPEALED (Escalated to Tax Appeals Tribunal)</option>
                </select>
              </div>
            </div>

            {/* Breakdown of findings feeding this assessment */}
            <div className="pt-2">
              <h5 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                Substantiated Findings Comprising This Determination
              </h5>
              <div className="border border-gray-200 rounded overflow-hidden">
                <table className="min-w-full text-xs divide-y divide-gray-200">
                  <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-2xs">
                    <tr>
                      <th className="px-4 py-2.5 text-left">Ref</th>
                      <th className="px-4 py-2.5 text-left">Audit Area</th>
                      <th className="px-4 py-2.5 text-left">Finding Title</th>
                      <th className="px-4 py-2.5 text-right">Tax Shortfall</th>
                      <th className="px-4 py-2.5 text-right">Penalty</th>
                      <th className="px-4 py-2.5 text-right">Total Impact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-sans">
                    {findings.map((f) => (
                      <tr key={f.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-mono font-bold text-indigo-700">{f.reference}</td>
                        <td className="px-4 py-2.5 font-medium text-gray-700">{f.auditArea}</td>
                        <td className="px-4 py-2.5 text-gray-800">{f.title}</td>
                        <td className="px-4 py-2.5 text-right font-mono">${f.underDeclaredAmount.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-amber-700">${f.penaltyAmount.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-gray-900">${f.totalTaxImpact.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Objection Notes */}
            {objectionStatus !== 'NONE' && (
              <div className="p-4 bg-amber-50 rounded border border-amber-200 space-y-2">
                <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Taxpayer Formal Objection & Appeals Details
                </label>
                <textarea
                  rows={3}
                  value={objectionDetails}
                  onChange={(e) => setObjectionDetails(e.target.value)}
                  placeholder="Record grounds of objection lodged under Section 51..."
                  className="w-full p-2.5 border border-amber-300 rounded text-xs bg-white text-gray-900 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between p-4 bg-white rounded border border-gray-200 shadow-2xs">
            <div className="text-xs text-gray-500">
              Notice Status: <span className="font-mono font-bold text-emerald-700">DRAFTED & READY FOR ENDORSEMENT</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveNotice}
                disabled={isSavingNotice}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded transition-colors flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                {isSavingNotice ? 'Saving Notice...' : 'Save Assessment Determination'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FRAUD REFERRAL MODAL */}
      {isFraudModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-red-700 text-white">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-white" />
                <h4 className="text-sm font-bold uppercase tracking-wider">
                  Refer Case to Tax Fraud Investigation Directorate
                </h4>
              </div>
              <button onClick={() => setIsFraudModalOpen(false)} className="text-red-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-xs">
                <strong>Statutory Warning:</strong> Triggering a fraud referral freezes administrative negotiations under SOR FR-04.4-28 and transfers docket control to the Special Criminal Investigations Directorate for prosecution under the Penal Code.
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Grounds for Criminal Evasion / Fraud Referral
                </label>
                <textarea
                  rows={4}
                  value={fraudReason}
                  onChange={(e) => setFraudReason(e.target.value)}
                  placeholder="Detail prima facie evidence of deliberate turnover suppression, forged invoices, or parallel accounting books..."
                  className="w-full p-2.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsFraudModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmFraudReferral}
                  disabled={isSubmittingFraud || !fraudReason.trim()}
                  className="px-4 py-2 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded disabled:opacity-50 flex items-center gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {isSubmittingFraud ? 'Referring...' : 'Confirm Fraud Referral'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
