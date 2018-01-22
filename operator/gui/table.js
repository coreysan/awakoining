import contrib from 'blessed-contrib';

export class Table {

  constructor(grid) {
    this.element = grid.set(6, 0, 6, 12, contrib.table, {
      keys: true,
      fg: 'green',
      label: 'Watched Cryptos',
      columnSpacing: 1,
      columnWidth: [10, 12, 15],
    });

    //set dummy data for table
    var generateTable = () => {
      this.element.setData({
        headers: ['Symbol', 'Interval', 'Status'],
        data: [
          ['NEO', '1m', 'Fluctuating'],
          ['NEO', '15m', 'Fluctuating'],
          ['NEO', '30m', 'Dormant'],
        ]
      });
    } // generateTable

    generateTable()
    this.element.focus();
    setInterval(generateTable, 3000);
  }

  // todo cs: keep track of data in the table, allow ammendments, additions, etc.
  //

} // class