
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocalization } from '@/hooks/useLocalization';
import { useAuth } from '@/hooks/useAuth';
import { useAnimatedModal } from '@/hooks/useAnimatedModal';
import Spinner from '@/components/Spinner';
import * as QRCode from 'qrcode';
import { GoogleGenAI, Type } from "@google/genai";
import { supabase } from '@/services/supabaseClient.js';
import { useDebounce } from '@/hooks/useDebounce';
import { ICONS } from '@/constants';
import { useData } from '@/hooks/useData';

// Initialize Gemini AI
const ai = (typeof process !== 'undefined' && process.env?.API_KEY) ? new GoogleGenAI({ apiKey: process.env.API_KEY }) : null;

// --- AI HOOK ---
const useGemini = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateContent = useCallback(async (prompt: string, jsonResponseSchema: any = null) => {
        if (!ai) {
            setError("AI service not configured.");
            return null;
        }
        setIsLoading(true);
        setError(null);
        try {
            const config: any = {};
            if (jsonResponseSchema) {
                config.responseMimeType = "application/json";
                config.responseSchema = jsonResponseSchema;
            }
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: Object.keys(config).length > 0 ? config : undefined,
            });

            return response.text;
        } catch (err) {
            console.error("Gemini API Error:", err);
            setError("Failed to connect to AI service. Please try again later.");
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { generateContent, isLoading, error };
};


// --- CHANGE PASSWORD FORM ---
const ChangePasswordForm: React.FC = () => {
    const { t } = useLocalization();
    const { user } = useAuth();
    const { generateContent, isLoading: isAnalyzing, error: analysisError } = useGemini();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [errors, setErrors] = useState<{ newPassword?: string; confirmNewPassword?: string; generic?: string }>({});
    const [success, setSuccess] = useState('');
    
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);


    const [analysis, setAnalysis] = useState<{ rating: string, tip: string } | null>(null);
    const debouncedNewPassword = useDebounce(newPassword, 500);

    const handleAnalyzePassword = useCallback(async () => {
        if (!debouncedNewPassword) return;
        const prompt = t('ai password prompt') + ` "${debouncedNewPassword}"`;
        const schema = {
            type: Type.OBJECT,
            properties: {
                rating: { type: Type.STRING, enum: ['Good', 'Medium', 'Poor'] },
                tip: { type: Type.STRING }
            },
            required: ['rating', 'tip']
        };
        const response = await generateContent(prompt, schema);
        if (response) {
            try {
                const parsed = JSON.parse(response);
                setAnalysis(parsed);
            } catch (e) {
                setAnalysis({ rating: 'N/A', tip: response });
            }
        }
    }, [debouncedNewPassword, generateContent, t]);

    useEffect(() => {
        if (debouncedNewPassword) {
            handleAnalyzePassword();
        } else {
            setAnalysis(null);
        }
    }, [debouncedNewPassword, handleAnalyzePassword]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({}); // Start fresh on each submit
        setSuccess('');

        // Validation checks
        if (newPassword.length > 0 && newPassword.length < 8) {
            setErrors({ newPassword: t('password too short') });
            return;
        }

        if (newPassword !== confirmNewPassword) {
            setErrors({ confirmNewPassword: t('passwords do not match') });
            return;
        }
    
        // Proceed with submission if validation passed.
        setIsSaving(true);
        const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
        setIsSaving(false);
    
        if (updateError) {
            if (updateError.message.includes('requires recent login')) {
                setErrors({ generic: 'For security, please sign in again before changing your password.' });
            } else {
                setErrors({ generic: t('password update failed generic') });
            }
        } else {
            setSuccess(t('password update success'));
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            setAnalysis(null);
        }
    };

    const inputStyles = "w-full px-3 py-2 bg-neutral-100 dark:bg-neutral-700/50 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500";
    const labelStyles = "block text-sm font-medium text-neutral-700 dark:text-neutral-300";

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className={labelStyles} htmlFor="currentPassword">{t('current password')}</label>
                 <div className="relative">
                    <input id="currentPassword" type={showCurrentPassword ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className={inputStyles} />
                     <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500">
                        {showCurrentPassword ? React.cloneElement(ICONS.eye_closed, {className: "h-5 w-5"}) : React.cloneElement(ICONS.eye_open, {className: "h-5 w-5"})}
                    </button>
                </div>
            </div>
             <div>
                <label className={labelStyles} htmlFor="newPassword">{t('new password')}</label>
                <div className="relative">
                    <input id="newPassword" type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} required className={inputStyles} />
                     <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500">
                        {showNewPassword ? React.cloneElement(ICONS.eye_closed, {className: "h-5 w-5"}) : React.cloneElement(ICONS.eye_open, {className: "h-5 w-5"})}
                    </button>
                </div>
                 {errors.newPassword && <p className="text-sm text-red-500 mt-1">{errors.newPassword}</p>}
                 {isAnalyzing && <p className="text-xs mt-1 text-neutral-500">{t('ai thinking')}</p>}
                 {analysis && !errors.newPassword && (
                    <div className="text-xs mt-2 p-2 bg-neutral-100 dark:bg-neutral-700/50 rounded-md">
                        <span className="font-semibold">{t('ai password strength')}</span>
                        <span className={`ml-1 ${analysis.rating === 'Good' ? 'text-green-500' : analysis.rating === 'Medium' ? 'text-yellow-500' : 'text-red-500'}`}>{t(`ai strength ${analysis.rating.toLowerCase()}`)}</span>
                        <p className="mt-1"><span className="font-semibold">{t('ai tip')}</span> {analysis.tip}</p>
                    </div>
                 )}
                 {analysisError && <p className="text-xs text-red-500 mt-1">{analysisError}</p>}
            </div>
            <div>
                <label className={labelStyles} htmlFor="confirmNewPassword">{t('confirm new password')}</label>
                 <div className="relative">
                    <input id="confirmNewPassword" type={showConfirmPassword ? 'text' : 'password'} value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} required className={inputStyles} />
                     <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500">
                        {showConfirmPassword ? React.cloneElement(ICONS.eye_closed, {className: "h-5 w-5"}) : React.cloneElement(ICONS.eye_open, {className: "h-5 w-5"})}
                    </button>
                </div>
                {errors.confirmNewPassword && <p className="text-sm text-red-500 mt-1">{errors.confirmNewPassword}</p>}
            </div>

            {errors.generic && <p className="text-sm text-red-500">{errors.generic}</p>}
            {success && <p className="text-sm text-green-500">{success}</p>}

            <div className="flex justify-end pt-2">
                <button type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:bg-primary-300">
                    {isSaving ? <Spinner size="sm" /> : t('change password')}
                </button>
            </div>
        </form>
    );
};

const TwoFactorSetupModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
}> = ({ isOpen, onClose }) => {
    const { t } = useLocalization();
    const { user, updateUser } = useAuth();
    const { refetchData } = useData();
    const { isRendered, isAnimating } = useAnimatedModal(isOpen);
    
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [secret, setSecret] = useState('');
    const [factorId, setFactorId] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [error, setError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [copied, setCopied] = useState(false);
    
    useEffect(() => {
        const generate2FA = async () => {
            if (isOpen && user) {
                setQrCodeUrl('');
                setSecret('');
                setFactorId('');
                setVerificationCode('');
                setError('');
                try {
                    // Always clean up existing factors before creating a new one to prevent conflicts.
                    const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
                    if (listError) throw listError;
                    if (factors && factors.totp) {
                        for (const factor of factors.totp) {
                            await supabase.auth.mfa.unenroll({ factorId: factor.id });
                        }
                    }
                    
                    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
                        factorType: 'totp',
                        friendlyName: `IT-Hub:${user.email}:${Date.now()}`
                    });
                    if (enrollError) throw enrollError;

                    if (data?.totp && data.id && data.totp.uri) {
                        const qrCodeDataUrl = await QRCode.toDataURL(data.totp.uri);
                        setQrCodeUrl(qrCodeDataUrl);
                        setFactorId(data.id);
                        setSecret(data.totp.secret);
                    } else {
                        throw new Error("MFA enrollment did not return expected data.");
                    }
                } catch (e: any) {
                    console.error("Error enrolling MFA:", e);
                    setError(t('unexpected error') + ` (${e.message})`);
                }
            }
        };
        generate2FA();
    }, [isOpen, user, t]);

    const handleCopySecret = () => {
        if (!secret) return;
        navigator.clipboard.writeText(secret);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    
    const handleVerifyAndEnable = async () => {
        if (!user || !factorId) return;
        setIsVerifying(true);
        setError('');
        try {
            const { data, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: factorId });
            if (challengeError) throw challengeError;

            const { error: verifyError } = await supabase.auth.mfa.verify({ factorId: factorId, challengeId: data.id, code: verificationCode });
            if (verifyError) throw verifyError;
            
            await updateUser({ isTwoFactorEnabled: true });
            refetchData('users');
            onClose();
        } catch (err: any) {
            console.error("Error verifying 2FA", err);
            setError(t('invalid 2fa code'));
        } finally {
            setIsVerifying(false);
        }
    };

    if (!isRendered) return null;

    return (
        <div className={`fixed inset-0 bg-black z-50 flex justify-center items-center transition-opacity duration-200 ${isAnimating ? 'bg-opacity-50' : 'bg-opacity-0'}`} onClick={onClose}>
            <div className={`bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-full max-w-lg transition-all duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0 -translate-y-10 scale-95'}`} onClick={e => e.stopPropagation()}>
                 <h2 className="text-xl font-semibold mb-4">{t('2fa setup title')}</h2>
                 <div className="space-y-4">
                    <p className="text-sm">{t('2fa setup step1')}</p>
                    <div className="flex justify-center p-4 bg-white rounded-lg">
                        {qrCodeUrl ? <img src={qrCodeUrl} alt="2FA QR Code" /> : <Spinner />}
                    </div>
                    <p className="text-sm">{t('or enter secret')}</p>
                    <div className="relative">
                        <code 
                            className="block text-center p-3 bg-neutral-100 dark:bg-neutral-700 rounded-md tracking-widest text-neutral-900 dark:text-neutral-100 font-mono text-lg cursor-pointer"
                            onClick={handleCopySecret}
                            title="Click to copy"
                        >
                            {secret ? secret.match(/.{1,4}/g)?.join(' ') : <Spinner size="sm" />}
                        </code>
                        {copied && <span className="absolute -top-6 right-0 text-xs bg-green-600 text-white px-2 py-1 rounded-md shadow-lg">Copied!</span>}
                    </div>
                    <hr className="dark:border-neutral-700" />
                    <p className="text-sm">{t('2fa setup step2')}</p>
                    <div>
                        <label htmlFor="verification-code" className="text-sm font-medium">{t('verification code')}</label>
                        <input
                            id="verification-code"
                            type="text"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            className="mt-1 w-full text-center tracking-[0.5em] p-2 border rounded-md"
                            maxLength={6}
                        />
                    </div>
                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                 </div>
                 <div className="flex justify-end mt-6 space-x-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md bg-neutral-200 dark:bg-neutral-700">{t('cancel')}</button>
                    <button onClick={handleVerifyAndEnable} disabled={isVerifying || verificationCode.length !== 6} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50">
                        {isVerifying ? <Spinner size="sm" /> : t('verify and enable')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const SecuritySettings: React.FC = () => {
    const { t } = useLocalization();
    const { user, updateUser } = useAuth();
    const { refetchData } = useData();

    const [is2faModalOpen, setIs2faModalOpen] = useState(false);
    
    const handleToggle2FA = async () => {
        if (!user) return;
        if (user.isTwoFactorEnabled) {
            if (window.confirm("Are you sure you want to disable 2FA?")) {
                try {
                    const { data, error } = await supabase.auth.mfa.listFactors();
                    if(error) throw error;
                    if (data.totp) {
                        for (const factor of data.totp) {
                            await supabase.auth.mfa.unenroll({ factorId: factor.id });
                        }
                    }
                    await updateUser({ isTwoFactorEnabled: false });
                    refetchData('users');
                    alert(t('2fa disabled successfully'));
                } catch (e) {
                    console.error(e);
                    alert(t('unexpected error'));
                }
            }
        } else {
            setIs2faModalOpen(true);
        }
    };

    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <h3 className="text-xl font-semibold">{t('change password')}</h3>
                <ChangePasswordForm />
            </div>
            <div className="space-y-4 pt-8 border-t dark:border-neutral-700">
                 <h3 className="text-xl font-semibold">{t('two factor authentication')}</h3>
                 <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {user?.isTwoFactorEnabled ? t('2fa status enabled') : t('2fa status disabled')}
                </p>
                <button
                    onClick={handleToggle2FA}
                    className={`px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors ${
                        user?.isTwoFactorEnabled 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-primary-600 hover:bg-primary-700'
                    }`}
                >
                    {user?.isTwoFactorEnabled ? t('disable 2fa') : t('enable 2fa')}
                </button>
            </div>
            <TwoFactorSetupModal isOpen={is2faModalOpen} onClose={() => setIs2faModalOpen(false)} />
        </div>
    );
};
