import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  
  const roles = [
    'Registration Clerk', 
    'IEBC Constituency Election Coordinators (CECs)', 
    'Polling Clerks', 
    'Presiding Officer (PO)', 
    'Deputy Presiding Officer (DPO)'
  ];

  const handleRoleSelection = (role) => {
    // Store selected role in session storage
    sessionStorage.setItem('selectedRole', role);
    // Navigate to login page
    navigate('/login');
  };

  return (
    <div className="home-container">
      <h2>Welcome to KweliVote</h2>
      <p>Please select your role to continue:</p>
      <div className="role-buttons">
        {roles.map((role) => (
          <button
            key={role}
            onClick={() => handleRoleSelection(role)}
            className="role-button"
          >
            {role}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Home;
