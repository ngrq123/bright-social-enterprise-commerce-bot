const mongoose = require('mongoose');


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
