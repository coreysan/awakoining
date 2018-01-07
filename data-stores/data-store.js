import colors from 'colors';

export class DataStore {

  constructor(symbols, interval, startTimestamp) {
    this.symbols = symbols;
    this.interval = interval;
    this.startTimestamp = startTimestamp;
    this.totalWritten = 0;
    this._setDestinationName();
    this._start();
  }

  _start() {
    // anything to set up?
  }

  // must implement this
  _setDestinationName() {
    throw new Error("Please implement _setDestinationName() ", this);
  }

  _getIntroText(){
    return `Writing ${this.interval} candlesticks to ` +
            `${this.destinationName} `.cyan;
  }

  _printIntro(isFirstRun){
    if (isFirstRun) {
      process.stdout.write(this._getIntroText());
    }
  }

  _printUpdate() {
    process.stdout.cursorTo(this._getIntroText().length);
    process.stdout.write(`${this.totalWritten}`);
  }

  _finishStorage() {
    console.log('. Done ' + `✓`.green);
    // console.log(`Wrote ${this.totalWritten} to ${this.destinationName}`.green);
    console.log();
  }
}