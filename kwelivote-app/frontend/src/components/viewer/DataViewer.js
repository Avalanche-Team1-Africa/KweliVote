import React, { useState } from 'react';

const DataViewer = () => {
  const [activeTab, setActiveTab] = useState('voters');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Placeholder data for demonstration
  const voters = [
    {
      nationalid: "V1001",
      firstname: "Alice",
      middlename: "L",
      surname: "Johnson",
      did: "did:example:V1001",
      designated_polling_station: "Station A",
      created_by: "clerk1",
      created_datetime: "2025-04-23T14:57:21.496440Z"
    },
    {
      nationalid: "V1002",
      firstname: "Bob",
      middlename: "M",
      surname: "Smith",
      did: "did:example:V1002",
      designated_polling_station: "Station B",
      created_by: "clerk1",
      created_datetime: "2025-04-23T14:57:21.496505Z"
    },
    {
      nationalid: "V1003",
      firstname: "Charlie",
      middlename: "N",
      surname: "Ngugi",
      did: "did:example:V1003",
      designated_polling_station: "Station C",
      created_by: "clerk1",
      created_datetime: "2025-04-23T14:57:21.496515Z"
    }
  ];
  
  const keypersons = [
    {
      nationalid: "100001",
      firstname: "John",
      middlename: "M",
      surname: "Doe",
      role: "Registration Clerk",
      did: "did:example:100001",
      political_party: null,
      designated_polling_station: "Station A",
      observer_type: null,
      stakeholder: null,
      created_by: "admin",
      created_datetime: "2025-04-23T14:57:21.418388Z"
    },
    {
      nationalid: "100002",
      firstname: "Mary",
      middlename: "N",
      surname: "Smith",
      role: "Presiding Officer (PO)",
      did: "did:example:100002",
      political_party: null,
      designated_polling_station: "Station B",
      observer_type: null,
      stakeholder: null,
      created_by: "admin",
      created_datetime: "2025-04-23T14:57:21.418587Z"
    },
    {
      nationalid: "100005",
      firstname: "Michael",
      middlename: "Q",
      surname: "Williams",
      role: "Party Agents",
      did: "did:example:100005",
      political_party: "Party A",
      designated_polling_station: "Station E",
      observer_type: null,
      stakeholder: null,
      created_by: "admin",
      created_datetime: "2025-04-23T14:57:21.418675Z"
    }
  ];

  const filteredVoters = voters.filter(voter => {
    const fullName = `${voter.firstname} ${voter.middlename || ''} ${voter.surname}`.toLowerCase();
    return (
      fullName.includes(searchTerm.toLowerCase()) || 
      voter.nationalid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      voter.designated_polling_station.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const filteredKeypersons = keypersons.filter(person => {
    const fullName = `${person.firstname} ${person.middlename || ''} ${person.surname}`.toLowerCase();
    return (
      fullName.includes(searchTerm.toLowerCase()) || 
      person.nationalid.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (person.role && person.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
      person.designated_polling_station.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="max-w-6xl mx-auto animate-slide-up">
      <div className="bg-white rounded-2xl shadow-soft-lg p-6 border border-gray-100">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-kweli-dark mb-3">View Election Data</h2>
          <p className="text-gray-600">Access and review election data securely</p>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex w-full md:w-auto space-x-1">
            <button
              onClick={() => setActiveTab('voters')}
              className={`px-6 py-3 flex items-center ${
                activeTab === 'voters'
                  ? 'bg-gradient-to-r from-kweli-primary to-kweli-secondary text-white font-medium shadow-soft'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              } rounded-l-lg transition-all duration-200`}
            >
              <svg className={`mr-2 h-5 w-5 ${activeTab === 'voters' ? 'text-white' : 'text-gray-500'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              Voters
            </button>
            <button
              onClick={() => setActiveTab('keypersons')}
              className={`px-6 py-3 flex items-center ${
                activeTab === 'keypersons'
                  ? 'bg-gradient-to-r from-kweli-primary to-kweli-secondary text-white font-medium shadow-soft'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              } rounded-r-lg transition-all duration-200`}
            >
              <svg className={`mr-2 h-5 w-5 ${activeTab === 'keypersons' ? 'text-white' : 'text-gray-500'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
              Keypersons
            </button>
          </div>
          
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-full bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-kweli-primary/50 focus:border-kweli-primary/50 transition-colors duration-200"
            />
          </div>
        </div>

        <div className="bg-gray-50 p-4 mb-6 rounded-lg shadow-soft-inner">
          {activeTab === 'voters' && (
            <div className="animate-fade-in">
              <div className="flex items-center mb-4">
                <div className="h-8 w-8 bg-kweli-primary/10 rounded-full flex items-center justify-center mr-3">
                  <svg className="h-4 w-4 text-kweli-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-kweli-dark">Registered Voters</h3>
                  <p className="text-sm text-gray-600">Total: {filteredVoters.length} voters</p>
                </div>
              </div>

              {filteredVoters.length > 0 ? (
                <div className="overflow-x-auto">
                  <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden border border-gray-200 rounded-lg shadow-soft-sm">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              National ID
                            </th>
                            <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Name
                            </th>
                            <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              DID
                            </th>
                            <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Polling Station
                            </th>
                            <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Created By
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredVoters.map((voter) => (
                            <tr key={voter.nationalid} className="hover:bg-gray-50 transition-colors duration-150">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-kweli-dark">
                                {voter.nationalid}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {`${voter.firstname} ${voter.middlename ? voter.middlename + ' ' : ''}${voter.surname}`}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono">
                                {voter.did}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                <span className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full">
                                  {voter.designated_polling_station}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {voter.created_by}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-white rounded-lg shadow-soft-inner">
                  <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-700">No voters found</h3>
                  <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters.</p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'keypersons' && (
            <div className="animate-fade-in">
              <div className="flex items-center mb-4">
                <div className="h-8 w-8 bg-kweli-primary/10 rounded-full flex items-center justify-center mr-3">
                  <svg className="h-4 w-4 text-kweli-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-kweli-dark">Election Officials & Observers</h3>
                  <p className="text-sm text-gray-600">Total: {filteredKeypersons.length} keypersons</p>
                </div>
              </div>
              
              {filteredKeypersons.length > 0 ? (
                <div className="overflow-x-auto">
                  <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden border border-gray-200 rounded-lg shadow-soft-sm">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              National ID
                            </th>
                            <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Name
                            </th>
                            <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Role
                            </th>
                            <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Polling Station
                            </th>
                            <th scope="col" className="px-6 py-3.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Party / Organization
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredKeypersons.map((person) => (
                            <tr key={person.nationalid} className="hover:bg-gray-50 transition-colors duration-150">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-kweli-dark">
                                {person.nationalid}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {`${person.firstname} ${person.middlename ? person.middlename + ' ' : ''}${person.surname}`}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <RoleBadge role={person.role} />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                <span className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full">
                                  {person.designated_polling_station}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                {person.political_party || person.stakeholder || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-white rounded-lg shadow-soft-inner">
                  <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-700">No keypersons found</h3>
                  <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper component to render role badges with appropriate styling
const RoleBadge = ({ role }) => {
  const getBadgeClasses = () => {
    switch(role) {
      case 'Registration Clerk':
        return 'bg-green-50 text-green-700';
      case 'Party Agents':
        return 'bg-purple-50 text-purple-700';
      case 'Presiding Officer (PO)':
        return 'bg-red-50 text-red-700';
      case 'Deputy Presiding Officer (DPO)':
        return 'bg-orange-50 text-orange-700';
      case 'Polling Clerks':
        return 'bg-yellow-50 text-yellow-700';
      case 'Observers':
        return 'bg-indigo-50 text-indigo-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getBadgeClasses()}`}>
      {role}
    </span>
  );
};

export default DataViewer;