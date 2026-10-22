# Technology Stack

## Overview

Frontend-only application (chưa có backend). Sử dụng mock data để demo các chức năng.

## Build System

*Sẽ được xác định khi chọn framework (Vite, Create React App, Next.js...)*

## Languages & Frameworks

- **Language**: TypeScript
- **Framework**: React 19
- **UI Library**: Ant Design 6 (dark theme)
- **Routing**: React Router DOM 7
- **Date**: Day.js
- **Build Tool**: Vite 8

## Dependencies

```json
"react": "^19.3.1",
"react-dom": "^19.3.1",
"react-router-dom": "^7.x",
"antd": "^6.x",
"@ant-design/icons": "latest",
"dayjs": "latest"
```

## Common Commands

```bash
# Frontend
npm run dev          # chạy Vite dev server (port 5173)
npm run build        # build production

# Backend
npm run dev --prefix server   # chạy Node.js với --watch (port 3001)
npm start --prefix server     # production mode
```

## Development Environment

- **OS**: Windows
- **Shell**: cmd
- **Node.js**: v24
- **Frontend port**: 5173
- **Backend port**: 3001

## Mock Data

Vì chưa có backend, cần tạo mock data cho:
- Danh sách ngân hàng VN
- Danh sách crypto supported
- Lịch sử giao dịch mẫu
- Trạng thái cổng thanh toán

## Notes

- Frontend-only phase: tất cả data đều là mock
- Chuẩn bị API interface để dễ dàng tích hợp backend sau
