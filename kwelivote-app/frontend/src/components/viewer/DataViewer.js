import React, { useState } from 'react';

const DataViewer = () => {
  const [activeTab, setActiveTab] = useState('voters');
  
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

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-3xl font-bold text-kweli-dark mb-6 text-center">View Election Data</h2>
      
      <div className="flex mb-6">
        <button
          onClick={() => setActiveTab('voters')}
          className={`px-6 py-3 ${
            activeTab === 'voters'
              ? 'bg-kweli-primary text-white font-bold'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          } border-t border-l border-r rounded-t-lg transition-colors`}
        >
          Voters
        </button>
        <button
          onClick={() => setActiveTab('keypersons')}
          className={`px-6 py-3 ${
            activeTab === 'keypersons'
              ? 'bg-kweli-primary text-white font-bold'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          } border-t border-l border-r rounded-t-lg transition-colors`}
        >
          Keypersons
        </button>
      </div>
      
      {activeTab === 'voters' && (
        <>
          <div className="mb-4">
            <h3 className="text-xl font-bold text-kweli-dark">Registered Voters</h3>
            <p className="text-gray-600">View all registered voters in the system.</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    National ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    DID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Polling Station
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created By
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {voters.map((voter) => (
                  <tr key={voter.nationalid}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {voter.nationalid}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {`${voter.firstname} ${voter.middlename ? voter.middlename + ' ' : ''}${voter.surname}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {voter.did}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {voter.designated_polling_station}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {voter.created_by}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      
      {activeTab === 'keypersons' && (
        <>
          <div className="mb-4">
            <h3 className="text-xl font-bold text-kweli-dark">Keypersons</h3>
            <p className="text-gray-600">View all election officials and observers.</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    National ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Polling Station
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Party / Organization
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {keypersons.map((person) => (
                  <tr key={person.nationalid}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {person.nationalid}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {`${person.firstname} ${person.middlename ? person.middlename + ' ' : ''}${person.surname}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {person.role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {person.designated_polling_station}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {person.political_party || person.stakeholder || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default DataViewer;