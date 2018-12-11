var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');


var connection = require('./connection');
var socketserver = require('http').createServer();
var io = require('socket.io')(socketserver);
var socketClientsArray = [];
connection.init();


var indexRouter = require('./routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
// add static resources
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname + '/node_modules/bootstrap/dist'));

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


// check to see if a connected token is a know user, if so emit an update that headline has been updated
this.emitNoteHeadlineEvent = function () {
  connection.acquire(function (err, con) {
    // query to see the tokens associated with users
    con.query('SELECT DISTINCT token FROM users', function (err, rows, fields) {
      var headlineTokensArray = [];
      var connectedTokensArray = [];
      var connectedSocketsArray = [];

      rows.forEach(function (value) {
        // put query tokens into an array to compare with connected tokens
        headlineTokensArray.push(value.token);
      })
      con.release(); // release database connection while we iterate through the arrays

      socketClientsArray.forEach(function (value) {
        connectedSocketsArray.push(value.socketid);
        connectedTokensArray.push(value.token);
      });

      // compare database tokens to the tokens from the socket
      let connectionsToReceiveArray = connectedTokensArray.filter((n) => headlineTokensArray.includes(n))

      connectionsToReceiveArray.forEach(function (value) {
        socketClientsArray.forEach(function (socket_value) {
          //if tokens match, loop through the connection objects to get the socketID
          if (value == socket_value.token) {
            // check this is a connected socketID
            if (io.sockets.connected[socket_value.socketid]) {
              // if checks out that this is a connected socket emit the event to socketID
              io.sockets.connected[socket_value.socketid].emit('headlines_updated');
            }

            // print to console current socket being emitted to
            console.log(socket_value.socketid);
          }
        })
      });
    })
  });
};

// event called on Socket.IO connection
io.on('connect', function (client) {
  // incoming parameters
  var clientID = client.id;
  var token = client.handshake.query.token;
  console.log("connected: " + client.id); // print to console the incoming socket ID

  // remove any existing socket connections from array that are
  // different than the incoming token
  for (var i = 0; i < socketClientsArray.length; i++) {
    if (socketClientsArray[i].token == token) {
      if (i > -1) {
        socketClientsArray.splice(i, 1);
      }
    }
  }

  // create an object with the socketID and the token that's associated with
  var clientConnection = {};
  clientConnection.socketid = clientID;
  clientConnection.token = token;
  socketClientsArray.push(clientConnection);
});

socketserver.listen(8080); // Socket.IO, port 8080


module.exports = app;
