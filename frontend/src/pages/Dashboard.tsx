// Main Dashboard Page
import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import UserProfile from '../components/UserProfile';
import { authService } from '../services/auth';

interface DashboardStats {
    totalChamas: number;
    totalSavings: number;
    totalTransactions: number;
    monthlyContributions: number;
}

const Dashboard: React.FC = () => {
    const { user, isAuthenticated } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        totalChamas: 0,
        totalSavings: 0,
        totalTransactions: 0,
        monthlyContributions: 0,
    });
    const [isLoadingStats, setIsLoadingStats] = useState(true);

    useEffect(() => {
        if (isAuthenticated) {
            loadDashboardStats();
        }
    }, [isAuthenticated]);

    const loadDashboardStats = async () => {
        try {
            setIsLoadingStats(true);
            // TODO: Implement actual stats loading from backend
            // For now, using mock data
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
            setStats({
                totalChamas: 3,
                totalSavings: 125000,
                totalTransactions: 24,
                monthlyContributions: 15000,
            });
        } catch (error) {
            console.error('Failed to load dashboard stats:', error);
        } finally {
            setIsLoadingStats(false);
        }
    };

    const StatCard: React.FC<{
        title: string;
        value: string;
        change?: string;
        changeType?: 'increase' | 'decrease';
        icon: React.ReactNode;
    }> = ({ title, value, change, changeType, icon }) => (
        <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <div className="h-8 w-8 text-indigo-600">
                            {icon}
                        </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                        <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
                            <dd className="text-lg font-medium text-gray-900">{value}</dd>
                        </dl>
                    </div>
                </div>
                {change && (
                    <div className="mt-4">
                        <div className="flex items-center text-sm">
                            <span className={`text-sm font-medium ${
                                changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                            }`}>
                                {changeType === 'increase' ? '+' : '-'}{change}
                            </span>
                            <span className="text-gray-500 ml-2">from last month</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    const QuickAction: React.FC<{
        title: string;
        description: string;
        icon: React.ReactNode;
        onClick: () => void;
        variant?: 'primary' | 'secondary';
    }> = ({ title, description, icon, onClick, variant = 'primary' }) => (
        <button
        onClick={onClick}
        className={`p-6 text-left rounded-lg border-2 border-dashed transition-colors duration-200 ${
            variant === 'primary'
            ? 'border-indigo-300 hover:border-indigo-400 hover:bg-indigo-50'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }`}
        >
            <div className="flex items-center">
                <div className={`h-8 w-8 ${variant === 'primary' ? 'text-indigo-600' : 'text-gray-600'}`}>
                    {icon}
                </div>
                <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{title}</h3>
                    <p className="text-sm text-gray-500">{description}</p>
                </div>
            </div>
        </button>
    );

    if (!isAuthenticated) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Please log in to view your dashboard.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Welcome back, {user?.name || 'User'}!
                        </h1>
                        <p className="text-gray-600">
                            Here's what's happening with your chamas today.
                        </p>    
                    </div>    
                    <div className="hidden md:block">
                        <div className="flex items-center space-x-2">
                            <div className={`h-3 w-3 rounded-full ${user?.isVerified ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                            <span className="text-sm text-gray-500">
                                {user?.isVerified ? 'Verified Account' : 'Pending Verification'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Overview</h2>
                {isLoadingStats ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-white shadow rounded-lg p-5">
                                <div className="animate-pulse">
                                    <div className="flex items-center">
                                        <div className="h-8 w-8 bg-gray-200 rounded"></div>
                                        <div className="ml-5 flex-1">
                                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                        title="Total Chamas"
                        value={stats.totalChamas.toString()}
                        change="2"
                        changeType="increase"
                        icon={
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>  
                        }
                        />
                        <StatCard
                        title="Total Savings"
                        value={`KES ${stats.totalSavings.toLocaleString()}`}
                        change="8,240"
                        changeType="increase"
                        icon={
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>  
                        }
                        />
                        <StatCard
                        title="Transactions"
                        value={stats.totalTransactions.toString()}
                        change="4"
                        changeType="increase"
                        icon={
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        }
                        />
                        <StatCard
                        title="Monthly Contributions"
                        value={`KES ${stats.monthlyContributions.toLocaleString()}`}
                        change="1,200"
                        changeType="increase"
                        icon={
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        }
                        />
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <QuickAction
                        title="Manage Profile"
                        description="Update your profile and settings"
                        icon={
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        }
                        onClick={() => window.location.href = '/users'}
                        variant="primary"
                    />
                    <QuickAction
                        title="Make Contribution"
                        description="Add money to your chama savings"
                        icon={
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        }
                        onClick={() => alert('Contribution feature coming soon!')}
                        variant="primary"
                    />
                    <QuickAction
                    title="Create New Chama"
                    description="Start a new savings group"
                    icon={
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    }
                    onClick={() => alert('Create chama feature coming soon!')}
                    variant="secondary"
                    />
                    <QuickAction
                    title="AI Insights"
                    description="Get personalized financial advice"
                    icon={
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    }
                    onClick={() => alert('AI insights feature coming soon!')}
                    variant="secondary"
                    />
                </div>
            </div>

            {/* Recent Activity & Profile */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
                </div>
                <div className="p-6">
                    <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">Contribution made to Tech Savers</p>
                                <p className="text-sm text-gray-500">KES 5,000 • 2 hours ago</p>
                            </div>    
                        </div>
                
                        <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM9 20a.75.75 0 001.5 0v-1.25a.75.75 0 00-.75-.75h-2a.75.75 0 00-.75.75V20z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">New member joined Family Chama</p>
                                <p className="text-sm text-gray-500">Sarah Wanjiku • 1 day ago</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                                <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                    <svg className="h-4 w-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900">Loan payment due soon</p>
                                    <p className="text-sm text-gray-500">KES 2,500 • Due in 3 days</p>
                                </div>
                            </div>
                        </div>
                
                        <div className="mt-6">
                            <button className="text-sm text-indigo-600 hover:text-indigo-500 font-medium">
                                View all activity →
                            </button>
                        </div>
                    </div>
                </div>

                {/* User Profile Card */}
                <div>
                    <UserProfile />
                </div>
            </div>

            {/* AI Recommendations */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg">
                <div className="px-6 py-8">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                        </div>
                        <div className="ml-4">
                            <h3 className="text-lg font-medium text-white">AI-Powered Recommendations</h3>
                            <p className="text-indigo-100">
                                Based on your savings pattern, we recommend increasing your monthly contribution by 15% 
                                to reach your goals 3 months earlier.
                            </p>
                            <div className="mt-4">
                                <button className="bg-white text-indigo-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors">
                                    Learn More
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;