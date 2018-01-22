import chalk from 'chalk';

const DORMANT_VARIANCE_THRESHOLD = 50;

/**
 * Class controlling the window
 *
 * - min, max, variance, current, moving average, etc.
 */
export class Window  {

  constructor(size) {
    this.size = size;
    this.lows = [];
    this.prices = [];
    this.highs = [];
    this.volumes = [];

    this.max = null;
    this.min = null;

    this.awakening = false;
  }

  /**
   * Add one to each array and splice the first off
   * if the array length is > size
   */
  add(lowPrice, closePrice, highPrice, volume) {
    this.printIncoming(lowPrice, closePrice, highPrice, volume);
    this.lows.push(lowPrice);
    this.prices.push(closePrice);
    this.highs.push(highPrice);
    this.volumes.push(volume);

    if (this.lows.length > this.size) {
      this.lows.splice(0, 1);
      this.prices.splice(0, 1);
      this.highs.splice(0, 1);
      this.volumes.splice(0, 1);
    }

    this.setMin();
    this.setMax();
  }

  /**
   * Calculate the min value from what's given.
   *
   * If this function is used once or more per candlestick,
   * consider incorporating it into the add() method to reduce
   * function-calling overhead.
   */
  setMin() {
    this.min = this.lows.reduce((carry, low) => {
      return Math.min(carry, low);
    });
  }

  // See min() comments above
  setMax() {
    this.max = this.highs.reduce((carry, high) => {
      return Math.max(carry, high);
    });
  }

  /**
   * See min() comments above.
   *
   * Calculates the variance over this window.
   * From the min to the max.
   *
   * @return {float} the difference between max and min
   */
  variance() {
    return this.max - this.min;
  }

  _variancePercentage() {
    return Math.round(((this.max - this.min) / this.max) * 100);
  }

  isDormant() {
    return this._variancePercentage() <= DORMANT_VARIANCE_THRESHOLD;
  }

  printIncoming(lowPrice, closePrice, highPrice, volume) {
    process.stdout.write('Incoming: ');
    process.stdout.write(chalk.red(lowPrice));
    process.stdout.write(' <= ');
    process.stdout.write(chalk.cyan(closePrice));
    process.stdout.write(' <= ');
    process.stdout.write(chalk.green(highPrice));
    process.stdout.write(' - ');
    console.log(chalk.white(`${volume} (volume)`));
  }

  /** Prints all values in the given window */
  print() {
    process.stdout.write(chalk.red(`lows: \t\t ${this.lows}\n`));
    process.stdout.write(chalk.cyan(`prices: \t ${this.prices}\n`));
    process.stdout.write(chalk.green(`highs: \t\t ${this.highs}\n`));
    process.stdout.write(chalk.white(`volume:  \t ${this.volumes}\n`));

    this.printVariance();
  }

  /**
      min/max:    1497.72827356625 / 2243.69323586362
      Variance:   746, 33% DORMANT
   */
  printVariance() {
    process.stdout.write(chalk.redBright(
      `min/max: \t ${Math.round(this.min)} / ${Math.round(this.max)}\n`));
    process.stdout.write(chalk.yellowBright(
      `Variance: \t ${this.variance()}, ${this._variancePercentage()}%`));
    if (this.isDormant()) {
      process.stdout.write(chalk.greenBright(' DORMANT '));
    }
    console.log();
  }
}// class