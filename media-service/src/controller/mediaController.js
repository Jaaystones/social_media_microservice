const Media = require("../model/Media");
const { uploadMediaToCloudinary } = require("../utils/cloudinary");
const logger = require("../utils/logger");

const uploadMedia = async (req, res) => {
  logger.info("Starting media upload");
  try {
    console.log(req.file, "req.filereq.file");

    if (!req.file) {
      logger.error("No file found. Please add a file and try again!");
      return res.status(400).json({
        success: false,
        message: "No file found. Please add a file and try again!",
      });
    }

    const { originalName, mimetype, buffer } = req.file;
    const userId = req.user.userId; // gotten from api gateway authentication

    logger.info(`File details: name=${originalName}, type=${mimetype}`);
    logger.info("Upload to cloudinary started...");

    const cloudinaryUploadResult = await uploadMediaToCloudinary(req.file);
    logger.info(
      `Cloudinary upload successfully! Public Id: - ${cloudinaryUploadResult.public_id}`
    );
    
    // create a new media object
    const newlyCreatedMedia = new Media({
      publicId: cloudinaryUploadResult.public_id,
      originalName: originalname,
      mimeType: mimetype,
      url: cloudinaryUploadResult.secure_url,
      userId,
    });

    await newlyCreatedMedia.save();

    res.status(201).json({
      success: true,
      mediaId: newlyCreatedMedia._id,
      url: newlyCreatedMedia.url,
      message: "Media upload is successfully",
    });
  } catch (error) {
    logger.error("Error creating media", error);
    res.status(500).json({
      success: false,
      message: "Error creating media",
    });
  }
};

const getAllMedias = async (req, res) => {
  try {
    const results = await Media.find({});
    res.json({ results });
  } catch (e) {
    logger.error("Error fetching medias", error);
    res.status(500).json({
      success: false,
      message: "Error fetching medias",
    });
  }
};

module.exports = { uploadMedia, getAllMedias };