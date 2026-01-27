const jwt = require('jsonwebtoken');

const protectRoute = async(req,res,next)=>{
    try{
        const path = req.path;
        //console.log(path);
        if(path.includes('/auth')){
            console.log("Auth route, skipping protection");
            return next();
        }
        const token = req?.cookies?.token;
        console.log(token);
        if(!token){
            return res.status(401).json({msg:'Unauthorized access'})
        }

        const verify = jwt.verify(token,process.env.JWT_SECRET);
        if(!verify){
            return res.status(401).json({msg:'Unauthorized access'})
        }

        next();
        
    }
    catch(err){
        return res.status(401).json({msg:"Unauthorized access"})
    }
}

module.exports = {protectRoute};