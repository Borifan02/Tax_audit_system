import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Mic,
  FileText,
  CheckCircle2,
  AlertCircle,
  Save,
  Send,
  Building,
  ShieldCheck,
  UploadCloud,
  FileCheck
} from 'lucide-react';
import { EntryConference } from '../../types/audit';

interface StepEntryConferenceProps {
  entryConference: EntryConference;
  onUpdateEntryConference: (updates: Partial<EntryConference>) => Promise<void>;
  onTriggerAutosave: () => void;
}

export const StepEntryConference: React.FC<StepEntryConferenceProps> = ({
  entryConference,
  onUpdateEntryConference,
  onTriggerAutosave
}) => {
  const [scheduledDate, setScheduledDate] = useState(entryConference.scheduledDate);
  const [time, setTime] = useState(entryConference.time);
  const [venue, setVenue] = useState(entryConference.venue);
  const [internalControlsReview, setInternalControlsReview] = useState(entryConference.internalControlsReview);
  const [premisesInspectionFindings, setPremisesInspectionFindings] = useState(entryConference.premisesInspectionFindings);
  const [audioFileName, setAudioFileName] = useState(entryConference.audioRecordingFileName || '');
  const [status, setStatus] = useState(entryConference.status);
  const [taxpayerConfirmed, setTaxpayerConfirmed] = useState(entryConference.taxpayerConfirmedReceipt);
  const [isSaving, setIsSaving] = useState(false);

  // Attendees list management
  const [attendees, setAttendees] = useState(entryConference.attendees || []);
  const [newAttendeeName, setNewAttendeeName] = useState('');
  const [newAttendeeRole, setNewAttendeeRole] = useState('');
  const [newAttendeeOrg, setNewAttendeeOrg] = useState('');

  const handleAddAttendee = () => {
    if (!newAttendeeName.trim()) return;
    setAttendees((prev) => [
      ...prev,
      { name: newAttendeeName, role: newAttendeeRole || 'Auditee Representative', organization: newAttendeeOrg || 'Taxpayer' }
    ]);
    setNewAttendeeName('');
    setNewAttendeeRole('');
    setNewAttendeeOrg('');
  };

  const handleRemoveAttendee = (index: number) => {
    setAttendees((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (updatedStatus?: EntryConference['status']) => {
    setIsSaving(true);
    try {
      await onUpdateEntryConference({
        scheduledDate,
        time,
        venue,
        internalControlsReview,
        premisesInspectionFindings,
        audioRecordingFileName: audioFileName,
        attendees,
        status: updatedStatus || status,
        taxpayerConfirmedReceipt: taxpayerConfirmed,
        taxpayerReceiptDate: taxpayerConfirmed ? (entryConference.taxpayerReceiptDate || new Date().toISOString()) : undefined,
        lastUpdated: new Date().toISOString()
      });
      if (updatedStatus) setStatus(updatedStatus);
      onTriggerAutosave();
    } finally {
      setIsSaving(false);
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFileName(file.name);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-900 tracking-tight">
              Entry Conference with Taxpayer (SOR FR-04.2.1)
            </h3>
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                status === 'CONFIRMED'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : status === 'CONDUCTED'
                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              Status: {status}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Plan, schedule, record minutes, evaluate internal controls, and document on-site plant tours with the taxpayer.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Conference Records'}</span>
          </button>
        </div>
      </div>

      {/* Confirmation Banner */}
      {taxpayerConfirmed ? (
        <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded text-xs text-emerald-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Taxpayer Acknowledged (FR-04.2.1-05):</strong> Entrance conference documentation and scope confirmed by taxpayer CFO Arthur Sterling.
            </span>
          </div>
          <span className="font-mono text-emerald-700">Receipt Confirmed</span>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 p-3.5 rounded text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Awaiting formal electronic acknowledgment of entry conference documentation from taxpayer.</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setTaxpayerConfirmed(true);
              handleSave('CONFIRMED');
            }}
            className="px-2.5 py-1 bg-white border border-amber-300 rounded font-semibold text-amber-900 hover:bg-amber-100"
          >
            Record Taxpayer Receipt
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Meeting Logistics & Attendees (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-gray-200 rounded p-5 shadow-2xs space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              Meeting Logistics & Venue (FR-04.2.1-01)
            </h4>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-gray-500 font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-gray-500 font-medium mb-1">Time</label>
                <input
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-500 font-medium mb-1 text-xs">Venue & Physical Location</label>
              <textarea
                rows={2}
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="E.g. Taxpayer Boardroom / Plant Inspection Tour..."
                className="w-full p-2 border border-gray-300 rounded text-xs leading-relaxed"
              />
            </div>
          </div>

          {/* Attendees Register */}
          <div className="bg-white border border-gray-200 rounded p-5 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              Conference Attendees Register ({attendees.length})
            </h4>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {attendees.map((att, idx) => (
                <div key={idx} className="p-2 bg-gray-50 rounded border border-gray-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-gray-900 block">{att.name}</span>
                    <span className="text-[11px] text-gray-500">{att.role} · {att.organization}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveAttendee(idx)}
                    className="text-gray-400 hover:text-rose-600 p-1"
                    title="Remove attendee"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* Add Attendee row */}
            <div className="pt-2 border-t border-gray-100 space-y-2 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Name"
                  value={newAttendeeName}
                  onChange={(e) => setNewAttendeeName(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded"
                />
                <input
                  type="text"
                  placeholder="Role"
                  value={newAttendeeRole}
                  onChange={(e) => setNewAttendeeRole(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded"
                />
                <input
                  type="text"
                  placeholder="Org"
                  value={newAttendeeOrg}
                  onChange={(e) => setNewAttendeeOrg(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded"
                />
              </div>
              <button
                type="button"
                onClick={handleAddAttendee}
                className="w-full py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded font-semibold text-[11px]"
              >
                + Add Attendee
              </button>
            </div>
          </div>

          {/* Audio Recording Attachment (FR-04.2.1-03) */}
          <div className="bg-white border border-gray-200 rounded p-5 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-indigo-600" />
              Entrance Conference Audio Recording (FR-04.2.1-03)
            </h4>

            <div className="border border-dashed border-gray-300 rounded p-3 text-center bg-gray-50/50">
              <input type="file" id="audio-file" className="hidden" accept="audio/*" onChange={handleAudioUpload} />
              <label htmlFor="audio-file" className="cursor-pointer flex flex-col items-center gap-1 text-gray-600 text-xs">
                <UploadCloud className="w-5 h-5 text-indigo-600" />
                <span className="font-semibold text-indigo-700">Attach Official Audio Recording</span>
                <span className="text-[10px] text-gray-400">MP3, M4A, WAV up to 100MB</span>
              </label>
              {audioFileName && (
                <div className="mt-2 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded inline-flex items-center gap-1 border border-emerald-200">
                  <FileCheck className="w-3.5 h-3.5" />
                  {audioFileName}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Internal Controls & Plant Inspection Observations (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-gray-200 rounded p-6 shadow-2xs space-y-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-2">
            Entrance Interview Substantive Observations (FR-04.2.1-03)
          </h4>

          {/* Internal Controls Review */}
          <div className="space-y-1.5 text-xs">
            <label className="block font-bold text-gray-800 uppercase text-[11px]">
              Evaluation of Internal Accounting Controls & ERP Segregation of Duties <span className="text-rose-500">*</span>
            </label>
            <p className="text-[11px] text-gray-500">
              Document ERP systems (e.g. SAP S/4HANA, Oracle), authorization thresholds, user access matrices, and controls over manual journal entries and stock write-offs.
            </p>
            <textarea
              rows={5}
              value={internalControlsReview}
              onChange={(e) => setInternalControlsReview(e.target.value)}
              placeholder="Record findings on review of internal accounting controls, delegation of authority, IT access controls..."
              className="w-full p-3 border border-gray-300 rounded text-xs leading-relaxed focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Premises & Plant Inspection Findings */}
          <div className="space-y-1.5 text-xs pt-2">
            <label className="block font-bold text-gray-800 uppercase text-[11px]">
              Taxpayer Premises & Manufacturing Plant Inspection Findings <span className="text-rose-500">*</span>
            </label>
            <p className="text-[11px] text-gray-500">
              Observations from physical walk-through, warehouse stock surveys, SCADA meter inspections, production line capacities, and physical assets.
            </p>
            <textarea
              rows={5}
              value={premisesInspectionFindings}
              onChange={(e) => setPremisesInspectionFindings(e.target.value)}
              placeholder="Record physical inspection observations, storage tank calibrations, inventory counting procedures..."
              className="w-full p-3 border border-gray-300 rounded text-xs leading-relaxed focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Action status switcher */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500 font-medium">Conference Status:</span>
              <select
                value={status}
                onChange={(e) => handleSave(e.target.value as any)}
                className="px-2.5 py-1 border border-gray-300 rounded font-semibold text-gray-800"
              >
                <option value="SCHEDULED">Scheduled</option>
                <option value="CONDUCTED">Conducted</option>
                <option value="CONFIRMED">Confirmed by Taxpayer</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => handleSave('CONDUCTED')}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Conference Conducted</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
