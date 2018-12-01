var express = require('express');
var router = express.Router();
var async = require('async');
var ObjectId = require('mongodb').ObjectId
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://127.0.0.1:27017'
/* GET users listing. */
router.get('/', function (req, res) {
  var page = Number(req.query.page) || 1; //页码
  var pageSize = Number(req.query.pageSize) || 5 //每页数据的条数
  var totalSize = 0; //总条数
  MongoClient.connect(url, {useNewUrlParser: true}, function (err, client) {
    if (err) {
      res.render('error', {
        message: '连接数据库失败',
        error: err
      })
      return;
    }
    var db = client.db('prot');
    async.series([
      function(cb){
        db.collection('user').find().count(function(err,num){
          if(err){
            cb(err)
          }else{
            totalSize = num;
            cb(null);
          }
        })
      },
      function(cb){
        db.collection('user').find().limit(pageSize).skip(page * pageSize - pageSize).toArray(function(err,data){
          //console.log(data)
          if(err){
            cb(err)
          }else{
            cb(null,data)
          }
        })
      } 
    ],function (err,result){
      //console.log(result)
      if(err){
        res.render('error',{
          message:'错误',
          error:err
        })
      }else{
        res.render('users',{
          data:result[1],
          page:page,
          totapage:Math.ceil(totalSize/pageSize),
          pageSize:pageSize
        })
      }
    })
    /* db.collection('user').find().toArray(function (err, data) {
      if (err) {
        console.log('查询用户数据失败', err)
        res.render('error', {
          message: '查询失败',
          error: err
        })
      } else {
        console.log(data);
        res.render('users', {
          data: data
        })
      }
      client.close();
    }) */
  })

})

//登录操作
router.post('/login', function (req, res) {
  //1 获取前端传递过来的参数
  //console.log(req.body);
  var username = req.body.name;
  var password = req.body.pwd;
  //2 验证参数的有效性
  if (!username) {
    res.render('error', {
      message: '用户名不能为空',
      error: new Error('用户名不能为空')
    })
    return;
  }
  if (!password) {
    res.render('error', {
      message: '密码不能为空',
      error: new Error('密码不能为空')
    })
    return;
  }

  //3 连接数据库做验证
  MongoClient.connect(url, {useNewUrlParser: true }, function (err,client) {
    if (err) {
      console.log('连接失败');
      res.render('error', {
        message: '连接失败',
        error: err
      })
      return;
    }
    var db = client.db('prot');
    /* db.collection('user').find({
      username: username,
      password: password
    }).count(function (err, num) {
      if (err) {
        console.log('查询失败');
        res.render('error', {
          message: '查询失败',
          error: err
        })
      } else if (num > 0) {
        //登录成功 跳转到首页
        //挡墙url地址是localhost：3000/users/login。
        //如果直接使用render()，页面的地址是不会改变的,所以这里要用重定向
        //res.render('index');
        res.redirect('/');
      } else {
        //登录失败
        res.render('error', {
          message: '登录失败',
          error: new Error('登录失败')
        })
      }
      client.close();
    }) */
    db.collection('user').find({
      username: username,
      password: password
    }).toArray(function(err,data){
      if (err) {
        console.log('查询失败',err);
        res.render('error', {
          message: '查询失败',
          error: err
        })
      }else if(data.length <=0){
        res.render('error', {
          message: '登录失败',
          error: new Error('登录失败')
        })
      }else{
        res.cookie('nickname',data[0].nickname,{
          maxAge:60*60*100
        });
        res.redirect('/');
      }
      client.close();
    })
  })
})

//注册操作  

router.post('/register',function(req,res){
  var name=req.body.name;
  var pwd =req.body.pwd;
  var age =parseInt(req.body.age);
  var sex =req.body.sex;
  var nickname=req.body.nickname;
  var isAdmin = req.body.isAdmin ==='是'?true:false;
  //console.log(name,pwd,age,sex,isAdmin);
  MongoClient.connect(url,{useNewUrlParser:true},function(err,client){
    if(err){
      res.render('error',{
        message:'连接失败',
        error:err
      })
      return;
    }
    var db = client.db('prot');
    async.series([
      function(cb){
        db.collection('user').find({username:name}).count(function(err,num){
          if(err){
            cb(err);
          }else if(num>0){
            cb(new Error('这个账号已经注册过了'));
          }else{
            cb(null);
          }
        })
      },
      function(cb){
        db.collection('user').insertOne({
          username:name,
          password:pwd,
          nickname:nickname,
          age:age,
          sex:sex,
          isAdmin:isAdmin
        },function(err){
          if(err){
            cb(err)
          }else{
            cb(null)
          }
        })
      }
    ],function(err,result){
      if(err){
        res.render('error',{
          message:'有错误',
          error:err
        })
      }else{
        res.redirect('/login');
      }
      client.close();
    })
  })
})


//删除的操作
router.get('/delete',function(req,res){
  var id= req.query.id;
  MongoClient.connect(url,{useNewUrlParser:true},function(err,client){
    if(err){
      res.render('error',{
        message:'连接失败',
        error:err
      })
      return;
    }
    var db = client.db('prot');
    db.collection('user').deleteOne({
      _id:ObjectId(id)
    },function(err){
      //console.log(data)
      if(err){
        res.render('error',{
          message:'删除失败',
          error:err
        })
      }else{
        //删除成功
        res.redirect('/users')
      }
      client.close();
    })
  })
})

//搜索功能
router.post('/search',function(req,res){
  var name = req.body.name;
  var fliter = new RegExp(name);
  var page = Number(req.query.page) || 1; //页码
  var pageSize = Number(req.query.pageSize) || 5 //每页数据的条数
  var totalSize = 0; //总条数
  MongoClient.connect(url,{useNewUrlParser:true},function(err,client) {
    if(err){
      res.render('error',{
        message:'连接失败',
        error:err
      })
      return;
    }
    var db = client.db('prot');
    db.collection('user').find({username:fliter}).toArray(function(err,data){
      console.log(data)
      if(err){
        res.render('error',{
          message:'错误',
          error:err
        })
      }else if(data.length <= 0){
        res.render('error',{
          message:'该用户名不存在',
          error:new Error('请输入正确的用户名')
        })
      }else if(!name){
        res.render('error',{
          message:'搜索内容不能为空',
          error:new Error('输入有误,请重新输入')
        })
      }else{
        res.render('users',{
          data:data,
          page:page,
          totapage:Math.ceil(totalSize/pageSize),
          pageSize:pageSize
        });
      }
      client.close();
    })
  })
}) 

//手机管理


module.exports = router;

/* 


*/