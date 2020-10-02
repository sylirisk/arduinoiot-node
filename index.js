require('dotenv').config(); //This imports your SECRETs from .env file
var rp = require('request-promise');

var ArduinoIotClient = require('@arduino/arduino-iot-client');
var client = ArduinoIotClient.ApiClient.instance;
var api = new ArduinoIotClient.PropertiesV2Api()

var thingID = process.env.THING_ID;

async function getToken() {
    var options = {
        method: 'POST',
        url: 'https://api2.arduino.cc/iot/v1/clients/token',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        json: true,
        form: {
            grant_type: 'client_credentials',
            client_id: process.env.CLIENT_ID,   // This is loaded from the .env file in the same directory
            client_secret: process.env.CLIENT_SECRET,   // This is loaded from the .env file in the same directory
            audience: 'https://api2.arduino.cc/iot'
        }
    };

    try {
        const response = await rp(options);
        return response['access_token'];
    }

    catch (error) {
        console.error("Failed getting an access token: " + error)
    }
}

async function getPropertyValue() {

    var opts = {
        'showDeleted': true // {Boolean} If true, shows the soft deleted properties
    };

    try {
        var data = await api.propertiesV2List(thingID, opts);        
        return data[0].last_value; // Returns the last_value of the first property
    } catch(err) {
        console.log('Error in getting data!');
        return 'error';
    }
}

async function poll(fn, fnCondition, ms) {
    let result = await fn();
    while (fnCondition(result)) {
        await wait(ms);
        result = await fn();
    }
    return result;
}
  
function wait(ms = 1000) {
    return new Promise(resolve => {
        // console.log(`waiting ${ms} ms...`);
        setTimeout(resolve, ms);
    });
}

async function run() {

    // Configure OAuth2 access token for authorization: oauth2
    var oauth2 = client.authentications['oauth2'];
    oauth2.accessToken = await getToken();

    var fnCondition = function (value) {
        console.log('Value: ' + value);
        if (value != 0) {  // This test will terminate/or continue polling
                            // Code to be changed, if we work with multiple thing properties
            return true;
        } else return false;    
    }
    
    await poll(getPropertyValue, fnCondition, 1000);
}

run();