const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

const requireAuth = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorisation token required' });
  }

  const token = authorization.split(' ')[1];

  try {
    const { _id } = jwt.verify(token, process.env.JWT_SECRET);

    const user = await userModel.findById(_id).select('_id');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    req.user = user;

    next();
  } catch (err) {
    console.error(err);

    res.status(401).json({ error: 'Request not authorised' });
  }
};

const requireAdminAuth = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorisation token required' });
  }

  const token = authorization.split(' ')[1];

  try {
    const { _id } = jwt.verify(token, process.env.JWT_SECRET);

    const user = await userModel.findById(_id).select('_id isAdmin');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.isAdmin) {
      return res.status(403).json({ error: 'Action requires admin access' });
    }

    req.user = user;

    next();
  } catch (err) {
    console.error(err);

    res.status(401).json({ error: 'Request not authorised' });
  }
};

module.exports = { requireAuth, requireAdminAuth };
