const socket = new WebSocket('wss://ws.finnhub.io?token=cv6halpr01qi7f6qd0qgcv6halpr01qi7f6qd0r0');

// Connection opened -> Subscribe
socket.addEventListener('open', function (event) {
    console.log('WebSocket connected. Subscribing to AAPL...');
    socket.send(JSON.stringify({'type': 'subscribe', 'symbol': 'AAPL'}));
});

// Listen for messages
socket.addEventListener('message', function (event) {
    const message = JSON.parse(event.data);

    if (message.type === 'trade' && message.data) {
        console.log('Trade Data Received:');
        message.data.forEach((trade) => {
            console.log(`Symbol: ${trade.s}`);
            console.log(`Price: $${trade.p}`);
            console.log(`Volume: ${trade.v}`);
            console.log(`Timestamp: ${new Date(trade.t).toLocaleString()}`);
            console.log(`Conditions: ${trade.c.join(', ')}`);
            console.log('-------------------------');
        });
    } else {
        console.log('Other Message: ', message);
    }
});

// Unsubscribe
var unsubscribe = function(symbol) {
    console.log(`Unsubscribing from ${symbol}...`);
    socket.send(JSON.stringify({'type': 'unsubscribe', 'symbol': symbol}));
};
