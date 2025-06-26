import { ChamaType, ChamaStatus, ContributionFrequency } from '../types/icp';

// Utility function to extract variant keys
export const extractVariantKey = (variantObject: any): string => {
    if (typeof variantObject === 'string') {
        return variantObject; // Already a string
    }
    if (typeof variantObject === 'object' && variantObject !== null) {
        const keys = Object.keys(variantObject);
        return keys.length > 0 ? keys[0] : 'unknown';
    }
    return 'unknown';
};

export const getChamaTypeText = (chamaType: any): ChamaType => {
    const typeKey = extractVariantKey(chamaType);
    const validTypes: ChamaType[] = ['savings', 'investment', 'microCredit', 'welfare', 'business'];
    return validTypes.includes(typeKey as ChamaType) ? (typeKey as ChamaType) : 'savings';
};

export const getChamaStatusText = (status: any): ChamaStatus => {
    const statusKey = extractVariantKey(status);
    const validStatuses: ChamaStatus[] = ['forming', 'active', 'suspended', 'dissolved'];
    return validStatuses.includes(statusKey as ChamaStatus) ? (statusKey as ChamaStatus) : 'forming';
};

export const getContributionFrequencyText = (frequency: any): string => {
    const frequencyKey = extractVariantKey(frequency);
    const frequencyMap: Record<string, string> = {
        daily: 'Daily',
        weekly: 'Weekly',
        biweekly: 'Bi-weekly',
        monthly: 'Monthly',
        quarterly: 'Quarterly',
    };
    return frequencyMap[frequencyKey] || 'Monthly';
};

export const getMemberRoleText = (role: any): string => {
    const roleKey = extractVariantKey(role);
    const roleMap: Record<string, string> = {
        owner: 'Owner',
        admin: 'Admin',
        treasurer: 'Treasurer',
        secretary: 'Secretary',
        member: 'Member',
    };
    return roleMap[roleKey] || 'Member';
};

export const getMemberStatusText = (status: any): string => {
    const statusKey = extractVariantKey(status);
    const statusMap: Record<string, string> = {
        active: 'Active',
        suspended: 'Suspended',
        inactive: 'Inactive',
        expelled: 'Expelled',
        pending: 'Pending',
        rejected: 'Rejected',
    };
    return statusMap[statusKey] || 'Active';
};

export const formatCurrency = (amount: bigint | number): string => {
    const numAmount = typeof amount === 'bigint' ? Number(amount) : amount;
    return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 0,
    }).format(numAmount);
};