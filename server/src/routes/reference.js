// Reference data: banks, crypto assets, payment gateways
import { Router } from 'express';

const router = Router();

const banks = [
  { id: '1',  code: 'VCB',   name: 'Ngân hàng TMCP Ngoại thương Việt Nam',          shortName: 'Vietcombank', logo: 'https://api.vietqr.io/img/VCB.png',      isActive: true },
  { id: '2',  code: 'TCB',   name: 'Ngân hàng TMCP Kỹ thương Việt Nam',              shortName: 'Techcombank', logo: 'https://api.vietqr.io/img/TCB.png',      isActive: true },
  { id: '3',  code: 'MB',    name: 'Ngân hàng TMCP Quân đội',                        shortName: 'MB Bank',     logo: 'https://api.vietqr.io/img/MB.png',       isActive: true },
  { id: '4',  code: 'ACB',   name: 'Ngân hàng TMCP Á Châu',                          shortName: 'ACB',         logo: 'https://api.vietqr.io/img/ACB.png',      isActive: true },
  { id: '5',  code: 'VPB',   name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng',            shortName: 'VPBank',      logo: 'https://api.vietqr.io/img/VPB.png',      isActive: true },
  { id: '6',  code: 'TPB',   name: 'Ngân hàng TMCP Tiên Phong',                      shortName: 'TPBank',      logo: 'https://api.vietqr.io/img/TPB.png',      isActive: true },
  { id: '7',  code: 'BIDV',  name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam',  shortName: 'BIDV',        logo: 'https://api.vietqr.io/img/BIDV.png',     isActive: true },
  { id: '8',  code: 'VTB',   name: 'Ngân hàng TMCP Công thương Việt Nam',            shortName: 'VietinBank',  logo: 'https://api.vietqr.io/img/CTG.png',      isActive: true },
  { id: '9',  code: 'STB',   name: 'Ngân hàng TMCP Sài Gòn Thương Tín',             shortName: 'Sacombank',   logo: 'https://api.vietqr.io/img/STB.png',      isActive: false },
  { id: '10', code: 'MSB',   name: 'Ngân hàng TMCP Hàng Hải',                       shortName: 'MSB',         logo: 'https://api.vietqr.io/img/MSB.png',      isActive: true },
  { id: '11', code: 'PVCOM', name: 'Ngân hàng TMCP Đại Chúng Việt Nam',             shortName: 'PVcomBank',   logo: 'https://api.vietqr.io/img/PVCOMBANK.png',isActive: true },
];

const cryptoAssets = [
  { id: '1', symbol: 'USDT', name: 'Tether USD',     network: 'TRC20', minDeposit: 1000, minWithdraw: 1000, withdrawFee: 1 },
  { id: '2', symbol: 'USDT', name: 'Tether USD',     network: 'ERC20', minDeposit: 1000, minWithdraw: 1000, withdrawFee: 15 },
  { id: '3', symbol: 'USDT', name: 'Tether USD',     network: 'BEP20', minDeposit: 1000, minWithdraw: 1000, withdrawFee: 0.5 },
  { id: '4', symbol: 'BTC',  name: 'Bitcoin',        network: 'BTC',   minDeposit: 1000, minWithdraw: 1000, withdrawFee: 0.0001 },
  { id: '5', symbol: 'ETH',  name: 'Ethereum',       network: 'ERC20', minDeposit: 1000, minWithdraw: 1000, withdrawFee: 0.005 },
  { id: '6', symbol: 'BNB',  name: 'Binance Coin',   network: 'BEP20', minDeposit: 1000, minWithdraw: 1000, withdrawFee: 0.001 },
  { id: '7', symbol: 'TRX',  name: 'TRON',           network: 'TRC20', minDeposit: 1000, minWithdraw: 1000, withdrawFee: 1 },
];

const gateways = [
  { id: 'crypto-trc20', name: 'USDT TRC20',    type: 'crypto', status: 'online',       description: 'Nạp/Rút USDT qua mạng TRON (TRC20)',              avgProcessingTime: '1-5 phút',   network: 'TRC20' },
  { id: 'crypto-erc20', name: 'USDT/ETH ERC20',type: 'crypto', status: 'online',       description: 'Nạp/Rút USDT, ETH qua mạng Ethereum (ERC20)',     avgProcessingTime: '5-30 phút',  network: 'ERC20' },
  { id: 'crypto-bep20', name: 'USDT/BNB BEP20',type: 'crypto', status: 'online',       description: 'Nạp/Rút USDT, BNB qua mạng BSC (BEP20)',          avgProcessingTime: '1-5 phút',   network: 'BEP20' },
  { id: 'crypto-btc',   name: 'Bitcoin',        type: 'crypto', status: 'maintenance',  description: 'Nạp/Rút Bitcoin qua mạng Bitcoin',                 avgProcessingTime: '30-60 phút', network: 'BTC' },
  { id: 'bank-vcb',     name: 'Vietcombank',    type: 'bank',   status: 'online',       description: 'Nạp/Rút qua Vietcombank',                          avgProcessingTime: '5-15 phút',  bankCode: 'VCB' },
  { id: 'bank-tcb',     name: 'Techcombank',    type: 'bank',   status: 'online',       description: 'Nạp/Rút qua Techcombank',                          avgProcessingTime: '1-10 phút',  bankCode: 'TCB' },
  { id: 'bank-mb',      name: 'MB Bank',        type: 'bank',   status: 'online',       description: 'Nạp/Rút qua MB Bank',                              avgProcessingTime: '1-10 phút',  bankCode: 'MB' },
  { id: 'bank-acb',     name: 'ACB',            type: 'bank',   status: 'offline',      description: 'Nạp/Rút qua ACB - Đang bảo trì',                  avgProcessingTime: 'N/A',        bankCode: 'ACB' },
  { id: 'bank-vpb',     name: 'VPBank',         type: 'bank',   status: 'online',       description: 'Nạp/Rút qua VPBank',                               avgProcessingTime: '5-15 phút',  bankCode: 'VPB' },
  { id: 'bank-bidv',    name: 'BIDV',           type: 'bank',   status: 'online',       description: 'Nạp/Rút qua BIDV',                                 avgProcessingTime: '10-30 phút', bankCode: 'BIDV' },
  { id: 'bank-pvcom',   name: 'PVcomBank',      type: 'bank',   status: 'online',       description: 'Nạp/Rút qua PVcomBank',                            avgProcessingTime: '5-20 phút',  bankCode: 'PVCOM' },
];

// GET /api/banks
router.get('/banks', (_req, res) => {
  res.json({ success: true, data: banks });
});

// GET /api/banks/active
router.get('/banks/active', (_req, res) => {
  res.json({ success: true, data: banks.filter((b) => b.isActive) });
});

// GET /api/crypto
router.get('/crypto', (_req, res) => {
  res.json({ success: true, data: cryptoAssets });
});

// GET /api/gateways
router.get('/gateways', (_req, res) => {
  const now = new Date().toISOString();
  res.json({
    success: true,
    data: gateways.map((g) => ({ ...g, lastUpdated: now })),
  });
});

// GET /api/gateways/stats
router.get('/gateways/stats', (_req, res) => {
  const total = gateways.length;
  const online = gateways.filter((g) => g.status === 'online').length;
  const offline = gateways.filter((g) => g.status === 'offline').length;
  const maintenance = gateways.filter((g) => g.status === 'maintenance').length;
  res.json({ success: true, data: { total, online, offline, maintenance } });
});

// GET /api/exchange-rate — proxy/cache tỷ giá USD/VND
let rateCache = { rate: 25_900, updatedAt: null };

router.get('/exchange-rate', async (_req, res) => {
  // Dùng cache nếu < 5 phút
  if (rateCache.updatedAt && Date.now() - rateCache.updatedAt < 5 * 60 * 1000) {
    return res.json({ success: true, data: rateCache });
  }

  try {
    const r = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: AbortSignal.timeout(4000),
    });
    if (r.ok) {
      const d = await r.json();
      if (d?.rates?.VND) {
        rateCache = { rate: d.rates.VND, updatedAt: Date.now(), source: 'open.er-api.com' };
        return res.json({ success: true, data: rateCache });
      }
    }
  } catch { /* fallthrough */ }

  res.json({ success: true, data: { ...rateCache, source: 'cache/fallback' } });
});

export default router;
