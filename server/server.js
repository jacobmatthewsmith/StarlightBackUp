// Entry point: node starlight/server/server.js [--port 8100]
import { createApp } from "./app.js";

const portArg = process.argv.indexOf("--port");
const port = Number(portArg > -1 ? process.argv[portArg + 1] : process.env.PORT || 8100);
const { server } = createApp({ secureCookies: process.env.NODE_ENV === "production" });
server.listen(port, () => console.log(`starlight running at http://localhost:${port}`));
