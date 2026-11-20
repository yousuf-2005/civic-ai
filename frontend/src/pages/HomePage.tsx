import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FilePlus2,
  Search,
  Sparkles,
  MapPin,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Layers,
  ArrowRight,
  HelpCircle,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { api } from '../services/api';
import { DashboardStats, CIVIC_CATEGORIES } from '../types';

export const HomePage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    api.getDashboardStats().then(setStats).catch(() => {});
  }, []);

  const steps = [
    {
      num: '01',
      title: 'Snap & Upload Evidence',
      desc: 'Take a clear photo of the public infrastructure hazard, road cavity, uncollected trash, or broken amenity.',
      icon: Layers,
    },
    {
      num: '02',
      title: 'AI Visual Verification',
      desc: 'Gemini Vision inspects the photo, detects the civic issue category, confirms relevance, and extracts objective facts.',
      icon: Sparkles,
    },
    {
      num: '03',
      title: 'Draft Formal Grievance',
      desc: 'Generates a respectful, well-structured municipal complaint letter ready for citizen review and editing.',
      icon: FileText,
    },
    {
      num: '04',
      title: 'Track Until Resolved',
      desc: 'Receive a permanent public reference code and follow status progression through inspection to completion.',
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="space-y-24 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 md:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-civic-50 border border-civic-200 text-civic-700 text-xs font-semibold mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-civic-600" />
            <span>AI-Assisted Grievance Redressal for Citizens</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-4xl mx-auto">
            Transform civic complaints into{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-civic-600 to-civic-800">
              verified municipal action
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Report damaged roads, garbage dumps, broken streetlights, and drainage issues. Civic AI validates photo evidence with Google Gemini, drafts formal complaint letters, and tracks resolution transparently.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/report"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-civic-600 text-white font-bold text-base shadow-lg shadow-civic-600/25 hover:bg-civic-700 hover:shadow-civic-600/35 transition-all"
            >
              <FilePlus2 className="w-5 h-5" />
              Report an Issue Now
            </Link>
            <Link
              to="/track"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white border border-slate-300 text-slate-700 font-semibold text-base shadow-sm hover:bg-slate-50 transition-colors"
            >
              <Search className="w-5 h-5 text-slate-400" />
              Track Existing Grievance
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          {stats && (
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
              <div className="text-center p-3 border-r border-slate-100 last:border-0">
                <div className="text-3xl font-extrabold text-slate-900">{stats.total}</div>
                <div className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">
                  Total Complaints
                </div>
              </div>
              <div className="text-center p-3 border-r border-slate-100 last:border-0">
                <div className="text-3xl font-extrabold text-blue-600">{stats.submitted}</div>
                <div className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">
                  Submitted
                </div>
              </div>
              <div className="text-center p-3 border-r border-slate-100 last:border-0">
                <div className="text-3xl font-extrabold text-amber-600">{stats.in_progress}</div>
                <div className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">
                  In Progress
                </div>
              </div>
              <div className="text-center p-3">
                <div className="text-3xl font-extrabold text-emerald-600">{stats.resolved}</div>
                <div className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">
                  Resolved
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* How it Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-civic-600 mb-2">
            Structured Workflow
          </h2>
          <h3 className="text-3xl font-extrabold text-slate-900">How Civic AI Works</h3>
          <p className="mt-3 text-slate-600 text-sm sm:text-base">
            From field evidence to verified municipal dispatch in four seamless stages.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {steps.map((st) => {
            const Icon = st.icon;
            return (
              <div
                key={st.num}
                className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-sm relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-3xl font-black text-slate-200 font-mono">{st.num}</span>
                    <div className="w-10 h-10 rounded-2xl bg-civic-50 text-civic-600 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">{st.title}</h4>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{st.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Supported Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-xs font-bold uppercase tracking-widest text-civic-600 mb-2">
            Coverage Area
          </h2>
          <h3 className="text-3xl font-extrabold text-slate-900">Supported Civic Categories</h3>
          <p className="mt-3 text-slate-600 text-sm sm:text-base">
            Civic AI categorizes grievances automatically using multimodal AI analysis.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CIVIC_CATEGORIES.map((cat, idx) => (
            <div
              key={idx}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-civic-300 hover:shadow-md transition-all flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-civic-50 text-civic-600 flex items-center justify-center flex-shrink-0 font-bold">
                {idx + 1}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">{cat}</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Verified with photographic proof and geographic pin tagging on OpenStreetMap.
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Responsible AI & Trust Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-8 sm:p-12 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Responsible AI & Citizen Privacy</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                Human-Centric, Transparent AI
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Civic AI does not use AI to silently judge or discard citizens. Gemini assists citizens in documenting evidence objectively, eliminating facial scanning or personal profiling, and generating polite, actionable complaint letters without fabricating facts.
              </p>
              <ul className="space-y-2 text-xs text-slate-300 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Images are scanned strictly for physical infrastructure defects.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Citizens retain full editorial control over generated letters.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Zero fabricated government officer names or fake statutes.</span>
                </li>
              </ul>
            </div>

            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/60 space-y-4">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-civic-400" />
                <span>Civic AI Platform Scope</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Civic AI provides an independent digital grievance repository with public auditing. Statuses are recorded in real-time, giving municipal wards clear data on community priorities.
              </p>
              <div className="pt-3 border-t border-slate-700">
                <Link
                  to="/report"
                  className="inline-flex items-center gap-2 text-xs font-bold text-civic-400 hover:text-civic-300 transition-colors"
                >
                  Start your first grievance report <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
