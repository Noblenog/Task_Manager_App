module.exports = {
  ensureAuthenticated: (req, res, next) => {
    if (req.session && req.session.isloggedin) {
      return next();
    } else {
      if (req.method === 'PATCH' || req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
        return res.status(403).json({
          status: "failure",
          message: "User not authenticated",
        });
      } else {
        return res.redirect('/login');
      }
    }
  },
  forwardAuthenticated: (req, res, next) => {
    if (!req.session || !req.session.isloggedin) {
      return next();
    } else {
      return res.redirect('/');
    }
  }
};