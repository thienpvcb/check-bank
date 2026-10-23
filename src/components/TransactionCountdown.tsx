import { useState, useEffect, useCallback } from 'react';
import { Tag } from 'antd';
import { ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, SyncOutlined } from '@ant-design/icons';
import { transactionApi } from '../services/api';
import { USE_API } from '../hooks/useApi';

interface Props {
  txId: string;
  expiresAt: string;          // ISO string
  timeoutMinutes: number;
  onStatusChange?: (status: string) => void;
}

const TransactionCountdown = ({ txId, expiresAt, timeoutMinutes, onStatusChange }: Props) => {
  const [remaining, setRemaining] = useState(0);
  const [status, setStatus] = useState<'pending' | 'completed' | 'expired' | 'failed'>('pending');
  const [polling, setPolling] = useState(false);

  // Tính remaining từ expiresAt
  useEffect(() => {
    const calc = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      setRemaining(Math.max(0, Math.floor(diff / 1000)));
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);

  // Poll status từ backend mỗi 15 giây
  const poll = useCallback(async () => {
    if (!USE_API || status === 'completed' || status === 'expired' || status === 'failed') return;
    setPolling(true);
    try {
      const data = await transactionApi.poll(txId);
      if (data.status !== 'pending') {
        setStatus(data.status as typeof status);
        onStatusChange?.(data.status);
      }
    } catch { /* ignore */ }
    finally { setPolling(false); }
  }, [txId, status, onStatusChange]);

  useEffect(() => {
    const t = setInterval(poll, 15_000);
    return () => clearInterval(t);
  }, [poll]);

  // Auto-expire khi đếm ngược về 0
  useEffect(() => {
    if (remaining === 0 && status === 'pending') {
      setStatus('expired');
      onStatusChange?.('expired');
    }
  }, [remaining, status, onStatusChange]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  const pct = (remaining / (timeoutMinutes * 60)) * 100;

  if (status === 'completed') return (
    <Tag icon={<CheckCircleOutlined />} color="success" style={{ fontSize: 13, padding: '4px 12px' }}>
      Giao dịch đã xác nhận
    </Tag>
  );

  if (status === 'expired' || status === 'failed') return (
    <Tag icon={<CloseCircleOutlined />} color="error" style={{ fontSize: 13, padding: '4px 12px' }}>
      {status === 'expired' ? 'Giao dịch đã hết hạn' : 'Giao dịch thất bại'}
    </Tag>
  );

  const color = pct > 50 ? '#22c55e' : pct > 25 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {/* Circular countdown */}
      <div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0 }}>
        <svg width="52" height="52" viewBox="0 0 52 52">
          <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
          <circle
            cx="26" cy="26" r="22" fill="none" stroke={color} strokeWidth="3"
            strokeDasharray={`${138.2 * pct / 100} 138.2`}
            strokeLinecap="round"
            transform="rotate(-90 26 26)"
            style={{ transition: 'stroke-dasharray 1s linear, stroke 0.5s' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {polling
            ? <SyncOutlined spin style={{ color, fontSize: 12 }} />
            : <ClockCircleOutlined style={{ color, fontSize: 13 }} />}
        </div>
      </div>

      <div>
        <div style={{ color, fontWeight: 700, fontSize: 20, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.2 }}>
          {mm}:{ss}
        </div>
        <div style={{ color: '#7a8fa6', fontSize: 11 }}>
          Hết hạn sau · Đang chờ xác nhận
        </div>
      </div>
    </div>
  );
};

export default TransactionCountdown;
