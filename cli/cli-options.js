
/**
 *  The options for `cli` to interpret
 *
 * Array description:
 * option: [flag, description, type, long-flag]
 *
 */
module.exports = {

  symbols: [ 's', 'The symbol pair to process. e.g. ETHBTC', 'string', false],

  /**
   * The candlestick interval.
   * In minutes, hours, days, weeks or months
   */
  interval: [
    'i',
    `The candlestick interval. One of:
      1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, or 1M`,
    'string',
    '1m'
  ],
  /**
   * The beginning range to export from, given in PST timezone.
   *
   * The end range is always the current time.
   */
  begin: [
    'b',
    `The beginning time of analysis, in PST: 2017-01-31 14:10:55`,
    'string',
    ''
  ]
}
