module.exports = function createSession(req, user, tipo, callback) {
  req.session.regenerate((err) => {
    if (err) return callback(err);

    req.session.user = {
      id: user.id,
      tipo,
      email: user.email,
    };

    req.session.save((err) => {
      if (err) return callback(err);
      callback(null);
    });
  });
};
