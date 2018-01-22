import elasticsearch from 'elasticsearch';
import { DataStore } from '../data-store';

var client = new elasticsearch.Client({
  host: 'localhost:9200',
  // log: 'trace' // removed to hide output
});

export class ElasticSearch extends DataStore {

  _setDestinationName() {
    return 'Elastic Search';
  }

  clearData() {
    // clear all candlesticks with this symbol & interval before reinserting
    client.deleteByQuery({
      index: 'candlestick',
      body: {
        query: {
          filter: {
            must: [
              { match: { symbols: this.symbols } },
              { match: { interval: this.interval } },
            ],
          },
        }
      },
    }).then((results) => {
      // console.log('Results from delete: ', results);
    }).catch((error) => {
      console.log('error deleting ES data: ', error);
      throw error;
    });
  }

  getData() {
    return client.search({
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
    })
    .then((response) =>  response )
    .catch((error) => {
      console.log(`Error getting ES data for ${this.symbols} on ${this.interval}: `, error);
      throw error;
    });
  }

  /**
   * Add some candlesticks to ES
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

    client.bulk({
      body: elasticData
    }).catch((error) => {
      console.log('error adding to elasticsearch: ', error);
    });
  }
}
