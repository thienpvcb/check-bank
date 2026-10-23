import { useState, useEffect, useCallback } from 'react';
import {
  Typography, Table, Tag, Button, Modal, Descriptions,
  Input, Space, Badge, Tooltip, message, Grid, Drawer,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CheckCircleOutlined, CloseCircleOutlined, ReloadOutlined,
  ArrowDownOutlined, ArrowUpOutlined, EyeOutlined,
  ClockCircleOutlined, AuditOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { adminApi, type AdminTransaction, type AuditLog } from '../../services/api';
import { USE_API } from '../../hooks/useApi';
import type { TransactionType } from '../../types';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { useBreakpoint } = Grid;

interface Props {
  txType: TransactionType; // 'deposit' | 'withdraw'
}

const TransactionReview = ({ txType }: Props) => {
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTx, setSelectedTx] = useState<AdminTransaction | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const isDeposit = txType === 'deposit';
  const accentColor = isDeposit ? '#22c55e' : '#ef4444';

  const load = useCallback(async () => {
    if (!USE_API) { setTransactions([]); return; }
    setLoading(true);
    try {
      const res = await adminApi.transactions({ type: txType, status: 'pending', limit: 200 });
      setTransactions(res.data ?? []);
    } catch (err) {
      message.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [txType]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (tx: AdminTransaction) => {
    setSelectedTx(tx);
    setDetailVisible(true);
    if (USE_API) {
      const full = await adminApi.getTransaction(tx.id);
      setSelectedTx(full);
      setAuditLogs((full as unknown as { auditLogs?: AuditLog[] }).auditLogs ?? []);
    }
  };

  const handleApprove = async (id: string, note?: string) => {
    setActionLoading(true);
    try {
      await adminApi.approve(id, note);
      message.success('Đã duyệt thành công!');
      setDetailVisible(false);
      load();
    } catch (err) {
      message.error((err as Error).message);
    } finally { setActionLoading(false); }
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectReason.trim()) {
      message.error('Vui lòng nhập lý do từ chối');
      return;
    }
    setActionLoading(true);
    try {
      await adminApi.reject(rejectModal, rejectReason);
      message.success('Đã từ chối giao dịch');
      setRejectModal(null);
      setRejectReason('');
      setDetailVisible(false);
      load();
    } catch (err) {
      message.error((err as Error).message);
    } finally { setActionLoading(false); }
  };

  const columns: ColumnsType<AdminTransaction> = [
    {
      title: 'Mã GD', dataIndex: 'id', key: 'id', width: 130,
      render: (id) => <Text style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#7a8fa6' }}>{id}</Text>,
    },
    {
      title: 'User', key: 'user', width: 150,
      render: (_, r) => (
        <div>
          <Text style={{ color: '#e8edf5', fontWeight: 600, display: 'block', fontSize: 13 }}>{r.userFullName}</Text>
          <Text style={{ color: '#4a5f73', fontSize: 11 }}>{r.username}</Text>
        </div>
      ),
    },
    {
      title: 'Phương thức', dataIndex: 'method', key: 'method', width: 120,
      render: (method, r) => (
        <div>
          <Tag color={method === 'crypto' ? 'gold' : 'blue'} style={{ fontSize: 11 }}>
            {method === 'crypto' ? 'Crypto' : 'Bank'}
          </Tag>
          <Text style={{ color: '#4a5f73', fontSize: 11, display: 'block' }}>
            {method === 'crypto' ? r.network : r.bankName}
          </Text>
        </div>
      ),
    },
    {
      title: 'Số tiền', key: 'amount', width: 140,
      render: (_, r) => (
        <Text style={{ color: accentColor, fontWeight: 700, fontSize: 14 }}>
          {r.method === 'bank' ? r.amount.toLocaleString('vi-VN') + ' ₫' : r.amount + ' ' + r.currency}
        </Text>
      ),
    },
    {
      title: 'Thời gian', dataIndex: 'createdAt', key: 'createdAt', width: 160,
      render: (d) => <Text style={{ color: '#7a8fa6', fontSize: 12 }}>{dayjs(d).format('DD/MM HH:mm:ss')}</Text>,
    },
    {
      title: 'Hết hạn', dataIndex: 'expiresAt', key: 'expiresAt', width: 140,
      render: (d) => {
        if (!d) return <Text style={{ color: '#4a5f73' }}>—</Text>;
        const remaining = new Date(d).getTime() - Date.now();
        const color = remaining > 30 * 60_000 ? '#22c55e' : remaining > 10 * 60_000 ? '#f59e0b' : '#ef4444';
        return (
          <Text style={{ color, fontSize: 12 }}>
            <ClockCircleOutlined style={{ marginRight: 4 }} />
            {dayjs(d).format('HH:mm')}
          </Text>
        );
      },
    },
    {
      title: 'Hành động', key: 'actions', width: 160,
      render: (_, r) => (
        <Space size={6}>
          <Tooltip title="Xem chi tiết">
            <Button size="small" icon={<EyeOutlined />} onClick={() => openDetail(r)} />
          </Tooltip>
          <Tooltip title="Duyệt">
            <Button size="small" type="primary" icon={<CheckCircleOutlined />}
              style={{ background: '#16a34a', borderColor: '#16a34a' }}
              loading={actionLoading}
              onClick={() => handleApprove(r.id)}
            />
          </Tooltip>
          <Tooltip title="Từ chối">
            <Button size="small" danger icon={<CloseCircleOutlined />}
              onClick={() => { setRejectModal(r.id); setRejectReason(''); }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const renderAuditLogs = () => (
    <div>
      {auditLogs.length === 0 ? (
        <Text style={{ color: '#4a5f73', fontSize: 13 }}>Chưa có hành động nào</Text>
      ) : auditLogs.map((log) => (
        <div key={log.id} style={{
          background: '#1e2d40', borderRadius: 8, padding: '10px 14px', marginBottom: 8,
          borderLeft: `3px solid ${log.action === 'approve' ? '#22c55e' : '#ef4444'}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ color: log.action === 'approve' ? '#22c55e' : '#ef4444', fontWeight: 600, fontSize: 13 }}>
              {log.action === 'approve' ? '✓ Đã duyệt' : '✗ Từ chối'}
            </Text>
            <Text style={{ color: '#4a5f73', fontSize: 11 }}>{dayjs(log.createdAt).format('DD/MM HH:mm:ss')}</Text>
          </div>
          <Text style={{ color: '#7a8fa6', fontSize: 12, display: 'block' }}>By: {log.adminName}</Text>
          {log.reason && <Text style={{ color: '#e8edf5', fontSize: 12 }}>Lý do: {log.reason}</Text>}
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ color: '#e8edf5', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            {isDeposit
              ? <ArrowDownOutlined style={{ color: '#22c55e' }} />
              : <ArrowUpOutlined   style={{ color: '#ef4444' }} />}
            {isDeposit ? 'Duyệt nạp tiền' : 'Duyệt rút tiền'}
          </Title>
          <Text style={{ color: '#7a8fa6', fontSize: 13 }}>
            {transactions.length} giao dịch đang chờ duyệt
          </Text>
        </div>
        <Button icon={<ReloadOutlined />} loading={loading} onClick={load}>Làm mới</Button>
      </div>

      {!USE_API ? (
        <div style={{ background: '#0f1923', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, padding: 24, textAlign: 'center' }}>
          <Text style={{ color: '#f59e0b' }}>⚠️ Bật VITE_USE_API=true để kết nối backend thật</Text>
        </div>
      ) : (
        <div style={{ background: '#0f1923', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
          <Table
            columns={columns}
            dataSource={transactions}
            rowKey="id"
            loading={loading}
            scroll={{ x: 900 }}
            pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `${t} giao dịch` }}
            locale={{ emptyText: <div style={{ padding: 40, color: '#4a5f73' }}>Không có giao dịch chờ duyệt</div> }}
          />
        </div>
      )}

      {/* Detail Drawer */}
      <Drawer
        title={<span style={{ color: '#e8edf5' }}>Chi tiết giao dịch</span>}
        placement="right"
        width={isMobile ? '100vw' : 520}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        extra={
          selectedTx?.status === 'pending' && (
            <Space>
              <Button type="primary" icon={<CheckCircleOutlined />}
                style={{ background: '#16a34a', borderColor: '#16a34a' }}
                loading={actionLoading}
                onClick={() => handleApprove(selectedTx.id)}
              >
                Duyệt
              </Button>
              <Button danger icon={<CloseCircleOutlined />}
                onClick={() => { setRejectModal(selectedTx.id); setRejectReason(''); }}
              >
                Từ chối
              </Button>
            </Space>
          )
        }
      >
        {selectedTx && (
          <>
            {/* Amount header */}
            <div style={{ textAlign: 'center', padding: '20px 0', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 20 }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: accentColor, marginBottom: 6 }}>
                {selectedTx.method === 'bank'
                  ? selectedTx.amount.toLocaleString('vi-VN') + ' ₫'
                  : selectedTx.amount + ' ' + selectedTx.currency}
              </div>
              <Badge status={selectedTx.status === 'pending' ? 'processing' : 'success'} text={
                <Text style={{ color: '#e8edf5' }}>{selectedTx.status}</Text>
              } />
            </div>

            <Descriptions column={1} bordered size="small" style={{ marginBottom: 20 }}>
              <Descriptions.Item label="Mã GD">
                <Text copyable style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{selectedTx.id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="User">{selectedTx.userFullName} ({selectedTx.username})</Descriptions.Item>
              <Descriptions.Item label="Email">{selectedTx.userEmail}</Descriptions.Item>
              <Descriptions.Item label="Phương thức">
                <Tag color={selectedTx.method === 'crypto' ? 'gold' : 'blue'}>{selectedTx.method}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Thời gian tạo">{dayjs(selectedTx.createdAt).format('DD/MM/YYYY HH:mm:ss')}</Descriptions.Item>
              {selectedTx.expiresAt && (
                <Descriptions.Item label="Hết hạn">{dayjs(selectedTx.expiresAt).format('DD/MM/YYYY HH:mm:ss')}</Descriptions.Item>
              )}

              {selectedTx.method === 'crypto' && (
                <>
                  <Descriptions.Item label="Mạng"><Tag color="blue">{selectedTx.network}</Tag></Descriptions.Item>
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
                  <Descriptions.Item label="Ngân hàng">{selectedTx.bankName || selectedTx.bankCode}</Descriptions.Item>
                  <Descriptions.Item label="Số tài khoản">
                    <Text copyable>{selectedTx.accountNumber}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Chủ TK">{selectedTx.accountName}</Descriptions.Item>
                  {(selectedTx as unknown as Record<string,string>)['transferContent'] && (
                    <Descriptions.Item label="Nội dung CK">
                      <Text copyable style={{ color: '#4f8ef7', fontWeight: 600 }}>
                        {(selectedTx as unknown as Record<string,string>)['transferContent']}
                      </Text>
                    </Descriptions.Item>
                  )}
                </>
              )}
            </Descriptions>

            {/* Audit logs */}
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <AuditOutlined style={{ color: '#4f8ef7' }} />
                <Text style={{ color: '#e8edf5', fontWeight: 600 }}>Lịch sử hành động</Text>
              </div>
              {renderAuditLogs()}
            </div>
          </>
        )}
      </Drawer>

      {/* Reject Modal */}
      <Modal
        open={!!rejectModal}
        onCancel={() => { setRejectModal(null); setRejectReason(''); }}
        onOk={handleReject}
        confirmLoading={actionLoading}
        title={<span style={{ color: '#e8edf5' }}><CloseCircleOutlined style={{ color: '#ef4444', marginRight: 8 }} />Từ chối giao dịch</span>}
        okText="Xác nhận từ chối" okButtonProps={{ danger: true }}
        cancelText="Hủy"
        centered
      >
        <div style={{ marginBottom: 12 }}>
          <Text style={{ color: '#7a8fa6', fontSize: 13 }}>Vui lòng nhập lý do từ chối (bắt buộc):</Text>
        </div>
        <TextArea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="VD: Không tìm thấy giao dịch chuyển khoản phù hợp, thông tin tài khoản không khớp..."
          rows={4}
          maxLength={500}
          showCount
        />
      </Modal>
    </div>
  );
};

export default TransactionReview;
