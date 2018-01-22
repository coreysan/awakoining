import cli from 'cli'
import consoleTable from 'console.table';
import { Operator } from './operator/operator';
import cliOptions from './cli/cli-options';

const ACTION_ARG_INDEX = 0;

const options = cli.parse(cliOptions);

// console.log('cli: ', cli);
// console.log('options: ', options);

const action = cli.args[ACTION_ARG_INDEX];
// const symbols = options.symbols;

// console.log('action: ', action);
// console.log('symbols: ', symbols);
try {
  const operator = new Operator(options);
  operator[action]();
  // if exporting, this is analogous to: operator.export()
} catch (error) {
  console.log('error: ', error);
  console.log('cliOptions: ', cliOptions);
}

console.log();
