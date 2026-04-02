const express = require('express');
const router = express.Router();

const statisticController = require('../controllers/statisticController');

const { requireAdminAuth } = require('../middleware/auth');

router.patch('/increment', statisticController.incrementAppVisits);
router.get('/', requireAdminAuth, statisticController.getStatistics);

module.exports = router;
