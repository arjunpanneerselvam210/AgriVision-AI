import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout, AuthLayout } from '../layouts';
import { ProtectedRoute } from './ProtectedRoute';
import {
  LoginPage,
  RegisterPage,
  DashboardPage,
  AgriculturalMapPage,
  FieldAnalysisPage,
  CropClassificationPage,
  SatelliteAnalysisPage,
  TemporalAnalysisPage,
  ModelPerformancePage,
  ReportsPage,
  SettingsPage,
  NotFoundPage,
} from '../pages';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Authentication routes wrapped in AuthLayout */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Main Application routes wrapped in MainLayout */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/map" element={<AgriculturalMapPage />} />
        <Route path="/parcels" element={<FieldAnalysisPage />} />
        <Route path="/classification" element={<CropClassificationPage />} />
        <Route path="/satellite" element={<SatelliteAnalysisPage />} />
        <Route path="/temporal" element={<TemporalAnalysisPage />} />
        <Route path="/model" element={<ModelPerformancePage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};
