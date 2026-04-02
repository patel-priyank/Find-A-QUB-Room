const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');

const { requireAuth, requireAdminAuth } = require('../middleware/auth');

router.get('/', requireAdminAuth, userController.getAllUsers);
router.post('/signin', userController.signin);
router.post('/signup', userController.signup);
router.delete('/:id', requireAdminAuth, userController.deleteUser);
router.patch('/account/name', requireAuth, userController.updateUserName);
router.patch('/account/password', requireAuth, userController.updateUserPassword);
router.patch('/admin-access/grant/:id', requireAdminAuth, userController.grantAdminAccess);
router.patch('/admin-access/revoke/:id', requireAdminAuth, userController.revokeAdminAccess);
router.get('/saved-locations', requireAuth, userController.getSavedLocations);
router.patch('/saved-locations/:id', requireAuth, userController.saveLocation);
router.delete('/saved-locations/:id', requireAuth, userController.unsaveLocation);

module.exports = router;
