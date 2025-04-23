import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  // Mock user data - in a real app this would come from an auth context or API
  const [user] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    nationalId: "12345678",
    votingHistory: [
      { id: 1, title: "Local Government Election 2024", date: "2024-12-01", status: "completed" }
    ]
  });

  // Mock upcoming elections - in a real app this would come from an API
  const [upcomingElections] = useState([
    {
      id: 1,
      title: 'Presidential Election 2025',
      description: 'Vote for the next president of Burundi',
      startDate: '2025-05-01',
      endDate: '2025-05-02',
      status: 'upcoming'
    },
    {
      id: 2,
      title: 'Parliamentary Election 2025',
      description: 'Vote for members of parliament',
      startDate: '2025-05-15',
      endDate: '2025-05-16',
      status: 'upcoming'
    }
  ]);

  // Mock notifications - in a real app this would come from an API
  const [notifications] = useState([
    { id: 1, message: "Your voter registration has been confirmed", date: "2024-04-20", read: true },
    { id: 2, message: "Presidential Election 2025 has been announced", date: "2024-04-15", read: true },
    { id: 3, message: "New security measures added to the KweliVote platform", date: "2024-04-10", read: false }
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-primary mb-8">My Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User profile card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 rounded-full bg-primary text-white flex items-center justify-center text-3xl font-bold mb-4">
              {user.name.split(' ').map(name => name[0]).join('')}
            </div>
            <h2 className="text-xl font-semibold">{user.name}</h2>
            <p className="text-gray-600">{user.email}</p>
            <div className="mt-2 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
              ID: {user.nationalId}
            </div>
          </div>
          <Link 
            to="/profile" 
            className="block w-full text-center bg-primary hover:bg-primary-dark text-white py-2 rounded transition duration-150"
          >
            Edit Profile
          </Link>
        </div>
        
        {/* Upcoming elections */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Upcoming Elections</h2>
          {upcomingElections.length > 0 ? (
            <div className="space-y-4">
              {upcomingElections.map(election => (
                <div key={election.id} className="border-b pb-3 last:border-0">
                  <h3 className="font-medium">{election.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{election.description}</p>
                  <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
                    <span>Starts: {new Date(election.startDate).toLocaleDateString()}</span>
                    <Link 
                      to={`/elections/${election.id}`}
                      className="text-primary hover:text-primary-dark"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No upcoming elections at this time.</p>
          )}
          <div className="mt-4">
            <Link 
              to="/elections" 
              className="block text-center text-primary hover:text-primary-dark border border-primary hover:border-primary-dark rounded py-2 transition duration-150"
            >
              View All Elections
            </Link>
          </div>
        </div>
        
        {/* Notifications */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Notifications</h2>
          {notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`p-3 rounded-lg ${notification.read ? 'bg-gray-50' : 'bg-blue-50'}`}
                >
                  <p className={`${notification.read ? 'text-gray-700' : 'text-blue-700'}`}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notification.date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No notifications at this time.</p>
          )}
        </div>
      </div>
      
      {/* Voting history */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">My Voting History</h2>
        {user.votingHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Election
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {user.votingHistory.map((election) => (
                  <tr key={election.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{election.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{new Date(election.date).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {election.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link to={`/elections/${election.id}/results`} className="text-primary hover:text-primary-dark">
                        View Results
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">You have not voted in any elections yet.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;