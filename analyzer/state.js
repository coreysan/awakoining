/**
 * The analyzer may be in one of X states:
 *
 *  0. Oscillating
 *  1. Dormant
 *  2. Profiting
 *
 *  From oscillating, the candlestick goes to dormant when the last
 *  X intervals are within the variance threshold.
 *
 *  From Dormant, the symbols either go to:
 *    - Oscillating, when the dormant period breaks out the bottom
 *    - Profiting, when the dormant period breaks out the top.
 *
 *  Once profiting, the analyzer snaps back to oscillating once the
 *  stock is sold.
 *
 * See README for more info on the algorithm and states
 */
const OSCILLATING_STATE = 'oscillating';
const DORMANT_STATE     = 'dormant';
const PROFITING_STATE   = 'profiting';

export class State {

  constructor () {
    this.state = OSCILLATING_STATE;
  }

  get() {
    return this.state;
  }

  isOscillating() {
    return this.state === OSCILLATING_STATE;
  }

  isDormant() {
    return this.state === DORMANT_STATE;
  }

  isProfiting() {
    return this.state === PROFITING_STATE;
  }
}