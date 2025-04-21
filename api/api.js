const express = require("express");
const morgan = require("morgan");
const parser = require("body-parser");
const session = require("express-session");
const dotenv = require('dotenv').config({ path: './config.env' });
const apiRoutes = require("./routes/apiRoutes");

var app = express();

app.use(parser.urlencoded({ extended: false }));
app.use(parser.json());
app.use(morgan("tiny"));

app.use(express.json());

app.use('/api', apiRoutes);

app.get("*", (req, res) => {
  res.status(404).send("<h1>Page not found!</h1>");
});

app.listen(process.env.API_PORT, (err) => {
  if (err) return console.log(err);
  console.log(`Express Web Server listening on http://localhost:${process.env.API_PORT}`);
});

