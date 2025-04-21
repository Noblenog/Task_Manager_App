const { body, param, query, validationResult } = require('express-validator');
const taskService = require("../services/apiTaskService");

// Helper function to handle validation errors
const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
};

// Helper function to handle service responses
const handleServiceResponse = (err, result, res, successMessage) => {
  if (err) {
    console.error(successMessage, err);
    return res.status(500).json({
      status: "failure",
      message: err.message || err,
    });
  }
  res.status(200).json({
    status: "success",
    message: successMessage,
    result,
  });
};

// Task-related endpoints
exports.getTasks = [
  query('user_id').isInt().withMessage('User ID must be an integer'),
  query('sort').optional().isString().trim().escape(),
  query('filter').optional().isString().trim().escape(),
  (req, res) => {
    if (handleValidationErrors(req, res)) return;

    const { user_id, sort, filter } = req.query;
    taskService.getTasks(user_id, sort, filter, (err, rows) => {
      handleServiceResponse(err, rows, res, `${rows.length} records retrieved`);
    });
  }
];

exports.selectTask = [
  param('id').isInt().withMessage('Task ID must be an integer'),
  (req, res) => {
    if (handleValidationErrors(req, res)) return;

    const { id } = req.params;
    taskService.selectTask(id, (err, rows) => {
      if (rows.length > 0) {
        handleServiceResponse(err, rows, res, `Record ID ${id} retrieved`);
      } else {
        res.status(404).json({
          status: "failure",
          message: `Invalid ID ${id}`,
        });
      }
    });
  }
];

exports.postNewTask = [
  body('task_title').isString().trim().escape().isLength({max : 50}).withMessage('Task name must 50 characters or less'),
  body('task_description').isString().trim().escape().withMessage('Task description must be a string'),
  body('task_priority_id').isInt().withMessage('Task priority ID must be an integer'),
  body('new_date').isISO8601().toDate().withMessage('Task due date must be a valid date'),
  body('user_id').isInt().withMessage('User ID must be an integer'),
  (req, res) => {
    if (handleValidationErrors(req, res)) return;

    const taskData = {
      Task_name: req.body.task_title,
      Task_description: req.body.task_description,
      Task_priority_id: req.body.task_priority_id,
      Task_due_date: req.body.new_date,
      User_id: req.body.user_id
    };

    taskService.createTask(taskData, (err, result) => {
      handleServiceResponse(err, { insertId: result.insertId }, res, `Record ID ${result.insertId} added`);
    });
  }
];

exports.putUpdateTask = [
  param('id').isInt().withMessage('Task ID must be an integer'),
  body('task_title').isString().trim().escape().withMessage('Task name must be a string'),
  body('task_description').isString().trim().escape().withMessage('Task description must be a string'),
  body('task_priority_id').isInt().withMessage('Task priority ID must be an integer'),
  body('new_date').isISO8601().toDate().withMessage('Task due date must be a valid date'),
  body('completion_date').isISO8601().toDate().optional({ nullable: true }),
  (req, res) => {
    if (handleValidationErrors(req, res)) return;

    const { id } = req.params;
    const taskData = {
      Task_name: req.body.task_title,
      Task_description: req.body.task_description,
      Task_priority_id: req.body.task_priority_id,
      Task_due_date: req.body.new_date,
      Task_completion_date: req.body.completion_date || null
    };

    taskService.updateTask(id, taskData, (err, result) => {
      if (result.affectedRows > 0) {
        handleServiceResponse(err, result, res, `Record ID ${id} updated`);
      } else {
        res.status(404).json({
          status: "failure",
          message: `Invalid ID ${id}`,
        });
      }
    });
  }
];

exports.deleteTask = [
  param('id').isInt().withMessage('Task ID must be an integer'),
  (req, res) => {
    if (handleValidationErrors(req, res)) return;

    const { id } = req.params;
    taskService.deleteTask(id, (err, result) => {
      if (err) {
        return res.status(500).json({
          status: "failure",
          message: err.message,
        });
      }
      if (result && result.affectedRows > 0) {
        handleServiceResponse(null, result, res, `Record ID ${id} deleted`);
      } else {
        res.status(404).json({
          status: "failure",
          message: `Invalid ID ${id}`,
        });
      }
    });
  }
];

// User-related endpoints
exports.postLogin = [
  body('username').isString().trim().escape(),
  body('userpass').isString().trim().escape(),
  (req, res) => {
    if (handleValidationErrors(req, res)) return;

    const { username, userpass } = req.body;
    taskService.login(username, userpass, (err, result, info) => {
      if (err) {
        return res.status(500).json({
          status: "failure",
          message: err.message,
        });
      }
      if (!result) {
        return res.status(401).json({
          status: "failure",
          message: info.message,
        });
      }
      res.status(200).json({
        status: "success",
        message: "User authenticated",
        result: result.user,
        token: result.token,
      });
    });
  }
];



exports.postRegister = [
  body('firstName').isString().trim().escape(),
  body('lastName').isString().trim().escape(),
  body('username').isString().trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isString().trim().escape(),
  (req, res) => {
    if (handleValidationErrors(req, res)) return;

    const { firstName, lastName, username, email, password } = req.body;
    taskService.register(firstName, lastName, username, email, password, (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ error: "Username or email already exists" });
        } else {
          return res.status(500).json({ error: "Internal server error" });
        }
      }
      res.status(201).json({ 
        message: "User registered successfully",
        token: result.token
      });
    });
  }
];

exports.getUserStats = [
  query('user_id').isInt().withMessage('User ID must be an integer'),
  (req, res) => {
    if (handleValidationErrors(req, res)) return;

    const user_id = req.query.user_id;
    taskService.getUserStats(user_id, (err, stats) => {
      if (err) {
        console.error("SQL Error:", err);
        return res.status(500).json({ error: "Error fetching user stats" });
      }
      res.status(200).json(stats);
    });
  }
];

// Password reset endpoints
exports.saveResetToken = [
  body('email').isEmail().withMessage('Enter a valid email address').normalizeEmail(),
  body('token').isString().trim().escape(),
  body('expires').isISO8601().toDate(),
  (req, res) => {
    if (handleValidationErrors(req, res)) return;

    const { email, token, expires } = req.body;
    taskService.saveResetToken(email, token, expires, (err, result) => {
      handleServiceResponse(err, result, res, 'Reset token saved successfully');
    });
  }
];

exports.verifyResetToken = [
  body('token').isString().trim().escape(),
  (req, res) => {
    if (handleValidationErrors(req, res)) return;

    const { token } = req.body;
    taskService.verifyResetToken(token, (err, user) => {
      if (err || !user) {
        return res.status(400).json({
          status: "failure",
          message: 'Invalid or expired reset token',
        });
      }
      res.status(200).json({
        status: "success",
        user,
      });
    });
  }
];

exports.patchUpdatePassword = [
  body('userId').isInt().withMessage('User ID must be an integer'),
  body('password').isString().trim().escape(),
  (req, res) => {
    if (handleValidationErrors(req, res)) return;

    const { userId, password } = req.body;
    taskService.resetPassword(userId, password, (err, result) => {
      handleServiceResponse(err, result, res, 'Password updated successfully');
    });
  }
];

exports.postUpdateEmail = [
  body('email').isEmail().withMessage('Enter a valid email address').normalizeEmail(),
  body('userId').isInt().withMessage('User ID must be an integer'),
  (req, res) => {
    if (handleValidationErrors(req, res)) return;

    const { email, userId } = req.body;
    taskService.updateEmail(userId, email, (err, result) => {
      handleServiceResponse(err, result, res, 'Email updated successfully');
    });
  }
];

exports.postUpdatePassword = [
  body('currentPassword').isString().trim().escape(),
  body('newPassword').isString().trim().escape(),
  body('userId').isInt().withMessage('User ID must be an integer'),
  (req, res) => {
    if (handleValidationErrors(req, res)) return;

    const { currentPassword, newPassword, userId } = req.body;
    taskService.updatePassword(userId, currentPassword, newPassword, (err, result) => {
      handleServiceResponse(err, result, res, 'Password updated successfully');
    });
  }
];

exports.patchUpdateTask = [
  param('id').isInt().withMessage('Task ID must be an integer'),
  body('Task_completion').isBoolean(),
  (req, res) => {
    if (handleValidationErrors(req, res)) return;

    const { id } = req.params;
    const { Task_completion } = req.body;
    taskService.updateTaskCompletion(id, Task_completion, (err, result) => {
      handleServiceResponse(err, result, res, `Task ID ${id} completion status updated`);
    });
  }
];