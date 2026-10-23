// Transaction Types
export type TransactionType = 'deposit' | 'withdraw';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled' | 'expired';
export type PaymentMethod = 'crypto' | 'bank';

// Crypto Types
export interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  network: string;
  icon: string;
  minDeposit: number;
  minWithdraw: number;
  withdrawFee: number;
}

// Bank Types
export interface Bank {
  id: string;
  code: string;
  name: string;
  shortName: string;
  logo: string;
  isActive: boolean;
}

// Transaction
export interface Transaction {
  id: string;
  type: TransactionType;
  method: PaymentMethod;
  amount: number;
  currency: string;
  status: TransactionStatus;
  createdAt: string;
  updatedAt: string;
  // For crypto
  cryptoAsset?: string;
  walletAddress?: string;
  txHash?: string;
  network?: string;
  // For bank
  bankCode?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
}

// Gateway Status
export type GatewayStatus = 'online' | 'offline' | 'maintenance';

export interface PaymentGateway {
  id: string;
  name: string;
  type: PaymentMethod;
  status: GatewayStatus;
  description: string;
  avgProcessingTime: string;
  lastUpdated: string;
  // For crypto gateways
  network?: string;
  // For bank gateways
  bankCode?: string;
}

// Form Data
export interface DepositFormData {
  method: PaymentMethod;
  amount: number;
  // Crypto
  cryptoAsset?: string;
  // Bank
  bankCode?: string;
}

export interface WithdrawFormData {
  method: PaymentMethod;
  amount: number;
  // Crypto
  cryptoAsset?: string;
  walletAddress?: string;
  network?: string;
  // Bank
  bankCode?: string;
  accountNumber?: string;
  accountName?: string;
}

// ─────────────────────────────────────────
// USER PROFILE / SAVED BANK ACCOUNTS
// ─────────────────────────────────────────

export interface UserBankAccount {
  id: string;
  userId: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
  createdAt: string;
}

export interface UserProfile {
  phone?: string;
  fullNameEn?: string;
  dob?: string;
  bankAccounts?: UserBankAccount[];
}

// ─────────────────────────────────────────
// GAME PORTAL / NHÀ CÁI TYPES
// ─────────────────────────────────────────

export type PlatformCurrency = 'VND' | 'USDT';
export type PlatformTxType = 'deposit' | 'withdraw';
export type PlatformTxStatus = 'pending' | 'completed' | 'failed';
export type LinkedPlatformStatus = 'active' | 'inactive';

export interface GamePlatform {
  id: string;
  name: string;
  domain: string;
  logo: string;
  currency: PlatformCurrency[];
  isActive: boolean;
  description: string;
  minDeposit: number;
  minWithdraw: number;
  minDepositUsdt: number;
  minWithdrawUsdt: number;
}

export interface LinkedPlatform {
  id: string;
  platformId: string;
  platformName: string;
  domain: string;
  apiKey: string;
  linkedAt: string;
  status: LinkedPlatformStatus;
}

export interface PlatformTransaction {
  id: string;
  platformId: string;
  platformName: string;
  type: PlatformTxType;
  currency: PlatformCurrency;
  amount: number;
  userId: string;
  username: string;
  otp: string;
  status: PlatformTxStatus;
  createdAt: string;
  updatedAt: string;
}
