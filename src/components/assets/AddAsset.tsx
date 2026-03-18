
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Asset, User } from '@/types';
import { getAssetById, getUsers, createAsset, updateAsset, uploadAssetImage, getAssetImageSuggestion, findImageForModel } from '@/services/api';
import { useLocalization } from '@/hooks/useLocalization';
import { useAuth } from '@/hooks/useAuth'; 
import Spinner from '@/components/Spinner';
import { ICONS, ASSET_TYPES_CONFIG, ASSET_IMAGE_LIBRARY } from '@/constants';
import { useData } from '@/hooks/useData';
import { calculateCurrentValue } from '@/utils/depreciation';

const AddAsset: React.FC = () => {
    const { assetId } = useParams<{ assetId: string }>();
    const navigate = useNavigate();
    const { t } = useLocalization();
    const { user: currentUser } = useAuth(); 
    const { users, refetchData } = useData();
    
    const isEditMode = Boolean(assetId);

    const defaultAssetType = Object.keys(ASSET_TYPES_CONFIG)[0] || 'PC/Laptop'; 

    const [formData, setFormData] = useState<Partial<Asset>>({
        type: defaultAssetType,
        status: 'Ready to Deploy',
        quantity: 1,
    });
    
    // Image Upload State
    const [imageTab, setImageTab] = useState<'upload' | 'url' | 'library'>('upload');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isMatchingImage, setIsMatchingImage] = useState(false); // AI loading state
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [error, setError] = useState('');
    const [isLifetimeWarranty, setIsLifetimeWarranty] = useState(false);

    useEffect(() => {
        const loadAsset = async () => {
            setIsLoading(true);
            try {
                if (isEditMode && assetId) {
                    const fetchedAsset = await getAssetById(assetId);
                    if (fetchedAsset) {
                         const isLifetime = fetchedAsset.warrantyEndDate === 'Lifetime';
                         setIsLifetimeWarranty(isLifetime);
                         const assignedToId = fetchedAsset.assignedTo ? fetchedAsset.assignedTo.id : '';
                        setFormData({
                            ...fetchedAsset,
                            type: (fetchedAsset.type && ASSET_TYPES_CONFIG[fetchedAsset.type as keyof typeof ASSET_TYPES_CONFIG]) ? fetchedAsset.type : defaultAssetType,
                            purchaseDate: fetchedAsset.purchaseDate ? new Date(fetchedAsset.purchaseDate).toISOString().split('T')[0] : '',
                            warrantyEndDate: isLifetime ? '' : (fetchedAsset.warrantyEndDate || ''),
                            assignedTo: assignedToId as any,
                        });
                        if (fetchedAsset.image) {
                            setImagePreview(fetchedAsset.image);
                            setImageTab('url'); // Show current image URL by default if exists
                        }
                    } else {
                        setError(t('asset not found'));
                    }
                } else {
                     setFormData({
                        type: defaultAssetType,
                        status: 'Ready to Deploy',
                        quantity: 1,
                    });
                }
            } catch (err: any) {
                console.error("Failed to load asset:", err);
                setError(err.message || t('unexpected error'));
            } finally {
                setIsLoading(false);
            }
        };
        loadAsset();
    }, [assetId, isEditMode, t]);

    const currentAssetConfig = ASSET_TYPES_CONFIG[formData.type as keyof typeof ASSET_TYPES_CONFIG] || { fields: [], required: [], lifespanYears: undefined };

    useEffect(() => {
        const calculatedValue = calculateCurrentValue({
            type: formData.type,
            purchaseCost: formData.purchaseCost,
            purchaseDate: formData.purchaseDate,
            name: formData.name,
            model: formData.model,
            assetTag: formData.assetTag,
        });

        const finalValue = calculatedValue !== null && calculatedValue !== undefined
            ? parseFloat(calculatedValue.toFixed(2))
            : undefined;

        if (formData.currentValue !== finalValue) {
            setFormData(prev => ({ ...prev, currentValue: finalValue }));
        }
    }, [formData.type, formData.purchaseCost, formData.purchaseDate, formData.name, formData.model, formData.assetTag, formData.currentValue]);

    // --- AUTO-IMAGE DISCOVERY (Local Only) ---
    useEffect(() => {
        // Only auto-suggest if not in edit mode (or if no image set) and if the user hasn't manually uploaded/pasted an image
        if (!isEditMode && !imageFile && !imagePreview && (formData.name || formData.model)) {
            const searchText = `${formData.model || ''} ${formData.name || ''}`.toLowerCase();
            
            let bestMatch = null;
            let maxScore = 0;

            for (const key in ASSET_IMAGE_LIBRARY) {
                const entry = ASSET_IMAGE_LIBRARY[key];
                let score = 0;
                for (const keyword of entry.keywords) {
                    if (searchText.includes(keyword.toLowerCase())) {
                        score += 1;
                    }
                }
                if (score > maxScore) {
                    maxScore = score;
                    bestMatch = entry;
                }
            }

            if (bestMatch && maxScore > 0) {
                // Automatically set preview from library, but don't switch tab forcefully to be annoying
                // Just set the value so it saves if they don't change it
                setFormData(prev => ({ ...prev, image: bestMatch?.url }));
                setImagePreview(bestMatch.url);
                setImageTab('library'); // Helpful to show where it came from
            }
        }
    }, [formData.name, formData.model, isEditMode, imageFile]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? (value === '' ? undefined : parseFloat(value)) : value }));
    };
    
    // Image Handlers
    const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            setImageTab('upload');
        }
    };

    const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value;
        setFormData(prev => ({ ...prev, image: url }));
        setImagePreview(url);
    };

    const handleLibrarySelect = (url: string) => {
        setFormData(prev => ({ ...prev, image: url }));
        setImagePreview(url);
        setImageFile(null);
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        setFormData(prev => ({ ...prev, image: '' }));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };
    
    const handleLifetimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        setIsLifetimeWarranty(checked);
        if (checked) {
            setFormData(prev => ({ ...prev, warrantyEndDate: '' }));
        }
    };

    const handleAiImageMatch = async () => {
        const query = formData.model || formData.name;
        if (!query) return;
        
        setIsMatchingImage(true);
        try {
            // 1. Try to learn from existing database first (Dynamic Library)
            const existingImageUrl = await findImageForModel(query);
            
            if (existingImageUrl) {
                setFormData(prev => ({ ...prev, image: existingImageUrl }));
                setImagePreview(existingImageUrl);
                setImageTab('url'); // Set to URL since it's a stored link
            } else {
                // 2. Fallback to Gemini AI matching against static library
                const suggestionUrl = await getAssetImageSuggestion(query);
                if (suggestionUrl) {
                    setFormData(prev => ({ ...prev, image: suggestionUrl }));
                    setImagePreview(suggestionUrl);
                    setImageTab('url'); // Fix: Switch to URL tab so the user sees the result immediately
                } else {
                    alert("No good match found. Try Web Search.");
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsMatchingImage(false);
        }
    };

    const handleWebSearch = () => {
        const query = formData.model || formData.name;
        if (query) {
            window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`, '_blank');
        }
    };

    const handleSave = async () => {
        if (currentAssetConfig.required?.some(fieldId => !formData[fieldId as keyof Asset])) {
            setError(t('fill required fields'));
            return;
        }

        setIsSaving(true);
        setError('');
        try {
            const dataToSave: Partial<Asset> = { ...formData };
            if (isLifetimeWarranty) {
                dataToSave.warrantyEndDate = 'Lifetime';
            }
            const assignedUser = users.find(u => u.id === (formData.assignedTo as any));
            dataToSave.assignedTo = assignedUser;

            // Upload image if new file selected
            if (imageFile) {
                const imageUrl = await uploadAssetImage(imageFile);
                dataToSave.image = imageUrl;
            }

            if (isEditMode && assetId) {
                await updateAsset(assetId, dataToSave);
            } else {
                await createAsset(dataToSave);
            }
            refetchData('assets');
            setSaveSuccess(true);
            setTimeout(() => {
                navigate('/assets');
            }, 2000);
        } catch (e: any) {
            console.error(e);
            const errorMessage = e.message || '';
             if (errorMessage.includes("Could not find the 'assigned_to_id' column") || errorMessage.includes('permission denied for column "assigned_to_id"')) {
                setError(t('error assignee id missing'));
            } else if (errorMessage.includes("Could not find the 'quantity' column") || errorMessage.includes('permission denied for column "quantity"')) {
                setError(t('error quantity missing'));
            } else {
                setError(errorMessage || t('unexpected error'));
            }
            setIsSaving(false);
        }
    };

    const renderField = (field: any) => {
        const commonProps = {
            id: field.id,
            name: field.id,
            value: formData[field.id as keyof Asset] as any || '',
            onChange: handleChange,
            required: field.required,
            className: "w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-md shadow-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
        };
        
        const labelKey = (field.labelKey || '').replace(/_/g, ' ');
        const label = <label htmlFor={field.id} className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">{t(labelKey)}{field.required && ' *'}</label>;
        
        if (field.id === 'warrantyEndDate') {
            return (
                <div key={field.id} className={field.grid_span || 'col-span-1'}>
                    <div className="flex justify-between items-baseline mb-1">
                         <label htmlFor={field.id} className="block text-sm font-medium text-neutral-600 dark:text-neutral-400">{t(labelKey)}</label>
                         <label className="flex items-center gap-1.5 text-sm text-neutral-600 dark:text-neutral-400">
                            <input
                                type="checkbox"
                                checked={isLifetimeWarranty}
                                onChange={handleLifetimeChange}
                                className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                            />
                            {t('warranty lifetime')}
                        </label>
                    </div>
                    <input
                        type="date"
                        {...commonProps}
                        disabled={isLifetimeWarranty}
                        className={`${commonProps.className} disabled:bg-neutral-200 dark:disabled:bg-neutral-800 disabled:cursor-not-allowed`}
                    />
                </div>
            );
        }

        switch (field.type) {
            case 'text':
            case 'date':
                return <div key={field.id} className={field.grid_span || 'col-span-1'}>
                    {label}
                    <div className="relative">
                        <input type={field.type} {...commonProps} placeholder={field.placeholderKey ? t(field.placeholderKey.replace(/_/g, ' ')) : ''} />
                    </div>
                </div>;
            case 'number': {
                const isCurrentValueField = field.id === 'currentValue';
                return (
                    <div key={field.id} className={field.grid_span || 'col-span-1'}>
                        {label}
                        <div className="relative">
                             <input type={field.type} {...commonProps} readOnly={isCurrentValueField} className={`${commonProps.className} ${isCurrentValueField ? 'bg-neutral-200 dark:bg-neutral-800 cursor-not-allowed' : ''}`} />
                        </div>
                    </div>
                )
            }
            case 'textarea':
                return <div key={field.id} className={field.grid_span || 'col-span-1'}>{label}<textarea {...commonProps} rows={3}></textarea></div>;
            case 'select':
                if (field.id === 'type') {
                    return <div key={field.id} className={field.grid_span || 'col-span-1'}>{label}<select {...commonProps}>
                        {Object.keys(ASSET_TYPES_CONFIG).map(key => {
                            const typeLabelKey = `asset type ${key.toLowerCase().replace('/',' ')}`;
                            return <option key={key} value={key}>{t(typeLabelKey)}</option>
                        })}
                    </select></div>;
                 }
                return <div key={field.id} className={field.grid_span || 'col-span-1'}>{label}<select {...commonProps}>
                    {field.options.map((opt: any) => <option key={opt.value} value={opt.value}>{t(opt.labelKey.replace(/_/g, ' '))}</option>)}
                </select></div>;
            default:
                return null;
        }
    };

    const filteredLibrary = useMemo(() => {
        if (imageTab !== 'library') return [];
        const search = (formData.name || '' + ' ' + formData.model || '').toLowerCase();
        if (!search.trim()) return Object.values(ASSET_IMAGE_LIBRARY); 

        // Prioritize exact matches then partials
        return Object.values(ASSET_IMAGE_LIBRARY).filter(item => 
            item.keywords.some(k => search.includes(k)) || 
            item.label.toLowerCase().includes(search)
        ).sort((a, b) => {
             // Sort by label match first for better relevance
             const aMatch = a.label.toLowerCase().includes(search);
             const bMatch = b.label.toLowerCase().includes(search);
             if (aMatch && !bMatch) return -1;
             if (!aMatch && bMatch) return 1;
             return 0;
        });
    }, [imageTab, formData.name, formData.model]);

    if (isLoading) return <Spinner />;
    if (error && !saveSuccess && !isEditMode) return <div className="text-center p-8 text-red-500">{error}</div>;

    return (
        <div className="max-w-2xl mx-auto">
            {/* Centered Modal-like layout for standalone page */}
            <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                <header className="p-6 border-b border-neutral-200 dark:border-neutral-700 flex-shrink-0 flex justify-between items-center bg-neutral-50 dark:bg-neutral-900/50">
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                        {isEditMode ? t('edit asset') : t('add asset')}
                    </h2>
                    <button onClick={() => navigate('/assets')} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>

                <main className="p-6 space-y-6">
                    {error && !saveSuccess && <p className="text-sm text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900/50 p-3 rounded-md">{error}</p>}
                    
                    <div className="space-y-4">
                        <h3 className="font-semibold text-neutral-800 dark:text-neutral-100">{t('asset tracking')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderField({ id: 'type', labelKey: 'asset type', type: 'select', required: true, grid_span: 'col-span-full' })}
                            {currentAssetConfig.fields.map(renderField)}
                        </div>
                    </div>

                    {/* Image Upload Section */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-neutral-800 dark:text-neutral-100">{t('asset image')}</h3>
                            <div className="flex gap-2">
                                <button 
                                    type="button" 
                                    onClick={handleAiImageMatch}
                                    disabled={isMatchingImage || (!formData.name && !formData.model)}
                                    className="flex items-center gap-1 text-xs px-3 py-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Auto-detect from Library or DB"
                                >
                                    {isMatchingImage ? <Spinner size="sm"/> : <span className="text-lg">✨</span>}
                                    <span>AI Match</span>
                                </button>
                                <button 
                                    type="button" 
                                    onClick={handleWebSearch}
                                    disabled={!formData.name && !formData.model}
                                    className="flex items-center gap-1 text-xs px-3 py-1.5 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-full border border-neutral-200 dark:border-neutral-600 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors disabled:opacity-50"
                                    title="Search Google Images"
                                >
                                    <span>🔍 Web Search</span>
                                </button>
                            </div>
                        </div>
                        <div className="bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700">
                            <div className="flex space-x-4 mb-4 border-b border-neutral-200 dark:border-neutral-700 pb-2">
                                <button
                                    type="button"
                                    onClick={() => setImageTab('upload')}
                                    className={`text-sm font-medium pb-2 -mb-2.5 border-b-2 transition-colors ${imageTab === 'upload' ? 'border-primary-500 text-primary-600' : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                                >
                                    {t('upload image')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setImageTab('url')}
                                    className={`text-sm font-medium pb-2 -mb-2.5 border-b-2 transition-colors ${imageTab === 'url' ? 'border-primary-500 text-primary-600' : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                                >
                                    {t('image url')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setImageTab('library')}
                                    className={`text-sm font-medium pb-2 -mb-2.5 border-b-2 transition-colors ${imageTab === 'library' ? 'border-primary-500 text-primary-600' : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                                >
                                    Library
                                </button>
                            </div>

                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                <div className="flex-1 w-full">
                                    {imageTab === 'upload' && (
                                        <div>
                                            <input 
                                                type="file" 
                                                ref={fileInputRef} 
                                                onChange={handleImageFileChange} 
                                                accept="image/*" 
                                                className="hidden" 
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => fileInputRef.current?.click()} 
                                                className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors group"
                                            >
                                                {React.cloneElement(ICONS.upload, { className: "h-8 w-8 text-neutral-400 group-hover:text-primary-500 mb-2" })}
                                                <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400 group-hover:text-primary-600 dark:group-hover:text-primary-400">{t('browse files')}</span>
                                            </button>
                                        </div>
                                    )}
                                    
                                    {imageTab === 'url' && (
                                        <input 
                                            type="text" 
                                            value={formData.image || ''} 
                                            onChange={handleImageUrlChange} 
                                            placeholder="https://example.com/image.png"
                                            className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-md shadow-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        />
                                    )}

                                    {imageTab === 'library' && (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-1 custom-scrollbar">
                                            {filteredLibrary.length > 0 ? filteredLibrary.map((item) => (
                                                <div 
                                                    key={item.label}
                                                    onClick={() => handleLibrarySelect(item.url)}
                                                    className={`cursor-pointer rounded-lg border hover:border-primary-500 hover:shadow-md overflow-hidden group relative transition-all ${formData.image === item.url ? 'ring-2 ring-primary-500 border-primary-500' : 'border-neutral-200 dark:border-neutral-700'}`}
                                                >
                                                    <img src={item.url} alt={item.label} className="w-full h-24 object-cover" />
                                                    <div className="absolute bottom-0 left-0 w-full bg-black/60 p-1">
                                                        <p className="text-xs text-white text-center truncate">{item.label}</p>
                                                    </div>
                                                </div>
                                            )) : (
                                                <p className="col-span-full text-center text-sm text-neutral-500 py-4">
                                                    No matching images found. Try typing a Model or Name.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {(imagePreview && imageTab !== 'library') && (
                                    <div className="relative w-full md:w-40 h-40 bg-neutral-100 dark:bg-neutral-700 rounded-lg border border-neutral-200 dark:border-neutral-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                        <button 
                                            type="button" 
                                            onClick={handleRemoveImage} 
                                            className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-md"
                                            title={t('remove image')}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-semibold text-neutral-800 dark:text-neutral-100">{t('assignment')}</h3>
                        <div>
                            <label htmlFor="assignedTo" className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">{t('assigned to')}</label>
                            <select name="assignedTo" id="assignedTo" value={formData.assignedTo as any || ''} onChange={handleChange} className="w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-md shadow-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition">
                                <option value="">{t('unassigned')}</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </div>
                    </div>
                </main>

                <footer className="p-6 bg-neutral-50 dark:bg-neutral-900/50 border-t border-neutral-200 dark:border-neutral-700 flex justify-end gap-3 flex-shrink-0">
                    {saveSuccess ? (
                        <div className="flex items-center gap-2 text-green-500 font-medium">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>{t('asset saved successfully')}</span>
                        </div>
                    ) : (
                        <>
                            <button type="button" onClick={() => navigate('/assets')} className="px-4 py-2 text-sm font-medium rounded-xl bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 transition-colors">{t('cancel')}</button>
                            <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 text-sm font-bold text-white bg-primary-600 rounded-xl hover:bg-primary-700 disabled:bg-primary-400 shadow-lg shadow-primary-500/30 transition-all active:scale-95">
                                {isSaving ? <Spinner size="sm" /> : t('save changes')}
                            </button>
                        </>
                    )}
                </footer>
            </div>
        </div>
    );
};

export default AddAsset;
