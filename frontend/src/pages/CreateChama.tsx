// Chama Creation Component
import React, { useState } from 'react';
import { chamaService } from '../services/chamaService';
import { Chama, ChamaType, ContributionFrequency } from '../types/icp';
import { useNavigate } from 'react-router-dom';

interface CreateChamaProps {
    onChamaCreated?: (chama: Chama) => void;
    onCancel?: () => void;
}

const CreateChama: React.FC<CreateChamaProps> = ({ onChamaCreated, onCancel }) => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        contributionAmount: '',
        contributionFrequency: 'monthly' as ContributionFrequency,
        chamaType: 'savings' as ChamaType,
        maxMembers: '20',
        isPublic: true,
        requireApproval: true,
        enableAI: true,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);

    const steps = [
        { id: 1, name: 'Basic Information' },
        { id: 2, name: 'Financial Settings' },
        { id: 3, name: 'Group Settings' },
        { id: 4, name: 'Review & Create' },
    ];

    const chamaTypes = [
        { value: 'savings', label: 'Savings Group', description: 'Focus on collective savings and financial goals' },
        { value: 'investment', label: 'Investment Club', description: 'Pool funds for investments and wealth building' },
        { value: 'microCredit', label: 'Micro-Credit Group', description: 'Provide loans and credit to members' },
        { value: 'welfare', label: 'Welfare Group', description: 'Social support and community assistance' },
        { value: 'business', label: 'Business Venture', description: 'Fund and support business initiatives' },
    ];

    const contributionFrequencies = [
        { value: 'weekly', label: 'Weekly' },
        { value: 'biweekly', label: 'Bi-weekly' },
        { value: 'monthly', label: 'Monthly' },
        { value: 'quarterly', label: 'Quarterly' },
    ];

    const validateStep = (step: number): boolean => {
        const newErrors: Record<string, string> = {};

        if (step === 1) {
            if (!formData.name.trim()) {
                newErrors.name = 'Chama name is required';
            } else if (formData.name.trim().length < 3) {
                newErrors.name = 'Name must be at least 3 characters';
            }

            if (!formData.description.trim()) {
                newErrors.description = 'Description is required';
            } else if (formData.description.trim().length < 10) {
                newErrors.description = 'Description must be at least 10 characters';
            }
        }

        if (step === 2) {
            const amount = parseFloat(formData.contributionAmount);
            if (!formData.contributionAmount || isNaN(amount)) {
                newErrors.contributionAmount = 'Valid contribution amount is required';
            } else if (amount < 100) {
                newErrors.contributionAmount = 'Minimum contribution is KES 100';
            } else if (amount > 1000000) {
                newErrors.contributionAmount = 'Maximum contribution is KES 1,000,000';
            }

            const maxMembers = parseInt(formData.maxMembers);
            if (!formData.maxMembers || isNaN(maxMembers)) {
                newErrors.maxMembers = 'Maximum members is required';
            } else if (maxMembers < 3) {
                newErrors.maxMembers = 'Minimum 3 members required';
            } else if (maxMembers > 100) {
                newErrors.maxMembers = 'Maximum 100 members allowed';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
    
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: '',
            }));
        }
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, steps.length));
        }
    };

    const handlePrevious = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleSubmit = async () => {
        if (!validateStep(currentStep)) {
            return;
        }

        setIsSubmitting(true);

        try {
            console.log('Submitting chama creation with data:', formData);

            const chama = await chamaService.createChama(
                formData.name.trim(),
                formData.description.trim(),
                parseFloat(formData.contributionAmount),
                formData.contributionFrequency as ContributionFrequency,
                formData.chamaType as ChamaType,
                parseInt(formData.maxMembers)
            );

            if (chama) {
                console.log('Chama created successfully:', chama);

                // Call the callback if provided
                if (onChamaCreated) {
                    onChamaCreated?.(chama);
                }

                // Navigate to the chama details page
                navigate(`/chamas/${chama.id}`, { replace: true });
            }
        } catch (error) {
            console.error('Chama creation failed:', error);

            let errorMessage = 'Failed to create chama. Please try again.';
            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }
            
            setErrors({
                submit: errorMessage
            });            
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="name" className="form-label">
                                Chama Name *
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                value={formData.name}
                                onChange={handleInputChange}
                                className={`form-input ${errors.name ? 'border-red-300' : ''}`}
                                placeholder="e.g., Tech Savers Group"
                            />
                            {errors.name && <p className="form-error">{errors.name}</p>}
                        </div>

                        <div>
                            <label htmlFor="description" className="form-label">
                                Description *
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                rows={4}
                                required
                                value={formData.description}
                                onChange={handleInputChange}
                                className={`form-input ${errors.description ? 'border-red-300' : ''}`}
                                placeholder="Describe the purpose and goals of your chama..."
                            />
                            {errors.description && <p className="form-error">{errors.description}</p>}
                        </div>

                        <div>
                            <label className="form-label">Chama Type *</label>
                            <div className="mt-2 space-y-3">
                                {chamaTypes.map((type) => (
                                    <div key={type.value} className="flex items-start">
                                        <div className="flex items-center h-5">
                                            <input
                                                id={type.value}
                                                name="chamaType"
                                                type="radio"
                                                value={type.value}
                                                checked={formData.chamaType === type.value}
                                                onChange={handleInputChange}
                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                            />
                                        </div>
                                        <div className="ml-3 text-sm">
                                            <label htmlFor={type.value} className="font-medium text-gray-700">
                                                {type.label}
                                            </label>
                                            <p className="text-gray-500">{type.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="contributionAmount" className="form-label">
                                Regular Contribution Amount (KES) *
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 sm:text-sm">KES</span>
                                </div>
                                <input
                                    id="contributionAmount"
                                    name="contributionAmount"
                                    type="number"
                                    min="100"
                                    max="1000000"
                                    step="50"
                                    required
                                    value={formData.contributionAmount}
                                    onChange={handleInputChange}
                                    className={`form-input pl-12 ${errors.contributionAmount ? 'border-red-300' : ''}`}
                                    placeholder="5000"
                                />
                            </div>
                            {errors.contributionAmount && <p className="form-error">{errors.contributionAmount}</p>}
                        </div>

                        <div>
                            <label htmlFor="contributionFrequency" className="form-label">
                                Contribution Frequency *
                            </label>
                            <select
                                id="contributionFrequency"
                                name="contributionFrequency"
                                value={formData.contributionFrequency}
                                onChange={handleInputChange}
                                className="form-input"
                            >   
                                {contributionFrequencies.map((freq) => (
                                    <option key={freq.value} value={freq.value}>
                                        {freq.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="maxMembers" className="form-label">
                                Maximum Members *
                            </label>
                            <input
                                id="maxMembers"
                                name="maxMembers"
                                type="number"
                                min="3"
                                max="100"
                                required
                                value={formData.maxMembers}
                                onChange={handleInputChange}
                                className={`form-input ${errors.maxMembers ? 'border-red-300' : ''}`}
                                placeholder="20"
                            />
                            {errors.maxMembers && <p className="form-error">{errors.maxMembers}</p>}
                            <p className="mt-1 text-sm text-gray-500">
                                You can change this later, but it affects group dynamics and management.
                            </p>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-blue-800">
                                        Contribution Guidelines
                                    </h3>
                                    <div className="mt-2 text-sm text-blue-600">
                                        <ul className="list-disc pl-5 space-y-1">
                                            <li>Set a realistic amount all members can afford</li>
                                            <li>Consider seasonal income variations</li>
                                            <li>Start conservative - you can increase later</li>
                                            <li>Factor in late payment penalties</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-start">
                                <div className="flex items-center h-5">
                                    <input
                                        id="isPublic"
                                        name="isPublic"
                                        type="checkbox"
                                        checked={formData.isPublic}
                                        onChange={handleInputChange}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label htmlFor="isPublic" className="font-medium text-gray-700">
                                        Public Group
                                    </label>
                                    <p className="text-gray-500">Allow anyone to discover and request to join this chama</p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <div className="flex items-center h-5">
                                    <input
                                        id="requireApproval"
                                        name="requireApproval"
                                        type="checkbox"
                                        checked={formData.requireApproval}
                                        onChange={handleInputChange}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label htmlFor="requireApproval" className="font-medium text-gray-700">
                                        Require Approval for New Members
                                    </label>
                                    <p className="text-gray-500">New members must be approved by admins before joining</p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <div className="flex items-center h-5">
                                    <input
                                        id="enableAI"
                                        name="enableAI"
                                        type="checkbox"
                                        checked={formData.enableAI}
                                        onChange={handleInputChange}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label htmlFor="enableAI" className="font-medium text-gray-700">
                                        Enable AI Recommendations
                                    </label>
                                    <p className="text-gray-500">Get AI-powered insights and financial recommendations</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-yellow-800">
                                        Privacy & Security
                                    </h3>
                                    <div className="mt-2 text-sm text-yellow-600">
                                        <p>
                                            All chama data is stored securely on the blockchain. Even public groups 
                                            keep financial details private. Only members can see contributions and balances.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="space-y-6">
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Review Your Chama</h3>
                
                            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Name</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{formData.name}</dd>
                                </div>
                  
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Type</dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        {chamaTypes.find(t => t.value === formData.chamaType)?.label}
                                    </dd>
                                </div>
                    
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Contribution</dt>
                                    <dd className="mt-1 text-sm text-gray-900">
                                        KES {parseFloat(formData.contributionAmount).toLocaleString()} {formData.contributionFrequency}
                                    </dd>
                                </div>
                  
                                <div>
                                    <dt className="text-sm font-medium text-gray-500">Max Members</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{formData.maxMembers} people</dd>
                                </div>
                  
                                <div className="md:col-span-2">
                                    <dt className="text-sm font-medium text-gray-500">Description</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{formData.description}</dd>
                                </div>
                            </dl>

                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Settings</h4>
                                <div className="space-y-2 text-sm text-gray-600">
                                    <div className="flex items-center">
                                        <span className={`h-2 w-2 rounded-full mr-2 ${formData.isPublic ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                                        {formData.isPublic ? 'Public group' : 'Private group'}
                                    </div>
                                    <div className="flex items-center">
                                        <span className={`h-2 w-2 rounded-full mr-2 ${formData.requireApproval ? 'bg-yellow-400' : 'bg-green-400'}`}></span>
                                        {formData.requireApproval ? 'Approval required for new members' : 'Open membership'}
                                    </div>
                                    <div className="flex items-center">
                                        <span className={`h-2 w-2 rounded-full mr-2 ${formData.enableAI ? 'bg-blue-400' : 'bg-gray-400'}`}></span>
                                        {formData.enableAI ? 'AI recommendations enabled' : 'AI recommendations disabled'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {errors.submit && (
                            <div className="alert alert-error">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm">{errors.submit}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900">Create Your Chama</h1>
                    <p className="mt-2 text-lg text-gray-600">
                        Set up a new savings group and start building wealth together
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="mb-8">
                    <nav aria-label="Progress">
                        <ol className="flex items-center justify-center">
                            {steps.map((step, stepIdx) => (
                                <li key={step.id} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
                                    <div className="flex items-center">
                                        <div
                                            className={`relative flex h-8 w-8 items-center justify-center rounded-full ${
                                                step.id < currentStep 
                                                ? 'bg-indigo-600 text-white'
                                                : step.id === currentStep
                                                ? 'border-2 border-indigo-600 bg-white text-indigo-600'
                                                : 'border-2 border-gray-300 bg-white text-gray-500'
                                            }`}
                                        >
                                            {step.id < currentStep ? (
                                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            ) : (
                                                <span className="text-sm font-medium">{step.id}</span>
                                            )}
                                        </div>
                                        <span className="ml-2 text-sm font-medium text-gray-500 hidden sm:block">
                                            {step.name}
                                        </span>
                                    </div>
                                    {stepIdx !== steps.length - 1 && (
                                        <div className="absolute top-4 left-4 -ml-px mt-0.5 h-0.5 w-full bg-gray-300 sm:w-16" />
                                    )}
                                </li>
                            ))}
                        </ol>
                    </nav>
                </div>

                {/* Form Content */}
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                    {renderStepContent()}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between">
                    <div>
                        {currentStep > 1 && (
                            <button
                                onClick={handlePrevious}
                                className="btn-secondary"
                            >
                                Previous
                            </button>
                        )}
                    </div>

                    <div className="flex space-x-3">
                        {onCancel && (
                            <button
                                onClick={onCancel}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                        )}

                        {currentStep < steps.length ? (
                            <button
                                onClick={handleNext}
                                className="btn-primary"
                            >
                                Next
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className={`btn-primary ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating Chama...
                                    </div>
                                ) : (
                                    'Create Chama'
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateChama;