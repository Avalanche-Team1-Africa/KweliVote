import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../../logo.png';

const Navbar = () => {
  // For demonstration, we'll use a state to toggle between logged in/out
  // In a real application, this would come from an auth context or redux store
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Mock user data - in a real app this would come from auth context
  const user = {
    name: "John Doe",
    email: "john.doe@example.com",
    avatar: "https://via.placeholder.com/40"
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = () => {
    // In a real app, this would call an auth logout function
    setIsLoggedIn(false);
    setIsDropdownOpen(false);
    console.log('User logged out');
  };

  // For demo purposes only - toggle login state
  const toggleLogin = () => {
    setIsLoggedIn(!isLoggedIn);
  };

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <img src={logo} alt="KweliVote Logo" className="h-10 w-auto mr-2" />
            <h1 className="text-2xl font-bold text-primary">KweliVote</h1>
          </Link>
        </div>
        
        <nav className="hidden md:block">
          <ul className="flex space-x-6">
            <li><Link to="/" className="text-gray-700 hover:text-primary">Home</Link></li>
            <li><Link to="/elections" className="text-gray-700 hover:text-primary">Elections</Link></li>
            <li><Link to="/results" className="text-gray-700 hover:text-primary">Results</Link></li>
            <li><Link to="/about" className="text-gray-700 hover:text-primary">About</Link></li>
          </ul>
        </nav>
        
        <div className="flex items-center space-x-4">
          {/* For demo purposes - button to toggle login state */}
          <button 
            onClick={toggleLogin} 
            className="hidden text-xs bg-gray-200 px-2 py-1 rounded"
          >
            (Demo: Toggle Auth)
          </button>
          
          {isLoggedIn ? (
            <div className="relative">
              <button 
                onClick={toggleDropdown}
                className="flex items-center space-x-2 focus:outline-none"
              >
                <img 
                  src={user.avatar} 
                  alt="User Avatar" 
                  className="h-8 w-8 rounded-full border-2 border-primary"
                />
                <span className="hidden md:inline-block text-gray-700">{user.name}</span>
                <svg 
                  className="w-4 h-4 text-gray-700" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <Link 
                    to="/dashboard" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/profile" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    My Profile
                  </Link>
                  <hr className="my-1" />
                  <button 
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link 
                to="/login" 
                className="text-gray-700 hover:text-primary"
              >
                Sign In
              </Link>
              <Link 
                to="/register" 
                className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-md"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;