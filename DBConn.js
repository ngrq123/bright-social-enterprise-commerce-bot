const mongoose = require('mongoose');

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

const Product = mongoose.model('products',productsSchema);

//Get all products
function getAllProducts(){
    return Product.find({}).then(function(products){
        return products;
    }).catch(function(err){
        console.log(err);
    });
}

//Get product by type
function getProductByType(typeValue){
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

function createUser(fbid,name){
    console.log(fbid + " " + name)
    pool.query('INSERT INTO users(fbid,name) VALUES ($1,$2)',[fbid,name],(error,results) => {
        if (error){
            throw error;
        }
        console.log(results.insertId)
    })
}

function getUserID(fbid){
    var userID = "";
    
    pool.query('SELECT * FROM users where fbid=$1',[fbid],(error, results) =>{
        if (error){
            throw error;
        }
        console.log(results)
    })
    
    return userID;
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

export { getAllProducts, getProductByType, getProductByID, getProductPrice, getProductDesc };
