var express = require('express');
var router = express.Router();
var connection = require('../connection');
var fns = require('../app');
connection.init();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', {title: 'Express'});
});


// GET call to retrieve the headlines associated with the user
router.get('/headlines', function (request, response) {
  connection.acquire(function (err, con) {
    con.query('SELECT headline from headlines JOIN users ON headlines.userID = users.userID where users.userID = (SELECT userID FROM users where token = ?)', [request.query.token], function (err, rows, fields) {
      response.send({headlines: rows});
      con.release();
    })
  });
});


// POST call to add a new headline
router.post('/', function (request, response) {
  connection.acquire(function (err, con) {
    con.query('INSERT INTO headlines VALUES (null,?,?)', [request.body.userID, request.body.headline], function (err, rows, fields) {
      response.render('index', {title: 'Express', message: 'Done' });
      con.release();
      fns.emitNoteHeadlineEvent();
    })
  });
});


module.exports = router;