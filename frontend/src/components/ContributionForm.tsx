// Contribution Form Component
import React, { useState } from 'react';
import { Chama, Transaction } from '../types/icp';
import { financialService } from '../services/financialService';

interface ContributionFormProps {
    chama: Chama;
    onContributionRecorded?: (transaction: Transaction) => void;
    onCancel?: () => void;
}

const ContributionForm: React.FC<ContributionFormProps> = ({
    chama,
    onContributionRecorded,
    onCancel,
}) => {
    const [formData, setFormData] = useState({
        amount: chama.contributionAmount.toString(),
        description: '',
        paymentMethod: 'mpesa',
        reference: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const paymentMethods = [
        { value: 'mpesa', label: 'M-Pesa', icon: '📱' },
        { value: 'bank', label: 'Bank Transfer', icon: '🏦' },
        { value: 'cash', label: 'Cash', icon: '💵' },
        { value: 'airtel', label: 'Airtel Money', icon: '📱' },
        { value: 'equity', label: 'Equitel', icon: '📱' },
    ];

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Amount validation
        const amount = parseFloat(formData.amount);
        if (!formData.amount || isNaN(amount)) {
            newErrors.amount = 'Valid amount is required';
        } else if (amount < 1) {
            newErrors.amount = 'Amount must be at least KES 1';
        } else if (amount > 1000000) {
            newErrors.amount = 'Amount cannot exceed KES 1,000,000';
        }

        // Description validation
        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        } else if (formData.description.trim().length < 5) {
            newErrors.description = 'Description must be at least 5 characters';
        }

        // Reference validation for electronic payments
        if (['mpesa', 'airtel', 'equity'].includes(formData.paymentMethod)) {
            if (!formData.reference.trim()) {
                newErrors.reference = 'Transaction reference is required for mobile payments';
            } else if (formData.reference.trim().length < 8) {
                newErrors.reference = 'Invalid transaction reference format';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: '',
            }));
        }
    };

    const handleQuickAmount = (multiplier: number) => {
        const baseAmount = Number(chama.contributionAmount);
        setFormData(prev => ({
            ...prev,
            amount: (baseAmount * multiplier).toString(),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
    
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const description = `${formData.description} (${formData.paymentMethod.toUpperCase()}${formData.reference ? ` - ${formData.reference}` : ''})`;
      
            const transaction = await financialService.recordContribution(
                chama.id,
                parseFloat(formData.amount),
                description
            );

            if (transaction) {
                onContributionRecorded?.(transaction);
            }
        } catch (error) {
            console.error('Contribution failed:', error);
            setErrors({
                submit: error instanceof Error ? error.message : 'Failed to record contribution. Please try again.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatCurrency = (amount: string) => {
        const num = parseFloat(amount);
        if (isNaN(num)) return 'KES 0';
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 0,
        }).format(num);
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900">Make Contribution</h3>
                <p className="text-sm text-gray-500">
                    Contribute to <strong>{chama.name}</strong>
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Amount Section */}
                <div>
                    <label htmlFor="amount" className="form-label">
                        Contribution Amount (KES) *
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">KES</span>
                        </div>
                        <input
                            id="amount"
                            name="amount"
                            type="number"
                            min="1"
                            step="0.01"
                            required
                            value={formData.amount}
                            onChange={handleInputChange}
                            className={`form-input pl-12 ${errors.amount ? 'border-red-300' : ''}`}
                            placeholder="0.00"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            <span className="text-sm text-gray-500">
                                {formatCurrency(formData.amount)}
                            </span>
                        </div>
                    </div>
                    {errors.amount && <p className="form-error">{errors.amount}</p>}

                    {/* Quick Amount Buttons */}
                    <div className="mt-2 flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => handleQuickAmount(1)}
                            className="px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            Regular ({formatCurrency(chama.contributionAmount.toString())})
                        </button>
                        <button
                            type="button"
                            onClick={() => handleQuickAmount(1.5)}
                            className="px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            1.5x ({formatCurrency((Number(chama.contributionAmount) * 1.5).toString())})
                        </button>
                        <button
                            type="button"
                            onClick={() => handleQuickAmount(2)}
                            className="px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            Double ({formatCurrency((Number(chama.contributionAmount) * 2).toString())})
                        </button>
                    </div>
                </div>

                {/* Payment Method */}
                <div>
                    <label className="form-label">Payment Method *</label>
                    <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {paymentMethods.map((method) => (
                            <label
                                key={method.value}
                                className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                                    formData.paymentMethod === method.value
                                    ? 'border-indigo-600 ring-2 ring-indigo-600'
                                    : 'border-gray-300'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value={method.value}
                                    checked={formData.paymentMethod === method.value}
                                    onChange={handleInputChange}
                                    className="sr-only"
                                />
                                <span className="flex flex-1">
                                    <span className="flex flex-col">
                                        <span className="block text-sm font-medium text-gray-900">
                                            {method.icon} {method.label}
                                        </span>
                                    </span>
                                </span>
                                {formData.paymentMethod === method.value && (
                                    <svg className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Transaction Reference */}
                {['mpesa', 'airtel', 'equity'].includes(formData.paymentMethod) && (
                    <div>
                        <label htmlFor="reference" className="form-label">
                            Transaction Reference *
                        </label>
                        <input
                            id="reference"
                            name="reference"
                            type="text"
                            required
                            value={formData.reference}
                            onChange={handleInputChange}
                            className={`form-input ${errors.reference ? 'border-red-300' : ''}`}
                            placeholder="e.g., QGH7XJ8K9L (from SMS confirmation)"
                        />
                        {errors.reference && <p className="form-error">{errors.reference}</p>}
                        <p className="mt-1 text-sm text-gray-500">
                            Enter the confirmation code you received via SMS
                        </p>
                    </div>
                )}

                {/* Description */}
                <div>
                    <label htmlFor="description" className="form-label">
                        Description *
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        rows={3}
                        required
                        value={formData.description}
                        onChange={handleInputChange}
                        className={`form-input ${errors.description ? 'border-red-300' : ''}`}
                        placeholder="e.g., Monthly contribution for December 2024"
                    />
                    {errors.description && <p className="form-error">{errors.description}</p>}
                </div>

                {/* Submit Error */}
                {errors.submit && (
                    <div className="alert alert-error">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 88 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm">{errors.submit}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`flex-1 flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                            isSubmitting
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                        }`}
                    >
                        {isSubmitting ? (
                            <div className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Recording Contribution...
                            </div>
                        ) : (
                            'Record Contribution'
                        )}
                    </button>

                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 bg-white py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>

            {/* Important Notes */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">
                            Important Notes
                        </h3>
                        <div className="mt-2 text-sm text-blue-600">
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Ensure you have completed the actual payment before recording here</li>
                                <li>Keep your transaction reference for verification purposes</li>
                                <li>Contributions are recorded immediately and cannot be easily reversed</li>
                                <li>Contact group admins if you need to dispute a transaction</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContributionForm;