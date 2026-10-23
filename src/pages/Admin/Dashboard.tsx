import { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Typography, Grid } from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined, ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, StopOutlined } from '@ant-design/icons';
import { adminApi } from '../../services/api';
import { USE_API } from '../../hooks/useApi';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const AdminDashboard = () => {
  const [stats, setStats] = useState({ pending: 0, completed: 0, failed: 0, expired: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  useEffect(() => {
    if (!USE_API) { setLoading(false); return; }
    adminApi.stats().then(setStats).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: 'Chờ duyệt',    value: stats.pending,   color: '#f59e0b', icon: <ClockCircleOutlined />,  bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)' },
    { label: 'Hoàn thành',   value: stats.completed, color: '#22c55e', icon: <CheckCircleOutlined />,  bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.2)' },
    { label: 'Thất bại',     value: stats.failed,    color: '#ef4444', icon: <CloseCircleOutlined />,  bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.2)' },
    { label: 'Hết hạn',      value: stats.expired,   color: '#7a8fa6', icon: <StopOutlined />,         bg: 'rgba(122,143,166,0.1)', border: 'rgba(122,143,166,0.2)' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ color: '#e8edf5', margin: 0 }}>Dashboard</Title>
        <Text style={{ color: '#7a8fa6', fontSize: 13 }}>Tổng quan hệ thống</Text>
      </div>

      <Row gutter={[14, 14]} style={{ marginBottom: 24 }}>
        {cards.map(({ label, value, color, icon, bg, border }) => (
          <Col xs={12} sm={6} key={label}>
            <Card loading={loading}
              style={{ background: '#0f1923', border: `1px solid ${border}`, borderRadius: 12 }}
              bodyStyle={{ padding: '16px 18px' }}
            >
              <Statistic
                title={<span style={{ color: '#7a8fa6', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>}
                value={value}
                valueStyle={{ color, fontSize: isMobile ? 26 : 32, fontWeight: 700 }}
                prefix={<span style={{ fontSize: isMobile ? 18 : 22, marginRight: 4, background: bg, padding: 6, borderRadius: 8 }}>{icon}</span>}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Quick links */}
      <Row gutter={[14, 14]}>
        {[
          { label: 'Giao dịch chờ rút', sub: 'Cần duyệt thủ công', color: '#ef4444', icon: <ArrowUpOutlined />, href: '/admin/withdraw' },
          { label: 'Giao dịch chờ nạp', sub: 'Xác nhận đã nhận tiền', color: '#22c55e', icon: <ArrowDownOutlined />, href: '/admin/deposit' },
        ].map(({ label, sub, color, icon, href }) => (
          <Col xs={24} sm={12} key={label}>
            <a href={href} style={{ textDecoration: 'none' }}>
              <div style={{
                background: '#0f1923', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 12, padding: '18px 20px',
                display: 'flex', alignItems: 'center', gap: 14,
                transition: 'border-color 0.2s',
              }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = color)}
                onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)')}
              >
                <div style={{ width: 44, height: 44, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color }}>
                  {icon}
                </div>
                <div>
                  <Text style={{ color: '#e8edf5', fontWeight: 600, display: 'block', fontSize: 15 }}>{label}</Text>
                  <Text style={{ color: '#7a8fa6', fontSize: 12 }}>{sub}</Text>
                </div>
              </div>
            </a>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default AdminDashboard;
