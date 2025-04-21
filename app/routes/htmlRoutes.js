const express = require('express');
const htmlController = require('../controllers/htmlController');
const { ensureAuthenticated, forwardAuthenticated } = require('../utils/authMiddleware');
const htmlRouter = express.Router();

htmlRouter.get('/', ensureAuthenticated, htmlController.getTasks);
htmlRouter.get('/new', ensureAuthenticated, htmlController.viewAddTask);
htmlRouter.get('/edit/:id', ensureAuthenticated, htmlController.selectTask);
htmlRouter.get('/view/:id', ensureAuthenticated, htmlController.viewTask);

htmlRouter.get('/login', forwardAuthenticated, htmlController.getLogin);
htmlRouter.get('/logout', ensureAuthenticated, htmlController.getLogout);
htmlRouter.get('/register', forwardAuthenticated, htmlController.getRegister);
htmlRouter.get('/stats', ensureAuthenticated, htmlController.getStats);
htmlRouter.get('/settings', ensureAuthenticated, htmlController.getSettingsPage);

htmlRouter.get('/forgot-password', forwardAuthenticated, htmlController.getForgotPassword);
htmlRouter.post('/forgot-password', forwardAuthenticated, htmlController.postForgotPassword);
htmlRouter.get('/reset-password/:token', forwardAuthenticated, htmlController.getResetPassword);
htmlRouter.post('/reset-password/:token', forwardAuthenticated, htmlController.postResetPassword);

htmlRouter.post('/new', ensureAuthenticated, htmlController.postAddTask);
htmlRouter.post('/edit/:id', ensureAuthenticated, htmlController.postUpdateTask);
htmlRouter.post('/del/:id', ensureAuthenticated, htmlController.postDeleteTask);
htmlRouter.post('/login', forwardAuthenticated, htmlController.postLogin);
htmlRouter.post('/register', forwardAuthenticated, htmlController.postRegister);
htmlRouter.post('/settings/email', ensureAuthenticated, htmlController.postUpdateEmail);
htmlRouter.post('/settings/password', ensureAuthenticated, htmlController.postUpdatePassword);

htmlRouter.patch('/tasks/:id', ensureAuthenticated, htmlController.patchUpdateTaskCompletion); //checkbox on task card

module.exports = htmlRouter;