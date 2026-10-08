import React, { useState } from 'react';
import { Menu, Bell, User as UserIcon, LogOut, Radio, Play, ChevronDown } from 'lucide-react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks';
import { logout } from '../store/slices/authSlice';
import { triggerAnalysis } from '../store/slices/analysisSlice';

interface TopNavbarProps {
  onOpenMobileMenu: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onOpenMobileMenu }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { isTriggering } = useAppSelector((state) => state.analysis);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Derive human-readable page title from path
  const getPageTitle = (path: string) => {
    switch (path) {
      case '/':
        return 'Executive Agricultural Dashboard';
      case '/map':
        return 'Interactive Agricultural Land Parcel Map';
      case '/parcels':
        return 'Field / Parcel-Like Segment Analysis';
      case '/classification':
        return 'Crop Classification Intelligence (Paddy vs. Banana)';
      case '/satellite':
        return 'Sentinel-1 & Sentinel-2 Earth Observation';
      case '/temporal':
        return 'Multi-Temporal Phenology & NDVI Time-Series';
      case '/model':
        return 'Machine Learning Performance & Radar Ablation';
      case '/reports':
        return 'Zonal Statistics & Agricultural Reports';
      case '/settings':
        return 'System & API Configuration';
      default:
        return 'AgriVision AI Platform';
    }
  };

  const handleTriggerRun = () => {
    dispatch(triggerAnalysis({ season: 'Pishanam 2023-2024' }));
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 sm:px-6">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="flex lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span>{getPageTitle(location.pathname)}</span>
          </h1>
          <p className="hidden sm:block text-[11px] text-slate-400">
            Tirunelveli District &bull; Ambasamudram & Cheranmahadevi
          </p>
        </div>
      </div>

      {/* Right: Actions, Backend Health Indicator & Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Backend Pipeline Status Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-slate-400">EO Engine:</span>
          <span className="font-medium text-emerald-400">GEE Pipeline Ready</span>
        </div>

        {/* Run Analysis Button */}
        <button
          onClick={handleTriggerRun}
          disabled={isTriggering}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm shadow-emerald-600/30 transition-colors disabled:opacity-50"
          title="Trigger analysis job on Google Earth Engine"
        >
          <Play className={`w-3.5 h-3.5 ${isTriggering ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isTriggering ? 'Running...' : 'Run Pipeline'}</span>
        </button>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 transition-colors"
          >
            <div className="h-7 w-7 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold text-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-medium text-slate-200 max-w-[120px] truncate">
                {user?.name || 'Researcher'}
              </span>
              <span className="text-[9px] font-mono font-semibold text-emerald-400 leading-none">
                {user?.role || 'VIEWER'}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
          </button>

          {/* Profile Dropdown */}
          {profileDropdownOpen && (
            <>
              <div
                onClick={() => setProfileDropdownOpen(false)}
                className="fixed inset-0 z-40"
              />
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-800 bg-slate-900/95 backdrop-blur-md p-1.5 text-xs text-slate-300 shadow-2xl z-50">
                <div className="px-3 py-2 border-b border-slate-800/80">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-slate-100 truncate">{user?.name || 'Authorized Researcher'}</p>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {user?.role || 'VIEWER'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email || 'analyst@agrivision.ai'}</p>
                  {user?.organization && (
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{user.organization}</p>
                  )}
                </div>

                <div className="py-1">
                  <Link
                    to="/settings"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <span>System Settings & Profile</span>
                  </Link>
                  <Link
                    to="/reports"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <span>Analysis Reports</span>
                  </Link>
                </div>

                <div className="pt-1 border-t border-slate-800/80">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
