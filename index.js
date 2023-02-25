const dotenv=require("dotenv");
dotenv.config();
const express = require('express');
const bodyParser = require('body-parser');
const database = require ("./database");
const movieRouter = require("./routers/movie");

const app = express();
app.use(bodyParser.json({ type: 'application/json' }));

 


function errorHandler(error, req, res, next) {
  res.header("Content-Type", "application/json");
  console.log("Error occered:", error.message);
  res.status(500).send(error.message);

}

app.use("/movie", movieRouter);

app.use(errorHandler);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`On port ${port}`);
  console.log(`Example app listening on port ${port}`)
});