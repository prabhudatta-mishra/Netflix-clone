import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import AuthShell from '../components/AuthShell';
import { ArrowLeft, CheckCircle2, CreditCard, Mail, ShieldCheck } from 'lucide-react';
import api from '../api/axios';
import { auth } from '../firebase';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  sendEmailVerification,
  signOut,
} from 'firebase/auth';

const UPI_ID = '8144517582@axl';
const PLAN_PRICE = 199;

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register } = useAuth();
  const toast = useToast();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState('account');
  const [verificationSent, setVerificationSent] = useState(false);
  const [verified, setVerified] = useState(searchParams.get('verified') === 'true');
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [verificationMessage, setVerificationMessage] = useState('');

  useEffect(() => {
    if (step !== 'verify' || verified) return undefined;

    let cancelled = false;
    const refreshVerification = async () => {
      const user = auth.currentUser || firebaseUser;
      if (!user) return;
      await user.reload();
      if (!cancelled && user.emailVerified) {
        setVerified(true);
        setStep('payment');
        toast?.success?.('Email verified.');
      }
    };

    const handleFocus = () => refreshVerification();
    window.addEventListener('focus', handleFocus);
    const interval = window.setInterval(refreshVerification, 5000);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', handleFocus);
      window.clearInterval(interval);
    };
  }, [step, verified, firebaseUser, toast]);

  const sendVerification = async (event) => {
    event.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(credential.user);
      setFirebaseUser(credential.user);
      setVerificationSent(true);
      setVerificationMessage(`We sent a verification email to ${email}.`);
      setStep('verify');
      toast?.success?.('Verification email sent.');
    } catch (err) {
      const message = firebaseErrorMessage(err);
      setError(message);
      toast?.error?.(message);
    } finally {
      setLoading(false);
    }
  };

  const checkVerification = async () => {
    setError('');
    const user = auth.currentUser || firebaseUser;
    if (!user) {
      setError('Please send the verification email first.');
      return;
    }
    await user.reload();
    if (user.emailVerified) {
      setVerified(true);
      setStep('payment');
      toast?.success?.('Email verified.');
      return;
    }
    setError('Email is not verified yet. Open the email link, then click Check verification again.');
  };

  const resendVerification = async () => {
    const user = auth.currentUser || firebaseUser;
    if (!user) {
      setError('Please enter account details again.');
      setStep('account');
      return;
    }
    await sendEmailVerification(user);
    toast?.success?.('Verification email sent again.');
  };

  const upiLink = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent('Netflix Clone')}&am=${PLAN_PRICE}&cu=INR&tn=${encodeURIComponent(`Netflix membership for ${email || username}`)}`;

  const finishSignup = async () => {
    setError('');
    if (!verified) {
      await checkVerification();
      if (!auth.currentUser?.emailVerified) {
        return;
      }
    }
    if (!paymentConfirmed) {
      return setError('Please confirm that payment is completed before creating the account.');
    }
    setLoading(true);
    const result = await register(username, email, password, {
      emailVerified: true,
      paymentConfirmed: true,
      paymentUpiId: UPI_ID,
    });
    setLoading(false);
    if (result.success) {
      await signOut(auth).catch(() => {});
      toast?.success?.('Payment recorded. Welcome to Netflix!');
      navigate('/profiles');
    } else {
      if (auth.currentUser) {
        await deleteUser(auth.currentUser).catch(() => {});
      }
      setError(result.error);
      toast?.error?.(result.error);
    }
  };

  return (
    <AuthShell title="Create your account">
      {error && <div className="auth-error">{error}</div>}
      {step !== 'account' && (
        <button type="button" className="signup-back-btn" onClick={() => setStep(step === 'payment' ? 'verify' : 'account')}>
          <ArrowLeft size={18} />
          Back
        </button>
      )}
      <div className="signup-steps">
        <Step active={step === 'account'} done={verificationSent} icon={<Mail size={16} />} label="Account" />
        <Step active={step === 'verify'} done={verified} icon={<ShieldCheck size={16} />} label="Verify" />
        <Step active={step === 'payment'} done={paymentConfirmed} icon={<CreditCard size={16} />} label="Payment" />
      </div>

      {step === 'account' && (
        <form onSubmit={sendVerification} className="auth-form">
          <div className="form-group">
            <input type="text" placeholder="Username" className="form-control" value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} />
          </div>
          <div className="form-group">
            <input type="email" placeholder="Email address" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
          </div>
          <div className="form-group">
            <input type="password" placeholder="Password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
          <div className="form-group">
            <input type="password" placeholder="Confirm password" className="form-control" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn-primary auth-submit" disabled={loading}>{loading ? 'Sending...' : 'Send verification link'}</button>
        </form>
      )}

      {step === 'verify' && (
        <div className="signup-panel">
          <Mail size={34} />
          <h2>Check your email</h2>
          <p>{verificationMessage || `We sent a verification link to ${email}. Open it, then come back here.`}</p>
          <p className="verification-waiting">Waiting for verification. This page will continue automatically when you return.</p>
          <button type="button" className="btn-primary auth-submit" onClick={checkVerification}>Check verification</button>
          <button type="button" className="btn-secondary auth-submit" onClick={resendVerification}>Resend email</button>
          <button type="button" className="btn-secondary auth-submit" onClick={() => setStep('account')}>Edit email</button>
        </div>
      )}

      {step === 'payment' && (
        <div className="signup-panel payment-panel">
          <CreditCard size={34} />
          <h2>Complete payment</h2>
          <p>Pay the membership amount to this UPI ID, then confirm below.</p>
          <div className="upi-box">
            <span>PhonePe / UPI ID</span>
            <strong>{UPI_ID}</strong>
            <span>Amount</span>
            <strong>Rs. {PLAN_PRICE}</strong>
          </div>
          <a href={upiLink} className="btn-primary auth-submit">Pay with UPI app</a>
          <button type="button" className="btn-secondary auth-submit" onClick={() => setStep('verify')}>Back to verification</button>
          <label className="payment-confirm">
            <input type="checkbox" checked={paymentConfirmed} onChange={(event) => setPaymentConfirmed(event.target.checked)} />
            I have completed the payment
          </label>
          <button type="button" className="btn-primary auth-submit" disabled={loading || !paymentConfirmed} onClick={finishSignup}>
            {loading ? 'Creating Account...' : 'Start Membership'}
          </button>
          <p className="auth-demo-hint">This app records your confirmation only. Real automatic payment verification needs PhonePe/payment gateway API and webhook setup.</p>
        </div>
      )}
      <div className="auth-switch">
        <span>Already have an account?</span>
        <Link to="/login">Sign in now.</Link>
      </div>
    </AuthShell>
  );
};

const Step = ({ active, done, icon, label }) => (
  <div className={`signup-step ${active ? 'active' : ''} ${done ? 'done' : ''}`}>
    <span>{done ? <CheckCircle2 size={16} /> : icon}</span>
    {label}
  </div>
);

const firebaseErrorMessage = (err) => {
  switch (err.code) {
    case 'auth/email-already-in-use':
      return 'This email is already used in Firebase. Try signing in, or use another email.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters.';
    case 'auth/network-request-failed':
      return 'Firebase could not connect. Check internet connection.';
    default:
      return err.message || 'Could not send verification email.';
  }
};

export default Register;
