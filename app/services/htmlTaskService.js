const axios = require('axios');

exports.login = (data) => {
  const endpoint = `http://localhost:3002/api/users/login`;
  return axios.post(endpoint, data)
    .then(response => response.data)
    .catch(error => {
      throw new Error(error.response.data.message || 'Error logging in');
    });
};

exports.getTasks = (user_id, sort, filter, token) => {
  const endpoint = `http://localhost:3002/api/tasks?user_id=${user_id}&sort=${sort}&filter=${filter}`;
  return axios.get(endpoint, {
    headers: {
      'Authorization': token
    }
  });
};

exports.getTaskById = (id, token) => {
  const endpoint = `http://localhost:3002/api/tasks/${id}`;
  return axios.get(endpoint, {
    headers: {
      'Authorization': token
    }
  });
};

exports.addTask = (taskData, token) => {
  const endpoint = `http://localhost:3002/api/tasks/new`;
  return axios.post(endpoint, taskData, {
    headers: {
      'Authorization': token
    }
  });
};

exports.updateTask = (task_id, taskData, token) => {
  const endpoint = `http://localhost:3002/api/tasks/${task_id}`;
  return axios.put(endpoint, taskData, {
    headers: {
      'Authorization': token
    }
  })
    .then(response => response.data)
    .catch(error => {
      throw new Error(error.response.data.message || 'Error updating task');
    });
};

exports.deleteTask = (task_id, token) => {
  const endpoint = `http://localhost:3002/api/tasks/${task_id}`;
  return axios.delete(endpoint, {
    headers: {
      'Authorization': token
    }
  })
    .then(response => response.data)
    .catch(error => {
      throw new Error(error.response.data.message || 'Error deleting task');
    });
};

exports.register = (data) => {
  const endpoint = `http://localhost:3002/api/users/register`;
  return axios.post(endpoint, data);
};

exports.getUserStats = (user_id, token) => {
  const endpoint = `http://localhost:3002/api/users/stats?user_id=${user_id}`;
  return axios.get(endpoint, {
    headers: {
      'Authorization': token
    }
  });
};

exports.updateTaskCompletion = (id, Task_completion, token) => {
  const endpoint = `http://localhost:3002/api/tasks/${id}`;
  return axios.patch(endpoint, { Task_completion }, {
    headers: {
      'Authorization': token
    }
  });
};

exports.updateEmail = (userId, email, token) => {
  const endpoint = `http://localhost:3002/api/settings/email`;
  return axios.post(endpoint, { userId, email }, {
    headers: {
      'Authorization': token
    }
  })
    .then(response => response.data)
    .catch(error => {
      throw new Error(error.response.data.message || 'Error updating email');
    });
};

exports.updatePassword = (userId, currentPassword, newPassword, token) => {
  const endpoint = `http://localhost:3002/api/settings/password`;
  return axios.post(endpoint, { userId, currentPassword, newPassword }, {
    headers: {
      'Authorization': token
    }
  })
    .then(response => response.data)
    .catch(error => {
      throw new Error(error.response.data.message || 'Error updating password');
    });
};

exports.saveResetToken = (email, token, expires) => {
  const endpoint = `http://localhost:3002/api/save-reset-token`;
  return axios.post(endpoint, { email, token, expires });
};

exports.verifyResetToken = (token) => {
  const endpoint = `http://localhost:3002/api/verify-reset-token`;
  return axios.post(endpoint, { token })
    .then(response => response.data.user);
};

exports.resetPassword = (userId, password) => {
  const endpoint = `http://localhost:3002/api/update-password`;
  return axios.patch(endpoint, { userId, password })
    .then(response => response.data)
    .catch(error => {
      throw new Error(error.response.data.message || 'Error updating password');
    });
};



