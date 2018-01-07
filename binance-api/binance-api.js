import axios from 'axios';
import moment from 'moment';

import { CsvWriter } from '../data-stores/csv/csv-writer';
import { ElasticSearch } from '../data-stores/elastic-search/elastic-search';

import { headers } from '../authentication/headers';

const DATA_POINTS_PER_REQUEST = 500;
const UNIX_TIMESTAMP_FORMAT = 'x'; // unix ms timestamp
const URL_BASE = 'https://api.binance.com';
const ZERO_PADDING = '000';

export class BinanceApi  {

  constructor(options) {
    this.options = options;

    if (this.options){
      this.symbols = this.options.symbols;
      this._setIntervals(this.options.interval);
      if (this.options.startTime) {
        this.startTime = moment(this.options.startTime)
          .startOf('minute')
          .utcOffset(-8)
          .format(UNIX_TIMESTAMP_FORMAT);
      }
    }
  }

  /**
   * Ping the binance API
   */
  async ping() {
    const response = await axios.get(URL_BASE+'/api/v1/ping', {
      headers,
    });
    console.log('Status: ', `${response.status} ${response.statusText}\n`);
  }

  async store() {
    this._ensureSymbols();

    const elasticSearch = new ElasticSearch(
      this.symbols,
      this._interval(),
      this.startTime
    );

    await this._run(elasticSearch);
  }

  async _run (dataStore) {
    let lastTimestamp;
    let startTimestamp = this.startTime;
    let isFirstRun = true;
    /**
     * Write candlesticks from the startTimestamp
     * @param  {int} startTimestamp
     * @return {response}
     */
     var _writeCandlesticksFrom = async (startTimestamp) => {
      const response = await this._getKLines(startTimestamp);
      if (response.data.length === 0) {
        console.log(`Couldn't find any candlesticks after ${this.startTime}`);
        process.exit();
      }
      const candlesticks = this._organizeCandlesticks(response.data);
      dataStore.add(candlesticks, isFirstRun);
      return response;
    }

    do {
      const response = await _writeCandlesticksFrom(startTimestamp);
      isFirstRun = false;
      lastTimestamp = response.data[response.data.length - 1][0];
      startTimestamp = this._nextStartTimestamp(lastTimestamp);
    } while(!this._timestampIsCurrent(lastTimestamp));

    dataStore._finishStorage();
  }

  _ensureSymbols() {
    if (!this.symbols) {
      throw new Error('Please provide symbols');
    }
  }

  /**
   * Export some symbol data to CSV
   *
   * todo CS - move this to an exporter class
   *  - function within function is a sign that it should be
   *    broken into a separate class.
   */
  async export() {

    this._ensureSymbols();

    const csvWriter = new CsvWriter(
      this.symbols,
      this._interval(),
      this.startTime
    );

    await this._run(csvWriter);
  }

  /**
   * Set the various interval formats
   */
  _setIntervals(interval) {
    this.intervalIdentifier = interval.substring(interval.length-1);
    this.interval = this.options.interval
                              .replace(this.intervalIdentifier, '');
    this.intervalHuman = this._momentInterval(this.intervalIdentifier);
  }

  /**
   * Return the original binance interval like 1m
   */
  _interval() {
    return `${this.interval}${this.intervalIdentifier}`;
  }

  /**
   * Get the next start timestamp by adding one minute to the
   * previous end timestamp;
   *
   * @param  {int} lastTimestamp - last timestamp in the batch
   * @return the integer representing the next start timestamp
   */
  _nextStartTimestamp(lastTimestamp) {
    return moment(lastTimestamp, UNIX_TIMESTAMP_FORMAT)
        .add(this.interval, 'minutes')
        .startOf('minute')
        .format(UNIX_TIMESTAMP_FORMAT);
  }

  _timeBounds(startTime) {
    if(!startTime) {
      return {};
    }

    const endTime = moment(startTime, UNIX_TIMESTAMP_FORMAT)
      .add(DATA_POINTS_PER_REQUEST - 1, 'minutes')
      .format(UNIX_TIMESTAMP_FORMAT);

    return { startTime, endTime };
  }

  /**
   * Get the 500 max KLines from some start time
   * @param  {int} startInverval
   * @return {Object} response with response.data - array of candlesticks
   */
  async _getKLines(startTime){
    let response;

    const timeBounds = this._timeBounds(startTime);

    try {
      response = await axios.get(URL_BASE+'/api/v1/klines', {
        headers,
        params: {
          symbol:    'MODETH',
          interval:  this._interval(),
          ...timeBounds,
        },
      });
    } catch(err) {
      console.log('error getting klines: ', err);
    }
    return response;
  }

  /**
   * Check if the given timestamp represents the current minute or not
   *
   * The API has ~5s delay in updating its candlestick minute start,
   *   so we check that our timestamp is at least one off.
   *
   * As we're retrieving candlesticks in batches of 500 at a time, this
   * is only a problem 1/500 of the time, and only delays us by 1 interval max
   *
   * TODO CS: sort this out ^
   *
   * Minute in MS = 60000
   */
  _timestampIsCurrent(endTimestamp) {
    const currentMinuteTimestamp = moment()
      .utcOffset(-8)
      .startOf('minute')
      .format(UNIX_TIMESTAMP_FORMAT);

    const errorThreshold = this._errorThreshold();

    const isTimestampCurrent = (currentMinuteTimestamp - endTimestamp) <= 60*1000;
    return isTimestampCurrent;
  }

  /**
   * Get the number of ms in one interval by subtracting
   *  now()+15 minutes - now()
   *
   * @return {int} number of timestamps
   */
  _errorThreshold() {
    return moment().add(this.interval, this._momentInterval()).format(UNIX_TIMESTAMP_FORMAT)
        -  moment().format(UNIX_TIMESTAMP_FORMAT)
  }

  /**
   * Given a seconds timestamps like  1499040000
   * pad to MS by adding three zeros: 1499040000000
   */
  _padToMS (timestamp) {
    return timestamp + ZERO_PADDING;
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
    // console.log('candlesticks: ', candlesticks);
    return candlesticks;
  }

  /**
   * Translate the binance interval code to moment time range
   *
   * @param  {String} intervalType
   * @return {String} the 'moment' version of the time range. e.g. minute
   */
  _momentInterval() {
    const intervalTranslations = {
      m: 'minutes',
      h: 'hours',
      d: 'days',
      w: 'weeks',
      M: 'months',
    };
    return intervalTranslations[this.intervalIdentifier];
  }

}