const Pool = require('pg').Pool
const pool = new Pool({
  user: 'chatbot',
  host: 'localhost',
  database: 'fbhook',
  password: 'asdasd123',
  port: 5432,
})

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
            throw error
        }
        console.log(results.insertId)
    })
}

export { checkUser, createUser };
