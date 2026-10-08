import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Map as MapIcon,
  Shapes,
  Sprout,
  Satellite,
  LineChart,
  BrainCircuit,
  FileSpreadsheet,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Compass,
  Lock,
} from 'lucide-react';
import { useAppSelector } from '../hooks';
import { APP_NAME } from '../utils/constants';
import { UserRole } from '../types';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItemConfig {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles?: UserRole[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);

  const userRole = ((user?.role || 'VIEWER') as string).toUpperCase() as UserRole;

  const navItems: NavItemConfig[] = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Agricultural Map', path: '/map', icon: MapIcon },
    { name: 'Field/Parcel Analysis', path: '/parcels', icon: Shapes },
    { name: 'Crop Classification', path: '/classification', icon: Sprout },
    { name: 'Satellite Analysis', path: '/satellite', icon: Satellite },
    { name: 'Temporal Analysis', path: '/temporal', icon: LineChart },
    { name: 'Model Performance', path: '/model', icon: BrainCircuit },
    { name: 'Reports', path: '/reports', icon: FileSpreadsheet },
    { name: 'Settings', path: '/settings', icon: Settings, allowedRoles: ['ADMIN', 'ANALYST'] },
  ];

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'ANALYST':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-slate-950 border-r border-slate-800/80 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800/80">
          <NavLink
            to="/"
            onClick={onCloseMobile}
            className="flex items-center gap-3 overflow-hidden group"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-700 text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Sprout className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="font-bold text-base text-white tracking-tight flex items-center gap-1.5">
                  {APP_NAME}
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono font-normal border border-emerald-500/30">
                    EO
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 truncate">Satellite Crop AI</span>
              </div>
            )}
          </NavLink>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* User Role & Study Area Badge */}
        {!isCollapsed && (
          <div className="mx-3 my-3 space-y-2">
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
              <Compass className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="truncate flex-1">
                <p className="font-semibold text-slate-200 truncate">Tirunelveli District</p>
                <p className="text-[10px] text-slate-400 truncate">Ambasamudram & Cheranmahadevi</p>
              </div>
            </div>

            <div className="px-2.5 py-1.5 rounded-lg bg-slate-900/40 border border-slate-800/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Current Role:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getRoleBadgeStyle(userRole)}`}>
                {userRole}
              </span>
            </div>
          </div>
        )}

        {/* Navigation Items with Role Checking */}
        <nav className="flex-1 space-y-1 px-3 py-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const isRestricted =
              item.allowedRoles &&
              !item.allowedRoles.includes(userRole) &&
              userRole !== 'ADMIN';

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-500/5 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : isRestricted
                    ? 'text-slate-500 hover:text-slate-400 hover:bg-slate-900/40 opacity-70'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                }`}
                title={isCollapsed ? (isRestricted ? `${item.name} (${item.allowedRoles?.join('/')})` : item.name) : undefined}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </div>

                {!isCollapsed && isRestricted && (
                  <span className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                    <Lock className="w-3 h-3 text-slate-500" />
                    <span>{item.allowedRoles?.join('/')}</span>
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-800/80">
          {!isCollapsed ? (
            <div className="flex items-center justify-between text-[11px] text-slate-500 px-2 py-1">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Mapathon 2026</span>
              </span>
              <span className="font-mono text-[10px]">v1.0.0</span>
            </div>
          ) : (
            <div className="flex justify-center text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-500/60" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
