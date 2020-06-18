const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    id: String,
    name: String
});

const productsSchema = new mongoose.Schema({
    id: String,
    pid: String,
    title: String,
    description: String,
    availability: String,
    inventory: String,
    condition: String,
    price: String,
    link: String,
    image_link: String,
    brand: String,
    item_group_id: String,
    color: String,
    pattern: String,
    product_type: String,
    allergens: String
});

const cartSchema = new mongoose.Schema({
    uid: String,
    pid: String,
    quantity: Number,
    price: Number
})

const ordersSchema = new mongoose.Schema({
    uid: String,
    trackingNum: Number,
    orderStatus: Number,
    orderDateTime: Date,
    orderDetails: [{name:String,pid:String,quantity:Number,price:Number}] 
    // Are we able to find a way to use Double/Float for datatypes?
})

const User = mongoose.model('users',userSchema);
const Product = mongoose.model('products',productsSchema);
const Cart = mongoose.model('cart',cartSchema);
const Order = mongoose.model('orders',ordersSchema);

// Create user if user not found in database
function createUser(fbid,name){
    var newUser = new User({
        id:fbid,
        name:name
    });
    newUser.save().then(doc => console.log(doc)).catch(err => console.log(err));
}

function checkUser(fbid){
    return User.find({'id':fbid}).then(function(user){
        return user;
    }).catch(function(err){
        console.log(err);
    });
}

//Get all products
async function getAllProducts(){
    let products = await Product.find({});
    return products;
}

//Get product by type
function getProductsByType(typeValue){
    return Product.find({'product_type':typeValue}).then(function(products){
        return products;
    }).catch(function(err){
        console.log(err);
    });
}

//Get product by ID
function getProductByID(pid){
    return Product.find({'pid':pid}).then(function(prod){
        return prod;
    }).catch(function(err){
       console.log(err) 
    });
}

// Get product Price by ID
function getProductPrice(pid){
    return Product.find({'pid':pid}).then(function(prod){
        return prod[0].price;
    }).catch(function(err){
       console.log(err) 
    });
}

// get product Desc by ID
function getProductDesc(pid){
    return Product.find({'pid':pid}).then(function(prod){
        return prod[0].description;
    }).catch(function(err){
       console.log(err) 
    });
}

// get products with all the differnt variations by Name
function getProductsByName(name){
    return Product.find({'title':name}).then(function(prod){
        return prod;
    }).catch(function(err){
       console.log(err) 
    });
}

// get product by name and variation
function getProductByNameVar(name,variation){
    return Product.find({'title':name,'pattern':variation}).then(function(prod){
        return prod;
    }).catch(function(err){
       console.log(err) 
    });
}

//Check if user has an active shopping cart
function checkCart(userID,products,quantity){
    pool.query('SELECT * FROM cart where uid=$1',[userID],(error, results) =>{
    if (error){
        throw error;
    }
    rowCount = results.rowCount;
    console.log(results)
    if (rowCount == 0){
        createCart(userID,products,quantity);
    }
    else{
        products += results.something;
        quantity += results.something;
        updateCart(userID,products,quantity);
    }})
}

// Initial creation of a fresh cart
function createCart(userID,products,quantity){
    pool.query('INSERT INTO cart(uid,products,quantity) VALUES ($1,$2,$3)',[userID,products,quantity],(error,reuslts)=>{
        if (error){
            throw error;
        }
        console.log(results.insertId);
    })
}

// Update cart if user has an active cart
function updateCart(userID,products,quantity){
    pool.query('UPDATE cart SET products=$1, quantity=$2 WHERE uid=$3',[products,quantity,userID],(error,results)=> {
        if (error){
            throw error;
        }
        console.log(results.insertId);
    })
}

export { getAllProducts, getProductsByType, getProductByID, getProductPrice, getProductDesc, getProductsByName, getProductByNameVar, checkUser, createUser };
