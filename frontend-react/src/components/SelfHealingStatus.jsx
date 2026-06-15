import React, { useEffect, useState } from 'react';
import { RefreshCw, ShieldCheck, WifiOff } from 'lucide-react';

const SelfHealingStatus = () => {
  const [state, setState] = useState({ status: 'healthy', detail: '' });

  useEffect(() => {
    const handleStatus = (event) => {
      const next = event.detail || { status: 'healthy', detail: '' };
      setState(next);
      if (next.status === 'healthy') {
        window.clearTimeout(window.__selfHealingTimer);
        window.__selfHealingTimer = window.setTimeout(() => {
          setState({ status: 'hidden', detail: '' });
        }, 1400);
      }
    };

    window.addEventListener('self-healing-status', handleStatus);
    return () => window.removeEventListener('self-healing-status', handleStatus);
  }, []);

  if (state.status === 'hidden' || state.status === 'healthy') return null;

  const failed = state.status === 'failed';
  return (
    <div style={bannerStyle}>
      <span style={iconStyle}>
        {failed ? <WifiOff size={18} /> : <RefreshCw size={18} className="spin" />}
      </span>
      <span>
        <strong style={titleStyle}>{failed ? 'Self-healing paused' : 'Self-healing active'}</strong>
        <span style={detailStyle}>{failed ? 'Start backend on port 8080, then refresh.' : state.detail || 'Recovering connection...'}</span>
      </span>
      {!failed && <ShieldCheck size={18} style={{ marginLeft: 'auto', color: '#46d369' }} />}
    </div>
  );
};

const bannerStyle = {
  position: 'fixed',
  left: '50%',
  bottom: 24,
  transform: 'translateX(-50%)',
  zIndex: 9998,
  width: 'min(520px, calc(100vw - 28px))',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  background: 'rgba(12,12,12,0.94)',
  border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 8,
  padding: '12px 14px',
  color: '#fff',
  boxShadow: '0 18px 50px rgba(0,0,0,0.55)',
  backdropFilter: 'blur(14px)',
};
const iconStyle = { color: 'var(--netflix-red)', display: 'flex', flexShrink: 0 };
const titleStyle = { display: 'block', fontSize: '0.88rem' };
const detailStyle = { display: 'block', color: '#9f9f9f', fontSize: '0.78rem', marginTop: 2 };

export default SelfHealingStatus;
