const WebSocket = require("ws");
const socket = new WebSocket("ws://localhost:8080");

// 持股組合資料
const portfolio = {
  stocks: {}, // 記錄每支股票的持有數量
  currentPrices: {}, // 記錄每支股票的當前價格
  averageBuyPrices: {}, // 記錄每支股票的平均買入價格
  investedAmount: {}, // 記錄每支股票的投資總額
  realizedProfit: {}, // 記錄每支股票的已實現盈虧
};

// 初始化已實現盈虧
for (let stock in portfolio.stocks) {
  portfolio.realizedProfit[stock] = 0;
}

let totalRealizedProfit = 0; // 總已實現盈虧

// 等待連接建立
socket.on("open", function () {
  console.log("已連接到伺服器");

  // 只有在連接建立後才發送訂單
  // 購買 100 股 Apple 股票
  placeOrder("AAPL", 100, "BUY");
  placeOrder("NVDA", 200, "BUY");
  placeOrder("AAPL", 50, "SELL");

  // 設定定期顯示持股報告
  setInterval(displayPortfolio, 5000);
  setInterval(displayTransactionHistory, 5000);

  // 設定定期計算損益
  setInterval(calculateProfitLoss, 10000);
});

// 在Node.js中，message事件直接提供數據而不是event對象
socket.on("message", function (data) {
  try {
    // 嘗試解析為JSON
    const jsonData = JSON.parse(data);
    console.log("股票價格更新:", jsonData);

    // 更新當前價格
    updatePrices(jsonData);
  } catch (e) {
    // 如果不是JSON，則作為普通文本處理
    console.log("伺服器訊息:", data.toString());
  }
});

socket.on("error", function (error) {
  console.error("WebSocket錯誤:", error);
});

socket.on("close", function () {
  console.log("連接已關閉");
});

function placeOrder(stock, amount, action) {
  console.log(`發送訂單: ${action} ${amount} 股 ${stock}`);
  socket.send(JSON.stringify({ stock, amount, action }));

  // 更新持股數據
  updatePortfolio(stock, amount, action);

  // 記錄交易
  transactions.push({
    timestamp: new Date(),
    stock: stock,
    amount: amount,
    action: action,
    price: portfolio.currentPrices[stock] || 0,
  });
}

// 更新持股數據
function updatePortfolio(stock, amount, action) {
  const currentPrice = portfolio.currentPrices[stock] || 0;

  // 如果是第一次交易這支股票，先初始化
  if (!portfolio.stocks[stock]) {
    portfolio.stocks[stock] = 0;
    portfolio.averageBuyPrices[stock] = 0;
    portfolio.investedAmount[stock] = 0;
    portfolio.realizedProfit[stock] = 0;
  }

  // 更新股票數量和平均買入價格
  if (action === "BUY") {
    // 計算新的投資總額
    const newInvestment = amount * currentPrice;
    const totalInvestment = portfolio.investedAmount[stock] + newInvestment;

    // 更新持股數量
    portfolio.stocks[stock] += amount;

    // 更新投資總額
    portfolio.investedAmount[stock] = totalInvestment;

    // 計算新的平均買入價格
    portfolio.averageBuyPrices[stock] =
      totalInvestment / portfolio.stocks[stock];

    console.log(
      `買入 ${stock}: ${amount} 股 @ ${currentPrice}, 平均買入價: ${portfolio.averageBuyPrices[
        stock
      ].toFixed(2)}`
    );
  } else if (action === "SELL") {
    if (portfolio.stocks[stock] >= amount) {
      // 計算此次賣出的已實現盈虧
      const sellValue = amount * currentPrice;
      const costBasis = amount * portfolio.averageBuyPrices[stock];
      const profit = sellValue - costBasis;

      // 更新已實現盈虧
      portfolio.realizedProfit[stock] += profit;
      totalRealizedProfit += profit;

      // 減少持股數量
      portfolio.stocks[stock] -= amount;

      // 減少投資總額
      portfolio.investedAmount[stock] -= costBasis;

      console.log(
        `賣出 ${stock}: ${amount} 股 @ ${currentPrice}, 已實現盈虧: ${profit.toFixed(
          2
        )}`
      );

      // 如果全部賣出，重置平均買入價格
      if (portfolio.stocks[stock] === 0) {
        portfolio.averageBuyPrices[stock] = 0;
        portfolio.investedAmount[stock] = 0;
      }
    } else {
      console.warn(`警告: 嘗試賣出比持有更多的 ${stock} 股票，交易被拒絕`);
    }
  }
}

// 更新當前價格
function updatePrices(priceData) {
  for (const stock in priceData) {
    portfolio.currentPrices[stock] = priceData[stock].price;
  }
}

// 顯示持股報告
function displayPortfolio() {
  console.log("\n===== 當前持股報告 =====");
  console.log("股票\t數量\t買入價\t當前價格\t總投資\t總市值\t未實現盈虧");

  let totalInvested = 0;
  let totalMarketValue = 0;
  let totalUnrealizedProfit = 0;

  for (const stock in portfolio.stocks) {
    const quantity = portfolio.stocks[stock];
    if (quantity > 0) {
      const avgBuyPrice = portfolio.averageBuyPrices[stock];
      const currPrice = portfolio.currentPrices[stock] || 0;
      const invested = portfolio.investedAmount[stock];
      const marketValue = quantity * currPrice;
      const unrealizedProfit = marketValue - invested;

      totalInvested += invested;
      totalMarketValue += marketValue;
      totalUnrealizedProfit += unrealizedProfit;

      console.log(
        `${stock}\t${quantity}\t${avgBuyPrice.toFixed(2)}\t${currPrice.toFixed(
          2
        )}\t` +
          `${invested.toFixed(2)}\t${marketValue.toFixed(
            2
          )}\t${unrealizedProfit.toFixed(2)}`
      );
    }
  }

  console.log("-------------------------------------");
  console.log(
    `總計:\t\t\t\t${totalInvested.toFixed(2)}\t${totalMarketValue.toFixed(
      2
    )}\t${totalUnrealizedProfit.toFixed(2)}`
  );
  console.log("=======================\n");
}

// 計算損益
function calculateProfitLoss() {
  console.log("\n===== 損益報告 =====");
  console.log("股票\t已實現盈虧\t未實現盈虧\t總盈虧");

  let totalUnrealizedProfit = 0;
  let grandTotalProfit = 0;

  for (const stock in portfolio.currentPrices) {
    const realizedProfit = portfolio.realizedProfit[stock] || 0;

    // 計算未實現盈虧
    let unrealizedProfit = 0;
    if (portfolio.stocks[stock] > 0) {
      const marketValue =
        portfolio.stocks[stock] * portfolio.currentPrices[stock];
      const costBasis =
        portfolio.stocks[stock] * portfolio.averageBuyPrices[stock];
      unrealizedProfit = marketValue - costBasis;
    }

    totalUnrealizedProfit += unrealizedProfit;
    const totalProfit = realizedProfit + unrealizedProfit;
    grandTotalProfit += totalProfit;

    // 只顯示有交易的股票
    if (portfolio.realizedProfit[stock] || portfolio.stocks[stock] > 0) {
      console.log(
        `${stock}\t${realizedProfit.toFixed(2)}\t${unrealizedProfit.toFixed(
          2
        )}\t${totalProfit.toFixed(2)}`
      );
    }
  }

  console.log("-------------------------------------");
  console.log(
    `總計:\t${totalRealizedProfit.toFixed(2)}\t${totalUnrealizedProfit.toFixed(
      2
    )}\t${grandTotalProfit.toFixed(2)}`
  );
  console.log("====================\n");
}

// 記錄所有交易歷史
const transactions = [];

// 顯示交易歷史
function displayTransactionHistory() {
  console.log("\n===== 交易歷史 =====");
  for (const tx of transactions) {
    console.log(
      `${tx.timestamp.toLocaleString()}: ${tx.action} ${tx.amount} 股 ${
        tx.stock
      } @ ${tx.price}`
    );
  }
  console.log("====================\n");
}
