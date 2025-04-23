import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Home from './components/Home';
import Login from './components/Login';

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
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
