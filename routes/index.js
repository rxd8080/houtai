var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});
router.get('/hot', function(req, res, next) {
  res.render('hot');
});
router.get('/next', function(req, res, next) {
  res.render('next');
});
router.get('/login', function(req, res, next) {
  res.render('login');
});
router.get('/register', function(req, res) {
  res.render('register');
});
module.exports = router;
