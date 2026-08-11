const express = require("express")
const app = express()
const mongoose = require("mongoose")
const path = require("path")
const methodoverride = require("method-override")
const ejsmate = require("ejs-mate")

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

app.get("/listings",async (req,res)=> {
    const data = await listing.find()
    res.render("listings/home",{data})
})

app.get("/listings/new",(req,res)=> {
    res.render("listings/create")
})

app.get("/listings/:id",async (req,res)=> {
    const {id} = req.params;
    const data = await listing.findById(id)
    res.render("listings/show",{data})
})

app.post("/listings",async (req,res)=> {
    const {title,description,image,price,location,country} = req.body;
    await listing.insertOne({title:title,description:description,image:image,price:price,location:location,country:country})
    res.redirect("/listings")
})

app.get("/listings/:id/edit",async (req,res)=> {
    const {id} = req.params;
    const data = await listing.findById(id)
    res.render("listings/edit" ,{data})
})

app.put("/listings/:id",async (req,res)=> {
    const {id} = req.params;
    const {title,description,image,price,location,country} = req.body;
    await listing.findByIdAndUpdate(id,{title:title,description:description,image:image,price:price,location:location,country:country})
    res.redirect(`/listings/${id}`)

})

app.delete("/listings/:id",async (req,res) => {
    const {id} = req.params
    await listing.findByIdAndDelete(id)
    res.redirect("/listings")
})