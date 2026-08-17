const mongoose = require("mongoose")

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
    }
})

const review = mongoose.model("review",reviewsch)

module.exports = review;
