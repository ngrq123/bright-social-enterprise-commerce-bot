# Bright: Social Enterprise Commerce Bot

Video Link: [https://youtu.be/MO_p3ylFNxU](https://youtu.be/MO_p3ylFNxU)

**Video Link: [https://youtu.be/MO_p3ylFNxU](https://youtu.be/MO_p3ylFNxU)**

## Inspiration
With the roll-out of Facebook Shops, there can be stronger social connections between customers and the retailers. As we looked into how we can improve the online shopping experience for users, we really wanted to work on a project that is meaningful. In this project, we hope to create a commerce bot for social enterprises to continue to receive income through an online business model. This bot allows customers to have conversational experiences that cannot be found in a web-based application.

## What it does
Small businesses often lack resources to expand their ecommerce businesses. Bright, the social enterprise commerce bot, helps small businesses who contribute towards a social good to set up an online customer service chatbot in an easy and intuitive way where the customers could see the impact of their online purchase.

- Customers are just one chat away from getting more information about the store products. Bright will provide human-like responses to questions about items and it learns from customers’ responses over time with Wit.ai natural language processing model
- Bright comes packed with features to shop in-chat, make payment and check status of orders through integration with enterprise database
- What sets Bright apart from any other commerce app is its capability to show the social impact upon checkout (i.e. the number of beneficiaries the customers’ purchase has helped!)
- When customers show their interest or gratitude, Bright can also prompt customers to like and follow their Facebook page to subscribe to the latest updates

## How we built it

### Ideate

In our preliminary brainstorm, we identified conversational commerce as our focus context. We believe we could enhance buyer-seller relationships through Facebook messenger interactions to create trust in online purchase.

![ideate_1](https://raw.githubusercontent.com/ngrq123/fb-messenger-hackathon/master/assets/ideate_1.jpg)

There are 3 customer segments: (1) Customers (2) Sellers (3) Middlemen. We are driven to focus on the customers’ experience as they would make up the majority of our end-users.

Through market research, we found that most messenger apps enable ecommerce to build chatbot solutions to reach out to more customers instead of thinking in the customers’ perspective.

We populated our idea board with the greatest pain points for the customers. **We realised that most of the time customers are troubled by (1) difficulty in finding product (2) lack of pricing transparency (3) complicated checkout system.**

![ideate_2](https://raw.githubusercontent.com/ngrq123/fb-messenger-hackathon/master/assets/ideate_2.jpg)

To validate our hypothesis, we found that Facebook and Boston Consulting Group had surveyed over 8864 individuals in 2019. The findings were congruent with our top pain point which is to enable users to find additional information on products.

![chat_based_buying_reasons_e27_abudheen](https://raw.githubusercontent.com/ngrq123/fb-messenger-hackathon/master/assets/chat_based_buying_reasons_e27_abudheen.png)

Source: [https://e27.co/southeast-asia-emerges-as-leader-in-conversational-commerce-thailand-vietnam-most-advanced-in-adoption-20191031/](https://e27.co/southeast-asia-emerges-as-leader-in-conversational-commerce-thailand-vietnam-most-advanced-in-adoption-20191031/)

### Define

With the user pain points in mind, we conceptualised features that could solve customers’ underlying needs through a messenger app. We prioritised and concluded that we should develop a messenger app that automates customer service. There were also other impactful and easy to implement features like loyalty programmes, but these are nice-to-have instead of must-have features.

![define](https://raw.githubusercontent.com/ngrq123/fb-messenger-hackathon/master/assets/ideate_2.jpg)

With the Bright app, we hope to reach the following success.

> **Business Objective**: Reduce the man hours for customer service

> **Success metrics**: High conversion rate of chat to sales funnel

### Prototype

With 2 weeks to develop our prototype, we outlined our steps and set a timeline to ensure we reach each of the milestones.

1. Set up business server (Express js): Creating webhook
   - Create Facebook app
   - Connect business server to Facebook app through Facebook developer platform
   - Connect Facebook page to Facebook app through Facebook developer platform
2. Test conversation between Facebook Messenger and business server
3. Develop user flow for chat responses and quick replies
4. Automate Customer Service: Product Enquiry
   - Create database with user and product information
   - Create sample question and answers for the product
   - Question → Wit.ai Natural Language Processing → Context → Retrieve Answer → Send Response
   - Implement product enquiry Q&A
5. Automate Customer Service: Order Enquiry
   - Populate database with order information
   - Implement shipping and delivery Q&A
6. Automate Customer Service: Payment
   - Populate database (MongoDB) with payment information
   - Implement in chat bot
7. Social impact notification upon checkout
8. QA and Iterate

## Challenges that we ran into

- Copious amounts of data is required in order for Wit.ai natural language processing model to correctly identify the message’s intent, entities and traits
- We integrated with Facebook Shop page to automatically store users’ conversations to our Wit.ai app to validate, tag and train the model for better precision and recall
- Difficulty in accessing Facebook’s Marketing API when we attempt to add additional labels to product listings which also requires knowledge of the Graph API
- As our app was in development mode, we were not able to gain public page content access: we had to migrate our data to an external database
- We were unable to utilise this in development mode due to public page content access, and have to migrate all data to the database
- Integration with MongoDB as a business database
- We had to understand how to manage synchronous and asynchronous functions to deliver dynamic responses to the user
- Implementing the end-to-end interactions between the user and backend server
- As every component is linked from interactions with users to shopping cart and order management, we had to ensure that each component integrates well with each other
- We had to do heavy regression testing on our app to check and fix code issues when new features affected our previously implemented features
- One-time notification was hard to test and implement because of the way it works
  - However, we felt that it has many uses to some of our desired use cases and we are glad that it is available for us to use in our bot

## Accomplishments that we are proud of

- Our considerations of what the market needs and thinking through the users’ underlying pain points
- Planning, managing and navigating the flow of the dialogue with different message intents made possible with natural language processing
- Building a chatbot that does not consist of only if-else decisions, we managed to have great interactions with the backend database for the order management and product recommendation feature
- Implementation of one-time notification  

## What we learned

- How to develop Facebook Messenger chatbot with the Messenger Platform
- The Facebook Graph API, Catalogue Manager and Messaging Platform - we had to ensure that we utilise the Principle of Least Privilege to only retrieve information about users that are necessary to keep the chatbot running and to preserve our users’ privacy
- Tagging, training and evaluating natural language processing models on Wit.ai

## What's next for Bright: Social Enterprise Commerce Bot

- Expand the used cases to larger organisations
- Utilise machine learning to provide personalise product recommendations based on users’ interactions on Facebook and through the chat
- Allow beneficiaries to insert their custom thank you note to the customers
- Create a web interface for social enterprise to easily set up their own bot
- Build a payment integration with Facebook Pay
- Integrate with Facebook Marketing Graph API to retrieve products from Facebook Shop to handle interactions with our application

## Built With

- Facebook Messager Platform
- Facebook Graph API
- Facebook Catalogue Manager
- Express JS
- PM2
- Wit.ai
- Glitch
- AWS EC2
- MongoDB on mLab
- Crontab
- Python

## GitHub Repository

[https://github.com/ngrq123/fb-messenger-hackathon](https://github.com/ngrq123/fb-messenger-hackathon)

## Installation

`npm i`

## Routes 

`https://<url>/api/test`

`https://<url>/api/webhooks`

## Product Images

Chocolate Chip Cookies: [https://unsplash.com/photos/kID9sxbJ3BQ](https://unsplash.com/photos/kID9sxbJ3BQ)

Coconut Cookies: [https://unsplash.com/photos/YwKgwIiV_F8](https://unsplash.com/photos/YwKgwIiV_F8)

Earl Grey Sunflower Seeds Cookies: [https://unsplash.com/photos/WCx938-AvoE](https://unsplash.com/photos/WCx938-AvoE)

Tumbler: [https://www.pexels.com/photo/brown-tumbler-filled-with-coffee-1862401/](https://www.pexels.com/photo/brown-tumbler-filled-with-coffee-1862401/)

Bottle: [https://www.pexels.com/photo/vacuum-flask-on-brown-wooden-dock-1188649/](https://www.pexels.com/photo/vacuum-flask-on-brown-wooden-dock-1188649/)

Muffin: [https://www.pexels.com/photo/chocolate-muffin-top-with-chocolate-chips-131899/](https://www.pexels.com/photo/chocolate-muffin-top-with-chocolate-chips-131899/)