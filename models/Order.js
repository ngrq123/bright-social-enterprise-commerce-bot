const mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var Cart = mongoose.model('Cart');
var User = mongoose.model('User');

import { v4 as uuidv4 } from 'uuid';

const orderSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    trackingNumber: { type: Number, unique: true },
    orderStatus: {
        type: String,
        enum : ['Order Received','Packing','Out For Delivery','Delivered','Refund'],
        default: 'Order Received'
    },
    cart: { type: mongoose.Schema.Types.ObjectId, ref: 'Cart' },
}, { timestamps: true });

orderSchema.plugin(uniqueValidator, { message: 'is already exist.' });

const Order = mongoose.model('Order', orderSchema);

// Pass in user and cart object
async function createOrder(user){
    const trackingNum = uuidv4();
    let cart = await Cart.find({uid:user.cartId}).then((cart) => {return cart}).catch((err) => console.error(err));
    
    var newOrder = new Order({
        customer: user,
        trackingNumber: trackingNum,
        cart: cart
    })
    
    
    let setOrder = await newOrder.save().then((doc) => doc).catch((err) => null);
    
    if (setOrder!=null){
        user.cartId = undefined;
        let updateUser = user.save().then((doc) => doc).catch((err) => null);
        
        return updateUser;
    }
}

async function getOrder(user){
    let cartId = user.cartId;
    
    let getCart = await Cart.find({ uid: cartId }).then((cart) => cart).catch((err) => null);
    
    let getOrder = await Order.find({cart: getCart}).then((order) => order).catch((err) => null);
    
    return getOrder;

}

export{ createOrder, getOrder};