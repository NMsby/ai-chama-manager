// Transaction List Component
import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, TransactionStatus, ChamaId, UserId } from '../types/icp';
import { financialService } from '../services/financialService';

interface TransactionListProps {
    chamaId?: ChamaId;
    userId?: UserId;
    limit?: number;
    showFilters?: boolean;
    title?: string;
    transactions?: Transaction[];
    showPagination?: boolean;
    refreshTrigger?: number;
}

const TransactionList: React.FC<TransactionListProps> = ({
    chamaId,
    userId,
    limit = 20,
    showFilters = true,
    title = 'Recent Transactions',
    refreshTrigger = 0,
}) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState({
        type: '' as TransactionType | '',
        status: '' as TransactionStatus | '',
        searchTerm: '',
    });

    useEffect(() => {
        loadTransactions();
    }, [chamaId, userId, limit, refreshTrigger]);

    useEffect(() => {
        applyFilters();
    }, [transactions, filters]);

    const loadTransactions = async () => {
        try {
            setLoading(true);
            setError(null);

            let data: Transaction[] = [];

            if (chamaId) {
                data = await financialService.getTransactionsByChama(chamaId, limit);
            } else if (userId) {
                data = await financialService.getTransactionsByUser(userId, limit);
            } else {
                data = await financialService.getMyTransactions(limit);
            }

            setTransactions(data);
        } catch (error) {
            console.error('Failed to load transactions:', error);
            setError('Failed to load transactions');
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = transactions;

        // Filter by type
        if (filters.type) {
            filtered = filtered.filter(tx => tx.transactionType === filters.type);
        }

        // Filter by status
        if (filters.status) {
            filtered = filtered.filter(tx => tx.status === filters.status);
        }

        // Filter by search term
        if (filters.searchTerm) {
            const searchLower = filters.searchTerm.toLowerCase();
            filtered = filtered.filter(tx =>
                tx.description.toLowerCase().includes(searchLower) ||
                tx.id.toLowerCase().includes(searchLower)
            );
        }

        setFilteredTransactions(filtered);
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({
            ...prev,
            [key]: value,
        }));
    };

    const getTransactionTypeIcon = (type: TransactionType) => {
        const icons = {
            contribution: (
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
            ),
            withdrawal: (
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
            ),
            loan: (
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
            ),
            repayment: (
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            ),
            penalty: (
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
            ),
            dividend: (
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
            ),
            expense: (
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            refund: (
                <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
            ),
        };
        return icons[type] || icons.contribution;
    };

    const getStatusBadge = (status: TransactionStatus) => {
        const badges = {
            pending: 'bg-yellow-100 text-yellow-800',
            completed: 'bg-green-100 text-green-800',
            failed: 'bg-red-100 text-red-800',
            cancelled: 'bg-gray-100 text-gray-800',
            disputed: 'bg-red-100 text-red-800',
        };

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const formatCurrency = (amount: bigint) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 0,
        }).format(Number(amount));
    };

    const formatDate = (timestamp: bigint) => {
        return new Date(Number(timestamp) / 1000000).toLocaleString('en-KE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="bg-white shadow rounded-lg p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-4">
                            <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                            <div className="h-4 bg-gray-200 rounded w-20"></div>
                        </div>
                    ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white shadow rounded-lg p-6">
                <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Error Loading Transactions</h3>
                    <p className="mt-1 text-sm text-gray-500">{error}</p>
                    <button
                        onClick={loadTransactions}
                        className="mt-3 btn-primary text-sm"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white shadow rounded-lg">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">{title}</h3>
                    <div className="text-sm text-gray-500">
                        {filteredTransactions.length} of {transactions.length} transactions
                    </div>
                </div>

                {/* Filters */}
                {showFilters && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <input
                                type="text"
                                placeholder="Search transactions..."
                                value={filters.searchTerm}
                                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                                className="form-input text-sm"
                            />
                        </div>
                        <div>
                            <select
                                value={filters.type}
                                onChange={(e) => handleFilterChange('type', e.target.value)}
                                className="form-input text-sm"
                            >
                                <option value="">All Types</option>
                                <option value="contribution">Contributions</option>
                                <option value="withdrawal">Withdrawals</option>
                                <option value="loan">Loans</option>
                                <option value="repayment">Repayments</option>
                                <option value="penalty">Penalties</option>
                                <option value="dividend">Dividends</option>
                                <option value="expense">Expenses</option>
                                <option value="refund">Refunds</option>
                            </select>
                        </div>
                        <div>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="form-input text-sm"
                            >
                                <option value="">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                                <option value="failed">Failed</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="disputed">Disputed</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Transaction List */}
            <div className="divide-y divide-gray-200">
                {filteredTransactions.length === 0 ? (
                    <div className="p-6 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m0 0h2m-2 0v4l2-1.5L11 16v-4m6-2a2 2 0 002-2V7a2 2 0 00-2-2h-2m0 0V3l-2 1.5L13 3v2h2z" />
                        </svg>
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {transactions.length === 0 
                            ? 'No transactions have been recorded yet.'
                            : 'No transactions match your current filters.'
                            }
                        </p>
                    </div>
                ) : (
                    filteredTransactions.map((transaction) => (
                        <div key={transaction.id} className="p-6 hover:bg-gray-50">
                            <div className="flex items-center space-x-4">
                                {/* Transaction Icon */}
                                <div className="flex-shrink-0">
                                    <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                                        {getTransactionTypeIcon(transaction.transactionType)}
                                    </div>
                                </div>

                                {/* Transaction Details */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <p className="text-sm font-medium text-gray-900 capitalize">
                                                {transaction.transactionType.replace(/([A-Z])/g, ' $1').trim()}
                                            </p>
                                            {getStatusBadge(transaction.status)}
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-lg font-semibold ${
                                                ['contribution', 'repayment', 'dividend', 'refund'].includes(transaction.transactionType)
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                            }`}>
                                                {['contribution', 'repayment', 'dividend', 'refund'].includes(transaction.transactionType) ? '+' : '-'}
                                                {formatCurrency(transaction.amount)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-1">
                                        <p className="text-sm text-gray-600 truncate">
                                            {transaction.description}
                                        </p>
                                        <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                                            <span>ID: {transaction.id.substring(0, 8)}...</span>
                                            <span>{formatDate(transaction.timestamp)}</span>
                                            {transaction.metadata.reference && (
                                                <span>Ref: {transaction.metadata.reference}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Button */}
                                <div className="flex-shrink-0">
                                    <button className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">
                                        View Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Load More */}
            {transactions.length >= limit && (
                <div className="px-6 py-4 border-t border-gray-200 text-center">
                    <button
                        onClick={() => {/* Implement pagination */}}
                        className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                    >
                        Load more transactions
                    </button>
                </div>
            )}
        </div>
    );
};

export default TransactionList;