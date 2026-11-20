import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ShieldCheck, Heart, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-20 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5 font-bold text-xl text-white">
              <div className="w-9 h-9 rounded-xl bg-civic-600 flex items-center justify-center text-white">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <span>
                Civic<span className="text-civic-400">AI</span>
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md">
              An intelligent, transparent civic tech platform empowering citizens to report public infrastructure defects, validate photographic evidence using multimodal AI, and generate formal municipal complaint letters.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 max-w-md">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>
                <strong>Responsible AI & Privacy:</strong> Civic AI adheres to strict data privacy principles. Uploaded images are sanitized, faces and individuals are never catalogued, and AI findings are presented as advisory evidence.
              </span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/report" className="hover:text-white transition-colors">
                  Report an Issue
                </Link>
              </li>
              <li>
                <Link to="/track" className="hover:text-white transition-colors">
                  Track Grievance Status
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">
                  Public Civic Dashboard
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Municipal Admin Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal / Attribution */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">
              Attributions & Scope
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                Map data &copy;{' '}
                <a
                  href="https://www.openstreetmap.org/copyright"
                  target="_blank"
                  rel="noreferrer"
                  className="text-civic-400 hover:underline inline-flex items-center gap-0.5"
                >
                  OpenStreetMap <ExternalLink className="w-3 h-3" />
                </a>{' '}
                contributors.
              </li>
              <li>Powered by Google Gemini Multimodal Vision API.</li>
              <li className="pt-2 text-slate-400 leading-relaxed border-t border-slate-800">
                <strong>Disclaimer:</strong> This MVP platform records and tracks complaints within Civic AI. It does not automatically dispatch crews to municipal authorities unless a sanctioned official integration has been configured.
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>&copy; {new Date().getFullYear()} Civic AI Grievance Platform. Open Source Civic Technology.</p>
          <p className="flex items-center gap-1">
            Built for safer, cleaner communities <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
          </p>
        </div>
      </div>
    </footer>
  );
};
