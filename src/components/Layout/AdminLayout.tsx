import { useState } from 'react';
import { Layout, Menu, Typography, Avatar, Dropdown, message } from 'antd';
import {
  DashboardOutlined,
  LogoutOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined,
  ArrowDownOutlined, ArrowUpOutlined,
  AuditOutlined, TeamOutlined,
} from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogoIcon } from '../Icons';
import { useAuthContext } from '../../context/AuthContext';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const navItems = [
  { key: '/admin',          icon: <DashboardOutlined />,   label: 'Dashboard' },
  { key: '/admin/withdraw', icon: <ArrowUpOutlined />,     label: 'Duyệt rút tiền' },
  { key: '/admin/deposit',  icon: <ArrowDownOutlined />,   label: 'Duyệt nạp tiền' },
  { key: '/admin/audit',    icon: <AuditOutlined />,       label: 'Audit Log' },
  { key: '/admin/users',    icon: <TeamOutlined />,        label: 'Quản lý User' },
];

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();

  const handleLogout = () => {
    logout();
    message.info('Đã đăng xuất');
    navigate('/login');
  };

  const menuItems = navItems.map(({ key, icon, label }) => ({
    key, icon, label: <Link to={key}>{label}</Link>,
  }));

  const userMenu = [
    { key: 'user', label: <div><div style={{ color: '#e8edf5', fontWeight: 600 }}>{user?.fullName}</div><div style={{ color: '#7a8fa6', fontSize: 11 }}>Admin</div></div>, disabled: true },
    { type: 'divider' as const },
    { key: 'portal', icon: <DashboardOutlined />, label: <Link to="/">Về User Portal</Link> },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Đăng xuất', danger: true, onClick: handleLogout },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#0a1118' }}>
      <Sider
        trigger={null} collapsible collapsed={collapsed}
        width={230} collapsedWidth={72}
        style={{ position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100, background: '#0f1923', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Logo */}
        <div style={{ height: 64, display: 'flex', alignItems: 'center', padding: collapsed ? '0 18px' : '0 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', gap: 10 }}>
          <LogoIcon size={32} style={{ flexShrink: 0 }} />
          {!collapsed && (
            <div>
              <div style={{ color: '#e8edf5', fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>CheckBank</div>
              <div style={{ color: '#ef4444', fontSize: 10, fontWeight: 600, letterSpacing: '0.05em' }}>ADMIN CMS</div>
            </div>
          )}
        </div>

        <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]} items={menuItems}
          style={{ marginTop: 8, border: 'none', background: 'transparent' }}
        />

        {/* Collapse */}
        <div onClick={() => setCollapsed(!collapsed)}
          style={{ position: 'absolute', bottom: 16, left: 0, right: 0, display: 'flex', justifyContent: 'center', cursor: 'pointer', color: '#4a5f73' }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.color = '#ef4444')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.color = '#4a5f73')}
        >
          {collapsed ? <MenuUnfoldOutlined style={{ fontSize: 16 }} /> : <MenuFoldOutlined style={{ fontSize: 16 }} />}
        </div>
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 72 : 230, transition: 'margin 0.2s', background: '#0a1118' }}>
        <Header style={{
          position: 'sticky', top: 0, zIndex: 99, height: 56,
          padding: '0 20px', background: '#0f1923',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 6, padding: '2px 8px',
              color: '#ef4444', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
              lineHeight: 1,
            }}>
              ADMIN
            </span>
            <Text style={{ color: '#e8edf5', fontWeight: 600, fontSize: 15 }}>
              {navItems.find((n) => n.key === location.pathname)?.label || 'Admin CMS'}
            </Text>
          </div>

          <Dropdown menu={{ items: userMenu }} trigger={['click']} placement="bottomRight">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Avatar size={30} style={{ background: 'linear-gradient(135deg,#ef4444,#7f1d1d)', fontSize: 11, fontWeight: 700 }}>
                {user?.avatar}
              </Avatar>
              <Text style={{ color: '#e8edf5', fontSize: 13 }}>{user?.fullName?.split(' ').pop()}</Text>
            </div>
          </Dropdown>
        </Header>

        <Content style={{ padding: '24px', minHeight: 'calc(100vh - 56px)' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
