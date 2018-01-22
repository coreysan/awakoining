import cli from 'cli';
import consoleTable from 'console.table';
import { Operator } from './operator/operator';
import cliOptions from './cli/cli-options';

const ACTION_ARG_INDEX = 0;

const options = cli.parse(cliOptions);

console.log();

const action = cli.args[ACTION_ARG_INDEX];

try {
  const operator = new Operator(options);
  operator[action]();
  // if exporting, this is analogous to: operator.export()
} catch (error) {
  console.log('error: ', error);
  console.log('cliOptions: ', cliOptions);
}

