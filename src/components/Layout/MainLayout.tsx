import { useState, useEffect } from 'react';
import { Layout, Menu, Typography, Grid, Dropdown, Avatar, message, Tooltip } from 'antd';
import {
  HistoryOutlined,
  ApiOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  RiseOutlined,
  FallOutlined,
  LogoutOutlined,
  UserOutlined,
  WalletOutlined,
  SwapOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogoIcon, USDTIcon } from '../Icons';
import { useAuthContext } from '../../context/AuthContext';

const { Header, Sider, Content, Footer } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

interface MainLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { key: '/deposit',        icon: <RiseOutlined />,      label: 'Nạp tiền',        short: 'Nạp' },
  { key: '/withdraw',       icon: <FallOutlined />,      label: 'Rút tiền',        short: 'Rút' },
  { key: '/history',        icon: <HistoryOutlined />,   label: 'Lịch sử',         short: 'Lịch sử' },
  { key: '/game-portal',    icon: <AppstoreOutlined />,  label: 'Game Portal',     short: 'Game' },
  { key: '/gateway-status', icon: <ApiOutlined />,       label: 'Trạng thái cổng', short: 'Cổng' },
];

const menuItems = navItems.map(({ key, icon, label }) => ({
  key,
  icon,
  label: <Link to={key}>{label}</Link>,
}));

const MainLayout = ({ children }: MainLayoutProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [balanceCurrency, setBalanceCurrency] = useState<'VND' | 'USDT'>('VND');
  const location = useLocation();
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const { user, logout } = useAuthContext();

  useEffect(() => {
    if (isMobile) setCollapsed(true);
    else setCollapsed(false);
  }, [isMobile]);

  const currentPage = navItems.find((n) => n.key === location.pathname);

  const handleLogout = () => {
    logout();
    message.info('Đã đăng xuất');
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'info',
      label: (
        <div style={{ padding: '4px 0' }}>
          <div style={{ color: '#e8edf5', fontWeight: 600, fontSize: 14 }}>{user?.fullName}</div>
          <div style={{ color: '#7a8fa6', fontSize: 12 }}>{user?.email}</div>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' as const },
    {
      key: 'balance-vnd',
      icon: <WalletOutlined />,
      label: (
        <div>
          <div style={{ fontSize: 11, color: '#7a8fa6', marginBottom: 2 }}>Số dư VND</div>
          <strong style={{ color: '#22c55e', fontSize: 14 }}>
            {user?.balance.toLocaleString('vi-VN')} ₫
          </strong>
        </div>
      ),
      disabled: true,
    },
    {
      key: 'balance-usdt',
      icon: <USDTIcon size={14} />,
      label: (
        <div>
          <div style={{ fontSize: 11, color: '#7a8fa6', marginBottom: 2 }}>Số dư USDT</div>
          <strong style={{ color: '#26a17b', fontSize: 14 }}>
            {user?.balanceUsdt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
          </strong>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#0f1923' }}>

      {/* ──────── Desktop Sidebar ──────── */}
      <Sider
        className="desktop-sider"
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={220}
        collapsedWidth={72}
        style={{
          position: 'fixed',
          left: 0, top: 0, bottom: 0,
          overflow: 'auto',
          zIndex: 100,
          background: '#182230',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo */}
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          padding: collapsed ? '0 18px' : '0 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          gap: 10,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}>
          <LogoIcon size={36} style={{ flexShrink: 0 }} />
          {!collapsed && (
            <div>
              <div style={{ color: '#e8edf5', fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>
                CheckBank
              </div>
              <div style={{ color: '#4f8ef7', fontSize: 11 }}>Payment Portal</div>
            </div>
          )}
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ marginTop: 8, border: 'none', background: 'transparent' }}
        />

        {/* User info at bottom of sidebar */}
        {user && (
          <div style={{
            position: 'absolute', bottom: 52, left: 0, right: 0,
            padding: collapsed ? '0 16px' : '0 12px',
          }}>
            <div style={{
              background: 'rgba(79,142,247,0.08)',
              border: '1px solid rgba(79,142,247,0.14)',
              borderRadius: 10,
              padding: collapsed ? '10px 8px' : '10px 12px',
              display: 'flex', alignItems: 'center', gap: 8,
              overflow: 'hidden',
            }}>
              <Avatar
                size={28}
                style={{ background: 'linear-gradient(135deg,#4f8ef7,#2563eb)', fontSize: 11, fontWeight: 700, flexShrink: 0 }}
              >
                {user.avatar}
              </Avatar>
              {!collapsed && (
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: '#e8edf5', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.fullName}
                  </div>
                  <div
                    onClick={() => setBalanceCurrency((c) => c === 'VND' ? 'USDT' : 'VND')}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    {balanceCurrency === 'VND' ? (
                      <span style={{ color: '#22c55e', fontSize: 11, fontWeight: 500 }}>
                        {user.balance.toLocaleString('vi-VN')} ₫
                      </span>
                    ) : (
                      <span style={{ color: '#26a17b', fontSize: 11, fontWeight: 500 }}>
                        {user.balanceUsdt.toFixed(2)} USDT
                      </span>
                    )}
                    <SwapOutlined style={{ color: '#4a5f73', fontSize: 9 }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Collapse toggle */}
        <div
          onClick={() => setCollapsed(!collapsed)}
          style={{
            position: 'absolute', bottom: 16, left: 0, right: 0,
            display: 'flex', justifyContent: 'center',
            cursor: 'pointer', color: '#4a5f73', transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.color = '#4f8ef7')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.color = '#4a5f73')}
        >
          {collapsed
            ? <MenuUnfoldOutlined style={{ fontSize: 16 }} />
            : <MenuFoldOutlined   style={{ fontSize: 16 }} />}
        </div>
      </Sider>

      {/* ──────── Main area ──────── */}
      <Layout style={{
        marginLeft: isMobile ? 0 : (collapsed ? 72 : 220),
        transition: 'margin-left 0.2s',
        background: '#0f1923',
      }}>
        {/* Top header */}
        <Header style={{
          position: 'sticky', top: 0, zIndex: 99,
          height: 56,
          padding: '0 20px',
          background: '#182230',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Mobile: logo | Desktop: page title */}
          {isMobile ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <LogoIcon size={28} />
              <span style={{ color: '#e8edf5', fontWeight: 700, fontSize: 15 }}>CheckBank</span>
            </div>
          ) : (
            <Text style={{ color: '#e8edf5', fontWeight: 600, fontSize: 16 }}>
              {currentPage?.label || 'CheckBank'}
            </Text>
          )}

          {/* Right side: balance chip + avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Balance chip — clickable toggle VND ↔ USDT */}
            {user && !isMobile && (
              <Tooltip title="Click để đổi VND / USDT" placement="bottom">
                <div
                  onClick={() => setBalanceCurrency((c) => c === 'VND' ? 'USDT' : 'VND')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: balanceCurrency === 'VND'
                      ? 'rgba(34,197,94,0.08)'
                      : 'rgba(38,161,123,0.08)',
                    border: `1px solid ${balanceCurrency === 'VND' ? 'rgba(34,197,94,0.2)' : 'rgba(38,161,123,0.2)'}`,
                    borderRadius: 20, padding: '4px 14px',
                    cursor: 'pointer', transition: 'all 0.25s', userSelect: 'none',
                  }}
                >
                  {balanceCurrency === 'VND' ? (
                    <>
                      <WalletOutlined style={{ color: '#22c55e', fontSize: 13 }} />
                      <Text style={{ color: '#22c55e', fontSize: 13, fontWeight: 600, minWidth: 100 }}>
                        {user.balance.toLocaleString('vi-VN')} ₫
                      </Text>
                    </>
                  ) : (
                    <>
                      <USDTIcon size={14} />
                      <Text style={{ color: '#26a17b', fontSize: 13, fontWeight: 600, minWidth: 100 }}>
                        {user.balanceUsdt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                      </Text>
                    </>
                  )}
                  <SwapOutlined style={{ color: '#4a5f73', fontSize: 11 }} />
                </div>
              </Tooltip>
            )}

            {/* User avatar dropdown */}
            {user && (
              <Dropdown
                menu={{ items: userMenuItems }}
                trigger={['click']}
                placement="bottomRight"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <Avatar
                    size={32}
                    style={{ background: 'linear-gradient(135deg,#4f8ef7,#2563eb)', fontSize: 12, fontWeight: 700 }}
                  >
                    {user.avatar}
                  </Avatar>
                  {!isMobile && (
                    <Text style={{ color: '#e8edf5', fontSize: 13, fontWeight: 500 }}>
                      {user.fullName.split(' ').pop()}
                    </Text>
                  )}
                </div>
              </Dropdown>
            )}

            {/* Demo badge */}
            {!user && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(79,142,247,0.08)',
                border: '1px solid rgba(79,142,247,0.18)',
                borderRadius: 20, padding: '4px 12px',
              }}>
                <UserOutlined style={{ color: '#7a8fa6', fontSize: 12 }} />
                <Text style={{ color: '#7a8fa6', fontSize: 12 }}>Demo Mode</Text>
              </div>
            )}
          </div>
        </Header>

        <Content
          style={{ padding: isMobile ? '16px' : '24px', minHeight: 'calc(100vh - 56px - 52px)' }}
          className="page-content"
        >
          {children}
        </Content>

        <Footer style={{
          textAlign: 'center', padding: '12px 24px',
          fontSize: 12, color: '#4a5f73',
          background: '#182230',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          CheckBank © {new Date().getFullYear()} · Frontend Demo · Dữ liệu mô phỏng
        </Footer>
      </Layout>

      {/* ──────── Mobile Bottom Nav ──────── */}
      <nav style={{
        display: isMobile ? 'flex' : 'none',
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        height: 64,
        background: '#182230',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        zIndex: 1000,
      }}>
        {navItems.map((item) => {
          const active = location.pathname === item.key;
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.key)}
              style={{
                flex: 1, position: 'relative',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 3,
                background: 'none', border: 'none',
                cursor: 'pointer',
                color: active ? '#4f8ef7' : '#4a5f73',
                fontSize: 10, fontWeight: active ? 600 : 400,
                transition: 'color 0.2s',
              }}
            >
              <span style={{ fontSize: 19 }}>{item.icon}</span>
              <span>{item.short}</span>
              {active && (
                <span style={{
                  position: 'absolute', bottom: 0,
                  width: 32, height: 2,
                  background: '#4f8ef7', borderRadius: 2,
                }} />
              )}
            </button>
          );
        })}
      </nav>

    </Layout>
  );
};

export default MainLayout;
