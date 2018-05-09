var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const fileUpload = require('express-fileupload');


var indexRouter = require('./routes/index');
var statRouter = require('./routes/stat');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload()); 


app.use('/', indexRouter);
app.use('/stat', statRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

const db_things = require("./config.json").db_settings;
const MongoClient = require("mongodb").MongoClient;

// Connection URL
let url = db_things.ip;
let AUTHer = "";

if (db_things["auth?"]) {
  AUTHer = db_things.username + ":" + db_things.pass + "@";
}

url = db_things.protocol + AUTHer + url;

// Database Name
const dbName = "omct";
let db;

// get the database onject to interact with so we dont need to connect with every request
MongoClient.connect(url, function (err, client) {
  if (err) {
    console.log(err)
  } else {
    db = client.db(dbName);
    console.log("connected to server at " + db_things.ip);
  }
});

global.db = db

module.exports = app;
