/**
 * Do we care about the trend of this candlestick?
 *   Not really, as long as it's in the window
 */
export class Trend {

  constructor(window) {
    this.window = window;
  }

  /** [print description] */
  print() {
    // console.log('this.window.lows: ', this.window.lows);
    // this.window.print();
    // process.stdout.write('highBar: ', this.highBar);
    // process.stdout.write('isAllTimeHigh: ', this.isAllTimeHigh);
  }
}