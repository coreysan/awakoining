/**
 * The purchaser is responsible for purchasing
 *  coins at the given rate and safeguarding against
 *  an impending dump.
 *
 *  - Symbol is the symbol to purchase
 *  - InitialPrice is the buy price
 *  - stopAt is the sell limit activation price
 *  - stopSellAt is the sell limit selling price
 *  - sell amount is the amount to sell:
 *    - equal to the initial amount purchased
 */

const SELL_STEP = 0.005;// 0.5%

export class Purchaser {

  constructor(symbol) {
    this.symbol = symbol;
    this.initialPrice = null;
    this.stopLimitOrderId = null;
    this.stopAt = null;
    this.stopSellAt = null;
    this.amount = null;
  }

  buy(price) {
    this._buyAtMarketPrice(price);
    this._setStopLimitOrder();
  }

  // todo cs: buy to set the initial price
  async _buyAtMarketPrice(price) {
    this.initialPrice = price;
  }

  _setStopLimitOrder() {
    this.stopAt = this.initialPrice - (this.initialPrice * SELL_STEP);
    this.stopSellAt = this.initialPrice -
                          (this.initialPrice * (SELL_STEP * 2));
    // todo cs: hit the API to set this stop limit order.
    //

  }

  /**
   * Each new candlestick that comes in will cause a reevaluation
   * of the landscape.
   *
   * If a bullish candlestick is found, we reset the stop limits
   *  to be higher than their initial values.
   *
   * Otherwise, on a bearish candle, we just ride the dip out.
   *
   * The stop limit order takes care of
   *
   * @param  {[type]} closePrice [description]
   * @return {[type]}            [description]
   */
  reevaluate(closePrice) {

  }
}
