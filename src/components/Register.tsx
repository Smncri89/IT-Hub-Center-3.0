import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLocalization } from '@/hooks/useLocalization';
import { Role } from '@/types';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const { register } = useAuth();
  const { t } = useLocalization();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('passwords do not match'));
      return;
    }

    setIsLoading(true);
    try {
      const { user, error: apiError } = await register(name, email, password, Role.EndUser);
      if (apiError) {
        setError(t(apiError));
      } else {
        setShowSuccessMessage(true);
      }
    } catch (err) {
      setError(t('registration failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyles = "w-full px-4 py-3 text-neutral-200 bg-neutral-700/50 border-2 border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent";
  const labelStyles = "block text-sm font-medium text-neutral-400 mb-1";

  if (showSuccessMessage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 text-neutral-300">
        <div className="w-full max-w-md p-8 space-y-6 bg-neutral-800 rounded-xl shadow-lg text-center">
            <div className="text-green-500 mx-auto h-16 w-16">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-white">{t('registration success title')}</h2>
            <p className="text-neutral-300">{t('registration success message')}</p>
            <Link to="/login" className="inline-block mt-4 w-full px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                {t('back to login')}
            </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 text-neutral-300 py-12">
      <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-primary-500">IT Hub</h1>
            <p className="mt-2 text-lg text-neutral-400">{t('enterprise it ops management')}</p>
        </div>
        <div className="w-full max-w-md p-8 space-y-6 bg-neutral-800 rounded-xl shadow-lg">
            <div>
                <h2 className="text-3xl font-bold text-white">{t('welcome')}</h2>
                <p className="mt-1 text-neutral-400">{t('create account to manage ops')}</p>
            </div>

            <div className="flex bg-neutral-700/50 p-1 rounded-lg">
                <Link
                to="/login"
                className="flex-1 text-center py-2.5 rounded-md text-neutral-400 hover:bg-neutral-700/80 font-semibold text-sm"
                >
                {t('sign in')}
                </Link>
                <Link
                to="/register"
                className="flex-1 text-center py-2.5 rounded-md bg-neutral-900 text-white font-semibold text-sm shadow-md"
                >
                {t('sign up')}
                </Link>
            </div>
        
            <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="name" className={labelStyles}>{t('full name')}<span className="text-red-500">*</span></label>
                    <input id="name" type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputStyles} placeholder="John Doe"/>
                </div>
                <div>
                    <label htmlFor="email" className={labelStyles}>{t('email address')}<span className="text-red-500">*</span></label>
                    <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputStyles} placeholder="you@example.com" />
                </div>
                <div>
                    <label htmlFor="password" className={labelStyles}>{t('password')}<span className="text-red-500">*</span></label>
                    <input id="password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputStyles} placeholder="••••••••"/>
                </div>
                <div>
                    <label htmlFor="confirm-password" className={labelStyles}>{t('confirm password')}<span className="text-red-500">*</span></label>
                    <input id="confirm-password" type="password" autoComplete="new-password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputStyles} placeholder="••••••••"/>
                </div>

                {error && <p className="text-sm text-center text-red-400">{error}</p>}

                <div className="pt-2">
                    <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-800 disabled:cursor-not-allowed"
                    >
                    {isLoading ? '...' : t('sign up')}
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
};

export default Register;