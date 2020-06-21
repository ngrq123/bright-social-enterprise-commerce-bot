var router = require('express').Router();
// For testing endpoints
import { createOrder, getOrder} from '../../models/Order';
import { checkUser, createUser} from '../../models/User';
import { createCart, checkCart, deleteCart, addItemToCart, removeAllItemsFromCart } from '../../models/Cart';

router.get("/", async (req,res) =>{
    let body = req.body;
    
    // createCart(2750198608418534, 3060724697352196, 1)
    // checkCart(2750198608418534)
    // deleteCart(2750198608418534, "12f8cbf9-e7bd-49b1-8789-33ce0d54b93d")
    // addItemToCart("392a4341-a3a4-415a-97de-0a9b1b9920c4", 3060724697352196, 1)
    // removeAllItemsFromCart("392a4341-a3a4-415a-97de-0a9b1b9920c4")
    
});

module.exports = router;