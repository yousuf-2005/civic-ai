import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, FileText, Sparkles, MapPin, Copy, Check } from 'lucide-react';
import { api } from '../services/api';
import { Complaint } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { MapPicker } from '../components/common/MapPicker';
import { Alert } from '../components/common/Alert';

export const ComplaintDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) {
      api
        .getComplaintById(id)
        .then(setComplaint)
        .catch((err) => setError(err.message || 'Complaint not found.'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <LoadingSpinner label="Loading grievance details..." />
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <Alert type="error" message={error || 'Complaint not found.'} />
        <div className="mt-4 text-center">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-civic-600 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Public Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-civic-800 bg-civic-50 px-2.5 py-1 rounded-lg border border-civic-200">
                {complaint.reference_number}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(complaint.reference_number);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="p-1 text-slate-400 hover:text-slate-600"
                title="Copy reference"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              {complaint.title}
            </h1>
            <div className="text-xs text-slate-400 flex items-center gap-4 flex-wrap pt-1">
              <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-medium">
                {complaint.category}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(complaint.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
          <StatusBadge status={complaint.status} size="lg" />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-8 shadow-sm">
        {/* Description & Photo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Grievance Description
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200">
              {complaint.description}
            </p>

            {complaint.ai_valid_image && (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>AI Visual Evidence Analysis</span>
                  {complaint.is_mock_ai && (
                    <span className="text-[10px] text-emerald-700 font-mono">(Demo Mode)</span>
                  )}
                </div>
                <p className="text-emerald-800 leading-relaxed">{complaint.ai_description}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Photographic Record
            </h3>
            {complaint.image_filename ? (
              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center max-h-72">
                <img
                  src={`/api/complaints/image/${complaint.image_filename}`}
                  alt="Evidence"
                  className="w-full h-64 object-contain"
                />
              </div>
            ) : (
              <div className="h-44 bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 text-xs">
                No photo attached
              </div>
            )}
          </div>
        </div>

        {/* Location Map */}
        {complaint.latitude && complaint.longitude && (
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              OpenStreetMap Pin
            </h3>
            <MapPicker
              latitude={complaint.latitude}
              longitude={complaint.longitude}
              address={complaint.location_address || ''}
              onLocationChange={() => {}}
              readOnly={true}
              height="260px"
            />
          </div>
        )}

        {/* Timeline */}
        <div className="space-y-4 pt-2 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Lifecycle Timeline
          </h3>
          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {complaint.timeline.map((entry, idx) => (
              <div key={idx} className="relative">
                <div className="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full bg-civic-600 border-2 border-white shadow-sm" />
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>{entry.new_status}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(entry.created_at).toLocaleString()}
                    </span>
                  </div>
                  {entry.remarks && <p className="text-slate-600">{entry.remarks}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
