import React, { useState } from 'react';

const ResultsCount = () => {
  const [formData, setFormData] = useState({
    candidate: '',
    pollingStation: '',
    votes: '',
    partyAgent: '',
    observer: '',
  });
  
  const [resultsList, setResultsList] = useState([
    {
      resultscount_id: "RES1001",
      candidate_details: {
        firstname: "Diana",
        surname: "Kenya",
        candidate_type: "President",
        political_party: "Party A"
      },
      polling_station: "Station A",
      votes: 120,
      created_by: "officer1",
      created_datetime: "2025-04-23T14:57:21.596405Z",
      candidate: "C1001",
      presiding_officer: "100002",
      deputy_presiding_officer: "100003",
      party_agent: "100005",
      observer: "100006"
    },
    {
      resultscount_id: "RES1002",
      candidate_details: {
        firstname: "Eli",
        surname: "Wanjiku",
        candidate_type: "President",
        political_party: "Party B"
      },
      polling_station: "Station A",
      votes: 85,
      created_by: "officer1",
      created_datetime: "2025-04-23T14:57:21.596565Z",
      candidate: "C1002",
      presiding_officer: "100002",
      deputy_presiding_officer: "100003",
      party_agent: "100005",
      observer: "100006"
    }
  ]);
  
  // Sample data for dropdown options
  const candidates = [
    { id: 'C1001', name: 'Diana Kenya', type: 'President', party: 'Party A' },
    { id: 'C1002', name: 'Eli Wanjiku', type: 'President', party: 'Party B' },
    { id: 'C1003', name: 'Faith Omari', type: 'Governor', party: 'Party A' },
    { id: 'C1004', name: 'George Mwangi', type: 'Governor', party: 'Party B' },
    { id: 'C1005', name: 'Helen Njeri', type: 'Member of National Assembly (MP)', party: 'Party C' },
    { id: 'C1006', name: 'Ian Ochieng', type: 'Member of National Assembly (MP)', party: 'Party D' },
  ];
  
  const pollingStations = [
    'Station A',
    'Station B',
    'Station C',
    'Station D',
    'Station E',
    'Station F',
    'Station G',
  ];
  
  const partyAgents = [
    { id: '100005', name: 'Michael Williams' },
  ];
  
  const observers = [
    { id: '100006', name: 'Sarah Davis' },
    { id: '100007', name: 'Robert Miller' },
  ];
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Get the selected candidate details
    const selectedCandidate = candidates.find(c => c.id === formData.candidate);
    
    // Create new result entry
    const newResult = {
      resultscount_id: `RES${Math.floor(1000 + Math.random() * 9000)}`,
      candidate_details: {
        firstname: selectedCandidate.name.split(' ')[0],
        surname: selectedCandidate.name.split(' ')[1],
        candidate_type: selectedCandidate.type,
        political_party: selectedCandidate.party
      },
      polling_station: formData.pollingStation,
      votes: parseInt(formData.votes),
      created_by: "officer1",
      created_datetime: new Date().toISOString(),
      candidate: formData.candidate,
      presiding_officer: "100002",
      deputy_presiding_officer: "100003",
      party_agent: formData.partyAgent,
      observer: formData.observer
    };
    
    // Add to the results list
    setResultsList([...resultsList, newResult]);
    
    // Reset form
    setFormData({
      candidate: '',
      pollingStation: '',
      votes: '',
      partyAgent: '',
      observer: '',
    });
    
    alert('Results count added successfully!');
  };

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-3xl font-bold text-kweli-dark mb-6 text-center">Results Count Management</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <div className="bg-gray-50 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold text-kweli-dark mb-4">Add New Results</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="candidate" className="block text-sm font-medium text-gray-700">
                  Candidate *
                </label>
                <select
                  id="candidate"
                  name="candidate"
                  value={formData.candidate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-kweli-accent focus:border-kweli-accent"
                >
                  <option value="" disabled>Select a candidate</option>
                  {candidates.map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.name} - {candidate.type} ({candidate.party})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="pollingStation" className="block text-sm font-medium text-gray-700">
                  Polling Station *
                </label>
                <select
                  id="pollingStation"
                  name="pollingStation"
                  value={formData.pollingStation}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-kweli-accent focus:border-kweli-accent"
                >
                  <option value="" disabled>Select a polling station</option>
                  {pollingStations.map((station) => (
                    <option key={station} value={station}>
                      {station}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="votes" className="block text-sm font-medium text-gray-700">
                  Number of Votes *
                </label>
                <input
                  type="number"
                  id="votes"
                  name="votes"
                  value={formData.votes}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-kweli-accent focus:border-kweli-accent"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="partyAgent" className="block text-sm font-medium text-gray-700">
                  Party Agent *
                </label>
                <select
                  id="partyAgent"
                  name="partyAgent"
                  value={formData.partyAgent}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-kweli-accent focus:border-kweli-accent"
                >
                  <option value="" disabled>Select a party agent</option>
                  {partyAgents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="observer" className="block text-sm font-medium text-gray-700">
                  Observer *
                </label>
                <select
                  id="observer"
                  name="observer"
                  value={formData.observer}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-kweli-accent focus:border-kweli-accent"
                >
                  <option value="" disabled>Select an observer</option>
                  {observers.map((observer) => (
                    <option key={observer.id} value={observer.id}>
                      {observer.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-kweli-primary hover:bg-kweli-secondary text-white font-bold py-2 px-6 rounded-md shadow transition-colors duration-200"
                >
                  Add Results
                </button>
              </div>
            </form>
          </div>
        </div>
        
        <div className="md:col-span-2">
          <h3 className="text-xl font-bold text-kweli-dark mb-4">Results Counts</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Candidate
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Party
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Polling Station
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Votes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {resultsList.map((result) => (
                  <tr key={result.resultscount_id}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {`${result.candidate_details.firstname} ${result.candidate_details.surname}`}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {result.candidate_details.candidate_type}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {result.candidate_details.political_party}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {result.polling_station}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                      {result.votes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsCount;