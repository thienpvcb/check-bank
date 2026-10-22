# Project Structure

## Overview

Frontend application cho hệ thống nạp/rút tiền.

## Proposed Structure

```
check-bank/
├── .kiro/
│   └── steering/           # AI assistant guidance
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── common/         # Buttons, Inputs, Modals...
│   │   ├── deposit/        # Deposit-related components
│   │   ├── withdraw/       # Withdraw-related components
│   │   └── history/        # Transaction history components
│   ├── pages/              # Page components
│   │   ├── Deposit/        # Trang nạp tiền
│   │   ├── Withdraw/       # Trang rút tiền
│   │   ├── History/        # Trang lịch sử
│   │   └── GatewayStatus/  # Trang kiểm tra cổng
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API calls (mock for now)
│   ├── store/              # State management
│   ├── types/              # TypeScript types/interfaces
│   ├── utils/              # Utility functions
│   ├── mocks/              # Mock data
│   │   ├── banks.ts        # Danh sách ngân hàng VN
│   │   ├── crypto.ts       # Danh sách crypto
│   │   ├── transactions.ts # Lịch sử giao dịch mẫu
│   │   └── gateways.ts     # Trạng thái cổng thanh toán
│   └── constants/          # App constants
├── public/                 # Static assets
├── package.json
├── tsconfig.json
└── README.md
```

## Conventions

### Naming
- **Components**: PascalCase (`DepositForm.tsx`)
- **Hooks**: camelCase với prefix `use` (`useTransaction.ts`)
- **Utils/Services**: camelCase (`formatCurrency.ts`)
- **Types**: PascalCase với suffix phù hợp (`TransactionType.ts`)

### File Organization
- Mỗi page có folder riêng chứa component chính và sub-components
- Mock data tập trung trong `src/mocks/`
- Types được định nghĩa trong `src/types/`

## Notes

- Cấu trúc này có thể điều chỉnh tùy theo framework được chọn
- Giữ mock data tách biệt để dễ thay thế bằng API calls sau
