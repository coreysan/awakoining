/**
 * Tracks current holdings throughout the trades
 */

export class Holdings {

  constructor(holdings) {
    // todo cs - get holdings from API, not hard-coded
    this.holdings = {
      ETH: 1, // todo cs -
      ...holdings,
    };
  }

  _exists(symbol) {
    return !!(this.holdings[symbol]);
  }

  add(symbol, amount) {
    if (!this._exists()) {
      return 0;
    }

    this.holdings[symbol] += amount;
    return this.holdings[symbol];
  }

  get(symbol) {
    if (!this._exists()) {
      return 0;
    }

    return this.holdings[symbol];
  }
}
