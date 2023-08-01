import fetch from 'node-fetch'
import util from 'util';

const urlForProtocol = (protocol) => {
  return protocol === 1 ? "https://api.thegraph.com/subgraphs/name/ianlapham/optimism-post-regenesis" : 
    protocol === 2 ? "https://api.thegraph.com/subgraphs/name/ianlapham/arbitrum-minimal" :
    protocol === 3 ? "https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v3-polygon" :
    protocol === 4 ? "https://api.thegraph.com/subgraphs/name/perpetual-protocol/perpetual-v2-optimism" :
    "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3";
}

const requestBody = (request) => {
  
  if(!request.query) return;

  const body = {
      method:'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        query: request.query,
        variables: request.variables || {}
      })
  }

  if (request.signal) body.signal = request.signal;
  return body;

}

export const getPoolHourData = async (pool, fromdate, todate, protocol, signal) => {
  //console.log('getPoolHourData parameters:', {pool, fromdate, todate, protocol, signal});

  const query =  `query PoolHourDatas($pool: ID!, $fromdate: Int!, $todate: Int!) {
    poolHourDatas ( where:{ pool:$pool, periodStartUnix_gt:$fromdate periodStartUnix_lt:$todate close_gt: 0}, orderBy:periodStartUnix, orderDirection:desc, first:1000) {
      periodStartUnix
      liquidity
      high
      low
      pool {
        id
        totalValueLockedUSD
        totalValueLockedToken1
        totalValueLockedToken0
        token0
          {decimals}
        token1
          {decimals}
      }
      close
      feeGrowthGlobal0X128
      feeGrowthGlobal1X128
      }
    }
    `

  const url = urlForProtocol(protocol);
  //console.log('protocol@58:', protocol);  // Add log

  try {
    const response = await fetch(url, requestBody({query: query, variables: {pool: pool, fromdate: fromdate, todate: todate}, signal: signal}));
    let data;
    try {
      data = await response.json();
    } catch (error) {
      console.error('Error parsing response as JSON:', error);
      return null;
    }

    if (data && data.data && data.data.poolHourDatas) {
      //console.log('poolHourDatas:', util.inspect(data.data.poolHourDatas, {depth: null}));
      return data.data.poolHourDatas;
    }
    else {
      //console.log("nothing returned from getPoolHourData");
      return null;
    }
} catch (error) {
    console.error('Error:', error);
    return {error: error};
}
}

export const poolById = async (id, protocol) => {

  const url = urlForProtocol(protocol);
  //console.log('protocol@85:', protocol);  // Add log

  const poolQueryFields = `{
    id
    feeTier
    totalValueLockedUSD
    totalValueLockedETH
    token0Price
    token1Price  
    token0 {
      id
      symbol
      name
      decimals
    }
    token1 {
      id
      symbol
      name
      decimals
    }
    poolDayData(orderBy: date, orderDirection:desc,first:1)
    {
      date
      volumeUSD
      tvlUSD
      feesUSD
      liquidity
      high
      low
      volumeToken0
      volumeToken1
      close
      open
    }
  }`

  const query =  `query Pools($id: ID!) { id: pools(where: { id: $id } orderBy:totalValueLockedETH, orderDirection:desc) 
   ${poolQueryFields}
  }`

  try {
    const response = await fetch(url, requestBody({query: query, variables: {id: id}}));
    const data = await response.json();


    if (data && data.data) {
      const pools = data.data.id;
      //console.log('pools@137:', pools);  // Add log
      //console.log('pools.length@137:', pools.length);  // Add log
    
      if (pools && pools.length && pools.length === 1) {
        return pools[0];
      }
    }
    else {
      return null;
    }

  } catch (error) {
    return {error: error};
  }

}