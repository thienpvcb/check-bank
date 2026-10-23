import { useState, useEffect, useCallback } from 'react';
import {
  Typography, Button, Form, Input, DatePicker, Tag, Modal,
  Select, Switch, Spin, message, Tooltip, Grid, Popconfirm,
} from 'antd';
import {
  UserOutlined, BankOutlined, PlusOutlined, DeleteOutlined,
  EditOutlined, CheckCircleOutlined, StarOutlined,
  StarFilled, MailOutlined, PhoneOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { profileApi } from '../../services/api';
import { USE_API } from '../../hooks/useApi';
import { useAuthContext } from '../../context/AuthContext';
import { getActiveBanks } from '../../mocks/banks';
import type { UserBankAccount } from '../../types';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

// ── Mock bank accounts for USE_API=false ──────────────────────
const MOCK_BANKS: UserBankAccount[] = [
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

// ── Mask account number: show last 4 digits ───────────────────
const maskAccount = (num: string) =>
  num.length > 4 ? '•••• ' + num.slice(-4) : num;

const ProfilePage = () => {
  const { user } = useAuthContext();
  const screens   = useBreakpoint();
  const isMobile  = !screens.md;

  // Profile edit
  const [editOpen,    setEditOpen]    = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [profileForm] = Form.useForm();

  // Bank accounts
  const [bankAccounts, setBankAccounts] = useState<UserBankAccount[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);

  // Add bank modal
  const [addBankOpen,    setAddBankOpen]    = useState(false);
  const [addBankLoading, setAddBankLoading] = useState(false);
  const [bankForm] = Form.useForm();

  const availableBanks = getActiveBanks();

  // ── Load bank accounts ──────────────────────────────────────
  const loadBanks = useCallback(async () => {
    setBanksLoading(true);
    try {
      if (USE_API) {
        const accounts = await profileApi.getBanks();
        setBankAccounts(accounts);
      } else {
        setBankAccounts(MOCK_BANKS);
      }
    } catch {
      setBankAccounts(USE_API ? [] : MOCK_BANKS);
    } finally {
      setBanksLoading(false);
    }
  }, []);

  useEffect(() => { loadBanks(); }, [loadBanks]);

  // ── Handle profile update ───────────────────────────────────
  const handleProfileSave = async (values: { phone?: string; fullNameEn?: string; dob?: dayjs.Dayjs | null }) => {
    setEditLoading(true);
    try {
      if (USE_API) {
        await profileApi.update({
          phone:      values.phone,
          fullNameEn: values.fullNameEn,
          dob:        values.dob ? values.dob.format('YYYY-MM-DD') : undefined,
        });
      }
      message.success('Đã cập nhật thông tin');
      setEditOpen(false);
    } catch (err) {
      message.error((err as Error).message);
    } finally {
      setEditLoading(false);
    }
  };

  // ── Handle add bank ─────────────────────────────────────────
  const handleAddBank = async (values: {
    bankCode: string;
    accountNumber: string;
    accountName: string;
    isDefault?: boolean;
  }) => {
    setAddBankLoading(true);
    try {
      const selectedBank = availableBanks.find((b) => b.code === values.bankCode);
      if (USE_API) {
        const added = await profileApi.addBank({
          bankCode:      values.bankCode,
          bankName:      selectedBank?.shortName ?? values.bankCode,
          accountNumber: values.accountNumber,
          accountName:   values.accountName.toUpperCase(),
          isDefault:     values.isDefault ?? false,
        });
        setBankAccounts((prev) => {
          const updated = values.isDefault
            ? prev.map((a) => ({ ...a, isDefault: false }))
            : [...prev];
          return [...updated, added];
        });
      } else {
        // Mock: just add locally
        const newAcc: UserBankAccount = {
          id:            `ba${Date.now()}`,
          userId:        user?.id ?? 'u1',
          bankCode:      values.bankCode,
          bankName:      selectedBank?.shortName ?? values.bankCode,
          accountNumber: values.accountNumber,
          accountName:   values.accountName.toUpperCase(),
          isDefault:     values.isDefault ?? false,
          createdAt:     new Date().toISOString(),
        };
        setBankAccounts((prev) => {
          const updated = values.isDefault
            ? prev.map((a) => ({ ...a, isDefault: false }))
            : [...prev];
          return [...updated, newAcc];
        });
      }
      message.success('Đã thêm tài khoản ngân hàng');
      bankForm.resetFields();
      setAddBankOpen(false);
    } catch (err) {
      message.error((err as Error).message);
    } finally {
      setAddBankLoading(false);
    }
  };

  // ── Handle delete bank ──────────────────────────────────────
  const handleDeleteBank = async (id: string) => {
    try {
      if (USE_API) {
        await profileApi.deleteBank(id);
      }
      setBankAccounts((prev) => prev.filter((a) => a.id !== id));
      message.success('Đã xóa tài khoản ngân hàng');
    } catch (err) {
      message.error((err as Error).message);
    }
  };

  // ── Handle set default ──────────────────────────────────────
  const handleSetDefault = async (id: string) => {
    try {
      if (USE_API) {
        await profileApi.setDefault(id);
      }
      setBankAccounts((prev) =>
        prev.map((a) => ({ ...a, isDefault: a.id === id }))
      );
      message.success('Đã đặt làm tài khoản mặc định');
    } catch (err) {
      message.error((err as Error).message);
    }
  };

  // ── Card style helpers ──────────────────────────────────────
  const cardStyle: React.CSSProperties = {
    background: '#182230',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: isMobile ? 16 : 24,
    marginBottom: 20,
  };

  const sectionTitle = (icon: React.ReactNode, title: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8,
        background: 'rgba(79,142,247,0.1)',
        border: '1px solid rgba(79,142,247,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <Title level={5} style={{ color: '#e8edf5', margin: 0 }}>{title}</Title>
    </div>
  );

  const infoRow = (label: string, value: React.ReactNode) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 0',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>
      <Text style={{ color: '#7a8fa6', fontSize: 13 }}>{label}</Text>
      <Text style={{ color: '#e8edf5', fontSize: 13, fontWeight: 500 }}>{value || '—'}</Text>
    </div>
  );

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>

      {/* Page header */}
      <div className="page-header">
        <div>
          <Title level={4} style={{ color: '#e8edf5', margin: 0 }}>
            <UserOutlined style={{ color: '#4f8ef7', marginRight: 8 }} />
            Hồ sơ cá nhân
          </Title>
          <p style={{ color: '#7a8fa6', margin: '4px 0 0', fontSize: 13 }}>
            Thông tin tài khoản và ngân hàng đã lưu
          </p>
        </div>
      </div>

      {/* ── Section 1: Personal info ── */}
      <div style={cardStyle}>
        {sectionTitle(
          <UserOutlined style={{ color: '#4f8ef7', fontSize: 16 }} />,
          'Thông tin cá nhân',
        )}

        {infoRow('Họ và tên', user?.fullName)}
        {infoRow('Tên tiếng Anh', undefined)}
        {infoRow('Email',
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <MailOutlined style={{ color: '#4a5f73', fontSize: 12 }} />
            {user?.email}
          </span>
        )}
        {infoRow('Số điện thoại',
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <PhoneOutlined style={{ color: '#4a5f73', fontSize: 12 }} />
            Chưa cập nhật
          </span>
        )}
        {infoRow('Ngày sinh', undefined)}

        <Button
          icon={<EditOutlined />}
          onClick={() => {
            profileForm.resetFields();
            setEditOpen(true);
          }}
          style={{ marginTop: 16, borderColor: 'rgba(79,142,247,0.4)', color: '#4f8ef7' }}
        >
          Chỉnh sửa thông tin
        </Button>
      </div>

      {/* ── Section 2: Saved bank accounts ── */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <BankOutlined style={{ color: '#22c55e', fontSize: 16 }} />
            </div>
            <Title level={5} style={{ color: '#e8edf5', margin: 0 }}>Ngân hàng đã lưu</Title>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="small"
            onClick={() => { bankForm.resetFields(); setAddBankOpen(true); }}
            style={{ fontWeight: 600 }}
          >
            {isMobile ? '' : 'Thêm mới'}
          </Button>
        </div>

        {banksLoading ? (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <Spin />
          </div>
        ) : bankAccounts.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '32px 0',
            color: '#4a5f73', fontSize: 13,
          }}>
            <BankOutlined style={{ fontSize: 32, marginBottom: 10, display: 'block', color: '#1e2d40' }} />
            Chưa có tài khoản ngân hàng nào được lưu.
            <br />
            <Button
              type="link"
              icon={<PlusOutlined />}
              onClick={() => { bankForm.resetFields(); setAddBankOpen(true); }}
              style={{ marginTop: 8, padding: 0 }}
            >
              Thêm ngay
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {bankAccounts.map((acc) => (
              <BankAccountCard
                key={acc.id}
                account={acc}
                onDelete={handleDeleteBank}
                onSetDefault={handleSetDefault}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Edit profile modal ── */}
      <Modal
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={() => profileForm.submit()}
        confirmLoading={editLoading}
        okText="Lưu thay đổi"
        cancelText="Hủy"
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <EditOutlined style={{ color: '#4f8ef7' }} />
            <span>Chỉnh sửa thông tin cá nhân</span>
          </div>
        }
        width={isMobile ? '95vw' : 480}
        centered
      >
        <Form form={profileForm} layout="vertical" onFinish={handleProfileSave} style={{ marginTop: 16 }}>
          <Form.Item label="Họ và tên (không thể thay đổi)">
            <Input value={user?.fullName} disabled size="large" />
          </Form.Item>

          <Form.Item label="Tên tiếng Anh (tuỳ chọn)" name="fullNameEn">
            <Input size="large" placeholder="VD: NGUYEN VAN A" style={{ textTransform: 'uppercase' }}
              onChange={(e) => profileForm.setFieldValue('fullNameEn', e.target.value.toUpperCase())}
            />
          </Form.Item>

          <Form.Item label="Email (không thể thay đổi)">
            <Input value={user?.email} disabled size="large" />
          </Form.Item>

          <Form.Item
            label="Số điện thoại"
            name="phone"
            rules={[{ pattern: /^[0-9]{9,11}$/, message: 'Số điện thoại không hợp lệ' }]}
          >
            <Input size="large" placeholder="0901234567"
              prefix={<PhoneOutlined style={{ color: '#4a5f73' }} />}
            />
          </Form.Item>

          <Form.Item label="Ngày sinh" name="dob">
            <DatePicker
              size="large"
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              placeholder="DD/MM/YYYY"
              disabledDate={(d) => d && d.isAfter(dayjs())}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Add bank modal ── */}
      <Modal
        open={addBankOpen}
        onCancel={() => { bankForm.resetFields(); setAddBankOpen(false); }}
        onOk={() => bankForm.submit()}
        confirmLoading={addBankLoading}
        okText="Lưu tài khoản"
        cancelText="Hủy"
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BankOutlined style={{ color: '#22c55e' }} />
            <span>Thêm tài khoản ngân hàng</span>
          </div>
        }
        width={isMobile ? '95vw' : 480}
        centered
      >
        <Form form={bankForm} layout="vertical" onFinish={handleAddBank} style={{ marginTop: 16 }}>
          <Form.Item
            label="Ngân hàng"
            name="bankCode"
            rules={[{ required: true, message: 'Chọn ngân hàng' }]}
          >
            <Select
              size="large"
              placeholder="Chọn ngân hàng"
              options={availableBanks.map((b) => ({
                value: b.code,
                label: (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img
                      src={b.logo} alt={b.shortName}
                      style={{ width: 22, height: 22, borderRadius: 4, objectFit: 'contain' }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <span>{b.shortName}</span>
                  </div>
                ),
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Số tài khoản"
            name="accountNumber"
            rules={[
              { required: true, message: 'Nhập số tài khoản' },
              { pattern: /^\d{6,20}$/, message: 'Số tài khoản không hợp lệ (6–20 chữ số)' },
            ]}
          >
            <Input
              size="large"
              placeholder="Nhập số tài khoản"
              suffix={<BankOutlined style={{ color: '#4a5f73' }} />}
            />
          </Form.Item>

          <Form.Item
            label="Tên chủ tài khoản"
            name="accountName"
            rules={[{ required: true, message: 'Nhập tên chủ tài khoản' }]}
          >
            <Input
              size="large"
              placeholder="NGUYEN VAN A"
              style={{ textTransform: 'uppercase' }}
              onChange={(e) => bankForm.setFieldValue('accountName', e.target.value.toUpperCase())}
            />
          </Form.Item>

          <Form.Item name="isDefault" valuePropName="checked" initialValue={bankAccounts.length === 0}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Switch
                checked={bankForm.getFieldValue('isDefault')}
                onChange={(v) => bankForm.setFieldValue('isDefault', v)}
                defaultChecked={bankAccounts.length === 0}
              />
              <Text style={{ color: '#e8edf5', fontSize: 13 }}>Đặt làm tài khoản mặc định</Text>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// ── BankAccountCard sub-component ─────────────────────────────
interface BankAccountCardProps {
  account: UserBankAccount;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
}

const BankAccountCard = ({ account, onDelete, onSetDefault }: BankAccountCardProps) => {
  const logoUrl = `https://api.vietqr.io/img/${account.bankCode}.png`;

  return (
    <div style={{
      background: '#1e2d40',
      border: `1px solid ${account.isDefault ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 12,
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      transition: 'border-color 0.2s',
    }}>
      {/* Bank logo */}
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, overflow: 'hidden',
      }}>
        <img
          src={logoUrl}
          alt={account.bankName}
          style={{ width: 36, height: 36, objectFit: 'contain' }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
            const parent = (e.target as HTMLImageElement).parentElement;
            if (parent) {
              parent.style.background = 'rgba(79,142,247,0.15)';
              parent.innerHTML = `<span style="color:#4f8ef7;font-size:14px;font-weight:700">${account.bankCode.slice(0, 3)}</span>`;
            }
          }}
        />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <Text style={{ color: '#e8edf5', fontWeight: 600, fontSize: 14 }}>
            {account.bankName}
          </Text>
          {account.isDefault && (
            <Tag
              icon={<CheckCircleOutlined />}
              color="success"
              style={{ fontSize: 10, lineHeight: '16px', padding: '0 6px' }}
            >
              Mặc định
            </Tag>
          )}
        </div>
        <Text
          style={{
            color: '#4f8ef7',
            fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace",
            display: 'block',
          }}
        >
          {maskAccount(account.accountNumber)}
        </Text>
        <Text style={{ color: '#7a8fa6', fontSize: 11 }}>
          {account.accountName}
        </Text>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {!account.isDefault && (
          <Tooltip title="Đặt làm mặc định">
            <Button
              type="text"
              icon={<StarOutlined style={{ color: '#f59e0b' }} />}
              size="small"
              onClick={() => onSetDefault(account.id)}
            />
          </Tooltip>
        )}
        {account.isDefault && (
          <StarFilled style={{ color: '#f59e0b', fontSize: 14, padding: '0 4px' }} />
        )}
        <Popconfirm
          title="Xóa tài khoản ngân hàng?"
          description="Hành động này không thể hoàn tác."
          onConfirm={() => onDelete(account.id)}
          okText="Xóa"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
        >
          <Button
            type="text"
            icon={<DeleteOutlined style={{ color: '#ef4444' }} />}
            size="small"
          />
        </Popconfirm>
      </div>
    </div>
  );
};

export default ProfilePage;
