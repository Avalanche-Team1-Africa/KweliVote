import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ElectionList from './components/elections/ElectionList';
import ElectionDetail from './components/elections/ElectionDetail';
import Dashboard from './components/dashboard/Dashboard';
import Profile from './components/profile/Profile';

const Home = () => (
  <div className="container mx-auto px-4 py-8">
    <section className="mb-12">
      <div className="bg-primary text-white rounded-lg shadow-lg p-8 mb-8">
        <h2 className="text-3xl font-bold mb-4">Welcome to KweliVote</h2>
        <p className="text-xl mb-6">Secure and transparent election management system</p>
        <a href="/elections" className="bg-white text-primary hover:bg-gray-100 font-bold py-2 px-4 rounded">
          View Elections
        </a>
      </div>
    </section>
    
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold text-primary mb-3">Secure Voting</h3>
        <p className="text-gray-700">Our platform ensures your vote is secure and tamper-proof through blockchain technology.</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold text-primary mb-3">Transparent Results</h3>
        <p className="text-gray-700">Real-time election results with complete transparency and verifiability.</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold text-primary mb-3">Easy to Use</h3>
        <p className="text-gray-700">Simple and intuitive interface for voters and election administrators.</p>
      </div>
    </section>
  </div>
);

const About = () => (
  <div className="container mx-auto px-4 py-8">
    <h1 className="text-3xl font-bold text-primary mb-6">About KweliVote</h1>
    <p className="mb-6">KweliVote is a secure and transparent election management system designed to ensure fair and accurate voting processes.</p>
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-bold text-primary mb-4">Our Mission</h2>
      <p className="mb-4">To provide a trustworthy platform that enables democratic processes to function with integrity and transparency.</p>
      <p>Our blockchain-based technology ensures that every vote is secure, verifiable, and immutable, giving confidence to voters and election administrators alike.</p>
    </div>
  </div>
);

const Results = () => (
  <div className="container mx-auto px-4 py-8">
    <h1 className="text-3xl font-bold text-primary mb-6">Election Results</h1>
    <p className="mb-6">View the results of completed elections.</p>
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-bold text-primary mb-4">Presidential Election 2024</h2>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Final Results</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span>John Doe - Progressive Party</span>
              <span>42%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '42%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span>Jane Smith - Democratic Alliance</span>
              <span>38%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '38%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span>David Johnson - National Unity Party</span>
              <span>20%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-yellow-600 h-2.5 rounded-full" style={{ width: '20%' }}></div>
            </div>
          </div>
        </div>
      </div>
      <div className="text-sm text-gray-500">
        <p>Total votes: 1,234,567</p>
        <p>Last updated: April 15, 2024</p>
      </div>
    </div>
  </div>
);

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout><Home /></Layout>} />
      <Route path="/login" element={<Layout><Login /></Layout>} />
      <Route path="/register" element={<Layout><Register /></Layout>} />
      <Route path="/elections" element={<Layout><ElectionList /></Layout>} />
      <Route path="/elections/:id" element={<Layout><ElectionDetail /></Layout>} />
      <Route path="/results" element={<Layout><Results /></Layout>} />
      <Route path="/about" element={<Layout><About /></Layout>} />
      <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
      <Route path="/profile" element={<Layout><Profile /></Layout>} />
    </Routes>
  );
}

export default App;