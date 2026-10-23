import { useState, useEffect, useCallback } from 'react';
import {
  Typography, Table, Tag, Button, Modal, Form, Input,
  Select, Space, Badge, Tooltip, message, InputNumber,
  Row, Col, Statistic, Card, Grid,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, ReloadOutlined, StopOutlined, CheckCircleOutlined,
  DollarOutlined, UserOutlined, TeamOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { adminApi, type AdminUser } from '../../services/api';
import { USE_API } from '../../hooks/useApi';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

// ── Mock data for when API is disabled ────────────────────────
const mockUsers: AdminUser[] = [
  {
    id: 'u1', username: 'demo', fullName: 'Nguyễn Văn Demo', email: 'demo@checkbank.vn',
    balance: 12_500_000, balanceUsdt: 487.25, avatar: 'ND', role: 'user',
    isActive: true, createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'u2', username: 'admin', fullName: 'Admin CheckBank', email: 'admin@checkbank.vn',
    balance: 99_000_000, balanceUsdt: 3_850, avatar: 'AD', role: 'admin',
    isActive: true, createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'u3', username: 'testuser', fullName: 'Trần Thị Test', email: 'test@checkbank.vn',
    balance: 500_000, balanceUsdt: 0, avatar: 'TT', role: 'user',
    isActive: false, disabledAt: '2026-06-01T00:00:00Z', createdAt: '2026-03-15T00:00:00Z',
  },
];

const UserManagement = () => {
  const [users, setUsers]               = useState<AdminUser[]>([]);
  const [loading, setLoading]           = useState(false);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');

  // Create user modal
  const [createVisible, setCreateVisible] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm]                       = Form.useForm();

  // Credit modal
  const [creditUser, setCreditUser]       = useState<AdminUser | null>(null);
  const [creditLoading, setCreditLoading] = useState(false);
  const [creditForm]                       = Form.useForm();

  // Toggle modal
  const [toggleUser, setToggleUser]       = useState<AdminUser | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [toggleReason, setToggleReason]   = useState('');

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (!USE_API) {
        setUsers(mockUsers);
        return;
      }
      const data = await adminApi.users();
      setUsers(data);
    } catch (err) {
      message.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Filtered list ──────────────────────────────────────────
  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active'   &&  u.isActive) ||
      (statusFilter === 'disabled' && !u.isActive);
    return matchSearch && matchStatus;
  });

  const totalActive   = users.filter((u) => u.isActive).length;
  const totalDisabled = users.filter((u) => !u.isActive).length;

  // ── Handlers ───────────────────────────────────────────────
  const handleCreate = async () => {
    let values: { username: string; password: string; fullName: string; email: string; role?: string };
    try { values = await createForm.validateFields(); }
    catch { return; }

    setCreateLoading(true);
    try {
      if (USE_API) {
        const created = await adminApi.createUser(values);
        setUsers((prev) => [created, ...prev]);
      } else {
        // Mock: just push into local state
        const mock: AdminUser = {
          id: `u${Date.now()}`, ...values, role: (values.role ?? 'user') as 'user' | 'admin',
          balance: 0, balanceUsdt: 0,
          avatar: values.fullName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase(),
          isActive: true, createdAt: new Date().toISOString(),
        };
        setUsers((prev) => [mock, ...prev]);
      }
      message.success('Đã tạo tài khoản thành công');
      setCreateVisible(false);
      createForm.resetFields();
    } catch (err) {
      message.error((err as Error).message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCredit = async () => {
    if (!creditUser) return;
    let values: { currency: 'VND' | 'USDT'; amount: number; note: string };
    try { values = await creditForm.validateFields(); }
    catch { return; }

    setCreditLoading(true);
    try {
      const body = {
        vndAmount:  values.currency === 'VND'  ? values.amount : 0,
        usdtAmount: values.currency === 'USDT' ? values.amount : 0,
        note:       values.note,
      };
      if (USE_API) {
        const updated = await adminApi.creditBalance(creditUser.id, body);
        setUsers((prev) => prev.map((u) => u.id === updated.id ? updated : u));
      } else {
        setUsers((prev) => prev.map((u) => {
          if (u.id !== creditUser.id) return u;
          return {
            ...u,
            balance:      values.currency === 'VND'  ? Math.max(0, u.balance      + values.amount) : u.balance,
            balanceUsdt:  values.currency === 'USDT' ? Math.max(0, u.balanceUsdt  + values.amount) : u.balanceUsdt,
          };
        }));
      }
      message.success('Đã cập nhật số dư');
      setCreditUser(null);
      creditForm.resetFields();
    } catch (err) {
      message.error((err as Error).message);
    } finally {
      setCreditLoading(false);
    }
  };

  const handleToggle = async () => {
    if (!toggleUser) return;
    const newActive = !toggleUser.isActive;

    setToggleLoading(true);
    try {
      if (USE_API) {
        const updated = await adminApi.toggleUser(toggleUser.id, { isActive: newActive, reason: toggleReason });
        setUsers((prev) => prev.map((u) => u.id === updated.id ? updated : u));
      } else {
        setUsers((prev) => prev.map((u) =>
          u.id === toggleUser.id
            ? { ...u, isActive: newActive, disabledAt: newActive ? undefined : new Date().toISOString() }
            : u
        ));
      }
      message.success(newActive ? 'Đã kích hoạt tài khoản' : 'Đã vô hiệu hóa tài khoản');
      setToggleUser(null);
      setToggleReason('');
    } catch (err) {
      message.error((err as Error).message);
    } finally {
      setToggleLoading(false);
    }
  };

  // ── Table columns ──────────────────────────────────────────
  const columns: ColumnsType<AdminUser> = [
    {
      title: 'Tài khoản', key: 'user', width: 180,
      render: (_, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            background: r.role === 'admin'
              ? 'linear-gradient(135deg,#ef4444,#7f1d1d)'
              : 'linear-gradient(135deg,#4f8ef7,#1e3a5f)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: '#fff',
          }}>
            {r.avatar}
          </div>
          <div>
            <Text style={{ color: '#e8edf5', fontWeight: 600, display: 'block', fontSize: 13 }}>{r.username}</Text>
            <Text style={{ color: '#4a5f73', fontSize: 11 }}>{r.fullName}</Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Email', dataIndex: 'email', key: 'email', width: 190,
      render: (email) => <Text style={{ color: '#7a8fa6', fontSize: 12 }}>{email}</Text>,
    },
    {
      title: 'Số dư VND', dataIndex: 'balance', key: 'balance', width: 140,
      render: (v) => (
        <Text style={{ color: '#22c55e', fontWeight: 600, fontSize: 13 }}>
          {Number(v).toLocaleString('vi-VN')} ₫
        </Text>
      ),
    },
    {
      title: 'Số dư USDT', dataIndex: 'balanceUsdt', key: 'balanceUsdt', width: 130,
      render: (v) => (
        <Text style={{ color: '#f59e0b', fontWeight: 600, fontSize: 13 }}>
          {Number(v).toLocaleString('en-US', { maximumFractionDigits: 2 })} USDT
        </Text>
      ),
    },
    {
      title: 'Trạng thái', key: 'status', width: 120,
      render: (_, r) => (
        <Badge
          status={r.isActive ? 'success' : 'error'}
          text={
            <Text style={{ color: r.isActive ? '#22c55e' : '#ef4444', fontSize: 12, fontWeight: 600 }}>
              {r.isActive ? 'Hoạt động' : 'Đã khóa'}
            </Text>
          }
        />
      ),
    },
    {
      title: 'Role', dataIndex: 'role', key: 'role', width: 90,
      render: (role) => (
        <Tag color={role === 'admin' ? 'red' : 'blue'} style={{ fontSize: 11 }}>
          {role === 'admin' ? 'Admin' : 'User'}
        </Tag>
      ),
    },
    {
      title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt', width: 120,
      render: (d) => <Text style={{ color: '#4a5f73', fontSize: 11 }}>{dayjs(d).format('DD/MM/YYYY')}</Text>,
    },
    {
      title: 'Hành động', key: 'actions', width: 160, fixed: 'right',
      render: (_, r) => (
        <Space size={6}>
          <Tooltip title="Điều chỉnh số dư">
            <Button
              size="small"
              icon={<DollarOutlined />}
              style={{ background: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)', color: '#22c55e' }}
              onClick={() => { setCreditUser(r); creditForm.resetFields(); }}
            />
          </Tooltip>
          <Tooltip title={r.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}>
            <Button
              size="small"
              icon={r.isActive ? <StopOutlined /> : <CheckCircleOutlined />}
              danger={r.isActive}
              style={
                r.isActive
                  ? undefined
                  : { background: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)', color: '#22c55e' }
              }
              onClick={() => { setToggleUser(r); setToggleReason(''); }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Title level={4} style={{ color: '#e8edf5', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TeamOutlined style={{ color: '#4f8ef7' }} />
            Quản lý User
          </Title>
          <Text style={{ color: '#7a8fa6', fontSize: 13 }}>{users.length} tài khoản trong hệ thống</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={load}>Làm mới</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setCreateVisible(true); createForm.resetFields(); }}>
            Tạo tài khoản
          </Button>
        </Space>
      </div>

      {/* Stats bar */}
      <Row gutter={[14, 14]} style={{ marginBottom: 20 }}>
        {[
          { label: 'Tổng users',     value: users.length,  color: '#4f8ef7', bg: 'rgba(79,142,247,0.1)',  border: 'rgba(79,142,247,0.2)' },
          { label: 'Đang hoạt động', value: totalActive,   color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.2)'  },
          { label: 'Đã khóa',        value: totalDisabled, color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.2)'  },
        ].map(({ label, value, color, bg, border }) => (
          <Col xs={8} key={label}>
            <Card
              style={{ background: '#0f1923', border: `1px solid ${border}`, borderRadius: 10 }}
              bodyStyle={{ padding: '14px 16px' }}
            >
              <Statistic
                title={<span style={{ color: '#7a8fa6', fontSize: isMobile ? 10 : 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>}
                value={value}
                valueStyle={{ color, fontSize: isMobile ? 22 : 28, fontWeight: 700 }}
                prefix={
                  <span style={{ fontSize: isMobile ? 14 : 18, marginRight: 4, background: bg, padding: 4, borderRadius: 6 }}>
                    <UserOutlined />
                  </span>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <Input.Search
          placeholder="Tìm theo username, họ tên, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 280 }}
          allowClear
        />
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ width: 150 }}
          options={[
            { value: 'all',      label: 'Tất cả trạng thái' },
            { value: 'active',   label: '✅ Hoạt động' },
            { value: 'disabled', label: '🚫 Đã khóa' },
          ]}
        />
      </div>

      {/* Table */}
      <div style={{ background: '#0f1923', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1100 }}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `${t} users` }}
          locale={{ emptyText: <div style={{ padding: 40, color: '#4a5f73' }}>Không có user nào</div> }}
        />
      </div>

      {/* ── Create User Modal ──────────────────────────────── */}
      <Modal
        open={createVisible}
        onCancel={() => setCreateVisible(false)}
        onOk={handleCreate}
        confirmLoading={createLoading}
        title={<span style={{ color: '#e8edf5' }}><PlusOutlined style={{ color: '#4f8ef7', marginRight: 8 }} />Tạo tài khoản mới</span>}
        okText="Tạo tài khoản"
        cancelText="Hủy"
        centered
        width={480}
      >
        <Form form={createForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="username" label={<span style={{ color: '#7a8fa6' }}>Username</span>}
            rules={[
              { required: true, message: 'Vui lòng nhập username' },
              { min: 3, message: 'Tối thiểu 3 ký tự' },
              { pattern: /^[a-z0-9_]+$/, message: 'Chỉ dùng chữ thường, số và dấu _' },
            ]}
          >
            <Input prefix={<UserOutlined style={{ color: '#4a5f73' }} />} placeholder="vd: nguyenvanA" />
          </Form.Item>

          <Form.Item name="password" label={<span style={{ color: '#7a8fa6' }}>Mật khẩu</span>}
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }, { min: 6, message: 'Tối thiểu 6 ký tự' }]}
          >
            <Input.Password placeholder="Mật khẩu ban đầu" />
          </Form.Item>

          <Form.Item name="fullName" label={<span style={{ color: '#7a8fa6' }}>Họ và tên</span>}
            rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
          >
            <Input placeholder="vd: Nguyễn Văn A" />
          </Form.Item>

          <Form.Item name="email" label={<span style={{ color: '#7a8fa6' }}>Email</span>}
            rules={[{ required: true, message: 'Vui lòng nhập email' }, { type: 'email', message: 'Email không hợp lệ' }]}
          >
            <Input placeholder="vd: user@example.com" />
          </Form.Item>

          <Form.Item name="role" label={<span style={{ color: '#7a8fa6' }}>Vai trò</span>} initialValue="user">
            <Select options={[{ value: 'user', label: 'User' }, { value: 'admin', label: 'Admin' }]} />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Credit Balance Modal ───────────────────────────── */}
      <Modal
        open={!!creditUser}
        onCancel={() => { setCreditUser(null); creditForm.resetFields(); }}
        onOk={handleCredit}
        confirmLoading={creditLoading}
        title={
          <span style={{ color: '#e8edf5' }}>
            <DollarOutlined style={{ color: '#22c55e', marginRight: 8 }} />
            Điều chỉnh số dư — <span style={{ color: '#4f8ef7' }}>{creditUser?.username}</span>
          </span>
        }
        okText="Xác nhận"
        cancelText="Hủy"
        centered
        width={420}
      >
        {creditUser && (
          <div>
            <div style={{ background: '#182230', borderRadius: 8, padding: '10px 14px', marginBottom: 16, display: 'flex', gap: 24 }}>
              <div>
                <Text style={{ color: '#4a5f73', fontSize: 11 }}>VND hiện tại</Text>
                <Text style={{ color: '#22c55e', display: 'block', fontWeight: 600 }}>
                  {Number(creditUser.balance).toLocaleString('vi-VN')} ₫
                </Text>
              </div>
              <div>
                <Text style={{ color: '#4a5f73', fontSize: 11 }}>USDT hiện tại</Text>
                <Text style={{ color: '#f59e0b', display: 'block', fontWeight: 600 }}>
                  {Number(creditUser.balanceUsdt).toLocaleString('en-US', { maximumFractionDigits: 2 })} USDT
                </Text>
              </div>
            </div>

            <Form form={creditForm} layout="vertical">
              <Form.Item name="currency" label={<span style={{ color: '#7a8fa6' }}>Loại tiền</span>} initialValue="VND">
                <Select options={[{ value: 'VND', label: 'VND (₫)' }, { value: 'USDT', label: 'USDT' }]} />
              </Form.Item>

              <Form.Item name="amount" label={<span style={{ color: '#7a8fa6' }}>Số tiền (âm để trừ)</span>}
                rules={[{ required: true, message: 'Vui lòng nhập số tiền' }, { type: 'number', message: 'Phải là số' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(v) => Number((v ?? '').replace(/,/g, ''))}
                  placeholder="vd: 1000000 hoặc -500000"
                />
              </Form.Item>

              <Form.Item name="note" label={<span style={{ color: '#7a8fa6' }}>Ghi chú</span>}
                rules={[{ required: true, message: 'Vui lòng nhập ghi chú' }]}
              >
                <Input.TextArea rows={2} placeholder="vd: Nạp thưởng sự kiện tháng 7" />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      {/* ── Toggle Active Modal ────────────────────────────── */}
      <Modal
        open={!!toggleUser}
        onCancel={() => { setToggleUser(null); setToggleReason(''); }}
        onOk={handleToggle}
        confirmLoading={toggleLoading}
        okText={toggleUser?.isActive ? 'Xác nhận khóa' : 'Xác nhận mở khóa'}
        okButtonProps={{ danger: toggleUser?.isActive }}
        cancelText="Hủy"
        centered
        title={
          <span style={{ color: '#e8edf5' }}>
            {toggleUser?.isActive
              ? <><StopOutlined style={{ color: '#ef4444', marginRight: 8 }} />Vô hiệu hóa tài khoản</>
              : <><CheckCircleOutlined style={{ color: '#22c55e', marginRight: 8 }} />Kích hoạt tài khoản</>
            }
          </span>
        }
      >
        {toggleUser && (
          <div>
            <div style={{ background: '#182230', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
              <Text style={{ color: '#e8edf5' }}>
                {toggleUser.isActive
                  ? `Bạn đang khóa tài khoản `
                  : `Bạn đang mở khóa tài khoản `}
                <strong style={{ color: '#4f8ef7' }}>{toggleUser.username}</strong>
                {' '}({toggleUser.fullName})
              </Text>
            </div>

            <div style={{ marginBottom: 6 }}>
              <Text style={{ color: '#7a8fa6', fontSize: 13 }}>
                {toggleUser.isActive ? 'Lý do khóa (tuỳ chọn):' : 'Ghi chú (tuỳ chọn):'}
              </Text>
            </div>
            <Input.TextArea
              value={toggleReason}
              onChange={(e) => setToggleReason(e.target.value)}
              rows={3}
              maxLength={300}
              showCount
              placeholder={toggleUser.isActive
                ? 'vd: Vi phạm điều khoản sử dụng...'
                : 'vd: Đã xác minh danh tính...'}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserManagement;
