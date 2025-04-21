const mysql = require("mysql2"); // Import mysql


const db = mysql.createConnection({ // Create a connection to the database
  host: "localhost",
  user: "root",
  password: "root",
  database: "Task_Manager_database",
  port: "8889",
});


db.connect((err) => { // Connect to the database
  if (err) {
    throw err;
  }
  console.log(`Database connection successful to ${db.config.database} on thread ${db.threadId}`);
});

module.exports = db; // Export the connection
