var express = require('express');
var router = express.Router();

var AdminController = require('../controllers/Admin/AdminController');

var { authenticateToken } = require('../controllers/Auth/AdminAuthController');
var { uploadProfileImagesServer } = require('../helpers/ImageStorage');

router.get('/profile', AdminController.profile);
router.put('/profile/:adminId', AdminController.updatePersonalInformation);
router.put('/profile/:adminId/password/', AdminController.changePassword);

router.post('/upload_image_server', authenticateToken, uploadProfileImagesServer.single('image'), AdminController.uploadProfileImageServer);
router.get('/view_image_server', authenticateToken, AdminController.viewProfileImageServer);
router.delete('/remove_image_server', authenticateToken, AdminController.deleteProfileImageServer);

router.post('/giftcard', AdminController.addGiftcard);
router.get('/giftcard', AdminController.viewGiftcard);
router.put('/giftcard/:giftcardId', AdminController.updateGiftcard);
router.delete('/giftcard/:giftcardId', AdminController.deleteGiftcard);

module.exports = router;