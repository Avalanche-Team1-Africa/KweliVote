import React, { useState, useEffect } from 'react';

const ElectionList = () => {
  // Sample election data - in a real app, this would come from the API
  const [elections, setElections] = useState([
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
    },
    {
      id: 3,
      title: 'Local Government Election 2024',
      description: 'Vote for your local representatives',
      startDate: '2024-12-01',
      endDate: '2024-12-02',
      status: 'upcoming'
    }
  ]);

  const [filter, setFilter] = useState('all'); // all, active, upcoming, past

  // Filter elections based on the selected filter
  const filteredElections = elections.filter(election => {
    if (filter === 'all') return true;
    return election.status === filter;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'past':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-primary mb-6">Elections</h1>
      
      {/* Filter tabs */}
      <div className="mb-6">
        <div className="flex border-b border-gray-200">
          <button
            className={`px-4 py-2 ${filter === 'all' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`px-4 py-2 ${filter === 'active' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button
            className={`px-4 py-2 ${filter === 'upcoming' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
            onClick={() => setFilter('upcoming')}
          >
            Upcoming
          </button>
          <button
            className={`px-4 py-2 ${filter === 'past' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
            onClick={() => setFilter('past')}
          >
            Past
          </button>
        </div>
      </div>
      
      {/* Election cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredElections.map(election => (
          <div key={election.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">{election.title}</h2>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(election.status)}`}>
                  {election.status.charAt(0).toUpperCase() + election.status.slice(1)}
                </span>
              </div>
              <p className="text-gray-600 mb-4">{election.description}</p>
              <div className="text-sm text-gray-500 mb-4">
                <div>Start: {new Date(election.startDate).toLocaleDateString()}</div>
                <div>End: {new Date(election.endDate).toLocaleDateString()}</div>
              </div>
              <a 
                href={`/elections/${election.id}`} 
                className="block w-full text-center bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded transition duration-150"
              >
                {election.status === 'active' ? 'Vote Now' : 'View Details'}
              </a>
            </div>
          </div>
        ))}
      </div>
      
      {filteredElections.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No elections found for the selected filter.</p>
        </div>
      )}
    </div>
  );
};

export default ElectionList;