import cli from 'cli'
import { BinanceApi } from './binance-api/binance-api';
import cliOptions from './cli/cli-options';

const ACTION_ARG_INDEX = 0;

const options = cli.parse(cliOptions);

// console.log('cli: ', cli);
// console.log('options: ', options);

const action = cli.args[ACTION_ARG_INDEX];
// const symbols = options.symbols;

// console.log('action: ', action);
// console.log('symbols: ', symbols);
//
try {
  const binanceApi = new BinanceApi(options);
  binanceApi[action]();
  // if exporting, this is analogous to: binanceApi.export()
} catch (error) {
  console.log('error: ', error);
  console.log('cliOptions: ', cliOptions);
}

console.log();
