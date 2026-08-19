const mongoose = require("mongoose")
const passportLocalMongoose = require("passport-local-mongoose").default;

const usersch = mongoose.Schema({
    email : {
        type : String,
        required : true
    }
})

usersch.plugin(passportLocalMongoose);

const User = mongoose.model("User",usersch)

module.exports = User;
