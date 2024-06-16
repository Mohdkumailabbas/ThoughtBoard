const express = require("express");
const bcrypt = require('bcrypt');
const path = require('path');
const cookieParser = require('cookie-parser');
const app = express();
const jwt = require("jsonwebtoken");
const usermodel = require("./models/user");
const postmodel = require("./models/post");

app.set('view engine', "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

app.get("/", (req, res) => {
    res.render("index");
});

app.post("/register", async (req, res) => {
    let { username, email, age, password, name } = req.body;
    let findemail = await usermodel.findOne({ email });
    if (findemail) return res.status(302).send("User already registered");
    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {
            let user = await usermodel.create({
                username,
                name,
                age,
                email,
                password: hash
            });
            let token = jwt.sign({ email: email, userid: user._id }, "shhh"); //Used to create a unique signature for the token, ensuring its authenticity and preventing unauthorized modifications.
            res.cookie("token", token);
            res.send("registered");
        });
    });
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", async (req, res) => {
    let { password, email } = req.body;
    let user = await usermodel.findOne({ email: email });
    if (!user) return res.status(300).send("Something went wrong, check your credentials");
    bcrypt.compare(password, user.password, (err, result) => {
        if (result) {
            let token = jwt.sign({ email: email, userid: user._id }, "shhh"); //Used to create a unique signature for the token, ensuring its authenticity and preventing unauthorized modifications.
            res.cookie("token", token);
            return res.redirect("/profile");
        }
        else res.redirect("/login");
    });
});

app.get("/profile", isloggedin, async (req, res) => {
    let user = await usermodel.findOne({ email: req.user.email }).populate("posts");
    res.render("profile", { user });
});
app.get("/like/:id", isloggedin, async (req, res) => {
    let post = await postmodel.findOne({ _id: req.params.id }).populate("user");
    if(post.likes.indexOf(req.user.userid)=== -1){
        post.likes.push(req.user.userid);
    }
    else{
        post.likes.splice(post.likes.indexOf(req.user.userid),(1))
    }
    
    await post.save()
    res.redirect("/profile");
});
app.get("/edit/:id", isloggedin, async (req, res) => {
    let post = await postmodel.findOne({ _id: req.params.id }).populate("user");
    
    res.render("edit",{post});
});
app.post("/update/:id", isloggedin, async (req, res) => {
    let post = await postmodel.findOneAndUpdate({ _id: req.params.id },{content:req.body.content});
    res.redirect("/profile");
    
    res.render("edit",{post});
});
app.post("/profile", isloggedin, async (req, res) => {
    let user = await usermodel.findOne({ email: req.user.email }); // Determine which user is logged in
    let {content} = req.body;
    let post = await postmodel.create({
        user: user._id,
        content
    });
    user.posts.push(post._id); // Add post ID to user's posts
    await user.save();
    res.redirect("/profile");
});

app.get("/logout", (req, res) => {
    res.cookie("token", "");
    res.redirect("/login");
});

function isloggedin(req, res, next) {
    if (req.cookies.token === "") res.redirect("/login");
    else {
        // Commented out JWT verification for troubleshooting
        let data = jwt.verify(req.cookies.token, "shhh");
        req.user = data;
        next();
    }
}

app.listen(3000, () => {
    console.log("listening at port 3000");
});




// const bcrypt= require('bcrypt')
// const path=require('path');
// const cookieParser=require('cookie-parser')

// const jwt =require("jsonwebtoken")
// app.set('view engine',"ejs");
// app.use(express.json());
// app.use(express.urlencoded({extended:true}));
// app.use(express.static(path.join(__dirname,'public')));
// app.use(cookieParser());
// app.get("/",(req,res)=>{
//     res.render("index")
// });
// app.post("/create", (req, res) => {
//     let { username, age, password, email } = req.body;
    
//     bcrypt.genSalt(10, (err, salt) => {
//         bcrypt.hash(password, salt, async (err, hash) => {
//             //  Create user with hashed password
//             let usercreated = await  usermodel.create({
//                 username,
//                 age,
//                 password: hash,
//                 email
//             });
//             let token=jwt.sign({email},"shshshsh");
//             res.cookie("token",token)

            
//             res.send(usercreated);
//         });
//     });
// });
// app.get("/login",(req,res)=>{
//     res.render("login")
// })
// app.post("/login",async(req,res)=>{
//      let user =await usermodel.findOne({email:req.body.email})
//      if(!user) return res.send("nananan");
//      bcrypt.compare(req.body.password,user.password ,function(err,result){
//         if(result){
//             let token=jwt.sign({email:user.email},"shshshsh");
//             res.cookie("token",token)

//             res.send("u login")
//         }else{
//             res.send("wrong")
//         }
//      })
// })
// app.get("/logout",(req,res)=>{
//     res.cookie("token","")
//     res.redirect("/")
// })