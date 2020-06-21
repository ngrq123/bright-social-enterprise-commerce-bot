var router = require('express').Router();
// For testing endpoints
import { createOrder, getOrder} from '../../models/Order';
import { checkUser, createUser} from '../../models/User';

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
    let user = (await checkUser("2750198608418534"))[0];
    console.log(user)
    console.log(createOrder(user));
    console.log(getOrder(user));
    res.status(200).send("Success :)");
    
});

module.exports = router;