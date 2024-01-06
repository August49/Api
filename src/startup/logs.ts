import winston from "winston";

const logger = () => {
  const logFormat =
    process.env.NODE_ENV === "production"
      ? winston.format.json()
      : winston.format.simple();

  const log = winston.createLogger({
    transports: [
      new winston.transports.File({
        filename: "combined.log",
        level: "info",
        format: logFormat,
      }),
      new winston.transports.File({
        filename: "errors.log",
        level: "error",
        format: logFormat,
      }),
    ],

    exceptionHandlers: [
      new winston.transports.File({ filename: "exceptions.log" }),
    ],

    rejectionHandlers: [
      new winston.transports.File({ filename: "rejections.log" }),
    ],
  });

  if (process.env.NODE_ENV !== "production") {
    log.add(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      })
    );
  }

  return log;
};

const log = logger();

export const stream = {
  write: (message: string) => log.info(message.trim()),
};

export default log;
