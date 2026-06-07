import React from 'react';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import Performance from './pages/Performance';
import OverlapChecker from './pages/OverlapChecker';
import FundComparision from './pages/FundComparison';
import SIPCalculator from './pages/SIPCalculator';
import RiskProfile from './pages/RiskProfile';
import ExportPDF from './pages/ExportPDF';

function App(){
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route path="/onboarding" element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard /> 
            </ProtectedRoute>
          } />
          <Route path="/portfolio" element={
            <ProtectedRoute>
              <Portfolio />
            </ProtectedRoute>
          } />
          <Route path="/performance" element={
            <ProtectedRoute>
              <Performance />
            </ProtectedRoute>
          } />
          <Route path="/overlap" element={
            <ProtectedRoute>
              <OverlapChecker />
            </ProtectedRoute>
          } />
          <Route path="/compare" element={
            <ProtectedRoute>
              <FundComparision />
            </ProtectedRoute>
          } />
          <Route path="/sip" element={
            <ProtectedRoute>
              <SIPCalculator />
            </ProtectedRoute>
          } />
          <Route path="/risk" element={
            <ProtectedRoute>
              <RiskProfile />
            </ProtectedRoute>
          } />
          <Route path="/export" element={
            <ProtectedRoute>
              <ExportPDF />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}