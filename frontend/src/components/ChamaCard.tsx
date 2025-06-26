// Chama Card Component
import React from 'react';
import { Chama, ChamaType, ChamaStatus } from '../types/icp';

interface ChamaCardProps {
    chama: Chama;
    currentUserId?: string;
    onJoin?: (chama: Chama) => void;
    onView?: (chama: Chama) => void;
    onEdit?: (chama: Chama) => void;
    isOwner?: boolean;
    isMember?: boolean;
    showJoinButton?: boolean;
    showActions?: boolean;
}

const ChamaCard: React.FC<ChamaCardProps> = ({
    chama,
    currentUserId,
    onJoin,
    onView,
    onEdit,
    // isOwner = false,
    // isMember = false,
    showActions = true,
    showJoinButton = false
}) => {
    const isMember = chama && currentUserId && chama.members.some(member => 
        member.userId.toString() === currentUserId
    );

     const isOwner = currentUserId && chama.creator.toString() === currentUserId;

    const getChamaTypeColor = (type: ChamaType) => {
        const colors = {
            savings: 'bg-blue-100 text-blue-800',
            investment: 'bg-green-100 text-green-800',
            microCredit: 'bg-purple-100 text-purple-800',
            welfare: 'bg-yellow-100 text-yellow-800',
            business: 'bg-red-100 text-red-800',
        };
        return colors[type] || 'bg-gray-100 text-gray-800';
    };

    const getChamaStatusColor = (status: ChamaStatus) => {
        const colors = {
            forming: 'bg-yellow-100 text-yellow-800',
            active: 'bg-green-100 text-green-800',
            suspended: 'bg-red-100 text-red-800',
            dissolved: 'bg-gray-100 text-gray-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getChamaTypeIcon = (type: ChamaType) => {
        const icons = {
            savings: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            investment: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
            ),
            microCredit: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
            ),
            welfare: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
            ),
            business: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            ),
        };
        return icons[type];
    };    

    const formatCurrency = (amount: bigint | number): string => {
        const numAmount = typeof amount === 'bigint' ? Number(amount) : amount;
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 0,
        }).format(numAmount);
    };

    const getContributionFrequencyText = (frequency: string) => {
        const frequencyMap = {
            daily: 'Daily',
            weekly: 'Weekly',
            biweekly: 'Bi-weekly',
            monthly: 'Monthly',
            quarterly: 'Quarterly',
        };
        return frequencyMap[frequency as keyof typeof frequencyMap] || frequency;
    };

    const membershipProgress = (chama.members.length / Number(chama.maxMembers)) * 100;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
            {/* Card Header */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getChamaTypeColor(chama.chamaType)}`}>
                                {getChamaTypeIcon(chama.chamaType)}
                                <span className="ml-1 capitalize">{chama.chamaType}</span>
                            </div>
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getChamaStatusColor(chama.status)}`}>
                                <span className="capitalize">{chama.status}</span>
                            </div>
                            {!chama.settings.isPublic && (
                                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    Private
                                </div>
                            )}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{chama.name}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{chama.description}</p>
                    </div>
                </div>
            </div>

            {/* Card Body */}
            <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <div className="text-sm font-medium text-gray-500">Contribution</div>
                        <div className="text-lg font-semibold text-gray-900">
                            {formatCurrency(chama.contributionAmount)}
                        </div>
                        <div className="text-xs text-gray-500">
                            {getContributionFrequencyText(chama.contributionFrequency)}
                        </div>
                    </div>
                    <div>
                        <div className="text-sm font-medium text-gray-500">Treasury</div>
                        <div className="text-lg font-semibold text-green-600">
                            {formatCurrency(chama.treasury.totalFunds)}
                        </div>
                        <div className="text-xs text-gray-500">
                            Total funds
                        </div>
                    </div>
                </div>

                {/* Membership Progress */}
                <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">Members</span>
                        <span className="text-gray-500">
                            {chama.members.length} / {Number(chama.maxMembers)}
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(membershipProgress, 100)}%` }}
                        ></div>
                    </div>
                </div>

                {/* Member Avatars */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex -space-x-2">
                        {chama.members.slice(0, 5).map((member, index) => (
                            <div
                                key={member.userId.toString()}
                                className="inline-block h-8 w-8 rounded-full bg-indigo-500 text-white text-xs font-medium flex items-center justify-center border-2 border-white"
                                title={`Member ${index + 1}`}
                            >
                                {index + 1}
                            </div>
                        ))}
                        {chama.members.length > 5 && (
                            <div className="inline-block h-8 w-8 rounded-full bg-gray-500 text-white text-xs font-medium flex items-center justify-center border-2 border-white">
                                +{chama.members.length - 5}
                            </div>
                        )}
                    </div>
            
                    <div className="text-xs text-gray-500">
                        Created {new Date(Number(chama.createdAt) / 1000000).toLocaleDateString()}
                    </div>
                </div>

                {/* Features */}
                <div className="flex items-center space-x-4 text-xs text-gray-500 mb-4">
                    {chama.settings.enableAIRecommendations && (
                        <div className="flex items-center">
                            <svg className="w-3 h-3 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            AI Insights
                        </div>
                    )}
                    {chama.settings.allowExternalLoans && (
                        <div className="flex items-center">
                            <svg className="w-3 h-3 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                            Loans Available
                        </div>
                    )}
                    {chama.settings.requireApprovalForJoining && (
                        <div className="flex items-center">
                            <svg className="w-3 h-3 mr-1 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Approval Required
                        </div>
                    )}
                </div>
            </div>

            {/* Card Actions */}
            {showActions && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
                    <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                            {isMember ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Member
                                </span>
                            ) : (
                                <>
                                    {chama.status === 'active' && chama.members.length < Number(chama.maxMembers) && onJoin && (
                                        <button
                                            onClick={() => onJoin(chama)}
                                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        >
                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                            Join
                                        </button>
                                    )}
                                    {chama.status === 'forming' && (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Forming
                                        </span>
                                    )}
                                    {chama.members.length >= Number(chama.maxMembers) && (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            Full
                                        </span>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="flex space-x-2">
                            {onView && (
                                <button
                                    onClick={() => onView(chama)}
                                    className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                                >
                                    View Details
                                </button>
                            )}
                            {isOwner && onEdit && (
                                <button
                                    onClick={() => onEdit(chama)}
                                    className="text-gray-600 hover:text-gray-500 text-sm font-medium"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChamaCard;