//Gets users name from facebook graph api
const request = require("request");
const CATLOG_ID = process.env.CATLOG_ID;
const fields = "currency,availability,condition,id,inventory,image_url,name,price,retailer_id,retailer_product_group_id,description,custom_label_0,pattern,product_type,color,url,product_group";
const uri = "https://graph.facebook.com/v7.0/"

function getName(PAGE_ACCESS_TOKEN,sender_psid,callback){
    var name = "Empty";
    request({
        url:uri + sender_psid,
        qs:{
            access_token: PAGE_ACCESS_TOKEN,
            fields: "first_name",
        },
        method:"GET"
    }, function(error,response,body){
        if (error){
            console.log(error)
        }else{
            var bodyObj = JSON.parse(body);
            name = bodyObj.first_name;
            console.log("Name: " + name);
            return callback(name)
        }
    });
    return name;
}

//Get all products with their ID from Facebook
function getAllProducts(PAGE_ACCESS_TOKEN,appsecret_proof){
    request({
        url: uri + CATLOG_ID,
        qs:{
            access_token: PAGE_ACCESS_TOKEN,
            appsecret_proof: appsecret_proof
        },
        method:"GET"
    }, function(error,response,body){
        if (error){
            console.log(error)
        }else{
            var bodyObj = JSON.parse(body);
            console.log(bodyObj)
        }
    });
}


//Gets product details from Facebook
function getProductDetails(productID,callback){
    request({
        url:uri + productID,
        qs:{
            access_token: PAGE_ACCESS_TOKEN,
            fields:reqFields,
        },
        method:"GET"
    }, function(error,response,body){
    if (error){
            console.log(error)
        }else{
            var bodyObj = JSON.parse(body);
            console.log(bodyObj)
            return callback(bodyObj)
        }
    });
}



export { getName, getAllProducts, getProductDetails };