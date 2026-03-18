
import React, { useState, useEffect } from 'react';
import { License, Role } from '@/types';
import { useLocalization } from '@/hooks/useLocalization';
import { useAnimatedModal } from '@/hooks/useAnimatedModal';
import * as api from '@/services/api';
import Spinner from '@/components/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { useData } from '@/hooks/useData';

const LicenseFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  licenseToEdit: License | null;
}> = ({ isOpen, onClose, licenseToEdit }) => {
    const { t } = useLocalization();
    const { user } = useAuth();
    const { refetchData } = useData();
    const isAdmin = user?.role === Role.Admin;

    const [formData, setFormData] = useState<{
        name: string;
        software: string;
        totalSeats: number;
        purchaseDate: string;
        expirationDate: string;
        totalCost?: number;
        costPerSeat?: number;
    }>({
        name: '',
        software: '',
        totalSeats: 1,
        purchaseDate: '',
        expirationDate: '',
        totalCost: undefined,
        costPerSeat: undefined,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const { isRendered, isAnimating } = useAnimatedModal(isOpen);
    const isEditMode = !!licenseToEdit;

    useEffect(() => {
        if (licenseToEdit) {
            setFormData({
                name: licenseToEdit.name,
                software: licenseToEdit.software,
                totalSeats: licenseToEdit.totalSeats,
                purchaseDate: licenseToEdit.purchaseDate ? new Date(licenseToEdit.purchaseDate).toISOString().split('T')[0] : '',
                expirationDate: licenseToEdit.expirationDate ? new Date(licenseToEdit.expirationDate).toISOString().split('T')[0] : '',
                totalCost: licenseToEdit.totalCost,
                costPerSeat: licenseToEdit.costPerSeat,
            });
        } else {
            setFormData({ name: '', software: '', totalSeats: 1, purchaseDate: '', expirationDate: '', totalCost: undefined, costPerSeat: undefined });
        }
        setError(''); // Reset error when modal opens or license changes
    }, [licenseToEdit, isOpen]);

    // Automatically calculate total cost
    useEffect(() => {
        const { costPerSeat, totalSeats } = formData;
        if (typeof costPerSeat === 'number' && typeof totalSeats === 'number' && costPerSeat >= 0 && totalSeats > 0) {
            const newTotalCost = parseFloat((costPerSeat * totalSeats).toFixed(2));
             if (newTotalCost !== formData.totalCost) {
                setFormData(prev => ({ ...prev, totalCost: newTotalCost }));
            }
        }
    }, [formData.costPerSeat, formData.totalSeats]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? (value === '' ? undefined : parseFloat(value)) : value }));
    };

    const handleSave = async () => {
        if (!formData.name || !formData.software || formData.totalSeats < 1) {
            setError(t('fill required fields'));
            return;
        }
        setIsSaving(true);
        setError('');
        try {
            if (isEditMode && licenseToEdit) {
                await api.updateLicense(licenseToEdit.id, formData);
            } else {
                await api.createLicense(formData);
            }
            refetchData('licenses');
            onClose();
        } catch (e) {
            console.error(e);
            setError(t('unexpected error'));
        } finally {
            setIsSaving(false);
        }
    };
    
    if (!isRendered) return null;

    const labelStyle = "block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1";
    const inputStyle = "w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition";

    return (
        <div className={`fixed inset-0 bg-black z-50 flex justify-center items-center transition-opacity duration-200 ${isAnimating ? 'bg-opacity-60' : 'bg-opacity-0'}`} onClick={onClose}>
            <div className={`bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-y-auto transition-all duration-300 transform ${isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} onClick={e => e.stopPropagation()}>
                <header className="p-6 border-b border-neutral-200 dark:border-neutral-700 flex-shrink-0">
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white">{isEditMode ? t('edit license') : t('new license')}</h2>
                </header>
                <main className="p-6 space-y-6">
                    {error && <p className="text-sm text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900/50 p-3 rounded-md">{error}</p>}
                    <div>
                        <label htmlFor="name" className={labelStyle}>{t('license name')}*</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className={inputStyle} />
                    </div>
                    <div>
                        <label htmlFor="software" className={labelStyle}>{t('software')}*</label>
                        <input type="text" id="software" name="software" value={formData.software} onChange={handleChange} className={inputStyle} />
                    </div>
                    <div className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-3' : ''} gap-4`}>
                        <div>
                            <label htmlFor="totalSeats" className={labelStyle}>{t('total seats')}*</label>
                            <input type="number" id="totalSeats" name="totalSeats" value={formData.totalSeats} onChange={handleChange} min="1" className={inputStyle} />
                        </div>
                        {isAdmin && (
                            <>
                                 <div>
                                    <label htmlFor="costPerSeat" className={labelStyle}>{t('cost per seat')}</label>
                                    <input type="number" id="costPerSeat" name="costPerSeat" value={formData.costPerSeat || ''} onChange={handleChange} min="0" step="0.01" className={inputStyle} placeholder="e.g., 50.00" />
                                </div>
                                <div>
                                    <label htmlFor="totalCost" className={labelStyle}>{t('total cost')}</label>
                                    <input type="number" id="totalCost" name="totalCost" value={formData.totalCost || ''} onChange={handleChange} min="0" step="0.01" className={inputStyle} placeholder="e.g., 1500.00" />
                                </div>
                            </>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="purchaseDate" className={labelStyle}>{t('purchase date')}</label>
                            <input type="date" id="purchaseDate" name="purchaseDate" value={formData.purchaseDate} onChange={handleChange} className={inputStyle} />
                        </div>
                        <div>
                            <label htmlFor="expirationDate" className={labelStyle}>{t('expiration date')}</label>
                            <input type="date" id="expirationDate" name="expirationDate" value={formData.expirationDate} onChange={handleChange} className={inputStyle} />
                        </div>
                    </div>
                </main>
                <footer className="p-6 bg-neutral-50 dark:bg-neutral-900/50 border-t border-neutral-200 dark:border-neutral-700 flex justify-end gap-3 flex-shrink-0 rounded-b-2xl">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-bold rounded-xl bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 transition-colors">{t('cancel')}</button>
                    <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 text-sm font-bold text-white bg-primary-600 rounded-xl hover:bg-primary-700 disabled:opacity-50 shadow-lg shadow-primary-500/30 transition-all active:scale-95">
                        {isSaving ? <Spinner size="sm" /> : t('save changes')}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default LicenseFormModal;
