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

const Product = mongoose.model('Product',productsSchema);


//Get all products
function getAllProducts(){
    return Product.find({}).then(function(products){
        return products;
    }).catch(function(err){
        console.log(err);
    });
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

export { getAllProducts, getProductsByType, getProductByID, getProductPrice, getProductDesc, getProductsByName, getProductByNameVar };