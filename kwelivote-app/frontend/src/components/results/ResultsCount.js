import React, { useState, useEffect } from 'react';
import { resultsAPI, candidateAPI } from '../../utils/api';

const ResultsCount = () => {
  const [candidates, setCandidates] = useState([]);
  const [candidatesByPosition, setCandidatesByPosition] = useState({});
  const [candidateVotes, setCandidateVotes] = useState({});
  const [resultsList, setResultsList] = useState([]);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState({});
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingResult, setEditingResult] = useState(null);
  const [editVotes, setEditVotes] = useState('');
  const [candidateTypes, setCandidateTypes] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [pollingStation, setPollingStation] = useState('Station A');
  const [partyAgent, setPartyAgent] = useState('100005');
  const [observer, setObserver] = useState('100006');
  
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

  // Get current user from session storage
  useEffect(() => {
    try {
      const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
      if (userInfo && userInfo.user) {
        setCurrentUser(userInfo.user);
      }
    } catch (err) {
      console.error('Error getting user info:', err);
    }
  }, []);
  
  // Fetch candidates and results
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const candidatesData = await candidateAPI.getCandidates();
        setCandidates(candidatesData);
        
        // Group candidates by position
        const groupedCandidates = candidatesData.reduce((acc, candidate) => {
          const position = candidate.candidate_type;
          if (!acc[position]) {
            acc[position] = [];
          }
          acc[position].push(candidate);
          return acc;
        }, {});
        
        setCandidatesByPosition(groupedCandidates);
        
        // Extract unique candidate types and sort them
        const types = [...new Set(candidatesData.map(c => c.candidate_type))];
        setCandidateTypes(types);
        
        const resultsData = await resultsAPI.getResults();
        setResultsList(resultsData);
        
        // Initialize votes input state for each candidate
        const votesState = {};
        candidatesData.forEach(candidate => {
          // Find if there's an existing result for this candidate
          const existingResult = resultsData.find(r => r.candidate === candidate.nationalid);
          votesState[candidate.nationalid] = existingResult ? existingResult.votes.toString() : '';
        });
        setCandidateVotes(votesState);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try refreshing the page.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleVoteChange = (candidateId, votes) => {
    setCandidateVotes({
      ...candidateVotes,
      [candidateId]: votes
    });
  };
  
  const handleAddResult = async (candidate) => {
    const candidateId = candidate.nationalid;
    const votes = candidateVotes[candidateId];
    
    if (!votes || isNaN(parseInt(votes)) || parseInt(votes) < 0) {
      setError(`Please enter a valid vote count for ${candidate.firstname} ${candidate.surname}`);
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    // Update submitting state for this candidate
    setIsSubmitting({ ...isSubmitting, [candidateId]: true });
    setError('');
    
    try {
      // Find if there's an existing result for this candidate
      const existingResult = resultsList.find(r => r.candidate === candidateId);
      
      if (existingResult) {
        // Update existing result
        const updatedResultData = {
          ...existingResult,
          votes: parseInt(votes),
          polling_station: pollingStation,
          party_agent: partyAgent,
          observer: observer
        };
        
        const updatedResult = await resultsAPI.updateResult(existingResult.resultscount_id, updatedResultData);
        
        // Update the list with the new result
        const updatedList = resultsList.map(r => 
          r.resultscount_id === updatedResult.resultscount_id ? updatedResult : r
        );
        
        setResultsList(updatedList);
        setSuccessMessage(`Vote count updated for ${candidate.firstname} ${candidate.surname}!`);
      } else {
        // Get current user info
        const userInfo = JSON.parse(sessionStorage.getItem('userInfo') || '{}');
        const username = userInfo.user?.username || 'anonymous';
        
        // Create new result with all required fields
        const resultData = {
          // Generate a unique ID for new results
          resultscount_id: `RES${Date.now().toString().slice(-6)}_${candidateId.slice(-4)}`,
          candidate: candidateId,
          polling_station: pollingStation,
          votes: parseInt(votes),
          party_agent: partyAgent,
          observer: observer,
          // Required fields that were missing
          presiding_officer: userInfo.user?.keyperson?.nationalid || "100002", // Default to a known PO if user isn't one
          created_by: username,
          created_datetime: new Date().toISOString()
        };
        
        const createdResult = await resultsAPI.createResult(resultData);
        setResultsList([createdResult, ...resultsList]);
        setSuccessMessage(`Results added for ${candidate.firstname} ${candidate.surname}!`);
      }
      
      setShowSuccessAlert(true);
      setTimeout(() => {
        setShowSuccessAlert(false);
      }, 3000);
    } catch (err) {
      console.error('Error saving result:', err);
      setError(err.message || 'Failed to save results. Please try again.');
    } finally {
      setIsSubmitting({ ...isSubmitting, [candidateId]: false });
    }
  };

  // Group results by candidate position
  const resultsByPosition = resultsList.reduce((acc, result) => {
    const position = result.candidate_details?.candidate_type || 'Unknown';
    if (!acc[position]) {
      acc[position] = [];
    }
    acc[position].push(result);
    return acc;
  }, {});

  // Check if a candidate already has results
  const hasResults = (candidateId) => {
    return resultsList.some(r => r.candidate === candidateId);
  };

  // Get result for a specific candidate
  const getResultForCandidate = (candidateId) => {
    return resultsList.find(r => r.candidate === candidateId);
  };

  // Check if user is a Presiding Officer or Deputy Presiding Officer
  const canEditVotes = () => {
    if (!currentUser || !currentUser.keyperson) return false;
    const role = currentUser.keyperson.role;
    return role === 'Presiding Officer (PO)' || role === 'Deputy Presiding Officer (DPO)';
  };

  // Get maximum votes for a particular position to scale the gauge bars
  const getMaxVotesForPosition = (positionResults) => {
    if (!positionResults || positionResults.length === 0) return 0;
    return Math.max(...positionResults.map(result => result.votes));
  };

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

        {showSuccessAlert && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-md shadow-soft-sm animate-fade-in">
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{successMessage}</span>
            </div>
          </div>
        )}
        
        {/* Global settings for all candidate entries */}
        <div className="mb-8 bg-gray-50 rounded-xl p-5 border border-gray-200 shadow-soft-sm">
          <h3 className="text-lg font-bold text-kweli-dark mb-4">Global Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label htmlFor="pollingStation" className="block text-sm font-medium text-gray-700">
                Polling Station
              </label>
              <select
                id="pollingStation"
                value={pollingStation}
                onChange={(e) => setPollingStation(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-kweli-primary/50"
              >
                {pollingStations.map((station) => (
                  <option key={station} value={station}>
                    {station}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="partyAgent" className="block text-sm font-medium text-gray-700">
                Party Agent
              </label>
              <select
                id="partyAgent"
                value={partyAgent}
                onChange={(e) => setPartyAgent(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-kweli-primary/50"
              >
                {partyAgents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="observer" className="block text-sm font-medium text-gray-700">
                Observer
              </label>
              <select
                id="observer"
                value={observer}
                onChange={(e) => setObserver(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-kweli-primary/50"
              >
                {observers.map((obs) => (
                  <option key={obs.id} value={obs.id}>
                    {obs.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Candidates grouped by position */}
        {candidateTypes.map((position) => {
          const positionCandidates = candidatesByPosition[position] || [];
          const positionResults = resultsByPosition[position] || [];
          const maxVotes = getMaxVotesForPosition(positionResults);
          
          return (
            <div key={position} className="mb-8">
              <div className="bg-blue-50 p-3 rounded-t-lg border border-blue-100">
                <div className="flex items-center">
                  <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                    <svg className="h-3 w-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9.504 1.132a1 1 0 01.992 0l1.75 1a1 1 0 11-.992 1.736L10 3.152l-1.254.716a1 1 0 11-.992-1.736l1.75-1z" />
                    </svg>
                  </div>
                  <h4 className="text-md font-bold text-blue-800">{position}</h4>
                </div>
              </div>
              
              <div className="border-x border-gray-200">
                {/* Header row */}
                <div className="grid grid-cols-12 gap-2 bg-gray-100 py-2 px-4 border-b border-gray-200">
                  <div className="col-span-3 text-sm font-medium text-gray-700">Candidate</div>
                  <div className="col-span-3 text-sm font-medium text-gray-700">Party</div>
                  <div className="col-span-2 text-sm font-medium text-gray-700">Current Votes</div>
                  <div className="col-span-2 text-sm font-medium text-gray-700">Vote Count</div>
                  <div className="col-span-2 text-sm font-medium text-gray-700">Action</div>
                </div>
                
                {/* Candidate rows */}
                {positionCandidates.map((candidate) => {
                  const candidateId = candidate.nationalid;
                  const candidateResult = getResultForCandidate(candidateId);
                  const hasExistingResult = !!candidateResult;
                  
                  return (
                    <div 
                      key={candidateId}
                      className={`grid grid-cols-12 gap-2 py-3 px-4 border-b border-gray-200 ${
                        hasExistingResult ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <div className="col-span-3 flex items-center">
                        <div className="font-medium text-gray-800">
                          {candidate.firstname} {candidate.surname}
                        </div>
                      </div>
                      
                      <div className="col-span-3 flex items-center">
                        <PartyBadge party={candidate.political_party} />
                      </div>
                      
                      <div className="col-span-2 flex items-center">
                        {hasExistingResult ? (
                          <div className="flex flex-col">
                            <span className="font-bold text-kweli-primary">{candidateResult.votes}</span>
                            {maxVotes > 0 && (
                              <div className="w-full mt-1 bg-gray-200 rounded-full h-1.5">
                                <div 
                                  className={`h-1.5 rounded-full ${
                                    candidateResult.votes === maxVotes && maxVotes > 0
                                      ? 'bg-gradient-to-r from-green-400 to-green-500' 
                                      : 'bg-gradient-to-r from-blue-400 to-kweli-primary'
                                  }`}
                                  style={{ width: `${(candidateResult.votes / maxVotes) * 100}%` }}
                                ></div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm italic">No votes yet</span>
                        )}
                      </div>
                      
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="0"
                          value={candidateVotes[candidateId]}
                          onChange={(e) => handleVoteChange(candidateId, e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-kweli-primary/50"
                          placeholder="Votes"
                        />
                      </div>
                      
                      <div className="col-span-2">
                        <button
                          onClick={() => handleAddResult(candidate)}
                          disabled={isSubmitting[candidateId]}
                          className={`inline-flex items-center justify-center px-3 py-1.5 bg-gradient-to-r from-kweli-accent to-kweli-primary text-white text-sm font-medium rounded-md hover:shadow-md transition-all duration-200 ${
                            isSubmitting[candidateId] ? 'opacity-70' : ''
                          }`}
                        >
                          {isSubmitting[candidateId] ? (
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <>
                              {hasExistingResult ? "Update" : "Add Result"}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="h-2 bg-gray-100 rounded-b-lg border-x border-b border-gray-200 mb-6"></div>
            </div>
          );
        })}
        
        {/* Summary section showing all results */}
        {resultsList.length > 0 && (
          <div className="mt-10 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-bold text-kweli-dark mb-4">Results Summary</h3>
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
                      {resultsList.map((result) => (
                        <tr key={result.resultscount_id} className="hover:bg-gray-50 transition-colors duration-150">
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
        )}
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
      case 'Green Party':
        return 'bg-emerald-50 text-emerald-700';
      case 'Jubilee Party':
        return 'bg-red-50 text-red-700';
      case 'NARC Kenya':
        return 'bg-blue-50 text-blue-700';
      case 'ODM':
        return 'bg-orange-50 text-orange-700';
      case 'UDA':
        return 'bg-yellow-50 text-yellow-700';
      case 'Independent':
        return 'bg-gray-50 text-gray-700';
      case 'Wiper Democratic Movement':
        return 'bg-cyan-50 text-cyan-700';
      case 'NARC':
        return 'bg-indigo-50 text-indigo-700';
      case 'Maendeleo Chap Chap':
        return 'bg-teal-50 text-teal-700';
      case 'Ford Kenya':
        return 'bg-sky-50 text-sky-700';
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