const Joi = require('joi');

 const validateUserRegistration = (data)=> {
    const schema = Joi.object({
        username : Joi.string().min(3).max(15).required(),
        email: Joi.string().email().required(),
        password : Joi.string().required
    })
    return schema.validate(data)
 }

 module.exports = { validateUserRegistration }