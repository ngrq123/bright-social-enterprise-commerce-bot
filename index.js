// https://developers.facebook.com/docs/messenger-platform/getting-started/webhook-setup/
// https://developers.facebook.com/docs/messenger-platform/getting-started/app-setup
// https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start

"use strict";

// Imports dependencies and set up http server
const express = require("express"),
  bodyParser = require("body-parser"),
  app = express().use(bodyParser.json()); // creates express http server
const request = require("request");

// import { checkUser, createUser } from './DBConn';

// Get page access token
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

// Sets server port and logs message on success
app.listen(3000, () => console.log("webhook is listening"));

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
        // getName(sender_psid, function(response){
        //     checkUser(sender_psid,response);
        // });
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

// Gets users name from facebook graph api
// function getName(sender_psid,callback){
//     var name = "Empty";
//     request({
//         url:"https://graph.facebook.com/v3.3/" + sender_psid,
//         qs:{
//             access_token: PAGE_ACCESS_TOKEN,
//             fields: "first_name",
//         },
//         method:"GET"
//     }, function(error,response,body){
//         if (error){
//             console.log(error)
//         }else{
//             var bodyObj = JSON.parse(body);
//             name = bodyObj.first_name;
//             console.log("Name: " + name);
//             return callback(name)
//         }
//     });
//     return name;
// }

// Handles messages events
function handleMessage(sender_psid, received_message) {
  let response;
  
  // Check if the message contains text
  if (received_message.text) {
    console.log(`Received message: "${received_message.text}"`);
    
    response = processMessage(received_message);
    // Default response (for debugging)
    // Create the payload for a basic text message
    // response = {
    //   text: `You sent the message: "${received_message.text}".`
    // };
  } else {
    response = defaultResponse();
//     // Gets the URL of the message attachment
//     let attachment_url = received_message.attachments[0].payload.url;
    
//     response = {
//       attachment: {
//         type: "template",
//         payload: {
//           template_type: "generic",
//           elements: [
//             {
//               title: "Is this the right picture?",
//               subtitle: "Tap a button to answer.",
//               image_url: attachment_url,
//               buttons: [
//                 {
//                   type: "postback",
//                   title: "Yes!",
//                   payload: "yes"
//                 },
//                 {
//                   type: "postback",
//                   title: "No!",
//                   payload: "no"
//                 }
//               ]
//             }
//           ]
//         }
//       }
//     };
    
  }

  // Sends the response message
  callSendAPI(sender_psid, response);
}

function processMessage(message) {
  // NLP: https://developers.facebook.com/docs/messenger-platform/built-in-nlp
  let entities = message.nlp["entities"];

  // Check greeting
  let is_greeting =
    entities["greetings"] != null &&
    entities["greetings"][0]["confidence"] > 0.8; // Greeting threshold set to 0.8

  // Retrieve first intent object
  let intent = entities["intent"][0];

  if (intent["confidence"] > 0.5) {
    // Process intent
    let intent_category = intent.split("_")[0];
    let response = null;

    if (intent_category === "recommendation") {
      // Handle recommendation
    }

    if (intent_category === "enquiry") {
      // Handle enquiry
    }

    if (intent_category === "cart") {
      // Handle shopping cart
    }

    if (intent_category === "return") {
      // Handle order returns
    }

    if (intent_category === "refund") {
      // Handle order refund
    }

    if (response === null) {
      return defaultResponse();
    }

    return response;
  } else if (is_greeting) {
    // Message has no intent, just greeting
    return generateResponseFromMessage(
      "Hi there! Welcome to MINDS. How can I help you?"
    );
  }

  Object.keys(entities).forEach(key => {
    console.log(key);
    console.log(entities[key]);
  });

  return defaultResponse();
}

function defaultResponse() {
  return generateResponseFromMessage(
    "We could not understand your message. Kindly rephrase your message and send us again."
  );
}

function generateResponseFromMessage(message) {
  return {
    text: message
  };
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
  let response;
  
//   // Get the payload for the postback
//   let payload = received_postback.payload;
  
//   // Set the response based on the postback payload
//   if (payload === "yes") {
//     response = { text: "Thanks!" };
//   } else if (payload === "no") {
//     response = { text: "Oops, try sending another image." };
//   }
  
  response = defaultResponse();
  
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
        console.log("Message sent!");
      } else {
        console.error("Unable to send message:" + err);
      }
    }
  );
}
