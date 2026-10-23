import { useState, useEffect } from 'react';
import {
  Select, DatePicker, Button, Typography,
  Drawer, Tag, Grid, Statistic, Row, Col, Card, Modal, message,
} from 'antd';
import {
  HistoryOutlined, ReloadOutlined,
  ArrowUpOutlined, ArrowDownOutlined,
  FilterOutlined, CloseOutlined,
  CopyOutlined, CheckOutlined,
  ClockCircleOutlined, CheckCircleOutlined,
  CloseCircleOutlined, StopOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { mockTransactions } from '../../mocks/transactions';
import { transactionApi } from '../../services/api';
import { USE_API } from '../../hooks/useApi';
import { CryptoSymbolIcon } from '../../components/Icons';
import type { Transaction, TransactionStatus, TransactionType } from '../../types';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

// ── Status config ──────────────────────────────────────────────
const STATUS_CFG: Record<TransactionStatus, {
  color: string; bg: string; border: string; label: string;
  icon: React.ReactNode; dotColor: string;
}> = {
  pending:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.25)',  label: 'Đang xử lý', icon: <ClockCircleOutlined />,  dotColor: '#f59e0b' },
  completed: { color: '#22c55e', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.25)',   label: 'Hoàn thành',  icon: <CheckCircleOutlined />,  dotColor: '#22c55e' },
  failed:    { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.25)',   label: 'Thất bại',    icon: <CloseCircleOutlined />,  dotColor: '#ef4444' },
  cancelled: { color: '#7a8fa6', bg: 'rgba(122,143,166,0.08)', border: 'rgba(122,143,166,0.2)',  label: 'Đã hủy',     icon: <StopOutlined />,         dotColor: '#4a5f73' },
  expired:   { color: '#7a8fa6', bg: 'rgba(122,143,166,0.08)', border: 'rgba(122,143,166,0.2)',  label: 'Hết hạn',    icon: <StopOutlined />,         dotColor: '#4a5f73' },
};

// ── Bank logo component ────────────────────────────────────────
const BankLogo = ({ bankCode, size = 32 }: { bankCode?: string; size?: number }) => {
  if (!bankCode) return null;
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.25,
      background: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', flexShrink: 0,
      boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
    }}>
      <img
        src={`https://api.vietqr.io/img/${bankCode}.png`}
        alt={bankCode}
        style={{ width: size * 0.8, height: size * 0.8, objectFit: 'contain' }}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
          const p = (e.target as HTMLImageElement).parentElement;
          if (p) p.innerHTML = `<span style="color:#4f8ef7;font-size:${size * 0.3}px;font-weight:700;background:transparent">${bankCode.slice(0,3)}</span>`;
        }}
      />
    </div>
  );
};

// ── Network badge ──────────────────────────────────────────────
const NetworkBadge = ({ network }: { network?: string }) => {
  if (!network) return null;
  const colors: Record<string, { bg: string; color: string }> = {
    TRC20: { bg: 'rgba(239,68,68,0.12)',  color: '#ef4444' },
    ERC20: { bg: 'rgba(99,102,241,0.12)', color: '#818cf8' },
    BEP20: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
    BTC:   { bg: 'rgba(247,147,26,0.12)', color: '#f7931a' },
  };
  const c = colors[network] ?? { bg: 'rgba(79,142,247,0.12)', color: '#4f8ef7' };
  return (
    <span style={{
      background: c.bg, color: c.color,
      borderRadius: 4, padding: '1px 7px',
      fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
    }}>
      {network}
    </span>
  );
};

// ── CopyButton ─────────────────────────────────────────────────
const CopyBtn = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: copied ? '#22c55e' : '#4a5f73', transition: 'color 0.2s' }}
    >
      {copied ? <CheckOutlined style={{ fontSize: 12 }} /> : <CopyOutlined style={{ fontSize: 12 }} />}
    </button>
  );
};

// ── Transaction icon ───────────────────────────────────────────
const TxIcon = ({ tx }: { tx: Transaction }) => {
  const isDeposit = tx.type === 'deposit';
  if (tx.method === 'bank') {
    return (
      <div style={{ position: 'relative' }}>
        <BankLogo bankCode={tx.bankCode} size={40} />
        <div style={{
          position: 'absolute', bottom: -3, right: -3,
          width: 16, height: 16, borderRadius: '50%',
          background: isDeposit ? '#22c55e' : '#ef4444',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1.5px solid #182230',
        }}>
          {isDeposit
            ? <ArrowDownOutlined style={{ color: '#fff', fontSize: 8 }} />
            : <ArrowUpOutlined   style={{ color: '#fff', fontSize: 8 }} />}
        </div>
      </div>
    );
  }
  // Crypto
  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: isDeposit ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
        border: `1px solid ${isDeposit ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <CryptoSymbolIcon symbol={tx.cryptoAsset || tx.currency || 'USDT'} size={22} />
      </div>
      <div style={{
        position: 'absolute', bottom: -3, right: -3,
        width: 16, height: 16, borderRadius: '50%',
        background: isDeposit ? '#22c55e' : '#ef4444',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1.5px solid #182230',
      }}>
        {isDeposit
          ? <ArrowDownOutlined style={{ color: '#fff', fontSize: 8 }} />
          : <ArrowUpOutlined   style={{ color: '#fff', fontSize: 8 }} />}
      </div>
    </div>
  );
};

// ── Main page ──────────────────────────────────────────────────
const HistoryPage = () => {
  const [allTx, setAllTx]               = useState<Transaction[]>(mockTransactions);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [loading, setLoading]           = useState(false);
  const [selectedTx, setSelectedTx]     = useState<Transaction | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [showFilter, setShowFilter]     = useState(false);

  const [typeFilter,   setTypeFilter]   = useState<TransactionType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'all'>('all');
  const [methodFilter, setMethodFilter] = useState<'crypto' | 'bank' | 'all'>('all');

  const screens  = useBreakpoint();
  const isMobile = !screens.md;

  useEffect(() => {
    if (!USE_API) return;
    setLoading(true);
    transactionApi.list()
      .then((data) => { setAllTx(data); setTransactions(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalDeposit  = allTx.filter((t) => t.type === 'deposit'  && t.status === 'completed').length;
  const totalWithdraw = allTx.filter((t) => t.type === 'withdraw' && t.status === 'completed').length;
  const pending       = allTx.filter((t) => t.status === 'pending').length;

  const applyFilters = (type = typeFilter, status = statusFilter, meth = methodFilter) => {
    let r = [...allTx];
    if (type   !== 'all') r = r.filter((t) => t.type   === type);
    if (status !== 'all') r = r.filter((t) => t.status === status);
    if (meth   !== 'all') r = r.filter((t) => t.method === meth);
    setTransactions(r);
  };

  const resetFilters = () => {
    setTypeFilter('all'); setStatusFilter('all'); setMethodFilter('all');
    setTransactions(allTx);
  };

  const handleCancelWithdraw = (tx: Transaction) => {
    Modal.confirm({
      title: 'Hủy lệnh rút tiền?',
      content: (
        <div>
          <p style={{ marginBottom: 8 }}>Lệnh rút <strong>{tx.method === 'bank' ? tx.amount.toLocaleString('vi-VN') + ' ₫' : tx.amount + ' ' + tx.currency}</strong> sẽ bị hủy.</p>
          <p style={{ color: '#22c55e', fontSize: 13 }}>✓ Tiền sẽ được hoàn lại ngay vào tài khoản của bạn.</p>
        </div>
      ),
      okText: 'Xác nhận hủy', okButtonProps: { danger: true },
      cancelText: 'Không',
      onOk: async () => {
        if (USE_API) {
          try {
            await transactionApi.cancelWithdraw(tx.id);
            message.success('Đã hủy lệnh rút. Tiền đã hoàn về tài khoản!');
            // Reload list
            setLoading(true);
            transactionApi.list().then((data) => { setAllTx(data); setTransactions(data); }).finally(() => setLoading(false));
          } catch (err) {
            message.error((err as Error).message);
          }
        } else {
          // Mock: update locally
          const updated = allTx.map((t) => t.id === tx.id ? { ...t, status: 'cancelled' as TransactionStatus, rejectReason: 'Người dùng tự hủy' } : t);
          setAllTx(updated); setTransactions(updated);
          message.success('Đã hủy lệnh rút (demo mode)');
        }
        setDrawerVisible(false);
      },
    });
  };

  const formatAmount = (tx: Transaction) => {
    const sign = tx.type === 'deposit' ? '+' : '-';
    const val  = tx.method === 'bank'
      ? `${tx.amount.toLocaleString('vi-VN')} ₫`
      : `${tx.amount} ${tx.currency}`;
    return { sign, val };
  };

  // ── Transaction row subtitle ───────────────────────────────
  const txSubtitle = (tx: Transaction) => {
    if (tx.method === 'bank') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
          <Text style={{ color: '#e8edf5', fontSize: 12, fontWeight: 600 }}>{tx.bankName || tx.bankCode}</Text>
          {tx.accountNumber && (
            <Text style={{ color: '#4f8ef7', fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>
              •••• {tx.accountNumber.slice(-4)}
            </Text>
          )}
          {tx.accountName && (
            <Text style={{ color: '#7a8fa6', fontSize: 11 }}>{tx.accountName}</Text>
          )}
        </div>
      );
    }
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
        <NetworkBadge network={tx.network} />
        <Text style={{ color: '#7a8fa6', fontSize: 11 }}>
          {tx.cryptoAsset || tx.currency}
        </Text>
      </div>
    );
  };

  // ── Mobile card ────────────────────────────────────────────
  const renderMobileCard = (tx: Transaction) => {
    const { sign, val } = formatAmount(tx);
    const cfg = STATUS_CFG[tx.status];
    const isDeposit = tx.type === 'deposit';

    return (
      <div
        key={tx.id}
        onClick={() => { setSelectedTx(tx); setDrawerVisible(true); }}
        style={{
          background: '#182230',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14, padding: '14px 16px',
          marginBottom: 10, cursor: 'pointer',
          transition: 'border-color 0.15s, background 0.15s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.14)'; (e.currentTarget as HTMLDivElement).style.background = '#1a2840'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLDivElement).style.background = '#182230'; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <TxIcon tx={tx} />
            <div>
              <Text style={{ color: '#e8edf5', fontWeight: 600, fontSize: 14, display: 'block' }}>
                {isDeposit ? 'Nạp tiền' : 'Rút tiền'}
              </Text>
              {txSubtitle(tx)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Text style={{ color: isDeposit ? '#22c55e' : '#ef4444', fontWeight: 700, fontSize: 15, display: 'block' }}>
              {sign}{val}
            </Text>
            <Text style={{ color: '#4a5f73', fontSize: 10 }}>
              {dayjs(tx.createdAt).format('DD/MM HH:mm')}
            </Text>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <Text style={{ color: '#4a5f73', fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>{tx.id}</Text>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {tx.type === 'withdraw' && tx.status === 'pending' && (
              <Button size="small" danger
                onClick={(e) => { e.stopPropagation(); handleCancelWithdraw(tx); }}
                style={{ fontSize: 10, height: 22, padding: '0 6px' }}
              >
                Hủy
              </Button>
            )}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: cfg.bg, color: cfg.color,
              border: `1px solid ${cfg.border}`,
              borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600,
            }}>
              {cfg.icon} {cfg.label}
            </span>
          </div>
        </div>
        {tx.rejectReason && (
          <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <ExclamationCircleOutlined style={{ color: '#ef4444', fontSize: 11 }} />
            <Text style={{ color: '#ef4444', fontSize: 11 }}>{tx.rejectReason}</Text>
          </div>
        )}
      </div>
    );
  };

  // ── Detail drawer ──────────────────────────────────────────
  const renderDetail = () => {
    if (!selectedTx) return null;
    const { sign, val } = formatAmount(selectedTx);
    const cfg = STATUS_CFG[selectedTx.status];
    const isDeposit = selectedTx.type === 'deposit';

    const Row2 = ({ label, children }: { label: string; children: React.ReactNode }) => (
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        padding: '11px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', gap: 12,
      }}>
        <Text style={{ color: '#7a8fa6', fontSize: 12, flexShrink: 0, paddingTop: 1 }}>{label}</Text>
        <div style={{ textAlign: 'right' }}>{children}</div>
      </div>
    );

    return (
      <div>
        {/* ── Amount hero ── */}
        <div style={{
          background: 'linear-gradient(135deg, #182230, #1a2840)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16, padding: '24px 20px', marginBottom: 20, textAlign: 'center',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <div style={{ transform: 'scale(1.3)' }}>
              <TxIcon tx={selectedTx} />
            </div>
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: isDeposit ? '#22c55e' : '#ef4444', marginBottom: 8, letterSpacing: '-0.5px' }}>
            {sign}{val}
          </div>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: cfg.bg, color: cfg.color,
            border: `1px solid ${cfg.border}`,
            borderRadius: 20, padding: '4px 16px', fontSize: 13, fontWeight: 600,
          }}>
            {cfg.icon} {cfg.label}
          </span>
        </div>

        {/* ── Bank info block (nếu là bank) ── */}
        {selectedTx.method === 'bank' && (
          <div style={{
            background: '#1e2d40',
            border: '1px solid rgba(79,142,247,0.15)',
            borderRadius: 14, padding: '16px 18px', marginBottom: 16,
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <BankLogo bankCode={selectedTx.bankCode} size={52} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ color: '#e8edf5', fontWeight: 700, fontSize: 15, display: 'block', marginBottom: 2 }}>
                {selectedTx.bankName || selectedTx.bankCode}
              </Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: '#4f8ef7', fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 600 }}>
                  {selectedTx.accountNumber}
                </Text>
                {selectedTx.accountNumber && <CopyBtn text={selectedTx.accountNumber} />}
              </div>
              <Text style={{ color: '#7a8fa6', fontSize: 12, marginTop: 2, display: 'block' }}>
                {selectedTx.accountName}
              </Text>
            </div>
          </div>
        )}

        {/* ── Crypto info block ── */}
        {selectedTx.method === 'crypto' && (
          <div style={{
            background: '#1e2d40',
            border: '1px solid rgba(79,142,247,0.15)',
            borderRadius: 14, padding: '14px 16px', marginBottom: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <CryptoSymbolIcon symbol={selectedTx.cryptoAsset || selectedTx.currency || 'USDT'} size={28} />
              <div>
                <Text style={{ color: '#e8edf5', fontWeight: 700, fontSize: 14, display: 'block' }}>
                  {selectedTx.cryptoAsset || selectedTx.currency}
                </Text>
                <NetworkBadge network={selectedTx.network} />
              </div>
            </div>
            {selectedTx.walletAddress && (
              <div style={{
                background: '#182230', borderRadius: 8, padding: '8px 12px',
                fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                color: '#4f8ef7', wordBreak: 'break-all',
                display: 'flex', alignItems: 'flex-start', gap: 8,
              }}>
                <span style={{ flex: 1 }}>{selectedTx.walletAddress}</span>
                <CopyBtn text={selectedTx.walletAddress} />
              </div>
            )}
          </div>
        )}

        {/* ── Info rows ── */}
        <div style={{ background: '#182230', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '4px 16px', marginBottom: 16 }}>
          <Row2 label="Mã giao dịch">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Text style={{ color: '#e8edf5', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                {selectedTx.id}
              </Text>
              <CopyBtn text={selectedTx.id} />
            </div>
          </Row2>
          <Row2 label="Loại giao dịch">
            <Tag color={isDeposit ? 'success' : 'error'} style={{ fontSize: 12, fontWeight: 600 }}>
              {isDeposit ? '↓ Nạp tiền' : '↑ Rút tiền'}
            </Tag>
          </Row2>
          <Row2 label="Phương thức">
            <Text style={{ color: '#e8edf5', fontSize: 13 }}>
              {selectedTx.method === 'bank' ? 'Chuyển khoản ngân hàng' : 'Tiền điện tử'}
            </Text>
          </Row2>
          <Row2 label="Thời gian tạo">
            <Text style={{ color: '#e8edf5', fontSize: 13 }}>
              {dayjs(selectedTx.createdAt).format('DD/MM/YYYY HH:mm:ss')}
            </Text>
          </Row2>
          <Row2 label="Cập nhật">
            <Text style={{ color: '#7a8fa6', fontSize: 12 }}>
              {dayjs(selectedTx.updatedAt).format('DD/MM/YYYY HH:mm:ss')}
            </Text>
          </Row2>
          {selectedTx.method === 'bank' && (selectedTx as Transaction & { transferContent?: string }).transferContent && (
            <Row2 label="Nội dung CK">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Text style={{ color: '#4f8ef7', fontWeight: 700, fontSize: 13 }}>
                  {(selectedTx as Transaction & { transferContent?: string }).transferContent}
                </Text>
                <CopyBtn text={(selectedTx as Transaction & { transferContent?: string }).transferContent || ''} />
              </div>
            </Row2>
          )}
          {selectedTx.txHash && (
            <Row2 label="TxHash">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <Text style={{ color: '#7a8fa6', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, wordBreak: 'break-all', maxWidth: 220 }}>
                  {selectedTx.txHash}
                </Text>
                <CopyBtn text={selectedTx.txHash} />
              </div>
            </Row2>
          )}
        </div>

        {/* ── Reject reason ── */}
        {selectedTx.rejectReason && (
          <div style={{
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 12, padding: '14px 16px', marginBottom: 16,
            display: 'flex', gap: 12,
          }}>
            <ExclamationCircleOutlined style={{ color: '#ef4444', fontSize: 18, flexShrink: 0, marginTop: 1 }} />
            <div>
              <Text style={{ color: '#ef4444', fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 2 }}>
                {selectedTx.status === 'cancelled' ? 'Lý do hủy' : 'Lý do từ chối / lỗi'}
              </Text>
              <Text style={{ color: '#f87171', fontSize: 13 }}>{selectedTx.rejectReason}</Text>
            </div>
          </div>
        )}

        {/* ── Cancel button (pending withdraw only) ── */}
        {selectedTx.type === 'withdraw' && selectedTx.status === 'pending' && (
          <Button
            danger block size="large"
            icon={<CloseCircleOutlined />}
            onClick={() => handleCancelWithdraw(selectedTx)}
            style={{ height: 48, fontWeight: 700 }}
          >
            Hủy lệnh rút tiền
          </Button>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <Title level={4} style={{ color: '#e8edf5', margin: 0 }}>
            <HistoryOutlined style={{ marginRight: 8 }} />
            Lịch sử giao dịch
          </Title>
          <p style={{ color: '#7a8fa6', margin: '4px 0 0', fontSize: 13 }}>
            {transactions.length} giao dịch
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button icon={<FilterOutlined />} onClick={() => setShowFilter(!showFilter)} type={showFilter ? 'primary' : 'default'}>
            {!isMobile && 'Lọc'}
          </Button>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={() => {
            setLoading(true);
            (USE_API ? transactionApi.list() : Promise.resolve(mockTransactions))
              .then((data) => { setAllTx(data); setTransactions(data); })
              .finally(() => setLoading(false));
          }} />
        </div>
      </div>

      {/* Stats */}
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        {[
          { label: 'Nạp thành công', value: totalDeposit,  color: '#22c55e', cls: 'stat-card-green' },
          { label: 'Rút thành công', value: totalWithdraw, color: '#ef4444', cls: 'stat-card-red' },
          { label: 'Đang xử lý',    value: pending,        color: '#f59e0b', cls: 'stat-card-yellow' },
          { label: 'Tổng',           value: allTx.length,  color: '#4f8ef7', cls: 'stat-card-blue' },
        ].map(({ label, value, color, cls }) => (
          <Col xs={12} sm={6} key={label}>
            <Card className={cls} style={{ borderRadius: 12 }} bodyStyle={{ padding: '14px 16px' }}>
              <Statistic
                title={<span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>}
                value={value}
                valueStyle={{ color, fontSize: isMobile ? 22 : 28, fontWeight: 700 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Filter */}
      {showFilter && (
        <div style={{ background: '#182230', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
            {[
              {
                label: 'Loại GD', value: typeFilter,
                onChange: (v: string) => { setTypeFilter(v as TransactionType | 'all'); applyFilters(v as TransactionType | 'all', statusFilter, methodFilter); },
                options: [{ label: 'Tất cả', value: 'all' }, { label: '↓ Nạp tiền', value: 'deposit' }, { label: '↑ Rút tiền', value: 'withdraw' }],
                width: 130,
              },
              {
                label: 'Trạng thái', value: statusFilter,
                onChange: (v: string) => { setStatusFilter(v as TransactionStatus | 'all'); applyFilters(typeFilter, v as TransactionStatus | 'all', methodFilter); },
                options: [
                  { label: 'Tất cả', value: 'all' },
                  { label: '⏳ Đang xử lý', value: 'pending' },
                  { label: '✓ Hoàn thành', value: 'completed' },
                  { label: '✗ Thất bại', value: 'failed' },
                  { label: '— Đã hủy', value: 'cancelled' },
                ],
                width: 140,
              },
              {
                label: 'Phương thức', value: methodFilter,
                onChange: (v: string) => { setMethodFilter(v as 'crypto' | 'bank' | 'all'); applyFilters(typeFilter, statusFilter, v as 'crypto' | 'bank' | 'all'); },
                options: [{ label: 'Tất cả', value: 'all' }, { label: 'Crypto', value: 'crypto' }, { label: 'Ngân hàng', value: 'bank' }],
                width: 130,
              },
            ].map(({ label, value, onChange, options, width }) => (
              <div key={label}>
                <Text style={{ color: '#7a8fa6', fontSize: 12, display: 'block', marginBottom: 4 }}>{label}</Text>
                <Select value={value} onChange={onChange} style={{ width }} options={options} />
              </div>
            ))}
            <div>
              <Text style={{ color: '#7a8fa6', fontSize: 12, display: 'block', marginBottom: 4 }}>Khoảng thời gian</Text>
              <RangePicker placeholder={['Từ ngày', 'Đến ngày']} />
            </div>
            <Button icon={<CloseOutlined />} onClick={resetFilters}>Reset</Button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#4a5f73' }}>Đang tải...</div>
      ) : transactions.length === 0 ? (
        <div style={{ background: '#182230', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 40, textAlign: 'center' }}>
          <Text style={{ color: '#4a5f73' }}>Không có giao dịch nào</Text>
        </div>
      ) : isMobile ? (
        /* Mobile cards */
        <>{transactions.map(renderMobileCard)}</>
      ) : (
        /* Desktop table */
        <div style={{ background: '#182230', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#1a2840' }}>
                {['Giao dịch', 'Chi tiết', 'Số tiền', 'Trạng thái / Lý do', 'Thời gian', ''].map((h) => (
                  <th key={h} style={{
                    padding: '11px 16px', textAlign: 'left',
                    color: '#4a5f73', fontSize: 11, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    borderBottom: '1px solid rgba(255,255,255,0.07)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const { sign, val } = formatAmount(tx);
                const cfg = STATUS_CFG[tx.status];
                const isDeposit = tx.type === 'deposit';
                return (
                  <tr key={tx.id}
                    onClick={() => { setSelectedTx(tx); setDrawerVisible(true); }}
                    style={{ cursor: 'pointer', transition: 'background 0.12s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#1a2840')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Col 1 — type + icon */}
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <TxIcon tx={tx} />
                        <div>
                          <Text style={{ color: '#e8edf5', fontWeight: 600, fontSize: 13, display: 'block' }}>
                            {isDeposit ? 'Nạp tiền' : 'Rút tiền'}
                          </Text>
                          <Text style={{ color: '#4a5f73', fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>
                            {tx.id}
                          </Text>
                        </div>
                      </div>
                    </td>

                    {/* Col 2 — bank/crypto detail */}
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', minWidth: 200 }}>
                      {tx.method === 'bank' ? (
                        <div>
                          <Text style={{ color: '#e8edf5', fontWeight: 600, fontSize: 13, display: 'block' }}>
                            {tx.bankName || tx.bankCode}
                          </Text>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                            {tx.accountNumber && (
                              <Text style={{ color: '#4f8ef7', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                                •••• {tx.accountNumber.slice(-4)}
                              </Text>
                            )}
                            {tx.accountName && (
                              <Text style={{ color: '#7a8fa6', fontSize: 11 }}>· {tx.accountName}</Text>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <Text style={{ color: '#e8edf5', fontWeight: 600, fontSize: 13 }}>
                              {tx.cryptoAsset || tx.currency}
                            </Text>
                            <NetworkBadge network={tx.network} />
                          </div>
                          {tx.walletAddress && (
                            <Text style={{ color: '#4a5f73', fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>
                              {tx.walletAddress.slice(0, 8)}...{tx.walletAddress.slice(-6)}
                            </Text>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Col 3 — amount */}
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <Text style={{ color: isDeposit ? '#22c55e' : '#ef4444', fontWeight: 700, fontSize: 15 }}>
                        {sign}{val}
                      </Text>
                    </td>

                    {/* Col 4 — status + reason */}
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: cfg.bg, color: cfg.color,
                        border: `1px solid ${cfg.border}`,
                        borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 600,
                      }}>
                        {cfg.icon} {cfg.label}
                      </span>
                      {tx.rejectReason && (
                        <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <ExclamationCircleOutlined style={{ color: '#ef4444', fontSize: 10 }} />
                          <Text style={{ color: '#ef4444', fontSize: 10 }}>{tx.rejectReason}</Text>
                        </div>
                      )}
                    </td>

                    {/* Col 5 — time */}
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <Text style={{ color: '#e8edf5', fontSize: 13, display: 'block' }}>
                        {dayjs(tx.createdAt).format('DD/MM/YYYY')}
                      </Text>
                      <Text style={{ color: '#4a5f73', fontSize: 11 }}>
                        {dayjs(tx.createdAt).format('HH:mm:ss')}
                      </Text>
                    </td>

                    {/* Col 6 — cancel button */}
                    <td style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', width: 80 }}>
                      {tx.type === 'withdraw' && tx.status === 'pending' && (
                        <Button
                          size="small" danger
                          onClick={(e) => { e.stopPropagation(); handleCancelWithdraw(tx); }}
                          style={{ fontSize: 11, height: 26, padding: '0 8px' }}
                        >
                          Hủy rút
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <HistoryOutlined style={{ color: '#4f8ef7' }} />
            <span style={{ color: '#e8edf5' }}>Chi tiết giao dịch</span>
          </div>
        }
        placement="right"
        width={isMobile ? '100vw' : 460}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        styles={{ body: { padding: '16px 20px' } }}
      >
        {renderDetail()}
      </Drawer>
    </div>
  );
};

export default HistoryPage;
