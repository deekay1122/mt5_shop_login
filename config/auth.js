module.exports = {
  ensureAuthenticated: async function(req, res, next) {
    if (req.isAuthenticated()) {
      console.log('I am here here');
      return next();
    }
    await req.flash('error_msg', 'Please log in to view that resource');
    // set the originalUrl to session to use for redirection
    req.session.originalUrl = res.req.originalUrl;
    console.log('I am here');
    res.redirect('/users/login');
  },
  forwardAuthenticated: function(req, res, next) {
    if (!req.isAuthenticated()) {
      return next();
    }
    res.redirect('/dashboard');
  }
};
