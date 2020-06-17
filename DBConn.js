// const Pool = require('pg').Pool
// const pool = new Pool({
  // user: process.env.DB_USER,
  // host: process.env.DB_HOST,
  // database: process.env.DB_NAME,
  // password: process.env.DB_PASSWORD,
  // port: process.env.DB_PORT,
// })

var MongoClient = require('mongodb').MongoClient

function checkUser(fbid,name){
    var rowCount = "";
    
    pool.query('SELECT * FROM users where fbid= $1',[fbid], (error, results) => {
    if (error) {
        throw error;
    }
    
    rowCount = results.rowCount
    if (rowCount == 0){
        createUser(fbid,name);
    }
    })
    
    return rowCount;
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

//Get all products
function getAllProducts(DB_PASSWORD){
    MongoClient.connect('mongodb+srv://mongoadmin:'+DB_PASSWORD+'@fb-hack-chatbot-cevnk.mongodb.net/fbmsg', function (err, client) {
      if (err) throw err
      
      var db = client.db('fbmsg')

      db.collection('products').find().toArray(function (err, result) {
        if (err) throw err

        console.log(result)
      })
})
}

export { checkUser, createUser, getUserID, checkCart, getAllProducts };
