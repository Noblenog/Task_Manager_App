const taskService = require("../services/htmlTaskService");
const dayjs = require("dayjs");
const isBetween = require("dayjs/plugin/isBetween");
const isSameOrBefore = require("dayjs/plugin/isSameOrBefore");
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { error } = require("console");

dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);

//function to send error response
const sendErrorResponse = (res, message, status = 500) => {
  res.status(status).send(message);
};

//function to render a view with CSRF token
const renderViewWithCsrf = (res, view, options = {}) => {
  res.render(view, { csrfToken: res.locals.csrfToken, ...options });
};

// Task-related functions
exports.getTasks = (req, res) => {
  const { sort, filter } = req.query;
  const user_id = req.session.userid;
  const username = req.session.username; 
  const token = req.session.token; 

  taskService.getTasks(user_id, sort || '', filter || '', token)
    .then((response) => {
      const data = response.data.result;

      const today = dayjs().startOf('day');
      const endOfWeek = dayjs().endOf('week');
      const endOfMonth = dayjs().endOf('month');

      const tasksDueToday = [];
      const tasksDueThisWeek = [];
      const tasksDueThisMonth = [];
      const tasksDueInFuture = [];
      const lateTasks = [];

      data.forEach(task => {
        const dueDate = dayjs(task.Task_due_date);
        if (dueDate.isSame(today, 'day')) {
          tasksDueToday.push(task);
        } else if (dueDate.isBetween(today, endOfWeek, null, '[]')) {
          tasksDueThisWeek.push(task);
        } else if (dueDate.isBetween(today, endOfMonth, null, '[]')) {
          tasksDueThisMonth.push(task);
        } else if (dueDate.isAfter(today, 'day')) {
          tasksDueInFuture.push(task);
        } else if (dueDate.subtract(1, 'day').isSameOrBefore(today, 'day')) {
          lateTasks.push(task);
        }
      });

      // Determine if the view should be based on priority or date
      const isPriorityView = sort === 'priority' || filter === 'high_priority' || filter === 'medium_priority' || filter === 'low_priority';

      renderViewWithCsrf(res, "index", {
        data,
        tasksDueToday,
        tasksDueThisWeek,
        tasksDueThisMonth,
        tasksDueInFuture,
        lateTasks,
        title: "Home Page",
        dayjs: dayjs,
        sort: sort || '', // Pass the sort parameter to the view
        filter: filter || '', // Pass the filter parameter to the view
        isPriorityView, // Pass the isPriorityView flag to the view
        loggedin: req.session.isloggedin,
        username: username, // Pass the username to the view
        token // Pass the token to the view
      });
    })
    .catch((error) => {
      sendErrorResponse(res, `Error fetching tasks: ${error.message}`);
    });
};

//done
exports.viewAddTask = (req, res) => {
  const userid = req.session.userid;
  const username = req.session.username;
  const token = req.session.token; 

  taskService.getTasks(userid, '', '', token)
    .then((response) => {
      const data = response.data.result;
      renderViewWithCsrf(res, "add", { Task: data, loggedin: req.session.isloggedin, username: username });
    })
    .catch((error) => {
      sendErrorResponse(res, "Error fetching task");
    });
};

//done
exports.viewTask = (req, res) => {
  const { id } = req.params;
  const username = req.session.username;
  const token = req.session.token; 

  taskService.getTaskById(id, token)
    .then((response) => {
      const data = response.data.result;
      renderViewWithCsrf(res, "viewTask", { Task: data, dayjs: dayjs, loggedin: req.session.isloggedin, username: username });
    })
    .catch((error) => {
      sendErrorResponse(res, "Error fetching task");
    });
};

//done
exports.selectTask = (req, res) => {
  const { id } = req.params;
  const username = req.session.username;
  const token = req.session.token;

  taskService.getTaskById(id, token)
    .then((response) => {
      const data = response.data.result;
      renderViewWithCsrf(res, "edit", { Task: data, dayjs: dayjs, loggedin: req.session.isloggedin, username: username });
    })
    .catch((error) => {
      sendErrorResponse(res, "Error fetching task");
    });
};

//done
exports.getLogin = (req, res) => {
  renderViewWithCsrf(res, "login", { loggedin: req.session.isloggedin, error: null });
};

//done
exports.postLogin = (req, res) => {
  const { username, userpass } = req.body;
  const data = { username, userpass };

  taskService.login(data)
    .then((responseData) => {
      if (responseData.status === "success") {
        req.session.isloggedin = true;
        req.session.userid = responseData.result.User_id;
        req.session.username = responseData.result.User_username;
        req.session.token = responseData.token; 

        res.redirect("/");
      } else {
        renderViewWithCsrf(res, "login", {
          loggedin: false,
          error: "Invalid username or password"
        });
      }
    })
    .catch((error) => {
      renderViewWithCsrf(res, "login", {
        loggedin: false,
        error: error.message
      });
    });
};

//done
exports.getRegister = (req, res) => {
  renderViewWithCsrf(res, "register", { loggedin: req.session.isloggedin});
};

//done
exports.getSettingsPage = (req, res) => {
  renderViewWithCsrf(res, 'settings', { loggedin: req.session.isloggedin, username: req.session.username });
};

//done
exports.getLogout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
};

//done
exports.postAddTask = (req, res) => {
  const { task_title, task_description, task_priority_id, new_date } = req.body;
  const user_id = req.session.userid;
  const token = req.session.token; 

  const data = { task_title, task_description, task_priority_id, new_date, user_id };

  taskService.addTask(data, token)
    .then((response) => {
      res.redirect("/");
    })
    .catch((error) => {
      sendErrorResponse(res, 'Error adding task');
    });
};

//done
exports.postUpdateTask = (req, res) => {
  const { task_title, task_description, task_priority_id, new_date, completion_date} = req.body;
  const task_id = req.params.id;
  const token = req.session.token;
  const data = { task_title, task_description, task_priority_id, new_date, completion_date: completion_date || null};

  taskService.updateTask(task_id, data, token)
    .then((response) => {
      res.redirect("/");
    })
    .catch((error) => {
      sendErrorResponse(res, "Error updating task");
    });
};

//done
exports.postDeleteTask = (req, res) => {
  if (!req.session.isloggedin) {
    return res.status(403).send('You are not authorized to perform this action');
  }
  const task_id = req.params.id;
  const token = req.session.token; 

  taskService.deleteTask(task_id, token)
    .then((response) => {
      res.redirect("/");
    })
    .catch((error) => {
      sendErrorResponse(res, 'Error deleting task');
    });
};

//done
exports.postRegister = (req, res) => {
  const { firstName, lastName, username, email, password } = req.body;

  const data = { firstName, lastName, username, email, password };

  taskService.register(data)
    .then((response) => {
      res.redirect('/login');
    })
    .catch((error) => {
      if (error.response && error.response.status === 409) {
        renderViewWithCsrf(res, 'register', {
          loggedin: req.session.isloggedin || false,
          error: "Username or email already exists"
        });
      } else {
        sendErrorResponse(res, "Error registering user");
      }
    });
};

//done
exports.getStats = (req, res) => {
  const user_id = req.session.userid;
  const username = req.session.username;
  const token = req.session.token; 

  taskService.getUserStats(user_id, token)
    .then((response) => {
      const stats = response.data;

      const { totalTasks, completedTasks, tasksCompletedPerMonth, completionRateByPriority, tasksByStatus } = stats;

      const completionRate = (completedTasks / totalTasks) * 100;

      // Preprocess tasksCompletedPerMonth to ensure it includes all months of the past year
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      const currentMonth = dayjs().month();
      const currentYear = dayjs().year();
      const labels = [];
      const data = [];

      if (Array.isArray(tasksCompletedPerMonth)) {
        for (let i = 0; i < 12; i++) {
          const monthIndex = (currentMonth - i + 12) % 12;
          const year = monthIndex > currentMonth ? currentYear - 1 : currentYear;
          const monthName = months[monthIndex];
          const label = `${monthName} ${year}`;
          labels.unshift(label);
          const monthData = tasksCompletedPerMonth.find(item => item.month === `${year}-${String(monthIndex + 1).padStart(2, '0')}`);
          data.unshift(monthData ? monthData.count : 0);
        }
      }

      renderViewWithCsrf(res, 'stats', {
        username: username,
        totalTasks: totalTasks,
        completedTasks: completedTasks,
        completionRate: completionRate.toFixed(2),
        tasksCompletedPerMonth: { labels, data },
        completionRateByPriority: [
          completionRateByPriority.high,
          completionRateByPriority.medium,
          completionRateByPriority.low
        ],
        tasksByStatus: [
          tasksByStatus.completed,
          tasksByStatus.inProgress
        ],
        loggedin: req.session.isloggedin,
        token 
      });
    })
    .catch((err) => {
      sendErrorResponse(res, "Error fetching user statistics");
    });
};

//done - needs to be kept (checkbox on task card)
exports.patchUpdateTaskCompletion = (req, res) => {
  const { id } = req.params;
  const { Task_completion } = req.body;
  const token = req.session.token; // Get the token from the session

  taskService.updateTaskCompletion(id, Task_completion, token)
    .then((response) => {
      res.status(200).json({
        status: "success",
        message: `Task ID ${id} completion status updated`,
      });
    })
    .catch((error) => {
      res.status(500).json({
        status: "failure",
        message: error.message,
      });
    });
};

//done
exports.postUpdateEmail = (req, res) => {
  const { email } = req.body;
  const userId = req.session.userid;
  const token = req.session.token;

  taskService.updateEmail(userId, email, token)
    .then(response => {
      renderViewWithCsrf(res, 'settings', { error: null, success: 'Email updated successfully', loggedin: req.session.isloggedin, username: req.session.username });
    })
    .catch(error => {
      renderViewWithCsrf(res, 'settings', { error: 'Error updating email', success: null, loggedin: req.session.isloggedin, username: req.session.username });
    });
};

exports.postUpdatePassword = (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.session.userid;
  const token = req.session.token; 

  taskService.updatePassword(userId, currentPassword, newPassword, token)
    .then(response => {
      renderViewWithCsrf(res, 'settings', { error: null, success: 'Password updated successfully', loggedin: req.session.isloggedin, username: req.session.username });
    })
    .catch(error => {
      renderViewWithCsrf(res, 'settings', { error: 'Error updating password', success: null, loggedin: req.session.isloggedin, username: req.session.username });
    });
};

exports.getForgotPassword = (req, res) => {
  renderViewWithCsrf(res, 'forgotPassword', { error: null, success: null });
};

exports.postForgotPassword = (req, res) => {
  const { email } = req.body;

  console.log('Received forgot password request for email:', email);

  // Generate a unique token
  const token = crypto.randomBytes(20).toString('hex');
  console.log('Generated token:', token);

  const expires = new Date(Date.now() + 3600000);
  console.log('Token expires at:', expires);

  taskService.saveResetToken(email, token, expires)
    .then(() => {
     
      const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'noblemcmurray@gmail.com',
          pass: 'imok qoiz myyv vluj'
        }
      });

      const mailOptions = {
        to: email,
        from: 'your-email@gmail.com',
        subject: 'Password Reset',
        text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
          Please click on the following link, or paste this into your browser to complete the process:\n\n
          http://${req.headers.host}/reset-password/${token}\n\n
          If you did not request this, please ignore this email and your password will remain unchanged.\n`
      };

      console.log('Sending mail to:', email);
      transporter.sendMail(mailOptions, (err) => {
        if (err) {
          console.error('Error sending email:', err.message);
          return renderViewWithCsrf(res, 'forgotPassword', { error: 'Error sending email', success: null });
        }
        console.log('Email sent');
        renderViewWithCsrf(res, 'forgotPassword', { error: null, success: 'An email has been sent to ' + email + ' with further instructions.' });
      });
    })
    .catch((err) => {
      console.error('Error saving reset token:', err.message);
      return renderViewWithCsrf(res, 'forgotPassword', { error: 'No account with that email address exists.', success: null });
    });
};

exports.getResetPassword = (req, res) => {
  const { token } = req.params;

  // Verify the token and check expiration
  taskService.verifyResetToken(token)
    .then(user => {
      if (!user) {
        return renderViewWithCsrf(res, 'resetPassword', { error: 'Password reset token is invalid or has expired.', success: null });
      }
      renderViewWithCsrf(res, 'resetPassword', { error: null, success: null, token });
    })
    .catch(error => {
      renderViewWithCsrf(res, 'resetPassword', { error: 'Error verifying reset token', success: null });
    });
};

exports.postResetPassword = (req, res) => {
  const { token } = req.params;
  const { password } = req.body;


  taskService.verifyResetToken(token)
    .then(user => {
      if (!user) {
        return renderViewWithCsrf(res, 'resetPassword', { error: 'Password reset token is invalid or has expired.', success: null, token });
      }

      taskService.resetPassword(user.User_id, password)
        .then(() => {
          renderViewWithCsrf(res, 'resetPassword', { error: null, success: 'Password has been reset successfully.', token });
        })
        .catch(error => {
          renderViewWithCsrf(res, 'resetPassword', { error: 'Error updating password', success: null, token });
        });
    })
    .catch(error => {
      renderViewWithCsrf(res, 'resetPassword', { error: 'Error verifying reset token', success: null, token });
    });
};

