import axios from 'axios';
import json2csv from 'json2csv';
import { headers } from '../authentication/headers';

const URL_BASE = 'https://api.binance.com';

export class BinanceApi  {

  constructor(symbols) {
    this.symbols = symbols;
  }

  async export() {

    console.log('EXPORT');
    const response = await axios.get(URL_BASE+'/api/v1/klines', {
      headers,
      params: {
        symbol: 'MODETH',
        interval: '5m',
      },
    });

    const candlesticks = this.organizeCandlesticks(response.data);
    var csv = json2csv({ data: myCars, fields: fields });
    // console.log('candlesticks: ', candlesticks);
  }

  /**
   * change arrays to objects
   *
   *  [
   *    1499040000000,      // Open time
   *    "0.01634790",       // Open
   *    "0.80000000",       // High
   *    "0.01575800",       // Low
   *    "0.01577100",       // Close
   *    "148976.11427815",  // Volume
   *    1499644799999,      // Close time
   *    "2434.19055334",    // Quote asset volume
   *    308,                // Number of trades
   *    "1756.87402397",    // Taker buy base asset volume
   *    "28.46694368",      // Taker buy quote asset volume
   *    "17928899.62484339" // Can be ignored
   *  ]
   */
  organizeCandlesticks(plainCandlesticks) {
    const candlesticks = [];
    plainCandlesticks.map((candlestick) => {
      candlesticks.push({
        openTime: candlestick[0],
        openPrice: candlestick[2],
        highPrice: candlestick[3],
        lowPrice: candlestick[4],
        closePrice: candlestick[5],
        volume: candlestick[6],
        closeTime: candlestick[7],
        quoteAssetVolume: candlestick[8],
        numberOfTrades: candlestick[9],
        takerBuyBaseAssetVolume: candlestick[10],
        takerBuyQuoteAssetVolume: candlestick[11],
        ignored: candlestick[12], // wtf is this?
      });
    });
    return candlesticks;
  }

}