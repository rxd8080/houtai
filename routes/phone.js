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


router.get('/',function(req,res){
  var pages = Number(req.query.pages) || 1; //页码
  var pageSizes = Number(req.query.pageSizes) || 3 //每页数据的条数
  var totalSizes = 0; //总条数
    MongoClient.connect(url,{useNewUrlParser:true},function(err,client){
      if (err) {
        console.log('连接数据库失败', err);
        res.render('error', {
          message: '连接数据库失败',
          error: err
        })
        return;
      }
      var db = client.db('prot');
       async.series([
        function(cb){
          db.collection('phone').find().count(function(err,num){
            if(err){
              cb(err)
            }else{
              totalSizes = num;
              cb(null);
            }
          })
        },
        function(cb){
          db.collection('phone').find().limit(pageSizes).skip(pages * pageSizes - pageSizes).toArray(function(err,data){
            console.log(data)
            if(err){
              cb(err)
            }else{
              cb(null,data)
            }
          })
        } 
      ],function (err,result){
        //console.log(result[1])
        if(err){
          res.render('error',{
            message:'错误',
            error:err
          })
        }else{
          res.render('hot',{
            data:result[1],
            pages:pages,
            totapages:Math.ceil(totalSizes/pageSizes),
            pageSizes:pageSizes
          })
        }
      }) 
      /* db.collection('phone').find().toArray(function (err, data) {
        if (err) {
          console.log('查询用户数据失败', err);
          res.render('error', {
            message: '查询失败',
            error: err
          })
        } else {
          console.log(data);
          res.render('hot', {
            data: data
          })
        }
        client.close();
      }) */
    })
  })


//新增手机
router.post('/search',upload.single('file'),function(req,res){
  //console.log(req.file)
  var brand = req.body.brand;
  var price = req.body.price;
  var prices = req.body.prices;
  var name=req.body.name;
  var filename = 'images/' + new Date().getTime() + '_' +req.file.originalname;
  var newFileName = path.resolve(__dirname,'../public/',filename);
  try{
    var data = fs.readFileSync(req.file.path);
    fs.writeFileSync(newFileName,data);
  //console.log(req.body)

    MongoClient.connect(url,{useNewUrlParser:true},function(err,client){
      if(err){
        res.render('error',{
          message:'连接失败',
          error:err
        })
        return;
      }
      var db = client.db('prot');
      db.collection('phone').insertOne({
        name:name,
        brand:brand,
        price:price,
        prices:prices,
        filename:filename
      },function(err){
        if(err){
          res.render('error',{
            message:'错误',
            error:err
          })
        }else{
          res.redirect('/phone')
        }
        client.close();
      })


    })
  } catch(error){
    res.render('error',{
      message:'新增手机失败',
      error:error
    })
  }
})
  module.exports = router;
  