const express = require('express');
const multer = require('multer');
const { uploadMedia, getAllMedias } = require('../controller/mediaController');
const { authenticateRequest } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

const router = express.Router();

//multiler for file upload
const upload = multer({
    storage : multer.memoryStorage(),
    limits : {
        fileSize : 10 * 1024 * 1024
    }
}).single('file')

//upload route
router.post('/upload', authenticateRequest,( req, res, next)=> {
    upload(req, res, function(err){
        if(err instanceof multer.MulterError){
            logger.error('Multer error while uploading: ', err)
            return res.status(400).json({
                message: 'Multer error while uploading!',
                error : err.message,
                stack : err.stack
            });
        } else if(err){
            logger.error('Unknown error occurred while uploading: ',err)
            return res.status(400).json({
                message: 'Multer error while uploading!',
                error : err.message,
                stack : err.stack
            });
        }
        if (!req.file) {
            return res.status(400).json({
              message: "No file found!",
            });
          }
    
          next();
        });
    },
    uploadMedia
);
    
router.get("/", authenticateRequest, getAllMedias);
module.exports = router;