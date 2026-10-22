import type { Bank } from '../types';

export const vietnamBanks: Bank[] = [
  {
    id: '1',
    code: 'VCB',
    name: 'Ngân hàng TMCP Ngoại thương Việt Nam',
    shortName: 'Vietcombank',
    logo: 'https://api.vietqr.io/img/VCB.png',
    isActive: true,
  },
  {
    id: '2',
    code: 'TCB',
    name: 'Ngân hàng TMCP Kỹ thương Việt Nam',
    shortName: 'Techcombank',
    logo: 'https://api.vietqr.io/img/TCB.png',
    isActive: true,
  },
  {
    id: '3',
    code: 'MB',
    name: 'Ngân hàng TMCP Quân đội',
    shortName: 'MB Bank',
    logo: 'https://api.vietqr.io/img/MB.png',
    isActive: true,
  },
  {
    id: '4',
    code: 'ACB',
    name: 'Ngân hàng TMCP Á Châu',
    shortName: 'ACB',
    logo: 'https://api.vietqr.io/img/ACB.png',
    isActive: true,
  },
  {
    id: '5',
    code: 'VPB',
    name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng',
    shortName: 'VPBank',
    logo: 'https://api.vietqr.io/img/VPB.png',
    isActive: true,
  },
  {
    id: '6',
    code: 'TPB',
    name: 'Ngân hàng TMCP Tiên Phong',
    shortName: 'TPBank',
    logo: 'https://api.vietqr.io/img/TPB.png',
    isActive: true,
  },
  {
    id: '7',
    code: 'BIDV',
    name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam',
    shortName: 'BIDV',
    logo: 'https://api.vietqr.io/img/BIDV.png',
    isActive: true,
  },
  {
    id: '8',
    code: 'VTB',
    name: 'Ngân hàng TMCP Công thương Việt Nam',
    shortName: 'VietinBank',
    logo: 'https://api.vietqr.io/img/CTG.png',
    isActive: true,
  },
  {
    id: '9',
    code: 'STB',
    name: 'Ngân hàng TMCP Sài Gòn Thương Tín',
    shortName: 'Sacombank',
    logo: 'https://api.vietqr.io/img/STB.png',
    isActive: false,
  },
  {
    id: '10',
    code: 'MSB',
    name: 'Ngân hàng TMCP Hàng Hải',
    shortName: 'MSB',
    logo: 'https://api.vietqr.io/img/MSB.png',
    isActive: true,
  },
  {
    id: '11',
    code: 'PVCOM',
    name: 'Ngân hàng TMCP Đại Chúng Việt Nam',
    shortName: 'PVcomBank',
    logo: 'https://api.vietqr.io/img/PVCOMBANK.png',
    isActive: true,
  },
];

export const getBankByCode = (code: string): Bank | undefined => {
  return vietnamBanks.find((bank) => bank.code === code);
};

export const getActiveBanks = (): Bank[] => {
  return vietnamBanks.filter((bank) => bank.isActive);
};
