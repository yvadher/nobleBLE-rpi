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
var startScanning = function () {

    noble.on('stateChange', function(state) {
        if (state === 'poweredOn') {
            noble.startScanning(/*config.get('ble:UUID')*/[], false);
        }
    });
}

var stopScanning = function(){
    noble.stopScanning();
}

noble.on('scanStart', function(){
    console.log("BLE scanning... filter: " + config.get('ble:UUID'));

    setTimeout(function(){noble.stopScanning()}, 10 * 1000);
});

noble.on('scanStop', function(){
    console.log("BLE STOP scanning");
    
    setTimeout(function(){noble.startScanning(/*config.get('ble::UUID')*/[], false)}, 20 * 1000);
});


var sensors = new Map();

noble.on('discover', function(peripheral) {

    console.log('peripheral discovered (' + peripheral.id +
                ' with address <' + peripheral.address +  ', ' + peripheral.addressType + '>,' +
                ' connectable ' + peripheral.connectable + ',' +
                ' RSSI ' + peripheral.rssi + ':');
                
    console.log('\thello my local name is:');
    console.log('\t\t' + peripheral.advertisement.localName);
    console.log('\tcan I interest you in any of the following advertised services:');
    console.log('\t\t' + JSON.stringify(peripheral.advertisement.serviceUuids));

    var serviceData = peripheral.advertisement.serviceData;
                                                      
    if (serviceData && serviceData.length) {
        console.log('\there is my service data:');
        for (var i in serviceData) {
            console.log('\t\t' + JSON.stringify(serviceData[i].uuid) + ': ' + JSON.stringify(serviceData[i].data.toString('hex')));
        }
    }
                                                                                                    
    if (peripheral.advertisement.manufacturerData) {
        console.log('\there is my manufacturer data:');
        console.log('\t\t' + JSON.stringify(peripheral.advertisement.manufacturerData.toString('hex')));
    }
                                                                                        
    if (peripheral.advertisement.txPowerLevel !== undefined) {
        console.log('\tmy TX power level is:');
        console.log('\t\t' + peripheral.advertisement.txPowerLevel);
    }

     //once the current connection is established scan for charactritics and services=========================
     peripheral.once('connect',function(){
        console.log('connected to a sensor, Mac:' + peripheral.id);

        sensors.set(peripheral.id, { 'macAddress':peripheral.id,  'txPowerLevel': peripheral.rssi, 'services': [], 'characteristics': [], 'data': new Map(), 'disconnect':function(){peripheral.disconnect()} });


        //Avoid connection issue rigth after connecting to device.
        setTimeout( function(){
            if(peripheral.state == 'disconnected' ) {
				console.warn("discover services, but the peripheral %s is diconnected", peripheral.id);    
				return;
            } 
            
            peripheral.discoverAllServicesAndCharacteristics(function(error, services, characteristics){
                var sensor = sensors.get(peripheral.id);
                if (sensor){
                    sensor.services = services;
                    sensor.characteristics = characteristics;
                }else {
                    console.log("Sensor not in the list");
                }
            });

        },2000);

         //if we where disconnected from this device
        peripheral.once('disconnect',function(){
            console.log('disconnected from:' + peripheral.id );
            sensors.delete(peripheral.id);
        });//peripheral.disconnect

     });


});