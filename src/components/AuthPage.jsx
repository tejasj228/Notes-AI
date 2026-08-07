'use client';

import React, { useRef, useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, ArrowLeft } from 'lucide-react';
import { authAPI } from '@/api/auth';
import googleAuthService from '@/services/googleAuth';
import { auth, googleProvider } from '@/config/firebase';
import StampShapes from './StampShapes';
import StampLoader from './StampLoader';

/* Module scope so it isn't recreated each render — a re-created component
   type remounts the input and drops focus after one keystroke. */
const StampInput = ({ id, icon: Icon, label, error, trailing, inputClass = '', ...props }) => (
  <div>
    <label className="sc-label" htmlFor={id}>
      {label}
    </label>
    {error && <p className="sc-field-error">{error}</p>}
    <div className="relative">
      <Icon className="sc-input-icon" size={17} strokeWidth={2.5} />
      <input id={id} className={`sc-input ${inputClass}`} {...props} />
      {trailing}
    </div>
  </div>
);

/* Branch on a stable code, never on the wording of the message. A wrong
   password ("try again") and a blocked/misconfigured state ("you can't fix
   this yourself") are different events and shouldn't look identical. */
const classifyFailure = ({ status, code, message } = {}) => {
  const blocked =
    status === 403 ||
    code === 'auth/operation-not-allowed' ||
    code === 'auth/unauthorized-domain';

  if (blocked) {
    return {
      kind: 'warn',
      heading: 'Sign-in unavailable',
      message: message || 'This sign-in method is not permitted. Please contact support.',
    };
  }
  return { kind: 'error', message: message || 'Authentication failed' };
};

const AuthPage = ({ onAuthSuccess, onBackHome }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const cardRef = useRef(null);

  const processGoogleUser = async (googleUser) => {
    try {
      setLoading(true);
      setAlert(null);
      const backendResponse = await authAPI.googleLogin(googleUser);
      if (backendResponse.success) {
        localStorage.setItem('authToken', backendResponse.data.token);
        localStorage.setItem('user', JSON.stringify(backendResponse.data.user));
        onAuthSuccess(backendResponse.data.user, backendResponse.data.token);
      } else {
        setAlert(classifyFailure({ message: backendResponse.message }));
      }
    } catch (err) {
      setAlert(
        classifyFailure({
          status: err.response?.status,
          message: err.response?.data?.message || err.message,
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);
    try {
      const response = isLogin
        ? await authAPI.login({ email: formData.email, password: formData.password })
        : await authAPI.signup({ name: formData.name, email: formData.email, password: formData.password });

      if (response.success) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        onAuthSuccess(response.data.user, response.data.token);
      } else {
        setAlert(classifyFailure({ message: response.message }));
      }
    } catch (err) {
      setAlert(
        classifyFailure({
          status: err.response?.status,
          message: err.response?.data?.message,
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setAlert(null);
  };

  const selectMode = (login) => {
    if (login === isLogin) return;
    setIsLogin(login);
    setAlert(null);
    setFormData({ email: '', password: '', name: '' });
    setShowPassword(false);
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setAlert(null);
      if (!auth || !googleProvider) throw new Error('Firebase not initialized');
      const googleResult = await googleAuthService.signInWithPopup();
      if (!googleResult.success) {
        setAlert(classifyFailure({ code: googleResult.code, message: googleResult.error }));
        return;
      }
      await processGoogleUser(googleResult.user);
    } catch (err) {
      setAlert(classifyFailure({ message: err.message }));
    } finally {
      setLoading(false);
    }
  };

  // Live inline validation — the browser still enforces this on submit,
  // this just surfaces it before the user gets there.
  const passwordError =
    !isLogin && formData.password.length > 0 && formData.password.length < 6
      ? 'Must be at least 6 characters'
      : '';

  return (
    <div className="sc-field">
      <StampShapes cardRef={cardRef} />

      {/* pointer-events pass through to the shapes; the card re-enables them */}
      <div className="relative z-10 min-h-full flex flex-col items-center px-4 py-10 pointer-events-none">
        <div className="w-full max-w-[420px] my-auto pointer-events-auto">
          <button type="button" onClick={onBackHome} className="sc-chip mb-4">
            <ArrowLeft size={13} strokeWidth={3} />
            Back home
          </button>

          <div className="sc-card" ref={cardRef}>
            {/* Wordmark — marker stripe painted behind the second half */}
            <div className="sc-wordmark mb-5 pr-2">
              NOTES·<span className="sc-wordmark-hi">AI</span>
            </div>

            <h1 className="sc-title">{isLogin ? 'Welcome back.' : 'Make an account.'}</h1>
            <p className="sc-note mt-2 mb-5">
              {isLogin ? 'Sign in to your notes' : 'Start capturing ideas in colour'}
            </p>

            {/* Segmented switch */}
            <div className="flex gap-2 mb-5" role="tablist" aria-label="Authentication mode">
              <button
                type="button"
                role="tab"
                id="tab-signin"
                aria-selected={isLogin}
                aria-controls="auth-panel"
                className="sc-tab"
                onClick={() => selectMode(true)}
              >
                Sign in
              </button>
              <button
                type="button"
                role="tab"
                id="tab-register"
                aria-selected={!isLogin}
                aria-controls="auth-panel"
                className="sc-tab"
                onClick={() => selectMode(false)}
              >
                Create account
              </button>
            </div>

            {/* key= forces a remount so the entrance animation actually replays */}
            <div
              key={isLogin ? 'signin' : 'register'}
              id="auth-panel"
              role="tabpanel"
              aria-labelledby={isLogin ? 'tab-signin' : 'tab-register'}
              className="sc-form-in"
            >
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {!isLogin && (
                  <StampInput
                    id="field-name"
                    icon={User}
                    label="Full name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Ada Lovelace"
                    required={!isLogin}
                  />
                )}

                <StampInput
                  id="field-email"
                  icon={Mail}
                  label="Email address"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="you@example.com"
                  required
                />

                <StampInput
                  id="field-password"
                  icon={Lock}
                  label="Password"
                  error={passwordError}
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  inputClass="pr-11"
                  trailing={
                    <button
                      type="button"
                      className="sc-reveal"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={17} strokeWidth={2.5} /> : <Eye size={17} strokeWidth={2.5} />}
                    </button>
                  }
                />

                {!isLogin && !passwordError && <p className="sc-note -mt-1">Min 6 characters</p>}

                {alert && (
                  <div
                    className={`sc-alert ${
                      alert.kind === 'warn'
                        ? 'sc-alert-warn'
                        : alert.kind === 'success'
                        ? 'sc-alert-success'
                        : 'sc-alert-error'
                    }`}
                    role="alert"
                  >
                    {alert.heading && <strong className="sc-alert-heading">{alert.heading}</strong>}
                    {alert.message}
                  </div>
                )}

                <button type="submit" disabled={loading} className="sc-btn sc-btn-primary w-full">
                  {loading ? (
                    <>
                      <StampLoader tone="ink" label="Submitting" />
                      {isLogin ? 'Signing in' : 'Creating'}
                    </>
                  ) : (
                    <>
                      {isLogin ? 'Sign in' : 'Create account'}
                      <ArrowRight size={16} strokeWidth={3} />
                    </>
                  )}
                </button>

                <div className="flex items-center gap-3">
                  <span className="sc-rule" />
                  <span className="sc-mono text-[10px]">or</span>
                  <span className="sc-rule" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="sc-btn sc-btn-secondary w-full"
                >
                  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
