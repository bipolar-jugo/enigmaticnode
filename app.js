
var express = require('express');
var cookieParser = require('cookie-parser');
const compression = require('compression');
const http = require('http');
const DEBUG_PORT = process.env.PORT;
var path = require('path');
const app = express();

const moduleUtka = require('./routes/utkimmoServer')

// view engine setup


app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieParser());
app.use(compression());

app.use('/', moduleUtka);




// catch 404 and forward to error handler
app.use(function(req, res, next) {
  res.status(404).send();
});

// error handler
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send();
});



httpServer = http.createServer(app).listen(DEBUG_PORT, ()=>{
  console.log('- http server [ON] -');

});



module.exports = app;
