var router = require('express').Router();
// For testing endpoints
import { createOrder, getOrder} from '../../models/Order';
import { checkUser, createUser} from '../../models/User';
import {getProductsByAllergens} from '../../models/Product';
import {addItemToCart, removeItemFromCart} from '../../models/Cart';

router.get("/", async (req,res) =>{
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
    // getProductDesc('3060724697352196').then(function(description){
        // console.log(description);
    // });
    // getProductsByName('Earl Grey Sunflower Seeds Cookies').then(function(prod){
        // console.log(prod);
    // });
    // getProductByNameVar('Earl Grey Sunflower Seeds Cookies','Gift box').then(function(prod){
    //     console.log(prod);
    // });
    // let products = await getProductsByAllergens("dairy");
    // console.log(products)
    //removeItemFromCart('688d2689-e361-4394-b97d-227d01c3bfeb','3060724697352196');
    let user = await checkUser("3935700636471729");
    // let order = await createOrder(user);
    // console.log(order);
    let order = await getOrder(user);
    console.log(order);
    
    res.status(200).send("Success :)");
    
});

module.exports = router;