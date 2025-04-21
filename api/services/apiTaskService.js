const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const taskRepository = require("../repositories/taskRepository");
const dayjs = require("dayjs");

// Task-related functions
exports.getTasks = async (user_id, sort, filter, callback) => {
  let orderBy = "";
  let whereClause = "WHERE 1=1";
  const params = [];

  if (user_id) {
    whereClause += " AND t.User_id = ?";
    params.push(user_id);
  }

  if (sort === "priority") {
    orderBy = "ORDER BY Task_priority_id DESC";
  } else if (sort === "due_date") {
    orderBy = "ORDER BY Task_due_date ASC";
  }

  if (filter === "high_priority") {
    whereClause += ' AND Task_priority_id = 1';
  } else if (filter === "medium_priority") {
    whereClause += ' AND Task_priority_id = 2';
  } else if (filter === "low_priority") {
    whereClause += ' AND Task_priority_id = 3';
  } else if (filter === "due_today") {
    const today = dayjs().format("YYYY-MM-DD");
    whereClause += " AND Task_due_date = ?";
    params.push(today);
  } else if (filter === "due_this_week") {
    const startOfWeek = dayjs().startOf("week").format("YYYY-MM-DD");
    const endOfWeek = dayjs().endOf("week").format("YYYY-MM-DD");
    whereClause += " AND Task_due_date BETWEEN ? AND ?";
    params.push(startOfWeek, endOfWeek);
  } else if (filter === "due_this_month") {
    const startOfMonth = dayjs().startOf("month").format("YYYY-MM-DD");
    const endOfMonth = dayjs().endOf("month").format("YYYY-MM-DD");
    whereClause += " AND Task_due_date BETWEEN ? AND ?";
    params.push(startOfMonth, endOfMonth);
  }

  taskRepository.getTasks(whereClause, params, orderBy, callback);
};

exports.selectTask = (id, callback) => {
  taskRepository.selectTask(id, callback);
};

exports.createTask = (taskData, callback) => {
  const vals = [
    taskData.Task_name,
    taskData.Task_description,
    taskData.Task_priority_id,
    taskData.Task_due_date,
    taskData.User_id
  ];

  taskRepository.insertTask(vals, (err, result) => {
    if (err) {
      console.error("Error creating task:", err);
      return callback(err);
    }
    callback(null, result);
  });
};

exports.updateTask = (id, taskData, callback) => {
  const vals = [
    taskData.Task_name,
    taskData.Task_description,
    taskData.Task_priority_id,
    taskData.Task_due_date,
    taskData.Task_completion_date
  ];

  console.log("Updating task with values:", vals);

  taskRepository.updateTask(vals, id, (err, result) => {
    if (err) {
      console.error("Error updating task:", err);
      return callback(err);
    }
    callback(null, result);
  });
};

exports.deleteTask = (id, callback) => {
  taskRepository.deleteTask(id, callback);
};

exports.updateTaskCompletion = (id, Task_completion, callback) => {
  const completionStatus = Task_completion ? 1 : 0;
  taskRepository.updateTaskCompletion(id, completionStatus, callback);
};

// User-related functions
exports.getUserStats = (user_id, callback) => {
  taskRepository.getUserStats(user_id)
    .then(stats => {
      const completionRateByPriority = {
        high: stats.completionRateByPriority.find(item => item.Task_priority === 'High')?.count || 0,
        medium: stats.completionRateByPriority.find(item => item.Task_priority === 'Medium')?.count || 0,
        low: stats.completionRateByPriority.find(item => item.Task_priority === 'Low')?.count || 0
      };

      callback(null, {
        ...stats, completionRateByPriority
      });
    })
    .catch(err => {
      callback(err);
    });
};

exports.login = (username, userpass, callback) => {
  taskRepository.login(username, async (err, user) => {
    if (err) return callback(err);
    if (!user) return callback(null, false, { message: 'Incorrect username.' });

    const match = await bcrypt.compare(userpass, user.User_password);
    if (match) {
      const token = jwt.sign({ id: user.User_id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      console.log("jwt token generated: ", token);
      callback(null, { user, token });
    } else {
      callback(null, false, { message: 'Incorrect password.' });
    }
  });
};

exports.register = async (firstName, lastName, username, email, password, callback) => {
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    taskRepository.register(firstName, lastName, username, email, hashedPassword, (err, result) => {
      if (err) return callback(err);
      const token = jwt.sign({ id: result.insertId }, process.env.JWT_SECRET, { expiresIn: '1h' });
      callback(null, { userId: result.insertId, token });
    });
  } catch (err) {
    callback(err);
  }
};

exports.updateEmail = (userId, email, callback) => {
  taskRepository.updateEmail(userId, email, callback);
};

exports.updatePassword = (userId, currentPassword, newPassword, callback) => {
  taskRepository.findUserById(userId, async (err, user) => {
    if (err) return callback(err);
    if (!user) return callback(new Error('User not found'));

    const match = await bcrypt.compare(currentPassword, user.User_password);
    if (!match) return callback(new Error('Incorrect current password'));

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    taskRepository.updatePassword(userId, hashedPassword, callback);
  });
};

// Password reset functions
exports.saveResetToken = (email, token, expires, callback) => {
  taskRepository.saveResetToken(email, token, expires, callback);
};

exports.verifyResetToken = (token, callback) => {
  taskRepository.verifyResetToken(token, callback);
};

exports.resetPassword = (userId, newPassword, callback) => {
  const saltRounds = 10;
  bcrypt.hash(newPassword, saltRounds, (err, hashedPassword) => {
    if (err) return callback(err);
    taskRepository.updatePassword(userId, hashedPassword, callback);
  });
};