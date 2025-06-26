// frontend/src/pages/ChamaDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import MemberManagement from '../components/MemberManagement';
import BalanceDisplay from '../components/BalanceDisplay';
import TransactionList from '../components/TransactionList';
import { chamaService } from '../services/chamaService';
import { financialService } from '../services/financialService';
import { Chama, ChamaStatus, ChamaType, Transaction } from '../types/icp';
import {
    getChamaTypeText,
    getChamaStatusText,
    getContributionFrequencyText
} from '../utils/variantUtils';

const ChamaDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [chama, setChama] = useState<Chama | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'transactions' | 'settings'>('overview');

    useEffect(() => {
        if (id) {
            loadChamaDetails();
        }
    }, [id]);

    const loadChamaDetails = async () => {
        try {
            setLoading(true);
            setError(null);
            
            if (!id) {
                throw new Error('Chama ID not provided');
            }

            const [chamaData, transactionData] = await Promise.all([
                chamaService.getChama(id),
                financialService.getTransactionsByChama(id)
            ]);

            if (!chamaData) {
                throw new Error('Chama not found');
            }

            setChama(chamaData);
            setTransactions(transactionData);
        } catch (err) {
            console.error('Failed to load chama details:', err);
            setError(err instanceof Error ? err.message : 'Failed to load chama details');
        } finally {
            setLoading(false);
        }
    };

    // Convert variants at the top level
    const chamaStatusText = chama ? getChamaStatusText(chama.status) : 'forming';
    const chamaTypeText = chama ? getChamaTypeText(chama.chamaType) : 'savings';

    const isOwner = chama && user && chama.creator === user.id;
    
    const isAdmin = chama && user && (
        chama.creator.toString() === user.id.toString() || 
        (chama.admins && chama.admins.some((admin: any) => admin.toString() === user.id.toString()))
    );

    const isMember = chama && user && chama.members.some(member => 
        member.userId.toString() === user.id.toString()
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading chama details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !chama) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading chama</h3>
                        <p className="mt-1 text-sm text-gray-500">{error}</p>
                        <div className="mt-6">
                            <button
                                onClick={() => navigate('/chamas')}
                                className="btn btn-primary"
                            >
                                Back to My Chamas
                            </button>
                        </div>
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
                        <div className="flex justify-between items-start">
                            <div className="flex items-center">
                                <button
                                    onClick={() => navigate('/chamas')}
                                    className="mr-4 p-2 rounded-md text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">{chama.name}</h1>
                                    <p className="mt-1 text-sm text-gray-600">{chama.description}</p>
                                    <div className="mt-2 flex items-center space-x-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            chamaStatusText === 'active' ? 'bg-green-100 text-green-800' :
                                            chamaStatusText === 'forming' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {chamaStatusText}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            {chama.members.length} / {Number (chama.maxMembers)} members
                                        </span>
                                        {isOwner && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                                Owner
                                            </span>
                                        )}
                                        {isAdmin && !isOwner && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                Admin
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {(isOwner || isAdmin) && (
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => navigate(`/chamas/${chama.id}/edit`)}
                                        className="btn btn-secondary"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Edit Chama
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="px-6">
                        <nav className="flex space-x-8" aria-label="Tabs">
                            {[
                                { id: 'overview', name: 'Overview', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z' },
                                { id: 'members', name: 'Members', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
                                { id: 'transactions', name: 'Transactions', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
                                ...(isOwner || isAdmin ? [{ id: 'settings', name: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }] : [])
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`${
                                        activeTab === tab.id
                                            ? 'border-indigo-500 text-indigo-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    } group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm`}
                                >
                                    <svg className={`${
                                        activeTab === tab.id ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'
                                    } -ml-0.5 mr-2 h-5 w-5`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                                    </svg>
                                    <span>{tab.name}</span>
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="space-y-6">
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <BalanceDisplay chama={chama} />
                            <div className="bg-white shadow rounded-lg p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                                <TransactionList 
                                    transactions={transactions.slice(0, 5)} 
                                    showPagination={false}
                                />
                                {transactions.length > 5 && (
                                    <div className="mt-4 text-center">
                                        <button
                                            onClick={() => setActiveTab('transactions')}
                                            className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                                        >
                                            View all transactions →
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'members' && (
                        <MemberManagement 
                            chama={chama} 
                            onMemberUpdate={loadChamaDetails}
                        />
                    )}

                    {activeTab === 'transactions' && (
                        <div className="bg-white shadow rounded-lg">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-medium text-gray-900">All Transactions</h3>
                            </div>
                            <TransactionList transactions={transactions} />
                        </div>
                    )}

                    {activeTab === 'settings' && (isOwner || isAdmin) && (
                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Chama Settings</h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Chama Type</dt>
                                        <dd className="mt-1 text-sm text-gray-900 capitalize">{chamaTypeText}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Contribution Frequency</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{getContributionFrequencyText(chama.contributionFrequency)}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Status</dt>
                                        <dd className="mt-1 text-sm text-gray-900 capitalize">{chamaStatusText}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Visibility</dt>
                                        <dd className="mt-1 text-sm text-gray-900">{chama.settings.isPublic ? 'Public' : 'Private'}</dd>
                                    </div>
                                </div>
                                <p className="text-gray-600">Advanced settings management coming soon...</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChamaDetail;