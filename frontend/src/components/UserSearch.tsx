// User Search and Discovery Component
import React, { useState, useEffect } from 'react';
import { User } from '../types/icp';
import { UserFilter, VerificationLevel } from '../types/icp';
import { userService } from '../services/userService';

interface UserSearchProps {
    onUserSelect?: (user: User) => void;
    showFilters?: boolean;
    maxResults?: number;
}

const UserSearch: React.FC<UserSearchProps> = ({
    onUserSelect,
    showFilters = true,
    maxResults = 20
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filters, setFilters] = useState<UserFilter>({});
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    // Load all users on component mount
    useEffect(() => {
        loadUsers();
    }, []);

    // Filter users based on search query and filters
    useEffect(() => {
        filterUsers();
    }, [users, searchQuery, filters]);

    const loadUsers = async () => {
        try {
            setIsLoading(true);
            const allUsers = await userService.getAllUsers();
            setUsers(allUsers);
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filterUsers = () => {
        let filtered = users;

        // Text search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(user => 
                user.name.toLowerCase().includes(query) ||
                user.email.toLowerCase().includes(query)
            );
        }

        // Apply filters
        if (filters.isVerified !== undefined) {
            filtered = filtered.filter(user => user.isVerified === filters.isVerified);
        }
        
        if (filters.verificationLevel) {
            filtered = filtered.filter(user => user.verificationLevel === filters.verificationLevel);
        }

        if (filters.minCreditScore !== undefined) {
            filtered = filtered.filter(user => user.creditScore >= filters.minCreditScore!);
        }

        // Limit results
        filtered = filtered.slice(0, maxResults);

        setFilteredUsers(filtered);
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
    
        if (query.trim().length > 2) {
            try {
                setIsLoading(true);
                const searchResults = await userService.searchUsers(query);
                setUsers(searchResults);
            } catch (error) {
                console.error('Search failed:', error);
            } finally {
                setIsLoading(false);
            }
        } else if (query.trim().length === 0) {
            loadUsers();
        }
    };

    const handleFilterChange = (key: keyof UserFilter, value: any) => {
        setFilters(prev => ({
            ...prev,
            [key]: value === '' ? undefined : value,
        }));
    };

    const clearFilters = () => {
        setFilters({});
        setSearchQuery('');
        loadUsers();
    };

    const getVerificationBadge = (user: User) => {
        if (!user.isVerified) {
            return <span className="badge badge-warning">Unverified</span>;
        }

        switch (user.verificationLevel) {
            case 'basic':
                return <span className="badge badge-primary">Basic</span>;
            case 'intermediate':
                return <span className="badge badge-secondary">Intermediate</span>;
            case 'advanced':
                return <span className="badge badge-success">Advanced</span>;
            default:
                return <span className="badge badge-warning">Unknown</span>;
        }
    };

    const getCreditScoreColor = (score: number) => {
        if (score >= 0.8) return 'text-green-600';
        if (score >= 0.6) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <div className="space-y-6">
            {/* Search Header */}
            <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Find Users</h3>
                    <div className="text-sm text-gray-500">
                        {filteredUsers.length} of {users.length} users
                    </div>
                </div>

                {/* Search Input */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Search by name or email..."
                    />
                </div>

                {/* Advanced Filters */}
                {showFilters && (
                    <div className="mt-4">
                        <button
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        className="text-sm text-indigo-600 hover:text-indigo-500 font-medium flex items-center"
                        >
                            <svg className={`h-4 w-4 mr-1 transform transition-transform ${showAdvancedFilters ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            Advanced Filters
                        </button>

                        {showAdvancedFilters && (
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                                {/* Verification Status Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Verification Status
                                    </label>
                                    <select
                                    value={filters.isVerified === undefined ? '' : filters.isVerified.toString()}
                                    onChange={(e) => handleFilterChange('isVerified', e.target.value === '' ? undefined : e.target.value === 'true')}
                                    className="form-input"
                                    >
                                        <option value="">All Users</option>
                                        <option value="true">Verified Only</option>
                                        <option value="false">Unverified Only</option>
                                    </select>
                                </div>

                                {/* Verification Level Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Verification Level
                                    </label>
                                    <select
                                    value={filters.verificationLevel || ''}
                                    onChange={(e) => handleFilterChange('verificationLevel', e.target.value as VerificationLevel)}
                                    className="form-input"
                                    >
                                        <option value="">All Levels</option>
                                        <option value="basic">Basic</option>
                                        <option value="intermediate">Intermediate</option>
                                        <option value="advanced">Advanced</option>
                                    </select>
                                </div>

                                {/* Credit Score Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Minimum Credit Score
                                    </label>
                                    <select
                                    value={filters.minCreditScore || ''}
                                    onChange={(e) => handleFilterChange('minCreditScore', e.target.value ? parseFloat(e.target.value) : undefined)}
                                    className="form-input"
                                    >
                                        <option value="">Any Score</option>
                                        <option value="0.8">Excellent (0.8+)</option>
                                        <option value="0.6">Good (0.6+)</option>
                                        <option value="0.4">Fair (0.4+)</option>
                                        <option value="0.2">Poor (0.2+)</option>
                                    </select>
                                </div>

                                {/* Clear Filters Button */}
                                <div className="md:col-span-3 flex justify-end">
                                    <button
                                    onClick={clearFilters}
                                    className="text-sm text-gray-600 hover:text-gray-500 font-medium"
                                    >
                                        Clear All Filters
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Search Results */}
            <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h4 className="text-md font-medium text-gray-900">Search Results</h4>
                </div>

                <div className="divide-y divide-gray-200">
                    {isLoading ? (
                        <div className="p-6 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                            <p className="mt-2 text-sm text-gray-500">Loading users...</p>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="p-6 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-4h-2M4 9h2" />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Try adjusting your search terms or filters.
                            </p>
                        </div>
                    ) : (
                        filteredUsers.map((user) => (
                            <div
                            key={user.id.toString()}
                            className={`p-6 hover:bg-gray-50 transition-colors ${
                                onUserSelect ? 'cursor-pointer' : ''
                            }`}
                            onClick={() => onUserSelect?.(user)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        {/* User Avatar */}
                                        <div className="flex-shrink-0">
                                            <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center">
                                                <span className="text-sm font-medium text-white">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                        </div>

                                        {/* User Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {user.name}
                                                </p>
                                                {getVerificationBadge(user)}
                                            </div>
                                            <p className="text-sm text-gray-500 truncate">{user.email}</p>
                                            <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                                                <span>Phone: {user.phone}</span>
                                                <span>
                                                    Credit Score: 
                                                    <span className={`ml-1 font-medium ${getCreditScoreColor(user.creditScore)}`}>
                                                        {(user.creditScore * 100).toFixed(0)}%
                                                    </span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* User Stats */}
                                    <div className="flex-shrink-0 text-right">
                                        <div className="text-sm text-gray-900">
                                            {user.chamasJoined.length} Chama{user.chamasJoined.length !== 1 ? 's' : ''}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            KES {user.totalContributions.toLocaleString()} contributed
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Joined {new Date(Number(user.createdAt) / 1000000).toLocaleDateString()}
                                        </div>
                                    </div>

                                    {onUserSelect && (
                                        <div className="ml-4">
                                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                {/* User Additional Info */}
                                <div className="mt-3 flex items-center space-x-6 text-xs text-gray-500">
                                    <span className="flex items-center">
                                        <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                        </svg>
                                        Last active: {new Date(Number(user.updatedAt) / 1000000).toLocaleDateString()}
                                    </span>
                                    {user.totalWithdrawals > 0 && (
                                        <span className="flex items-center">
                                            <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                                            </svg>
                                            KES {user.totalWithdrawals.toLocaleString()} withdrawn
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Load More Button */}
                {filteredUsers.length === maxResults && users.length > maxResults && (
                    <div className="px-6 py-4 border-t border-gray-200 text-center">
                        <button
                        onClick={() => {/* Implement pagination */}}
                        className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                        >
                            Load more users
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserSearch;