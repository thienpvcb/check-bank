import type { PaymentGateway } from '../types';

export const paymentGateways: PaymentGateway[] = [
  // Crypto Gateways
  {
    id: 'crypto-trc20',
    name: 'USDT TRC20',
    type: 'crypto',
    status: 'online',
    description: 'Nạp/Rút USDT qua mạng TRON (TRC20)',
    avgProcessingTime: '1-5 phút',
    lastUpdated: '2026-10-22T12:00:00Z',
    network: 'TRC20',
  },
  {
    id: 'crypto-erc20',
    name: 'USDT/ETH ERC20',
    type: 'crypto',
    status: 'online',
    description: 'Nạp/Rút USDT, ETH qua mạng Ethereum (ERC20)',
    avgProcessingTime: '5-30 phút',
    lastUpdated: '2026-10-22T12:00:00Z',
    network: 'ERC20',
  },
  {
    id: 'crypto-bep20',
    name: 'USDT/BNB BEP20',
    type: 'crypto',
    status: 'online',
    description: 'Nạp/Rút USDT, BNB qua mạng BSC (BEP20)',
    avgProcessingTime: '1-5 phút',
    lastUpdated: '2026-10-22T12:00:00Z',
    network: 'BEP20',
  },
  {
    id: 'crypto-btc',
    name: 'Bitcoin',
    type: 'crypto',
    status: 'maintenance',
    description: 'Nạp/Rút Bitcoin qua mạng Bitcoin',
    avgProcessingTime: '30-60 phút',
    lastUpdated: '2026-10-22T10:00:00Z',
    network: 'BTC',
  },
  // Bank Gateways
  {
    id: 'bank-vcb',
    name: 'Vietcombank',
    type: 'bank',
    status: 'online',
    description: 'Nạp/Rút qua Vietcombank',
    avgProcessingTime: '5-15 phút',
    lastUpdated: '2026-10-22T12:00:00Z',
    bankCode: 'VCB',
  },
  {
    id: 'bank-tcb',
    name: 'Techcombank',
    type: 'bank',
    status: 'online',
    description: 'Nạp/Rút qua Techcombank',
    avgProcessingTime: '1-10 phút',
    lastUpdated: '2026-10-22T12:00:00Z',
    bankCode: 'TCB',
  },
  {
    id: 'bank-mb',
    name: 'MB Bank',
    type: 'bank',
    status: 'online',
    description: 'Nạp/Rút qua MB Bank',
    avgProcessingTime: '1-10 phút',
    lastUpdated: '2026-10-22T12:00:00Z',
    bankCode: 'MB',
  },
  {
    id: 'bank-acb',
    name: 'ACB',
    type: 'bank',
    status: 'offline',
    description: 'Nạp/Rút qua ACB - Đang bảo trì',
    avgProcessingTime: 'N/A',
    lastUpdated: '2026-10-22T08:00:00Z',
    bankCode: 'ACB',
  },
  {
    id: 'bank-vpb',
    name: 'VPBank',
    type: 'bank',
    status: 'online',
    description: 'Nạp/Rút qua VPBank',
    avgProcessingTime: '5-15 phút',
    lastUpdated: '2026-10-22T12:00:00Z',
    bankCode: 'VPB',
  },
  {
    id: 'bank-bidv',
    name: 'BIDV',
    type: 'bank',
    status: 'online',
    description: 'Nạp/Rút qua BIDV',
    avgProcessingTime: '10-30 phút',
    lastUpdated: '2026-10-22T12:00:00Z',
    bankCode: 'BIDV',
  },
  {
    id: 'bank-pvcom',
    name: 'PVcomBank',
    type: 'bank',
    status: 'online',
    description: 'Nạp/Rút qua PVcomBank',
    avgProcessingTime: '5-20 phút',
    lastUpdated: '2026-10-22T12:00:00Z',
    bankCode: 'PVCOM',
  },
];

export const getGatewaysByType = (type: 'crypto' | 'bank'): PaymentGateway[] => {
  return paymentGateways.filter((gateway) => gateway.type === type);
};

export const getOnlineGateways = (): PaymentGateway[] => {
  return paymentGateways.filter((gateway) => gateway.status === 'online');
};

export const getGatewayById = (id: string): PaymentGateway | undefined => {
  return paymentGateways.find((gateway) => gateway.id === id);
};

export const getGatewayStats = () => {
  const total = paymentGateways.length;
  const online = paymentGateways.filter((g) => g.status === 'online').length;
  const offline = paymentGateways.filter((g) => g.status === 'offline').length;
  const maintenance = paymentGateways.filter((g) => g.status === 'maintenance').length;

  return { total, online, offline, maintenance };
};
