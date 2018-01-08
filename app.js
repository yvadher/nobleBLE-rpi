var noble = require('noble');

require('log-timestamp')(function() { return '[' + new Date() + '] %s' });

//getting the serial number on start and set it as device id for cloud
try{
    var serialNumber = fs.readFileSync('/proc/cpuinfo','utf8').match(/Serial\t\t: .{16}/)[0].replace("Serial\t\t: ", "").replace(/^0+/, '');
    
    console.log( serialNumber );
} catch (e){
    console.log("Error while reading the serial number");
    // set the ID to a predefined value to catch this error 
}

noble.on('stateChange', function(state) {
    if (state === 'poweredOn') {
      noble.startScanning();
    } else {
      noble.stopScanning();
    }
  });

noble.on('discover', function(peripheral) {
    console.log('Found device with local name: ' + peripheral.advertisement.localName);
    console.log('advertising the following service uuid\'s: ' + peripheral.advertisement.serviceUuids);
    console.log();
});