
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLocalization } from '@/hooks/useLocalization';
import Spinner from './Spinner';
import { Logo, ICONS } from '@/constants';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, verify2FA } = useAuth();
  const { t } = useLocalization();
  const navigate = useNavigate();

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    if (loginError) {
      setLoginError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);

    if (requires2FA) {
        const { user, error: apiError } = await verify2FA(verificationCode);
        setIsLoading(false);
        if (apiError) {
            setLoginError(t(apiError));
            setVerificationCode('');
        } else if (user) {
            navigate('/dashboard');
        }
    } else {
        const { user, error: apiError, requires2FA: needs2FA } = await login(email, password);
        setIsLoading(false);
        if (apiError) {
          setLoginError(t(apiError));
          setPassword('');
        } else if (needs2FA) {
          setRequires2FA(true);
          setPassword('');
        } else if (user) {
          navigate('/dashboard');
        }
    }
  };
  
  const inputStyles = `w-full px-4 py-3.5 text-neutral-900 dark:text-neutral-100 bg-neutral-50/50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all placeholder-neutral-400 dark:placeholder-neutral-600 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-neutral-800/80`;
  const labelStyles = "block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 ml-1";

  const renderLoginForm = () => (
    <>
        <div className="space-y-5">
            <div>
                <label htmlFor="email" className={labelStyles}>{t('email address')}</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400 group-focus-within:text-primary-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
                    </div>
                    <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={handleInputChange(setEmail)}
                        className={`${inputStyles} pl-11`}
                        placeholder="name@company.com"
                    />
                </div>
            </div>

            <div>
                <label htmlFor="password" className={labelStyles}>{t('password')}</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400 group-focus-within:text-primary-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={handleInputChange(setPassword)}
                        className={`${inputStyles} pl-11 pr-11`}
                        placeholder="••••••••"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                        {showPassword 
                            ? React.cloneElement(ICONS.eye_closed, { className: "h-5 w-5" }) 
                            : React.cloneElement(ICONS.eye_open, { className: "h-5 w-5" })
                        }
                    </button>
                </div>
            </div>
        </div>
        
        <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 cursor-pointer group">
                <input type="checkbox" className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500 bg-neutral-100 dark:bg-neutral-800 dark:border-neutral-700" />
                <span className="text-sm text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-200 transition-colors">Remember me</span>
            </label>
            <Link to="/forgot-password" className="text-sm font-semibold text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors">
                {t('forgot password')}
            </Link>
        </div>

        {loginError && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 text-sm text-red-600 dark:text-red-400 text-center animate-shake font-medium flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                {loginError}
            </div>
        )}

        <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-lg shadow-primary-500/25 transform hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
        >
            {isLoading ? <Spinner size="sm" /> : t('sign in')}
        </button>
    </>
  );

  const render2FAForm = () => (
    <div className="space-y-6 animate-scaleIn">
        <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 ring-1 ring-primary-100 dark:ring-primary-800 shadow-glow">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">{t('2fa verification code')}</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Enter the 6-digit code from your authenticator.</p>
            </div>
        </div>

        <div className="relative">
            <input
                id="2fa-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                value={verificationCode}
                onChange={handleInputChange(setVerificationCode)}
                className={`${inputStyles} text-center text-3xl tracking-[0.5em] font-mono h-16 font-bold`}
                placeholder="000000"
                maxLength={6}
                autoFocus
            />
        </div>

        {loginError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 text-sm text-red-600 dark:text-red-400 text-center animate-shake font-medium">
                {loginError}
            </div>
        )}

        <div className="space-y-3">
             <button
                type="submit"
                disabled={isLoading || verificationCode.length !== 6}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-lg shadow-primary-500/25 transform hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
                {isLoading ? <Spinner size="sm" /> : t('verify code')}
            </button>
            <button 
                type="button"
                onClick={() => { setRequires2FA(false); setEmail(''); setLoginError(''); }} 
                className="w-full py-2 text-sm font-medium text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800/50"
            >
                {t('back to login')}
            </button>
        </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-neutral-50 dark:bg-neutral-950 relative overflow-hidden font-sans selection:bg-primary-500/30">
        {/* Advanced Dynamic Background */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-primary-400/20 to-purple-400/20 blur-[120px] animate-pulse-slow"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tl from-blue-400/20 to-indigo-400/20 blur-[120px] animate-pulse-slow" style={{ animationDelay: '3s' }}></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
        </div>

        <div className="flex flex-col justify-center items-center w-full relative z-10 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-[420px] space-y-8 animate-slide-up">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center p-4 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl shadow-primary-900/5 mb-6 ring-1 ring-neutral-200 dark:ring-neutral-800">
                        <Logo className="h-12 w-12 text-primary-600" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-neutral-900 dark:text-white">
                        {t('it hub center')}
                    </h1>
                    <p className="mt-3 text-lg font-medium text-neutral-500 dark:text-neutral-400">
                        {t('enterprise it ops management')}
                    </p>
                </div>

                <div className="glass-panel rounded-3xl shadow-2xl p-8 sm:p-10 border border-white/50 dark:border-neutral-700/50">
                    {requires2FA ? (
                        render2FAForm()
                    ) : (
                        <>
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">{t('welcome')}</h2>
                                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mt-1">{t('sign in to manage ops')}</p>
                            </div>

                            <form className="space-y-6" onSubmit={handleSubmit}>
                                {renderLoginForm()}
                            </form>

                            <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700/50 text-center">
                                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                    Don't have an account?{' '}
                                    <Link to="/register" className="font-bold text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors">
                                        {t('sign up')}
                                    </Link>
                                </p>
                            </div>
                        </>
                    )}
                </div>
                
                <div className="text-center">
                    <p className="text-xs text-neutral-400 dark:text-neutral-600 font-medium">
                        &copy; {new Date().getFullYear()} IT Hub Center. Secure & Encrypted.
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Login;
