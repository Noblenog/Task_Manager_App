// repositories/taskRepository.js
const conn = require("../utils/dbconn");

// Helper function to check task priority
const checkTaskPriority = (priorityId, callback) => {
  const checkPrioritySQL = "SELECT Priority_id FROM Task_Priorities WHERE Priority_id = ?";
  conn.query(checkPrioritySQL, [priorityId], (err, result) => {
    if (err || result.length === 0) {
      return callback(err || new Error("Invalid Task_priority_id"));
    }
    callback(null);
  });
};

// Task-related functions
exports.getTasks = (whereClause, params, orderBy, callback) => {
  const selectSQL = `
    SELECT t.*, tp.Priority_name, ud.first_name, ud.last_name
    FROM Task t
    JOIN Task_Priorities tp ON t.Task_priority_id = tp.Priority_id
    JOIN Users u ON t.User_id = u.User_id
    JOIN User_details ud ON u.user_details_id = ud.user_details_id
    ${whereClause} ${orderBy}
  `;
  conn.query(selectSQL, params, callback);
};

exports.selectTask = (id, callback) => {
  const selectSQL = `
    SELECT t.*, tp.Priority_name, ud.first_name, ud.last_name
    FROM Task t
    JOIN Task_Priorities tp ON t.Task_priority_id = tp.Priority_id
    JOIN Users u ON t.User_id = u.User_id
    JOIN User_details ud ON u.user_details_id = ud.user_details_id
    WHERE t.Task_id = ?
  `;
  conn.query(selectSQL, [id], callback);
};

exports.insertTask = (vals, callback) => {
  checkTaskPriority(vals[2], (err) => {
    if (err) return callback(err);
    const insertSQL = "INSERT INTO Task (Task_name, Task_description, Task_priority_id, Task_due_date, User_id) VALUES (?, ?, ?, ?, ?)";
    conn.query(insertSQL, vals, callback);
  });
};

exports.updateTask = (vals, id, callback) => {
  checkTaskPriority(vals[2], (err) => {
    if (err) return callback(err);
    const updateSQL = "UPDATE Task SET Task_name = ?, Task_description = ?, Task_priority_id = ?, Task_due_date = ?, Task_completion_date = ? WHERE Task_id = ?";
    conn.query(updateSQL, [...vals, id], callback);
  });
};

exports.deleteTask = (id, callback) => {
  const query = 'DELETE FROM Task WHERE Task_id = ?';
  conn.query(query, [id], (err, result) => {
    if (err) {
      return callback(err);
    }
    callback(null, result);
  });
};

exports.updateTaskCompletion = (id, Task_completion, callback) => {
  const updateSQL = "UPDATE Task SET Task_completion_date = ? WHERE Task_id = ?";
  const completionDate = Task_completion ? new Date() : null;
  conn.query(updateSQL, [completionDate, id], callback);
};

// User-related functions
exports.login = (username, callback) => {
  const selectSQL = "SELECT * FROM Users WHERE User_username = ?";
  conn.query(selectSQL, [username], (err, results) => {
    if (err) return callback(err);
    if (results.length === 0) return callback(null, null);
    callback(null, results[0]);
  });
};

exports.register = (firstName, lastName, username, email, password, callback) => {
  const userDetailsSQL = "INSERT INTO User_details (first_name, last_name) VALUES (?, ?)";
  const userSQL = "INSERT INTO Users (user_details_id, User_username, User_email, User_password) VALUES (?, ?, ?, ?)";
  conn.query(userDetailsSQL, [firstName, lastName], (err, result) => {
    if (err) return callback(err);
    const userDetailsId = result.insertId;
    const userVals = [userDetailsId, username, email, password];
    conn.query(userSQL, userVals, callback);
  });
};

exports.updateEmail = (userId, email, callback) => {
  const updateSQL = "UPDATE Users SET User_email = ? WHERE User_id = ?";
  conn.query(updateSQL, [email, userId], callback);
};

exports.updatePassword = (userId, hashedPassword, callback) => {
  const updateSQL = "UPDATE Users SET User_password = ? WHERE User_id = ?";
  conn.query(updateSQL, [hashedPassword, userId], callback);
};

exports.findUserById = (userId, callback) => {
  const selectSQL = "SELECT * FROM Users WHERE User_id = ?";
  conn.query(selectSQL, [userId], (err, results) => {
    if (err) return callback(err);
    if (results.length === 0) return callback(null, null);
    callback(null, results[0]);
  });
};

// Password reset functions
exports.saveResetToken = (email, token, expires, callback) => {
  const findUserSQL = "SELECT * FROM Users WHERE User_email = ?";
  const updateSQL = "UPDATE Users SET reset_password_token = ?, reset_password_expiry = ? WHERE User_email = ?";

  conn.query(findUserSQL, [email], (err, results) => {
    if (err) return callback(err);
    if (results.length === 0) {
      return callback(new Error('No account with that email address exists.'));
    }

    conn.query(updateSQL, [token, expires, email], (err) => {
      if (err) return callback(err);
      callback(null);
    });
  });
};

exports.verifyResetToken = (token, callback) => {
  const selectSQL = "SELECT * FROM Users WHERE reset_password_token = ? AND reset_password_expiry > NOW()";
  conn.query(selectSQL, [token], (err, results) => {
    if (err) return callback(err);
    if (results.length === 0) return callback(null, null);
    callback(null, results[0]);
  });
};

// Stats-related functions
exports.getUserStats = (user_id) => {
  return new Promise((resolve, reject) => {
    const totalTasksSQL = "SELECT COUNT(*) AS totalTasks FROM Task WHERE User_id = ?";
    const completedTasksSQL = "SELECT COUNT(*) AS completedTasks FROM Task WHERE User_id = ? AND Task_completion_date IS NOT NULL";
    const tasksCompletedPerMonthSQL = `
      SELECT DATE_FORMAT(Task_completion_date, '%Y-%m') AS month, COUNT(*) AS count
      FROM Task
      WHERE User_id = ? AND Task_completion_date IS NOT NULL
      GROUP BY DATE_FORMAT(Task_completion_date, '%Y-%m')
    `;
    const completionRateByPrioritySQL = `
      SELECT tp.Priority_name AS Task_priority, COUNT(*) AS count
      FROM Task t
      JOIN Task_Priorities tp ON t.Task_priority_id = tp.Priority_id
      WHERE t.User_id = ? AND t.Task_completion_date IS NOT NULL
      GROUP BY tp.Priority_name
    `;
    const tasksByStatusSQL = `
      SELECT 
        COUNT(CASE WHEN Task_completion_date IS NOT NULL THEN 1 END) AS completed,
        COUNT(CASE WHEN Task_completion_date IS NULL THEN 1 END) AS inProgress
      FROM Task
      WHERE User_id = ?
    `;

    conn.query(totalTasksSQL, [user_id], (err, totalTasksResult) => {
      if (err) return reject(err);

      conn.query(completedTasksSQL, [user_id], (err, completedTasksResult) => {
        if (err) return reject(err);

        conn.query(tasksCompletedPerMonthSQL, [user_id], (err, tasksCompletedPerMonthResult) => {
          if (err) return reject(err);

          conn.query(completionRateByPrioritySQL, [user_id], (err, completionRateByPriorityResult) => {
            if (err) return reject(err);

            conn.query(tasksByStatusSQL, [user_id], (err, tasksByStatusResult) => {
              if (err) return reject(err);

              resolve({
                totalTasks: totalTasksResult[0].totalTasks,
                completedTasks: completedTasksResult[0].completedTasks,
                tasksCompletedPerMonth: tasksCompletedPerMonthResult,
                completionRateByPriority: completionRateByPriorityResult,
                tasksByStatus: tasksByStatusResult[0]
              });
            });
          });
        });
      });
    });
  });
};
