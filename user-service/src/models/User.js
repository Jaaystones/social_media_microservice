const mongoose = require("mongoose");
const argon2 = require("argon2");

const userSchema = new moongose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: [true, "Please insert an email"],
        unique: true,
        trim: true,
        lowercase: true,
        match: [
          /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
          "Please enter a valid email",
        ],
    },
    password: {
        type: String,
        unique: true,
        required: [true, "Please input a password"],
        minlength: [6, "Password must have at least 6 characters"],
    },
    bio: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }

},
    {timestamps : true } 
);

// Encrypt password before saving
userSchema.pre('save', async function (next) {
      if (this.isModified('password')) {
        try{
            this.password = await argon2.hash(this.password);
    } catch (error) {
      return next(error);
    }
  }
});

// Compared hashed password
userSchema.methods.comparePassword = async function(candidatePassword){
    try{
        return await argon2.verify(this.password, candidatePassword)
    } catch(error){
        throw error
    }
};
//indexing
userSchema.index({username : "text"}); 
  
module.exports = mongoose.model('User', userSchema);
  