import React, { useState, useEffect } from 'react';

const ElectionDetail = ({ electionId }) => {
  // In a real app, we'd fetch the election data from an API
  // This is mock data for demonstration
  const [election, setElection] = useState({
    id: 1,
    title: 'Presidential Election 2025',
    description: 'Vote for the next president of Burundi for a five-year term. The elected candidate will lead the country and represent the nation internationally.',
    startDate: '2025-05-01',
    endDate: '2025-05-02',
    status: 'upcoming',
    candidates: [
      {
        id: 1,
        name: 'John Doe',
        party: 'Progressive Party',
        bio: 'Former Minister of Finance with 15 years of experience in government.',
        photoUrl: 'https://via.placeholder.com/150'
      },
      {
        id: 2,
        name: 'Jane Smith',
        party: 'Democratic Alliance',
        bio: 'Human rights lawyer and community activist with a focus on social justice.',
        photoUrl: 'https://via.placeholder.com/150'
      },
      {
        id: 3,
        name: 'David Johnson',
        party: 'National Unity Party',
        bio: 'Business leader and entrepreneur focused on economic development.',
        photoUrl: 'https://via.placeholder.com/150'
      }
    ],
    votingInstructions: [
      'Verify your identity using your national ID and biometric data.',
      'Select one candidate from the list by clicking on their name.',
      'Confirm your selection to cast your vote.',
      'Your vote is anonymous and cannot be changed once submitted.'
    ]
  });

  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [voteSubmitted, setVoteSubmitted] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSelectCandidate = (candidateId) => {
    if (election.status !== 'active' || voteSubmitted) return;
    setSelectedCandidate(candidateId);
  };

  const handleVoteClick = () => {
    if (!selectedCandidate) return;
    setShowConfirmation(true);
  };

  const handleConfirmVote = () => {
    // In a real app, this would make an API call to submit the vote
    console.log(`Vote submitted for candidate ID: ${selectedCandidate}`);
    setVoteSubmitted(true);
    setShowConfirmation(false);
  };

  const handleCancelVote = () => {
    setShowConfirmation(false);
  };

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
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-3xl font-bold text-primary">{election.title}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(election.status)}`}>
              {election.status.charAt(0).toUpperCase() + election.status.slice(1)}
            </span>
          </div>
          
          <p className="text-gray-700 mb-6">{election.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Election Period</h3>
              <div className="text-gray-600">
                <p>Start: {new Date(election.startDate).toLocaleDateString()}</p>
                <p>End: {new Date(election.endDate).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Voting Instructions</h3>
              <ul className="list-disc pl-5 text-gray-600 space-y-1">
                {election.votingInstructions.map((instruction, index) => (
                  <li key={index}>{instruction}</li>
                ))}
              </ul>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Candidates</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {election.candidates.map((candidate) => (
              <div 
                key={candidate.id}
                className={`border rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
                  selectedCandidate === candidate.id ? 'border-primary-500 shadow-md' : 'border-gray-200'
                }`}
                onClick={() => handleSelectCandidate(candidate.id)}
              >
                <div className="p-4">
                  <div className="flex flex-col items-center mb-4">
                    <img 
                      src={candidate.photoUrl} 
                      alt={candidate.name} 
                      className="w-24 h-24 rounded-full object-cover"
                    />
                    <h3 className="text-xl font-semibold text-gray-800 mt-2">{candidate.name}</h3>
                    <p className="text-gray-500">{candidate.party}</p>
                  </div>
                  <p className="text-gray-600 text-sm">{candidate.bio}</p>
                  
                  {selectedCandidate === candidate.id && (
                    <div className="mt-3 flex justify-center">
                      <span className="inline-block px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">
                        Selected
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {election.status === 'active' && !voteSubmitted && (
            <div className="flex justify-center mt-6">
              <button
                onClick={handleVoteClick}
                disabled={!selectedCandidate}
                className={`px-6 py-3 rounded-lg text-white font-medium transition-colors ${
                  selectedCandidate ? 'bg-primary hover:bg-primary-dark' : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                Cast Your Vote
              </button>
            </div>
          )}
          
          {election.status === 'upcoming' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center text-blue-700">
              This election has not started yet. Please check back on {new Date(election.startDate).toLocaleDateString()}
            </div>
          )}
          
          {election.status === 'past' && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-700">
              This election has ended. Results will be announced soon.
            </div>
          )}
          
          {voteSubmitted && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center text-green-700 mt-6">
              Thank you for voting! Your vote has been recorded securely.
            </div>
          )}
        </div>
      </div>
      
      {/* Vote confirmation modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Confirm Your Vote</h3>
            <p className="text-gray-600 mb-6">
              You are about to vote for {election.candidates.find(c => c.id === selectedCandidate)?.name}. 
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCancelVote}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmVote}
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg"
              >
                Confirm Vote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ElectionDetail;