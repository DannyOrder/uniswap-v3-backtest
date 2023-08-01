import { logWithBase, round, sumArray, parsePrice } from "./numbers.mjs";

// 計算一單位無限制流動性在一個週期內獲得的費用 //
// fg0 代表 token 0 的數量，fg1 代表 token1 的數量 //
export const calcUnboundedFees = (globalfee0, prevGlobalfee0, globalfee1, prevGlobalfee1, poolSelected) => {

  // 將全局費用轉換為實際 token 數量
  const fg0_0 = ((parseInt(globalfee0)) / Math.pow(2, 128)) / (Math.pow(10, poolSelected.token0.decimals));
  const fg0_1 = (((parseInt(prevGlobalfee0))) / Math.pow(2, 128)) / (Math.pow(10, poolSelected.token0.decimals));

  const fg1_0 = ((parseInt(globalfee1)) / Math.pow(2, 128)) / (Math.pow(10, poolSelected.token1.decimals));
  const fg1_1 = (((parseInt(prevGlobalfee1))) / Math.pow(2, 128)) / (Math.pow(10, poolSelected.token1.decimals));

  // 計算一個週期內，每單位無限制流動性可以賺取的費用
  const fg0 = (fg0_0 - fg0_1); // token 0 的費用
  const fg1 = (fg1_0 - fg1_1); // token 1 的費用

  return [fg0, fg1];
}

// 計算指定價格的流動性 tick 
export const getTickFromPrice = (price, pool, baseSelected = 0) => {
  // 決定哪個 token 為基礎 token
  const decimal0 = baseSelected && baseSelected === 1 ? parseInt(pool.token1.decimals) : parseInt(pool.token0.decimals);
  const decimal1 = baseSelected && baseSelected === 1 ? parseInt(pool.token0.decimals) : parseInt(pool.token1.decimals);

  // 計算價格對應的 tick
  const valToLog = parseFloat(price) * Math.pow(10, (decimal0 - decimal1));
  const tickIDXRaw = logWithBase(valToLog,  1.0001);

  // 四捨五入獲得整數的 tick
  return round(tickIDXRaw, 0);
}

// 估算基於最小最大範圍的策略在一週期內的活躍流動性百分比
// low 和 high 是該週期的蠟燭圖低點和高點值
export const activeLiquidityForCandle = (min, max, low, high) => {
  // 除數，避免分母為零的情況
  const divider = (high - low) !== 0 ? (high - low) : 1;
  // 計算價格範圍與蠟燭圖範圍的重疊部分占蠟燭圖範圍的比例
  const ratioTrue = (high - low) !== 0 ? (Math.min(max, high) - Math.max(min, low)) / divider : 1;
  // 如果蠟燭圖範圍與價格範圍有重疊，則活躍流動性為比例乘以 100，否則為 0
  let ratio = high > min && low < max ? ratioTrue * 100 : 0;

  return isNaN(ratio) || !ratio ? 0 : ratio;
}

// 根據特定的流動性和價格，計算一個策略的 token 數量
export const tokensFromLiquidity = (price, low, high, liquidity, decimal0, decimal1) => {
  // 根據價格和流動性範圍，計算在特定價格時，策略所擁有的 token 數量
  // 這裡考慮到了價格可能位於流動性範圍的上方、下方或中間的情況
}

// 根據特定價格計算一個策略擁有的 token 數量
export const tokensForStrategy = (minRange, maxRange, investment, price, decimal) => {
  // 根據投資額和價格，以及流動性範圍，計算在特定價格時，策略所擁有的 token 數量
}

// 根據策略擁有的 token 數量計算流動性份額
export const liquidityForStrategy = (price, low, high, tokens0, tokens1, decimal0, decimal1) => {
  // 根據策略所擁有的 token 數量，以及價格和流動性範圍，計算策略的流動性份額
}

// 計算預估的費用
export const calcFees = (data, pool, priceToken, liquidity, unboundedLiquidity, investment, min, max) => {
  // 根據流動性、無限制流動性、投資額和價格範圍，計算策略可能獲得的費用
}

// 將小時費用數據（由 calcFees 生成）轉換為日費用數據
export const pivotFeeData = (data, priceToken, investment) => {
  // 將每個小時的費用數據匯總成每日的費用數據
}