const express = require("express")
const app = express()
const mongoose = require("mongoose")
const path = require("path")
const methodoverride = require("method-override")
const ejsmate = require("ejs-mate")
const wrapAsync = require("./utils/wrapAsync")
const ExpressError = require("./utils/ExpressError")


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
app.set("view engine","ejs")
app.use(express.urlencoded({ extended: true }));
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(methodoverride("_method"));
app.engine("ejs",ejsmate)

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
    res.render("listings/show",{data})
}))

app.post("/listings",wrapAsync(  async (req,res)=> {
    const {title,description,image,price,location,country} = req.body;
    if(!title || !description  || !price || !location || !country) {
        throw new ExpressError(400,"send valid data for listing")
    }
    await listing.insertOne({title:title,description:description,image:image,price:price,location:location,country:country})
    res.redirect("/listings")
}))

app.get("/listings/:id/edit", wrapAsync( async (req,res)=> {
    const {id} = req.params;
    const data = await listing.findById(id)
    res.render("listings/edit" ,{data})
}))

app.put("/listings/:id",wrapAsync( async (req,res)=> {
    const {id} = req.params;
    const {title,description,image,price,location,country} = req.body;
     if(!title || !description   || !price || !location || !country) {
        throw new ExpressError(400,"send valid data for listing")
    }
    await listing.findByIdAndUpdate(id,{title:title,description:description,image:image,price:price,location:location,country:country})
    res.redirect(`/listings/${id}`)

}))

app.delete("/listings/:id",wrapAsync( async (req,res) => {
    const {id} = req.params
    await listing.findByIdAndDelete(id)
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
    res.redirect(`/listings/${id}`)
}))

app.delete("/listings/:id/review/:reviewid",wrapAsync(async(req,res)=> {
    let {id,reviewid} = req.params
    await listing.findByIdAndUpdate(id,{$pull: {reviews : reviewid}})
    await review.findByIdAndDelete(reviewid)
    res.redirect(`/listings/${id}`)
}))

app.use((req,res,next)=> {
    throw new ExpressError(404,"Page Not Found")
})

app.use((err,req,res,next)=> {
    let {status = 500,message = "Something Went Worng"} = err
    res.status(status).render("listings/err",{message})
})
