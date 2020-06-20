const mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var Float = require('mongoose-float').loadType(mongoose);
var User = mongoose.model('User');
import { v4 as uuidv4 } from 'uuid';

const cartSchema = new mongoose.Schema({
    uid: { type: String, required: true, unique: true },
    items: [{
        pid: String,
        title: String,
        description: String,
        condition: String,
        price: Float,
        quantity: Number,
        brand: String,
        item_group_id: String,
        color: String,
        pattern: String,
        product_type: String,
        allergens: String
    }],
    totalPrice: { type: Float, required: true, default: 0.00 },
})

cartSchema.plugin(uniqueValidator, { message: 'is already taken.' });

const Cart = mongoose.model('Cart', cartSchema);

// Initial creation of a fresh cart with an item(s)
async function createCart(userId, pid, title, description, condition, price, quantity, brand, item_group_id, color, pattern, product_type, allergens) {
    const totalPrice = price * quantity;
    const cartId = uuidv4();
    var newCart = new Cart({
        uid: cartId,
        items: [{
            pid: pid,
            title: title,
            description: description,
            condition: condition,
            price: price,
            quantity: quantity,
            brand: brand,
            item_group_id: item_group_id,
            color: color,
            pattern: pattern,
            product_type: product_type,
            allergens: allergens
        }],
        totalPrice: totalPrice
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

async function addItemToCart(cartId, pid, title, description, condition, price, quantity, brand, item_group_id, color, pattern, product_type, allergens) {
    let itemData = {
        pid: pid,
        title: title,
        description: description,
        condition: condition,
        price: price,
        quantity: quantity,
        brand: brand,
        item_group_id: item_group_id,
        color: color,
        pattern: pattern,
        product_type: product_type,
        allergens: allergens
    }

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

export { createCart, checkCart, addItemToCart, deleteCart };