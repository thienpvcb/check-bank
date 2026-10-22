import { useState, useEffect } from 'react';
import { Typography, Row, Col, Card, Statistic, Grid, Button, Tooltip } from 'antd';
import {
  ApiOutlined, CheckCircleOutlined, CloseCircleOutlined,
  ToolOutlined, ReloadOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import { CryptoIcon, BankIcon } from '../../components/Icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import { paymentGateways } from '../../mocks/gateways';
import { referenceApi } from '../../services/api';
import { USE_API } from '../../hooks/useApi';
import type { PaymentGateway, GatewayStatus } from '../../types';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;
type FilterType = 'all' | 'crypto' | 'bank';

const STATUS_CFG: Record<GatewayStatus, { color: string; bg: string; border: string; label: string; dot: string }> = {
  online:      { color: '#22c55e', bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.2)',  label: 'Hoạt động',       dot: 'online' },
  offline:     { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)',  label: 'Ngừng hoạt động', dot: 'offline' },
  maintenance: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', label: 'Bảo trì',         dot: 'maintenance' },
};

const GatewayStatusPage = () => {
  const [gateways, setGateways] = useState<PaymentGateway[]>(paymentGateways);
  const [loading, setLoading]   = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [filter, setFilter] = useState<FilterType>('all');
  const screens  = useBreakpoint();
  const isMobile = !screens.md;

  const stats = {
    total:       gateways.length,
    online:      gateways.filter((g) => g.status === 'online').length,
    offline:     gateways.filter((g) => g.status === 'offline').length,
    maintenance: gateways.filter((g) => g.status === 'maintenance').length,
  };
  const filtered = filter === 'all' ? gateways : gateways.filter((g) => g.type === filter);

  const loadGateways = async () => {
    setLoading(true);
    try {
      if (USE_API) {
        const data = await referenceApi.gateways();
        setGateways(data);
      } else {
        setGateways(paymentGateways);
      }
    } catch { setGateways(paymentGateways); }
    finally { setLoading(false); setLastRefresh(new Date()); }
  };

  useEffect(() => {
    loadGateways();
    const interval = setInterval(loadGateways, 30_000);
    return () => clearInterval(interval);
  }, []);

  const renderGatewayCard = (gw: PaymentGateway) => {
    const cfg = STATUS_CFG[gw.status];
    return (
      <div key={gw.id} style={{
        background: '#182230',
        border: `1px solid ${gw.status !== 'online' ? cfg.border : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 12, padding: isMobile ? '14px' : '16px 20px',
        marginBottom: 10, opacity: gw.status === 'offline' ? 0.65 : 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: isMobile ? 40 : 48, height: isMobile ? 40 : 48, borderRadius: 12, flexShrink: 0,
            background: gw.type === 'crypto' ? 'rgba(245,158,11,0.12)' : 'rgba(79,142,247,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {gw.type === 'crypto' ? <CryptoIcon size={20} /> : <BankIcon size={20} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <Text style={{ color: '#e8edf5', fontWeight: 600, fontSize: isMobile ? 14 : 15 }}>{gw.name}</Text>
              {gw.network && (
                <span style={{ background: 'rgba(79,142,247,0.1)', color: '#4f8ef7', borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 600 }}>
                  {gw.network}
                </span>
              )}
            </div>
            <Text style={{ color: '#4a5f73', fontSize: 12 }}>{gw.description}</Text>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: cfg.bg, border: `1px solid ${cfg.border}`,
              borderRadius: 20, padding: '4px 12px', marginBottom: 4,
            }}>
              <div className={`gateway-status-dot ${cfg.dot}`} />
              <Text style={{ color: cfg.color, fontSize: 12, fontWeight: 600 }}>{cfg.label}</Text>
            </div>
            <br />
            {gw.status === 'online' && (
              <Tooltip title="Thời gian xử lý trung bình">
                <Text style={{ color: '#4a5f73', fontSize: 11 }}>
                  <ClockCircleOutlined style={{ marginRight: 4 }} />{gw.avgProcessingTime}
                </Text>
              </Tooltip>
            )}
          </div>
        </div>
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end' }}>
          <Text style={{ color: '#4a5f73', fontSize: 11 }}>Cập nhật {dayjs(gw.lastUpdated).fromNow()}</Text>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <Title level={4} style={{ color: '#e8edf5', margin: 0 }}>
            <ApiOutlined style={{ marginRight: 8 }} />Trạng thái cổng thanh toán
          </Title>
          <p style={{ color: '#7a8fa6', margin: '4px 0 0', fontSize: 13 }}>
            Cập nhật lúc {dayjs(lastRefresh).format('HH:mm:ss')} · Tự động refresh mỗi 30s
          </p>
        </div>
        <Button icon={<ReloadOutlined />} loading={loading} onClick={loadGateways}>
          {!isMobile && 'Làm mới'}
        </Button>
      </div>

      <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
        {[
          { label: 'Tổng cổng',       value: stats.total,       color: '#4f8ef7', cls: 'stat-card-blue',   icon: <ApiOutlined /> },
          { label: 'Hoạt động',       value: stats.online,      color: '#22c55e', cls: 'stat-card-green',  icon: <CheckCircleOutlined /> },
          { label: 'Ngừng hoạt động', value: stats.offline,     color: '#ef4444', cls: 'stat-card-red',    icon: <CloseCircleOutlined /> },
          { label: 'Bảo trì',         value: stats.maintenance, color: '#f59e0b', cls: 'stat-card-yellow', icon: <ToolOutlined /> },
        ].map(({ label, value, color, cls, icon }) => (
          <Col xs={12} sm={6} key={label}>
            <Card className={cls} style={{ borderRadius: 12 }} bodyStyle={{ padding: '14px 16px' }}>
              <Statistic
                title={<span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>}
                value={value}
                valueStyle={{ color, fontSize: isMobile ? 24 : 30, fontWeight: 700 }}
                prefix={<span style={{ fontSize: isMobile ? 16 : 20 }}>{icon}</span>}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {([
          { key: 'all',    label: `Tất cả (${gateways.length})`,                                    icon: null },
          { key: 'crypto', label: `Crypto (${gateways.filter((g) => g.type === 'crypto').length})`,  icon: <CryptoIcon size={14} /> },
          { key: 'bank',   label: `Ngân hàng (${gateways.filter((g) => g.type === 'bank').length})`, icon: <BankIcon size={14} /> },
        ] as const).map(({ key, label, icon }) => (
          <button key={key} onClick={() => setFilter(key as FilterType)} style={{
            background: filter === key ? 'rgba(79,142,247,0.15)' : '#182230',
            border: `1px solid ${filter === key ? 'rgba(79,142,247,0.4)' : 'rgba(255,255,255,0.07)'}`,
            color: filter === key ? '#4f8ef7' : '#7a8fa6',
            borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s', fontFamily: 'inherit',
          }}>
            {icon} {label}
          </button>
        ))}
      </div>

      <div>{filtered.map(renderGatewayCard)}</div>

      <div style={{ background: '#182230', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 16, marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 20 }}>
        {Object.entries(STATUS_CFG).map(([key, cfg]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className={`gateway-status-dot ${cfg.dot}`} />
            <div>
              <Text style={{ color: cfg.color, fontWeight: 600, fontSize: 13 }}>{cfg.label}</Text>
              <Text style={{ color: '#4a5f73', fontSize: 11, display: 'block' }}>
                {key === 'online' && 'Giao dịch bình thường'}
                {key === 'offline' && 'Không thể giao dịch'}
                {key === 'maintenance' && 'Giao dịch có thể chậm'}
              </Text>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GatewayStatusPage;
