import { Parser } from 'json2csv';
import uniswapStrategyBacktest from 'uniswap-v3-backtest'
import { getPoolHourData } from './uniPoolData.mjs'
import fs from 'fs';

const poolID = "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640";
const investmentAmount = 10000;
const days = 7;
const period = "hourly";
const protocol = 0; // 使用 Ethereum 主鏈
const percent = 0.02;

async function runBacktest() {
  let poolHourDatas = await getPoolHourData(poolID, Math.floor(Date.now()/1000 - days*24*60*60), Math.floor(Date.now()/1000), protocol);

  // 反轉數據順序，從最早的一小時開始
  poolHourDatas = poolHourDatas.reverse();

  const parser = new Parser();
  let isFirst = true; // 判斷是否為第一次回測，用來決定是否添加 CSV 標題行
  let lastHourData = null; // 存儲上一小時的數據

  // 初始價格區間
  let minRange = poolHourDatas[0].close * (1-percent);
  let maxRange = poolHourDatas[0].close * (1+percent);
  let i = 0;

  for (const poolHourData of poolHourDatas) {
    const poolHourData = poolHourDatas[i];
    const nextPoolHourData = currentIndex < poolHourDatas.length - 1 ? poolHourDatas[currentIndex + 25] : null;
    i++;
    lastHourData = poolHourData;
    if (lastHourData) {
      const hprice = lastHourData.high; // 上小時High
      const lprice = lastHourData.low; // 上小時low
      const cprice = lastHourData.close; // 這小時Open

      // 檢查價格是否超出當前的價格區間
      if (lprice < minRange || hprice > maxRange) {
        // 更新價格區間
        minRange = cprice * (1-percent);
        maxRange = cprice * (1+percent);
        let StartTime = poolHourData.periodStartUnix;
        let EndTime = nextPoolHourData.periodStartUnix;
        console.log(`StartTime=${StartTime}`);
        console.log(`EndTime=${EndTime}`);

        // 運行回測
        let backtestResults = await uniswapStrategyBacktest(poolID, investmentAmount, minRange, maxRange, {startTimestamp: StartTime, endTimestamp: EndTime, period: period});

        // 在回測結果中添加 minRange 和 maxRange
        backtestResults = backtestResults.map(result => ({...result, minRange, maxRange}));

        // 將回測結果轉換為 CSV 格式
        const csv = parser.parse(backtestResults, {header: isFirst});
        isFirst = false;

        // 將 CSV 內容添加到文件中
        fs.appendFile('backtestResults.csv', csv + '\n', (err) => {
          if (err) throw err;
          console.log('The file has been updated!');
        });
      }
    }
    lastHourData = poolHourData;
  }
}

runBacktest();