import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Home from './components/Home';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Logout from './components/auth/Logout';

// Import role-specific components
import KeypersonRegister from './components/keyperson/KeypersonRegister';
import VoterRegister from './components/voter/VoterRegister';
import DataViewer from './components/viewer/DataViewer';
import ResultsCount from './components/results/ResultsCount';

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
  const isLoggedIn = !!userInfo.username;

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-b from-kweli-light to-white font-sans">
        <header className="bg-white shadow-soft-md sticky top-0 z-10">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <img 
                  src="/img/kwelivote_logo.png" 
                  alt="KweliVote Logo" 
                  className="h-12 mr-4"
                />
                <h1 className="text-2xl font-bold text-kweli-dark">KweliVote</h1>
              </div>
              
              {/* Mobile menu button */}
              {isLoggedIn && (
                <button 
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="md:hidden bg-kweli-light hover:bg-kweli-accent hover:bg-opacity-30 rounded-full p-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-kweli-accent"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-kweli-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              )}
              
              {/* Desktop navigation */}
              {isLoggedIn && (
                <nav className="hidden md:block">
                  <ul className="flex space-x-6">
                    <li>
                      <span className="text-kweli-dark font-medium">
                        Welcome, {userInfo.username}
                      </span>
                    </li>
                    <li>
                      <Link 
                        to="/" 
                        className="text-kweli-secondary hover:text-kweli-primary font-medium transition-colors duration-200"
                      >
                        Home
                      </Link>
                    </li>
                    <li>
                      <Logout />
                    </li>
                  </ul>
                </nav>
              )}
            </div>
            
            {/* Mobile menu */}
            {menuOpen && isLoggedIn && (
              <nav className="md:hidden mt-4 pb-2 animate-fade-in">
                <ul className="space-y-3">
                  <li className="text-kweli-dark font-medium">
                    Welcome, {userInfo.username}
                  </li>
                  <li>
                    <Link 
                      to="/" 
                      className="block text-kweli-secondary hover:text-kweli-primary font-medium transition-colors duration-200"
                      onClick={() => setMenuOpen(false)}
                    >
                      Home
                    </Link>
                  </li>
                  <li onClick={() => setMenuOpen(false)}>
                    <Logout />
                  </li>
                </ul>
              </nav>
            )}
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

        <footer className="bg-white shadow-soft-inner border-t border-gray-100 py-6 mt-12">
          <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
            <p>&copy; {new Date().getFullYear()} KweliVote. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
