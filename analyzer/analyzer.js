import { ElasticSearch } from '../data-stores/elastic-search/elastic-search';
import { State } from './state';
import { Window } from './window';
import { HighBar } from './high-bar';
import { Trend } from './trend';
import { Purchaser } from './purchaser/purchaser';

const WINDOW_SIZE = 2;

/**
 * See README for algorithm details
 */
export class Analyzer  {

  constructor(symbol, interval) {
    this.elasticSearch = new ElasticSearch(
      symbol,
      interval,
      null,
    );
    this.isDormant = false;
    this.state = new State;
    this.window = new Window(WINDOW_SIZE);
    this.highBar = new HighBar();
    this.trend = new Trend(this.window);
    this.purchaser = new Purchaser(symbol);
  }

  /**
   * TEMP - Gets historical data from ElasticSearch and runs our
   *        algorithm against it.
   */
  async analyze() {
    this.candlesticks = (await this.elasticSearch.getData()).hits.hits;
    this.candlesticks.forEach((candlestick) => {
      if (this.isAwakening(candlestick._source.closePrice)) {
        console.log('AWAKENING');
        console.log(`BUYING AT ${candlestick._source.closePrice}`);
      }
      console.log('--- ');
      this._recordCandlestick(candlestick);
      this.printUpdate();
    });
  }

  /**
   * Record a candlestick by adding it to the window and
   * setting the high bar
   *
   * @param  Object candlestick - ES candlestick doc
   */
  _recordCandlestick(candlestick) {
    this.window.add(
      candlestick._source.lowPrice,
      candlestick._source.closePrice,
      candlestick._source.highPrice,
      candlestick._source.volume);

    this.highBar.set(candlestick._source.closePrice);
  }

  printUpdate() {
    this.highBar.print();
    this.window.print();
    // this.trend.print();
  }

  /**
   * The coin is awakening IF
   * - The coin *was* dormant
   * - This new close price is greater than the dormant window's high
   */
  isAwakening(closePrice) {
    return this.window.isDormant() && closePrice > this.window.max;
  }
}