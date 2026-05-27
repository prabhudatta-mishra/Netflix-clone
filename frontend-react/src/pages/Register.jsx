import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import AuthShell from '../components/AuthShell';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const toast = useToast();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    setLoading(true);
    const result = await register(username, email, password);
    setLoading(false);
    if (result.success) {
      toast?.success?.('Welcome to Netflix!');
      navigate('/profiles');
    } else {
      setError(result.error);
      toast?.error?.(result.error);
    }
  };

  return (
    <AuthShell title="Sign Up">
      {error && <div className="auth-error">{error}</div>}
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <input type="text" placeholder="Username" className="form-control" value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} />
        </div>
        <div className="form-group">
          <input type="email" placeholder="Email address" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="form-group">
          <input type="password" placeholder="Password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </div>
        <div className="form-group">
          <input type="password" placeholder="Confirm password" className="form-control" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
        </div>
        <button type="submit" className="btn-primary auth-submit" disabled={loading}>
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>
      <div className="auth-switch">
        <span>Already have an account?</span>
        <Link to="/login">Sign in now.</Link>
      </div>
    </AuthShell>
  );
};

export default Register;
