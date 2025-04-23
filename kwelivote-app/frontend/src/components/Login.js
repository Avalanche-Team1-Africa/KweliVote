import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Get the selected role from session storage
    const selectedRole = sessionStorage.getItem('selectedRole');
    if (!selectedRole) {
      // If no role selected, redirect to home
      navigate('/');
    } else {
      setRole(selectedRole);
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Here you would call the API endpoint for authentication
    // For now, we'll simulate a successful login

    // Store the authenticated user info
    const userInfo = {
      username,
      role
    };
    
    sessionStorage.setItem('userInfo', JSON.stringify(userInfo));
    
    // Redirect based on role
    switch(role) {
      case 'IEBC Constituency Election Coordinators (CECs)':
        navigate('/register-keypersons');
        break;
      case 'Registration Clerk':
        navigate('/register-voters');
        break;
      case 'Polling Clerks':
        navigate('/view-data');
        break;
      case 'Presiding Officer (PO)':
      case 'Deputy Presiding Officer (DPO)':
        navigate('/results-count');
        break;
      default:
        navigate('/');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <img 
          src="/img/kwelivote_logo.png" 
          alt="KweliVote Logo" 
          className="h-24 mx-auto mb-4"
        />
        <h2 className="text-2xl font-bold text-kweli-dark mb-2">Login</h2>
        <div className="inline-block bg-kweli-accent bg-opacity-20 text-kweli-secondary px-4 py-2 rounded-full">
          <p className="font-medium">Role: {role}</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-kweli-accent focus:border-kweli-accent"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-kweli-accent focus:border-kweli-accent"
          />
        </div>
        
        <button 
          type="submit" 
          className="w-full bg-kweli-primary hover:bg-kweli-secondary text-white font-bold py-3 px-6 rounded-md shadow transition-colors duration-200"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
