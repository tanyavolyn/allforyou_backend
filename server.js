const express = require('express');
const app = express();
const Stripe = require('stripe');
const stripe = Stripe('sk_test_51OHwkvJZ4arl6xajnsWhSgm3h2oeN2V8P9Oq4TqFPaUKCgx96iPXtfvEtaQjvxySBM0CRJOknQVFUHKQCz0s3dW0006TDrdQKK');


const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const bodyParser = require("body-parser");
const { start } = require('repl');
app.use(bodyParser.urlencoded({extended: false}));


require('dotenv').config();
mongoose.set("strictQuery", false);

const PORT = process.env.PORT || 1000;
app.use(express.json());
app.use(cors());
app.use(express.static("public"));

// const ImportData = require('./DataImport.js');
// const productRoute = require('./Routes/ProductRoutes.js');
// const { notFound, errorHandler } = require('./Middleware/Errors.js');
app.use(
    cors()
)





mongoose
.connect(process.env.MONGODB_LINK)
.then(() => console.log("WE WERE CONNECTED TO MONGO"))
.catch ((err) => console.log(err))

//API
app.get("/", (req,res) => {
    res.send("Express App is running")
})


// app.use("/api/import/", ImportData);
// app.use("/api/products/", productRoute);
const storage = multer.diskStorage({
    destination: "./upload/image",
    filename:(req,file,cb) =>{
        return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
})
const upload = multer({storage: storage})

//upload image
app.use("/images,", express.static("upload/images"))
app.post("/upload", upload.single("product"), (req,res) => {
    res.json({
        success: 1,
image_url: `http://localhost:${PORT}/images/${req.file.filename}`
    })
})

const Product = mongoose.model("Product", {
    id:{
        type: Number,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    // searchTerm: {
    //     type: String,
    //     required: true,
    // },
    name: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    size: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    date:{
        type: Date,
        default: Date.now,
    },
    avilable: {
        type: Boolean,
        default: true,
    }
})


app.post('/addproduct', async (req, res) => {
    let products = await Product.find({});
    let id;
    if (products.length>0){
        let last_product_array = products.slice(-1);
        let last_product =last_product_array[0];
        id = last_product.id+1;
    } else {
        id=1;

    }
    const product = new Product({
        id: id,
        name: req.body.name,
        image: req.body.image,
        size: req.body.size,
        //searchTerm: req.body.searchTerm,
        price: req.body.price
    });

    console.log(product)
    await product.save();
    console.log("saved");
    res.json({
        success: true,
        name: req.body.name,
    })
})



// ERROR
// app.use(notFound)
// app.use(errorHandler)

// Creating API for deleting Products
app.post("/removeproduct", async(req,res) => {
    await Product.findOneAndDelete({id:req.body.id});
    console.log("Removed");
    res.json({
        success: true,
        name: req.body.name
    })
})



// Creating API for getting all products

app.get ("/allproducts", async (req,res) => {
    let products = await Product.find({});
    console.log("All Products Fetched");
    res.send(products);

})





//Shema creating for User model

const Users = mongoose.model("Users", {
    name: {
        type: String,
         },
  email: {
        type: String,
        unique: true
    },
    password: {
        type: String,
         },
         cartData: {
            type: Object,
             },
             date:{
                type: Date,
                default:Date.now,
             }
})

// Creating Endpoint for registering the user

app.post("/signup", async(req,res) => {
let check = await Users.findOne({email:req.body.email});
if(check){
    return res.status(400).json({success:false, errors: "existing user found with same email adress"})
}
let cart = {};
for (let i=0; i < 300; i++){
    cart[i]=0;
}
const user = new Users({
    name: req.body.username,
    email: req.body.email,
    password:req.body.password,
    cartData:cart,
})
await user.save();
const data = {
    user:{
        id:user.id
    }
}
const token = jwt.sign(data, "secret_ecom");
res.json({success:true, token})
})

// Creating endpoint for user login 
app.post("/login", async (req,res) =>{
    let user = await Users.findOne({email:req.body.email});
    if(user){
        const passCompare = req.body.password === user.password;
        if (passCompare){
            const data = {
                user:{
                    id:user.id
                }
            }
            const token = jwt.sign(data, "secret_ecom");
            res.json({success:true, token})
        }else{
            res.json({success:false, errors:"Wrong Password"})
        }
      }else{
        res.json({success:false, errors:"Wrong Email"})
      }
})

const fetchUser = async(req,res,next) => {
    const token = req.header("auth-token");
    if(!token){
        res.status(401).send({errors: "Please authenticate using valid" })
    } else {
        try{
const data = jwt.verify(token, "secret_ecom");
req.user = data.user;
next();
        } catch (error) {
res.status(401).send({errors:"Please authenticate using a valid token"})
        }

    }
}




//creating endpoint for adding products in cart 
app.post("/addtocart", fetchUser, async (req,res) => {
    console.log("added", req.body.itemId, req.body.selectedOption)
    let userData = await Users.findOne({_id:req.user.id});
    userData.cartData[req.body.itemId] += 1;
    await Users.findOneAndUpdate({_id: req.user.id}, {cartData: userData.cartData}, {selectedOption: selectedOption.value});
    res.send("Added");
    // const {id, image, name, price, quantity, searchTerm} = req.body;
    // const product = await Product.create({id, image, name, price, quantity, searchTerm});
    // res.send(product)
console.log(req.body, req.user)
})

//creating endpoint to remove product from cartdata
app.post("/removefromcart", fetchUser, async(req,res) => {
    console.log("removed", req.body.itemId)
    let userData = await Users.findOne({_id:req.user.id});
    if(userData.cartData[req.body.itemId]>0)
    userData.cartData[req.body.itemId] -= 1;
    await Users.findOneAndUpdate({_id: req.user.id}, {cartData: userData.cartData});
    res.send("Removed");
})

//creating endpoint to get cartdata


app.post('/getcart', fetchUser, async (req, res) => {
    console.log("Get Cart");
    let userData = await Users.findOne({_id:req.user.id});
    res.json(userData.cartData);
  
    })

//stripe

app.post("/stripe/charge", cors(), async (req, res) => {
    console.log("stripe-routes.js 9 | route reached", req.body);
    let { amount, id } = req.body;
   
    console.log("stripe-routes.js 10 | amount and id", amount, id);
    try {
      const payment = await stripe.paymentIntents.create({
        return_url: 'https://example.com/return_url',
        amount: amount,
        currency: "EUR",
        description: "Your Company Description",
        payment_method: id,
        confirm: true,
      });
      console.log("stripe-routes.js 19 | payment", payment);
      res.json({
        message: "Payment Successful",
        success: true,
      });
    } catch (error) {
      console.log("stripe-routes.js 17 | error", error);
      res.json({
        message: "Payment Failed",
        success: false,
      });
    }
  });









app.listen (PORT, () => {
    console.log(`server running in port ${PORT}`)
})
