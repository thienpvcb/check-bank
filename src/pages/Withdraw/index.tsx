import { useState, useEffect } from 'react';
import {
  Form, Input, InputNumber, Select, Button, Typography, Alert,
  Modal, Descriptions, Grid, Tag, message, Switch, Tooltip,
} from 'antd';
import {
  WalletOutlined, BankOutlined, ExclamationCircleOutlined,
  CheckCircleOutlined, FallOutlined, InfoCircleOutlined,
  SwapOutlined, HistoryOutlined, AppstoreOutlined, UserOutlined,
  BookOutlined, FormOutlined,
} from '@ant-design/icons';
import { CryptoIcon, BankIcon, CryptoSymbolIcon } from '../../components/Icons';
import ExchangeRateBadge from '../../components/ExchangeRateBadge';
import { useNavigate } from 'react-router-dom';
import { cryptoAssets } from '../../mocks/crypto';
import { getActiveBanks } from '../../mocks/banks';
import { gamePlatforms } from '../../mocks/games';
import { referenceApi, transactionApi, profileApi } from '../../services/api';
import { USE_API } from '../../hooks/useApi';
import type { CryptoAsset, Bank, UserBankAccount } from '../../types';
import { useExchangeRate, MIN_USDT, usdtToVnd } from '../../hooks/useExchangeRate';

// Mock saved banks for USE_API=false
const MOCK_SAVED_BANKS: UserBankAccount[] = [
  {
    id: 'ba1',
    userId: 'u1',
    bankCode: 'VCB',
    bankName: 'Vietcombank',
    accountNumber: '1234567890',
    accountName: 'NGUYEN VAN DEMO',
    isDefault: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
];

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

type Method = 'crypto' | 'bank';
type BankInputMode = 'saved' | 'manual';

interface WithdrawResult {
  transactionId: string;
  amount: number;
  currency: string;
  fee: number;
  estimatedTime: string;
}

const WithdrawPage = () => {
  const [form] = Form.useForm();
  const [result, setResult] = useState<WithdrawResult | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState('USDT');
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [method, setMethod] = useState<Method>('crypto');
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<Record<string, unknown> | null>(null);
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const navigate = useNavigate();
  const exRate = useExchangeRate();
  const minVnd = usdtToVnd(MIN_USDT, exRate.rate);

  const [allCrypto, setAllCrypto] = useState<CryptoAsset[]>(cryptoAssets);
  const [allBanks, setAllBanks]   = useState<Bank[]>(getActiveBanks());
  const [forPlatform, setForPlatform] = useState(false);

  // ── Saved bank accounts ──────────────────────────────────────
  const [bankInputMode, setBankInputMode] = useState<BankInputMode>('saved');
  const [savedBanks, setSavedBanks]       = useState<UserBankAccount[]>([]);

  useEffect(() => {
    if (!USE_API) return;
    referenceApi.crypto().then(setAllCrypto).catch(() => {});
    referenceApi.banks().then(setAllBanks).catch(() => {});
  }, []);

  // Load saved banks on mount (always, so option is available)
  useEffect(() => {
    if (USE_API) {
      profileApi.getBanks().then(setSavedBanks).catch(() => {});
    } else {
      setSavedBanks(MOCK_SAVED_BANKS);
    }
  }, []);

  const banks   = allBanks;
  const symbols = [...new Set(allCrypto.map((a) => a.symbol))];
  const getNetworks = (sym: string) => allCrypto.filter((a) => a.symbol === sym);
  const currentAsset = allCrypto.find((a) => a.symbol === selectedSymbol && a.network === selectedNetwork);
  const activePlatforms = gamePlatforms.filter((p) => p.isActive);

  // ── Platform section (dùng chung) ──
  const renderPlatformSection = () => (
    <div style={{
      background: '#1e2d40',
      border: `1px solid ${forPlatform ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 10, padding: '14px 16px', marginBottom: 16,
      transition: 'border-color 0.2s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: forPlatform ? 16 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <AppstoreOutlined style={{ color: forPlatform ? '#ef4444' : '#4a5f73' }} />
          <Text style={{ color: '#e8edf5', fontSize: 13, fontWeight: 500 }}>Rút từ nhà cái</Text>
          <Text style={{ color: '#4a5f73', fontSize: 11 }}>(tuỳ chọn)</Text>
        </div>
        <Switch
          checked={forPlatform}
          onChange={(v) => {
            setForPlatform(v);
            if (!v) { form.setFieldValue('platformId', undefined); form.setFieldValue('gameUserId', undefined); }
          }}
          size="small"
        />
      </div>
      {forPlatform && (
        <>
          <Form.Item label="Chọn nhà cái" name="platformId"
            rules={[{ required: true, message: 'Chọn nhà cái' }]}
            style={{ marginBottom: 12 }}
          >
            <Select size="large" placeholder="Chọn nhà cái muốn rút"
              options={activePlatforms.map((p) => ({
                value: p.id,
                label: (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img src={p.logo} alt={p.name} style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'contain' }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: '#7a8fa6' }}>{p.domain}</div>
                    </div>
                  </div>
                ),
              }))}
            />
          </Form.Item>
          <Form.Item label="ID tài khoản trong nhà cái" name="gameUserId"
            rules={[{ required: true, message: 'Nhập ID tài khoản nhà cái' }]}
            style={{ marginBottom: 0 }}
          >
            <Input size="large" placeholder="VD: user123456"
              prefix={<UserOutlined style={{ color: '#4a5f73' }} />}
            />
          </Form.Item>
        </>
      )}
    </div>
  );

  const handleFormSubmit = (values: Record<string, unknown>) => {
    setPendingValues(values);
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!pendingValues) return;
    setLoading(true);
    try {
      const pv = pendingValues;
      if (USE_API) {
        if (method === 'crypto') {
          const tx = await transactionApi.withdrawCrypto({
            symbol: pv.symbol as string,
            network: pv.network as string,
            address: pv.address as string,
            amount: pv.amount as number,
          });
          const asset = allCrypto.find((a) => a.symbol === pv.symbol && a.network === pv.network);
          setResult({ transactionId: tx.id, amount: tx.amount, currency: tx.currency, fee: asset?.withdrawFee || 0, estimatedTime: pv.network === 'BTC' ? '30–60 phút' : '5–15 phút' });
        } else {
          const tx = await transactionApi.withdrawBank({
            bankCode: pv.bankCode as string,
            accountNumber: pv.accountNumber as string,
            accountName: pv.accountName as string,
            amount: pv.amount as number,
          });
          setResult({ transactionId: tx.id, amount: tx.amount, currency: 'VND', fee: 0, estimatedTime: '5–30 phút' });
        }
      } else {
        if (method === 'crypto') {
          const asset = allCrypto.find((a) => a.symbol === pv.symbol && a.network === pv.network);
          setResult({ transactionId: `WD${Date.now()}`, amount: pv.amount as number, currency: pv.symbol as string, fee: asset?.withdrawFee || 0, estimatedTime: pv.network === 'BTC' ? '30–60 phút' : '5–15 phút' });
        } else {
          setResult({ transactionId: `WD${Date.now()}`, amount: pv.amount as number, currency: 'VND', fee: 0, estimatedTime: '5–30 phút' });
        }
      }
      setConfirmOpen(false);
      setPendingValues(null);
    } catch (err) {
      message.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    form.resetFields();
    setResult(null);
    setSelectedSymbol('USDT');
    setSelectedNetwork('');
    setBankInputMode('saved');
  };

  // ---- Success screen ----
  if (result) {
    return (
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <div style={{ background: '#182230', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: isMobile ? 24 : 40, textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, #052e16, #14532d)',
            border: '2px solid #22c55e',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <CheckCircleOutlined style={{ fontSize: 36, color: '#22c55e' }} />
          </div>
          <Title level={4} style={{ color: '#e8edf5', margin: '0 0 8px' }}>
            Yêu cầu đã gửi thành công!
          </Title>
          <Text style={{ color: '#7a8fa6', display: 'block', marginBottom: 28 }}>
            Giao dịch đang được xử lý
          </Text>

          <div className="info-box" style={{ textAlign: 'left', marginBottom: 24 }}>
            {[
              ['Mã giao dịch', result.transactionId],
              ['Số tiền rút', `${result.amount} ${result.currency}`],
              ['Phí giao dịch', result.fee ? `${result.fee} ${result.currency}` : 'Miễn phí'],
              ['Thực nhận', result.fee ? `${result.amount - result.fee} ${result.currency}` : `${result.amount} ${result.currency}`],
              ['Thời gian dự kiến', result.estimatedTime],
            ].map(([label, value]) => (
              <div className="info-row" key={String(label)}>
                <span className="info-label">{label}</span>
                <span className="info-value">{value}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Button size="large" onClick={resetAll} style={{ height: 46 }}>
              Rút tiền mới
            </Button>
            <Button type="primary" size="large" icon={<HistoryOutlined />}
              onClick={() => navigate('/history')} style={{ height: 46, fontWeight: 600 }}>
              Lịch sử
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ---- Confirm modal ----
  const renderConfirm = () => {
    if (!pendingValues) return null;
    const isCrypto = method === 'crypto';
    const pv = pendingValues as Record<string, string | number>;

    return (
      <Modal
        open={confirmOpen}
        onCancel={() => { setConfirmOpen(false); setPendingValues(null); }}
        onOk={handleConfirm}
        confirmLoading={loading}
        okText="Xác nhận rút tiền"
        cancelText="Hủy"
        okButtonProps={{ danger: true, size: 'large', style: { fontWeight: 600 } }}
        cancelButtonProps={{ size: 'large' }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ExclamationCircleOutlined style={{ color: '#ef4444', fontSize: 18 }} />
            </div>
            <span>Xác nhận rút tiền</span>
          </div>
        }
        width={isMobile ? '95vw' : 460}
        centered
      >
        <Alert
          message="Kiểm tra kỹ trước khi xác nhận. Giao dịch không thể hủy sau khi duyệt."
          type="error" showIcon style={{ marginBottom: 16 }}
        />
        {/* Platform info nếu có */}
        {pv.platformId && (
          <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AppstoreOutlined style={{ color: '#ef4444' }} />
              <Text style={{ color: '#ef4444', fontWeight: 600 }}>
                {activePlatforms.find((p) => p.id === pv.platformId)?.name}
              </Text>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Text style={{ color: '#7a8fa6', fontSize: 11, display: 'block' }}>ID nhà cái</Text>
              <Text style={{ color: '#e8edf5', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{pv.gameUserId}</Text>
            </div>
          </div>
        )}
        <Descriptions column={1} bordered size="small">
          {isCrypto ? (
            <>
              <Descriptions.Item label="Loại tiền"><Tag color="gold">{pv.symbol}</Tag></Descriptions.Item>
              <Descriptions.Item label="Mạng lưới"><Tag color="blue">{pv.network}</Tag></Descriptions.Item>
              <Descriptions.Item label="Địa chỉ ví">
                <Text style={{ wordBreak: 'break-all', fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: '#4f8ef7' }}>
                  {pv.address}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Số lượng">
                <Text strong style={{ color: '#ef4444', fontSize: 16 }}>
                  {pv.amount} {pv.symbol}
                </Text>
              </Descriptions.Item>
            </>
          ) : (
            <>
              <Descriptions.Item label="Ngân hàng">
                {banks.find((b) => b.code === pv.bankCode)?.shortName}
              </Descriptions.Item>
              <Descriptions.Item label="Số tài khoản">{pv.accountNumber}</Descriptions.Item>
              <Descriptions.Item label="Chủ tài khoản">{pv.accountName}</Descriptions.Item>
              <Descriptions.Item label="Số tiền">
                <Text strong style={{ color: '#ef4444', fontSize: 16 }}>
                  {Number(pv.amount).toLocaleString('vi-VN')} VND
                </Text>
              </Descriptions.Item>
            </>
          )}
        </Descriptions>
      </Modal>
    );
  };

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <Title level={4} style={{ color: '#e8edf5', margin: 0 }}>
            <FallOutlined style={{ color: '#ef4444', marginRight: 8 }} />
            Rút tiền
          </Title>
          <p style={{ color: '#7a8fa6', margin: '4px 0 0', fontSize: 13 }}>
            Rút tiền về ví crypto hoặc tài khoản ngân hàng
          </p>
        </div>
      </div>

      {/* Method selector */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
        {[
          { key: 'crypto' as Method, label: 'Tiền ảo (Crypto)', sub: 'USDT, BTC, ETH...' },
          { key: 'bank'   as Method, label: 'Ngân hàng VN',     sub: 'Về tài khoản ngân hàng' },
        ].map(({ key, label, sub }) => (
          <div
            key={key}
            className={`method-card${method === key ? ' active' : ''}`}
            onClick={() => { setMethod(key); form.resetFields(); setSelectedSymbol('USDT'); setSelectedNetwork(''); setBankInputMode('saved'); }}
          >
            <div className="method-card-icon" style={{
              background: key === 'crypto' ? 'rgba(245,158,11,0.12)' : 'rgba(79,142,247,0.12)',
            }}>
              {key === 'crypto'
                ? <CryptoIcon size={22} />
                : <BankIcon size={22} />}
            </div>
            <div style={{ minWidth: 0 }}>
              <Text style={{ color: '#e8edf5', fontWeight: 600, fontSize: isMobile ? 13 : 14, display: 'block' }}>
                {label}
              </Text>
              <Text style={{ color: '#7a8fa6', fontSize: 11 }}>{sub}</Text>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: '#182230', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: isMobile ? 16 : 24 }}>
        <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
          {method === 'crypto' ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Form.Item label="Loại tiền" name="symbol" initialValue="USDT" rules={[{ required: true }]}>
                  <Select size="large"
                    onChange={(v) => { setSelectedSymbol(v); setSelectedNetwork(''); form.setFieldValue('network', undefined); }}
                    options={symbols.map((s) => ({
                      value: s,
                      label: (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <CryptoSymbolIcon symbol={s} size={18} />
                          <span>{s}</span>
                        </div>
                      ),
                    }))}
                  />
                </Form.Item>
                <Form.Item label="Mạng lưới" name="network" rules={[{ required: true, message: 'Chọn mạng' }]}>
                  <Select size="large" placeholder="Network" disabled={!selectedSymbol}
                    onChange={(v) => setSelectedNetwork(v)}
                    options={getNetworks(selectedSymbol).map((a) => ({
                      value: a.network,
                      label: (
                        <div>
                          <div style={{ fontWeight: 600 }}>{a.network}</div>
                          <div style={{ fontSize: 11, color: '#7a8fa6' }}>Phí: {a.withdrawFee} {a.symbol}</div>
                        </div>
                      ),
                    }))}
                  />
                </Form.Item>
              </div>

              <Form.Item label="Địa chỉ ví nhận" name="address"
                rules={[{ required: true, message: 'Nhập địa chỉ ví' }, { min: 20, message: 'Địa chỉ không hợp lệ' }]}
              >
                <Input size="large" placeholder="Dán địa chỉ ví tại đây..."
                  style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}
                  suffix={<WalletOutlined style={{ color: '#4a5f73' }} />}
                />
              </Form.Item>

              <Form.Item label={`Số lượng ${selectedSymbol}`} name="amount"
                rules={[
                  { required: true, message: 'Nhập số lượng' },
                  { type: 'number', min: currentAsset?.minWithdraw || 0, message: `Tối thiểu ${currentAsset?.minWithdraw || 0} ${selectedSymbol}` },
                ]}
              >
                <InputNumber size="large" style={{ width: '100%' }}
                  placeholder="0.00" min={currentAsset?.minWithdraw || 0} step={0.001}
                  addonAfter={<span style={{ color: '#7a8fa6' }}>{selectedSymbol}</span>}
                />
              </Form.Item>

              {currentAsset && (
                <div style={{ background: '#1e2d40', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ color: '#7a8fa6', fontSize: 12 }}>Số lượng tối thiểu</Text>
                    <Text style={{ color: '#e8edf5', fontSize: 12 }}>{currentAsset.minWithdraw} {selectedSymbol}</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text style={{ color: '#7a8fa6', fontSize: 12 }}>Phí rút</Text>
                    <Text style={{ color: '#f59e0b', fontSize: 12 }}>{currentAsset.withdrawFee} {selectedSymbol}</Text>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* ── Saved / Manual selector ── */}
              {savedBanks.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                    {([
                      { key: 'saved' as BankInputMode, label: 'Ngân hàng đã lưu', icon: <BookOutlined /> },
                      { key: 'manual' as BankInputMode, label: 'Nhập thủ công',    icon: <FormOutlined /> },
                    ] as { key: BankInputMode; label: string; icon: React.ReactNode }[]).map(({ key, label, icon }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setBankInputMode(key);
                          form.setFieldsValue({ bankCode: undefined, accountNumber: undefined, accountName: undefined });
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          padding: '10px 12px',
                          borderRadius: 10,
                          border: `1px solid ${bankInputMode === key ? 'rgba(79,142,247,0.5)' : 'rgba(255,255,255,0.08)'}`,
                          background: bankInputMode === key ? 'rgba(79,142,247,0.1)' : 'transparent',
                          color: bankInputMode === key ? '#4f8ef7' : '#7a8fa6',
                          cursor: 'pointer',
                          fontSize: 13,
                          fontWeight: bankInputMode === key ? 600 : 400,
                          transition: 'all 0.2s',
                        }}
                      >
                        {icon}
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Saved bank dropdown */}
                  {bankInputMode === 'saved' && (
                    <div style={{
                      background: '#1e2d40',
                      border: '1px solid rgba(79,142,247,0.2)',
                      borderRadius: 10,
                      padding: '12px 14px',
                      marginBottom: 4,
                    }}>
                      <div style={{ color: '#7a8fa6', fontSize: 12, marginBottom: 8 }}>Chọn tài khoản đã lưu:</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {savedBanks.map((acc) => {
                          const isSelected =
                            form.getFieldValue('bankCode') === acc.bankCode &&
                            form.getFieldValue('accountNumber') === acc.accountNumber;
                          return (
                            <Tooltip key={acc.id} title="Click để điền tự động" placement="right">
                              <div
                                onClick={() => {
                                  form.setFieldsValue({
                                    bankCode:      acc.bankCode,
                                    accountNumber: acc.accountNumber,
                                    accountName:   acc.accountName,
                                  });
                                }}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 12,
                                  padding: '10px 12px',
                                  borderRadius: 8,
                                  border: `1px solid ${isSelected ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.07)'}`,
                                  background: isSelected ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.02)',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s',
                                }}
                              >
                                <img
                                  src={`https://api.vietqr.io/img/${acc.bankCode}.png`}
                                  alt={acc.bankName}
                                  style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'contain', background: '#fff', padding: 2, flexShrink: 0 }}
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ color: '#e8edf5', fontWeight: 600, fontSize: 13 }}>{acc.bankName}</div>
                                  <div style={{ color: '#4f8ef7', fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>
                                    •••• {acc.accountNumber.slice(-4)}
                                  </div>
                                  <div style={{ color: '#7a8fa6', fontSize: 11 }}>{acc.accountName}</div>
                                </div>
                                {acc.isDefault && (
                                  <Tag color="success" style={{ fontSize: 10, lineHeight: '16px', padding: '0 5px', flexShrink: 0 }}>
                                    Mặc định
                                  </Tag>
                                )}
                                {isSelected && (
                                  <CheckCircleOutlined style={{ color: '#22c55e', fontSize: 16, flexShrink: 0 }} />
                                )}
                              </div>
                            </Tooltip>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Form.Item label="Chọn ngân hàng" name="bankCode" rules={[{ required: true, message: 'Chọn ngân hàng' }]}>
                <Select size="large" placeholder="Ngân hàng của bạn"
                  options={banks.map((b) => ({
                    value: b.code,
                    label: (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img src={b.logo} alt={b.shortName} style={{ width: 22, height: 22, borderRadius: 4, objectFit: 'contain' }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <span>{b.shortName}</span>
                      </div>
                    ),
                  }))}
                />
              </Form.Item>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Form.Item label="Số tài khoản" name="accountNumber"
                  rules={[{ required: true, message: 'Nhập STK' }, { pattern: /^\d{6,20}$/, message: 'STK không hợp lệ' }]}
                >
                  <Input size="large" placeholder="Số tài khoản"
                    suffix={<BankOutlined style={{ color: '#4a5f73' }} />}
                  />
                </Form.Item>
                <Form.Item label="Tên chủ tài khoản" name="accountName"
                  rules={[{ required: true, message: 'Nhập tên CTK' }]}
                >
                  <Input size="large" placeholder="NGUYEN VAN A"
                    style={{ textTransform: 'uppercase' }}
                    onChange={(e) => form.setFieldValue('accountName', e.target.value.toUpperCase())}
                  />
                </Form.Item>
              </div>

              <Form.Item
                label={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>Số tiền rút (VND)</span>
                    <ExchangeRateBadge {...exRate} />
                  </div>
                }
                name="amount"
                rules={[
                  { required: true, message: 'Nhập số tiền' },
                  { type: 'number', min: minVnd, message: `Tối thiểu ${minVnd.toLocaleString('vi-VN')} ₫ (= ${MIN_USDT.toLocaleString()} USDT)` },
                ]}
              >
                <InputNumber<number> size="large" style={{ width: '100%' }}
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(v) => Number(v?.replace(/,/g, '') || 0) as number}
                  placeholder="0" min={minVnd} step={minVnd}
                  addonAfter={<span style={{ color: '#7a8fa6' }}>VND</span>}
                />
              </Form.Item>

              <div style={{ background: '#1e2d40', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
                {[
                  ['Tối thiểu', `${minVnd.toLocaleString('vi-VN')} ₫ ≈ ${MIN_USDT.toLocaleString()} USDT`],
                  ['Tỷ giá', `1 USD = ${exRate.rate.toLocaleString('vi-VN')} ₫`],
                  ['Phí rút', 'Miễn phí'],
                  ['Thời gian xử lý', '5–30 phút'],
                ].map(([l, v]) => (
                  <div key={l as string} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ color: '#7a8fa6', fontSize: 12 }}>{l}</Text>
                    <Text style={{ color: l === 'Tỷ giá' ? '#4f8ef7' : '#e8edf5', fontSize: 12 }}>{v}</Text>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Nhà cái section ── */}
          {renderPlatformSection()}

          <Button
            type="primary" danger htmlType="submit" block size="large"
            icon={<SwapOutlined />}
            style={{ height: 50, fontWeight: 700, fontSize: 15, marginTop: 4 }}
          >
            Tiếp tục
          </Button>
        </Form>
      </div>

      <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 10 }}>
        <Text style={{ color: '#7a8fa6', fontSize: 12 }}>
          <InfoCircleOutlined style={{ marginRight: 6, color: '#ef4444' }} />
          Giao dịch rút tiền không thể hủy sau khi xác nhận. Vui lòng kiểm tra kỹ thông tin.
        </Text>
      </div>

      {renderConfirm()}
    </div>
  );
};

export default WithdrawPage;
