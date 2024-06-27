import React, { useState, useEffect } from 'react';
import './App.scss'; // Import SCSS file

function App() {
  const [tradeDataFromServer, setTradeDataFromServer] = useState({});
  const [ws, setWs] = useState(null);
  const [connectionError, setConnectionError] = useState(false); // State to track connection error

  useEffect(() => {
    console.log('Connecting to Backend...');
    initializeWebSocket();
  }, []);

  const initializeWebSocket = () => {
    const websocket = new WebSocket('ws://localhost:8080');
    // const websocket = new WebSocket('wss://upwork-backend-1.onrender.com');

    setWs(websocket);

    websocket.onopen = () => {
      console.log('Connected to Backend...');
      setConnectionError(false); // Reset connection error state on successful connection
    };

    websocket.onmessage = (event) => {
      const tradeData = JSON.parse(event.data);
      console.log("Replicating Master Trade");
      setTradeDataFromServer(tradeData);
      console.log("Succefully Replicating Master Trade");
      console.log('Displaying Trade Details');
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
