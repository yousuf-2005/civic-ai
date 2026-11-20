import React from 'react';
import { Link } from 'react-router-dom';
import { Complaint } from '../../types';
import { StatusBadge } from './StatusBadge';
import { MapPin, Calendar, ArrowRight, Sparkles } from 'lucide-react';

interface Props {
  complaint: Complaint;
  showAdminActions?: boolean;
}

export const ComplaintCard: React.FC<Props> = ({ complaint }) => {
  const formattedDate = new Date(complaint.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-slate-300 transition-all p-5 flex flex-col justify-between group">
      <div>
        {/* Header with Reference & Status */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="font-mono text-xs font-bold text-civic-800 bg-civic-50 px-2.5 py-1 rounded-lg border border-civic-100">
            {complaint.reference_number}
          </span>
          <StatusBadge status={complaint.status} size="sm" />
        </div>

        {/* Title */}
        <h3 className="font-bold text-base text-slate-900 group-hover:text-civic-600 transition-colors line-clamp-1 mb-1.5">
          {complaint.title}
        </h3>

        {/* Category tag */}
        <div className="inline-block text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full mb-3">
          {complaint.category}
        </div>

        {/* Description snippet */}
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
          {complaint.description}
        </p>

        {/* AI verification badge */}
        {complaint.ai_valid_image && (
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 mb-4 w-fit">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>AI Verified Evidence</span>
            {complaint.is_mock_ai && (
              <span className="text-[10px] text-emerald-600 font-mono">(Demo Mode)</span>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3 truncate pr-2">
          {complaint.location_address && (
            <span className="flex items-center gap-1 truncate max-w-[140px] text-slate-500">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
              <span className="truncate">{complaint.location_address}</span>
            </span>
          )}
          <span className="flex items-center gap-1 flex-shrink-0">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{formattedDate}</span>
          </span>
        </div>

        <Link
          to={`/complaints/${complaint.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-civic-600 hover:text-civic-700 flex-shrink-0 group-hover:translate-x-0.5 transition-transform"
        >
          Details <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
