const mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var User = mongoose.model('Cart');
var User = mongoose.model('User');

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

