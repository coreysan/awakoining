import moment from 'moment';

/**
 * interval:                  1m, 5m, 15m, 30m, 1h, 2h, 4h, 6h
 * intervalValue:             1, 5, 15, 30, 1, 2, 4, 6
 * intervalIdentifier:        minutes, hours, days, weeks, months
 * intervalIdentifierLetter:  m, h, d, w, M for minutes, hours, days, weeks, months
 * ms:                        the number of milliseconds per interval
 */
export class Interval {

  constructor(binanceNotation) {
    this.binanceNotation = binanceNotation;
    this.letter = this.binanceNotation.substring(this.binanceNotation.length-1);
    this.value = this.binanceNotation.replace(this.letter, '');
    this.units = this._momentInterval(this.letter);
    this.setIntervalMs();
  }

  /**
   * Set the number of milliseconds in an interval
   */
  setIntervalMs() {
    this.ms = moment.duration(parseInt(this.value), this.units)
                    .as('milliseconds');
    return this.ms;
  }

  /**
   * Translate the binance interval code to moment time range
   *
   * @param  {String} intervalType
   * @return {String} the 'moment' version of the time range. e.g. minute
   */
  _momentInterval() {
    const intervalTranslations = {
      m: 'minutes',
      h: 'hours',
      d: 'days',
      w: 'weeks',
      M: 'months',
    };
    return intervalTranslations[this.letter];
  }
}