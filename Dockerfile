FROM node:16

# 創建工作目錄
WORKDIR /usr/src/app

# 複製 package.json 和 package-lock.json
COPY package*.json ./

# 安裝依賴
RUN npm install

# 複製所有檔案
COPY . .

# 設定環境變量
ENV PORT=8080

# 暴露端口
EXPOSE 8080

# 啟動應用
CMD [ "node", "server.js" ]