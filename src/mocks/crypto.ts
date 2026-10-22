import type { CryptoAsset } from '../types';

export const cryptoAssets: CryptoAsset[] = [
  {
    id: '1',
    symbol: 'USDT',
    name: 'Tether USD',
    network: 'TRC20',
    icon: '💵',
    minDeposit: 1_000,
    minWithdraw: 1_000,
    withdrawFee: 1,
  },
  {
    id: '2',
    symbol: 'USDT',
    name: 'Tether USD',
    network: 'ERC20',
    icon: '💵',
    minDeposit: 1_000,
    minWithdraw: 1_000,
    withdrawFee: 15,
  },
  {
    id: '3',
    symbol: 'USDT',
    name: 'Tether USD',
    network: 'BEP20',
    icon: '💵',
    minDeposit: 1_000,
    minWithdraw: 1_000,
    withdrawFee: 0.5,
  },
  {
    id: '4',
    symbol: 'BTC',
    name: 'Bitcoin',
    network: 'BTC',
    icon: '₿',
    minDeposit: 1_000,
    minWithdraw: 1_000,
    withdrawFee: 0.0001,
  },
  {
    id: '5',
    symbol: 'ETH',
    name: 'Ethereum',
    network: 'ERC20',
    icon: 'Ξ',
    minDeposit: 1_000,
    minWithdraw: 1_000,
    withdrawFee: 0.005,
  },
  {
    id: '6',
    symbol: 'BNB',
    name: 'Binance Coin',
    network: 'BEP20',
    icon: '🔶',
    minDeposit: 1_000,
    minWithdraw: 1_000,
    withdrawFee: 0.001,
  },
  {
    id: '7',
    symbol: 'TRX',
    name: 'TRON',
    network: 'TRC20',
    icon: '🔷',
    minDeposit: 1_000,
    minWithdraw: 1_000,
    withdrawFee: 1,
  },
];

export const getCryptoBySymbol = (symbol: string): CryptoAsset[] => {
  return cryptoAssets.filter((asset) => asset.symbol === symbol);
};

export const getCryptoById = (id: string): CryptoAsset | undefined => {
  return cryptoAssets.find((asset) => asset.id === id);
};

export const getUniqueSymbols = (): string[] => {
  return [...new Set(cryptoAssets.map((asset) => asset.symbol))];
};
