import React, { useState, useEffect } from 'react';
import { resultsAPI, candidateAPI } from '../../utils/api';

const ResultsCount = () => {
  const [formData, setFormData] = useState({
    candidate: '',
    pollingStation: '',
    votes: '',
    partyAgent: '',
    observer: '',
  });
  
  const [resultsList, setResultsList] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
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
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const candidatesData = await candidateAPI.getCandidates();
        setCandidates(candidatesData);
        
        const resultsData = await resultsAPI.getResults();
        setResultsList(resultsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try refreshing the page.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      const resultData = {
        candidate: formData.candidate,
        polling_station: formData.pollingStation,
        votes: parseInt(formData.votes),
        party_agent: formData.partyAgent,
        observer: formData.observer
      };

      const createdResult = await resultsAPI.createResult(resultData);
      console.log('Result created:', createdResult);
      
      setResultsList([createdResult, ...resultsList]);
      
      setShowSuccessAlert(true);
      
      setFormData({
        candidate: '',
        pollingStation: '',
        votes: '',
        partyAgent: '',
        observer: '',
      });
      
      setTimeout(() => {
        setShowSuccessAlert(false);
      }, 3000);
    } catch (err) {
      console.error('Error creating result:', err);
      setError(err.message || 'Failed to save results. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const votesByParty = resultsList.reduce((acc, result) => {
    const party = result.candidate_details?.political_party || 'Unknown';
    if (!acc[party]) {
      acc[party] = 0;
    }
    acc[party] += result.votes;
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-8 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-kweli-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto animate-slide-up">
      <div className="bg-white rounded-2xl shadow-soft-lg p-6 border border-gray-100">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-kweli-dark mb-3">Results Count Management</h2>
          <p className="text-gray-600">Track and manage election results across polling stations</p>
        </div>
        
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-md shadow-soft-sm animate-fade-in" role="alert">
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-b from-gray-50 to-white rounded-xl shadow-soft p-6 border border-gray-100">
              <div className="flex items-center mb-4">
                <div className="h-8 w-8 bg-kweli-primary/10 rounded-full flex items-center justify-center mr-3">
                  <svg className="h-4 w-4 text-kweli-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M3 4a1 0 011-1h12a1 0 011 1v2a1 0 01-1 1H4a1 0 01-1-1V4zM3 10a1 0 011-1h6a1 0 011 1v6a1 0 01-1 1H4a1 0 01-1-1v-6zM14 9a1 0 00-1 1v6a1 0 001 1h2a1 0 001-1v-6a1 0 00-1-1h-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-kweli-dark">Add New Results</h3>
              </div>
              
              {showSuccessAlert && (
                <div className="mb-4 bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-md shadow-soft-sm animate-fade-in">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Results count added successfully!</span>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="candidate" className="block text-sm font-medium text-gray-700">
                    Candidate *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <select
                      id="candidate"
                      name="candidate"
                      value={formData.candidate}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-kweli-primary/50 focus:border-kweli-primary/50 transition-colors duration-200 appearance-none"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 0.5rem center', 
                        backgroundRepeat: 'no-repeat', 
                        backgroundSize: '1.5em 1.5em',
                        paddingRight: '2.5rem' 
                      }}
                    >
                      <option value="" disabled>Select a candidate</option>
                      {candidates.map((candidate) => (
                        <option key={candidate.id} value={candidate.id}>
                          {candidate.name} - {candidate.type} ({candidate.party})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="pollingStation" className="block text-sm font-medium text-gray-700">
                    Polling Station *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <select
                      id="pollingStation"
                      name="pollingStation"
                      value={formData.pollingStation}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-kweli-primary/50 focus:border-kweli-primary/50 transition-colors duration-200 appearance-none"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 0.5rem center', 
                        backgroundRepeat: 'no-repeat', 
                        backgroundSize: '1.5em 1.5em',
                        paddingRight: '2.5rem' 
                      }}
                    >
                      <option value="" disabled>Select a polling station</option>
                      {pollingStations.map((station) => (
                        <option key={station} value={station}>
                          {station}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="votes" className="block text-sm font-medium text-gray-700">
                    Number of Votes *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                      </svg>
                    </div>
                    <input
                      type="number"
                      id="votes"
                      name="votes"
                      value={formData.votes}
                      onChange={handleInputChange}
                      required
                      min="0"
                      placeholder="Enter vote count"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-kweli-primary/50 focus:border-kweli-primary/50 transition-colors duration-200"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="partyAgent" className="block text-sm font-medium text-gray-700">
                    Party Agent *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                      </svg>
                    </div>
                    <select
                      id="partyAgent"
                      name="partyAgent"
                      value={formData.partyAgent}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-kweli-primary/50 focus:border-kweli-primary/50 transition-colors duration-200 appearance-none"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 0.5rem center', 
                        backgroundRepeat: 'no-repeat', 
                        backgroundSize: '1.5em 1.5em',
                        paddingRight: '2.5rem' 
                      }}
                    >
                      <option value="" disabled>Select a party agent</option>
                      {partyAgents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="observer" className="block text-sm font-medium text-gray-700">
                    Observer *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <select
                      id="observer"
                      name="observer"
                      value={formData.observer}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-kweli-primary/50 focus:border-kweli-primary/50 transition-colors duration-200 appearance-none"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 0.5rem center', 
                        backgroundRepeat: 'no-repeat', 
                        backgroundSize: '1.5em 1.5em',
                        paddingRight: '2.5rem' 
                      }}
                    >
                      <option value="" disabled>Select an observer</option>
                      {observers.map((observer) => (
                        <option key={observer.id} value={observer.id}>
                          {observer.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full flex items-center justify-center bg-gradient-to-r from-kweli-accent to-kweli-primary text-white font-medium py-2.5 px-6 rounded-lg shadow-soft hover:shadow-soft-md transition-all duration-300 transform hover:-translate-y-0.5 ${isSubmitting ? 'opacity-80' : ''}`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Add Results
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-kweli-primary/10 rounded-full flex items-center justify-center mr-3">
                    <svg className="h-4 w-4 text-kweli-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-kweli-dark">Results Summary</h3>
                </div>
                <div className="text-sm text-gray-500">
                  Total Entries: {resultsList.length}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {Object.entries(votesByParty).map(([party, votes]) => (
                  <div key={party} className="bg-gray-50 rounded-lg p-4 shadow-soft-inner">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-bold text-gray-700">{party}</h4>
                      <span className="text-lg font-bold text-kweli-primary">{votes} votes</span>
                    </div>
                    <div className="relative pt-1">
                      <div className="overflow-hidden h-2 mb-1 text-xs flex rounded bg-gray-200">
                        <div 
                          style={{ width: `${Math.min(100, votes / 2)}%` }} 
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-kweli-accent to-kweli-primary"
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="overflow-x-auto">
                <div className="inline-block min-w-full align-middle">
                  <div className="overflow-hidden border border-gray-200 rounded-lg shadow-soft-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th scope="col" className="px-4 py-3.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Candidate
                          </th>
                          <th scope="col" className="px-4 py-3.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Position
                          </th>
                          <th scope="col" className="px-4 py-3.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Party
                          </th>
                          <th scope="col" className="px-4 py-3.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Polling Station
                          </th>
                          <th scope="col" className="px-4 py-3.5 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                            Votes
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {resultsList.map((result, index) => (
                          <tr key={result.resultscount_id} className={`hover:bg-gray-50 transition-colors duration-150 ${index === 0 && 'animate-fade-in'}`}>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-kweli-dark">
                              {`${result.candidate_details.firstname} ${result.candidate_details.surname}`}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                              <span className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full">
                                {result.candidate_details.candidate_type}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                              <PartyBadge party={result.candidate_details.political_party} />
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                              {result.polling_station}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-kweli-dark">
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
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component for rendering party badges
const PartyBadge = ({ party }) => {
  const getBadgeClasses = () => {
    switch(party) {
      case 'Party A':
        return 'bg-green-50 text-green-700';
      case 'Party B':
        return 'bg-purple-50 text-purple-700';
      case 'Party C':
        return 'bg-orange-50 text-orange-700';
      case 'Party D':
        return 'bg-yellow-50 text-yellow-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getBadgeClasses()}`}>
      {party}
    </span>
  );
};

export default ResultsCount;