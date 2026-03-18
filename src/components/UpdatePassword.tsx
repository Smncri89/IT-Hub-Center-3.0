import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLocalization } from '@/hooks/useLocalization';
import { supabase } from '@/services/supabaseClient';

const UpdatePassword = () => {
    const { t } = useLocalization();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isRecoverySession, setIsRecoverySession] = useState(false);

    useEffect(() => {
        // Supabase client automatically handles the token from the URL hash.
        // We listen for the PASSWORD_RECOVERY event to confirm we're in the right state.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') {
                setIsRecoverySession(true);
            }
        });

        // Also check initial session in case the event fired before listener was attached
        supabase.auth.getSession().then(({ data: { session } }) => {
            // A temporary session exists during password recovery
            if (session) {
                setIsRecoverySession(true);
            }
        });
        
        return () => subscription.unsubscribe();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError(t('passwords do not match'));
            return;
        }

        setIsLoading(true);
        setError('');
        
        const { error: updateError } = await supabase.auth.updateUser({ password });
        
        setIsLoading(false);
        if (updateError) {
            setError(t('password update failed'));
            console.error("Password update failed:", updateError);
        } else {
            setSuccessMessage(t('password updated successfully'));
            // Log out from the recovery session
            await supabase.auth.signOut();
        }
    };

    const inputStyles = "w-full px-4 py-3 text-neutral-200 bg-neutral-700/50 border-2 border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent";

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 text-neutral-300">
            <div className="w-full max-w-md p-8 space-y-6 bg-neutral-800 rounded-xl shadow-lg">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-white">{t('update your password')}</h2>
                </div>

                {successMessage ? (
                    <div className="text-center">
                        <p className="text-green-400">{successMessage}</p>
                        <Link to="/login" className="inline-block mt-6 w-full px-4 py-3 text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700">
                            {t('proceed to login')}
                        </Link>
                    </div>
                ) : (
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-neutral-400 mb-1">{t('new password')}</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={inputStyles}
                                placeholder="••••••••"
                            />
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-400 mb-1">{t('confirm new password')}</label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={inputStyles}
                                placeholder="••••••••"
                            />
                        </div>
                        
                        {error && <p className="text-sm text-center text-red-400">{error}</p>}
                        
                        {!isRecoverySession && !isLoading && <p className="text-sm text-center text-yellow-400">{t('update password wait session')}</p>}

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading || !isRecoverySession}
                                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 disabled:bg-primary-800"
                            >
                                {isLoading ? '...' : t('update password')}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default UpdatePassword;