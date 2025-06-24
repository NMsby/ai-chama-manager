// User Profile Component
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { User, UserStats, VerificationLevel } from '../types/icp';
import { userService } from '../services/userService';
import { set } from 'date-fns';

interface UserProfileProps {
  userId?: string; // If provided, shows other user's profile (read-only)
  onProfileUpdate?: (user: User) => void;
  showStats?: boolean;
}

const UserProfile: React.FC<UserProfileProps> = ({ 
  userId, 
  onProfileUpdate,
  showStats = true
}) => {
  const { user: currentUser, updateProfile, verifyUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState<User | null>(userId ? null : currentUser);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(!userId);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setLoading(true);

        console.log('🔵 UserProfile render state:', {
          authLoading,
          loading,
          currentUser: !!currentUser,
          user: !!user,
          userStats: !!userStats,
          userId,
          showStats
        });

        if (userId) {
          await loadUserProfile(userId);
        } else if (currentUser) {
          console.log('🔵 Loading profile for current user:', currentUser.name)
          setUser(currentUser);
          updateFormData(currentUser);

          if (showStats) {
            console.log('🔵 Loading user statistics...');
            try {
              await loadUserStats();
              console.log('🟢 User statistics loaded successfully');
            } catch (error) {
              console.error('🔴 Failed to load user statistics:', error);
              // Only fail the profile load if user stats are critical
              setUserStats(null);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load user profile data:', error);
      } finally {
        setLoading(false); // Ensure loading state is reset
      }
    };

    loadProfileData();
  }, [userId, currentUser, showStats]);

  const loadUserProfile = async (targetUserId: string) => {
    try {
      setLoading(true);
      
    } catch (error) {
      console.error('Failed to load user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      console.log('🔵 Calling userService.getUserStats()...');
      const stats = await userService.getUserStats();
      console.log('🔵 getUserStats result:', stats);

      if (stats) {
        setUserStats(stats);
        console.log('🟢 User stats set successfully');
      } else {
        console.log('🟡 No user stats returned, setting null');
        setUserStats(null);
      }
    } catch (error) {
      console.error('Failed to load user stats:', error);
      setUserStats(null);
      throw error; // Re-throw to be caught by the outer try-catch
    }
  };

  const updateFormData = (userData: User) => {
    setFormData({
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage(null);

    try {
      const updatedUser = await updateProfile(formData.name, formData.email, formData.phone);
      
      if (updatedUser) {
        setUser(updatedUser);
        setSuccessMessage('Profile updated successfully!');
        setIsEditing(false);
        onProfileUpdate?.(updatedUser);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (error) {
      console.error('Profile update failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerification = async (level: VerificationLevel) => {
    console.log(`🔵 Starting ${level} verification...`);
    setIsVerifying(true);
    
    try {
      console.log(`🔵 Calling verifyUser from useAuth hook...`);
      const verifiedUser = await verifyUser(level);
      console.log('🔵 verifyUser result:', verifiedUser);

      if (verifiedUser) {
        console.log('🟢 Verification successful, updating user state...');
        setUser(verifiedUser);
        setSuccessMessage(`Account verified at ${level} level!`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        console.log('🔴 Verification returned null');
        setSuccessMessage('Verification failed. Please try again.');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (error) {
      console.error('🔴 Verification failed:', error);
      
      // User-visible error handling
      setSuccessMessage(`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      updateFormData(user);
    }
    setIsEditing(false);
    setSuccessMessage(null);
  };

  const getVerificationBadge = (user: User) => {
    // Helper function to convert verification level to string
    const getVerificationLevelString = (level: any): string => {
      if (typeof level === 'string') {
        return level; // Already a string (from initial registration)
      }
      if (typeof level === 'object' && level !== null) {
        // Convert variant object to string
        if ('basic' in level) return 'basic';
        if ('intermediate' in level) return 'intermediate';
        if ('advanced' in level) return 'advanced';
      }
      return 'basic'; // fallback
    };

    if (!user.isVerified) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-yellow-400" fill="currentColor" viewBox="0 0 8 8">
            <circle cx={4} cy={4} r={3} />
          </svg>
          Pending Verification
        </span>
      );
    }

    // Convert verification level to string
    const levelString = getVerificationLevelString(user.verificationLevel);

    const levelColors = {
      basic: 'bg-blue-100 text-blue-800',
      intermediate: 'bg-purple-100 text-purple-800',
      advanced: 'bg-green-100 text-green-800',
    };

    const levelIcons = {
      basic: '🥉',
      intermediate: '🥈',
      advanced: '🥇',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${levelColors[levelString as keyof typeof levelColors]}`}>
        <span className="mr-1">{levelIcons[levelString as keyof typeof levelIcons]}</span>
        {levelString.charAt(0).toUpperCase() + levelString.slice(1)} Verified
      </span>
    );
  };

  const getCreditScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getCreditScoreLabel = (score: number) => {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    if (score >= 0.4) return 'Fair';
    return 'Poor';
  };

  if (authLoading || loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="rounded-full bg-gray-200 h-16 w-16"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500">No user profile found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-indigo-600 flex items-center justify-center">
                <span className="text-2xl font-medium text-white">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{user.name}</h3>
                <div className="mt-1 flex items-center space-x-2">
                  {getVerificationBadge(user)}
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCreditScoreColor(user.creditScore)}`}>
                    Credit Score: {(user.creditScore * 100).toFixed(0)}% ({getCreditScoreLabel(user.creditScore)})
                  </span>
                </div>
              </div>
            </div>
            {isOwnProfile && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="px-6 py-4">
          {successMessage && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-600">{successMessage}</p>
                </div>
              </div>
            </div>
          )}

          {isEditing && isOwnProfile ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="form-label">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="form-label">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`btn-primary ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
              <div>
                <dt className="text-sm font-medium text-gray-500">Email Address</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Phone Number</dt>
                <dd className="mt-1 text-sm text-gray-900">{user.phone}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Member Since</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(Number(user.createdAt) / 1000000).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Total Contributions</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  KES {user.totalContributions.toLocaleString()}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Chamas Joined</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user.chamasJoined.length} active membership{user.chamasJoined.length !== 1 ? 's' : ''}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Chamas Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user.chamasCreated.length} group{user.chamasCreated.length !== 1 ? 's' : ''} founded
                </dd>
              </div>
            </dl>
          )}
        </div>
      </div>

      {/* Verification Section */}
      {isOwnProfile && !user.isVerified && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Verify Your Account
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Increase your trust score by verifying your identity. Higher verification levels 
                  give you access to more features and better loan terms.
                </p>
              </div>
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => handleVerification('basic')}
                  disabled={isVerifying}
                  className="btn-primary text-sm"
                >
                  {isVerifying ? 'Verifying...' : 'Basic Verification'}
                </button>
                <button
                  onClick={() => handleVerification('intermediate')}
                  disabled={isVerifying}
                  className="btn-secondary text-sm"
                >
                  Intermediate Verification
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Statistics */}
      {showStats && userStats && isOwnProfile && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Your Statistics</h3>
          </div>
          <div className="p-6">
            <dl className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <dt className="text-sm font-medium text-gray-500">Total Savings</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  KES {userStats.totalSavings.toLocaleString()}
                </dd>
              </div>

              <div className="text-center">
                <dt className="text-sm font-medium text-gray-500">Average Contribution</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  KES {userStats.averageContribution.toLocaleString()}
                </dd>
              </div>

              <div className="text-center">
                <dt className="text-sm font-medium text-gray-500">Contribution Streak</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  {userStats.contributionStreak} months
                </dd>
              </div>

              <div className="text-center">
                <dt className="text-sm font-medium text-gray-500">Risk Score</dt>
                <dd className={`mt-1 text-lg font-semibold ${getCreditScoreColor(userStats.riskScore).split(' ')[0]}`}>
                  {(userStats.riskScore * 100).toFixed(1)}%
                </dd>
              </div>

              <div className="text-center">
                <dt className="text-sm font-medium text-gray-500">Reliability Score</dt>
                <dd className={`mt-1 text-lg font-semibold ${getCreditScoreColor(userStats.reliabilityScore).split(' ')[0]}`}>
                  {(userStats.reliabilityScore * 100).toFixed(1)}%
                </dd>
              </div>

              <div className="text-center">
                <dt className="text-sm font-medium text-gray-500">Last Activity</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(Number(userStats.lastActivity) / 1000000).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;