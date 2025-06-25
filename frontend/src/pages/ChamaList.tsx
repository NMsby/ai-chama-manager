// frontend/src/pages/ChamaList.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import ChamaCard from '../components/ChamaCard';
import { chamaService } from '../services/chamaService';
import { Chama, ChamaFilter } from '../types/icp';

const ChamaList: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [myChamas, setMyChamas] = useState<Chama[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'my-chamas' | 'created' | 'member'>('my-chamas');

    useEffect(() => {
        if (user) {
            loadMyChamas();
        }
    }, [user, activeTab]);

    const loadMyChamas = async () => {
        try {
            setLoading(true);
            setError(null);
            
            let chamas: Chama[] = [];
            
            switch (activeTab) {
                case 'my-chamas':
                    chamas = await chamaService.getMyChamas();
                    break;
                case 'created':
                    chamas = await chamaService.getChamasByCreator(user!.id);
                    break;
                case 'member':
                    const allMyChamas = await chamaService.getMyChamas();
                    chamas = allMyChamas.filter(chama => chama.creator !== user!.id);
                    break;
            }
            
            setMyChamas(chamas);
        } catch (err) {
            console.error('Failed to load chamas:', err);
            setError('Failed to load your chamas. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinChama = async (chama: Chama) => {
        try {
            await chamaService.addMember(chama.id, user!.id);
            await loadMyChamas(); // Refresh the list
            // Show success notification
        } catch (error) {
            console.error('Failed to join chama:', error);
            setError('Failed to join chama. Please try again.');
        }
    };

    const handleViewChama = (chama: Chama) => {
        navigate(`/chamas/${chama.id}`);
    };

    const handleEditChama = (chama: Chama) => {
        navigate(`/chamas/${chama.id}/edit`);
    };

    const getTabCount = (tab: string) => {
        switch (tab) {
            case 'my-chamas':
                return myChamas.length;
            case 'created':
                return myChamas.filter(chama => chama.creator === user?.id).length;
            case 'member':
                return myChamas.filter(chama => chama.creator !== user?.id).length;
            default:
                return 0;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading your chamas...</p>
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
                                <h1 className="text-2xl font-bold text-gray-900">My Chamas</h1>
                                <p className="mt-1 text-sm text-gray-600">
                                    Manage your savings groups and track your progress
                                </p>
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => navigate('/chamas/discover')}
                                    className="btn btn-secondary"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    Browse Chamas
                                </button>
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
                    </div>

                    {/* Tabs */}
                    <div className="px-6">
                        <nav className="flex space-x-8" aria-label="Tabs">
                            {[
                                { id: 'my-chamas', name: 'All My Chamas', count: getTabCount('my-chamas') },
                                { id: 'created', name: 'Created by Me', count: getTabCount('created') },
                                { id: 'member', name: 'Member Of', count: getTabCount('member') },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`${
                                        activeTab === tab.id
                                            ? 'border-indigo-500 text-indigo-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                                >
                                    {tab.name}
                                    {tab.count > 0 && (
                                        <span className={`${
                                            activeTab === tab.id ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-900'
                                        } ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium`}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </nav>
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
                            <div className="ml-auto pl-3">
                                <button
                                    onClick={() => setError(null)}
                                    className="text-red-400 hover:text-red-600"
                                >
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Chama Grid */}
                {myChamas.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {myChamas.map((chama) => (
                            <ChamaCard
                                key={chama.id}
                                chama={chama}
                                currentUserId={user?.id}
                                onJoin={handleJoinChama}
                                onView={handleViewChama}
                                onEdit={handleEditChama}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">
                            {activeTab === 'my-chamas' && 'No chamas yet'}
                            {activeTab === 'created' && 'No chamas created'}
                            {activeTab === 'member' && 'Not a member of any chamas'}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {activeTab === 'created' 
                                ? 'Get started by creating your first chama.'
                                : 'Discover and join existing chamas or create your own.'
                            }
                        </p>
                        <div className="mt-6 flex justify-center space-x-3">
                            <button
                                onClick={() => navigate('/chamas/create')}
                                className="btn btn-primary"
                            >
                                Create New Chama
                            </button>
                            <button
                                onClick={() => navigate('/chamas/discover')}
                                className="btn btn-secondary"
                            >
                                Browse Chamas
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChamaList;