const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });
console.log('New server started on port ', 8080);

// Variables
const Trade_API = 'https://pdzsl5xw2kwfmvauo5g77wok3q0yffpl.lambda-url.us-east-2.on.aws/';
const Connection_API = "https://mt4.mtapi.io/Connect?user=4639834&password=gHrJPmeiJ!Dr29U&host=192.149.49.139&port=443";
let Submit_Trade_API;
let Slave_ID;

// Connection
wss.on('connection', function connection(ws) {
    console.log('New client connected');

    ws.on('message', function incoming(message) {

        if (message == "trade") {
            fetch(Trade_API)
                .then(response => response.json())
                .then(async data => {
                    let tradeData = data;
                    await makeTrade(tradeData, ws);  // make trade
                })
                .catch(error => {
                    console.error('Error fetching data:', error);
                    ws.send(JSON.stringify({ error: 'Error fetching data' }));
                });
        }
    });

    ws.on('close', function () {
        console.log('Client disconnected');
    });
});

// Login function to get Client ID
const login = async () => {
    try {
        const response = await fetch(Connection_API);
        const data = await response.text();
        console.log("data: ", data);
        Slave_ID = data;
        console.log('Client Id is:', Slave_ID);
    } catch (error) {
        console.error('Error logging in:', error);

    }
};

// Make trade function
const makeTrade = async (tradeData, ws) => {
    console.log('Attempting to make trade');
    if (!Slave_ID) {
        await login();
    }

    let parameters = "";
    for (let key of Object.keys(tradeData)) {
        parameters += String(key) + "=" + String(tradeData[key]) + "&"
    }

    Submit_Trade_API = `https://mt4.mtapi.io/OrderSend?id=${Slave_ID}&${parameters}`;
    try {
        const response = await fetch(Submit_Trade_API);
        const data = await response.json();

        if(data.code === "INVALID_TOKEN"){
            // if token is expired, re-login and retry trade
            console.log("Token expired, re-login and retry trade");
            await login();
            await makeTrade(tradeData, ws);
        }
        else{
            ws.send(JSON.stringify(data));  // Send data to frontend
        }

    } catch (error) {
        console.error('Error making trade:', error);
    }

};
