const RefreshToken = require("../models/RefreshToken");
const { findOne } = require("../models/RefreshToken");
const User = require("../models/User");
const generateTokens = require("../utils/generateToken");
const logger = require("../utils/logger");
const { validateUserRegistration, validateLogin } = require("../utils/validateModels")

//user registration
const registerUser = async(req, res) =>{
    logger.info('Registration route...')
    try{
        //validate schema
        const { error } = validateUserRegistration(req.body);
        if(error){
            logger.warn('Validation error encountered', error.details[0].message);
            return res.status(400).json({
                success : false,
                message : error.details[0].message,
            });
        }
        const { email, password, username, bio } = req.body;
        //check if either username or mail is present in DB
        let user = await User.findOne({ $or : [{email}, {username}]});
        if(user){
            logger.warn("User already exists");
            return res.status(400).json({
                success : false,
                message : "User already exists",
            });
        }
        // create the new user
        user = new User({username, email, password, bio})
        await user.save()
        logger.warn("User created sucessfully", user._id);
        
        const { accessToken, refreshToken } = await generateTokens(user);

        res.status(201).json({
            success : true,
            message : "User registration sucessfull!",
            accessToken,
            refreshToken
        })  

    } catch(e){
        logger.error("Registration error", e )
        res.status(500).json({
            success : false,
            message : "Internal server error"

        })
         
    }

};

//user login
const loginUser = async(req, res)=> {
    logger.info("Login route...");
    try{
        const { error } = validateLogin(req.body);
        if (error){
            logger.warn("Validation error", error.details[0].message);
            return res.status(400).json({
                success : false,
                message : error.details[0].message
            });
        }

        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if(!user){
            logger.warn("Unregistered user!")
            return res.status(400).json({
                success : false,
                message : "User not registered in database"
            });
        }
        //Validate Password
        const isValidPassword = await user.comparePassword(password);
        if(!isValidPassword){
            logger.warn("Invalid Password...");
            return res.status(400).json({
                success : false,
                message : "Invalid password"
            });
        }

        //generate accesstoken associated with user after login
        const { accessToken, refreshToken } = await generateTokens(user);

        res.json({
            accessToken,
            refreshToken,
            userId: user._id,
        });       
    }catch(e){
        logger.error("Login error occurred", e);
        res.status(500).json({
            success : false,
            message : "Internal server error"
        });
    }
};
//refresh token 
const refreshTokenUser = async(req, res)=> {
    logger.info("Refresh token route...")
    try{
        const { refreshToken } = req.body;
        if(!refreshToken){
            logger.warn("Refresh token missing...");
            return res.status(400).json({
                success : false,
                messgae : "Refresh token missing.."
            });
        }

        const storedToken = await RefreshToken.findOne({ token : refreshToken })

        if(!storedToken || storedToken.expiresAt < new Date()){
            logger.warn("Refresh token expired or invalid...");
            return res.status(401).json({
                success : false,
                message : "Invalid or expired refresh token"
            });
        }

        //check if the token is stored in the database
        const user = await User.findById(storedToken.user);
        if(!user){
            logger.warn("User not found")
            return res.status(401).json({
                success : false,
                message : "User not found"
            });
        }

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await generateTokens(user);

        // delete the old refresh token
        await RefreshToken.deleteOne({ _id: storedToken._id })

        res.json({
            accessToken : newAccessToken,
            refreshToken : newRefreshToken
        });
    }catch(e){
    logger.error("Refresh token error occured", e);
    res.status(500).json({
        success: false,
        message: "Internal server error",
    });
  }
};

//logout
const logoutUser = async (req, res) => {
    logger.info("Logout route...");
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        logger.warn("Refresh token missing");
        return res.status(400).json({
          success: false,
          message: "Refresh token missing",
        });
      }
      // delete refresh token from database
      await RefreshToken.deleteOne({ token: refreshToken });
      logger.info("Refresh token deleted for logout");
  
      res.json({
        success: true,
        message: "Logged out successfully!",
      });
    } catch (e) {
      logger.error("Error while logging out", e);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
};


module.exports = {
    registerUser,
    loginUser,
    refreshTokenUser,
    logoutUser
}