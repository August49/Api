import log from "../startup/logs";

export const Unhandled = () => {
  /*============== UNCAUGHT EXCEPTIONS =================== */
  process.on("uncaughtException", (ex) => {
    console.log("WE GOT AN UNCAUGHT EXCEPTION");
    log.error((ex as Error).message, ex);
    process.exit(1);
  });

  /*============== UNHANDLED REJECTIONS =================== */
  process.on("unhandledRejection", (ex) => {
    console.log("WE GOT AN UNHANDLED REJECTION");
    log.error((ex as Error).message, ex);
    process.exit(1);
  });
};
