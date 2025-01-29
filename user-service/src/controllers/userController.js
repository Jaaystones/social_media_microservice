const User = require("../models/User");
const generateTokens = require("../utils/generateToken");
const logger = require("../utils/logger");
const { validateUserRegistration } = require("../utils/validateModels")

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
        const { email, password, username } = req.body;
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
        user = new User({username, email, password})
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
            message : "?Internal server error"

        })
         
    }

};


module.exports = {
    registerUser
}