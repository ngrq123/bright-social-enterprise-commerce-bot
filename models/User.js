const mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');

const userSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: String,
    cartId: { type: String, unique: true }
});

const User = mongoose.model('User',userSchema);

// Create user if user not found in database
function createUser(fbid,name){
    var newUser = new User({
        id:fbid,
        name:name
    });
    return newUser.save().then(doc => doc).catch(err => console.log(err));
}

function checkUser(fbid){
    return User.find({'id':fbid}).then(function(user){
        return user;
    }).catch(function(err){
        console.log(err);
    });
}

export { checkUser, createUser };