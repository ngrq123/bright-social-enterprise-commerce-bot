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

    response = processMessage(sender_psid, received_message);
    // Default response (for debugging)
    // Create the payload for a basic text message
    // response = {
    //   text: `You sent the message: "${received_message.text}".`
    // };
  } else {
    response = defaultResponse();
    //     // Gets the URL of the message attachment
    //     let attachment_url = received_message.attachments[0].payload.url;
  }

  // Sends the response message
  callSendAPI(sender_psid, response);
}

function processMessage(sender_psid, message) {
  // NLP: https://developers.facebook.com/docs/messenger-platform/built-in-nlp
  let entities = message.nlp["entities"];

  // Object.keys(entities).forEach(key => {
  //   console.log(key);
  //   console.log(entities[key]);
  // });

  // Check greeting
  let is_greeting =
    entities["greetings"] != null &&
    entities["greetings"][0]["confidence"] > 0.8; // Greeting threshold set to 0.8

  // Retrieve first intent object
  let intent = entities["intent"][0];

  if (intent["confidence"] > 0.5) {
    // Process intent
    let intent_parts = intent["value"].split("_");
    let intent_category = intent_parts[0];
    let response = null;

    if (intent_category === "recommendation") {
      // Handle recommendation
      // response = generateResponseFromMessage(
      //   "Message received is a recommendation message."
      // );

      let product_types = [];
      if (entities["product_type"]) {
        console.log("Processing product types");
        product_types = entities["product_type"]
          .filter(obj => obj["confidence"] > 0.5)
          .map(obj => obj["value"]);
      }

      response = generateRecommendationsResponse(product_types);
    }

    if (intent_category === "enquiry") {
      // Handle enquiry
      // response = generateResponseFromMessage(
      //   "Message received is an enquiry message."
      // );

      let intent_subcategory = intent_parts[1];

      if (intent_subcategory === "general") {
        if (entities["profit"]) {
          response = generateResponseFromMessage(
            "All net revenue earned from the sale of our products and services go towards paying a monthly allowance for our clients' work, as well as their lunch expenses while undergoing training."
          );
        } else if (entities["manufacturer"]) {
          response = generateResponseFromMessage(
            "We support adults with intellectual disabilities. We started a range of social enterprise projects to provide alternative work engagement for our adult trainees."
          );
        } else if (entities["products"]) {
          response = generateResponseFromMessage("We sell craft and baker goods.");
        }
      } else if (intent_subcategory === "delivery") {
        // Check for estimated arrival entity
        if (entities["estimated_arrival"]) {
          response = generateResponseFromMessage(
            "The average delivery time takes 5-7 working days. Your ordered was sent on 17 February. It is estimated to arrive on {sent date + 7 working day}."
          );
        } else if (entities["cost"]) {
          response = generateResponseFromMessage("It is a flat fee of $2 for every order.");
        } else if (entities["status"]) {
          // TODO: Order status
        } else {
          response = generateResponseFromMessage(
            "We deliver islandwide. The average delivery time takes 5-7 working days."
          );
        }
      }
    }

    if (intent_category === "cart") {
      // Handle shopping cart
      response = generateResponseFromMessage(
        "Message received is a cart message."
      );

      let intent_subcategory = intent_parts[1];
      if (intent_subcategory === "add" && entities["product"]) {
        let product_name = entities["product"][0]["value"];
        let quantity = entities["number"] ? entities["number"][0]["value"] : 1;
        response = generateAddCartResponse(sender_psid, product_name, quantity);
      } else if (intent_subcategory === "view") {
        response = generateViewCartResponse(sender_psid);
      }
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

function generateRecommendationsTemplateElements(products) {
  let template_elements = products.map(product => {
    return {
      title: product["name"],
      subtitle: `$${product["price"]}`,
      image_url: product["url"],
      buttons: [
        {
          type: "postback",
          title: "Learn More",
          payload: `enquiry_product ${product["name"]}`
        },
        {
          type: "postback",
          title: "Add to Cart",
          payload: `cart_add ${product["name"]}`
        }
      ]
    };
  });
  return template_elements;
}

function generateRecommendationsResponse(product_types) {
  let response = {
    attachment: {
      type: "template",
      payload: {
        template_type: "generic",
        elements: generateRecommendationsTemplateElements([
          {
            id: 1,
            name: "Dark Chocolate Oatmeal Cookies",
            price: 3.5,
            url:
              "https://static.wixstatic.com/media/768979_3fccb2bb837a44caa80bb4fc5dddd119~mv2_d_1800_1800_s_2.jpg",
            attribute: {
              allegens: ['eggs', 'nut'],
              colour: null,
              
            }
          },
          {
            id: 2,
            name: "Cranberry Sweetheart Cookies (Eggless)",
            price: 3.5,
            url:
              "https://static.wixstatic.com/media/768979_3fccb2bb837a44caa80bb4fc5dddd119~mv2_d_1800_1800_s_2.jpg"
          },
          {
            id: 3,
            name: "Earl Grey Sunflower Seeds Cookies",
            price: 3.5,
            url:
              "https://static.wixstatic.com/media/768979_3fccb2bb837a44caa80bb4fc5dddd119~mv2_d_1800_1800_s_2.jpg"
          }
        ])
      }
    }
  };
  return response;
}

function generateAddCartResponse(sender_psid, product_name, quantity) {
  // TODO: Add product to cart in db

  return {
    text: `Added ${quantity} ${product_name} to cart.`,
    quick_replies: [
      {
        "content_type": "text",
        "title": "View Cart",
        "payload": `cart_view`
      },
      {
        "content_type": "text",
        "title": "Checkout",
        "payload": `checkout`
      }
    ]
  };
}

function generateCartTemplateElements(products) {
  let template_elements = products.map(product => {
    return {
      title: product["name"],
      subtitle: `Qty: ${product["quantity"]} ($${product["price"]} each)`,
      image_url: product["url"],
      buttons: [
        {
          type: "postback",
          title: "Add 1",
          payload: `cart_add ${product["name"]}`
        },
        {
          type: "postback",
          title: "Remove All",
          payload: `cart_remove ${product["name"]}`
        }
      ]
    };
  });
  return template_elements;
}

function generateViewCartResponse(product_types) {
  let response = {
    attachment: {
      type: "template",
      payload: {
        template_type: "generic",
        elements: generateCartTemplateElements([
          {
            id: 1,
            name: "Dark Chocolate Oatmeal Cookies",
            price: 3.5,
            url:
              "https://static.wixstatic.com/media/768979_3fccb2bb837a44caa80bb4fc5dddd119~mv2_d_1800_1800_s_2.jpg",
            quantity: 1
          },
          {
            id: 2,
            name: "Cranberry Sweetheart Cookies (Eggless)",
            price: 3.5,
            url:
              "https://static.wixstatic.com/media/768979_3fccb2bb837a44caa80bb4fc5dddd119~mv2_d_1800_1800_s_2.jpg",
            quantity: 2
          },
          {
            id: 3,
            name: "Earl Grey Sunflower Seeds Cookies",
            price: 3.5,
            url:
              "https://static.wixstatic.com/media/768979_3fccb2bb837a44caa80bb4fc5dddd119~mv2_d_1800_1800_s_2.jpg",
            quantity: 1
          }
        ])
      }
    }
  };
  return response;
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
  let response;

  // Get the payload for the postback
  let payload = received_postback.payload;
  console.log(`Received postback: "${payload}"`);

  let postback_intent = payload.split(" ")[0];
  let postback_content = payload.substring(
    payload.indexOf(" ") + 1,
    payload.length
  );

  // Set the response based on the postback intent
  if (postback_intent === "cart_add") {
    // Add to cart
    response = generateAddCartResponse(sender_psid, postback_content, 1);
  } else if (postback_intent === "cart_view") {
    response = generateViewCartResponse(sender_psid);
  } else if (postback_intent === "enquiry_product") {
    response = {
      text: `What would you like to know about our ${postback_content}?`
    };
  }

  if (response == null) {
    response = defaultResponse();
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
        console.log("Message sent!");
      } else {
        console.error("Unable to send message:" + err);
      }
    }
  );
}
