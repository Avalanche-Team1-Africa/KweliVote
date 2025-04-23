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
  },
  "devDependencies": {
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.23",
    "tailwindcss": "^3.3.2"
  }
}

### **sample api endpoints**

Api Root

HTTP 200 OK
Allow: OPTIONS, GET
Content-Type: application/json
Vary: Accept

{
    "users": "http://127.0.0.1:8000/api/users/",
    "voters": "http://127.0.0.1:8000/api/voters/",
    "keypersons": "http://127.0.0.1:8000/api/keypersons/",
    "candidates": "http://127.0.0.1:8000/api/candidates/",
    "resultscount": "http://127.0.0.1:8000/api/resultscount/"
}



GET /api/users/

HTTP 200 OK
Allow: GET, POST, HEAD, OPTIONS
Content-Type: application/json
Vary: Accept

[
    {
        "username": "agent1",
        "nationalid": "100005",
        "is_active": true,
        "keyperson_details": {
            "firstname": "Michael",
            "surname": "Williams",
            "role": "Party Agents",
            "did": "did:example:100005"
        }
    },
    {
        "username": "clerk1",
        "nationalid": "100001",
        "is_active": true,
        "keyperson_details": {
            "firstname": "John",
            "surname": "Doe",
            "role": "Registration Clerk",
            "did": "did:example:100001"
        }
    },
    {
        "username": "deputy1",
        "nationalid": "100003",
        "is_active": true,
        "keyperson_details": {
            "firstname": "James",
            "surname": "Brown",
            "role": "Deputy Presiding Officer (DPO)",
            "did": "did:example:100003"
        }
    },
    {
        "username": "officer1",
        "nationalid": "100002",
        "is_active": true,
        "keyperson_details": {
            "firstname": "Mary",
            "surname": "Smith",
            "role": "Presiding Officer (PO)",
            "did": "did:example:100002"
        }
    },
    {
        "username": "pollclerk1",
        "nationalid": "100004",
        "is_active": true,
        "keyperson_details": {
            "firstname": "Patricia",
            "surname": "Johnson",
            "role": "Polling Clerks",
            "did": "did:example:100004"
        }
    }
]



GET /api/voters/

HTTP 200 OK
Allow: GET, POST, HEAD, OPTIONS
Content-Type: application/json
Vary: Accept

[
    {
        "nationalid": "V1001",
        "firstname": "Alice",
        "middlename": "L",
        "surname": "Johnson",
        "did": "did:example:V1001",
        "designated_polling_station": "Station A",
        "created_by": "clerk1",
        "created_datetime": "2025-04-23T14:57:21.496440Z"
    },
    {
        "nationalid": "V1005",
        "firstname": "Edward",
        "middlename": "P",
        "surname": "Kamau",
        "did": "did:example:V1005",
        "designated_polling_station": "Station B",
        "created_by": "clerk1",
        "created_datetime": "2025-04-23T14:57:21.496529Z"
    },
    {
        "nationalid": "V1003",
        "firstname": "Charlie",
        "middlename": "N",
        "surname": "Ngugi",
        "did": "did:example:V1003",
        "designated_polling_station": "Station C",
        "created_by": "clerk1",
        "created_datetime": "2025-04-23T14:57:21.496515Z"
    },
    {
        "nationalid": "V1002",
        "firstname": "Bob",
        "middlename": "M",
        "surname": "Smith",
        "did": "did:example:V1002",
        "designated_polling_station": "Station B",
        "created_by": "clerk1",
        "created_datetime": "2025-04-23T14:57:21.496505Z"
    },
    {
        "nationalid": "V1004",
        "firstname": "Diana",
        "middlename": "O",
        "surname": "Wangari",
        "did": "did:example:V1004",
        "designated_polling_station": "Station A",
        "created_by": "clerk1",
        "created_datetime": "2025-04-23T14:57:21.496523Z"
    }
]



GET /api/keypersons/

HTTP 200 OK
Allow: GET, POST, HEAD, OPTIONS
Content-Type: application/json
Vary: Accept

[
    {
        "nationalid": "100003",
        "firstname": "James",
        "middlename": "O",
        "surname": "Brown",
        "role": "Deputy Presiding Officer (DPO)",
        "did": "did:example:100003",
        "political_party": null,
        "designated_polling_station": "Station C",
        "observer_type": null,
        "stakeholder": null,
        "created_by": "admin",
        "created_datetime": "2025-04-23T14:57:21.418624Z"
    },
    {
        "nationalid": "100006",
        "firstname": "Sarah",
        "middlename": "R",
        "surname": "Davis",
        "role": "Observers",
        "did": "did:example:100006",
        "political_party": null,
        "designated_polling_station": "Station F",
        "observer_type": "local",
        "stakeholder": "Local Observer Org",
        "created_by": "admin",
        "created_datetime": "2025-04-23T14:57:21.418700Z"
    },
    {
        "nationalid": "100007",
        "firstname": "Robert",
        "middlename": "S",
        "surname": "Miller",
        "role": "Observers",
        "did": "did:example:100007",
        "political_party": null,
        "designated_polling_station": "Station G",
        "observer_type": "international",
        "stakeholder": "UN",
        "created_by": "admin",
        "created_datetime": "2025-04-23T14:57:21.418722Z"
    },
    {
        "nationalid": "100005",
        "firstname": "Michael",
        "middlename": "Q",
        "surname": "Williams",
        "role": "Party Agents",
        "did": "did:example:100005",
        "political_party": "Party A",
        "designated_polling_station": "Station E",
        "observer_type": null,
        "stakeholder": null,
        "created_by": "admin",
        "created_datetime": "2025-04-23T14:57:21.418675Z"
    },
    {
        "nationalid": "100004",
        "firstname": "Patricia",
        "middlename": "P",
        "surname": "Johnson",
        "role": "Polling Clerks",
        "did": "did:example:100004",
        "political_party": null,
        "designated_polling_station": "Station D",
        "observer_type": null,
        "stakeholder": null,
        "created_by": "admin",
        "created_datetime": "2025-04-23T14:57:21.418652Z"
    },
    {
        "nationalid": "100002",
        "firstname": "Mary",
        "middlename": "N",
        "surname": "Smith",
        "role": "Presiding Officer (PO)",
        "did": "did:example:100002",
        "political_party": null,
        "designated_polling_station": "Station B",
        "observer_type": null,
        "stakeholder": null,
        "created_by": "admin",
        "created_datetime": "2025-04-23T14:57:21.418587Z"
    },
    {
        "nationalid": "100001",
        "firstname": "John",
        "middlename": "M",
        "surname": "Doe",
        "role": "Registration Clerk",
        "did": "did:example:100001",
        "political_party": null,
        "designated_polling_station": "Station A",
        "observer_type": null,
        "stakeholder": null,
        "created_by": "admin",
        "created_datetime": "2025-04-23T14:57:21.418388Z"
    }
]



GET /api/candidates/

HTTP 200 OK
Allow: GET, POST, HEAD, OPTIONS
Content-Type: application/json
Vary: Accept

[
    {
        "nationalid": "C1004",
        "firstname": "George",
        "middlename": "R",
        "surname": "Mwangi",
        "did": "did:example:C1004",
        "candidate_type": "Governor",
        "political_party": "Party B",
        "created_by": "admin",
        "created_datetime": "2025-04-23T14:57:21.545394Z"
    },
    {
        "nationalid": "C1003",
        "firstname": "Faith",
        "middlename": "Q",
        "surname": "Omari",
        "did": "did:example:C1003",
        "candidate_type": "Governor",
        "political_party": "Party A",
        "created_by": "admin",
        "created_datetime": "2025-04-23T14:57:21.545366Z"
    },
    {
        "nationalid": "C1005",
        "firstname": "Helen",
        "middlename": "S",
        "surname": "Njeri",
        "did": "did:example:C1005",
        "candidate_type": "Member of National Assembly (MP)",
        "political_party": "Party C",
        "created_by": "admin",
        "created_datetime": "2025-04-23T14:57:21.545415Z"
    },
    {
        "nationalid": "C1006",
        "firstname": "Ian",
        "middlename": "T",
        "surname": "Ochieng",
        "did": "did:example:C1006",
        "candidate_type": "Member of National Assembly (MP)",
        "political_party": "Party D",
        "created_by": "admin",
        "created_datetime": "2025-04-23T14:57:21.545426Z"
    },
    {
        "nationalid": "C1001",
        "firstname": "Diana",
        "middlename": "O",
        "surname": "Kenya",
        "did": "did:example:C1001",
        "candidate_type": "President",
        "political_party": "Party A",
        "created_by": "admin",
        "created_datetime": "2025-04-23T14:57:21.545263Z"
    },
    {
        "nationalid": "C1002",
        "firstname": "Eli",
        "middlename": "P",
        "surname": "Wanjiku",
        "did": "did:example:C1002",
        "candidate_type": "President",
        "political_party": "Party B",
        "created_by": "admin",
        "created_datetime": "2025-04-23T14:57:21.545341Z"
    }
]



GET /api/resultscount/

HTTP 200 OK
Allow: GET, POST, HEAD, OPTIONS
Content-Type: application/json
Vary: Accept

[
    {
        "resultscount_id": "RES1001",
        "candidate_details": {
            "firstname": "Diana",
            "surname": "Kenya",
            "candidate_type": "President",
            "political_party": "Party A"
        },
        "polling_station": "Station A",
        "votes": 120,
        "created_by": "officer1",
        "created_datetime": "2025-04-23T14:57:21.596405Z",
        "candidate": "C1001",
        "presiding_officer": "100002",
        "deputy_presiding_officer": "100003",
        "party_agent": "100005",
        "observer": "100006"
    },
    {
        "resultscount_id": "RES1002",
        "candidate_details": {
            "firstname": "Eli",
            "surname": "Wanjiku",
            "candidate_type": "President",
            "political_party": "Party B"
        },
        "polling_station": "Station A",
        "votes": 85,
        "created_by": "officer1",
        "created_datetime": "2025-04-23T14:57:21.596565Z",
        "candidate": "C1002",
        "presiding_officer": "100002",
        "deputy_presiding_officer": "100003",
        "party_agent": "100005",
        "observer": "100006"
    }
]



