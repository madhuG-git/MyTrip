const mongoose = require("mongoose")
const User = require("./user")

const reviewsch = mongoose.Schema({
    comment : {
        type : String
    },
    rating : {
        type : Number,
        min : 1,
        max : 5,
    },
    createAt : {
        type : Date,
        default : Date.now()
    },
    author : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    }
})

const review = mongoose.model("review",reviewsch)

module.exports = review;
