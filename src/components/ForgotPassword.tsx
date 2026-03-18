import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLocalization } from '@/hooks/useLocalization';
import * as authService from '@/services/auth';

const ForgotPassword = () => {
    const { t } = useLocalization();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setMessage('');

        const result = await authService.sendPasswordResetEmail(email);

        setIsLoading(false);
        if (result.error) {
            setError(t(result.error));
        } else {
            setMessage(t('reset link sent message'));
        }
    };

    const inputStyles = "w-full px-4 py-3 text-neutral-200 bg-neutral-700/50 border-2 border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent";

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 text-neutral-300">
            <div className="w-full max-w-md p-8 space-y-6 bg-neutral-800 rounded-xl shadow-lg">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-white">{t('reset your password')}</h2>
                    <p className="mt-2 text-neutral-400">{t('forgot password instructions')}</p>
                </div>

                {message ? (
                    <div className="text-center">
                        <div className="text-green-500 mx-auto h-16 w-16">
                           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                        </div>
                        <h3 className="text-xl font-bold mt-4">{t('reset link sent title')}</h3>
                        <p className="mt-2 text-neutral-300">{message}</p>
                        <Link to="/login" className="inline-block mt-6 w-full px-4 py-3 text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700">
                            {t('back to login')}
                        </Link>
                    </div>
                ) : (
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-neutral-400 mb-1">{t('email address')}</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={inputStyles}
                                placeholder="you@example.com"
                            />
                        </div>
                        
                        {error && <p className="text-sm text-center text-red-400">{error}</p>}

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 disabled:bg-primary-800"
                            >
                                {isLoading ? '...' : t('send reset link')}
                            </button>
                        </div>
                         <div className="text-sm text-center">
                            <Link to="/login" className="font-medium text-primary-500 hover:text-primary-400">
                                {t('back to login')}
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;