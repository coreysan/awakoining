import contrib from 'blessed-contrib';

export class Log {

  constructor(grid) {
    this.element = grid.set(0, 9, 6, 3, contrib.log, {
      fg: "green",
      selectedFg: "green",
      label: 'Server Log',
    });

    //dummy data
    var servers = ['US1', 'US2', 'EU1', 'AU1', 'AS1', 'JP1'];
    var commands = ['grep', 'node', 'java', 'timer', '~/ls -l', 'netns', 'watchdog', 'gulp', 'tar -xvf', 'awk', 'npm install'];

    //set log dummy data
    setInterval(() => {
       var rnd = Math.round(Math.random()*2)
       if (rnd==0) this.element.log('starting process ' + commands[Math.round(Math.random()*(commands.length-1))])
       else if (rnd==1) this.element.log('terminating server ' + servers[Math.round(Math.random()*(servers.length-1))])
       else if (rnd==2) this.element.log('avg. wait time ' + Math.random().toFixed(2))
       // this.screen.render()
    }, 500)
  }

  // todo cs: functions for adding to the log

} // class