// frontend/src/pages/ChamaDiscovery.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ChamaCard from '../components/ChamaCard';
import { chamaService } from '../services/chamaService';
import { Chama, ChamaFilter, ChamaType, ChamaStatus } from '../types/icp';

const ChamaDiscovery: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [chamas, setChamas] = useState<Chama[]>([]);
    const [filteredChamas, setFilteredChamas] = useState<Chama[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState<ChamaFilter>({});

    useEffect(() => {
        loadPublicChamas();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [chamas, searchQuery, filters]);

    const loadPublicChamas = async () => {
        try {
            setLoading(true);
            setError(null);
            const publicChamas = await chamaService.getPublicChamas();
            setChamas(publicChamas);
        } catch (err) {
            console.error('Failed to load public chamas:', err);
            setError('Failed to load available chamas. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...chamas];

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(chama => 
                chama.name.toLowerCase().includes(query) ||
                chama.description.toLowerCase().includes(query)
            );
        }

        // Type filter
        if (filters.chamaType) {
            filtered = filtered.filter(chama => chama.chamaType === filters.chamaType);
        }

        // Status filter
        if (filters.status) {
            filtered = filtered.filter(chama => chama.status === filters.status);
        }

        // Member count filters
        if (filters.minMembers) {
            filtered = filtered.filter(chama => chama.members.length >= filters.minMembers!);
        }
        if (filters.maxMembers) {
            filtered = filtered.filter(chama => chama.members.length <= filters.maxMembers!);
        }

        // Contribution range filter
        if (filters.contributionRange) {
            const [min, max] = filters.contributionRange;
            filtered = filtered.filter(chama => 
                chama.contributionAmount >= min && chama.contributionAmount <= max
            );
        }

        setFilteredChamas(filtered);
    };

    const handleJoinChama = async (chama: Chama) => {
        try {
            await chamaService.addMember(chama.id, user!.id);
            await loadPublicChamas(); // Refresh the list
            // Show success notification
        } catch (error) {
            console.error('Failed to join chama:', error);
            setError('Failed to join chama. Please try again.');
        }
    };

    const handleViewChama = (chama: Chama) => {
        navigate(`/chamas/${chama.id}`);
    };

    const clearFilters = () => {
        setFilters({});
        setSearchQuery('');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Discovering available chamas...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="bg-white shadow rounded-lg mb-8">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Discover Chamas</h1>
                                <p className="mt-1 text-sm text-gray-600">
                                    Find and join public savings groups that match your interests
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/chamas/create')}
                                className="btn btn-primary"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Create New Chama
                            </button>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="px-6 py-4 space-y-4">
                        {/* Search Bar */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Search chamas by name or description..."
                            />
                        </div>

                        {/* Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Chama Type Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select
                                    value={filters.chamaType || ''}
                                    onChange={(e) => setFilters({...filters, chamaType: e.target.value as ChamaType || undefined})}
                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">All Types</option>
                                    <option value="savings">Savings</option>
                                    <option value="investment">Investment</option>
                                    <option value="microCredit">Micro Credit</option>
                                    <option value="welfare">Welfare</option>
                                    <option value="business">Business</option>
                                </select>
                            </div>

                            {/* Status Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    value={filters.status || ''}
                                    onChange={(e) => setFilters({...filters, status: e.target.value as ChamaStatus || undefined})}
                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">All Status</option>
                                    <option value="forming">Forming</option>
                                    <option value="active">Active</option>
                                </select>
                            </div>

                            {/* Member Count Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Members</label>
                                <select
                                    value={filters.minMembers || ''}
                                    onChange={(e) => {
                                        const value = e.target.value ? parseInt(e.target.value) : undefined;
                                        setFilters({...filters, minMembers: value});
                                    }}
                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">Any Size</option>
                                    <option value="5">5+ Members</option>
                                    <option value="10">10+ Members</option>
                                    <option value="20">20+ Members</option>
                                </select>
                            </div>

                            {/* Contribution Range Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contribution</label>
                                <select
                                    value={filters.contributionRange ? `${filters.contributionRange[0]}-${filters.contributionRange[1]}` : ''}
                                    onChange={(e) => {
                                        if (!e.target.value) {
                                            setFilters({...filters, contributionRange: undefined});
                                        } else {
                                            const [min, max] = e.target.value.split('-').map(Number);
                                            setFilters({...filters, contributionRange: [min, max]});
                                        }
                                    }}
                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">Any Amount</option>
                                    <option value="100-1000">KES 100 - 1,000</option>
                                    <option value="1000-5000">KES 1,000 - 5,000</option>
                                    <option value="5000-10000">KES 5,000 - 10,000</option>
                                    <option value="10000-50000">KES 10,000+</option>
                                </select>
                            </div>
                        </div>

                        {/* Active Filters & Clear */}
                        {(Object.keys(filters).length > 0 || searchQuery) && (
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500">Active filters:</span>
                                {searchQuery && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                        Search: "{searchQuery}"
                                    </span>
                                )}
                                {filters.chamaType && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                        Type: {filters.chamaType}
                                    </span>
                                )}
                                {filters.status && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                        Status: {filters.status}
                                    </span>
                                )}
                                <button
                                    onClick={clearFilters}
                                    className="text-sm text-indigo-600 hover:text-indigo-500"
                                >
                                    Clear all
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 alert alert-error">
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

                {/* Results Summary */}
                <div className="mb-6">
                    <p className="text-sm text-gray-600">
                        Showing {filteredChamas.length} of {chamas.length} available chamas
                    </p>
                </div>

                {/* Chama Grid */}
                {filteredChamas.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredChamas.map((chama) => (
                            <ChamaCard
                                key={chama.id}
                                chama={chama}
                                currentUserId={user?.id}
                                onJoin={handleJoinChama}
                                onView={handleViewChama}
                                showJoinButton={true}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No chamas found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {searchQuery || Object.keys(filters).length > 0 
                                ? 'Try adjusting your search criteria or filters.'
                                : 'No public chamas are available at the moment.'
                            }
                        </p>
                        <div className="mt-6 flex justify-center space-x-3">
                            {(searchQuery || Object.keys(filters).length > 0) && (
                                <button
                                    onClick={clearFilters}
                                    className="btn btn-secondary"
                                >
                                    Clear Filters
                                </button>
                            )}
                            <button
                                onClick={() => navigate('/chamas/create')}
                                className="btn btn-primary"
                            >
                                Create New Chama
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChamaDiscovery;