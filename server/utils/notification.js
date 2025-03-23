function notifyClients(wss, action, data) {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          action,
          data
        }));
      }
    });
  }
  
  module.exports = { notifyClients };
  