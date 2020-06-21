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
    
    
    let setOrder = await newOrder.save().then(doc => {console.log(doc); res.send(doc)}).catch(err => { console.error(err); res.send(err)});
    
    if (setOrder){
        user.cartId = undefined;
        let updateUser = user.save().then(doc => { console.log(doc); res.send(doc) }).catch(err => { console.error(err); res.send(err) });
        
        return updateUser;
    }
}

async function getOrder(user){
    let cartId = user.cartId;
    
    let getCart = await Cart.find({ uid: cartId }).then((cart) => { return cart }).catch((err) =>console.error(err))
    
    let getOrder = await Order.find({cart: getCart}).then((order) => {return order}).catch((err) => console.error(err))
    
    return getOrder

}

export{ createOrder, getOrder};