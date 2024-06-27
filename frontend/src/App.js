import React, { useState, useEffect } from 'react';
import './App.scss';

function App() {
  const [tradeDataFromServer, setTradeDataFromServer] = useState({});
  const [ws, setWs] = useState(null);
  const [connectionError, setConnectionError] = useState(false);
  const [ApiLimitError, setApiLimitError] = useState(false);

  useEffect(() => {
    console.log('Connecting to Backend...');
    initializeWebSocket();
  }, []);

  const initializeWebSocket = () => {
    const websocket = new WebSocket('ws://localhost:8080');
    //const websocket = new WebSocket('wss://upwork-backend.onrender.com');

    setWs(websocket);

    websocket.onopen = () => {
      console.log('Connected to Backend...');
      setConnectionError(false);
    };

    websocket.onmessage = (event) => {
      const tradeData = JSON.parse(event.data);
      console.log('tradeData ', tradeData);
      if (tradeData.message === 'Too many open orders') {
        setApiLimitError(true);
        console.log("You need to wait until the API limit is reset");
      }
      else {
        console.log("Replicating Master Trade");
        setTradeDataFromServer(tradeData);
        console.log("Succefully Replicating Master Trade");
        console.log('Displaying Trade Details');
      }
    };

    websocket.onclose = () => {
      console.error('Backend is disconnected. Attempting to reconnect...');
      setConnectionError(true); // Set connection error state
      setTimeout(initializeWebSocket, 3000);
    };

    return () => {
      websocket.close();
    };
  };

  const handleTrade = () => {
    console.log('Get Master Trade...');
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send("trade");
    }
  };

  const renderTradeData = () => {
    return (
      <div className="table-container">
        <h2 className='trade-label'>Your Trade Order</h2>
        <table>
          <tbody>
            {Object.keys(tradeDataFromServer).map(key => (
              key !== "ex" && (
                <tr key={key}>
                  <td>{key}</td>
                  <td>{tradeDataFromServer[key]}</td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      {ApiLimitError && (
        <h2 className='error'>ERROR: TOO_MANY_ORDERS at mtrestapi.Trading.OrderSend</h2>
      )}
      {connectionError && (
        <h2 className='error'>Connection is Disconnected. Attempting to reconnect...</h2>
      )}
      <div>
        {tradeDataFromServer.ticket && renderTradeData()}
      </div>
      <button onClick={handleTrade} className="trade-button">Trade</button>
    </div>
  );
}

export default App;
