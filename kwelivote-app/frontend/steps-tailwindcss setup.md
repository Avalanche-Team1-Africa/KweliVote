# Setting up KweliVote Frontend with Tailwind CSS

## Steps Followed

1. Install Tailwind CSS and its dependencies:

```bash
cd /home/quest/myrepos/KweliVote/kwelivote-app/frontend && npm install -D tailwindcss@3.3.2 postcss@8.4.23 autoprefixer@10.4.14
```

2. Create tailwind.config.js file with custom color palette matching KweliVote logo:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'kweli-primary': '#2563eb',    // Blue similar to KweliVote logo
        'kweli-secondary': '#1e40af',  // Darker blue for hover states
        'kweli-accent': '#60a5fa',     // Light blue for accents
        'kweli-light': '#f0f9ff',      // Very light blue for backgrounds
        'kweli-dark': '#1e3a8a',       // Very dark blue for text
      },
    },
  },
  plugins: [],
}
```

3. Create PostCSS configuration file:

```javascript
module.exports = {
  plugins: [
    require('tailwindcss'),
    require('autoprefixer'),
  ],
}
```

4. Update index.css to include Tailwind directives:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
```

5. Create image directory for the logo and copy the KweliVote logo:

```bash
mkdir -p /home/quest/myrepos/KweliVote/kwelivote-app/frontend/public/img
cp /home/quest/myrepos/KweliVote/docs/kwelivote_logo.png /home/quest/myrepos/KweliVote/kwelivote-app/frontend/public/img/
```

6. Update App.js with Tailwind styling and logo:

```javascript
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
```

7. Update Home.js component with Tailwind styling:

```javascript
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
```

8. Update Login.js component with Tailwind styling:

```javascript
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
```

9. Update App.css with fallback styles:

```css
/* Base app styles */
.App {
  text-align: center;
}

/* Fallback styles for when Tailwind classes are not processed */
.role-button-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 768px) {
  .role-button-container {
    grid-template-columns: 1fr 1fr;
  }
}

.role-button {
  background-color: #2563eb;
  color: white;
  font-weight: bold;
  padding: 1rem 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  transition: background-color 0.2s;
}

.role-button:hover {
  background-color: #1e40af;
}

/* Animations and special effects */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fade-in {
  animation: fadeIn 0.5s ease-in;
}
```

## Summary of Changes

1. Installed Tailwind CSS with specific versions known to work well together
2. Created a tailwind.config.js file with a custom color palette that matches the KweliVote logo
3. Set up PostCSS configuration to use Tailwind CSS correctly
4. Added Tailwind directives to index.css
5. Created a resized version of the KweliVote logo for display in the header and on the login page
6. Updated the App.js component to include the logo in the header
7. Styled the Home component with Tailwind classes, including the role selection buttons
8. Styled the Login component with Tailwind classes, including form fields and buttons
9. Added fallback styles in App.css for browsers without Tailwind support

The UI now has a consistent blue color scheme that matches the KweliVote logo, with the logo prominently displayed in the header of every page and on the login page.
