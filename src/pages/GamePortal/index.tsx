import { useState, useRef, useEffect } from 'react';
import {
  Typography, Grid, Modal, Form, Input, InputNumber,
  Button, Tabs, Alert, Steps, message, Tag,
} from 'antd';
import {
  LinkOutlined, DisconnectOutlined, PlusOutlined,
  CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined,
  ArrowUpOutlined, ArrowDownOutlined,
  EyeInvisibleOutlined, EyeOutlined, SafetyOutlined,
  GlobalOutlined, HistoryOutlined, AppstoreOutlined, ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { gamePlatforms, mockLinkedPlatforms, mockPlatformTransactions } from '../../mocks/games';
import { gamePortalApi } from '../../services/api';
import { USE_API } from '../../hooks/useApi';
import type { GamePlatform, LinkedPlatform, PlatformTransaction, PlatformCurrency, PlatformTxType } from '../../types';
import { USDTIcon } from '../../components/Icons';
import ExchangeRateBadge from '../../components/ExchangeRateBadge';
import { useExchangeRate, MIN_USDT, usdtToVnd } from '../../hooks/useExchangeRate';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const generateOTP = () => String(Math.floor(100_000 + Math.random() * 900_000));
const formatAmount = (amount: number, currency: PlatformCurrency) =>
  currency === 'VND' ? `${amount.toLocaleString('vi-VN')} ₫` : `${amount} USDT`;

const TX_CFG = {
  pending:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Đang xử lý', icon: <ClockCircleOutlined /> },
  completed: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',  label: 'Thành công',  icon: <CheckCircleOutlined /> },
  failed:    { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  label: 'Thất bại',    icon: <CloseCircleOutlined /> },
};

// ── OTP countdown ────────────────────────────────────────────
const OTPCountdown = ({ seconds, onExpire }: { seconds: number; onExpire: () => void }) => {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    if (remaining <= 0) { onExpire(); return; }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onExpire]);
  const color = remaining > 60 ? '#22c55e' : remaining > 30 ? '#f59e0b' : '#ef4444';
  const pct   = (remaining / seconds) * 100;
  const mm    = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss    = String(remaining % 60).padStart(2, '0');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <svg width={40} height={40} viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
        <circle cx="20" cy="20" r="16" fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${100.5 * pct / 100} 100.5`} strokeLinecap="round" strokeDashoffset="25.13"
          style={{ transition: 'stroke-dasharray 1s linear, stroke 0.5s' }} />
        <text x="20" y="24" textAnchor="middle" fontSize="9" fill={color} fontWeight="700">{mm}:{ss}</text>
      </svg>
      <div>
        <Text style={{ color, fontWeight: 600, fontSize: 14, display: 'block', lineHeight: 1.2 }}>{mm}:{ss}</Text>
        <Text style={{ color: '#4a5f73', fontSize: 11 }}>Hết hạn</Text>
      </div>
    </div>
  );
};

// ── Platform list row ────────────────────────────────────────
const PlatformRow = ({ platform, linked, onLink, onUnlink, onTransaction }: {
  platform: GamePlatform;
  linked: LinkedPlatform | undefined;
  onLink: (p: GamePlatform) => void;
  onUnlink: (p: GamePlatform) => void;
  onTransaction: (p: GamePlatform, type: PlatformTxType) => void;
}) => {
  const isLinked = !!linked;
  const dim      = !platform.isActive;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '14px 18px',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      opacity: dim ? 0.5 : 1,
      transition: 'background 0.15s',
    }}
      onMouseEnter={(e) => { if (!dim) (e.currentTarget as HTMLDivElement).style.background = '#1a2840'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
    >
      {/* Status dot */}
      <div style={{
        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
        background: !platform.isActive ? '#4a5f73' : isLinked ? '#22c55e' : '#243347',
        boxShadow: isLinked && platform.isActive ? '0 0 6px #22c55e' : 'none',
      }} />

      {/* Name + domain */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <Text style={{ color: '#e8edf5', fontWeight: 600, fontSize: 14 }}>{platform.name}</Text>
          {!platform.isActive && <Tag style={{ fontSize: 10, lineHeight: '16px', padding: '0 6px' }} color="warning">Bảo trì</Tag>}
          {isLinked && <Tag style={{ fontSize: 10, lineHeight: '16px', padding: '0 6px' }} color="success">Đã liên kết</Tag>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <GlobalOutlined style={{ color: '#4a5f73', fontSize: 11 }} />
          <Text style={{ color: '#4a5f73', fontSize: 12 }}>{platform.domain}</Text>
          <Text style={{ color: '#4a5f73', fontSize: 11 }}>·</Text>
          <Text style={{ color: '#4a5f73', fontSize: 11 }}>{platform.description}</Text>
        </div>
      </div>

      {/* Linked account info */}
      {isLinked && linked && (
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <Text style={{ color: '#e8edf5', fontSize: 12, display: 'block', fontFamily: "'JetBrains Mono', monospace" }}>
            {linked.apiKey}
          </Text>
          <Text style={{ color: '#4a5f73', fontSize: 11 }}>
            {dayjs(linked.linkedAt).format('DD/MM/YYYY')}
          </Text>
        </div>
      )}

      {/* Min limits */}
      <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
        <Text style={{ color: '#22c55e', fontSize: 11 }}>
          Nạp min: {platform.minDepositUsdt.toLocaleString()} USDT
        </Text>
        <Text style={{ color: '#ef4444', fontSize: 11 }}>
          Rút min: {platform.minWithdrawUsdt.toLocaleString()} USDT
        </Text>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {!platform.isActive ? (
          <Button size="small" disabled style={{ fontSize: 11 }}>Bảo trì</Button>
        ) : isLinked ? (
          <>
            <Button size="small" type="primary" icon={<ArrowDownOutlined />}
              onClick={() => onTransaction(platform, 'deposit')}
              style={{ background: 'linear-gradient(135deg,#16a34a,#052e16)', border: 'none', fontSize: 11 }}>
              Nạp
            </Button>
            <Button size="small" icon={<ArrowUpOutlined />}
              onClick={() => onTransaction(platform, 'withdraw')}
              style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.35)', fontSize: 11 }}>
              Rút
            </Button>
            <Button size="small" icon={<DisconnectOutlined />}
              onClick={() => onUnlink(platform)}
              style={{ color: '#4a5f73', borderColor: 'rgba(255,255,255,0.1)', fontSize: 11 }} />
          </>
        ) : (
          <Button size="small" icon={<LinkOutlined />}
            onClick={() => onLink(platform)}
            style={{ fontSize: 11 }}>
            Liên kết
          </Button>
        )}
      </div>
    </div>
  );
};

// ── Main page ────────────────────────────────────────────────
type TxStep = 'form' | 'otp' | 'success';

const GamePortalPage = () => {
  const screens  = useBreakpoint();
  const isMobile = !screens.md;
  const exRate   = useExchangeRate();
  const minVnd   = usdtToVnd(MIN_USDT, exRate.rate);

  const [platforms, setPlatforms]   = useState<GamePlatform[]>(gamePlatforms);
  const [linkedList, setLinkedList] = useState<LinkedPlatform[]>(mockLinkedPlatforms);
  const [txHistory, setTxHistory]   = useState<PlatformTransaction[]>(mockPlatformTransactions);

  useEffect(() => {
    if (!USE_API) return;
    gamePortalApi.platforms().then(setPlatforms).catch(() => {});
    gamePortalApi.myLinks().then(setLinkedList).catch(() => {});
    gamePortalApi.txHistory().then(setTxHistory).catch(() => {});
  }, []);

  // Link modal
  const [linkTarget, setLinkTarget] = useState<GamePlatform | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [linkForm] = Form.useForm();

  // Transaction modal
  const [txPlatform, setTxPlatform]     = useState<GamePlatform | null>(null);
  const [txType, setTxType]             = useState<PlatformTxType>('deposit');
  const [txCurrency, setTxCurrency]     = useState<PlatformCurrency>('VND');
  const [txStep, setTxStep]             = useState<TxStep>('form');
  const [txForm] = Form.useForm();
  const [currentOTP, setCurrentOTP]     = useState('');
  const [otpInput, setOtpInput]         = useState('');
  const [otpExpired, setOtpExpired]     = useState(false);
  const [txLoading, setTxLoading]       = useState(false);
  const [pendingTxData, setPendingTxData] = useState<{ userId: string; username: string; amount: number } | null>(null);
  const [finalTx, setFinalTx]           = useState<PlatformTransaction | null>(null);
  const otpKey = useRef(0);

  const getLinked = (platformId: string) => linkedList.find((l) => l.platformId === platformId);

  // ── Link ──
  const handleLink = async (values: { domain: string; apiKey: string }) => {
    if (!linkTarget) return;
    if (USE_API) {
      try {
        const link = await gamePortalApi.link({ platformId: linkTarget.id, domain: values.domain || linkTarget.domain, apiKey: values.apiKey });
        setLinkedList((p) => [...p, link]);
        message.success(`Đã liên kết ${linkTarget.name}!`);
        setLinkTarget(null); linkForm.resetFields();
      } catch (err) { message.error((err as Error).message); }
    } else {
      setLinkedList((p) => [...p, {
        id: `link-${Date.now()}`, userId: 'u1',
        platformId: linkTarget.id, platformName: linkTarget.name,
        domain: values.domain || linkTarget.domain,
        apiKey: `***${values.apiKey.slice(-4)}`,
        linkedAt: new Date().toISOString(), status: 'active',
      }]);
      message.success(`Đã liên kết ${linkTarget.name}!`);
      setLinkTarget(null); linkForm.resetFields();
    }
  };

  const handleUnlink = (platform: GamePlatform) => {
    Modal.confirm({
      title: `Hủy liên kết ${platform.name}?`,
      content: 'Bạn có thể liên kết lại bất cứ lúc nào.',
      okText: 'Hủy liên kết', okButtonProps: { danger: true }, cancelText: 'Đóng',
      onOk: async () => {
        if (USE_API) { try { await gamePortalApi.unlink(platform.id); } catch { /**/ } }
        setLinkedList((p) => p.filter((l) => l.platformId !== platform.id));
        message.info(`Đã hủy liên kết ${platform.name}`);
      },
    });
  };

  const openTxModal = (platform: GamePlatform, type: PlatformTxType) => {
    setTxPlatform(platform); setTxType(type); setTxStep('form');
    setTxCurrency('VND'); setOtpInput(''); setPendingTxData(null); setFinalTx(null);
    txForm.resetFields();
  };

  // ── Step 1 ──
  const handleTxFormSubmit = async (values: { userId: string; username: string; amount: number }) => {
    setPendingTxData(values);
    if (USE_API && txPlatform) {
      try {
        const res = await gamePortalApi.initTransaction({ platformId: txPlatform.id, type: txType, currency: txCurrency, userId: values.userId, username: values.username, amount: values.amount });
        setCurrentOTP(res.otp);
        message.info({ content: `OTP: ${res.otp} (${res.otpExpiresIn}s)`, duration: 6 });
      } catch (err) { message.error((err as Error).message); return; }
    } else {
      const otp = generateOTP();
      setCurrentOTP(otp);
      message.info({ content: `OTP: ${otp} (demo)`, duration: 6 });
    }
    setOtpExpired(false); setOtpInput('');
    otpKey.current += 1; setTxStep('otp');
  };

  // ── Step 2 ──
  const handleOTPVerify = async () => {
    if (otpExpired) { message.error('OTP đã hết hạn.'); return; }
    if (otpInput !== currentOTP) { message.error('OTP không đúng.'); return; }
    if (!txPlatform || !pendingTxData) return;
    setTxLoading(true);
    try {
      let tx: PlatformTransaction;
      if (USE_API) {
        tx = await gamePortalApi.confirmTransaction({ txId: `PTX${Date.now()}`, platformId: txPlatform.id, type: txType, currency: txCurrency, userId: pendingTxData.userId, username: pendingTxData.username, amount: pendingTxData.amount, otp: otpInput });
      } else {
        tx = { id: `PTX${Date.now()}`, platformId: txPlatform.id, platformName: txPlatform.name, type: txType, currency: txCurrency, amount: pendingTxData.amount, userId: pendingTxData.userId, username: pendingTxData.username, otp: currentOTP, status: 'completed', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      }
      setTxHistory((p) => [tx, ...p]);
      setFinalTx(tx); setTxStep('success');
    } catch (err) { message.error((err as Error).message); }
    finally { setTxLoading(false); }
  };

  const resetTxModal = () => {
    setTxPlatform(null); setTxStep('form'); setPendingTxData(null);
    setFinalTx(null); setOtpInput(''); txForm.resetFields();
  };

  // ── Render tx history rows ──
  const renderTxHistory = () => (
    <div>
      {txHistory.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#4a5f73' }}>Chưa có giao dịch</div>
      ) : txHistory.map((tx) => {
        const cfg = TX_CFG[tx.status];
        const isDeposit = tx.type === 'deposit';
        return (
          <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', transition: 'background 0.15s' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = '#1a2840')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}
          >
            {/* Type icon */}
            <div style={{
              width: 34, height: 34, borderRadius: 8, flexShrink: 0,
              background: isDeposit ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${isDeposit ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {isDeposit ? <ArrowDownOutlined style={{ color: '#22c55e', fontSize: 14 }} /> : <ArrowUpOutlined style={{ color: '#ef4444', fontSize: 14 }} />}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ color: '#e8edf5', fontWeight: 600, fontSize: 13, display: 'block' }}>
                {tx.platformName} · {tx.username}
              </Text>
              <Text style={{ color: '#4a5f73', fontSize: 11 }}>
                {tx.userId} · {dayjs(tx.createdAt).format('DD/MM/YYYY HH:mm')}
              </Text>
            </div>

            {/* Amount */}
            <Text style={{ color: isDeposit ? '#22c55e' : '#ef4444', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
              {isDeposit ? '+' : '-'}{formatAmount(tx.amount, tx.currency)}
            </Text>

            {/* Status */}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: cfg.bg, color: cfg.color,
              borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 600,
              flexShrink: 0,
            }}>
              {cfg.icon} {cfg.label}
            </span>
          </div>
        );
      })}
    </div>
  );

  // ── TX form ──
  const renderTxForm = () => {
    if (!txPlatform) return null;
    const isDeposit = txType === 'deposit';
    const minVND  = isDeposit ? Math.max(txPlatform.minDeposit, minVnd)      : Math.max(txPlatform.minWithdraw, minVnd);
    const minUSDT = isDeposit ? Math.max(txPlatform.minDepositUsdt, MIN_USDT) : Math.max(txPlatform.minWithdrawUsdt, MIN_USDT);

    return (
      <>
        <Steps current={0} size="small" style={{ marginBottom: 24 }}
          items={[{ title: 'Thông tin' }, { title: 'OTP' }, { title: 'Xong' }]} />

        {/* Currency */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {(['VND', 'USDT'] as const).map((cur) => (
            <button key={cur} type="button"
              onClick={() => { setTxCurrency(cur); txForm.setFieldValue('amount', undefined); }}
              style={{
                background: txCurrency === cur ? 'rgba(79,142,247,0.12)' : '#1e2d40',
                border: `1.5px solid ${txCurrency === cur ? '#4f8ef7' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 10, padding: '10px 0',
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {cur === 'USDT' ? <USDTIcon size={18} /> : <span style={{ color: txCurrency === cur ? '#4f8ef7' : '#7a8fa6', fontWeight: 700 }}>₫</span>}
              <Text style={{ color: txCurrency === cur ? '#4f8ef7' : '#7a8fa6', fontWeight: 600 }}>{cur}</Text>
            </button>
          ))}
        </div>

        <Form form={txForm} layout="vertical" onFinish={handleTxFormSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item label="ID người dùng" name="userId" rules={[{ required: true, message: 'Nhập User ID' }]}>
              <Input size="large" placeholder="User ID" />
            </Form.Item>
            <Form.Item label="Tên đăng nhập" name="username" rules={[{ required: true, message: 'Nhập username' }]}>
              <Input size="large" placeholder="Username" />
            </Form.Item>
          </div>

          <Form.Item
            label={txCurrency === 'VND'
              ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span>Số tiền (VND)</span><ExchangeRateBadge {...exRate} /></div>
              : `Số tiền (USDT)`}
            name="amount"
            rules={[{ required: true, message: 'Nhập số tiền' }, { type: 'number', min: txCurrency === 'VND' ? minVND : minUSDT, message: txCurrency === 'VND' ? `Tối thiểu ${minVND.toLocaleString('vi-VN')} ₫` : `Tối thiểu ${minUSDT.toLocaleString()} USDT` }]}
          >
            <InputNumber<number> size="large" style={{ width: '100%' }} placeholder="0"
              min={txCurrency === 'VND' ? minVND : minUSDT}
              step={txCurrency === 'VND' ? 50_000 : 1}
              formatter={txCurrency === 'VND' ? (v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : undefined}
              parser={txCurrency === 'VND' ? (v) => Number(v?.replace(/,/g, '') || 0) as number : undefined}
              addonAfter={<span style={{ color: '#7a8fa6', fontSize: 12 }}>{txCurrency}</span>}
            />
          </Form.Item>

          <Alert type={isDeposit ? 'success' : 'warning'} showIcon style={{ marginBottom: 16 }}
            message={isDeposit
              ? 'Tiền sẽ được nạp trực tiếp vào tài khoản sau khi xác thực OTP.'
              : 'Kiểm tra kỹ User ID trước khi rút. Không thể hủy sau khi xác nhận OTP.'} />

          <Button type="primary" htmlType="submit" block size="large" icon={<SafetyOutlined />}
            style={{ height: 50, fontWeight: 700, background: isDeposit ? 'linear-gradient(135deg,#16a34a,#052e16)' : 'linear-gradient(135deg,#ef4444,#7f1d1d)', border: 'none' }}>
            Tạo OTP xác thực
          </Button>
        </Form>
      </>
    );
  };

  // ── OTP step ──
  const renderOTPStep = () => (
    <>
      <Steps current={1} size="small" style={{ marginBottom: 24 }}
        items={[{ title: 'Thông tin' }, { title: 'OTP' }, { title: 'Xong' }]} />

      {pendingTxData && txPlatform && (
        <div style={{ background: '#1e2d40', borderRadius: 12, padding: 16, marginBottom: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            ['Nhà cái', txPlatform.name],
            ['Loại', txType === 'deposit' ? '↓ Nạp' : '↑ Rút'],
            ['User ID', pendingTxData.userId],
            ['Tài khoản', pendingTxData.username],
            ['Số tiền', formatAmount(pendingTxData.amount, txCurrency)],
          ].map(([label, value]) => (
            <div key={label as string}>
              <Text style={{ color: '#4a5f73', fontSize: 11, display: 'block' }}>{label}</Text>
              <Text style={{ color: '#e8edf5', fontWeight: 600, fontSize: 13 }}>{value}</Text>
            </div>
          ))}
        </div>
      )}

      {/* OTP display */}
      <div style={{ background: 'linear-gradient(135deg,rgba(79,142,247,0.08),rgba(79,142,247,0.04))', border: '1px solid rgba(79,142,247,0.2)', borderRadius: 14, padding: 20, marginBottom: 20, textAlign: 'center' }}>
        <Text style={{ color: '#7a8fa6', fontSize: 12, display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mã OTP</Text>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 14 }}>
          {currentOTP.split('').map((digit, i) => (
            <div key={i} style={{ width: isMobile ? 36 : 44, height: isMobile ? 44 : 54, background: '#182230', border: '1px solid rgba(79,142,247,0.3)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f8ef7', fontSize: isMobile ? 20 : 26, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>
              {digit}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <OTPCountdown key={otpKey.current} seconds={120} onExpire={() => setOtpExpired(true)} />
        </div>
        {otpExpired && (
          <Button size="small" icon={<ReloadOutlined />} style={{ marginTop: 10 }}
            onClick={() => { const otp = generateOTP(); setCurrentOTP(otp); setOtpExpired(false); setOtpInput(''); otpKey.current += 1; message.info(`OTP mới: ${otp}`); }}>
            Tạo OTP mới
          </Button>
        )}
      </div>

      <Input size="large" value={otpInput} onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
        placeholder="______" maxLength={6} onPressEnter={handleOTPVerify}
        style={{ textAlign: 'center', letterSpacing: '0.4em', fontSize: 22, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", height: 58, marginBottom: 16 }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
        <Button size="large" onClick={() => setTxStep('form')} style={{ height: 50 }}>← Quay lại</Button>
        <Button type="primary" size="large" onClick={handleOTPVerify} loading={txLoading}
          disabled={otpInput.length < 6 || otpExpired} style={{ height: 50, fontWeight: 700 }}>
          Xác nhận giao dịch
        </Button>
      </div>
    </>
  );

  // ── Success ──
  const renderSuccess = () => {
    if (!finalTx || !txPlatform) return null;
    const isDeposit = finalTx.type === 'deposit';
    return (
      <>
        <Steps current={2} size="small" style={{ marginBottom: 24 }}
          items={[{ title: 'Thông tin' }, { title: 'OTP' }, { title: 'Xong' }]} />
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <div style={{ width: 68, height: 68, borderRadius: '50%', margin: '0 auto 16px', background: isDeposit ? 'linear-gradient(135deg,#052e16,#14532d)' : 'linear-gradient(135deg,#2d0a0a,#450a0a)', border: `2px solid ${isDeposit ? '#22c55e' : '#ef4444'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircleOutlined style={{ color: isDeposit ? '#22c55e' : '#ef4444', fontSize: 32 }} />
          </div>
          <Title level={4} style={{ color: '#e8edf5', margin: '0 0 6px' }}>{isDeposit ? 'Nạp thành công!' : 'Rút thành công!'}</Title>
          <Text style={{ color: '#7a8fa6', display: 'block', marginBottom: 24 }}>{txPlatform.name} · {finalTx.username}</Text>
          <div style={{ background: '#1e2d40', borderRadius: 12, padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20, textAlign: 'left' }}>
            {[['Mã GD', finalTx.id], ['Số tiền', formatAmount(finalTx.amount, finalTx.currency)], ['User ID', finalTx.userId], ['OTP', finalTx.otp]].map(([l, v]) => (
              <div key={l as string}>
                <Text style={{ color: '#4a5f73', fontSize: 11, display: 'block' }}>{l}</Text>
                <Text style={{ color: '#e8edf5', fontWeight: 600, fontSize: 13, fontFamily: (l === 'Mã GD' || l === 'OTP') ? "'JetBrains Mono', monospace" : 'inherit' }}>{v}</Text>
              </div>
            ))}
          </div>
          <Button type="primary" block size="large" onClick={resetTxModal} style={{ height: 46, fontWeight: 600 }}>Đóng</Button>
        </div>
      </>
    );
  };

  // ── Main render ──
  const linkedCount = linkedList.length;

  return (
    <div>
      <div className="page-header">
        <div>
          <Title level={4} style={{ color: '#e8edf5', margin: 0 }}>
            <AppstoreOutlined style={{ marginRight: 8 }} />Cổng game
          </Title>
          <p style={{ color: '#7a8fa6', margin: '4px 0 0', fontSize: 13 }}>
            Liên kết nhà cái · Nạp rút qua USDT & VND · Xác thực OTP
          </p>
        </div>
        <span style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 12, padding: '3px 14px', fontWeight: 700, fontSize: 13 }}>
          {linkedCount} liên kết
        </span>
      </div>

      <Tabs items={[
        {
          key: 'platforms',
          label: <span><AppstoreOutlined /> Nhà cái ({platforms.length})</span>,
          children: (
            <div style={{ background: '#182230', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '10px 18px', background: '#1a2840', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ width: 8 }} />
                <Text style={{ color: '#4a5f73', fontSize: 11, fontWeight: 700, flex: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nhà cái</Text>
                <Text style={{ color: '#4a5f73', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', width: 160, textAlign: 'right' }}>Hạn mức</Text>
                <Text style={{ color: '#4a5f73', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', width: 140, textAlign: 'center' }}>Thao tác</Text>
              </div>

              {platforms.map((p) => (
                <PlatformRow key={p.id} platform={p} linked={getLinked(p.id)}
                  onLink={setLinkTarget} onUnlink={handleUnlink} onTransaction={openTxModal} />
              ))}

              {/* Add custom */}
              <div
                onClick={() => setLinkTarget({ id: 'custom', name: '', domain: '', logo: '', currency: ['VND', 'USDT'], isActive: true, description: '', minDeposit: 0, minWithdraw: 0, minDepositUsdt: 0, minWithdrawUsdt: 0 })}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', cursor: 'pointer', color: '#4a5f73', transition: 'background 0.15s' }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = '#1a2840')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}
              >
                <PlusOutlined style={{ fontSize: 14 }} />
                <Text style={{ color: '#4a5f73', fontSize: 13 }}>Thêm nhà cái khác...</Text>
              </div>
            </div>
          ),
        },
        {
          key: 'history',
          label: <span><HistoryOutlined /> Lịch sử ({txHistory.length})</span>,
          children: (
            <div style={{ background: '#182230', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 16, padding: '10px 18px', background: '#1a2840', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <Text style={{ color: '#4a5f73', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Giao dịch</Text>
                <Text style={{ color: '#4a5f73', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Số tiền</Text>
                <Text style={{ color: '#4a5f73', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Trạng thái</Text>
              </div>
              {renderTxHistory()}
            </div>
          ),
        },
      ]} />

      {/* ── Link modal ── */}
      <Modal open={!!linkTarget} onCancel={() => { setLinkTarget(null); linkForm.resetFields(); }} footer={null}
        title={<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(79,142,247,0.15)', border: '1px solid rgba(79,142,247,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LinkOutlined style={{ color: '#4f8ef7' }} /></div><span>Liên kết {linkTarget?.name || 'nhà cái'}</span></div>}
        centered width={420}>
        <Alert message="API Key được mã hóa và lưu an toàn." type="info" showIcon style={{ marginBottom: 20 }} />
        <Form form={linkForm} layout="vertical" onFinish={handleLink}>
          <Form.Item label="Domain nhà cái" name="domain" initialValue={linkTarget?.domain} rules={[{ required: true, message: 'Nhập domain' }]}>
            <Input size="large" placeholder="vd: sunwin.com" prefix={<GlobalOutlined style={{ color: '#4a5f73' }} />} />
          </Form.Item>
          <Form.Item label="API Key" name="apiKey" rules={[{ required: true, message: 'Nhập API Key' }, { min: 8, message: 'Tối thiểu 8 ký tự' }]}>
            <Input size="large" type={showApiKey ? 'text' : 'password'} placeholder="Nhập API Key từ nhà cái"
              suffix={<button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4a5f73', display: 'flex', alignItems: 'center' }} onClick={() => setShowApiKey(!showApiKey)}>
                {showApiKey ? <EyeOutlined /> : <EyeInvisibleOutlined />}
              </button>} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large" icon={<LinkOutlined />} style={{ height: 48, fontWeight: 700 }}>
            Xác nhận liên kết
          </Button>
        </Form>
      </Modal>

      {/* ── Transaction modal ── */}
      <Modal open={!!txPlatform}
        onCancel={txStep === 'success' ? resetTxModal : () => {
          Modal.confirm({ title: 'Hủy giao dịch?', content: 'Dữ liệu sẽ mất.', okText: 'Hủy GD', okButtonProps: { danger: true }, cancelText: 'Tiếp tục', onOk: resetTxModal });
        }}
        footer={null} maskClosable={txStep === 'success'}
        title={txPlatform && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: txType === 'deposit' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', border: `1px solid ${txType === 'deposit' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {txType === 'deposit' ? <ArrowDownOutlined style={{ color: '#22c55e' }} /> : <ArrowUpOutlined style={{ color: '#ef4444' }} />}
            </div>
            <span>{txType === 'deposit' ? 'Nạp tiền' : 'Rút tiền'} · {txPlatform.name}</span>
          </div>
        )}
        centered width={460}
      >
        {txStep === 'form'    && renderTxForm()}
        {txStep === 'otp'     && renderOTPStep()}
        {txStep === 'success' && renderSuccess()}
      </Modal>
    </div>
  );
};

export default GamePortalPage;
