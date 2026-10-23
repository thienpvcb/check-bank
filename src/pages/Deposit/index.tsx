import { useState, useEffect } from 'react';
import {
  Form, InputNumber, Select, Button, Typography, Alert,
  message, QRCode, Grid, Tag, Switch, Input,
} from 'antd';
import {
  CopyOutlined, AppstoreOutlined,
  CheckCircleOutlined, RiseOutlined, SwapOutlined,
  InfoCircleOutlined, UserOutlined,
} from '@ant-design/icons';
import { CryptoIcon, BankIcon, CryptoSymbolIcon } from '../../components/Icons';
import ExchangeRateBadge from '../../components/ExchangeRateBadge';
import TransactionCountdown from '../../components/TransactionCountdown';
import { cryptoAssets } from '../../mocks/crypto';
import { getActiveBanks } from '../../mocks/banks';
import { gamePlatforms } from '../../mocks/games';
import { referenceApi, transactionApi } from '../../services/api';
import { USE_API } from '../../hooks/useApi';
import type { CryptoAsset, Bank } from '../../types';
import { useExchangeRate, MIN_USDT, usdtToVnd } from '../../hooks/useExchangeRate';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

type Method = 'crypto' | 'bank';

interface DepositInfo {
  type: Method;
  txId?: string;
  expiresAt?: string;
  timeoutMinutes?: number;
  cryptoSymbol?: string;
  network?: string;
  walletAddress?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  amount?: number;
  transferContent?: string;
  // Game portal
  platformName?: string;
  gameUserId?: string;
}

const DepositPage = () => {
  const [form] = Form.useForm();
  const [depositInfo, setDepositInfo] = useState<DepositInfo | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState('USDT');
  const [method, setMethod] = useState<Method>('crypto');
  const [loading, setLoading] = useState(false);
  const [forPlatform, setForPlatform] = useState(false); // toggle nhà cái
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const exRate = useExchangeRate();
  const minVnd = usdtToVnd(MIN_USDT, exRate.rate);

  const [allCrypto, setAllCrypto] = useState<CryptoAsset[]>(cryptoAssets);
  const [allBanks, setAllBanks]   = useState<Bank[]>(getActiveBanks());

  useEffect(() => {
    if (!USE_API) return;
    referenceApi.crypto().then(setAllCrypto).catch(() => {});
    referenceApi.banks().then(setAllBanks).catch(() => {});
  }, []);

  const banks   = allBanks;
  const symbols = [...new Set(allCrypto.map((a) => a.symbol))];
  const getNetworks = (symbol: string) => allCrypto.filter((a) => a.symbol === symbol);
  const activePlatforms = gamePlatforms.filter((p) => p.isActive);

  const copy = (text: string, label = 'Đã sao chép!') => {
    navigator.clipboard.writeText(text);
    message.success({ content: label, icon: <CheckCircleOutlined style={{ color: '#22c55e' }} /> });
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      const platformName = forPlatform
        ? activePlatforms.find((p) => p.id === values.platformId)?.name
        : undefined;
      const gameUserId = forPlatform ? (values.gameUserId as string) : undefined;

      if (method === 'crypto') {
        const network = values.network as string;
        if (USE_API) {
          const tx = await transactionApi.depositCrypto({ symbol: values.symbol as string, network });
          setDepositInfo({ type: 'crypto', txId: tx.id, expiresAt: tx.expiresAt, timeoutMinutes: tx.timeoutMinutes, cryptoSymbol: values.symbol as string, network, walletAddress: tx.walletAddress, platformName, gameUserId });
        } else {
          const addr =
            network === 'TRC20' ? 'TXqLKj8fJKj9dJKj8fJKj9dJKj8fJKj9d' :
            network === 'ERC20' ? '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' :
            'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';
          // Mock: expire sau 30 phút
          const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
          setDepositInfo({ type: 'crypto', expiresAt, timeoutMinutes: 30, cryptoSymbol: values.symbol as string, network, walletAddress: addr, platformName, gameUserId });
        }
      } else {
        const bankCode = values.bankCode as string;
        const amount   = values.amount as number;
        const bank     = banks.find((b) => b.code === bankCode);
        if (USE_API) {
          const tx = await transactionApi.depositBank({ bankCode, amount });
          setDepositInfo({ type: 'bank', txId: tx.id, expiresAt: tx.expiresAt, timeoutMinutes: tx.timeoutMinutes, bankName: bank?.shortName, accountNumber: '1234567890', accountName: 'CONG TY CHECK BANK', amount, transferContent: (tx as unknown as Record<string,string>)['transferContent'], platformName, gameUserId });
        } else {
          const code = `NAP${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
          const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
          setDepositInfo({ type: 'bank', expiresAt, timeoutMinutes: 60, bankName: bank?.shortName, accountNumber: '1234567890', accountName: 'CONG TY CHECK BANK', amount, transferContent: code, platformName, gameUserId });
        }
      }
    } catch (err) {
      message.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // ---- Platform section (dùng chung cho cả crypto và bank) ----
  const renderPlatformSection = () => (
    <div style={{
      background: '#1e2d40',
      border: `1px solid ${forPlatform ? 'rgba(79,142,247,0.3)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 10, padding: '14px 16px', marginBottom: 16,
      transition: 'border-color 0.2s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: forPlatform ? 16 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <AppstoreOutlined style={{ color: forPlatform ? '#4f8ef7' : '#4a5f73' }} />
          <Text style={{ color: '#e8edf5', fontSize: 13, fontWeight: 500 }}>Nạp cho nhà cái</Text>
          <Text style={{ color: '#4a5f73', fontSize: 11 }}>(tuỳ chọn)</Text>
        </div>
        <Switch
          checked={forPlatform}
          onChange={(v) => {
            setForPlatform(v);
            if (!v) {
              form.setFieldValue('platformId', undefined);
              form.setFieldValue('gameUserId', undefined);
            }
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
            <Select size="large" placeholder="Chọn nhà cái muốn nạp"
              options={activePlatforms.map((p) => ({
                value: p.id,
                label: (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img src={p.logo} alt={p.name}
                      style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'contain' }}
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
            <Input
              size="large" placeholder="VD: user123456"
              prefix={<UserOutlined style={{ color: '#4a5f73' }} />}
            />
          </Form.Item>
        </>
      )}
    </div>
  );

  // ---- Render deposit result ----
  if (depositInfo) {
    return (
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <button
            onClick={() => { setDepositInfo(null); form.resetFields(); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4f8ef7', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}
          >
            ← Quay lại
          </button>
          <Title level={4} style={{ color: '#e8edf5', margin: 0 }}>
            {depositInfo.type === 'crypto'
              ? `Nạp ${depositInfo.cryptoSymbol} · ${depositInfo.network}`
              : `Chuyển khoản ${depositInfo.bankName}`}
          </Title>
          <Text style={{ color: '#7a8fa6', fontSize: 13 }}>
            Thông tin {depositInfo.type === 'crypto' ? 'địa chỉ ví' : 'tài khoản nhận'}
          </Text>
        </div>

        {/* Countdown timer */}
        {depositInfo.expiresAt && depositInfo.timeoutMinutes && (
          <div style={{
            background: '#182230', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12, padding: '14px 18px', marginBottom: 16,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <Text style={{ color: '#7a8fa6', fontSize: 12, display: 'block' }}>Thời gian còn lại</Text>
              <Text style={{ color: '#4a5f73', fontSize: 11 }}>
                Hết hạn sau {depositInfo.timeoutMinutes} phút → tự động huỷ
              </Text>
            </div>
            <TransactionCountdown
              txId={depositInfo.txId || ''}
              expiresAt={depositInfo.expiresAt}
              timeoutMinutes={depositInfo.timeoutMinutes}
              onStatusChange={(s) => {
                if (s === 'completed') message.success('Giao dịch đã được xác nhận!');
                if (s === 'expired') message.warning('Giao dịch đã hết hạn.');
              }}
            />
          </div>
        )}

        {/* Platform info nếu có */}
        {depositInfo.platformName && (
          <div style={{
            background: 'rgba(79,142,247,0.08)', border: '1px solid rgba(79,142,247,0.2)',
            borderRadius: 10, padding: '10px 16px', marginBottom: 16,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AppstoreOutlined style={{ color: '#4f8ef7' }} />
              <Text style={{ color: '#4f8ef7', fontWeight: 600 }}>{depositInfo.platformName}</Text>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Text style={{ color: '#7a8fa6', fontSize: 11, display: 'block' }}>ID tài khoản</Text>
              <Text style={{ color: '#e8edf5', fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
                {depositInfo.gameUserId}
              </Text>
            </div>
          </div>
        )}

        {depositInfo.type === 'crypto' ? (
          <>
            <Alert
              icon={<InfoCircleOutlined />}
              message={`Chỉ gửi ${depositInfo.cryptoSymbol} qua mạng ${depositInfo.network}. Sai mạng lưới sẽ mất tiền vĩnh viễn.`}
              type="warning" showIcon style={{ marginBottom: 20, borderRadius: 10 }}
            />
            <div style={{ background: '#182230', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24, marginBottom: 16, textAlign: 'center' }}>
              <div style={{ display: 'inline-block', background: '#fff', padding: 16, borderRadius: 12, marginBottom: 16 }}>
                <QRCode
                  value={depositInfo.walletAddress || ''}
                  size={isMobile ? 160 : 200}
                  bordered={false}
                  color="#000000"
                  bgColor="#ffffff"
                />
              </div>
              <div style={{ background: '#1e2d40', border: '1px solid rgba(79,142,247,0.25)', borderRadius: 10, padding: '12px 16px', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#4f8ef7', wordBreak: 'break-all', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <span>{depositInfo.walletAddress}</span>
                <CopyOutlined style={{ flexShrink: 0, cursor: 'pointer', fontSize: 16, color: '#7a8fa6' }} onClick={() => copy(depositInfo.walletAddress!, 'Đã copy địa chỉ ví!')} />
              </div>
            </div>
            <div className="info-box" style={{ marginBottom: 16 }}>
              {[
                ['Mạng lưới', <Tag color="blue">{depositInfo.network}</Tag>],
                ['Loại tiền', <Tag color="gold">{depositInfo.cryptoSymbol}</Tag>],
                ['Xác nhận', '≥ 6 blocks'],
                ['Thời gian', '5–30 phút'],
              ].map(([label, value]) => (
                <div className="info-row" key={String(label)}>
                  <span className="info-label">{label}</span>
                  <span className="info-value">{value}</span>
                </div>
              ))}
            </div>
            <Button type="primary" size="large" block icon={<CopyOutlined />}
              onClick={() => copy(depositInfo.walletAddress!, 'Đã copy địa chỉ ví!')}
              style={{ height: 48, fontWeight: 600 }}
            >
              Sao chép địa chỉ ví
            </Button>
          </>
        ) : (
          <>
            <Alert
              icon={<InfoCircleOutlined />}
              message="Nhập đúng nội dung chuyển khoản để tự động xác nhận. Sai nội dung cần duyệt thủ công (1–24h)."
              type="warning" showIcon style={{ marginBottom: 20 }}
            />
            <div style={{ background: '#182230', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
              {[
                { label: 'Ngân hàng',     value: depositInfo.bankName,       copy: false },
                { label: 'Số tài khoản',  value: depositInfo.accountNumber,  copy: true },
                { label: 'Chủ tài khoản', value: depositInfo.accountName,    copy: false },
                { label: 'Số tiền',       value: `${depositInfo.amount?.toLocaleString('vi-VN')} VND`, copy: false, highlight: true },
                { label: 'Nội dung CK',   value: depositInfo.transferContent, copy: true, highlight: true },
              ].map(({ label, value, copy: doCopy, highlight }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <Text style={{ color: '#7a8fa6', fontSize: 13 }}>{label}</Text>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Text style={{ color: highlight ? '#4f8ef7' : '#e8edf5', fontWeight: highlight ? 700 : 500, fontSize: highlight ? 15 : 14 }}>{value}</Text>
                    {doCopy && <CopyOutlined style={{ color: '#4a5f73', cursor: 'pointer' }} onClick={() => copy(value || '', `Đã copy ${label}!`)} />}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Button size="large" icon={<CopyOutlined />} onClick={() => copy(depositInfo.accountNumber!, 'Đã copy STK!')} style={{ height: 46 }}>Copy STK</Button>
              <Button type="primary" size="large" icon={<CopyOutlined />} onClick={() => copy(depositInfo.transferContent!, 'Đã copy nội dung!')} style={{ height: 46, fontWeight: 600 }}>Copy nội dung</Button>
            </div>
          </>
        )}
      </div>
    );
  }

  // ---- Deposit form ----
  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <Title level={4} style={{ color: '#e8edf5', margin: 0 }}>
            <RiseOutlined style={{ color: '#22c55e', marginRight: 8 }} />Nạp tiền
          </Title>
          <p style={{ color: '#7a8fa6', margin: '4px 0 0', fontSize: 13 }}>
            Chọn phương thức và nhận thông tin nạp tiền
          </p>
        </div>
      </div>

      {/* Method selector */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
        {[
          { key: 'crypto' as Method, label: 'Tiền ảo (Crypto)', sub: 'USDT, BTC, ETH...' },
          { key: 'bank'   as Method, label: 'Ngân hàng VN',     sub: 'Vietcombank, TCB...' },
        ].map(({ key, label, sub }) => (
          <div key={key} className={`method-card${method === key ? ' active' : ''}`}
            onClick={() => { setMethod(key); setDepositInfo(null); form.resetFields(); setForPlatform(false); }}
          >
            <div className="method-card-icon" style={{ background: key === 'crypto' ? 'rgba(245,158,11,0.12)' : 'rgba(79,142,247,0.12)' }}>
              {key === 'crypto' ? <CryptoIcon size={22} /> : <BankIcon size={22} />}
            </div>
            <div style={{ minWidth: 0 }}>
              <Text style={{ color: '#e8edf5', fontWeight: 600, fontSize: isMobile ? 13 : 14, display: 'block' }}>{label}</Text>
              <Text style={{ color: '#7a8fa6', fontSize: 11 }}>{sub}</Text>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: '#182230', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: isMobile ? 16 : 24 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {method === 'crypto' ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Form.Item label="Loại tiền" name="symbol" initialValue="USDT" rules={[{ required: true }]}>
                  <Select size="large"
                    onChange={(v) => { setSelectedSymbol(v); form.setFieldValue('network', undefined); }}
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
                  <Select placeholder="Network" disabled={!selectedSymbol} size="large"
                    options={getNetworks(selectedSymbol).map((a) => ({
                      value: a.network,
                      label: (
                        <div>
                          <div style={{ fontWeight: 600 }}>{a.network}</div>
                          <div style={{ fontSize: 11, color: '#7a8fa6' }}>Min: {a.minDeposit} {a.symbol}</div>
                        </div>
                      ),
                    }))}
                  />
                </Form.Item>
              </div>
            </>
          ) : (
            <>
              <Form.Item label="Chọn ngân hàng" name="bankCode" rules={[{ required: true, message: 'Chọn ngân hàng' }]}>
                <Select placeholder="Ngân hàng nhận tiền" size="large"
                  options={banks.map((b) => ({
                    value: b.code,
                    label: (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img src={b.logo} alt={b.shortName} style={{ width: 22, height: 22, borderRadius: 4, objectFit: 'contain' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        <span>{b.shortName}</span>
                      </div>
                    ),
                  }))}
                />
              </Form.Item>

              <Form.Item
                label={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span>Số tiền nạp (VND)</span><ExchangeRateBadge {...exRate} /></div>}
                name="amount"
                rules={[{ required: true, message: 'Nhập số tiền' }, { type: 'number', min: minVnd, message: `Tối thiểu ${minVnd.toLocaleString('vi-VN')} ₫ (= ${MIN_USDT.toLocaleString()} USDT)` }]}
              >
                <InputNumber<number> size="large" style={{ width: '100%' }}
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(v) => Number(v?.replace(/,/g, '') || 0) as number}
                  placeholder="0" min={minVnd}
                  addonAfter={<span style={{ color: '#7a8fa6' }}>VND</span>}
                />
              </Form.Item>

              <div style={{ marginBottom: 12, marginTop: -8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e2d40', borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>
                  <span style={{ color: '#7a8fa6', fontSize: 12 }}>Tối thiểu</span>
                  <span style={{ color: '#e8edf5', fontWeight: 600, fontSize: 12 }}>
                    {minVnd.toLocaleString('vi-VN')} ₫ <span style={{ color: '#4a5f73' }}>≈ {MIN_USDT.toLocaleString()} USDT</span>
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[minVnd, minVnd * 2, minVnd * 5, minVnd * 10].map((amt) => (
                    <button key={amt} type="button"
                      onClick={() => form.setFieldValue('amount', amt)}
                      style={{ background: '#1e2d40', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: '#7a8fa6', fontSize: 12, transition: 'all 0.2s', fontFamily: 'inherit' }}
                      onMouseEnter={(e) => { (e.currentTarget.style.borderColor = '#4f8ef7'); (e.currentTarget.style.color = '#4f8ef7'); }}
                      onMouseLeave={(e) => { (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'); (e.currentTarget.style.color = '#7a8fa6'); }}
                    >
                      {amt >= 1_000_000 ? `${(amt / 1_000_000).toFixed(amt % 1_000_000 === 0 ? 0 : 1)}M` : `${(amt / 1_000).toFixed(0)}K`}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── Nhà cái section ── */}
          {renderPlatformSection()}

          <Button type="primary" htmlType="submit" block size="large"
            loading={loading} icon={<SwapOutlined />}
            style={{ height: 50, fontWeight: 700, fontSize: 15, marginTop: 4 }}
          >
            {method === 'crypto' ? 'Lấy địa chỉ nạp tiền' : 'Lấy thông tin chuyển khoản'}
          </Button>
        </Form>
      </div>

      <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(79,142,247,0.07)', border: '1px solid rgba(79,142,247,0.15)', borderRadius: 10 }}>
        <Text style={{ color: '#7a8fa6', fontSize: 12 }}>
          <InfoCircleOutlined style={{ marginRight: 6, color: '#4f8ef7' }} />
          Hệ thống sẽ tự động ghi nhận sau khi giao dịch được xác nhận.
        </Text>
      </div>
    </div>
  );
};

export default DepositPage;
