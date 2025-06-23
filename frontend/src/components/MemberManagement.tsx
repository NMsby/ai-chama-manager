// Member Management Component
import React, { useState } from 'react';
import { Chama, ChamaMember, MemberRole, MemberStatus, UserId } from '../types/icp';
import { chamaService } from '../services/chamaService';
import { userService } from '../services/userService';
import UserSearch from './UserSearch';

interface MemberManagementProps {
  chama: Chama;
  onChamaUpdate?: (updatedChama: Chama) => void;
  isAdmin?: boolean;
}

const MemberManagement: React.FC<MemberManagementProps> = ({
  chama,
  onChamaUpdate,
  isAdmin = false,
}) => {
  const [showAddMember, setShowAddMember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleAddMember = async (userId: UserId) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedChama = await chamaService.addMember(chama.id, userId);
      if (updatedChama) {
        onChamaUpdate?.(updatedChama);
        setShowAddMember(false);
        setSuccess('Member added successfully!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      console.error('Failed to add member:', error);
      setError(error instanceof Error ? error.message : 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: UserId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const updatedChama = await chamaService.removeMember(chama.id, userId);
      if (updatedChama) {
        onChamaUpdate?.(updatedChama);
        setSuccess('Member removed successfully!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      console.error('Failed to remove member:', error);
      setError(error instanceof Error ? error.message : 'Failed to remove member');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: UserId, newRole: MemberRole) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedChama = await chamaService.updateMemberRole(chama.id, userId, newRole);
      if (updatedChama) {
        onChamaUpdate?.(updatedChama);
        setSuccess('Member role updated successfully!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      console.error('Failed to update member role:', error);
      setError(error instanceof Error ? error.message : 'Failed to update member role');
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: MemberRole) => {
    const colors = {
      owner: 'bg-purple-100 text-purple-800',
      admin: 'bg-blue-100 text-blue-800',
      treasurer: 'bg-green-100 text-green-800',
      secretary: 'bg-yellow-100 text-yellow-800',
      member: 'bg-gray-100 text-gray-800',
    };
    return colors[role];
  };

  const getStatusColor = (status: MemberStatus) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800',
      inactive: 'bg-gray-100 text-gray-800',
      expelled: 'bg-red-200 text-red-900',
    };
    return colors[status];
  };

  const formatCurrency = (amount: bigint) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(Number(amount));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Members</h3>
          <p className="text-sm text-gray-500">
            {chama.members.length} of {Number(chama.maxMembers)} members
          </p>
        </div>
        {isAdmin && chama.members.length < Number(chama.maxMembers) && (
          <button
            onClick={() => setShowAddMember(true)}
            className="btn-primary"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Member
          </button>
        )}
      </div>

      {/* Status Messages */}
      {error && (
        <div className="alert alert-error">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {chama.members.map((member) => (
            <li key={member.userId.toString()} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Member Avatar */}
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {member.userId.toString().charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Member Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        Member ID: {member.userId.toString().substring(0, 8)}...
                      </p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                        {member.role}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                        {member.status}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                      <span>
                        Joined: {new Date(Number(member.joinedAt) / 1000000).toLocaleDateString()}
                      </span>
                      <span>
                        Balance: {formatCurrency(member.contributionBalance)}
                      </span>
                      {member.loanBalance > 0n && (
                        <span className="text-red-600">
                          Loan: {formatCurrency(member.loanBalance)}
                        </span>
                      )}
                      {member.missedContributions > 0n && (
                        <span className="text-yellow-600">
                          Missed: {Number(member.missedContributions)} payments
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Member Actions */}
                {isAdmin && member.role !== 'owner' && (
                  <div className="flex items-center space-x-2">
                    {/* Role Change Dropdown */}
                    <select
                      value={member.role}
                      onChange={(e) => handleUpdateRole(member.userId, e.target.value as MemberRole)}
                      disabled={loading}
                      className="text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="member">Member</option>
                      <option value="secretary">Secretary</option>
                      <option value="treasurer">Treasurer</option>
                      <option value="admin">Admin</option>
                    </select>

                    {/* Remove Member Button */}
                    <button
                      onClick={() => handleRemoveMember(member.userId)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-500 disabled:opacity-50"
                      title="Remove member"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Additional Member Details */}
              {member.lastContribution && (
                <div className="mt-3 text-xs text-gray-500">
                  Last contribution: {new Date(Number(member.lastContribution) / 1000000).toLocaleDateString()}
                </div>
              )}
            </li>
          ))}
        </ul>

        {chama.members.length === 0 && (
          <div className="p-6 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No members yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding the first members to your chama.
            </p>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowAddMember(false)}></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Add New Member
                </h3>
                <button
                  onClick={() => setShowAddMember(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <UserSearch
                onUserSelect={(user) => handleAddMember(user.id)}
                showFilters={true}
                maxResults={20}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberManagement;
