let request = require('request');
let mongoose = require('mongoose');
let router = require('express').Router();
import { getAllProducts, getProductsByType, getProductByID, getProductPrice, getProductDesc, getProductsByName, getProductByNameVar, getProductsByDefaultId } from '../../models/Product';
import { checkUser, createUser } from '../../models/User';
import { getName } from '../../helpers/fbhelper';
import { checkCart, addItemToCart, createCart, removeItemFromCart, removeAllItemsFromCart, deleteCart } from '../../models/Cart';
import { createOrder, getOrder, getAllOrders } from '../../models/Order';

let PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

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
        body.entry.forEach(async function (entry) {
            // Gets the message. entry.messaging is an array, but
            // will only ever contain one message, so we get index 0
            let webhook_event = entry.messaging[0];
            // console.log(webhook_event);

            // Get the sender PSID
            let sender_psid = webhook_event.sender.id;
            // console.log("Sender PSID: " + sender_psid);

            let user = await checkUser(sender_psid);
            if (!user) {
                // Get the sender's name
                let name = await getName(PAGE_ACCESS_TOKEN, sender_psid);
                user = await createUser(sender_psid, name);
            }
            
            // Check if the event is a message or postback and
            // pass the event to the appropriate handler function
            if (webhook_event.message) {
                
                if (webhook_event.message.quick_reply) {
                    handlePostback(sender_psid, webhook_event.message.quick_reply);
                } else {
                    handleMessage(sender_psid, webhook_event.message);
                }

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
async function handlePostback(sender_psid, received_postback) {
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
    if (postback_intent === "recommendation") {
        response = await generateRecommendationsResponse([]);
    } else if (postback_intent === "cart_add") {
        
        if (postback_content.indexOf(" ") === -1) {
            // No quantity
            let product = await getProductByID(postback_content);
            // Add to cart
            response = await generateAddCartResponse(sender_psid, product, 1);
        } else {
            let product_id = postback_content.substring(0, postback_content.indexOf(" "));
            let quantity = parseInt(postback_content.substring(postback_content.indexOf(" ")))

            // Get product
            let product = await getProductByID(product_id);
            response = await generateAddCartResponse(sender_psid, product, quantity);
        }

    } else if (postback_intent === "cart_view") {
        response = await generateViewCartResponse(sender_psid);
    } else if (postback_intent === "cart_remove") {
        response = await generateRemoveCartResponse(sender_psid, postback_content);
    } else if (postback_intent === "enquiry_delivery") {
        response = await generateDeliveryEnquiryResponse(sender_psid);
    } else if (postback_intent === "enquiry_delivery_status_order") {
        response = await generateDeliveryEnquiryResponse(sender_psid, {status_order: true}, postback_content);
    } else if (postback_intent === "enquiry_delivery_estimated_arrival") {
        response = await generateDeliveryEnquiryResponse(sender_psid, {estimated_arrival: true}, postback_content);
    } else if (postback_intent === "enquiry_product") {
        postback_content = (payload.indexOf(" ") === -1) ? "products": postback_content;
        response = generateResponseFromMessage(
            `What would you like to know about our ${postback_content}?`
        );
    } else if (postback_intent === "enquiry_product_attribute") {
        let attribute = postback_content.substring(0, postback_content.indexOf(" "));
        let product = postback_content.substring(
            postback_content.indexOf(" ") + 1,
            postback_content.length
        );
        response = await generateProductEnquiryResponse(product, attribute);
    } else if (postback_intent === "checkout") {
        response = await generateCheckoutResponse(sender_psid);
    } else if (postback_intent === "paid") {
        response = await generatePaymentResponse(sender_psid);
    } else if (postback_intent === "receipt_view") {
        response = await generateReceiptResponse(sender_psid, postback_content);
    } else if (postback_intent === "enquiry_general_organisation") {
        response = generateResponseFromMessage("Bright is a social enterprise where we provide vocational training to adults with intellectual disabilities.\n\n" +
        "We started a range of social enterprise projects to provide alternative work engagement opportunities for our adult trainees. " + 
        "Some of the projects began as therapy programmes which encourage the development of fine motor skills; others provide a realistic vocational training environment.\n\n" +
        "All net revenue earned from the sale of our products and services go towards paying a monthly allowance for our clients' work, as well as their lunch expenses while undergoing training.");
    } else if (postback_intent === "enquiry_general_profit") {
        response = generateResponseFromMessage("All net revenue earned from the sale of our products and services go towards paying a monthly allowance for our clients' work, as well as their lunch expenses while undergoing training.");
    } else if (postback_intent === "thanking") {
        response = generateResponseFromMessage("We are glad to have you with us.\n\nLike our Facebook page http://fb.me/brightsocialsg to stay updated, or check our website for volunteering opportunities!");
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
async function processMessage(sender_psid, message) {
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
                        response = await generateProductEnquiryResponse(product, attribute);
                    } else if (entities["product_type"] && entities["product_attribute"]) {
                        // Handle product type enquiry with attribute
                        let product_type = entities["product_type"][0]["value"];
                        let attribute = entities["product_attribute"][0]["value"];
                        response = generateProductTypeEnquiryResponse(product_type, attribute);
                    } else if (entities["product_type"]) {
                        // Handle product type enquiry
                        let product_types = entities["product_type"].map(p => p["value"]);
                        response = generateRecommendationsResponse(product_types);
                    } else {
                        response = defaultResponse;
                    }
                } else if (intent_subcategory === "general") {
                    let messages = {
                        organisation: "Bright is a social enterprise where we provide vocational training to adults with intellectual disabilities.\n\n" +
                            "We started a range of social enterprise projects to provide alternative work engagement opportunities for our adult trainees. " + 
                            "Some of the projects began as therapy programmes which encourage the development of fine motor skills; others provide a realistic vocational training environment.\n\n" +
                            "All net revenue earned from the sale of our products and services go towards paying a monthly allowance for our clients' work, as well as their lunch expenses while undergoing training.",
                        profit:
                            "All net revenue earned from the sale of our products and services go towards paying a monthly allowance for our clients' work, as well as their lunch expenses while undergoing training.",
                        manufacturer:
                            "We support adults with intellectual disabilities. We started a range of social enterprise projects to provide alternative work engagement for our adult trainees.",
                        products: "We sell craft and baker goods.\nLike our Facebook page http://fb.me/brightsocialsg to stay updated!",
                        safety: "Our cookies are made by our clients in a clean and sanitised environment. The cookies are safe to consume before the expiry date that is printed on the packaging."
                    };
                    // Loop through message keys (entity) and find if entity is in entities
                    Object.keys(messages).forEach(entity => {
                        if (response == null && entities[entity]) {
                            response = generateResponseFromMessage(messages[entity]);
                        }
                    });
                } else if (intent_subcategory === "delivery") {
                    response = await generateDeliveryEnquiryResponse(sender_psid, entities);
                } else if (intent_subcategory === "order") {
                    // Handle order enquiry
                    return {
                        text: "Hi there! You can populate your cart under view products or by sending us a message. Once you have added the products to cart, you can checkout and proceed to payment.",
                        quick_replies: [
                            {
                                content_type: "text",
                                title: "Recommend products",
                                payload: "recommendation"
                            },
                            {
                                content_type: "text",
                                title: "View cart",
                                payload: "cart_view"
                            }
                        ]
                    };
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
                    let products = await getProductsByName(product_name);

                    if (products.length === 0) {
                        response = generateResponseFromMessage("We do not have this product: " + product_name);
                    } if (products.length === 1) {
                        // Product has no variation
                        response = await generateAddCartResponse(
                            sender_psid,
                            products[0],
                            quantity
                        );
                    } else {
                        response = await generateSelectProductVariationResponse(products, quantity);
                    }
                    
                } else if (intent_subcategory === "view") {
                    response = await generateViewCartResponse(sender_psid);
                }
                break;

            case "checkout":
                response = await generateCheckoutResponse(sender_psid);
                break;
            
            case "receipt":
                // Get latest order
                response = await generateSelectReceiptResponse(sender_psid);
                break;

            case "thanking":
                response = generateResponseFromMessage("We are glad to have you with us.\n\nLike our Facebook page http://fb.me/brightsocialsg to stay updated, or check our website for volunteering opportunities!");
                break;

            default:
                response = defaultResponse;
        }

        response = response == null ? defaultResponse : response;
        return response;
    } else if (is_greeting) {
        // Message has no intent, just greeting
        // Quick replies of chatbot functionalities (recommendations, check order status, product enquiry)
        return {
            text: "Hi there! Welcome to Bright. How can I help you?",
            quick_replies: [
                {
                    content_type: "text",
                    title: "Recommend products",
                    payload: "recommendation"
                },
                {
                    content_type: "text",
                    title: "Check order status",
                    payload: "enquiry_delivery"
                },
                {
                    content_type: "text",
                    title: "Enquire product",
                    payload: "enquiry_product"
                }
            ]
        };
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
    let products = [];

    if (product_types.length === 0) {
        products = await getAllProducts();
    } else {
        async function getProductsByTypes(product_types, products) {
            for (let idx = 0; idx < product_types.length; idx++) {
                let type = product_types[idx];
                let to_add = await getProductsByType(type);
                products = await products.concat(to_add);
            }
            return products;
        }
        products = await getProductsByTypes(product_types, products);
        products = products.reduce((acc, val) => acc.concat(val), []);
    }

    if (products.length === 0) {
        return generateResponseFromMessage("We do not have any products of type " + product_types.join(", "));
    }

    // Merge product variations
    let products_merged = products.reduce((acc, p) => {
        acc[p.title] = [...acc[p.title] || [], p];
        return acc;
    }, {});

    let response = {
        attachment: {
            type: "template",
            payload: {
                template_type: "generic",
                elements: Object.keys(products_merged).map(title => {
                    let product = products_merged[title][Math.floor(Math.random() * products_merged[title].length)];
                    return {
                        title: product["title"],
                        // Recommend random variation
                        subtitle: (product.pattern) ? `(${product["pattern"]}) $${product["price"].toFixed(2)}` : `$${product["price"].toFixed(2)}`,
                        image_url: product["image_link"],
                        buttons: [
                            {
                                type: "postback",
                                title: "Learn More",
                                payload: `enquiry_product ${product["title"]}`
                            }, 
                            {
                                type: "postback",
                                title: `Add to Cart`,
                                payload: `cart_add ${product.pid}`
                            }
                        ]
                    };
                })
            }
        }
    };
    return response;
}

// Response on product variation
async function generateSelectProductVariationResponse(products, quantity) {
    let product_name = products[0].title;

    return {
        attachment: {
            type: "template",
            payload: {
                template_type: "button",
                text: `Select the variation for ${product_name}`,
                buttons: products.map(p => {
                    return {
                        type: "postback",
                        title: p.pattern,
                        payload: `cart_add ${p.pid} ${quantity}`
                    }
                })
            }
        }
    };
}

// Response on confirmation of product added to cart and quick replies
async function generateAddCartResponse(sender_psid, product, quantity) {
    // Add product to cart in db
    let user = await checkUser(sender_psid);
    let cart = await checkCart(user.id);

    if (!cart) {
        console.log("Create cart");
        cart = await createCart(user.id, product.pid, quantity);
    } else {
        console.log("Update cart " + cart.uid);
        cart = await addItemToCart(cart.uid, product.pid, quantity);
    }

    if (!cart) return generateResponseFromMessage("Failed to update cart");

    let text = `Added ${quantity} ${product.title} to cart.`;
    if (product.pattern) text = `Added ${quantity} ${product.title} (${product.pattern}) to cart.`;

    return {
        text: text,
        quick_replies: [
            {
                content_type: "text",
                title: "View more products",
                payload: "recommendation"
            },
            {
                content_type: "text",
                title: "View cart",
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

async function generateRemoveCartResponse(sender_psid, product_id) {
    // Remove product to cart in db
    let user = await checkUser(sender_psid);
    let cart = await checkCart(user.id);
    let product = await getProductByID(product_id);

    if (!cart) {
        return {
            text: "Your cart is empty.",
            quick_replies: [
                {
                    content_type: "text",
                    title: "View products",
                    payload: "recommendation"
                }
            ]
        };
    } else {
        console.log("Update cart " + cart.uid);
        cart = await removeItemFromCart(cart.uid, product.pid);

        if (!cart) return generateResponseFromMessage("Failed to update cart");
    }

    return {
        text: `Removed all ${product.title} from cart.`,
        quick_replies: [
            {
                content_type: "text",
                title: "View more products",
                payload: "recommendation"
            },
            {
                content_type: "text",
                title: "View cart",
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
async function generateViewCartResponse(sender_psid) {
    // Get cart from db
    let user = await checkUser(sender_psid);
    let cart = await checkCart(user.id);
    
    if (!cart || cart.items.length === 0) {
        return {
            text: "Your cart is empty.",
            quick_replies: [
                {
                    content_type: "text",
                    title: "View products",
                    payload: "recommendation"
                }
            ]
        };
    }

    async function getProductsByIds(product_ids, products) {
        for (let idx = 0; idx < product_ids.length; idx++) {
            let id = product_ids[idx];
            let to_add = await getProductByID(id);
            products = await products.concat(to_add);
        }
        return products;
    }
    
    let products = await getProductsByIds(cart.items.map(i => i.pid), []);

    let response = {
        attachment: {
            type: "template",
            payload: {
                template_type: "generic",
                elements: products.map((product, idx) => {
                    return {
                        title: product["title"],
                        subtitle: (product.pattern) ? `${product.pattern}, Qty: ${cart.items[idx].quantity} ($${product["price"].toFixed(2)} each)` : `Qty: ${cart.items[idx].quantity} ($${product["price"].toFixed(2)} each)`,
                        image_url: product["image_link"],
                        buttons: [
                            {
                                type: "postback",
                                title: "Add 1",
                                payload: `cart_add ${product.pid}`
                            },
                            {
                                type: "postback",
                                title: "Remove All",
                                payload: `cart_remove ${product.pid}`
                            }
                        ]
                    };
                })
            }
        },
        quick_replies: [
            {
                content_type: "text",
                title: "View more products",
                payload: "recommendation"
            },
            {
                content_type: "text",
                title: "Checkout",
                payload: `checkout`
            }
        ]
    };
    console.log(response.attachment.payload.elements);
    return response;
}

async function generateCheckoutResponse(sender_psid) {
    let user = await checkUser(sender_psid);
    let cart = await checkCart(user.id);
    
    if (!cart || cart.items.length === 0) {
        return {
            text: "Your cart is empty.",
            quick_replies: [
                {
                    content_type: "text",
                    title: "View products",
                    payload: "recommendation"
                }
            ]
        };
    }

    async function getProductsByIds(product_ids, products) {
        for (let idx = 0; idx < product_ids.length; idx++) {
            let id = product_ids[idx];
            let to_add = await getProductByID(id);
            products = await products.concat(to_add);
        }
        return products;
    }
    
    let products = await getProductsByIds(cart.items.map(i => i.pid), []);
    let total_price = products.map((p, i) => parseInt(p.price) * cart.items[i].quantity)
        .reduce((acc, v) => acc + v, 0);

    return {
        attachment: {
            type: "template",
            payload: {
                template_type: "button",
                text: `Your order (including shipping) will be $${(total_price + 5).toFixed(2)}.\n\nYou will be contributing to ${Math.ceil(total_price / 5)} meals for our beneficiaries.`,
                buttons: [
                    {
                        type: "postback",
                        title: "Proceed to Pay",
                        payload: "paid"
                    }
                ]
            }
        }
    };
}

async function generatePaymentResponse(sender_psid){
    
    let user = await checkUser(sender_psid);
    let cart = await checkCart(user.id);

    if (!cart || cart.items.length === 0) {
        return {
            text: "Your cart is empty.",
            quick_replies: [
                {
                    content_type: "text",
                    title: "View products",
                    payload: "recommendation"
                }
            ]
        };
    }    
    
    let order = await createOrder(user);
    
    if (order!=null){
        await deleteCart(user.id,cart.uid);
    }
    else{
        return generateResponseFromMessage("An error has occured, please contact our support team.");
    }
    
    return await generateReceiptResponse(sender_psid,order.trackingNumber);
}

async function generateSelectReceiptResponse(sender_psid) {
    let user = await checkUser(sender_psid);
    let orders = (await getAllOrders(user)).reverse();

    if (!orders || orders.length === 0) {
        return generateResponseFromMessage("You currently do not any confirmed orders.");
    }

    if (orders.length === 1) {
        return generateReceiptResponse(sender_psid, orders[0].trackingNumber);
    }

    return {
        attachment: {
            type: "template",
            payload: {
                template_type: "button",
                text: `Which order do you want the receipt for?`,
                // Only shows most recent 3 orders due to button template limit
                buttons: orders.slice(0, 3).map(order => {
                    return {
                        type: "postback",
                        title: "Order " + order.trackingNumber.substring(0, order.trackingNumber.indexOf("-")),
                        payload: `receipt_view ${order.trackingNumber}`
                    }
                })
            }
        }
    };
}

// Response on receipt template for confirmed order
async function generateReceiptResponse(sender_psid,trackingNumber) {
    // Get user's name
    let user = await checkUser(sender_psid);
    let name = user.name;
    
    // Get latest order from database
    let order = await getOrder(user,trackingNumber);
    
    if (order == null){
        return generateResponseFromMessage("You currently do not have an order.");
    }
    
    let products = order.products;
    let totalItems = 0;
    let totalPrice = 0;

    for (var i = 0; i < products.length; i++){
        let prod = products[i];
        console.log(prod);
        totalItems += prod.quantity;
        totalPrice += parseInt(prod.price) * prod.quantity;
    }

    let response = {
        attachment: {
            type: "template",
            payload: {
                template_type: "receipt",
                recipient_name: name,
                order_number: order.trackingNumber,
                currency: "SGD",
                payment_method: "PayPal",
                order_url: "",
                address: {
                    street_1: "9 Straits View",
                    city: "Singapore",
                    postal_code: "018937",
                    state: "SG",
                    country: "SG"
                },
                summary: {
                    subtotal: totalPrice,
                    shipping_cost: 5,
                    total_tax: (totalPrice+5)*0.07,
                    total_cost: totalPrice+5
                },
                elements: products.map(product => {
                    return {
                        //title: `${product["name"]}`,
                        title: product["title"],
                        subtitle: product["pattern"],
                        quantity: product["quantity"],
                        price: product["price"]*product["quantity"],
                        currency: "SGD",
                        image_url: product["image_link"]
                    };
                })
            }
        }
    };

    return response;
}

// Response on product enquiry
async function generateProductEnquiryResponse(product_name, attribute) {
    // Get product from db, create message and generate response
    let products = await getProductsByName(product_name);

    if (!products) return generateResponseFromMessage("Our " + product_name + " does not have any " + attribute + ".");

    let results = products.map(product => product[attribute]);
    results = Array.from(new Set(results)).filter(v => v != null);

    if (attribute === "price") results = results.map(r => `$${r.toFixed(2)}`);
    let parseResults = (r) => r.slice(0, r.length-1).join(", ") + " and " + r[r.length-1];
    
    if (Array.isArray(results[0])) {
        results = results[0];
        return generateResponseFromMessage("The " + attribute + " in our " + product_name + " are " + parseResults(results.map(r => r.toLowerCase())) + ".");
    }

    if (results.length === 0) {
        return generateResponseFromMessage("Our " + product_name + " does not have any " + attribute + ".");
    }
    
    if (results.length === 1) {
        return generateResponseFromMessage("The " + attribute + " of our " + product_name + " is " + results + ".");
    }
    
    return generateResponseFromMessage("We have the following variations for our " + product_name + ": " + parseResults(results) + ".");
}

// Response on prododuct enquiry
async function generateProductTypeEnquiryResponse(product_type, attribute) {
    // Get product from db, create message and generate response
    let products = await getProductsByType(product_type);
    products = products.map(p => p.title);
    products = Array.from(new Set(products));
    return {
        text: `Which product are you enquiring about its ${attribute}?`,
        quick_replies: products.map(product => {
            return {
                content_type: "text",
                title: product,
                payload: `enquiry_product_attribute ${attribute} ${product}`
            }
        })
    };
}

async function generateDeliveryEnquiryResponse(sender_psid, entities = {}, order_number = null) {
    if (entities["status_order"]) {
        // Order status
        let user = await checkUser(sender_psid);
        let orders = (await getAllOrders(user)).reverse();

        if (!orders || orders.length === 0) return generateResponseFromMessage("You do not have any orders.");

        let order = orders[0];
        if (order_number) order = orders.filter(order => order.trackingNumber === order_number)[0];

        if (!order_number) order_number = order.trackingNumber;
        let other_orders = orders.filter(order => order.trackingNumber !== order_number);

        // Only show most recent 3 orders due to button template limit
        if (other_orders.length > 3) other_orders = other_orders.slice(0, 3);

        if (other_orders.length === 0) {
            return generateResponseFromMessage(`Your order ${order.trackingNumber.substring(0, order.trackingNumber.indexOf("-"))} status is: ${order.orderStatus}.`);
        }

        return {
            attachment: {
                type: "template",
                payload: {
                    template_type: "button",
                    text: `Your latest order ${order.trackingNumber.substring(0, order.trackingNumber.indexOf("-"))} status is: ${order.orderStatus}.\n\nWould you like to check another order's status?`,
                    buttons: other_orders.map(order => {
                        return {
                            type: "postback",
                            title: "Order " + order.trackingNumber.substring(0, order.trackingNumber.indexOf("-")),
                            payload: `enquiry_delivery_status_order ${order.trackingNumber}`
                        }
                    })
                }
            }
        };
    }
    
    if (entities["estimated_arrival"]) {
        // Order estimated arrival
        if (!order_number) {
            // Order status
            let user = await checkUser(sender_psid);
            let orders = (await getAllOrders(user)).reverse();

            if (!orders || orders.length === 0) return generateResponseFromMessage("You do not have any orders.");

            return {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "button",
                        text: `Which order are you enquiring for its estimated arrival?`,
                        // Only shows most recent 3 orders due to button template limit
                        buttons: orders.slice(0, 3).map(order => {
                            return {
                                type: "postback",
                                title: "Order " + order.trackingNumber.substring(0, order.trackingNumber.indexOf("-")),
                                payload: `enquiry_delivery_estimated_arrival ${order.trackingNumber}`
                            }
                        })
                    }
                }
            };

        } else {
            // Get user's order
            let user = await checkUser(sender_psid);
            let order = await getOrder(user, order_number);

            let date = new Date(order.createdAt);
            let estimated_arrival_date = new Date(Number(date));
            estimated_arrival_date.setDate(date.getDate() + 7);

            return generateResponseFromMessage(
                `The average delivery time takes 5-7 working days. Your ordered was sent on ${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}. ` +
                `It is estimated to arrive by ${estimated_arrival_date.getFullYear()}-${estimated_arrival_date.getMonth() + 1}-${estimated_arrival_date.getDate()}.`
            );
        }
    }
    
    if (entities["cost"]) {
        return generateResponseFromMessage(
            "It is a flat fee of $5 for every order."
        );
    }

    return generateResponseFromMessage(
        "We deliver islandwide. The average delivery time takes 5-7 working days."
    );
}

module.exports = router;