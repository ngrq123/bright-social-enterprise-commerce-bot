// https://developers.facebook.com/docs/messenger-platform/getting-started/webhook-setup/
// https://developers.facebook.com/docs/messenger-platform/getting-started/app-setup
// https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start

"use strict";

// Imports dependencies and set up http server
const express = require("express"),
  bodyParser = require("body-parser"),
  app = express().use(bodyParser.json()); // creates express http server
const request = require("request");
const dotenv = require('dotenv');
const crypto = require('crypto');
const mongoose = require('mongoose');
var fs = require('fs')
var https = require('https')
dotenv.config();

// Get page access token
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

// Setup to connect to DB
const DB_PASSWORD = process.env.DB_PASSWORD;
mongoose.connect('mongodb+srv://mongoadmin:' + DB_PASSWORD + '@fb-hack-chatbot-cevnk.mongodb.net/fbmsg', { useNewUrlParser: true, useCreateIndex: true, useFindAndModify: false }).then(() => console.log("DB Connection successful"));
mongoose.Promise = global.Promise;

// Get page access token
const FB_APP_SECRET = process.env.FB_APP_SECRET;
const appsecret_proof = crypto.createHmac('sha256', FB_APP_SECRET).update(PAGE_ACCESS_TOKEN).digest('hex')

//Import Schema
require('./models/User');
require('./models/Product');
require('./models/Cart');
require('./models/Order');

//Import routes
app.use(require('./routes'));

// Sets server port and logs message on success
var server = https.createServer({
  key: fs.readFileSync('../server.key'),
  cert: fs.readFileSync('../server.cert')
}, app).listen(process.env.PORT || 3000, function () {
  console.log('Webhooks istening on port ' + server.address().port);
});

