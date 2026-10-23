import { useState, useEffect } from 'react';
import { Typography, Table, Tag, Input, Button, Grid } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { AuditOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { adminApi, type AuditLog } from '../../services/api';
import { USE_API } from '../../hooks/useApi';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const AuditLogPage = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const load = async () => {
    if (!USE_API) return;
    setLoading(true);
    try {
      const data = await adminApi.auditLogs();
      setLogs(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = logs.filter((l) =>
    !search || l.txId.toLowerCase().includes(search.toLowerCase()) ||
    l.adminName.toLowerCase().includes(search.toLowerCase()) ||
    l.reason?.toLowerCase().includes(search.toLowerCase())
  );

  const columns: ColumnsType<AuditLog> = [
    {
      title: 'Thời gian', dataIndex: 'createdAt', key: 'time', width: 160,
      render: (d) => <Text style={{ color: '#7a8fa6', fontSize: 12 }}>{dayjs(d).format('DD/MM/YYYY HH:mm:ss')}</Text>,
      sorter: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      defaultSortOrder: 'ascend',
    },
    {
      title: 'Hành động', dataIndex: 'action', key: 'action', width: 130,
      render: (action) => (
        <Tag
          icon={action === 'approve' ? '✓' : '✗'}
          color={action === 'approve' ? 'success' : 'error'}
          style={{ fontWeight: 600 }}
        >
          {action === 'approve' ? 'Đã duyệt' : 'Từ chối'}
        </Tag>
      ),
    },
    {
      title: 'Mã GD', dataIndex: 'txId', key: 'txId', width: 150,
      render: (id) => <Text style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#4f8ef7' }}>{id}</Text>,
    },
    {
      title: 'Admin', dataIndex: 'adminName', key: 'admin', width: 140,
      render: (name) => <Text style={{ color: '#e8edf5', fontWeight: 500 }}>{name}</Text>,
    },
    {
      title: 'Trạng thái', key: 'status', width: 180,
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Tag color="default" style={{ fontSize: 10 }}>{r.beforeStatus}</Tag>
          <span style={{ color: '#4a5f73' }}>→</span>
          <Tag color={r.afterStatus === 'completed' ? 'success' : 'error'} style={{ fontSize: 10 }}>{r.afterStatus}</Tag>
        </div>
      ),
    },
    {
      title: 'Lý do', dataIndex: 'reason', key: 'reason',
      render: (r) => r
        ? <Text style={{ color: '#7a8fa6', fontSize: 12 }}>{r}</Text>
        : <Text style={{ color: '#4a5f73', fontSize: 11 }}>—</Text>,
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ color: '#e8edf5', margin: 0 }}>
            <AuditOutlined style={{ marginRight: 8 }} />Audit Log
          </Title>
          <Text style={{ color: '#7a8fa6', fontSize: 13 }}>
            {filtered.length} bản ghi · Lịch sử hành động admin
          </Text>
        </div>
        <Button icon={<ReloadOutlined />} loading={loading} onClick={load}>Làm mới</Button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <Input
          prefix={<SearchOutlined style={{ color: '#4a5f73' }} />}
          placeholder="Tìm theo mã GD, admin, lý do..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 360 }}
          allowClear
        />
      </div>

      {!USE_API ? (
        <div style={{ background: '#0f1923', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, padding: 24, textAlign: 'center' }}>
          <Text style={{ color: '#f59e0b' }}>⚠️ Bật VITE_USE_API=true để kết nối backend thật</Text>
        </div>
      ) : (
        <div style={{ background: '#0f1923', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
          <Table
            columns={columns}
            dataSource={filtered}
            rowKey="id"
            loading={loading}
            scroll={{ x: isMobile ? 800 : undefined }}
            pagination={{ pageSize: 50, showSizeChanger: true, showTotal: (t) => `${t} bản ghi` }}
            locale={{ emptyText: <div style={{ padding: 40, color: '#4a5f73' }}>Chưa có audit log</div> }}
          />
        </div>
      )}
    </div>
  );
};

export default AuditLogPage;
