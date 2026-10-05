import WebSocket from "ws";

const ws = new WebSocket("ws://localhost:8080");

ws.on("open", () => {
  console.log("Connected to Voice Gateway");

  // Send a test signal message
  ws.send(JSON.stringify({
    type: "signal",
    payload: { hello: "world" }
  }));
});

ws.on("message", (msg) => {
  console.log("Received from gateway:", msg.toString());
});

ws.on("close", () => {
  console.log("Connection closed");
});
