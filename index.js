import { poolById, getPoolHourData } from './uniPoolData.mjs'
import { tokensForStrategy, liquidityForStrategy, calcFees, pivotFeeData } from './backtest.mjs'

const DateByDaysAgo = (days, endDate = null) => {
  const date = !!endDate ? new Date(endDate * 1000) : new Date();
  return Math.round( (date.setDate(date.getDate() - days) / 1000 ));
}

// data, pool, baseID, liquidity, unboundedLiquidity, min, max, customFeeDivisor, leverage, investment, tokenRatio
// Required = Pool ID, investmentAmount (token0 by default), minRange, maxRange, options = { days, protocol, baseToken }

export const uniswapStrategyBacktest = async ( pool, investmentAmount, minRange, maxRange, options = {}) => {
  const opt = {days: 30, protocol: 2, priceToken: 0, period: "hourly", ...options };
  const theProtocol = opt.protocol;
  //console.log('theProtocol@14:', theProtocol);

  if (pool) {
    //const poolData = await poolById(pool);
    const poolData = await poolById(pool, theProtocol);
    //console.log('poolData@18:', poolData);  // Add log
    //console.log('pool@17:', pool);  // Add log
    let { startTimestamp, endTimestamp, days } = opt;
    if (!endTimestamp) {
      endTimestamp = Math.floor(Date.now() / 1000);
    }
    if (!startTimestamp && days) {
      startTimestamp = DateByDaysAgo(days, endTimestamp);
    }
    const hourlyPriceData = await getPoolHourData(pool, startTimestamp, endTimestamp, theProtocol);
    //console.log('poolData@27:', poolData);  // Add log
    //console.log('hourlyPriceData:', hourlyPriceData);  // Add log
    //console.log('hourlyPriceData.length=', hourlyPriceData.length);  // Add log
    if (poolData && hourlyPriceData && hourlyPriceData.length > 0) {
      //console.log('Index_Data exists and will be processed.');  // Add log
      const backtestData = hourlyPriceData.reverse();
      const entryPrice = opt.priceToken === 1 ?  1 / backtestData[0].close : backtestData[0].close
      const tokens = tokensForStrategy(minRange, maxRange, investmentAmount, entryPrice, poolData.token1.decimals - poolData.token0.decimals);
      const liquidity = liquidityForStrategy(entryPrice, minRange, maxRange, tokens[0], tokens[1], poolData.token0.decimals, poolData.token1.decimals);
      const unbLiquidity = liquidityForStrategy(entryPrice, Math.pow(1.0001, -887220), Math.pow(1.0001, 887220), tokens[0], tokens[1], poolData.token0.decimals, poolData.token1.decimals);
      const hourlyBacktest = calcFees(backtestData, poolData, opt.priceToken, liquidity, unbLiquidity, investmentAmount, minRange, maxRange);
      return opt.period === 'daily' ? pivotFeeData(hourlyBacktest, opt.priceToken, investmentAmount) : hourlyBacktest;
    }
    else {
      //console.log('Data does not exist or is empty.');  // Add log
    }
  }
}

export const hourlyPoolData = (pool, days = 30, protocol = protocol) => {
  getPoolHourData(pool, DateByDaysAgo(days), protocol).then(d => {
    if ( d && d.length ) { return d }
    else { return null }
  })
}

export default uniswapStrategyBacktest