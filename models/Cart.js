const mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var Float = require('mongoose-float').loadType(mongoose);
var User = mongoose.model('User');
import { v4 as uuidv4 } from 'uuid';

const cartSchema = new mongoose.Schema({
    uid: { type: String, required: true, unique: true },
    // items: [{
        // pid: String,
        // title: String,
        // description: String,
        // condition: String,
        // price: Float,
        // quantity: Number,
        // brand: String,
        // item_group_id: String,
        // color: String,
        // pattern: String,
        // product_type: String,
        // allergens: String
    // }],
    items: [{
        pid: String,
        quantity: Float
        }]
    // totalPrice: { type: Float, required: true, default: 0.00 },
})

cartSchema.plugin(uniqueValidator, { message: 'is already taken.' });

const Cart = mongoose.model('Cart', cartSchema);

// Initial creation of a fresh cart with an item(s)
async function createCart(userId, pid, quantity) {
    // const totalPrice = price * quantity;
    const cartId = uuidv4();
    var newCart = new Cart({
        uid: cartId,
        items: [{
            pid: pid,
            quantity: quantity
        }]
        // totalPrice: totalPrice
    })
    await User.findById(userId).then((user) => {
        if (!user) { return res.status(401).send('User doesnt exist!'); }

        const query_param_userId = user._id;
        const user_cartId = newCart.uid;

        User.findByIdAndUpdate(query_param_userId, { "cartId": user_cartId },{ new: true }, function (err, result) {
            if (err) {
                res.send(err)
                console.error(err)
            }
            else {
                res.send(result)
                console.log(result)
            }
        })
    }).catch(err => { console.error(err); res.send(err) })
    let setCart = await newCart.save().then(doc => { console.log(doc); res.send(doc) }).catch(err => { console.error(err); res.send(err) });

    return setCart
}

//Check for user active cart
async function checkCart(userId) {

    let getCartId = await User.findById(userId).then((user) => {
        if (!user) { return res.status(401).send('User doesnt exist!'); }

        const cartId = user.cartId;

        return cartId
    })

    let getCart = await Cart.find({ uid: getCartId }).then((result) => { return result }).catch((err) => console.error(err))

    return getCart
}

async function addItemToCart(cartId, pid, quantity) {
    let itemData = {
        pid: pid,
        quantity: quantity
    }
    
    let getCart = await Cart.find({ uid: getCartId }).then((result) => { return result }).catch((err) => console.error(err));
    
    
    let addItem = await Cart.findOneAndUpdate(
        { uid: cartId },
        { $push: { items: itemData } },
        { new: true },
        (error, success) => {
            if (error) {
                console.error(error);
            } else {
                console.log(success);
            }
        }
    )

    return addItem

}

async function removeItemFromCart(cartId, pid){
    let getCart = await Cart.find({ uid: getCartId }).then((result) => { return result }).catch((err) => console.error(err));
    
    products = getcart.items;
    
    newProducts = [];
    
    for (var i =0; i<products.length; i++){
        product = products[i];
        if (product.pid !== pid){
            newProducts.push(product);
        }
    }
    
    getCart.items = newProducts;
    
    let updateCart = getCart.save().then(doc => { console.log(doc); res.send(doc) }).catch(err => { console.error(err); res.send(err) });
    
    return updateCart;
}

async function deleteCart(userId, cartId) {

    await User.find({id: userId}).then((user) => {
        if (!user) { return res.status(401).send('User doesnt exist!'); }

        const query_param_userId = user._id;
        const user_cartId = null;

        User.findByIdAndUpdate(query_param_userId, { "cartId": user_cartId },{ new: true }, function (err, result) {
            if (err) {
                res.send(err)
                console.error(err)
            }
            else {
                res.send(result)
                console.log(result)
            }
        })
    }).catch(err => { console.error(err); res.send(err) })
    await Cart.findOneAndDelete({ uid: cartId },
        (error, success) => {
        if (error) {
            console.error(error);
        } else {
            console.log(success);
        }
    })
}

export { createCart, checkCart, addItemToCart, removeItemFromCart, deleteCart };