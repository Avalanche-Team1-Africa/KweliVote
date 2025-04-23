import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Home from './components/Home';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';

// Import role-specific components
import KeypersonRegister from './components/keyperson/KeypersonRegister';
import VoterRegister from './components/voter/VoterRegister';
import DataViewer from './components/viewer/DataViewer';
import ResultsCount from './components/results/ResultsCount';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-kweli-light">
        <header className="bg-white shadow-md">
          <div className="container mx-auto px-4 py-3 flex items-center">
            <img 
              src="/img/kwelivote_logo.png" 
              alt="KweliVote Logo" 
              className="h-12 mr-4"
            />
            <h1 className="text-2xl font-bold text-kweli-dark">KweliVote</h1>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            
            {/* Protected routes for each role */}
            <Route 
              path="/register-keypersons" 
              element={
                <ProtectedRoute allowedRoles={['IEBC Constituency Election Coordinators (CECs)']}>
                  <KeypersonRegister />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/register-voters" 
              element={
                <ProtectedRoute allowedRoles={['Registration Clerk']}>
                  <VoterRegister />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/view-data" 
              element={
                <ProtectedRoute allowedRoles={['Polling Clerks']}>
                  <DataViewer />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/results-count" 
              element={
                <ProtectedRoute allowedRoles={['Presiding Officer (PO)', 'Deputy Presiding Officer (DPO)']}>
                  <ResultsCount />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
