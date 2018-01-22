import blessed from 'blessed';
import contrib from 'blessed-contrib';

import { Table } from './table';
import { Log } from './log';

export class Gui {

  constructor() {

    this.screen = blessed.screen()

    this.screen.key(['escape', 'q', 'C-c'], function(ch, key) {
      return process.exit(0);
    });

    //create layout and widgets
    this.grid = new contrib.grid({
      rows: 12,
      cols: 12,
      screen: this.screen,
    });

    this.table = new Table(this.grid);
    this.log = new Log(this.grid);

    this.screen.on('resize', function() {
      this.table.element.emit('attach');
      this.log.element.emit('attach');
    });

    this.screen.render()
  }
}
