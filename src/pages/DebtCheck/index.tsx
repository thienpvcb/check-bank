import { useState } from 'react';
import {
  Typography, InputNumber, Button, Grid, Tooltip,
  Divider, message,
} from 'antd';
import {
  PlusCircleOutlined, MinusCircleOutlined,
  DeleteOutlined, CalculatorOutlined,
  ArrowDownOutlined, ArrowUpOutlined,
  InfoCircleOutlined, CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

type EntryType = 'in' | 'out';

interface CashEntry {
  id: string;
  type: EntryType;
  amount: number;
  note: string;
  date: string; // YYYY-MM-DD
}

const today = dayjs();
const DAYS = Array.from({ length: 7 }, (_, i) =>
  today.subtract(6 - i, 'day').format('YYYY-MM-DD')
);

const fmtVnd  = (n: number) => n.toLocaleString('vi-VN') + ' ₫';
const dayLabel = (d: string) => {
  const diff = today.diff(dayjs(d), 'day');
  if (diff === 0) return 'Hôm nay';
  if (diff === 1) return 'Hôm qua';
  return dayjs(d).format('DD/MM');
};

// ── Small inline input row ────────────────────────────────────
const EntryRow = ({
  entry, onChange, onDelete,
}: {
  entry: CashEntry;
  onChange: (id: string, field: keyof CashEntry, val: string | number) => void;
  onDelete: (id: string) => void;
}) => {
  const isIn = entry.type === 'in';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      {/* Type badge */}
      <div style={{
        width: 28, height: 28, borderRadius: 7, flexShrink: 0,
        background: isIn ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
        border: `1px solid ${isIn ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {isIn
          ? <ArrowDownOutlined style={{ color: '#22c55e', fontSize: 12 }} />
          : <ArrowUpOutlined   style={{ color: '#ef4444', fontSize: 12 }} />}
      </div>

      {/* Amount */}
      <InputNumber<number>
        value={entry.amount || undefined}
        onChange={(v) => onChange(entry.id, 'amount', v ?? 0)}
        formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
        parser={(v) => Number(v?.replace(/,/g, '') || 0) as number}
        placeholder="Số tiền"
        style={{ flex: 1, minWidth: 0 }}
        size="small"
        min={0}
        addonAfter={<span style={{ color: '#7a8fa6', fontSize: 11 }}>₫</span>}
      />

      {/* Note */}
      <input
        value={entry.note}
        onChange={(e) => onChange(entry.id, 'note', e.target.value)}
        placeholder="Ghi chú (tuỳ chọn)"
        style={{
          flex: 1.2, minWidth: 0, height: 30,
          background: '#1e2d40', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 6, padding: '0 10px', color: '#e8edf5', fontSize: 12,
          outline: 'none', fontFamily: 'inherit',
        }}
      />

      {/* Delete */}
      <button type="button" onClick={() => onDelete(entry.id)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4a5f73', padding: 4, display: 'flex', alignItems: 'center' }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#ef4444')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#4a5f73')}
      >
        <DeleteOutlined style={{ fontSize: 13 }} />
      </button>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────
const DebtCheckPage = () => {
  const screens  = useBreakpoint();
  const isMobile = !screens.md;

  const [entries, setEntries] = useState<CashEntry[]>([
    { id: '1', type: 'in',  amount: 0, note: '', date: DAYS[6] },
    { id: '2', type: 'out', amount: 0, note: '', date: DAYS[6] },
  ]);
  const [selectedDay, setSelectedDay] = useState<string>(DAYS[6]);
  const [result, setResult] = useState<{ net: number; canWithdraw: boolean; canDeposit: boolean } | null>(null);

  const addEntry = (type: EntryType) => {
    setEntries((p) => [...p, {
      id: `e${Date.now()}`,
      type, amount: 0, note: '', date: selectedDay,
    }]);
  };

  const updateEntry = (id: string, field: keyof CashEntry, val: string | number) => {
    setEntries((p) => p.map((e) => e.id === id ? { ...e, [field]: val } : e));
  };

  const deleteEntry = (id: string) => {
    setEntries((p) => p.filter((e) => e.id !== id));
  };

  const dayEntries = entries.filter((e) => e.date === selectedDay);

  // ── Calculate ──
  const calculate = () => {
    const totalIn  = entries.filter((e) => e.type === 'in')
      .reduce((s, e) => s + (e.amount || 0), 0);
    const totalOut = entries.filter((e) => e.type === 'out')
      .reduce((s, e) => s + (e.amount || 0), 0);
    const net = totalIn - totalOut;

    setResult({
      net,
      canWithdraw: net > 0,
      canDeposit:  net < 0,
    });
  };

  const reset = () => {
    setEntries([
      { id: '1', type: 'in',  amount: 0, note: '', date: DAYS[6] },
      { id: '2', type: 'out', amount: 0, note: '', date: DAYS[6] },
    ]);
    setResult(null);
    message.info('Đã reset dữ liệu');
  };

  // ── Summary per day ──
  const daySummary = DAYS.map((d) => {
    const ins  = entries.filter((e) => e.date === d && e.type === 'in').reduce((s, e) => s + (e.amount || 0), 0);
    const outs = entries.filter((e) => e.date === d && e.type === 'out').reduce((s, e) => s + (e.amount || 0), 0);
    return { date: d, in: ins, out: outs, net: ins - outs };
  });

  const grandIn  = daySummary.reduce((s, d) => s + d.in,  0);
  const grandOut = daySummary.reduce((s, d) => s + d.out, 0);
  const grandNet = grandIn - grandOut;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <Title level={4} style={{ color: '#e8edf5', margin: 0 }}>
            <CalculatorOutlined style={{ color: '#4f8ef7', marginRight: 8 }} />
            Kiểm tra dư nợ
          </Title>
          <p style={{ color: '#7a8fa6', margin: '4px 0 0', fontSize: 13 }}>
            Nhập dòng tiền IN/OUT 7 ngày qua để xác định quyền rút hay nạp trả
          </p>
        </div>
        <Button onClick={reset} style={{ color: '#7a8fa6' }}>Reset</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 320px', gap: 16 }}>

        {/* ── LEFT: Input panel ── */}
        <div>
          {/* Day tabs */}
          <div style={{
            display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap',
          }}>
            {DAYS.map((d) => {
              const summary = daySummary.find((s) => s.date === d)!;
              const hasData = summary.in > 0 || summary.out > 0;
              const active  = d === selectedDay;
              return (
                <button key={d} type="button"
                  onClick={() => setSelectedDay(d)}
                  style={{
                    background: active ? 'rgba(79,142,247,0.15)' : '#182230',
                    border: `1px solid ${active ? 'rgba(79,142,247,0.5)' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 8, padding: '6px 12px',
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  }}
                >
                  <Text style={{ color: active ? '#4f8ef7' : '#e8edf5', fontSize: 12, fontWeight: active ? 700 : 400 }}>
                    {dayLabel(d)}
                  </Text>
                  <Text style={{ color: active ? '#4f8ef7' : '#4a5f73', fontSize: 10 }}>
                    {d.slice(5)}
                  </Text>
                  {hasData && (
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: summary.net >= 0 ? '#22c55e' : '#ef4444',
                      marginTop: 1,
                    }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Entry list for selected day */}
          <div style={{
            background: '#182230', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, padding: '16px 18px', marginBottom: 12,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ color: '#e8edf5', fontWeight: 600, fontSize: 14 }}>
                {dayLabel(selectedDay)} — {dayjs(selectedDay).format('DD/MM/YYYY')}
              </Text>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button size="small" icon={<PlusCircleOutlined />}
                  style={{ color: '#22c55e', borderColor: 'rgba(34,197,94,0.3)', fontSize: 11 }}
                  onClick={() => addEntry('in')}>
                  Tiền vào
                </Button>
                <Button size="small" icon={<MinusCircleOutlined />}
                  style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', fontSize: 11 }}
                  onClick={() => addEntry('out')}>
                  Tiền ra
                </Button>
              </div>
            </div>

            {dayEntries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#4a5f73', fontSize: 13 }}>
                Chưa có dữ liệu cho ngày này.<br />
                <span style={{ fontSize: 12 }}>Click "+ Tiền vào / Tiền ra" để thêm</span>
              </div>
            ) : (
              <>
                {/* Column headers */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 4, paddingBottom: 4, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ width: 28 }} />
                  <Text style={{ color: '#4a5f73', fontSize: 10, textTransform: 'uppercase', flex: 1 }}>Số tiền</Text>
                  <Text style={{ color: '#4a5f73', fontSize: 10, textTransform: 'uppercase', flex: 1.2 }}>Ghi chú</Text>
                  <div style={{ width: 28 }} />
                </div>
                {dayEntries.map((e) => (
                  <EntryRow key={e.id} entry={e} onChange={updateEntry} onDelete={deleteEntry} />
                ))}

                {/* Day subtotal */}
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: 20 }}>
                    <Text style={{ color: '#22c55e', fontSize: 12 }}>
                      IN: {fmtVnd(daySummary.find((s) => s.date === selectedDay)?.in ?? 0)}
                    </Text>
                    <Text style={{ color: '#ef4444', fontSize: 12 }}>
                      OUT: {fmtVnd(daySummary.find((s) => s.date === selectedDay)?.out ?? 0)}
                    </Text>
                  </div>
                  <Text style={{
                    fontSize: 12, fontWeight: 700,
                    color: (daySummary.find((s) => s.date === selectedDay)?.net ?? 0) >= 0 ? '#22c55e' : '#ef4444',
                  }}>
                    {(() => { const n = daySummary.find((s) => s.date === selectedDay)?.net ?? 0; return (n >= 0 ? '+' : '') + fmtVnd(n); })()}
                  </Text>
                </div>
              </>
            )}
          </div>

          {/* 7-day summary table */}
          <div style={{ background: '#182230', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '10px 16px', background: '#1a2840', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <Text style={{ color: '#4a5f73', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Tổng hợp 7 ngày
              </Text>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {daySummary.map((d) => (
                  <tr key={d.date}
                    onClick={() => setSelectedDay(d.date)}
                    style={{ cursor: 'pointer', transition: 'background 0.12s', background: d.date === selectedDay ? '#1a2840' : 'transparent' }}
                    onMouseEnter={(e) => { if (d.date !== selectedDay) (e.currentTarget as HTMLTableRowElement).style.background = '#1a2840'; }}
                    onMouseLeave={(e) => { if (d.date !== selectedDay) (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '9px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', width: 80 }}>
                      <Text style={{ color: '#e8edf5', fontSize: 12 }}>{dayLabel(d.date)}</Text>
                      <Text style={{ color: '#4a5f73', fontSize: 10, display: 'block' }}>{d.date.slice(5)}</Text>
                    </td>
                    <td style={{ padding: '9px 8px', borderBottom: '1px solid rgba(255,255,255,0.04)', textAlign: 'right' }}>
                      <Text style={{ color: '#22c55e', fontSize: 12 }}>+{fmtVnd(d.in)}</Text>
                    </td>
                    <td style={{ padding: '9px 8px', borderBottom: '1px solid rgba(255,255,255,0.04)', textAlign: 'right' }}>
                      <Text style={{ color: '#ef4444', fontSize: 12 }}>-{fmtVnd(d.out)}</Text>
                    </td>
                    <td style={{ padding: '9px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', textAlign: 'right', width: 120 }}>
                      <Text style={{ color: d.net >= 0 ? '#22c55e' : '#ef4444', fontWeight: 600, fontSize: 12 }}>
                        {d.net >= 0 ? '+' : ''}{fmtVnd(d.net)}
                      </Text>
                    </td>
                  </tr>
                ))}
                {/* Grand total */}
                <tr style={{ background: '#1e2d40' }}>
                  <td style={{ padding: '10px 16px' }}>
                    <Text style={{ color: '#e8edf5', fontWeight: 700, fontSize: 13 }}>Tổng cộng</Text>
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                    <Text style={{ color: '#22c55e', fontWeight: 700 }}>+{fmtVnd(grandIn)}</Text>
                  </td>
                  <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                    <Text style={{ color: '#ef4444', fontWeight: 700 }}>-{fmtVnd(grandOut)}</Text>
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                    <Text style={{ color: grandNet >= 0 ? '#22c55e' : '#ef4444', fontWeight: 800, fontSize: 15 }}>
                      {grandNet >= 0 ? '+' : ''}{fmtVnd(grandNet)}
                    </Text>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Calculate button */}
          <Button type="primary" block size="large" icon={<CalculatorOutlined />}
            onClick={calculate}
            style={{ height: 50, fontWeight: 700, fontSize: 15 }}
          >
            Kiểm tra dư nợ
          </Button>
        </div>

        {/* ── RIGHT: Result panel ── */}
        <div>
          {/* Net flow card */}
          <div style={{
            background: '#182230', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, padding: '20px', marginBottom: 14, textAlign: 'center',
          }}>
            <Text style={{ color: '#7a8fa6', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 10 }}>
              Dòng tiền ròng 7 ngày
            </Text>
            <div style={{ fontSize: 32, fontWeight: 800, color: grandNet >= 0 ? '#22c55e' : '#ef4444', marginBottom: 6, letterSpacing: '-0.5px' }}>
              {grandNet >= 0 ? '+' : ''}{fmtVnd(grandNet)}
            </div>
            <Text style={{ color: '#4a5f73', fontSize: 12 }}>
              IN {fmtVnd(grandIn)} · OUT {fmtVnd(grandOut)}
            </Text>
          </div>

          {/* Result */}
          {result !== null && (
            <div style={{
              background: result.canWithdraw
                ? 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.04))'
                : result.canDeposit
                ? 'linear-gradient(135deg, rgba(79,142,247,0.08), rgba(79,142,247,0.04))'
                : 'rgba(245,158,11,0.07)',
              border: `1px solid ${result.canWithdraw ? 'rgba(34,197,94,0.3)' : result.canDeposit ? 'rgba(79,142,247,0.3)' : 'rgba(245,158,11,0.3)'}`,
              borderRadius: 14, padding: '20px', marginBottom: 14, textAlign: 'center',
            }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>
                {result.canWithdraw ? '✅' : result.canDeposit ? '🔄' : '⚖️'}
              </div>

              {result.canWithdraw && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
                    <CheckCircleOutlined style={{ color: '#22c55e', fontSize: 20 }} />
                    <Text style={{ color: '#22c55e', fontWeight: 800, fontSize: 16 }}>Được phép RÚT tiền</Text>
                  </div>
                  <Text style={{ color: '#7a8fa6', fontSize: 13 }}>
                    Dòng tiền dương — tài khoản đang có dư.<br />
                    Bạn có quyền rút tối đa{' '}
                    <strong style={{ color: '#22c55e' }}>{fmtVnd(result.net)}</strong>
                  </Text>
                </>
              )}

              {result.canDeposit && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
                    <ExclamationCircleOutlined style={{ color: '#4f8ef7', fontSize: 20 }} />
                    <Text style={{ color: '#4f8ef7', fontWeight: 800, fontSize: 16 }}>Cần NẠP trả nợ</Text>
                  </div>
                  <Text style={{ color: '#7a8fa6', fontSize: 13 }}>
                    Dòng tiền âm — tài khoản đang nợ.<br />
                    Cần nạp tối thiểu{' '}
                    <strong style={{ color: '#ef4444' }}>{fmtVnd(Math.abs(result.net))}</strong>{' '}
                    để bù đắp.
                  </Text>
                </>
              )}

              {!result.canWithdraw && !result.canDeposit && (
                <>
                  <Text style={{ color: '#f59e0b', fontWeight: 800, fontSize: 16, display: 'block', marginBottom: 8 }}>
                    Cân bằng
                  </Text>
                  <Text style={{ color: '#7a8fa6', fontSize: 13 }}>
                    IN = OUT — không dư không nợ.
                  </Text>
                </>
              )}
            </div>
          )}

          {/* Breakdown */}
          <div style={{ background: '#182230', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 18px' }}>
            <Text style={{ color: '#7a8fa6', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 14 }}>
              Phân tích chi tiết
            </Text>

            {[
              { label: 'Tổng tiền vào (IN)', value: fmtVnd(grandIn),  color: '#22c55e', icon: <ArrowDownOutlined /> },
              { label: 'Tổng tiền ra (OUT)', value: fmtVnd(grandOut), color: '#ef4444', icon: <ArrowUpOutlined /> },
              { label: 'Trung bình/ngày IN',  value: fmtVnd(Math.round(grandIn / 7)),  color: '#7a8fa6', icon: null },
              { label: 'Trung bình/ngày OUT', value: fmtVnd(Math.round(grandOut / 7)), color: '#7a8fa6', icon: null },
            ].map(({ label, value, color, icon }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {icon && <span style={{ color, fontSize: 12 }}>{icon}</span>}
                  <Text style={{ color: '#7a8fa6', fontSize: 12 }}>{label}</Text>
                </div>
                <Text style={{ color, fontWeight: 600, fontSize: 13 }}>{value}</Text>
              </div>
            ))}

            <Divider style={{ borderColor: 'rgba(255,255,255,0.07)', margin: '12px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Tooltip title="Tổng IN - Tổng OUT trong 7 ngày">
                  <InfoCircleOutlined style={{ color: '#4a5f73', fontSize: 12 }} />
                </Tooltip>
                <Text style={{ color: '#e8edf5', fontWeight: 600, fontSize: 13 }}>Dư nợ ròng</Text>
              </div>
              <Text style={{ color: grandNet >= 0 ? '#22c55e' : '#ef4444', fontWeight: 800, fontSize: 16 }}>
                {grandNet >= 0 ? '+' : ''}{fmtVnd(grandNet)}
              </Text>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebtCheckPage;
