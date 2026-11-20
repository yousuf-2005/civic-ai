import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import {
  LayoutDashboard,
  BarChart3,
  MapPin,
  Clock,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  LogIn,
  FilePlus2,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Complaint, DashboardStats, CategoryStat, MapPoint } from '../types';
import { ComplaintCard } from '../components/common/ComplaintCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Alert } from '../components/common/Alert';

// Leaflet pin icon for dashboard overview map
const miniPinIcon = L.divIcon({
  className: 'dashboard-map-pin',
  html: `
    <div style="
      background-color: #0270c7;
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      border: 2px solid white;
    ">
      <div style="
        transform: rotate(45deg);
        width: 8px;
        height: 8px;
        background-color: white;
        border-radius: 50%;
      "></div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

export const DashboardPage: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [categories, setCategories] = useState<CategoryStat[]>([]);
  const [mapPoints, setMapPoints] = useState<MapPoint[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSessionExpired, setIsSessionExpired] = useState<boolean>(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isFiltering, setIsFiltering] = useState(false);

  const loadDashboardData = useCallback(async (isSilentRefresh = false) => {
    if (!isSilentRefresh) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);
    setIsSessionExpired(false);

    try {
      const [statsData, catData, mapData, listData] = await Promise.all([
        api.getDashboardStats(),
        api.getCategoryStats(),
        api.getMapPoints(),
        api.getComplaints({ page_size: 6 }),
      ]);

      setStats(statsData);
      setCategories(catData.categories || []);
      setMapPoints(mapData || []);
      setComplaints(listData.items || []);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      const errMsg = err?.message || '';
      if (
        err?.status === 401 ||
        errMsg.toLowerCase().includes('expired') ||
        errMsg.toLowerCase().includes('unauthorized') ||
        errMsg.toLowerCase().includes('credentials')
      ) {
        setIsSessionExpired(true);
        logout();
      } else {
        setError(errMsg || 'Failed to aggregate dashboard metrics. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [logout]);

  useEffect(() => {
    // If auth state is still resolving, hold
    if (authLoading) {
      setLoading(true);
      return;
    }

    // If not authenticated or logged out, clear all state immediately
    if (!isAuthenticated || !user) {
      setStats(null);
      setCategories([]);
      setMapPoints([]);
      setComplaints([]);
      setLoading(false);
      setError(null);
      return;
    }

    // Authenticated user: fetch fresh user-scoped dashboard data
    loadDashboardData();
  }, [user?.id, isAuthenticated, authLoading, loadDashboardData]);

  const handleApplyFilter = async () => {
    setIsFiltering(true);
    try {
      const res = await api.getComplaints({
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        search: searchTerm.trim() || undefined,
        page_size: 12,
      });
      setComplaints(res.items);
    } catch (err: any) {
      console.error('Filter query error:', err);
      setError(err?.message || 'Failed to apply filter.');
    } finally {
      setIsFiltering(false);
    }
  };

  const handleResetFilters = async () => {
    setStatusFilter('');
    setCategoryFilter('');
    setSearchTerm('');
    setIsFiltering(true);
    try {
      const res = await api.getComplaints({ page_size: 6 });
      setComplaints(res.items);
    } catch (err: any) {
      console.error('Reset filter error:', err);
    } finally {
      setIsFiltering(false);
    }
  };

  // Fallback map center coordinates
  const defaultLat = mapPoints.length > 0 ? mapPoints[0].latitude : 12.9716;
  const defaultLng = mapPoints.length > 0 ? mapPoints[0].longitude : 77.5946;

  // Unauthenticated Empty State (Missing authentication)
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-civic-50 text-civic-600 flex items-center justify-center mx-auto shadow-sm border border-civic-100">
          <LogIn className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Citizen Dashboard Sign-In Required
          </h1>
          <p className="text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
            Please log in or register a free citizen account to access your personal dashboard, track filed civic grievances, and monitor resolution timelines.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-civic-600 text-white font-bold text-sm shadow hover:bg-civic-700 transition-colors"
          >
            Sign In to Account <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
          >
            Create Citizen Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-civic-600 uppercase tracking-widest bg-civic-50 px-3 py-1 rounded-full border border-civic-100">
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Citizen Dashboard</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">
            My Grievance Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {user?.full_name ? `Welcome back, ${user.full_name}. ` : ''}
            Track your submitted civic issues, status history, and localized resolution data.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => loadDashboardData(true)}
            disabled={loading || refreshing}
            title="Refresh dashboard metrics"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-semibold text-xs shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-civic-600' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <Link
            to="/report"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-civic-600 text-white font-bold text-sm shadow hover:bg-civic-700 transition-colors"
          >
            Report New Issue <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Session Expired Alert */}
      {isSessionExpired && (
        <Alert
          type="warning"
          message="Your login session has expired. Please sign in again to view your dashboard data."
        />
      )}

      {/* Error Alert */}
      {error && (
        <div className="space-y-3">
          <Alert type="error" message={error} />
          <button
            onClick={() => loadDashboardData()}
            className="text-xs font-semibold text-civic-600 hover:underline flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Try reloading data
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center">
          <LoadingSpinner label="Loading your personal civic grievances and statistics..." />
        </div>
      ) : (
        <>
          {/* Key Metric Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Grievances</p>
                  <p className="text-3xl font-black text-slate-900 mt-1">{stats.total}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-500">Submitted</p>
                  <p className="text-3xl font-black text-blue-600 mt-1">{stats.submitted}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-500">In Progress</p>
                  <p className="text-3xl font-black text-amber-600 mt-1">{stats.in_progress}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Wrench className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-500">Resolved</p>
                  <p className="text-3xl font-black text-emerald-600 mt-1">{stats.resolved}</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>
            </div>
          )}

          {/* Map & Category Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Interactive Issue Map */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-civic-600" />
                    <span>Reported Issues Map</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Geographic distribution of your grievances on OpenStreetMap.
                  </p>
                </div>
                <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
                  {mapPoints.length} pins plotted
                </span>
              </div>

              {mapPoints.length === 0 ? (
                <div className="w-full h-80 rounded-2xl bg-slate-50 border border-dashed border-slate-300 flex flex-col items-center justify-center p-6 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-semibold text-slate-600">No geographic coordinates recorded</p>
                  <p className="text-xs text-slate-400 max-w-sm">
                    When you report grievances and select a location pin on the map, they will appear here.
                  </p>
                </div>
              ) : (
                <div className="w-full h-96 rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
                  <MapContainer
                    center={[defaultLat, defaultLng]}
                    zoom={12}
                    scrollWheelZoom={false}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {mapPoints.map((pt) => (
                      <Marker
                        key={pt.id}
                        position={[pt.latitude, pt.longitude]}
                        icon={miniPinIcon}
                      >
                        <Popup>
                          <div className="p-1 space-y-1 text-xs">
                            <span className="font-mono font-bold text-civic-700 block">
                              {pt.reference_number}
                            </span>
                            <span className="font-bold text-slate-900 block">{pt.title}</span>
                            <span className="text-slate-500 block">{pt.category}</span>
                            <span className="inline-block mt-1 font-semibold text-civic-600">
                              Status: {pt.status}
                            </span>
                            <div className="pt-2">
                              <Link
                                to={`/complaints/${pt.id}`}
                                className="text-civic-600 font-bold hover:underline"
                              >
                                View full grievance &rarr;
                              </Link>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              )}
            </div>

            {/* Category Breakdown */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-civic-600" />
                  <span>Category Breakdown</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Frequency volume by grievance domain.
                </p>
              </div>

              <div className="space-y-4">
                {categories.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No complaints recorded yet.</p>
                ) : (
                  categories.map((cat, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-700 truncate pr-2">{cat.category}</span>
                        <span className="text-slate-500 font-mono flex-shrink-0">
                          {cat.count} ({cat.percentage}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-civic-600 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(cat.percentage, 5)}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Filter & Complaints Grid */}
          <div className="space-y-6 pt-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Recent Grievances</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Personal history of complaints filed by your citizen account.
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
                  placeholder="Search title or ref..."
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs w-44 focus:ring-2 focus:ring-civic-500 focus:outline-none"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-civic-500 focus:outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Under Review">Under Review</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Rejected">Rejected</option>
                </select>
                <button
                  onClick={handleApplyFilter}
                  disabled={isFiltering}
                  className="px-4 py-1.5 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-900 transition-colors disabled:opacity-50"
                >
                  {isFiltering ? 'Filtering...' : 'Filter'}
                </button>
                {(statusFilter || searchTerm) && (
                  <button
                    onClick={handleResetFilters}
                    className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Zero-Complaint State vs Filter Empty State */}
            {complaints.length === 0 ? (
              stats?.total === 0 ? (
                /* Brand New User / Zero Complaints Empty State */
                <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center space-y-4 shadow-sm">
                  <div className="w-16 h-16 rounded-2xl bg-civic-50 text-civic-600 flex items-center justify-center mx-auto border border-civic-100">
                    <FilePlus2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-900">You haven't reported any civic grievances yet</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                      Notice a road cavity, overflowing trash, or damaged street amenity? Report it with a photo to have AI verify the issue and draft a formal complaint for municipal review.
                    </p>
                  </div>
                  <div className="pt-2">
                    <Link
                      to="/report"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-civic-600 text-white font-bold text-sm shadow hover:bg-civic-700 transition-colors"
                    >
                      Report Your First Issue <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ) : (
                /* Filter result was empty */
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 space-y-3">
                  <AlertCircle className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-sm font-semibold text-slate-600">No grievances match your search criteria</p>
                  <p className="text-xs">Adjust your search term or status filter to see other records.</p>
                  <button
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-civic-600 hover:underline pt-1"
                  >
                    Clear active filters
                  </button>
                </div>
              )
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {complaints.map((c) => (
                  <ComplaintCard key={c.id} complaint={c} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
