/**
 * The Binance Api
 */
import axios from 'axios';
import moment from 'moment';

import { headers } from './authentication/headers';

const URL_BASE = 'https://api.binance.com';
const DATA_POINTS_PER_REQUEST = 500;
const UNIX_TIMESTAMP_FORMAT = 'x'; // unix ms timestamp

export class Binance {


  ping() {
    console.log('Pinging Binance Api');
    return axios.get(URL_BASE+'/api/v1/ping', {
      headers,
    }).catch((error) => {
      console.log('error: ', error);
    });
  }

  /**
   * The base symbol is the second in the pairing:
   *
   *  PRLETH - ETH is the base symbol
   *
   * @param string baseSymbol -
   * @return
   */
  async getPairs(baseSymbol) {
    let symbols;
    try {
      symbols = await axios.get(URL_BASE+'/api/v1/ticker/allPrices', {
        headers,
      });
    } catch (error) {
      console.log(`Error getting pairs for ${baseSymbol}: `, error);
      throw error;
    }
    // const baseSymbol = 'ETH';
    // ETH is in the name but in the last three char positions
    // If SYMBOLS is SGNLSETH, then length is 8
    // and ETH is at 012345, 5.
    symbols = symbols.data.filter((symbol) => {
      const ethPosition = symbol.symbol.indexOf(baseSymbol);
      return (ethPosition === symbol.symbol.length - baseSymbol.length);
    });

    symbols = symbols.map((symbol) => {
      return symbol.symbol;
    });
    console.log('symbols: ', symbols);
    return symbols;
  }

  getHoldings() {

  }

  /**
   * Get the 500 max KLines from some start time
   * @param  {int} startInverval
   * @return {Object} response with response.data - array of candlesticks
   */
  async getCandlesticks(symbols, interval, startTime) {
    // console.log('symbols: ', symbols);
    // console.log('interval: ', interval);
    // console.log('startTime: ', startTime);
    const timeBounds = this._timeBounds(startTime, interval);

    let response;
    try {
      response = await axios.get(URL_BASE+'/api/v1/klines', {
        headers,
        params: {
          symbol:    symbols,
          interval:  interval,
          ...timeBounds,
        },
      });
    } catch(err) {
      console.log('error getting binance candlesticks: ', err);
      process.exit();
    }

    if (response.data.length === 0) {
      console.log(`Couldn't find any candlesticks for ${symbols} on ${interval} after ${startTimestamp}`);
      return false;
    }

    return this._organizeCandlesticks(response.data);;
  }

  /**
   * Set the time bounds from the startTime to the endTime.
   *
   *  Uses moment to capture the dates.
   *
   * @param  {int} startTime - ms timestamp
   * @return Object - with start & end times
   */
  _timeBounds(startTime, interval) {
    if(!startTime) {
      return {};
    }

    const endTime = moment(startTime, UNIX_TIMESTAMP_FORMAT)
      .add(DATA_POINTS_PER_REQUEST - 1, 'minutes')
      .format(UNIX_TIMESTAMP_FORMAT);
    // const intervalAmount = interval.substring(0, 1);
    // const intervalLabel =
    //       this._momentInterval(interval.substring(interval.length -1));
    // // console.log('intervalLabel: ', intervalLabel);
    // const endTime = moment()
    //   .subtract(intervalAmount, intervalLabel)
    //   .format(UNIX_TIMESTAMP_FORMAT);

    return { startTime, endTime };
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
  _organizeCandlesticks(plainCandlesticks) {
    const candlesticks = [];
    plainCandlesticks.map((candlestick) => {
      candlesticks.push({
        openTime: candlestick[0], // already a number
        openPrice: Number(candlestick[1]),
        highPrice: Number(candlestick[2]),
        lowPrice: Number(candlestick[3]),
        closePrice: Number(candlestick[4]),
        volume: Number(candlestick[5]),
        closeTime: candlestick[6], // already a number
        quoteAssetVolume: Number(candlestick[7]),
        numberOfTrades: Number(candlestick[8]),
        takerBuyBaseAssetVolume: Number(candlestick[9]),
        takerBuyQuoteAssetVolume: Number(candlestick[10]),
        ignored: candlestick[11], // wtf is this?
      });
    });
    return candlesticks;
  }

}
