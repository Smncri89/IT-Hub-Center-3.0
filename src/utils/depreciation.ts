
import { Asset } from '@/types';
import { ASSET_TYPES_CONFIG } from '@/constants';

// Expanded keywords for better type inference
const INFERENCE_KEYWORDS: Record<string, string[]> = {
    'PC/Laptop': ['laptop', 'notebook', 'macbook', 'thinkpad', 'latitude', 'elitebook', 'chromebook', 'surface book'],
    'Desktop': ['desktop', 'tower', 'pc', 'optiplex', 'workstation', 'mac mini', 'mac pro', 'imac'],
    'All-in-One': ['all-in-one', 'aio', 'touchsmart'],
    'Smartphone': ['phone', 'iphone', 'galaxy', 'pixel', 'xperia', 'android', 'mobile'],
    'Tablet': ['tablet', 'ipad', 'surface', 'galaxy tab'],
    'Server': ['server', 'poweredge', 'proliant', 'rack', 'blade'],
    'Printer': ['printer', 'laserjet', 'officejet', 'inkjet', 'lumenjet', 'epson', 'brother', 'hp'],
    'Monitor': ['monitor', 'display', 'ultrawide', 'dell u-series', 'screen', 'led', 'lcd'],
    'Projector': ['projector', 'beamer'],
    'Switch': ['switch', 'cisco', 'catalyst', 'unifi', 'netgear', 'managed switch'],
    'Router': ['router', 'gateway', 'edge router'],
    'Firewall': ['firewall', 'fortinet', 'palo alto', 'sonicwall', 'security appliance'],
    'Access Point': ['access point', 'ap', 'wifi', 'wireless', 'ubiquiti', 'aruba'],
    'NAS': ['nas', 'synology', 'qnap', 'storage'],
    'VoIP Phone': ['voip', 'polycom', 'cisco ip phone', 'desk phone'],
    'Conference Phone': ['conference phone', 'spider', 'polycom trio'],
    'Webcam': ['webcam', 'logitech', 'camera'],
    'Docking Station': ['dock', 'docking station', 'hub', 'replicator'],
    'KVM Switch': ['kvm', 'kvm switch'],
    'UPS': ['ups', 'battery backup', 'apc', 'cyberpower'],
    'PDU': ['pdu', 'power strip', 'rack pdu'],
    'Digital Signage': ['digital signage', 'signage', 'kiosk'],
    'Scanner': ['scanner', 'fujitsu', 'document scanner'],
    'Copier': ['copier', 'photocopier', 'mfp', 'multifunction'],
    'Load Balancer': ['load balancer', 'f5', 'citrix adc'],
    'RAM': ['ram', 'memory', 'ddr4', 'ddr5', 'dimm', 'sodimm'],
};

/**
 * Calculates the current value of an asset.
 * - For depreciable assets, it uses a straight-line model.
 * - For non-depreciable assets, it mirrors the purchase cost.
 * - Attempts to infer the type for 'Other' assets based on name/model/serial.
 * @param asset The asset object.
 * @returns The calculated current value, or null if not calculable.
 */
export function calculateCurrentValue(asset: Partial<Asset>): number | null {
    const { type, purchaseCost, purchaseDate: purchaseDateStr, name, model, assetTag, serialNumber } = asset;

    if (!type) return asset.currentValue ?? null;

    let config = ASSET_TYPES_CONFIG[type as keyof typeof ASSET_TYPES_CONFIG];
    
    // Smart inference for 'Other' type or if type is missing but name/model suggests one
    if ((type === 'Other' || !config) && (name || model)) {
        const textToSearch = `${name || ''} ${model || ''} ${assetTag || ''} ${serialNumber || ''}`.toLowerCase();
        
        for (const [assetType, keywords] of Object.entries(INFERENCE_KEYWORDS)) {
            if (keywords.some(keyword => textToSearch.includes(keyword))) {
                config = ASSET_TYPES_CONFIG[assetType as keyof typeof ASSET_TYPES_CONFIG];
                break; // Use the first match
            }
        }
    }
    
    const lifespanYears = (config as any)?.lifespanYears;
    
    // For non-depreciable items, current value simply mirrors the purchase cost.
    if (!lifespanYears) {
        return purchaseCost ?? null;
    }

    // For depreciable items, we need cost and date to calculate.
    if (purchaseCost === null || purchaseCost === undefined || purchaseCost <= 0 || !purchaseDateStr) {
        return purchaseCost ?? null;
    }

    const purchaseDate = new Date(purchaseDateStr);
    if (isNaN(purchaseDate.getTime())) {
        return purchaseCost; // Invalid date, return cost as best guess.
    }

    const salvageValue = purchaseCost * 0.10; // Assume 10% salvage value
    const totalDepreciableAmount = purchaseCost - salvageValue;

    if (totalDepreciableAmount <= 0) {
        return purchaseCost;
    }
    
    const ageInYears = (new Date().getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    
    if (ageInYears <= 0) {
        return purchaseCost;
    }

    const annualDepreciation = totalDepreciableAmount / lifespanYears;
    const accumulatedDepreciation = annualDepreciation * ageInYears;
    
    const calculatedValue = purchaseCost - accumulatedDepreciation;

    // Current value should not be less than salvage value
    return Math.max(calculatedValue, salvageValue);
}
