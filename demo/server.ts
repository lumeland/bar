const sockets = new Set<WebSocket>();

const router: Record<string, [string, string]> = {
  "/": ["demo/index.html", "text/html"],
  "/data.json": ["demo/data.json", "application/json"],
  "/lume-bar.js": ["lume-bar.js", "text/javascript"],
  "/styles.css": ["styles.css", "text/css"],
  "/favicon.ico": ["demo/favicon.ico", "image/vnd.microsoft.icon"],
};

export default {
  fetch(request: Request): Response {
    // Is a websocket
    if (request.headers.get("upgrade") === "websocket") {
      console.log("WebSocket connection established");
      const { socket, response } = Deno.upgradeWebSocket(request);
      socket.onopen = () => sockets.add(socket);
      socket.onmessage = (event) => {
        console.log("WebSocket message received:", event.data);
        sockets.forEach((s) => {
          if (s.readyState === WebSocket.OPEN) {
            s.send(JSON.stringify({ action: "reload" }));
          }
        });
      };
      return response;
    }

    const { pathname } = new URL(request.url);
    const route = router[pathname];
    if (!route) {
      return new Response("Not found", {
        status: 404,
      });
    }

    const [file, contentType] = route;
    return new Response(Deno.readFileSync(file), {
      headers: { "content-type": contentType },
    });
  },
};
