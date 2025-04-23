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
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <img 
          src="/img/kwelivote_logo.png" 
          alt="KweliVote Logo" 
          className="h-24 mx-auto mb-4"
        />
        <h2 className="text-3xl font-bold text-kweli-dark mb-2">Welcome to KweliVote</h2>
        <p className="text-gray-600 text-lg">Please select your role to continue:</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((role) => (
          <button
            key={role}
            onClick={() => handleRoleSelection(role)}
            className="bg-kweli-primary hover:bg-kweli-secondary text-white font-bold py-4 px-6 rounded-lg shadow transition-colors duration-200 flex items-center justify-center text-center"
          >
            {role}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Home;
