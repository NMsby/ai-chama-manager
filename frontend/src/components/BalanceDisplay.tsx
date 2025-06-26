// Balance Display Component
import React, { useState, useEffect } from 'react';
import { Chama, ChamaId, UserId } from '../types/icp';
import { financialService } from '../services/financialService';
import { useAuth } from '../hooks/useAuth';
import { getContributionFrequencyText, formatCurrency } from '../utils/variantUtils';

interface BalanceDisplayProps {
  chama: Chama;
  userId?: UserId;
  showDetails?: boolean;
  refreshTrigger?: number;
}

const BalanceDisplay: React.FC<BalanceDisplayProps> = ({
  chama,
  userId,
  showDetails = true,
  refreshTrigger = 0,
}) => {
  const { user } = useAuth();
  const [balance, setBalance] = useState({ contributions: 0, withdrawals: 0 });
  const [treasuryBalance, setTreasuryBalance] = useState(0);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalContributions: 0,
    totalWithdrawals: 0,
    totalLoans: 0,
    averageTransaction: 0,
    lastTransactionTime: undefined as Date | undefined,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const frequencyText = getContributionFrequencyText(chama.contributionFrequency);

  useEffect(() => {
    loadBalanceData();
  }, [chama.id, userId, refreshTrigger]);

  const loadBalanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      let userBalance = { contributions: 0, withdrawals: 0 };
      let myBalance = { contributions: 0, withdrawals: 0 };
      let treasury = 0;

      try {
        // Load user balance
        if (userId) {
          const userBalance = await financialService.getUserBalance(chama.id, userId);
          setBalance(userBalance);
        } else if (user) {
          const myBalance = await financialService.getMyBalance(chama.id);
          setBalance(myBalance);
        } 
      } catch (err) {
        console.warn('Failed to load user balance:', err);
        // Use default balance values
      }

      try {
        // Load treasury balance (always visible)
        const treasury = await financialService.getChamaTreasuryBalance(chama.id);
        setTreasuryBalance(treasury);
      } catch (err) {
        console.warn('Failed to load treasury balance:', err);
        // Use treasury from chama object as fallba ck
        treasury = Number(chama.treasury.totalFunds);
        setTreasuryBalance(treasury);
      }

      // Load statistics if details are requested
      if (showDetails) {
        const chamaStats = await financialService.getChamaTransactionStats(chama.id);
        setStats({
          totalTransactions: Number(chamaStats.totalTransactions),
          totalContributions: Number(chamaStats.totalContributions),
          totalWithdrawals: Number(chamaStats.totalWithdrawals),
          totalLoans: Number(chamaStats.totalLoans),
          averageTransaction: Number(chamaStats.averageTransaction),
          lastTransactionTime: chamaStats.lastTransactionTime
            ? new Date(Number(chamaStats.lastTransactionTime) / 1000000)
            : undefined,
        });
      }
    } catch (error) {
      console.error('Failed to load balance data:', error);
      setError('Failed to load balance information');
    } finally {
      setLoading(false);
    }
  };

  const getNetBalance = () => balance.contributions - balance.withdrawals;

  const getContributionCycles = () => {
    const contributionAmount = Number(chama.contributionAmount);
    if (contributionAmount === 0) return 0;
    return Math.floor(balance.contributions / contributionAmount);
  };

  const getContributionProgress = () => {
    const constributionAmount = Number(chama.contributionAmount);
    if (constributionAmount === 0) return 0;
    return Math.min((balance.contributions % constributionAmount) / constributionAmount * 100, 100);
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow p-6 text-white">
        <div className="animate-pulse">
          <div className="h-4 bg-white bg-opacity-30 rounded w-1/3 mb-2"></div>
          <div className="h-8 bg-white bg-opacity-30 rounded w-1/2 mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-white bg-opacity-20 rounded"></div>
            <div className="h-4 bg-white bg-opacity-20 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <svg className="h-5 w-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-red-800">Error loading balance</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main User Balance Card */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium opacity-90">
              {userId ? 'Member Balance' : 'Your Balance'}
            </h3>
            <p className="text-sm opacity-75">{chama.name}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              {formatCurrency(getNetBalance())}
            </div>
            <div className="text-sm opacity-75">Net Balance</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <div className="text-2xl font-bold">{formatCurrency(balance.contributions)}</div>
            <div className="text-sm opacity-75">Total Contributions</div>
            {!userId && (
              <div className="mt-1 text-xs opacity-60">
                {getContributionCycles()} cycles completed
              </div>
            )}
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-4">
            <div className="text-2xl font-bold">{formatCurrency(balance.withdrawals)}</div>
            <div className="text-sm opacity-75">Total Withdrawals</div>
          </div>
        </div>

        {/* Contribution Progress (for current user only) */}
        {!userId && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span>Current Cycle Progress</span>
              <span>{getContributionProgress().toFixed(0)}%</span>
            </div>
            <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{ width: `${getContributionProgress()}%` }}
              ></div>
            </div>
            <div className="mt-1 text-xs opacity-60">
              Next target: {formatCurrency(Number(chama.contributionAmount) * (getContributionCycles() + 1))}
            </div>
          </div>
        )}
      </div>

      {/* Treasury Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-medium text-gray-900">Group Treasury</h4>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(treasuryBalance)}
            </div>
            <div className="text-sm text-gray-500">Available Funds</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-lg font-semibold text-gray-900">
              {chama.members.length}
            </div>
            <div className="text-sm text-gray-500">Active Members</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-lg font-semibold text-gray-900">
              {formatCurrency(Number(chama.contributionAmount))}
            </div>
            <div className="text-sm text-gray-500">Regular Amount</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-lg font-semibold text-gray-900">
              {frequencyText}
            </div>
            <div className="text-sm text-gray-500">Frequency</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-lg font-semibold text-gray-900">
              {chama.treasury.availableFunds ? 
                formatCurrency(Number(chama.treasury.availableFunds)) : 
                formatCurrency(0)}
            </div>
            <div className="text-sm text-gray-500">Available</div>
          </div>
        </div>

        {/* Treasury Fund Breakdown */}
        {showDetails && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-sm font-medium text-blue-900">Total Funds</div>
              <div className="text-lg font-semibold text-blue-600">
                {formatCurrency(Number(chama.treasury.totalFunds))}
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-sm font-medium text-green-900">Reserve</div>
              <div className="text-lg font-semibold text-green-600">
                {formatCurrency(Number(chama.treasury.reserveFunds))}
              </div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3">
              <div className="text-sm font-medium text-yellow-900">Loans</div>
              <div className="text-lg font-semibold text-yellow-600">
                {formatCurrency(Number(chama.treasury.loansFunds))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Statistics */}
      {showDetails && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Financial Statistics</h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {stats.totalTransactions}
                </div>
                <div className="text-sm text-gray-500">Total Transactions</div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatCurrency(stats.totalContributions)}
                </div>
                <div className="text-sm text-gray-500">Total Contributions</div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </div>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatCurrency(stats.totalWithdrawals)}
                </div>
                <div className="text-sm text-gray-500">Total Withdrawals</div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatCurrency(stats.totalLoans)}
                </div>
                <div className="text-sm text-gray-500">Total Loans</div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatCurrency(stats.averageTransaction)}
                </div>
                <div className="text-sm text-gray-500">Average Transaction</div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  {stats.lastTransactionTime 
                    ? stats.lastTransactionTime.toLocaleDateString()
                    : 'No transactions'
                  }
                </div>
                <div className="text-sm text-gray-500">Last Transaction</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {!userId && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors">
              <div className="text-center">
                <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <div className="mt-2 text-sm font-medium text-gray-900">Make Contribution</div>
                <div className="text-xs text-gray-500">Add money to the group</div>
              </div>
            </button>

            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors">
              <div className="text-center">
                <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
                <div className="mt-2 text-sm font-medium text-gray-900">Request Withdrawal</div>
                <div className="text-xs text-gray-500">Withdraw your funds</div>
              </div>
            </button>

            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors">
              <div className="text-center">
                <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <div className="mt-2 text-sm font-medium text-gray-900">View History</div>
                <div className="text-xs text-gray-500">See all transactions</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BalanceDisplay;