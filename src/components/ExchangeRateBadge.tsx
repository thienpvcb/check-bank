import { Tooltip } from 'antd';
import { SyncOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { ExchangeRateState } from '../hooks/useExchangeRate';
import dayjs from 'dayjs';

interface Props extends ExchangeRateState {
  refetch: () => void;
}

const ExchangeRateBadge = ({ rate, loading, error, lastUpdated, source, refetch }: Props) => (
  <Tooltip
    title={
      <div style={{ fontSize: 12 }}>
        {error
          ? <span style={{ color: '#f59e0b' }}>{error}</span>
          : <>Nguồn: <strong>{source}</strong><br />Cập nhật: {lastUpdated ? dayjs(lastUpdated).format('HH:mm:ss') : '—'}</>
        }
      </div>
    }
  >
    <div
      onClick={refetch}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: error ? 'rgba(245,158,11,0.1)' : 'rgba(79,142,247,0.08)',
        border: `1px solid ${error ? 'rgba(245,158,11,0.25)' : 'rgba(79,142,247,0.2)'}`,
        borderRadius: 20, padding: '3px 12px',
        cursor: 'pointer', userSelect: 'none', transition: 'all 0.2s',
      }}
    >
      {error
        ? <ExclamationCircleOutlined style={{ color: '#f59e0b', fontSize: 11 }} />
        : <SyncOutlined spin={loading} style={{ color: '#4f8ef7', fontSize: 11 }} />}
      <span style={{ color: loading ? '#4a5f73' : error ? '#f59e0b' : '#e8edf5', fontSize: 12, fontWeight: 600 }}>
        {loading ? 'Đang tải...' : `1 USD = ${rate.toLocaleString('vi-VN')} ₫`}
      </span>
    </div>
  </Tooltip>
);

export default ExchangeRateBadge;
