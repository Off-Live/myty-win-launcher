const Net = require("net");
const EventEmitter = require("events").EventEmitter;
const PORT = 40389;
const HOST = "0.0.0.0";

class MytyClient extends EventEmitter {
  constructor() {
    super();
    this.socket = new Net.Socket();
    this.address = HOST;
    this.port = PORT;
    this.connected = false;
    this.init();
  }
  init() {
    var client = this;

    client.socket.connect(client.port, client.address, () => {
      this.connected = true;
      this.emit("connected");
    });

    client.socket.on("data", (data) => {
      const command = JSON.parse(data.toString());
      if (
        command.cmd === undefined ||
        command.cmd === null ||
        command.cmd === ""
      )
        return;

      this.emit("command", command);
    });

    client.socket.on("close", () => {
      this.emit("close");
    });

    client.socket.on("error", (err) => {
      if (this.connected === false) {
        this.emit("connection-fail");
      } else {
        this.emit("error", err);
      }
    });
  }

  connect() {
    this.socket.connect(this.port, this.address, () => {
      this.connected = true;
      this.emit("connected");
    });
  }

  linkWalletAddress(walletAddress) {
    if (this.connected === false) return;
    this.socket.write(
      JSON.stringify({ cmd: "linkWalletAddress", walletAddress }) + "\r\n"
    );
  }

  close() {
    this.socket.end();
  }
}

module.exports = MytyClient;
