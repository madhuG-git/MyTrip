const mongoose = require("mongoose")

const listiningsch = mongoose.Schema({
    title : {
        type : String,
    },
    description : {
        type : String
    },
    image : {
        type : String,
        default :  "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YmVhY2glMjBob3VzZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
        set : (v)=> v === "" ?  "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YmVhY2glMjBob3VzZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60" : v
    },
    price : {
        type : Number,
    },
    location : {
        type : String
    },
    country : {
        type : String
    }
})

const listing = mongoose.model("listing",listiningsch)
module.exports = listing;