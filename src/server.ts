import dotenv from "dotenv";
import express from "express";
import { errorHandler } from "./middleware/errorHandle";
import routes from "./startup/routes";

dotenv.config();

const app = express();

console.log(process.env.NODE_ENV);

routes(app);
app.use(errorHandler);

export default app;
