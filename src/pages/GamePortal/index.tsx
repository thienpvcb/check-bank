import { useState, useRef, useEffect } from 'react';
import {
  Typography, Grid, Modal, Form, Input, InputNumber,
  Button, Tabs, Alert, Steps, message,
} from 'antd';
import {
  LinkOutlined, DisconnectOutlined, PlusOutlined,
  CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined,
  ArrowUpOutlined, ArrowDownOutlined, EyeInvisibleOutlined,
  EyeOutlined, SafetyOutlined, GlobalOutlined, HistoryOutlined,
  AppstoreOutlined, ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  gamePlatforms, mockLinkedPlatforms, mockPlatformTransactions,
} from '../../mocks/games';
import type {
  GamePlatform, LinkedPlatform, PlatformTransaction,
  PlatformCurrency, PlatformTxType,
} from '../../types';
import { USDTIcon } from '../../components/Icons';
import ExchangeRateBadge from '../../components/ExchangeRateBadge';
import { useExchangeRate, MIN_USDT, usdtToVnd } from '../../hooks/useExchangeRate';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

// ── helpers ─────────────────────────────────────────────────
const generateOTP = () => String(Math.floor(100_000 + Math.random() * 900_000));

const formatAmount = (amount: number, currency: PlatformCurrency) =>
  currency === 'VND'
    ? `${amount.toLocaleString('vi-VN')} ₫`
    : `${amount} USDT`;

const TX_STATUS_CFG = {
  pending:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  label: 'Đang xử lý', icon: <ClockCircleOutlined /> },
  completed: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   label: 'Thành công',  icon: <CheckCircleOutlined /> },
  failed:    { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   label: 'Thất bại',    icon: <CloseCircleOutlined /> },
};

// ────────────────────────────────────────────────────────────
// OTP Countdown component
// ────────────────────────────────────────────────────────────
const OTPCountdown = ({ seconds, onExpire }: { seconds: number; onExpire: () => void }) => {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    if (remaining <= 0) { onExpire(); return; }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onExpire]);

  const pct = (remaining / seconds) * 100;
  const color = remaining > 60 ? '#22c55e' : remaining > 30 ? '#f59e0b' : '#ef4444';
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {/* Circle progress */}
      <svg width={40} height={40} viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
        <circle
          cx="20" cy="20" r="16" fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${100.5 * pct / 100} 100.5`}
          strokeLinecap="round" strokeDashoffset="25.13"
          style={{ transition: 'stroke-dasharray 1s linear, stroke 0.5s' }}
        />
        <text x="20" y="24" textAnchor="middle" fontSize="9" fill={color} fontWeight="700">
          {mm}:{ss}
        </text>
      </svg>
      <div>
        <Text style={{ color, fontWeight: 600, fontSize: 14, display: 'block', lineHeight: 1.2 }}>
          {mm}:{ss}
        </Text>
        <Text style={{ color: '#4a5f73', fontSize: 11 }}>Hết hạn</Text>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// Platform card
// ────────────────────────────────────────────────────────────
const PlatformCard = ({
  platform, linked,
  onLink, onUnlink, onTransaction,
}: {
  platform: GamePlatform;
  linked: LinkedPlatform | undefined;
  onLink: (p: GamePlatform) => void;
  onUnlink: (p: GamePlatform) => void;
  onTransaction: (p: GamePlatform, type: PlatformTxType) => void;
}) => {
  const isLinked = !!linked;

  return (
    <div style={{
      background: '#182230',
      border: `1px solid ${isLinked ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 14, overflow: 'hidden',
      opacity: platform.isActive ? 1 : 0.55,
      transition: 'box-shadow 0.2s, transform 0.2s',
    }}
      onMouseEnter={(e) => { if (platform.isActive) { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)'; } }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = ''; (e.currentTarget as HTMLDivElement).style.transform = ''; }}
    >
      {/* Header */}
      <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img
              src={platform.logo} alt={platform.name}
              style={{ width: 44, height: 44, borderRadius: 10 }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div>
              <Text style={{ color: '#e8edf5', fontWeight: 700, fontSize: 15, display: 'block' }}>
                {platform.name}
              </Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <GlobalOutlined style={{ color: '#4a5f73', fontSize: 11 }} />
                <Text style={{ color: '#4a5f73', fontSize: 12 }}>{platform.domain}</Text>
              </div>
            </div>
          </div>
          {/* Status badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: isLinked ? 'rgba(34,197,94,0.1)' : !platform.isActive ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${isLinked ? 'rgba(34,197,94,0.25)' : !platform.isActive ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 20, padding: '3px 10px',
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: isLinked ? '#22c55e' : !platform.isActive ? '#f59e0b' : '#4a5f73',
              boxShadow: isLinked ? '0 0 5px #22c55e' : 'none',
            }} />
            <Text style={{ fontSize: 11, fontWeight: 600, color: isLinked ? '#22c55e' : !platform.isActive ? '#f59e0b' : '#4a5f73' }}>
              {isLinked ? 'Đã liên kết' : !platform.isActive ? 'Bảo trì' : 'Chưa liên kết'}
            </Text>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '12px 18px 16px' }}>
        <Text style={{ color: '#4a5f73', fontSize: 12, display: 'block', marginBottom: 12 }}>
          {platform.description}
        </Text>

        {/* Min limits */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <div style={{ flex: 1, background: '#1e2d40', borderRadius: 8, padding: '8px 10px' }}>
            <Text style={{ color: '#4a5f73', fontSize: 10, textTransform: 'uppercase', display: 'block' }}>Nạp tối thiểu</Text>
            <Text style={{ color: '#22c55e', fontSize: 12, fontWeight: 600 }}>
              {platform.minDeposit.toLocaleString('vi-VN')} ₫
            </Text>
            <Text style={{ color: '#4a5f73', fontSize: 11 }}> / {platform.minDepositUsdt} USDT</Text>
          </div>
          <div style={{ flex: 1, background: '#1e2d40', borderRadius: 8, padding: '8px 10px' }}>
            <Text style={{ color: '#4a5f73', fontSize: 10, textTransform: 'uppercase', display: 'block' }}>Rút tối thiểu</Text>
            <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: 600 }}>
              {platform.minWithdraw.toLocaleString('vi-VN')} ₫
            </Text>
            <Text style={{ color: '#4a5f73', fontSize: 11 }}> / {platform.minWithdrawUsdt} USDT</Text>
          </div>
        </div>

        {/* Linked info */}
        {isLinked && linked && (
          <div style={{
            background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.12)',
            borderRadius: 8, padding: '8px 12px', marginBottom: 12,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <Text style={{ color: '#4a5f73', fontSize: 10, display: 'block' }}>API Key</Text>
              <Text style={{ color: '#7a8fa6', fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
                {linked.apiKey}
              </Text>
            </div>
            <Text style={{ color: '#4a5f73', fontSize: 11 }}>
              {dayjs(linked.linkedAt).format('DD/MM/YYYY')}
            </Text>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          {!platform.isActive ? (
            <Button disabled block size="small" style={{ height: 34 }}>Đang bảo trì</Button>
          ) : isLinked ? (
            <>
              <Button
                type="primary" size="small" icon={<ArrowDownOutlined />}
                onClick={() => onTransaction(platform, 'deposit')}
                style={{ flex: 1, height: 34, fontWeight: 600, fontSize: 12, background: 'linear-gradient(135deg,#16a34a,#052e16)', border: 'none' }}
              >
                Nạp
              </Button>
              <Button
                size="small" icon={<ArrowUpOutlined />}
                onClick={() => onTransaction(platform, 'withdraw')}
                style={{ flex: 1, height: 34, fontWeight: 600, fontSize: 12, color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
              >
                Rút
              </Button>
              <Button
                size="small" icon={<DisconnectOutlined />}
                onClick={() => onUnlink(platform)}
                style={{ height: 34, color: '#4a5f73', borderColor: 'rgba(255,255,255,0.1)' }}
              />
            </>
          ) : (
            <Button
              block size="small" icon={<LinkOutlined />}
              onClick={() => onLink(platform)}
              style={{ height: 34, fontWeight: 600, fontSize: 12 }}
            >
              Liên kết nhà cái
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// Main Page
// ────────────────────────────────────────────────────────────
type TxStep = 'form' | 'otp' | 'success';

const GamePortalPage = () => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const exRate = useExchangeRate();
  const minVnd = usdtToVnd(MIN_USDT, exRate.rate);

  const [linkedList, setLinkedList] = useState<LinkedPlatform[]>(mockLinkedPlatforms);
  const [txHistory, setTxHistory] = useState<PlatformTransaction[]>(mockPlatformTransactions);

  // Link modal
  const [linkTarget, setLinkTarget] = useState<GamePlatform | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [linkForm] = Form.useForm();

  // Transaction modal
  const [txPlatform, setTxPlatform] = useState<GamePlatform | null>(null);
  const [txType, setTxType] = useState<PlatformTxType>('deposit');
  const [txCurrency, setTxCurrency] = useState<PlatformCurrency>('VND');
  const [txStep, setTxStep] = useState<TxStep>('form');
  const [txForm] = Form.useForm();
  const [currentOTP, setCurrentOTP] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpExpired, setOtpExpired] = useState(false);
  const [txLoading, setTxLoading] = useState(false);
  const [pendingTxData, setPendingTxData] = useState<{ userId: string; username: string; amount: number } | null>(null);
  const [finalTx, setFinalTx] = useState<PlatformTransaction | null>(null);
  const otpKey = useRef(0); // force OTPCountdown remount

  const getLinked = (platformId: string) => linkedList.find((l) => l.platformId === platformId);

  // ── Link platform ──
  const handleLink = (values: { domain: string; apiKey: string }) => {
    if (!linkTarget) return;
    const newLink: LinkedPlatform = {
      id: `link-${Date.now()}`,
      platformId: linkTarget.id,
      platformName: linkTarget.name,
      domain: values.domain || linkTarget.domain,
      apiKey: `${linkTarget.id.slice(0, 2)}_live_*************${values.apiKey.slice(-4)}`,
      linkedAt: new Date().toISOString(),
      status: 'active',
    };
    setLinkedList((p) => [...p, newLink]);
    message.success(`Đã liên kết ${linkTarget.name} thành công!`);
    setLinkTarget(null);
    linkForm.resetFields();
  };

  const handleUnlink = (platform: GamePlatform) => {
    Modal.confirm({
      title: `Hủy liên kết ${platform.name}?`,
      content: 'Sau khi hủy liên kết, bạn sẽ không thể nạp/rút qua nhà cái này cho đến khi liên kết lại.',
      okText: 'Hủy liên kết', okButtonProps: { danger: true },
      cancelText: 'Đóng',
      onOk: () => {
        setLinkedList((p) => p.filter((l) => l.platformId !== platform.id));
        message.info(`Đã hủy liên kết ${platform.name}`);
      },
    });
  };

  // ── Open transaction modal ──
  const openTxModal = (platform: GamePlatform, type: PlatformTxType) => {
    setTxPlatform(platform);
    setTxType(type);
    setTxStep('form');
    setTxCurrency('VND');
    setOtpInput('');
    setPendingTxData(null);
    setFinalTx(null);
    txForm.resetFields();
  };

  // ── Step 1: submit form → generate OTP ──
  const handleTxFormSubmit = (values: { userId: string; username: string; amount: number }) => {
    setPendingTxData(values);
    const otp = generateOTP();
    setCurrentOTP(otp);
    setOtpExpired(false);
    setOtpInput('');
    otpKey.current += 1;
    setTxStep('otp');
    // In real system OTP would be sent to email/SMS
    message.info({ content: `OTP đã được tạo: ${otp} (hiển thị cho demo)`, duration: 6 });
  };

  // ── Step 2: verify OTP → complete ──
  const handleOTPVerify = () => {
    if (otpExpired) { message.error('OTP đã hết hạn. Vui lòng tạo lại.'); return; }
    if (otpInput !== currentOTP) { message.error('OTP không đúng. Thử lại.'); return; }

    setTxLoading(true);
    setTimeout(() => {
      if (!txPlatform || !pendingTxData) return;
      const tx: PlatformTransaction = {
        id: `PTX${Date.now()}`,
        platformId: txPlatform.id,
        platformName: txPlatform.name,
        type: txType,
        currency: txCurrency,
        amount: pendingTxData.amount,
        userId: pendingTxData.userId,
        username: pendingTxData.username,
        otp: currentOTP,
        status: 'completed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTxHistory((p) => [tx, ...p]);
      setFinalTx(tx);
      setTxStep('success');
      setTxLoading(false);
    }, 800);
  };

  const resetTxModal = () => {
    setTxPlatform(null);
    setTxStep('form');
    setPendingTxData(null);
    setFinalTx(null);
    setOtpInput('');
    txForm.resetFields();
  };

  // ────────────────────────────────────────
  // Render helpers
  // ────────────────────────────────────────
  const colCount = isMobile ? 1 : screens.xl ? 3 : 2;

  const renderStepDots = () => (
    <Steps
      current={txStep === 'form' ? 0 : txStep === 'otp' ? 1 : 2}
      size="small"
      style={{ marginBottom: 24 }}
      items={[
        { title: 'Thông tin' },
        { title: 'Xác thực OTP' },
        { title: 'Hoàn thành' },
      ]}
    />
  );

  const renderTxForm = () => {
    if (!txPlatform) return null;
    const isDeposit = txType === 'deposit';
    const minVND = isDeposit ? Math.max(txPlatform.minDeposit, minVnd) : Math.max(txPlatform.minWithdraw, minVnd);
    const minUSDT = isDeposit ? Math.max(txPlatform.minDepositUsdt, MIN_USDT) : Math.max(txPlatform.minWithdrawUsdt, MIN_USDT);

    return (
      <>
        {renderStepDots()}

        {/* Currency selector */}
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
            <Form.Item label="ID người dùng" name="userId"
              rules={[{ required: true, message: 'Nhập User ID' }]}
            >
              <Input size="large" placeholder="User ID trên nhà cái" />
            </Form.Item>
            <Form.Item label="Tên đăng nhập" name="username"
              rules={[{ required: true, message: 'Nhập username' }]}
            >
              <Input size="large" placeholder="Username" />
            </Form.Item>
          </div>

          <Form.Item
            label={
              txCurrency === 'VND'
                ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>Số tiền {isDeposit ? 'nạp' : 'rút'} (VND)</span>
                    <ExchangeRateBadge {...exRate} />
                  </div>
                : `Số ${isDeposit ? 'nạp' : 'rút'} (USDT)`
            }
            name="amount"
            rules={[
              { required: true, message: 'Nhập số tiền' },
              {
                type: 'number',
                min: txCurrency === 'VND' ? minVND : minUSDT,
                message: txCurrency === 'VND'
                  ? `Tối thiểu ${minVND.toLocaleString('vi-VN')} ₫ (= ${MIN_USDT.toLocaleString()} USDT)`
                  : `Tối thiểu ${minUSDT.toLocaleString()} USDT`,
              },
            ]}
          >
            <InputNumber<number>
              size="large" style={{ width: '100%' }}
              placeholder="0"
              min={txCurrency === 'VND' ? minVND : minUSDT}
              step={txCurrency === 'VND' ? 50_000 : 1}
              formatter={txCurrency === 'VND' ? (v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : undefined}
              parser={txCurrency === 'VND' ? (v) => Number(v?.replace(/,/g, '') || 0) as number : undefined}
              addonAfter={<span style={{ color: '#7a8fa6', fontSize: 12 }}>{txCurrency}</span>}
            />
          </Form.Item>

          <Alert
            type={isDeposit ? 'success' : 'warning'}
            message={isDeposit
              ? 'Tiền sẽ được nạp trực tiếp vào tài khoản người dùng trên nhà cái sau khi xác thực OTP.'
              : 'Kiểm tra kỹ User ID trước khi rút. Giao dịch không thể hủy sau khi xác nhận OTP.'}
            showIcon style={{ marginBottom: 16 }}
          />

          <Button
            type="primary" htmlType="submit" block size="large"
            icon={<SafetyOutlined />}
            style={{
              height: 50, fontWeight: 700, fontSize: 15,
              background: isDeposit
                ? 'linear-gradient(135deg,#16a34a,#052e16)'
                : 'linear-gradient(135deg,#ef4444,#7f1d1d)',
              border: 'none',
            }}
          >
            Tạo OTP xác thực
          </Button>
        </Form>
      </>
    );
  };

  const renderOTPStep = () => (
    <>
      {renderStepDots()}

      {/* Summary */}
      {pendingTxData && txPlatform && (
        <div style={{
          background: '#1e2d40', borderRadius: 12, padding: '16px',
          marginBottom: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
        }}>
          {[
            ['Nhà cái', txPlatform.name],
            ['Loại GD', txType === 'deposit' ? '↓ Nạp tiền' : '↑ Rút tiền'],
            ['User ID', pendingTxData.userId],
            ['Tài khoản', pendingTxData.username],
            ['Số tiền', formatAmount(pendingTxData.amount, txCurrency)],
          ].map(([label, value]) => (
            <div key={label}>
              <Text style={{ color: '#4a5f73', fontSize: 11, display: 'block' }}>{label}</Text>
              <Text style={{ color: label === 'Số tiền' ? (txType === 'deposit' ? '#22c55e' : '#ef4444') : '#e8edf5', fontWeight: 600, fontSize: 13 }}>
                {value}
              </Text>
            </div>
          ))}
        </div>
      )}

      {/* OTP display */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(79,142,247,0.08), rgba(79,142,247,0.04))',
        border: '1px solid rgba(79,142,247,0.2)',
        borderRadius: 14, padding: '20px', marginBottom: 20, textAlign: 'center',
      }}>
        <Text style={{ color: '#7a8fa6', fontSize: 12, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Mã OTP xác thực
        </Text>
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 14,
        }}>
          {currentOTP.split('').map((digit, i) => (
            <div key={i} style={{
              width: isMobile ? 38 : 46, height: isMobile ? 46 : 56,
              background: '#182230', border: '1px solid rgba(79,142,247,0.3)',
              borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#4f8ef7', fontSize: isMobile ? 20 : 26, fontWeight: 800,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {digit}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <OTPCountdown key={otpKey.current} seconds={120} onExpire={() => setOtpExpired(true)} />
        </div>
        {otpExpired && (
          <Button
            size="small" icon={<ReloadOutlined />}
            onClick={() => {
              const otp = generateOTP();
              setCurrentOTP(otp);
              setOtpExpired(false);
              setOtpInput('');
              otpKey.current += 1;
              message.info(`OTP mới: ${otp}`);
            }}
            style={{ marginTop: 10 }}
          >
            Tạo OTP mới
          </Button>
        )}
      </div>

      {/* OTP input */}
      <div style={{ marginBottom: 16 }}>
        <Text style={{ color: '#7a8fa6', fontSize: 12, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Nhập mã OTP để xác nhận
        </Text>
        <Input
          size="large"
          value={otpInput}
          onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="______"
          maxLength={6}
          style={{
            textAlign: 'center', letterSpacing: '0.4em',
            fontSize: 22, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace",
            height: 58,
          }}
          onPressEnter={handleOTPVerify}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
        <Button size="large" onClick={() => setTxStep('form')} style={{ height: 50 }}>
          ← Quay lại
        </Button>
        <Button
          type="primary" size="large" onClick={handleOTPVerify}
          loading={txLoading}
          disabled={otpInput.length < 6 || otpExpired}
          style={{ height: 50, fontWeight: 700, fontSize: 15 }}
        >
          Xác nhận giao dịch
        </Button>
      </div>
    </>
  );

  const renderSuccess = () => {
    if (!finalTx || !txPlatform) return null;
    const isDeposit = finalTx.type === 'deposit';

    return (
      <>
        {renderStepDots()}
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', margin: '0 auto 16px',
            background: isDeposit ? 'linear-gradient(135deg,#052e16,#14532d)' : 'linear-gradient(135deg,#2d0a0a,#450a0a)',
            border: `2px solid ${isDeposit ? '#22c55e' : '#ef4444'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CheckCircleOutlined style={{ color: isDeposit ? '#22c55e' : '#ef4444', fontSize: 34 }} />
          </div>
          <Title level={4} style={{ color: '#e8edf5', margin: '0 0 6px' }}>
            {isDeposit ? 'Nạp tiền thành công!' : 'Rút tiền thành công!'}
          </Title>
          <Text style={{ color: '#7a8fa6', display: 'block', marginBottom: 24 }}>
            {txPlatform.name} · {finalTx.username}
          </Text>

          <div style={{
            background: '#1e2d40', borderRadius: 12, padding: '16px',
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20, textAlign: 'left',
          }}>
            {[
              ['Mã GD', finalTx.id],
              ['Số tiền', formatAmount(finalTx.amount, finalTx.currency)],
              ['User ID', finalTx.userId],
              ['OTP dùng', finalTx.otp],
            ].map(([label, value]) => (
              <div key={label}>
                <Text style={{ color: '#4a5f73', fontSize: 11, display: 'block' }}>{label}</Text>
                <Text style={{ color: '#e8edf5', fontWeight: 600, fontSize: 13, fontFamily: label === 'OTP dùng' || label === 'Mã GD' ? "'JetBrains Mono', monospace" : 'inherit' }}>
                  {value}
                </Text>
              </div>
            ))}
          </div>

          <Button type="primary" block size="large" onClick={resetTxModal} style={{ height: 46, fontWeight: 600 }}>
            Đóng
          </Button>
        </div>
      </>
    );
  };

  // ── TX History ──
  const renderHistory = () => (
    <div>
      {txHistory.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#4a5f73' }}>Chưa có giao dịch</div>
      ) : txHistory.map((tx) => {
        const cfg = TX_STATUS_CFG[tx.status];
        const isDeposit = tx.type === 'deposit';
        return (
          <div key={tx.id} style={{
            background: '#182230', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12, padding: '14px 16px', marginBottom: 10,
            display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
          }}>
            {/* Icon */}
            <div style={{
              width: 44, height: 44, borderRadius: 10, flexShrink: 0,
              background: isDeposit ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${isDeposit ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {isDeposit
                ? <ArrowDownOutlined style={{ color: '#22c55e', fontSize: 18 }} />
                : <ArrowUpOutlined   style={{ color: '#ef4444', fontSize: 18 }} />}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <Text style={{ color: '#e8edf5', fontWeight: 600, fontSize: 14 }}>{tx.platformName}</Text>
                <Text style={{ color: '#4a5f73', fontSize: 11 }}>·</Text>
                <Text style={{ color: '#7a8fa6', fontSize: 12 }}>{tx.username}</Text>
                <Text style={{ color: '#4a5f73', fontSize: 11 }}>({tx.userId})</Text>
              </div>
              <Text style={{ color: '#4a5f73', fontSize: 12 }}>
                {dayjs(tx.createdAt).format('DD/MM/YYYY HH:mm')} · OTP: <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#7a8fa6' }}>{tx.otp}</span>
              </Text>
            </div>

            {/* Amount & status */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <Text style={{
                color: isDeposit ? '#22c55e' : '#ef4444',
                fontWeight: 700, fontSize: 16, display: 'block',
              }}>
                {isDeposit ? '+' : '-'}{formatAmount(tx.amount, tx.currency)}
              </Text>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: cfg.bg, color: cfg.color,
                borderRadius: 6, padding: '2px 10px', fontSize: 11, fontWeight: 600,
              }}>
                {cfg.icon} {cfg.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div>
          <Title level={4} style={{ color: '#e8edf5', margin: 0 }}>
            <AppstoreOutlined style={{ marginRight: 8 }} />
            Cổng game
          </Title>
          <p style={{ color: '#7a8fa6', margin: '4px 0 0', fontSize: 13 }}>
            Liên kết nhà cái · Nạp rút qua USDT & VND · Xác thực OTP
          </p>
        </div>
        <span style={{
          background: 'rgba(34,197,94,0.1)', color: '#22c55e',
          border: '1px solid rgba(34,197,94,0.2)',
          borderRadius: 12, padding: '3px 14px', fontWeight: 700, fontSize: 13,
        }}>
          {linkedList.length} liên kết
        </span>
      </div>

      <Tabs activeKey="platforms" items={[
        {
          key: 'platforms',
          label: <span><AppstoreOutlined /> Nhà cái ({gamePlatforms.length})</span>,
          children: (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${colCount}, 1fr)`, gap: 14 }}>
              {gamePlatforms.map((p) => (
                <PlatformCard
                  key={p.id} platform={p}
                  linked={getLinked(p.id)}
                  onLink={setLinkTarget}
                  onUnlink={handleUnlink}
                  onTransaction={openTxModal}
                />
              ))}

              {/* Add custom */}
              <div
                onClick={() => setLinkTarget({ id: 'custom', name: '', domain: '', logo: '', currency: ['VND', 'USDT'], isActive: true, description: '', minDeposit: 0, minWithdraw: 0, minDepositUsdt: 0, minWithdrawUsdt: 0 })}
                style={{
                  background: '#182230', border: '2px dashed rgba(255,255,255,0.08)',
                  borderRadius: 14, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 10,
                  padding: '32px 16px', cursor: 'pointer', transition: 'border-color 0.2s',
                  minHeight: 200,
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = '#4f8ef7')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.08)')}
              >
                <PlusOutlined style={{ fontSize: 28, color: '#4a5f73' }} />
                <Text style={{ color: '#4a5f73', fontSize: 13 }}>Thêm nhà cái khác</Text>
              </div>
            </div>
          ),
        },
        {
          key: 'history',
          label: <span><HistoryOutlined /> Lịch sử ({txHistory.length})</span>,
          children: renderHistory(),
        },
      ]} />

      {/* ── Link modal ── */}
      <Modal
        open={!!linkTarget}
        onCancel={() => { setLinkTarget(null); linkForm.resetFields(); }}
        footer={null}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(79,142,247,0.15)', border: '1px solid rgba(79,142,247,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LinkOutlined style={{ color: '#4f8ef7' }} />
            </div>
            <span>Liên kết {linkTarget?.name || 'nhà cái'}</span>
          </div>
        }
        centered width={440}
      >
        <Alert
          message="API Key được mã hóa và lưu trữ an toàn. Không chia sẻ với bất kỳ ai."
          type="info" showIcon style={{ marginBottom: 20 }}
        />
        <Form form={linkForm} layout="vertical" onFinish={handleLink}>
          <Form.Item label="Domain nhà cái" name="domain"
            initialValue={linkTarget?.domain}
            rules={[{ required: true, message: 'Nhập domain' }]}
          >
            <Input size="large" placeholder="vd: sunwin.com"
              prefix={<GlobalOutlined style={{ color: '#4a5f73' }} />}
            />
          </Form.Item>
          <Form.Item label="API Key" name="apiKey"
            rules={[{ required: true, message: 'Nhập API Key' }, { min: 8, message: 'API Key tối thiểu 8 ký tự' }]}
          >
            <Input
              size="large"
              type={showApiKey ? 'text' : 'password'}
              placeholder="Nhập API Key từ nhà cái"
              suffix={
                <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4a5f73', display: 'flex', alignItems: 'center' }}
                  onClick={() => setShowApiKey(!showApiKey)}>
                  {showApiKey ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                </button>
              }
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large" icon={<LinkOutlined />}
            style={{ height: 48, fontWeight: 700 }}>
            Xác nhận liên kết
          </Button>
        </Form>
      </Modal>

      {/* ── Transaction modal ── */}
      <Modal
        open={!!txPlatform}
        onCancel={txStep === 'success' ? resetTxModal : () => {
          Modal.confirm({
            title: 'Hủy giao dịch?', content: 'Dữ liệu đã nhập sẽ bị mất.',
            okText: 'Hủy GD', okButtonProps: { danger: true }, cancelText: 'Tiếp tục',
            onOk: resetTxModal,
          });
        }}
        footer={null}
        title={
          txPlatform && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: txType === 'deposit' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                border: `1px solid ${txType === 'deposit' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {txType === 'deposit'
                  ? <ArrowDownOutlined style={{ color: '#22c55e' }} />
                  : <ArrowUpOutlined   style={{ color: '#ef4444' }} />}
              </div>
              <span>{txType === 'deposit' ? 'Nạp tiền' : 'Rút tiền'} · {txPlatform.name}</span>
            </div>
          )
        }
        centered width={480}
        maskClosable={txStep === 'success'}
      >
        {txStep === 'form'    && renderTxForm()}
        {txStep === 'otp'     && renderOTPStep()}
        {txStep === 'success' && renderSuccess()}
      </Modal>
    </div>
  );
};

export default GamePortalPage;
