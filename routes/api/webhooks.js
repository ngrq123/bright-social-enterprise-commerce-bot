var mongoose = require('mongoose');
var router = require('express').Router();
// import { getAllProducts, getProductByType, getProductByID, getProductPrice, getProductDesc, getProductsByName, getProductByNameVar } from '../../models/Product';
import { checkUser, createUser } from '../../models/User';
import { getName } from '../../helpers/fbhelper';
//
//
//
//ROUTES
//
//
//

// Adds support for GET requests to our webhook
router.get("/webhook", (req, res) => {
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
router.post("/webhook", (req, res) => {
    let body = req.body;

    // Checks this is an event from a page subscription
    if (body.object === "page") {
        // Iterates over each entry - there may be multiple if batched
        body.entry.forEach(function (entry) {
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
                if (webhook_event.message.quick_reply) {
                    handlePostback(sender_psid, webhook_event.message.quick_reply);
                } else {
                    handleMessage(sender_psid, webhook_event.message);
                }

                getName(PAGE_ACCESS_TOKEN, sender_psid, function (response) {
                    checkUser(sender_psid, response).then(function (user) {
                        if (user.length == 0) {
                            createUser(sender_psid, response);
                        }
                    });
                });

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

let defaultResponse = generateResponseFromMessage(
    "We could not understand your message. Kindly rephrase your message and send us again."
);

// Handles messages events
async function handleMessage(sender_psid, received_message) {
    let response;

    // Check if the message contains text
    if (received_message.text) {
        console.log(`Received message: "${received_message.text}"`);

        response = await processMessage(sender_psid, received_message);
        // Default response (for debugging)
        // Create the payload for a basic text message
        // response = {
        //   text: `You sent the message: "${received_message.text}".`
        // };
    } else {
        response = defaultResponse;
        //     // Gets the URL of the message attachment
        //     let attachment_url = received_message.attachments[0].payload.url;
    }

    // Sends the response message
    callSendAPI(sender_psid, response);
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
        response = generateResponseFromMessage(
            `What would you like to know about our ${postback_content}?`
        );
    } else if (postback_intent === "enquiry_product_attribute") {
        let attribute = postback_content.substring(0, postback_content.indexOf(" ") + 1);
        let product = postback_content.substring(
            postback_content.indexOf(" ") + 1,
            postback_content.length
        );
        response = generateProductEnquiryResponse(product, attribute);
    } else if (postback_intent === "checkout") {
        response = {
            attachment: {
                type: "template",
                payload: {
                    template_type: "button",
                    text: "Click on the button below to pay.",
                    buttons: [
                        {
                            type: "postback",
                            title: "Pay",
                            payload: "paid"
                        }
                    ]
                }
            }
        };
    } else if (postback_intent === "paid") {
        response = {
            attachment: {
                type: "template",
                payload: {
                    template_type: "button",
                    text: "Your order (order no.) is confirmed.",
                    buttons: [
                        {
                            type: "postback",
                            title: "View Receipt",
                            payload: "receipt_view"
                        }
                    ]
                }
            }
        };
    } else if (postback_intent === "receipt_view") {
        response = generateReceiptResponse(sender_psid);
    }

    if (response == null) {
        response = defaultResponse();
    }

    // Send the message to acknowledge the postback
    callSendAPI(sender_psid, response);
}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
    // Uncomment to log response object
    console.log(response);

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

// Process text message and returns response object to handleMessage()
function processMessage(sender_psid, message) {
    // NLP: https://developers.facebook.com/docs/messenger-platform/built-in-nlp
    let entities = message.nlp["entities"];

    // Uncomment to view all entities and their xalues
    Object.keys(entities).forEach(key => {
        console.log("Entity: " + key);
        console.log(entities[key]);
    });

    // Check greeting
    let is_greeting =
        entities["greetings"] != null &&
        entities["greetings"][0]["confidence"] > 0.8; // Greeting threshold set to 0.8 (stricter)

    // Retrieve first intent object
    let intent = entities["intent"][0];

    if (intent["confidence"] > 0.5) {
        // Process intent
        let intent_parts = intent["value"].split("_");
        let intent_category = intent_parts[0];
        let intent_subcategory = intent_parts.length > 1 ? intent_parts[1] : null;
        let response = null;

        switch (intent_category) {
            case "recommendation":
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
                console.log(response);
                break;

            case "enquiry":
                // Handle enquiry
                // response = generateResponseFromMessage(
                //   "Message received is an enquiry message."
                // );

                if (intent_subcategory === "product") {
                    // Retrieve product and attribute from entities object
                    if (entities["product"] && entities["product_attribute"]) {
                        let product = entities["product"][0]["value"];
                        let attribute = entities["product_attribute"][0]["value"];
                        // Handle product enquiry
                        response = generateProductEnquiryResponse(product, attribute);
                    } else if (entities["product_type"] && entities["product_attribute"]) {
                        // Handle product type enquiry
                        let product_type = entities["product_type"][0]["value"];
                        let attribute = entities["product_attribute"][0]["value"];
                        response = generateProductTypeEnquiryResponse(product_type, attribute);
                    } else {
                        response = defaultResponse;
                    }
                } else if (intent_subcategory === "general") {
                    let messages = {
                        profit:
                            "All net revenue earned from the sale of our products and services go towards paying a monthly allowance for our clients' work, as well as their lunch expenses while undergoing training.",
                        manufacturer:
                            "We support adults with intellectual disabilities. We started a range of social enterprise projects to provide alternative work engagement for our adult trainees.",
                        products: "We sell craft and baker goods."
                    };
                    // Loop through message keys (entity) and find if entity is in entities
                    Object.keys(messages).forEach(entity => {
                        if (response == null && entities[entity]) {
                            response = generateResponseFromMessage(messages[entity]);
                        }
                    });
                } else if (intent_subcategory === "delivery") {
                    if (entities["status"]) {
                        // TODO: Order status
                        response = generateResponseFromMessage(
                            "Your latest order is <status>."
                        );
                    } else if (entities["estimated_arrival"]) {
                        // TODO: Order estimated arrival
                        response = generateResponseFromMessage(
                            "The average delivery time takes 5-7 working days. Your ordered was sent on <date>. It is estimated to arrive on <date + 7 working days>."
                        );
                    } else if (entities["cost"]) {
                        response = generateResponseFromMessage(
                            "It is a flat fee of $2 for every order."
                        );
                    } else {
                        response = generateResponseFromMessage(
                            "We deliver islandwide. The average delivery time takes 5-7 working days."
                        );
                    }
                }
                break;

            case "cart":
                // Handle shopping cart
                // response = generateResponseFromMessage(
                //   "Message received is a cart message."
                // );

                if (intent_subcategory === "add" && entities["product"]) {
                    let product_name = entities["product"][0]["value"];
                    let quantity = entities["number"]
                        ? entities["number"][0]["value"]
                        : 1;
                    response = generateAddCartResponse(
                        sender_psid,
                        product_name,
                        quantity
                    );
                } else if (intent_subcategory === "view") {
                    response = generateViewCartResponse(sender_psid);
                }
                break;

            default:
                response = defaultResponse;
        }

        response = response == null ? defaultResponse : response;
        return response;
    } else if (is_greeting) {
        // Message has no intent, just greeting
        // TODO: Add quick replies of chatbot functionalities (recommendations, check order status, etc.)
        return generateResponseFromMessage(
            "Hi there! Welcome to Bright. How can I help you?"
        );
    }

    // No intent nor greeting
    return defaultResponse;
}

// Wrapper method to convert text message string to response object
function generateResponseFromMessage(message) {
    return {
        text: message
    };
}

// Response on generic template carousel for recommendations
async function generateRecommendationsResponse(product_types) {
    // Retrieve products to recommend based on list of product types. If product types is an empty array, recommend products of various types
    let products;

    if (product_types.length === 0) {
        products = await getAllProducts();
    } else {
        products = await getProductsByType(product_types[0]);
    }

    let response = {
        attachment: {
            type: "template",
            payload: {
                template_type: "generic",
                elements: products.map(product => {
                    return {
                        title: product["title"],
                        subtitle: `$${product["price"]}`,
                        image_url: product["image_link"],
                        buttons: [
                            {
                                type: "postback",
                                title: "Learn More",
                                payload: `enquiry_product ${product["title"]}`
                            },
                            {
                                type: "postback",
                                title: "Add to Cart",
                                payload: `cart_add ${product["title"]}`
                            }
                        ]
                    };
                })
            }
        }
    };
    return response;
}

// Response on confirmation of product added to cart and quick replies
function generateAddCartResponse(sender_psid, product_name, quantity) {
    // TODO: Add product to cart in db

    return {
        text: `Added ${quantity} ${product_name} to cart.`,
        quick_replies: [
            {
                content_type: "text",
                title: "View Cart",
                payload: `cart_view`
            },
            {
                content_type: "text",
                title: "Checkout",
                payload: `checkout`
            }
        ]
    };
}

// Response on generic template carousel for cart
function generateViewCartResponse(sender_psid) {
    // TODO: Get cart from db
    let products = [
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
    ];
    let response = {
        attachment: {
            type: "template",
            payload: {
                template_type: "generic",
                elements: products.map(product => {
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
                })
            }
        }
    };
    return response;
}

// Response on receipt template for latest confirmed order
function generateReceiptResponse(sender_psid) {
    // TODO: Get latest order from database
    let products = [
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
    ];

    let response = {
        attachment: {
            type: "template",
            payload: {
                template_type: "receipt",
                recipient_name: "<CUSTOMER_NAME>", // Mandatory field
                order_number: "<ORDER_NUMBER>", // Mandatory field
                currency: "SGD",
                payment_method: "PayPal",
                order_url: "",
                address: {
                    street_1: "9 Straits View", // Mandatory field
                    city: "Singapore",
                    postal_code: "018937",
                    state: "SG",
                    country: "SG"
                },
                summary: {
                    subtotal: 10,
                    shipping_cost: 5,
                    total_tax: 2,
                    total_cost: 15
                },
                elements: products.map(product => {
                    return {
                        title: `${product["name"]}`,
                        subtitle: "",
                        quantity: product["quantity"],
                        price: product["price"],
                        currency: "SGD",
                        image_url: product["url"]
                    };
                })
            }
        }
    };

    return response;
}

// Response on prododuct enquiry
function generateProductEnquiryResponse(product, attribute) {
    // TODO: Get product from db, create message and generate response
    return generateResponseFromMessage("You are enquiring about the " + attribute + " of " + product);
}

// Response on prododuct enquiry
async function generateProductTypeEnquiryResponse(product_type, attribute) {
    // TODO: Get product from db, create message and generate response
    let products = await getProductsByType(product_type);
    return {
        text: `Which product are you enquiring about its ${attribute}?`,
        quick_replies: products.map(product => {
            return {
                content_type: "text",
                title: product.title,
                payload: `enquiry_product_attribute ${attribute} ${product.title}`
            }
        })
    };
}

module.exports = router;