const express = require('express');
const router = express.Router();

const eventController = require('../controllers/eventController');

const { requireAuth, requireAdminAuth } = require('../middleware/auth');

router.get('/', eventController.getEvents);
router.patch('/:id/approve', requireAdminAuth, eventController.approveSuggestedEvent);
router.post('/', requireAuth, eventController.createEvent);
router.delete('/:id', requireAdminAuth, eventController.deleteEvent);
router.patch('/:id', requireAdminAuth, eventController.updateEvent);

module.exports = router;
