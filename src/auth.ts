import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Tokens from "csrf";
import { User } from "@prisma/client";
import log from "./startup/logs";

const secret = process.env.JWT_SECRET;

const tokens = new Tokens();

export const createCsrfTokenCookie = (res) => {
  const csrfToken = tokens.create(secret);
  res.cookie("XSRF-TOKEN", csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "strict",
  });
  return csrfToken;
};

export const crsfAuth = (req, res, next) => {
  const token = req.cookies["XSRF-TOKEN"];
  const header = req.headers["x-xsrf-token"];

  if (!token) return res.status(401).json({ message: "no token" });

  if (token !== header)
    return res.status(401).json({ message: "invalid token" });

  next();
};

process.on("uncaughtException", (err) => {
  console.error("There was an uncaught error", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

export const createToken = (user: User, rememberMe: boolean = false) => {
  const token = jwt.sign(
    { id: user.id, name: user.email, webAuthToken: user.webAuthenToken },
    secret,
    {
      expiresIn: rememberMe ? "7d" : "1d",
    }
  );

  return token;
};

export const authCookie = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) return res.status(401).send("Access denied. No token provided.");

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      log.error(err);
      return res.status(401).send("Invalid token.");
    }

    req.user = decoded;
    next();
  });
};

export const auth = (req, res, next) => {
  const token = req.header("Authorization").replace("Bearer ", "");

  if (!token) {
    return res
      .status(401)
      .json({ message: "Authentication failed: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Authentication failed: Invalid token" });
  }
};

export const comparePassword = (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

export const hashPassword = (password) => {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hash(password, salt);
};
