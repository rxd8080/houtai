var express = require('express');
var router = express.Router();
var async = require('async');
var ObjectId = require('mongodb').ObjectId
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://127.0.0.1:27017';
var multer=require('multer');
var upload = multer({dest:'c:/tmp'});
var fs = require('fs');
var path = require('path');

router.get('/', function (req, res) {
  var pager = Number(req.query.pager) || 1; //页码
  var pageSizer = Number(req.query.pageSizer) || 3 //每页数据的条数
  var totalSizer = 0; //总条数
  MongoClient.connect(url, {
    useNewUrlParser: true
  }, function (err, client) {
    if (err) {
      res.render('error', {
        message: '连接失败',
        error: err
      })
      return;
    }
    var db = client.db('prot');
    async.series([function (cb) {
      db.collection('brand').find().count(function(err,num){
        if(err){
          cb(err)
        }else{
          totalSizer = num;
          cb(null)
        }
      })
      },
      function (cb) {
        db.collection('brand').find().limit(pageSizer).skip(pager*pageSizer-pageSizer).toArray(function (arr,data) { 
          console.log(data)
          if(err){
            cb(err)
          }else{
            cb(null,data)
          }
         })
      }
    ], function (err, result) {
      if(err){
        res.render('error',{
          message:'错误',
          error:err
        })
      }else{
        res.render('next',{
          data:result[1],
          pager:pager,
          pageSizer:pageSizer,
          totapager:Math.ceil(totalSizer/pageSizer)
        })
      }
    })
    /* db.collection('brand').find().toArray(function (err, data) {
      if (err) {
        console.log('查询用户数据失败', err);
        res.render('error', {
          message: '查询失败',
          error: err
        })
      } else {
        console.log(data);
        res.render('next', {
          data: data
        })
      }
      client.close();
    }) */
  })
})


//新增品牌
router.post('/news', function (req, res) {
  var name = req.body.name;
  var logo = req.body.logo;
/*   var filename = 'images/' + new Date().getTime() + '_' +req.file.originalname;
  var newFileName = path.resolve(__dirname,'../public/',filename);
try{
  var data=
}catch(error){

} */







  MongoClient.connect(url, {
    useNewUrlParser: true
  }, function (err, client) {
    if (err) {
      res.render('error', {
        message: '连接失败',
        error: err
      })
      return;
    }
    var db = client.db('prot');
    async.series([
      function (cb) {
        db.collection('brand').find({
          name: name
        }).count(function (err, num) {
          if (err) {
            cb(err);
          } else if (num > 0) {
            cb(new Error('这个品牌已经添加过了'));
          } else {
            cb(null);
          }
        })
      },
      function (cb) {
        db.collection('brand').insertOne({
          logo: logo,
          name: name
        }, function (err) {
          if (err) {
            cb(err)
          } else {
            cb(null)
          }
        })
      }
    ], function (err, result) {
      if (err) {
        res.render('error', {
          message: '有错误',
          error: err
        })
      } else {
        res.redirect('/brands');
      }
      client.close();
    })
  })
})

module.exports = router;