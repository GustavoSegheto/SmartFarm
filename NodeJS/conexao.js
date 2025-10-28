let mysql = require('mysql2');

let con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "farm_db",
    port: 3306
});

con.connect(function(err) {
    if(err) throw err;
    console.log("Connected!");
});