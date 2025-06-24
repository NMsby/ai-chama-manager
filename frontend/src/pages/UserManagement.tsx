// User Management Page
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import UserProfile from '../components/UserProfile';
import UserSearch from '../components/UserSearch';
import UserRegistration from '../components/UserRegistration';
import { User } from '../types/icp';

const UserManagement: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'search' | 'register'>('profile');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const tabs = [
    {
      key: 'profile' as const,
      name: 'My Profile',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      key: 'search' as const,
      name: 'Find Users',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      key: 'register' as const,
      name: 'Register User',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
    },
  ];

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please log in to access user management features.
        </p>
      </div>
    );
  }

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    // Could open a modal or navigate to user detail page
    console.log('Selected user:', user);
  };

  const handleRegistrationComplete = (newUser: User) => {
    setActiveTab('profile');
    // Refresh current user data
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your profile, search for users, and help onboard new members
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Welcome,</span>
              <span className="text-sm font-medium text-gray-900">{user?.name}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`${
                  activeTab === tab.key
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                {tab.icon}
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'profile' && (
          <div>
            <UserProfile showStats={true} />
          </div>
        )}

        {activeTab === 'search' && (
          <div>
            <UserSearch 
              onUserSelect={handleUserSelect}
              showFilters={true}
              maxResults={50}
            />
          </div>
        )}

        {activeTab === 'register' && (
          <div>
            <UserRegistration 
              onRegistrationComplete={handleRegistrationComplete}
              onCancel={() => setActiveTab('profile')}
            />
          </div>
        )}
      </div>

      {/* Selected User Modal/Panel - Future Enhancement */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setSelectedUser(null)}></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
              <div className="flex items-start justify-between">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  User Profile
                </h3>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mt-4">
                <UserProfile 
                  userId={selectedUser.id.toString()} 
                  showStats={false}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {user?.chamasJoined.length || 0}
            </div>
            <div className="text-sm text-gray-500">Chamas Joined</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              KES {user?.totalContributions.toLocaleString() || '0'}
            </div>
            <div className="text-sm text-gray-500">Total Contributions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {user?.isVerified ? '✓' : '○'}
            </div>
            <div className="text-sm text-gray-500">
              {user?.isVerified ? 'Verified Account' : 'Pending Verification'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
