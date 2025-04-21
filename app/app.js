require('dotenv').config({ path: './config.env' });
const express = require('express');
const morgan = require('morgan');
const session = require('express-session');
const csrf = require('csurf');
const parser = require('body-parser');
const cookieParser = require('cookie-parser');
const htmlRoutes = require('./routes/htmlRoutes');

const app = express();

app.use(express.static(__dirname + '/public')); // Serve static files from the public folder
app.set("views", __dirname + "/views"); // Set the views directory
app.set("view engine", "ejs"); // Set the view engine
app.use(parser.urlencoded({ extended: false })); 
app.use(parser.json()); 
app.use(morgan("tiny")); 

app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {httpOnly: true, maxAge: 3600000}
}));

const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use(express.json()); // Parse JSON data

app.use('/', htmlRoutes); // html Router usage

app.use((err, req, res, next) => {
  if (err.code !== 'EBADCSRFTOKEN') return next(err);
  res.status(403).send('You are not authorized to perform this action');
});

app.get("*", (req, res) => { 
  res.status(404).send("<h1>Page not found!</h1>");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, (err) => { 
  if (err) return console.log(err);
  console.log(`Express Web Server listening on http://localhost:${PORT}`);
});