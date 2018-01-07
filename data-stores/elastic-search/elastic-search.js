import elasticsearch from 'elasticsearch';
import { DataStore } from '../data-store';

var client = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'trace'
});

export class ElasticSearch extends DataStore {

  // constructor() {
    // this.symbols,
    // this._interval(),
    // this.startTime
  // }

  _setDestinationName() {
    return 'Elastic Search';
  }

  _start() {
    // clear all candlesticks with this symbol & interval
    client.deleteByQuery({
      index: 'candlestick',
      body: {
        query: {
          bool: {
            must: [
              { match: { symbols: this.symbols } },
              { match: { interval: this.interval } },
            ],
          },
        }
      },
    }).then((results) => {
      console.log('results from delete: ', results);
    }).catch((error) => {
      console.log('error: ', error);
      throw error;
    });
  }

  /**
   *
   */
  add(candlesticks, isFirstRun) {

    const elasticData = [];
    candlesticks.forEach((candlestick) => {
      elasticData.push({ index:  { _index: 'candlestick', _type: 'doc' } });
      elasticData.push({
        ...candlestick,
        symbols: this.symbols,
        interval: this.interval,
      });
    });

    console.log('elasticData: ', elasticData);

    client.bulk({
      body: elasticData
    }).catch((error) => {
      console.log('error adding to elasticsearch: ', error);
    });
  }
}
