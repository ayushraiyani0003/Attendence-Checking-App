import React, { createContext, useState, useEffect } from "react";
const API_URL = process.env.REACT_APP_WS_URL;
// Create WebSocket Context
export const WebSocketContext = createContext();

const WebSocketProvider = ({ children }) => {
  const [ws, setWs] = useState(null);

  useEffect(() => {
    const webSocket = new WebSocket(`ws://${API_URL}`); // Make sure this is correct URL
    setWs(webSocket);

    // Handle WebSocket open event
    webSocket.onopen = () => {
      // console.log("WebSocket connection established.");
    };

    // Handle WebSocket message event
    webSocket.onmessage = (message) => {
      // console.log("Received WebSocket message:", message);
    };

    // Handle WebSocket error event
    webSocket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    // Handle WebSocket close event
    webSocket.onclose = () => {
      // console.log("WebSocket connection closed.");
    };

    // Cleanup WebSocket connection on component unmount
    return () => {
      if (webSocket) {
        webSocket.close();
      }
    };
  }, []);

  const send = (message) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    } else {
      console.error("WebSocket is not open");
    }
  };

  return (
    <WebSocketContext.Provider value={{ ws, send }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketProvider;
