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
    <div className="login-container">
      <h2>Login</h2>
      <p>Login as: {role}</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="login-button">
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
