var express = require('express');
var router = express.Router();

var GlassesController = require('../../controllers/Products/v1/GlassesController');

var { uploadProductImagesServer } = require('../../helpers/ImageStorage');

router.post('/', GlassesController.addGlasses);
router.get('/', GlassesController.viewGlassesList);
router.get('/eyeglasses', GlassesController.viewEyeglassesList);
router.get('/sunglasses', GlassesController.viewSunglassesList);
router.get('/:glassesId', GlassesController.viewParticularGlasses);
router.put('/:glassesId', GlassesController.updateGlasses);
router.delete('/:glassesId', GlassesController.deleteGlasses);

router.put('/:glassesId/images', uploadProductImagesServer.array('product_images'), GlassesController.addProductImages);
router.get('/:glassesId/images' , GlassesController.viewProductImages);
router.delete('/:glassesId/images/:imageId', GlassesController.deleteProductImages);

// Web user side glasses routes
router.get('newArrivals', GlassesController.viewNewArrivals);

router.get('/retrieve/:imageName', GlassesController.retrieveImage);

module.exports = router;