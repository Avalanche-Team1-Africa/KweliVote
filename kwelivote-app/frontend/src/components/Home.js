import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  
  const roles = [
    {
      id: 'registration-clerk',
      name: 'Registration Clerk',
      description: 'Register voters and manage voter data',
      icon: (
        <svg className="h-8 w-8 mb-3 text-kweli-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      )
    },
    {
      id: 'cec',
      name: 'IEBC Constituency Election Coordinators (CECs)',
      description: 'Manage election coordinators and staff',
      icon: (
        <svg className="h-8 w-8 mb-3 text-kweli-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      id: 'polling-clerks',
      name: 'Polling Clerks',
      description: 'Manage polling operations and data collection',
      icon: (
        <svg className="h-8 w-8 mb-3 text-kweli-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    },
    {
      id: 'presiding-officer',
      name: 'Presiding Officer (PO)',
      description: 'Oversee polling stations and results collection',
      icon: (
        <svg className="h-8 w-8 mb-3 text-kweli-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      id: 'deputy-po',
      name: 'Deputy Presiding Officer (DPO)',
      description: 'Assist the PO in results management',
      icon: (
        <svg className="h-8 w-8 mb-3 text-kweli-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  const handleRoleSelection = (role) => {
    // Store selected role in session storage
    sessionStorage.setItem('selectedRole', role);
    // Navigate to login page
    navigate('/login');
  };

  return (
    <div className="max-w-4xl mx-auto animate-slide-up">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-kweli-light rounded-full mb-6 shadow-soft">
          <img 
            src="/img/kwelivote_logo.png" 
            alt="KweliVote Logo" 
            className="h-16"
          />
        </div>
        <h1 className="text-3xl font-bold text-kweli-dark mb-3">Welcome to KweliVote</h1>
        <p className="text-gray-600 text-lg max-w-xl mx-auto">
          A secure and transparent electronic voting system. Please select your role to continue:
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {roles.map((role) => (
          <div 
            key={role.id}
            onClick={() => handleRoleSelection(role.name)}
            className="bg-white rounded-2xl shadow-soft-md hover:shadow-soft-lg border border-gray-100 p-6 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
          >
            <div className="flex flex-col items-center text-center h-full">
              <div className="flex items-center justify-center rounded-full bg-kweli-light h-16 w-16 mb-4">
                {role.icon}
              </div>
              <h3 className="font-bold text-kweli-dark mb-2">{role.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{role.description}</p>
              <div className="mt-auto w-full">
                <button className="w-full mt-2 bg-gradient-to-r from-kweli-accent to-kweli-primary text-white font-medium py-2 px-4 rounded-lg hover:opacity-90 transition-opacity duration-200 flex items-center justify-center">
                  <span>Select Role</span>
                  <svg className="ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <p className="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} KweliVote. Secure Electronic Voting System.
        </p>
      </div>
    </div>
  );
};

export default Home;
