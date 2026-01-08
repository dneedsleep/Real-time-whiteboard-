const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user.js');


async function signup(req, res) {
    try{
        console.log("Signup request body:", req.body);
    const data = req.body;
    const email = data?.email;
    const password = data?.password;


    if (!email || !password) {
        console.log("Missing email or password");
        return res.status(401).json({ msg: "No password  or email" })
    }

    const ifExist = await User.findOne({ email });
    if(ifExist){
        console.log("User already exists with email:", email);
        return res.status(401).json({msg:"Already exist"});
    }

    const passwordHash = await bcrypt.hash(password, 10);



    const user = await User.create({ email: email, password: passwordHash });

    const token = jwt.sign({userId:user._id , email:email} , process.env.JWT_SECRET , {expiresIn:"3h"});
    res.cookie('token',token ,{
        httpOnly:true,
        secure:false
    })
    return res.status(200).json({token , user: {id:user._id , email:email}});
    }
    catch(err){
        console.log("Signup error:", err);
        return res.status(500).json({msg:"Internal server error"});
    }
}


async function login(req, res) {
    const data = req.body;
    const email = data?.email;
    const password = data?.password;


    if (!email || !password) {
        console.log("Missing email or password");
        return res.status(401).json({ msg: "No password  or email" })
    }

    const exist = await User.findOne({ email });

    if (!exist) {
        console.log("No user found with email:", email);
        return res.status(401).json({ msg: "No user found" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const isMatch = await bcrypt.compare(password, exist.password);
    if (!isMatch) {
        console.log("Invalid credentials for password:", email);
        return res.status(401).json({ msg: "Invalid credentials" });
    }
    const token = jwt.sign({
        userId: exist._id, email: email
    }, process.env.JWT_SECRET,
        { expiresIn: '3h' });
    res.cookie('token', token, {
        httpOnly: true,
        secure: false
    })
    
     return res.status(201).json({
            token,
            user: { id: exist._id, email }
        });

}

module.exports = { signup, login };