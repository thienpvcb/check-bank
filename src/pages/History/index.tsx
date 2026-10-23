import { useState, useEffect } from 'react';
import {
  Select, DatePicker, Button, Typography, Drawer,
  Descriptions, Tag, Grid, Statistic, Row, Col, Card,
} from 'antd';
import {
  HistoryOutlined, ReloadOutlined,
  ArrowUpOutlined, ArrowDownOutlined,
  FilterOutlined, CloseOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { mockTransactions } from '../../mocks/transactions';
import { transactionApi } from '../../services/api';
import { USE_API } from '../../hooks/useApi';
import type { Transaction, TransactionStatus, TransactionType } from '../../types';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

const STATUS_CONFIG: Record<TransactionStatus, { color: string; bg: string; label: string; badge: 'processing' | 'success' | 'error' | 'default' }> = {
  pending:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  label: 'Đang xử lý', badge: 'processing' },
  completed: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   label: 'Hoàn thành',  badge: 'success' },
  failed:    { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   label: 'Thất bại',    badge: 'error' },
  cancelled: { color: '#7a8fa6', bg: 'rgba(122,143,166,0.1)', label: 'Đã hủy',     badge: 'default' },
  expired:   { color: '#7a8fa6', bg: 'rgba(122,143,166,0.1)', label: 'Hết hạn',    badge: 'default' },
};

const HistoryPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [loading, setLoading] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  const [typeFilter, setTypeFilter]     = useState<TransactionType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'all'>('all');
  const [methodFilter, setMethodFilter] = useState<'crypto' | 'bank' | 'all'>('all');

  // Load từ API khi USE_API=true
  useEffect(() => {
    if (!USE_API) return;
    setLoading(true);
    transactionApi.list()
      .then((data) => setTransactions(data))
      .catch(() => {}) // giữ mock nếu lỗi
      .finally(() => setLoading(false));
  }, []);

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const totalDeposit  = transactions.filter((t) => t.type === 'deposit'  && t.status === 'completed').length;
  const totalWithdraw = transactions.filter((t) => t.type === 'withdraw' && t.status === 'completed').length;
  const pending       = transactions.filter((t) => t.status === 'pending').length;

  const applyFilters = (type = typeFilter, status = statusFilter, meth = methodFilter) => {
    setLoading(true);
    setTimeout(() => {
      let r = [...transactions];
      if (type   !== 'all') r = r.filter((t) => t.type   === type);
      if (status !== 'all') r = r.filter((t) => t.status === status);
      if (meth   !== 'all') r = r.filter((t) => t.method === meth);
      setTransactions(r);
      setLoading(false);
    }, 200);
  };

  const resetFilters = () => {
    setTypeFilter('all'); setStatusFilter('all'); setMethodFilter('all');
    setTransactions(mockTransactions);
  };

  const formatAmount = (tx: Transaction) => {
    const sign = tx.type === 'deposit' ? '+' : '-';
    const val  = tx.method === 'bank'
      ? `${tx.amount.toLocaleString('vi-VN')} ₫`
      : `${tx.amount} ${tx.currency}`;
    return { sign, val };
  };

  const renderTxCard = (tx: Transaction) => {
    const { sign, val } = formatAmount(tx);
    const cfg = STATUS_CONFIG[tx.status];
    const isDeposit = tx.type === 'deposit';

    return (
      <div
        key={tx.id}
        className="tx-card"
        onClick={() => { setSelectedTx(tx); setDrawerVisible(true); }}
      >
        <div className="tx-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: isDeposit ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${isDeposit ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {isDeposit
                ? <ArrowDownOutlined style={{ color: '#22c55e', fontSize: 16 }} />
                : <ArrowUpOutlined   style={{ color: '#ef4444', fontSize: 16 }} />}
            </div>
            <div>
              <Text style={{ color: '#e8edf5', fontWeight: 600, display: 'block', fontSize: 14 }}>
                {isDeposit ? 'Nạp tiền' : 'Rút tiền'} · {tx.method === 'crypto' ? (tx.network || tx.cryptoAsset) : tx.bankName}
              </Text>
              <Text style={{ color: '#4a5f73', fontSize: 11 }}>{tx.id}</Text>
            </div>
          </div>
          <Text style={{ color: isDeposit ? '#22c55e' : '#ef4444', fontWeight: 700, fontSize: 15 }}>
            {sign}{val}
          </Text>
        </div>
        <div className="tx-card-footer">
          <Text style={{ color: '#4a5f73', fontSize: 11 }}>
            {dayjs(tx.createdAt).format('DD/MM/YYYY HH:mm')}
          </Text>
          <span style={{
            background: cfg.bg, color: cfg.color,
            borderRadius: 6, padding: '2px 10px', fontSize: 11, fontWeight: 500,
          }}>
            {cfg.label}
          </span>
        </div>
      </div>
    );
  };

  const renderDetail = () => {
    if (!selectedTx) return null;
    const { sign, val } = formatAmount(selectedTx);
    const cfg = STATUS_CONFIG[selectedTx.status];
    const isDeposit = selectedTx.type === 'deposit';

    return (
      <div>
        {/* Amount header */}
        <div style={{ textAlign: 'center', padding: '24px 0 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 20 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: isDeposit ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${isDeposit ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px',
          }}>
            {isDeposit
              ? <ArrowDownOutlined style={{ color: '#22c55e', fontSize: 24 }} />
              : <ArrowUpOutlined   style={{ color: '#ef4444', fontSize: 24 }} />}
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: isDeposit ? '#22c55e' : '#ef4444', marginBottom: 4 }}>
            {sign}{val}
          </div>
          <span style={{ background: cfg.bg, color: cfg.color, borderRadius: 8, padding: '4px 14px', fontSize: 13, fontWeight: 600 }}>
            {cfg.label}
          </span>
        </div>

        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Mã giao dịch">
            <Text copyable style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{selectedTx.id}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Loại">
            {isDeposit ? <Tag color="green">Nạp tiền</Tag> : <Tag color="red">Rút tiền</Tag>}
          </Descriptions.Item>
          <Descriptions.Item label="Phương thức">
            {selectedTx.method === 'crypto' ? 'Crypto' : 'Ngân hàng'}
          </Descriptions.Item>
          <Descriptions.Item label="Thời gian">
            {dayjs(selectedTx.createdAt).format('DD/MM/YYYY HH:mm:ss')}
          </Descriptions.Item>

          {selectedTx.method === 'crypto' && (
            <>
              <Descriptions.Item label="Mạng lưới"><Tag color="blue">{selectedTx.network}</Tag></Descriptions.Item>
              <Descriptions.Item label="Địa chỉ ví">
                <Text copyable style={{ wordBreak: 'break-all', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#4f8ef7' }}>
                  {selectedTx.walletAddress}
                </Text>
              </Descriptions.Item>
              {selectedTx.txHash && (
                <Descriptions.Item label="TxHash">
                  <Text copyable style={{ wordBreak: 'break-all', fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                    {selectedTx.txHash}
                  </Text>
                </Descriptions.Item>
              )}
            </>
          )}

          {selectedTx.method === 'bank' && (
            <>
              <Descriptions.Item label="Ngân hàng">{selectedTx.bankName}</Descriptions.Item>
              <Descriptions.Item label="Số tài khoản">
                <Text copyable>{selectedTx.accountNumber}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Chủ tài khoản">{selectedTx.accountName}</Descriptions.Item>
            </>
          )}
        </Descriptions>
      </div>
    );
  };

  return (
    <div>
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
          <Button
            icon={<FilterOutlined />}
            onClick={() => setShowFilter(!showFilter)}
            type={showFilter ? 'primary' : 'default'}
          >
            {!isMobile && 'Lọc'}
          </Button>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={() => {
            setLoading(true);
            (USE_API ? transactionApi.list() : Promise.resolve(mockTransactions))
              .then((data) => setTransactions(data))
              .finally(() => setLoading(false));
          }} />
        </div>
      </div>

      {/* Summary cards */}
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        {[
          { label: 'Nạp thành công', value: totalDeposit,  color: '#22c55e', cls: 'stat-card-green' },
          { label: 'Rút thành công', value: totalWithdraw, color: '#ef4444', cls: 'stat-card-red' },
          { label: 'Đang xử lý',    value: pending,        color: '#f59e0b', cls: 'stat-card-yellow' },
          { label: 'Tổng giao dịch',value: mockTransactions.length, color: '#4f8ef7', cls: 'stat-card-blue' },
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

      {/* Filter panel */}
      {showFilter && (
        <div style={{
          background: '#182230', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12, padding: '16px', marginBottom: 16,
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
            <div>
              <Text style={{ color: '#7a8fa6', fontSize: 12, display: 'block', marginBottom: 4 }}>Loại GD</Text>
              <Select value={typeFilter} onChange={(v) => { setTypeFilter(v); applyFilters(v, statusFilter, methodFilter); }}
                style={{ width: 130 }}
                options={[
                  { label: 'Tất cả', value: 'all' },
                  { label: '↓ Nạp tiền', value: 'deposit' },
                  { label: '↑ Rút tiền', value: 'withdraw' },
                ]}
              />
            </div>
            <div>
              <Text style={{ color: '#7a8fa6', fontSize: 12, display: 'block', marginBottom: 4 }}>Trạng thái</Text>
              <Select value={statusFilter} onChange={(v) => { setStatusFilter(v); applyFilters(typeFilter, v, methodFilter); }}
                style={{ width: 140 }}
                options={[
                  { label: 'Tất cả', value: 'all' },
                  { label: '⏳ Đang xử lý', value: 'pending' },
                  { label: '✓ Hoàn thành', value: 'completed' },
                  { label: '✗ Thất bại', value: 'failed' },
                  { label: '— Đã hủy', value: 'cancelled' },
                ]}
              />
            </div>
            <div>
              <Text style={{ color: '#7a8fa6', fontSize: 12, display: 'block', marginBottom: 4 }}>Phương thức</Text>
              <Select value={methodFilter} onChange={(v) => { setMethodFilter(v); applyFilters(typeFilter, statusFilter, v); }}
                style={{ width: 130 }}
                options={[
                  { label: 'Tất cả', value: 'all' },
                  { label: 'Crypto', value: 'crypto' },
                  { label: 'Ngân hàng', value: 'bank' },
                ]}
              />
            </div>
            <div>
              <Text style={{ color: '#7a8fa6', fontSize: 12, display: 'block', marginBottom: 4 }}>Khoảng thời gian</Text>
              <RangePicker placeholder={['Từ ngày', 'Đến ngày']} />
            </div>
            <Button icon={<CloseOutlined />} onClick={resetFilters} style={{ marginBottom: 0 }}>
              Reset
            </Button>
          </div>
        </div>
      )}

      {/* Transaction list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#4a5f73' }}>Đang tải...</div>
      ) : transactions.length === 0 ? (
        <div style={{
          background: '#182230', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12, padding: 40, textAlign: 'center',
        }}>
          <Text style={{ color: '#4a5f73', fontSize: 14 }}>Không có giao dịch nào</Text>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          {!isMobile && (
            <div style={{
              background: '#182230', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 12, overflow: 'hidden',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Loại', 'Phương thức', 'Số tiền', 'Trạng thái', 'Thời gian', 'Mã GD'].map((h) => (
                      <th key={h} style={{
                        padding: '12px 16px', textAlign: 'left',
                        color: '#4a5f73', fontSize: 11, fontWeight: 600,
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                        background: '#1e2d40', borderBottom: '1px solid rgba(255,255,255,0.07)',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    const { sign, val } = formatAmount(tx);
                    const cfg = STATUS_CONFIG[tx.status];
                    const isDeposit = tx.type === 'deposit';
                    return (
                      <tr key={tx.id}
                        onClick={() => { setSelectedTx(tx); setDrawerVisible(true); }}
                        style={{ cursor: 'pointer', transition: 'background 0.15s' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#1e2d40')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: 8,
                              background: isDeposit ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              {isDeposit
                                ? <ArrowDownOutlined style={{ color: '#22c55e', fontSize: 13 }} />
                                : <ArrowUpOutlined   style={{ color: '#ef4444', fontSize: 13 }} />}
                            </div>
                            <Text style={{ color: '#e8edf5', fontWeight: 500 }}>
                              {isDeposit ? 'Nạp' : 'Rút'}
                            </Text>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <Text style={{ color: '#e8edf5', display: 'block', fontSize: 13 }}>
                            {tx.method === 'crypto' ? 'Crypto' : 'Ngân hàng'}
                          </Text>
                          <Text style={{ color: '#4a5f73', fontSize: 11 }}>
                            {tx.method === 'crypto' ? tx.network : tx.bankName}
                          </Text>
                        </td>
                        <td style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <Text style={{ color: isDeposit ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                            {sign}{val}
                          </Text>
                        </td>
                        <td style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <span style={{ background: cfg.bg, color: cfg.color, borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 500 }}>
                            {cfg.label}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <Text style={{ color: '#7a8fa6', fontSize: 13 }}>
                            {dayjs(tx.createdAt).format('DD/MM/YYYY HH:mm')}
                          </Text>
                        </td>
                        <td style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <Text style={{ color: '#4a5f73', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{tx.id}</Text>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Mobile cards */}
          {isMobile && transactions.map(renderTxCard)}
        </>
      )}

      {/* Detail drawer */}
      <Drawer
        title="Chi tiết giao dịch"
        placement="right"
        width={isMobile ? '100vw' : 440}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
      >
        {renderDetail()}
      </Drawer>
    </div>
  );
};

export default HistoryPage;
