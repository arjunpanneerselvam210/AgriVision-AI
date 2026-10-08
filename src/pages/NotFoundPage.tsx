import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
        <Compass className="w-8 h-8 animate-pulse" />
      </div>
      <h1 className="text-3xl font-bold text-white tracking-tight">404 — Coordinate Not Found</h1>
      <p className="text-sm text-slate-400 max-w-md mt-2">
        The requested agricultural analysis view or endpoint does not exist or has been shifted outside the study boundaries.
      </p>
      <Link
        to="/"
        className="mt-6 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 font-semibold text-slate-950 text-xs inline-flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
      >
        <ArrowLeft className="w-4 h-4" /> Return to Dashboard
      </Link>
    </div>
  );
};
