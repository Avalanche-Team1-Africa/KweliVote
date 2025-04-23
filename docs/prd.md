# **Project Requirements Document: The KweliVote frontend**

The following table outlines the detailed functional requirements of The KweliVote frontend.
Reference kwelivote-app/backend django app to get the correct api endpoints to connect to from this frontend react app.

- On the homepage have buttons of each person: Registration Clerk,IEBC Constituency Election Coordinators (CECs),Polling Clerks,
Presiding Officer (PO),Deputy Presiding Officer (DPO)
- Once a button is selected, this should lead to the login page. Based on the selected button, only users with that role are allowed to login. 
	Example, if I select Registration clerk, I cant use my presiding officer credentials.
- Once logged in, user will only see roles that concern them:
	- IEBC Constituency Election Coordinators (CECs): Can only register Keypersons.
	- Registration Clerks: Can only register voters.
	- Polling Clerks: Only has read-only rights to view Voters and keypersons.
	- Presiding Officer (PO) and Deputy Presiding Officer (DPO): Can only view the Resultscount page.
- Creation of voters, keypersons and observers should be multistep
	- step 1: Capture names
	- step 2: capture biometric data (this is NOT mandatory. Fields can be blank for now)
	- step 3: (NOT visible when creating Observers) Creating and linking user accounts for keypersons

### Stack:  
- React, TailwindCSS

### ✅ Best Practices
- Use functional components with hooks
- Use context for local state or Redux for global state management
- Keep components atomic and reusable
- Validate inputs before submitting blockchain transactions
- Show clear messages (loading, success, error)
- Use TailwindCSS for styling
- Use stable verions of react and other libraries using the sample package.json below for context

### **Folder structure**
kwelivote-app/
├── frontend/             # React App
│   ├── components/
│   ├── hooks/
│   ├── contexts/
│   └── utils/
├── contracts/            # Solidity smart contracts
│   └── MyContract.sol
├── scripts/              # Deployment scripts (Hardhat)
├── abi/                  # Exported ABI for frontend
├── hardhat.config.js     # Config for Avalanche network
└── README.md

### **Sample package.json**
{
  "name": "kwelivote-app",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@testing-library/dom": "^9.3.1",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/react": "^14.1.2",
    "@testing-library/user-event": "^14.5.1",
    "bootstrap": "^5.3.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "react-scripts": "5.0.1",
    "web-vitals": "^2.1.4"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}


