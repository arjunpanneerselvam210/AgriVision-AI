import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Satellite, Sprout, ShieldCheck } from 'lucide-react';
import { APP_NAME } from '../utils/constants';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <Link to="/" className="inline-flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Sprout className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div className="text-left">
            <div className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              {APP_NAME}
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 tracking-wide uppercase">
              Satellite Intelligence & Parcel Segmentation
            </p>
          </div>
        </Link>
      </div>

      {/* Auth Card Container */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl py-8 px-6 sm:px-10 shadow-2xl shadow-black/60">
          <Outlet />
        </div>

        {/* Footer info badge */}
        <div className="mt-6 text-center text-xs text-slate-500 flex items-center justify-center gap-4">
          <span className="inline-flex items-center gap-1">
            <Satellite className="w-3.5 h-3.5 text-blue-400" /> Sentinel-1 & Sentinel-2 Powered
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> JWT Secure Token Auth
          </span>
        </div>
      </div>
    </div>
  );
};
