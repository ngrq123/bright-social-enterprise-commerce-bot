const mongoose = require('mongoose');

const ordersSchema = new mongoose.Schema({
    uid: String,
    trackingNum: Number,
    orderStatus: Number,
    orderDateTime: Date,
    orderDetails: [{name:String,pid:String,quantity:Number,price:Number}] 
    // Are we able to find a way to use Double/Float for datatypes?
})

const Order = mongoose.model('orders',ordersSchema);