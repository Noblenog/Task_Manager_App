const express = require('express');
const apiRouter = express.Router();
const apiController = require('../controllers/apiController');
const { verifyToken } = require('../utils/jwtMiddleware');

// GET requests - postman done
apiRouter.get('/tasks', verifyToken, apiController.getTasks);
apiRouter.get('/tasks/:id', verifyToken, apiController.selectTask);
apiRouter.get('/users/stats', verifyToken, apiController.getUserStats);

// POST requests - postman done
apiRouter.post('/tasks/new', verifyToken, apiController.postNewTask);
apiRouter.post('/users/login', apiController.postLogin);
apiRouter.post('/users/register', apiController.postRegister);
apiRouter.post('/settings/email', verifyToken, apiController.postUpdateEmail);
apiRouter.post('/settings/password', verifyToken, apiController.postUpdatePassword);
apiRouter.post('/save-reset-token', apiController.saveResetToken);
apiRouter.post('/verify-reset-token', apiController.verifyResetToken);

// PUT requests - postman done
apiRouter.put('/tasks/:id', verifyToken, apiController.putUpdateTask);

// PATCH requests - postman done
apiRouter.patch('/tasks/:id', verifyToken, apiController.patchUpdateTask); //checkbox on task card
apiRouter.patch('/update-password', apiController.patchUpdatePassword);

// DELETE requests - postman done
apiRouter.delete('/tasks/:id', verifyToken, apiController.deleteTask);

module.exports = apiRouter;