import config from "./config";
import app from "./server";

const PORT = process.env.PORT || 3000;
const URL = process.env.LAN_URL || "localhost";

app.listen(config.port, URL, () => {
  console.log(`⚡️[server]: Server is running at https://${URL}:${PORT}`);
});
