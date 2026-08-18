const express = require("express")
const app = express()
const mongoose = require("mongoose")
const path = require("path")
const methodoverride = require("method-override")
const ejsmate = require("ejs-mate")
const wrapAsync = require("./utils/wrapAsync")
const ExpressError = require("./utils/ExpressError")
const cookieparser = require("cookie-parser")
const session = require("express-session")
const flash = require("connect-flash")

app.listen(8080,()=> {
    console.log("Server is listening on port 8080")
})

async function connectdb() {
    await mongoose.connect('mongodb://127.0.0.1:27017/MyTrip')
}
connectdb().then(()=> {
    console.log("Database connected")
}).catch((err)=> {
    console.log(err)
})

const listing = require("./models/listingsch")
const review = require("./models/reviews")
require('dotenv').config()
app.set("view engine","ejs")
app.use(express.urlencoded({ extended: true }));
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(methodoverride("_method"));
app.engine("ejs",ejsmate)
app.use(cookieparser())

const sessionOptions = {
    secret : process.env.SESSIONSECRET,
    resave : false,
    saveUninitialized : true,
    cookie : {
        maxAge : 60*60*1000,
        httpOnly : true,
    }
}

app.use(session(sessionOptions))
app.use(flash())

app.use((req,res,next)=> {
    res.locals.success = req.flash("success")
    res.locals.error = req.flash("error")
    next()
})


//routes

app.get("/",(req,res)=> {
    res.send("root-page")
})

app.get("/listings",wrapAsync( async (req,res)=> {
    const data = await listing.find()
    res.render("listings/home",{data})
}))

app.get("/listings/new",(req,res)=> {
    res.render("listings/create")
})

app.get("/listings/:id",wrapAsync(  async (req,res)=> {
    const {id} = req.params;
    const data = await listing.findById(id).populate("reviews")
    if(!data) {
        req.flash("error","Listing you request for does not exist!")
       return res.redirect("/listings")
    }
    res.render("listings/show",{data})
}))

app.post("/listings",wrapAsync(  async (req,res)=> {
    const {title,description,image,price,location,country} = req.body;
    if(!title || !description  || !price || !location || !country) {
        throw new ExpressError(400,"send valid data for listing")
    }
    await listing.insertOne({title:title,description:description,image:image,price:price,location:location,country:country})
    req.flash("success","New Listing Created")
    res.redirect("/listings")
}))

app.get("/listings/:id/edit", wrapAsync( async (req,res)=> {
    const {id} = req.params;
    const data = await listing.findById(id)
    if(!data) {
        req.flash("error","Listing you request for does not exist!")
       return res.redirect("/listings")
    }
    res.render("listings/edit" ,{data})
}))

app.put("/listings/:id",wrapAsync( async (req,res)=> {
    const {id} = req.params;
    const {title,description,image,price,location,country} = req.body;
     if(!title || !description   || !price || !location || !country) {
        throw new ExpressError(400,"send valid data for listing")
    }
    await listing.findByIdAndUpdate(id,{title:title,description:description,image:image,price:price,location:location,country:country})
    req.flash("success","Listing Updated")
    res.redirect(`/listings/${id}`)

}))

app.delete("/listings/:id",wrapAsync( async (req,res) => {
    const {id} = req.params
    await listing.findByIdAndDelete(id)
    req.flash("success","Listing Deleted")
    res.redirect("/listings")
}))

//review route

app.post("/listings/:id/review",wrapAsync(async(req,res)=> {
    const {id} = req.params;
    const place = await listing.findById(id)
    let {rating,comment} = req.body
    const newreview = new review({rating : rating,comment : comment})
    await newreview.save()
    place.reviews.push(newreview)
    await place.save()
    req.flash("success","New Review Created")
    res.redirect(`/listings/${id}`)
}))

app.delete("/listings/:id/review/:reviewid",wrapAsync(async(req,res)=> {
    let {id,reviewid} = req.params
    await listing.findByIdAndUpdate(id,{$pull: {reviews : reviewid}})
    await review.findByIdAndDelete(reviewid)
    req.flash("success","Review Deleted")
    res.redirect(`/listings/${id}`)
}))


app.use((req,res,next)=> {
    throw new ExpressError(404,"Page Not Found")
})

app.use((err,req,res,next)=> {
    let {status = 500,message = "Something Went Worng"} = err
    res.status(status).render("listings/err",{message})
})
