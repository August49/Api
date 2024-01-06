import express from "express";

const productRouter = express.Router();

productRouter.get("/", (req, res) => {
  res.send("get products");
});

export default productRouter;
