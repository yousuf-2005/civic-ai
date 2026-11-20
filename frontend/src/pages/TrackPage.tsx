import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  FileText,
  Sparkles,
  AlertCircle,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { api } from '../services/api';
import { Complaint } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { MapPicker } from '../components/common/MapPicker';
import { Alert } from '../components/common/Alert';

export const TrackPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRef = searchParams.get('ref') || '';

  const [refInput, setRefInput] = useState(initialRef);
  const [loading, setLoading] = useState(false);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [letterOpen, setLetterOpen] = useState(false);

  const fetchComplaint = async (reference: string) => {
    if (!reference.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const data = await api.trackComplaint(reference.trim());
      setComplaint(data);
      setSearchParams({ ref: reference.trim() });
    } catch (err: any) {
      setComplaint(null);
      setError(err.message || 'No complaint found matching this reference.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialRef) {
      fetchComplaint(initialRef);
    }
  }, [initialRef]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchComplaint(refInput);
  };

  const handleCopyRef = () => {
    if (complaint) {
      navigator.clipboard.writeText(complaint.reference_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Title */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-civic-600 uppercase tracking-widest bg-civic-50 px-3 py-1 rounded-full border border-civic-100">
          <Search className="w-3.5 h-3.5" />
          <span>Public Grievance Registry</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Track Grievance Status
        </h1>
        <p className="text-sm text-slate-500">
          Enter your Civic AI tracking reference code to check on-site inspection, triage, and resolution progress in real time.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSubmit} className="pt-4 flex gap-2 max-w-md mx-auto">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={refInput}
              onChange={(e) => setRefInput(e.target.value)}
              placeholder="e.g. CIV-20261025-A101"
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-300 text-sm font-mono uppercase focus:ring-2 focus:ring-civic-500 focus:outline-none bg-white shadow-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !refInput.trim()}
            className="px-6 py-3 bg-civic-600 text-white rounded-2xl text-sm font-bold shadow hover:bg-civic-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Track'}
          </button>
        </form>

        <p className="text-xs text-slate-400">
          Tip: You can test with demo references like <span className="font-mono font-semibold text-slate-600">CIV-20261025-A101</span>
        </p>
      </div>

      {loading && <LoadingSpinner label="Retrieving grievance record from registry..." />}

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* Complaint Details Card */}
      {complaint && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-6 sm:p-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-civic-800 bg-civic-50 px-3 py-1 rounded-lg border border-civic-200">
                  {complaint.reference_number}
                </span>
                <button
                  onClick={handleCopyRef}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                  title="Copy reference"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
                {complaint.title}
              </h2>
              <div className="text-xs text-slate-500 flex items-center gap-4 flex-wrap pt-1">
                <span className="bg-slate-100 px-2.5 py-0.5 rounded-full font-medium text-slate-700">
                  {complaint.category}
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(complaint.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            <div className="self-start sm:self-auto">
              <StatusBadge status={complaint.status} size="lg" />
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Resolution Timeline & Audit Trail
            </h3>
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {complaint.timeline.map((entry, idx) => (
                <div key={entry.id || idx} className="relative group">
                  <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-civic-600 border-2 border-white shadow-sm" />
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
                    <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                      <span className="font-bold text-slate-900">
                        Status changed to: <span className="text-civic-700">{entry.new_status}</span>
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        {new Date(entry.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {entry.remarks && (
                      <p className="text-xs text-slate-600 leading-relaxed pt-1">
                        {entry.remarks}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Image & Description Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Description */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Grievance Description
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-200">
                {complaint.description}
              </p>

              {/* AI Verification Insights */}
              {complaint.ai_valid_image && (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Multimodal AI Verification Record</span>
                    {complaint.is_mock_ai && (
                      <span className="text-[10px] text-emerald-700 font-mono">(Demo Mode)</span>
                    )}
                  </div>
                  <p className="text-emerald-800 leading-relaxed">
                    {complaint.ai_description}
                  </p>
                </div>
              )}
            </div>

            {/* Photo Preview */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Photographic Evidence
              </h3>
              {complaint.image_filename ? (
                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-inner flex items-center justify-center max-h-72">
                  <img
                    src={`/api/complaints/image/${complaint.image_filename}`}
                    alt="Uploaded Evidence"
                    className="w-full h-64 object-contain"
                  />
                </div>
              ) : (
                <div className="h-44 bg-slate-100 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-slate-400 text-xs">
                  <FileText className="w-8 h-8 mb-2" />
                  <span>No photographic file attached</span>
                </div>
              )}
            </div>
          </div>

          {/* Location Map */}
          {complaint.latitude && complaint.longitude && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Geographic Pin on OpenStreetMap
              </h3>
              <MapPicker
                latitude={complaint.latitude}
                longitude={complaint.longitude}
                address={complaint.location_address || ''}
                onLocationChange={() => {}}
                readOnly={true}
                height="280px"
              />
            </div>
          )}

          {/* Generated Formal Letter Collapsible */}
          {complaint.complaint_letter && (
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setLetterOpen(!letterOpen)}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl text-xs font-bold text-slate-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-civic-600" />
                  <span>View Registered Municipal Complaint Letter</span>
                </div>
                {letterOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {letterOpen && (
                <div className="mt-3 p-5 bg-white border border-slate-200 rounded-2xl font-mono text-xs leading-relaxed text-slate-700 whitespace-pre-wrap shadow-inner">
                  {complaint.complaint_letter}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
