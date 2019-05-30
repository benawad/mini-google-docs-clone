const app = require("express")();
const http = require("http").Server(app);
const io = require("socket.io")(http);

let value = {
  document: {
    nodes: [
      {
        object: "block",
        type: "paragraph",
        nodes: [
          {
            object: "text",
            text: "A line of text in a paragraph."
          }
        ]
      }
    ]
  }
};

io.on("connection", function(socket) {
  socket.on("send-value", () => {
    io.emit("init-value", value);
  });
  socket.on("new-operations", function(data) {
    value = data.value;
    io.emit("new-remote-operations", data);
  });
});

http.listen(4000, function() {
  console.log("listening on *:4000");
});
