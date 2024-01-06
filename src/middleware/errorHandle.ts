import log from "../startup/logs";

export const errorHandler = (err, req, res, next) => {
  log.error(err.message, err);
  if (err.isJoi) {
    return res.status(400).json({
      message: err.message,
    });
  }
  if (err.code) {
    switch (err.code) {
      case "P2002":
        return res.status(400).json({
          message: "Email already exists",
        });
      case "P2025":
        return res.status(404).json({
          message: "Record not found",
        });
      case "P2016":
        return res.status(400).json({
          message: "Invalid query",
        });
      default:
        return res.status(500).json({
          message: "Something went wrong",
        });
    }
  }
  if (err.name === "UnauthorizedError") {
    return res.status(401).json({
      message: "Invalid token",
    });
  }
};
