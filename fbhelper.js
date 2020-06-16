//Gets users name from facebook graph api
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const fields = "currency,availability,condition,additional_image_cdn_urls,additional_variant_attributes,applinks,custom_data,commerce_insights,image_cdn_urls,id,inventory,image_url,name,ordering_index,price,product_catalog,product_group,retailer_id,retailer_product_group_id"


function getName(sender_psid,callback){
    var name = "Empty";
    request({
        url:"https://graph.facebook.com/v3.3/" + sender_psid,
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

//Gets product details from Facebook
function getProductDetails(productID,callback){
    request({
        url:"https://graph.facebook.com/v7.0/" + productID,
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



export { getname, getProductDetails };