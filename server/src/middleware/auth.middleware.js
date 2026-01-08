const jwt = require('jsonwebtoken');

const protectRoute = async(req,res,next)=>{
    try{
        console.log(req);
        if(req.path =='/auth'){
            console.log("Auth route, skipping protection");
            next();
        }
        const token = req?.cookies?.token;
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