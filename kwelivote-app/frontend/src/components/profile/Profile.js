import React, { useState } from 'react';

const Profile = () => {
  // Mock user data - in a real app this would come from an auth context or API
  const [formData, setFormData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phoneNumber: '+25712345678',
    nationalId: '12345678',
    address: 'Bujumbura, Burundi',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [message, setMessage] = useState('');

  const { 
    firstName, 
    lastName, 
    email, 
    phoneNumber, 
    nationalId, 
    address, 
    currentPassword, 
    newPassword, 
    confirmNewPassword 
  } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmitPersonal = (e) => {
    e.preventDefault();
    // In a real app, this would call an API to update the user's profile
    setIsEditing(false);
    setMessage('Profile updated successfully!');
    
    // Clear the message after 3 seconds
    setTimeout(() => {
      setMessage('');
    }, 3000);
  };

  const onSubmitPassword = (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmNewPassword) {
      setMessage('New passwords do not match');
      return;
    }
    
    // In a real app, this would call an API to update the user's password
    setFormData({
      ...formData,
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    });
    
    setMessage('Password updated successfully!');
    
    // Clear the message after 3 seconds
    setTimeout(() => {
      setMessage('');
    }, 3000);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-primary mb-8">My Profile</h1>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Profile header with avatar */}
        <div className="bg-primary p-6 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-20 h-20 rounded-full bg-white text-primary flex items-center justify-center text-3xl font-bold">
              {firstName[0]}{lastName[0]}
            </div>
            <div className="ml-4 text-white">
              <h2 className="text-2xl font-bold">{firstName} {lastName}</h2>
              <p>{email}</p>
            </div>
          </div>
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="bg-white text-primary hover:bg-gray-100 font-medium py-2 px-4 rounded-md"
          >
            {isEditing ? 'Cancel Editing' : 'Edit Profile'}
          </button>
        </div>
        
        {/* Tabs */}
        <div className="border-b">
          <div className="flex">
            <button 
              className={`py-4 px-6 focus:outline-none ${activeTab === 'personal' ? 'border-b-2 border-primary text-primary font-medium' : 'text-gray-500'}`}
              onClick={() => setActiveTab('personal')}
            >
              Personal Information
            </button>
            <button 
              className={`py-4 px-6 focus:outline-none ${activeTab === 'security' ? 'border-b-2 border-primary text-primary font-medium' : 'text-gray-500'}`}
              onClick={() => setActiveTab('security')}
            >
              Security
            </button>
          </div>
        </div>
        
        {/* Success/Error message */}
        {message && (
          <div className={`p-4 ${message.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}
        
        {/* Personal Information Tab */}
        {activeTab === 'personal' && (
          <div className="p-6">
            <form onSubmit={onSubmitPersonal}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="firstName">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    className={`w-full px-3 py-2 border ${isEditing ? 'border-gray-300' : 'border-transparent bg-gray-100'} rounded-md`}
                    value={firstName}
                    onChange={onChange}
                    disabled={!isEditing}
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="lastName">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    className={`w-full px-3 py-2 border ${isEditing ? 'border-gray-300' : 'border-transparent bg-gray-100'} rounded-md`}
                    value={lastName}
                    onChange={onChange}
                    disabled={!isEditing}
                    required
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className={`w-full px-3 py-2 border ${isEditing ? 'border-gray-300' : 'border-transparent bg-gray-100'} rounded-md`}
                  value={email}
                  onChange={onChange}
                  disabled={!isEditing}
                  required
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phoneNumber">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  className={`w-full px-3 py-2 border ${isEditing ? 'border-gray-300' : 'border-transparent bg-gray-100'} rounded-md`}
                  value={phoneNumber}
                  onChange={onChange}
                  disabled={!isEditing}
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nationalId">
                    National ID
                  </label>
                  <input
                    type="text"
                    id="nationalId"
                    name="nationalId"
                    className="w-full px-3 py-2 border-transparent bg-gray-100 rounded-md"
                    value={nationalId}
                    disabled={true}
                  />
                  <p className="text-xs text-gray-500 mt-1">National ID cannot be changed</p>
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="address">
                    Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    className={`w-full px-3 py-2 border ${isEditing ? 'border-gray-300' : 'border-transparent bg-gray-100'} rounded-md`}
                    value={address}
                    onChange={onChange}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              
              {isEditing && (
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-6 rounded-md"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </form>
          </div>
        )}
        
        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="p-6">
            <form onSubmit={onSubmitPassword}>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="currentPassword">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={currentPassword}
                  onChange={onChange}
                  required
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newPassword">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={newPassword}
                  onChange={onChange}
                  minLength="8"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Password must be at least 8 characters long</p>
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmNewPassword">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmNewPassword"
                  name="confirmNewPassword"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={confirmNewPassword}
                  onChange={onChange}
                  minLength="8"
                  required
                />
              </div>
              
              <div className="mb-6 p-4 bg-yellow-50 text-yellow-800 rounded-md">
                <h3 className="font-bold">Important Security Information</h3>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Your password should be at least 8 characters long</li>
                  <li>Include a mix of letters, numbers, and special characters</li>
                  <li>Don't reuse passwords from other websites</li>
                  <li>Never share your password with anyone</li>
                </ul>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-6 rounded-md"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;