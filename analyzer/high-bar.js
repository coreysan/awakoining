import chalk from 'chalk';

/**
 * Track the graph's high bar
 */
export class HighBar {

  constructor() {
    this.isAllTimeHigh = false;
    this.highBar = 0;
  }

  /**
   * Set the new max if it is one.
   *
   * And record whether this closePrice is the all-time high or not
   *
   * @param {float} closePrice the closePrice of this candlestick
   *
   * @return {float} - the highBar after this close price is given
   */
  set (closePrice) {
    this.isAllTimeHigh = (closePrice > this.highBar);
    this.highBar = Math.max(closePrice, this.highBar);
    return this.highBar;
  }

  /** [print description] */
  print() {
    if (this.isAllTimeHigh){
      console.log(chalk.bold.green(`All time high @\t ${this.highBar} `));
    }
  }
}