const WebSocket = require("ws");
const https = require("https");
const wss = new WebSocket.Server({ port: 8080 });

// 儲存股票數據的對象
let stocks = {};

// 從 TWSE API 獲取股票數據
function fetchStockData() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "openapi.twse.com.tw",
      path: "/v1/exchangeReport/STOCK_DAY_ALL",
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const stockData = JSON.parse(data);
          resolve(stockData);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.end();
  });
}

// 處理 API 返回的數據，轉換為我們需要的格式
function processStockData(data) {
  const processedStocks = {};

  // 限制處理的股票數量，防止數據過大
  const maxStocks = 20;
  const stocksToProcess = data.slice(0, maxStocks);

  stocksToProcess.forEach((stock) => {
    // 使用股票代號作為鍵
    processedStocks[stock.Code] = {
      name: stock.Name,
      price: parseFloat(stock.ClosingPrice),
      change: parseFloat(stock.Change),
      high: parseFloat(stock.HighestPrice),
      low: parseFloat(stock.LowestPrice),
      volume: parseInt(stock.TradeVolume),
    };
  });

  return processedStocks;
}

// 初始化：獲取股票數據
async function initializeStockData() {
  try {
    console.log("正在從 TWSE API 獲取股票數據...");
    const data = await fetchStockData();
    stocks = processStockData(data);
    console.log(`成功獲取 ${Object.keys(stocks).length} 支股票的數據`);
  } catch (error) {
    console.error("獲取股票數據時出錯:", error);
    // 如果 API 失敗，使用一些默認數據
    stocks = {
      2330: {
        name: "台積電",
        price: 790,
        change: 5,
        high: 795,
        low: 785,
        volume: 12345678,
      },
      2317: {
        name: "鴻海",
        price: 120,
        change: -2,
        high: 123,
        low: 119,
        volume: 5678901,
      },
      2412: {
        name: "中華電",
        price: 110,
        change: 0,
        high: 112,
        low: 109,
        volume: 2345678,
      },
    };
  }
}

// 定期更新股票數據（每 5 分鐘獲取一次新數據）
// 注意：TWSE API 可能有請求限制，頻率不要太高
const UPDATE_INTERVAL = 5 * 60 * 1000; // 5 分鐘
setInterval(async () => {
  try {
    console.log("正在更新股票數據...");
    const data = await fetchStockData();
    stocks = processStockData(data);
    console.log("股票數據已更新");
  } catch (error) {
    console.error("更新股票數據時出錯:", error);
  }
}, UPDATE_INTERVAL);

// 模擬小幅價格波動（因為實際 API 數據只會每天更新一次）
// 這樣可以讓前端顯示更有動態感
setInterval(() => {
  for (let stockCode in stocks) {
    // 生成 -0.5% 到 +0.5% 之間的隨機波動
    const priceChange =
      stocks[stockCode].price * (Math.random() * 0.01 - 0.005);
    const newPrice = stocks[stockCode].price + priceChange;

    // 確保價格不會低於 1
    stocks[stockCode].price = Math.max(1, newPrice);
    stocks[stockCode].change =
      Math.round((stocks[stockCode].change + priceChange) * 100) / 100;
  }

  // 將最新數據發送給所有連接的客戶端
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(stocks));
    }
  });
}, 1000);

// WebSocket 連接處理
wss.on("connection", (ws) => {
  console.log("新客戶端已連接");

  // 發送當前股票數據給新連接的客戶端
  ws.send(JSON.stringify(stocks));

  // 處理從客戶端接收到的消息
  ws.on("message", (message) => {
    try {
      const { action, stock, amount } = JSON.parse(message);
      if (action === "BUY" || action === "SELL") {
        console.log(`訂單: ${action} ${amount} 股 ${stock}`);
        ws.send(`訂單確認: ${action} ${amount} 股 ${stock}`);
      }
    } catch (error) {
      console.error("處理客戶端消息時出錯:", error);
    }
  });

  ws.on("close", () => {
    console.log("客戶端已斷開連接");
  });
});

// 初始化並啟動伺服器
(async function startServer() {
  await initializeStockData();
  console.log("WebSocket 伺服器已啟動，監聽端口 8080");
})();
