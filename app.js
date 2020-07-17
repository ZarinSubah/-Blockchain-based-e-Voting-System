var app = require("express")();
var express = require("express");
const { Blockchain, Transaction } = require('./blockchain');
const time = require('./time');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const savjeeCoin = new Blockchain();
var mysql = require('mysql');
var path = require('path');
var session = require('express-session');
const keygenerator = require('./keygenerator');
var bodyParser = require("body-parser");
var urlencodedParser = bodyParser.urlencoded({ extended: false })


global.ToAddress = " ";
global.MyKey = " ";

global.a = 0;
global.b = 0;

var connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'blockvote'
});

app.use(express.static('public'));// CSS and Style

app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));


//Set view engine to ejs
app.set("view engine", "ejs");

//Tell Express where we keep our index.ejs
app.set("views", __dirname + "/views");

//Use body-parser
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (req, res) => { res.render("home"); }); // Home page

app.get("/about", (req, res) => { res.render("about"); });//About page

app.get("/sign-up", (req, res) => { res.render("sign-up"); }); // Create new user

app.get("/login", (req, res) => { res.render("login"); }); //login

//Save data after sign up
app.post("/created", (req, res) => {
  name = req.body.name
  username = req.body.uname;
  userpass = req.body.upass;
  uemail = req.body.email;

  var privkey = keygenerator.generatePrivate()
  var pubkey = keygenerator.generatePublic()
  var balance = 1;

  var sql = "INSERT INTO accounts (name,username,password,public,private,balance) VALUES ?";
  var values = [[name, username, userpass, pubkey, privkey, balance]];
  connection.query(sql, [values], function (err, result) {
    if (err) throw err;
    var cr = 'Account created Successfully!'
    res.render("created", { crhtml: cr });
  });
});

//Login Authentification
app.post('/auth', function (request, response) {
  var iu = "";
  var username = request.body.username;
  var password = request.body.password;

  if (username && password) {
    connection.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function (error, results, fields) {
      if (results.length > 0) {
        request.session.loggedin = true;
        request.session.username = username;
        response.redirect('/user'); // Login to user page
      } else {

        iu = 'Incorrect Username and/or Password!'
        response.render("message", { iuhtml: iu });

      }
      response.end();
    });
  } else {

    iu = 'Please enter Username and Password!'
    response.render("message", { iuhtml: iu });
    response.end();

  }
});

//Login Using Session
app.get('/user', function (request, response) {
  const low = new Date('March 29, 2020 10:00:00');
  const up = new Date('March 30, 2020 23:40:30');
  var ed = low.getDate() + "/" + low.getMonth() + "/" + low.getFullYear();
  var l = low.getHours() + ":" + low.getMinutes() + ":" + low.getSeconds();
  var u = up.getHours() + ":" + up.getMinutes() + ":" + up.getSeconds();
  var d = "Date:" + time.CDate();
  var au = request.session.username;
  var bu = "'" + au + "'";
  var name;
  var username;
  var privkey;
  var pubkey;
  var balance;
  if (request.session.loggedin) {

    var queryString = 'SELECT name,public,private,balance FROM accounts WHERE username=' + bu;

    connection.query(queryString, function (err, result) {

      if (err) throw err;
      name = result[0].name;
      username = result[0].username;
      privkey = result[0].private;
      pubkey = result[0].public;
      balance = result[0].balance;

      response.render("user", { edhtml: ed, lowhtml: l, uphtml: u, da: d, namehtml: name, usernamehtml: username, privatekeyhtml: privkey, publickeyhtml: pubkey, balancehtml: balance });
    });

  } else {

    var iu = 'Please login to view this page!'
    response.render("message", { iuhtml: iu });

  }

});


//Logout using Destroy session 
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return console.log(err);
    }
    res.redirect('/');
  });

});


// Vote is valid or not
app.post('/valid', function (req, res) {

  const low = new Date('March 29, 2020 10:00:00');
  const up = new Date('March 30, 2020 23:40:30');
  const now = new Date();

  var ed = low.getDate() + "/" + low.getMonth() + "/" + low.getFullYear();
  var l = low.getHours() + ":" + low.getMinutes() + ":" + low.getSeconds();
  var u = up.getHours() + ":" + up.getMinutes() + ":" + up.getSeconds();
  var d = "Date:" + time.CDate();

  var au = req.session.username; //username from login form
  var bu = "'" + au + "'";


  if (req.session.loggedin) {

    //user info after login  
    var queryString = 'SELECT name,public,private,balance FROM accounts WHERE username=' + bu;

    connection.query(queryString, function (err, result) {

      if (err) throw err;
      name = result[0].name;
      username = result[0].username;
      privkey = result[0].private;
      pubkey = result[0].public;
      balance = result[0].balance;




      //C1 and C2 are candidate public address
      var c1 = '0443a498c09b97aac9870fbdca0a6f980f150b0b469a69d8abc0a0470a521384509a08d2e5ccf74e0b9edd62491ea2b684164d77aef0542fcd82e100eb00c9d622';
      var c2 = '0433dd9a77f0e81f7a8b2ff8eec684acad063649e983e46f4c2758762a9d309ad70708cca27823652486cc7d908027b06df8292069bdc0bf32e3a16e1b87c05751';

      MyKey = req.body.Address; //From enter your private key
      ToAddress = req.body.TAddress; // candidate selection

      // Voter
      const myKey = ec.keyFromPrivate(MyKey);
      const myWalletAddress = myKey.getPublic('hex');
      const myWalletAddress2 = ToAddress;

      // Make a transaction 
      const tx1 = new Transaction(myWalletAddress, myWalletAddress2, 1, 1);
      tx1.signTransaction(myKey);
      savjeeCoin.addTransaction(tx1);

      //Time interval 
      if (low < now && up > now) {

        // If the voter is already voted
        if (savjeeCoin.getBalanceOfAddress(myWalletAddress) === 0 || balance === 0) {


          var s = 'You have already voted';
        }
        //When balance is 1 
        if (savjeeCoin.getBalanceOfAddress(myWalletAddress) !== 0 && balance !== 0) {
          // Mine block
          console.log('Starting the miner...');
          savjeeCoin.minePendingTransactions(myWalletAddress);
          console.log();
          console.log('Vote valid?', savjeeCoin.isChainValid());

          var t = 'Your Vote is Valid'
          if (myWalletAddress2 === c1 && balance !== 0) {
            a = 1;

          } else {
            a = a;
          }
          if (myWalletAddress2 === c2 && balance !== 0) {
            b = 1;

          } else {
            b = b;
          }
        }
      }

      if (!(low < now && up > now)) {
        var e = "Time Out"
      }
      var bal;
      var bal1 = savjeeCoin.getBalanceOfAddress(myWalletAddress);
      if (bal1 === 1 && balance === 1) {
        bal = 1;
      } else {
        bal = 0
      }
      var balance1 = "'" + bal + "'";
      var queryString2 = "UPDATE accounts SET balance =" + balance1 + "WHERE username=" + bu;

      connection.query(queryString2, function (err, res) {

        if (err) throw err;


      });
      res.render("validation", { j1: s, j2: t, j3: e, edhtml: ed, lowhtml: l, uphtml: u, da: d, namehtml: name, usernamehtml: username, privatekeyhtml: privkey, publickeyhtml: pubkey, balancehtml: balance });
    });


  } else {
    var iu = 'Please login to view this page!'
    response.render("message", { iuhtml: iu });
  }

});


app.get('/result', function (req, res) {
  const low = new Date('March 29, 2020 10:00:00');
  const up = new Date('March 30, 2020 23:40:30');
  const now = new Date();
  var ed = low.getDate() + "/" + low.getMonth() + "/" + low.getFullYear();
  var l = low.getHours() + ":" + low.getMinutes() + ":" + low.getSeconds();
  var u = up.getHours() + ":" + up.getMinutes() + ":" + up.getSeconds();
  var d = "Date:" + time.CDate();
  var au = req.session.username;
  var bu = "'" + au + "'";
  var name;
  var username;
  var privkey;
  var pubkey;
  var balance;
  if (req.session.loggedin) {



    var queryString = 'SELECT name,public,private,balance FROM accounts WHERE username=' + bu;

    connection.query(queryString, function (err, result) {

      if (err) throw err;
      name = result[0].name;
      username = result[0].username;
      privkey = result[0].private;
      pubkey = result[0].public;
      balance = result[0].balance;

      var queryString7 = "SELECT vote FROM candidate WHERE cname='candidate 1'";

      connection.query(queryString7, function (err, result1) {

        if (err) throw err;
        vote1 = result1[0].vote;
        console.log(vote1)
        var queryString7 = "SELECT vote FROM candidate WHERE cname='candidate 2'";

        connection.query(queryString7, function (err, result2) {

          if (err) throw err;
          vote2 = result2[0].vote;


          var ac1 = 'candidate 1'
          var vc1 = a + vote1;
          var ac = "'" + ac1 + "'";
          var a1 = "'" + vc1 + "'";

          var queryString3 = "UPDATE candidate SET vote =" + a1 + "WHERE cname=" + ac;

          connection.query(queryString3, function (err, res) {

            if (err) throw err;


          });
          var bc1 = 'candidate 2'
          var vc2 = b + vote2;
          var bc = "'" + bc1 + "'";
          var b1 = "'" + vc2 + "'";
          var queryString4 = "UPDATE candidate SET vote =" + b1 + "WHERE cname=" + bc;

          connection.query(queryString4, function (err, res) {

            if (err) throw err;


          });
          var queryString5 = "SELECT vote FROM candidate WHERE cname='candidate 1'";

          connection.query(queryString5, function (err, result3) {

            if (err) throw err;
            vote3 = result3[0].vote;
            console.log(vote1)
            var queryString6 = "SELECT vote FROM candidate WHERE cname='candidate 2'";

            connection.query(queryString6, function (err, result4) {

              if (err) throw err;
              vote4 = result4[0].vote;
              a = 0;
              b = 0;
              res.render("result", { v1: vote3, v2: vote4, edhtml: ed, lowhtml: l, uphtml: u, da: d, namehtml: name, usernamehtml: username, privatekeyhtml: privkey, publickeyhtml: pubkey, balancehtml: balance });
            });
          });
        });
      });
    });

  } else {
    var iu = 'Please login to view this page!'
    response.render("message", { iuhtml: iu });
  }

});

app.listen(8080, () => { console.log("Server online on http://localhost:8080"); });



//Instead of sending Hello World, we render index.ejs
//app.get("/", (req, res) => { res.render("index", { private:privkey ,public: pubkey}); });
//app.get("/test", (req, res) => { res.render("index", { private:privkey ,public: pubkey}); });
