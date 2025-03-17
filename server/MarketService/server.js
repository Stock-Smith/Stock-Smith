var WebSocket = require('ws');
var ws = new WebSocket('wss://api.tiingo.com/iex');

var subscribe = {
    'eventName':'subscribe',
    'authorization':'a918f74b7b42370e13e0204ac38785a07d80a6d4',
    'eventData': {
        'thresholdLevel': 6,
        'tickers': ['aapl']
    }
}
ws.on('open', function open() {
    ws.send(JSON.stringify(subscribe));
});

ws.on('message', function(data, flags) {
    console.log(JSON.parse(data.toString()));
});