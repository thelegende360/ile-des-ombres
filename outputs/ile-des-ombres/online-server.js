const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || process.argv[2] || 4174);
const ROOT = __dirname;
const rooms = new Map();
const ROOM_TTL_MS = 1000 * 60 * 60 * 8;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".png": "image/png"
};

function sendJson(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
  });
  response.end(JSON.stringify(body));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", chunk => {
      body += chunk;
      if (body.length > 4_000_000) {
        request.destroy();
        reject(new Error("Payload trop grand"));
      }
    });
    request.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

function roomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let index = 0; index < 5; index++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return rooms.has(code) ? roomCode() : code;
}

function cleanupRooms() {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (now - room.updatedAt > ROOM_TTL_MS) rooms.delete(code);
  }
}

function serveFile(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const safePath = path.normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
  const requested = safePath === path.sep || safePath === "/" ? "index.html" : safePath.replace(/^[/\\]/, "");
  const filePath = path.join(ROOT, requested);
  if (!filePath.startsWith(ROOT)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }
  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    response.writeHead(200, { "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream" });
    response.end(content);
  });
}

async function handleApi(request, response) {
  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  const url = new URL(request.url, `http://${request.headers.host}`);
  const parts = url.pathname.split("/").filter(Boolean);

  if (request.method === "GET" && url.pathname === "/healthz") {
    sendJson(response, 200, { ok: true, rooms: rooms.size });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/rooms") {
    cleanupRooms();
    const code = roomCode();
    rooms.set(code, { code, version: 0, state: null, updatedBy: null, updatedAt: Date.now() });
    sendJson(response, 200, { code });
    return;
  }

  if (parts[0] === "api" && parts[1] === "rooms" && parts[2]) {
    const code = parts[2].toUpperCase();
    const room = rooms.get(code);
    if (!room) {
      sendJson(response, 404, { error: "Salon introuvable" });
      return;
    }

    if (request.method === "GET" && parts.length === 3) {
      sendJson(response, 200, room);
      return;
    }

    if (request.method === "POST" && parts[3] === "state") {
      try {
        const body = await readJson(request);
        if (!body.state) {
          sendJson(response, 400, { error: "Etat manquant" });
          return;
        }
        room.state = body.state;
        room.version += 1;
        room.updatedBy = body.clientId || null;
        room.updatedAt = Date.now();
        sendJson(response, 200, { code, version: room.version });
      } catch (error) {
        sendJson(response, 400, { error: "JSON invalide" });
      }
      return;
    }
  }

  sendJson(response, 404, { error: "Route introuvable" });
}

const server = http.createServer((request, response) => {
  if (request.url.startsWith("/api/") || request.url === "/healthz") {
    handleApi(request, response);
    return;
  }
  serveFile(request, response);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Ile des Ombres en ligne sur le port ${PORT}`);
});
