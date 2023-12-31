var express = require('express');
var router = express.Router();

var AdminController = require('../controllers/Admin/AdminController');

var { authenticateToken } = require('../controllers/Auth/AdminAuthController');
var { uploadProfileImagesServer } = require('../helpers/ImageStorage');

router.get('/:adminId/profile', authenticateToken, AdminController.profile);
router.put('/profile/:adminId', AdminController.updatePersonalInformation);
router.put('/profile/:adminId/password/', AdminController.changePassword);

router.post('/upload_image_server', authenticateToken, uploadProfileImagesServer.single('image'), AdminController.uploadProfileImageServer);
router.get('/view_image_server', authenticateToken, AdminController.viewProfileImageServer);
router.delete('/:adminId/remove_image_server', authenticateToken, AdminController.deleteProfileImageServer);

router.post('/giftcard', AdminController.addGiftcard);
router.get('/giftcard', AdminController.viewGiftcard);
router.get('/giftcard/:giftcardId', AdminController.viewParticularGiftcard);
router.put('/giftcard/:giftcardId', AdminController.updateGiftcard);
router.delete('/giftcard/:giftcardId', AdminController.deleteGiftcard);

router.post('/create_test_user', AdminController.registerTestUser);

router.get('/users', AdminController.getAllUsers);
router.get('/users/:customerId', AdminController.getParticularUser);

router.get('/agents', AdminController.getAllAgents);

router.get('/orders', AdminController.getAllOrders);
router.get('/orders/customer/:customerId', AdminController.getCustomersParticularOrders);
router.get('/orders/:orderId/customer/:customerId', AdminController.getCustomersSingleOrder);

router.put('/user/ban/:customerId', AdminController.banUser);
router.post('/user/unban/:customerId', AdminController.unbanUser);

router.put('/agent/ban/:agentId', AdminController.banAgent);
router.post('/agent/unban/:agentId', AdminController.unbanAgent);

router.get('/customer/analytics', AdminController.customerAnalytics);
router.get('/agents/analytics', AdminController.agentsAnalytics);

module.exports = router;