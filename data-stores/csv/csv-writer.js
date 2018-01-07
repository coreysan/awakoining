import fs from 'fs';
import colors from 'colors';
import json2csv from 'json2csv';

import { DataStore } from '../data-store';

const BASE_FILE_PATH = 'data-stores/csv/exports';

export class CsvWriter extends DataStore {

  /**
   * Write the file to clear it.
   */
  _start() {
    fs.writeFileSync(this.destinationName, '');
  }

  /**
   * Set the destination to be the actual filename
   */
  _setDestinationName() {
    this.destinationName = `${BASE_FILE_PATH}/${this.symbols}-${this.interval}-${this.startTimestamp}.csv`;
  }

  /**
   * Append the data to the CSV file
   *
   * @param  {Array}  data - candlestick objects
   * @param  {Boolean} hasCSVColumnTitle - if true, write headers
   * @return nothing
   */
  add(data, isFirstRun) {

    var csv = json2csv({
      data: data,
      hasCSVColumnTitle: isFirstRun,
    });

    this._printIntro(isFirstRun);
    fs.appendFileSync(this.destinationName, csv);
    this.totalWritten += data.length;
    this._printUpdate();
  }
}
