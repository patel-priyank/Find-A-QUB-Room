const express = require('express');
const router = express.Router();

const locationController = require('../controllers/locationController');

const { requireAuth, requireAdminAuth } = require('../middleware/auth');

router.get('/', locationController.getAllLocations);
router.get('/suggested', requireAdminAuth, locationController.getAllSuggestedLocations);
router.patch('/:id/increment-views', locationController.incrementViewCount);
router.get('/:id/data', locationController.getLocationById);
router.patch('/:id/approve', requireAdminAuth, locationController.approveSuggestedLocation);
router.post('/', requireAuth, locationController.createLocation);
router.delete('/:id', requireAdminAuth, locationController.deleteLocation);
router.patch('/:id', requireAdminAuth, locationController.updateLocation);
router.post('/images', requireAuth, locationController.upload.array('images', 10), locationController.uploadImages);
router.get('/with-feedback', requireAdminAuth, locationController.getLocationsWithFeedback);
router.get('/:id/feedback', requireAdminAuth, locationController.getLocationFeedback);
router.post('/:id/feedback', requireAuth, locationController.addLocationFeedback);
router.patch('/:id/feedback/:feedbackId/status', requireAdminAuth, locationController.updateFeedbackStatus);

module.exports = router;
