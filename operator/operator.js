import moment from 'moment';
import color from 'color';

import { Analyzer } from '../analyzer/analyzer';
import { Binance } from '../apis/binance';
import { Gui } from './gui';
import { CsvWriter } from '../data-stores/csv/csv-writer';
import { Interval } from './interval';
import { ElasticSearch } from '../data-stores/elastic-search/elastic-search';

const UNIX_TIMESTAMP_FORMAT = 'x'; // unix ms timestamp
const ZERO_PADDING = '000';
const SCRAPER_TIMEOUT = 200;

export class Operator  {

  constructor(options) {
    this.options = options;

    this.api = new Binance();

    if (this.options){
      this.symbols = this.options.symbols;
      this.interval = new Interval(this.options.interval);
      if (this.options.startTime) {
        this.startTime = moment(this.options.startTime)
          .startOf('minute')
          .utcOffset(-8)
          .format(UNIX_TIMESTAMP_FORMAT);
      }
    }
  }

  gui() {
    this.gui = new Gui;
  }

  /**
   * Ping the API
   */
  async ping() {
    try {
      const response = await this.api.ping();
    } catch (error) {
      console.log('Error pinging server: '.red, error);
      throw error;
    }
    console.log('Status: ', `${response.status} ${response.statusText}\n`);
  }

  /**
   * Store the symbols in elastic search
   * @return
   */
  async store() {
    this._ensureSymbols();

    // console.log('this.interval.binanceNotation: ', this.interval.binanceNotation);
    const elasticSearch = new ElasticSearch(
      this.symbols,
      this.interval.binanceNotation
    );

    await elasticSearch.clearData();
    await this._run(this.symbols, this.interval.binanceNotation, elasticSearch);
  }

  async analyze() {
    const analyzer = new Analyzer(this.symbols, this.interval.binanceNotation);
    await analyzer.analyze();
  }

  /**
   * Set the initial start time to 24 hours ago
   */
  setInitialStartTime() {
    if (!this.startTime) {
      this.startTime = moment()
        .subtract(24, 'hours')
        .startOf('minute');
    }
  }

  /**
   * Store all the cryptos at once, iterating every symbol and every
   * candlestick.
   */
  async storeAll() {

    this.setInitialStartTime();
    console.log('this.startTime: ', this.startTime);

    // todocs - put this back in play to get all candlesticks
    // let symbolPairs;
    // try {
    //   symbolPairs = await this.api.getPairs('ETH');
    // } catch (error) {
    //   throw error;
    // };
    const symbolPairs = ['NEOETH',
    // 'BATETH'
    ];

    const intervals = [
      // '1m',
      // '3m',
      '5m',
      // '15m', '30m',
      // '1h',
      // '2h',
      // '4h', '6h',
      // '8h', '12h', '1d'
    ];

    // 2d loop, creating new ESearch and adding
    symbolPairs.forEach((symbolPair, i) => {
      intervals.forEach((interval, j) => {
        setTimeout(async () => {
          const elasticSearch = new ElasticSearch(
            symbolPair,
            interval,
          );
          console.log(`Storing ${symbolPair} over ${interval}...`);

          await this._run(symbolPair, interval, elasticSearch);
        }, (SCRAPER_TIMEOUT * i) + (SCRAPER_TIMEOUT+j));
      });
    });
  }

  async _run (symbols, interval, dataStore) {
    let lastTimestamp;
    let startTimestamp = this.startTime;
    let isFirstRun = true;

    /**
     * Write candlesticks from the startTimestamp
     * @param  {int} startTimestamp
     * @return {response}
     */
     var _writeCandlesticksFrom = async (startTimestamp) => {
      let candlesticks;
      try {
        candlesticks = await this.api.getCandlesticks(
          symbols,
          interval,
          startTimestamp);
      } catch (error) {
        console.log('Error writing candlesticks from startTimestamp: ', error);
        throw error;
      }
      dataStore.add(candlesticks, isFirstRun);
      return candlesticks;
    }

    do {
      const response = await _writeCandlesticksFrom(startTimestamp);
      if (!response || response.length === 0) {
        return;
      }

      isFirstRun = false;
      lastTimestamp = response[response.length - 1][0];
      startTimestamp = this._nextStartTimestamp(lastTimestamp);
    } while(!this._reachedCurrentTime(startTimestamp) );

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
      this.interval.binanceNotation,
      this.startTime
    );

    await this._run(this.symbols, this.interval.binanceNotation, csvWriter);
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
        .add(this.interval.value, this.interval.units)
        .startOf('minute')
        .format(UNIX_TIMESTAMP_FORMAT);
  }

  /**
   * Check if last timestamp + interval > current
   *
   * @param  {integer} lastTimestamp - the last timestamp in the response
   */
  _reachedCurrentTime(timestamp) {
    return timestamp >= moment().format(UNIX_TIMESTAMP_FORMAT);
  }

  /**
   * Given a seconds timestamps like  1499040000
   * pad to MS by adding three zeros: 1499040000000
   */
  _padToMS (timestamp) {
    return timestamp + ZERO_PADDING;
  }

}