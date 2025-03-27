# WebSocket 股票交易模擬專案

這是一個使用 WebSocket 技術開發的即時股票交易模擬系統，同時整合了現代化的部署方案。

## 功能特點

- 模擬即時股票價格更新
- 模擬交易功能（買入/賣出）
- 投資組合追蹤和盈虧計算
- 交易歷史記錄

## Tech Stack

### Frontend

- HTML5, CSS3, JavaScript
- WebSocket 客戶端
- RWD 設計
- 部署於 GitHub Pages

### Backend

- Node.js
- WebSocket Server (ws library)
- 台灣證交所股票 API 整合
- 部署於 Railway

## 部署架構

本專案採用了分離式部署架構：

1. **前端**：託管於 GitHub Pages，提供靜態內容服務
2. **後端**：部署於 Railway，提供 WebSocket 服務
3. **自動化部署**：使用 GitHub Actions 實現前端的 CI/CD 流程

## 自動化部署流程

本專案使用 GitHub Actions 實現了自動化部署流程：

1. 當代碼推送到主分支時，自動觸發工作流
2. 構建靜態文件
3. 將構建結果部署到 gh-pages 分支
4. GitHub Pages 自動從該分支提供網站服務

## Docker 支持

專案包含 Docker 配置，可實現容器化部署：

- `Dockerfile` 提供了標準化的運行環境
- 支持本地 Docker 部署測試
- 便於在其他支持 Docker 的平台上部署
- 確保開發與生產環境的一致性

## 本地開發

### 前置需求

- Node.js 14+
- npm 或 yarn
- Git
- Docker (可選)

### 安裝與運行

```bash
# 克隆倉庫
git clone https://github.com/ariel040132/stock-websocket.git
cd stock-websocket

# 安裝依賴
npm install

# 啟動伺服器
npm start

# 或使用 Docker 運行
docker build -t stock-websocket-app .
docker run -p 8080:8080 -d stock-websocket-app
```

## 在線演示

- 前端: https://ariel040132.github.io/stock-websocket/
- 後端: https://stock-websocket-production-32fc.up.railway.app

## 授權

MIT
