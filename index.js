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
dotenv.config();

// Setup to connect to DB
const DB_PASSWORD = process.env.DB_PASSWORD;
mongoose.connect('mongodb+srv://mongoadmin:'+ DB_PASSWORD +'@fb-hack-chatbot-cevnk.mongodb.net/fbmsg',{useNewUrlParser: true,useCreateIndex: true, useFindAndModify: false}).then(() => console.log("DB Connection successful"));
mongoose.Promise = global.Promise;

import { chgetAllProducts, getProductByType, getProductByID, getProductPrice, getProductDesc } from './DBConn';
import { getName, getProductDetails } from './fbhelper';

// Get page access token
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const FB_APP_SECRET = process.env.FB_APP_SECRET;
const appsecret_proof = crypto.createHmac('sha256',FB_APP_SECRET).update(PAGE_ACCESS_TOKEN).digest('hex')

// Sets server port and logs message on success
app.listen(3000, () => console.log("webhook is listening"));

// For testing endpoints
app.get("/test", (req,res) =>{
    let body = req.body;
    // getAllProducts().then(function(products){
    // console.log(products);
    // });
    // getProductByType("Baker").then(function(products){
    // console.log(products);
    // });
    // getProductByID('3060724697352196').then(function(prod){
        // console.log(prod);
    // });
    // getProductPrice('3060724697352196').then(function(price){
        // console.log(price);
    // });
    getProductDesc('3060724697352196').then(function(description){
        console.log(description);
    });
    res.status(200).send("Success");
    
});


// Creates the endpoint for our webhook
app.post("/webhook", (req, res) => {
  let body = req.body;

  // Checks this is an event from a page subscription
  if (body.object === "page") {
    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {
      // Gets the message. entry.messaging is an array, but
      // will only ever contain one message, so we get index 0
      let webhook_event = entry.messaging[0];
      // console.log(webhook_event);

      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      // console.log("Sender PSID: " + sender_psid);
      
      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        getName(sender_psid, function(response){
            checkUser(sender_psid,response);
        });
        
        handleMessage(sender_psid, webhook_event.message);
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      }
    });

    // Returns a '200 OK' response to all requests
    res.status(200).send("EVENT_RECEIVED");
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
});

// Adds support for GET requests to our webhook
app.get("/webhook", (req, res) => {
  let VERIFY_TOKEN = process.env.VERIFY_TOKEN;

  // Parse the query params
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    // Checks the mode and token sent is correct
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      // Responds with the challenge token from the request
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

// Handles messages events
function handleMessage(sender_psid, received_message) {
  let response;
  
  // Check if the message contains text
  if (received_message.text) {
    // Create the payload for a basic text message
    console.log("Received message: " + received_message.text);
    response = {
      text: `You sent the message: "${received_message.text}". Now send me an image!`
    };
  } else if (received_message.attachments) {
    // Gets the URL of the message attachment
    let attachment_url = received_message.attachments[0].payload.url;
    
    response = {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [
            {
              title: "Is this the right picture?",
              subtitle: "Tap a button to answer.",
              image_url: attachment_url,
              buttons: [
                {
                  type: "postback",
                  title: "Yes!",
                  payload: "yes"
                },
                {
                  type: "postback",
                  title: "No!",
                  payload: "no"
                }
              ]
            }
          ]
        }
      }
    };
  }
  
  // NLP: https://developers.facebook.com/docs/messenger-platform/built-in-nlp
  console.log(received_message.nlp);

  // Sends the response message
  callSendAPI(sender_psid, response);
}


// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
  let response;
  
  // Get the payload for the postback
  let payload = received_postback.payload;
  
  // Set the response based on the postback payload
  if (payload === "yes") {
    response = { text: "Thanks!" };
  } else if (payload === "no") {
    response = { text: "Oops, try sending another image." };
  }
  // Send the message to acknowledge the postback
  callSendAPI(sender_psid, response);
}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    recipient: {
      id: sender_psid
    },
    message: response
  };

  // Send the HTTP request to the Messenger Platform
  request(
    {
      uri: "https://graph.facebook.com/v2.6/me/messages",
      qs: { access_token: PAGE_ACCESS_TOKEN },
      method: "POST",
      json: request_body
    },
    (err, res, body) => {
      if (!err) {
        console.log("message sent!");
      } else {
        console.error("Unable to send message:" + err);
      }
    }
  );
}