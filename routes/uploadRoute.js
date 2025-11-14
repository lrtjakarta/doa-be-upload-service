const express = require('express');
const router = express.Router();
const imagesController = require('../controllers/imagesController');
const documentController = require('../controllers/documentController');
const qrcodeController = require('../controllers/qrcodeController');

router.post('/img', imagesController.uploadImage);
router.post('/imgbase', imagesController.uploadImageBase64);
router.post('/doc', documentController.uploadDoc);
router.post('/qrcode', qrcodeController.qrcodeGenerate);
router.post('/delete', imagesController.deleteImage);

module.exports = router;