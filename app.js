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
const passport = require("passport")
const LocalStrategy = require("passport-local")
const User = require("./models/user")
      

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

app.use(passport.initialize())
app.use(passport.session())
passport.use(new LocalStrategy(User.authenticate()))

passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

const isloggedin = ((req,res,next)=> {
    if(!req.isAuthenticated()) {
        req.session.redirecturl  = req.originalUrl;
        req.flash("error","you have to login")
        return res.redirect("/login")
    }
    next()
})

const saveurl = ((req,res,next)=> {
    if(req.session.redirecturl) {
        res.locals.redirecturl = req.session.redirecturl
    }
    next()
})

app.use((req,res,next)=> {
    res.locals.success = req.flash("success")
    res.locals.error = req.flash("error")
    res.locals.curruser = req.user
    next()
})

const isowner = async (req,res,next)=> {
    let {id} = req.params;
    let data = await listing.findById(id)

    if (!data) {
    req.flash("error", "Listing does not exist.");
    return res.redirect("/listings");
    }

    if(!data.owner.equals(res.locals.curruser._id)) {
        req.flash("error","You do not have permission.")
        return res.redirect(`/listings/${id}`)
    } 
    next()
}

const isauthor = async (req,res,next)=> {
    let {id,reviewid} = req.params
    let data = await review.findById(reviewid)
     if (!data) {
        req.flash("error", "Review does not exist.");
        return res.redirect(`/listings/${id}`);
    }
    if(!data.author.equals(res.locals.curruser._id)) {
        req.flash("error","You do not have permission.")
        return res.redirect(`/listings/${id}`)
    } 
    next()
}



//routes

app.get("/",(req,res)=> {
    res.send("root-page")
})

app.get("/listings",wrapAsync( async (req,res)=> {
    const data = await listing.find()
    res.render("listings/home",{data})
}))

app.get("/listings/new",isloggedin,(req,res)=> {
    res.render("listings/create")
})

app.get("/listings/:id",wrapAsync(  async (req,res)=> {
    const {id} = req.params;
    const data = await listing.findById(id).populate({path :"reviews",populate : {path : "author"}}).populate("owner")
    if(!data) {
        req.flash("error","Listing you request for does not exist!")
       return res.redirect("/listings")
    }
    res.render("listings/show",{data})
}))

app.post("/listings",isloggedin,wrapAsync(  async (req,res)=> {
    const {title,description,image,price,location,country} = req.body;
    if(!title || !description  || !price || !location || !country) {
        throw new ExpressError(400,"send valid data for listing")
    }
    const newlisting = new listing({title:title,description:description,image:image,price:price,location:location,country:country})
    newlisting.owner = req.user._id
    await newlisting.save()
    req.flash("success","New Listing Created")
    res.redirect("/listings")
}))

app.get("/listings/:id/edit",isloggedin,isowner, wrapAsync( async (req,res)=> {
    const {id} = req.params;
    const data = await listing.findById(id)
    if(!data) {
        req.flash("error","Listing you request for does not exist!")
       return res.redirect("/listings")
    }
    res.render("listings/edit" ,{data})
}))

app.put("/listings/:id",isloggedin,isowner,wrapAsync( async (req,res)=> {
    const {id} = req.params;
    const {title,description,image,price,location,country} = req.body;
     if(!title || !description   || !price || !location || !country) {
        throw new ExpressError(400,"send valid data for listing")
    }
    await listing.findByIdAndUpdate(id,{title:title,description:description,image:image,price:price,location:location,country:country})
    req.flash("success","Listing Updated")
    res.redirect(`/listings/${id}`)

}))

app.delete("/listings/:id",isloggedin,isowner,wrapAsync( async (req,res) => {
    const {id} = req.params
    await listing.findByIdAndDelete(id)
    req.flash("success","Listing Deleted")
    res.redirect("/listings")
}))

//review route

app.post("/listings/:id/review",isloggedin,wrapAsync(async(req,res)=> {
    const {id} = req.params;
    const place = await listing.findById(id)
    let {rating,comment} = req.body
    const newreview = new review({rating : rating,comment : comment})
    newreview.author = req.user._id;
    await newreview.save()
    place.reviews.push(newreview)
    await place.save()
    req.flash("success","New Review Created")
    res.redirect(`/listings/${id}`)
}))

app.delete("/listings/:id/review/:reviewid",isloggedin,isauthor,wrapAsync(async(req,res)=> {
    let {id,reviewid} = req.params
    await listing.findByIdAndUpdate(id,{$pull: {reviews : reviewid}})
    await review.findByIdAndDelete(reviewid)
    req.flash("success","Review Deleted")
    res.redirect(`/listings/${id}`)
}))

//Users

app.get("/signup",(req,res)=> {
    res.render("listings/signup")
})

app.post("/signup",wrapAsync(async(req,res,next)=> {
    try {
        let {username,email,password} = req.body
        const newuser = new User({email,username})
       const registerduser =  await User.register(newuser,password)
        req.login(registerduser,(err)=> {
            if(err) {
                return next(err)
            }
             req.flash("success","Welcome To TripNest")
             res.redirect("/listings")
        })
    }catch(er) {
        req.flash("error",er.message)
        res.redirect("/signup")
    }
}))

app.get("/login",(req,res)=> {
    res.render("listings/login")
})

app.post("/login",saveurl,passport.authenticate("local",{failureRedirect : "/login" , failureFlash : true}),async (req,res)=> {
    req.flash("success","Welcome Back To TripNest")
    let redirectUrl = res.locals.redirecturl || "/listings"
    res.redirect(redirectUrl)
})

app.get("/logout",(req,res,next)=> {
    req.logout((err)=> {
        if(err) {
            return next(err)
        }
        req.flash("success","logout successfully")
        res.redirect("/listings")
    })
})

app.use((req,res,next)=> {
    throw new ExpressError(404,"Page Not Found")
})

app.use((err,req,res,next)=> {
    let {status = 500,message = "Something Went Worng"} = err
    res.status(status).render("listings/err",{message})
})
