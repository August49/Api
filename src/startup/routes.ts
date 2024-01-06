import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { stream } from "./logs";
import { auth } from "../auth";
import productRouter from "../handlers/products";
import router from "../routes/user";
import webauthnRouter from "../routes/webAuthn";

export default (app: express.Application) => {
  app.use(morgan("combined", { stream }));
  app.use(
    cors({
      origin: ["http://localhost:3000", "http://192.168.1.*:*"],
      credentials: true,
    })
  );
  app.use(helmet.frameguard({ action: "deny" }));

  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "https://apis.google.com",
          "https://github.com",
          "'unsafe-inline'",
          "http://localhost:*",
        ],
        imgSrc: [
          "'self'",
          "https://avatars.githubusercontent.com",
          "data:",
          "http://localhost:*",
          "https://*.amazonaws.com",
          "https://*.cloudinary.com",
        ],
        connectSrc: ["'self'", "http://localhost:*"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        objectSrc: ["'none'"],
        fontSrc: ["'self'", "data:"],
        upgradeInsecureRequests: [],
        formAction: ["'self'", "https://www.google.com", "http://localhost:*"],
        childSrc: ["'self'", "http://localhost:*"],
        sandbox: ["allow-forms", "allow-scripts"],
        frameAncestors: ["'none'"],
      },
    })
  );
  app.use(cookieParser());

  // log all requests
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/", (req, res) => {
    res.send("Hello World!");
  });

  app.use("/api/products", auth, productRouter);
  app.use("/api/users", router);
  app.post("/test/login", (req, res) => {
    res.json({ message: "login successful" });
  });
  app.use("/api/webauthn", webauthnRouter);
};
