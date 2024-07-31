import { adminSecretKey } from "../app.js";
import { ErrorHandler } from "../utils/utility.js";
import jwt from "jsonwebtoken";
import { TryCatch } from "./error.js";
import { TOKEN_NAME } from "../constants/config.js";
import { User } from "../models/user.js";

const isAuthenticated = TryCatch ((req, res, next) => {
  const token = req.cookies[TOKEN_NAME];

  if (!token)
    return next(new ErrorHandler("Please Login To Access This Route", 401));

  const decodedData = jwt.verify(token, process.env.JWT_SECRET);

  req.user = decodedData._id;

  console.log(decodedData);
  next();
})

const adminOnly = (req, res, next) => {
  const token = req.cookies["ChatApp-Admin-token"];

  if (!token)
    return next(new ErrorHandler("Only Admin can Access This Route", 401));

  const secretKey = jwt.verify(token, process.env.JWT_SECRET);
  const isMatched = secretKey === adminSecretKey;

  if (!isMatched) return next(new ErrorHandler("Only Admin can Access This Route", 401));

  next();
};

const socketAuthenticator = async  (err, socket, next)=>{
  try {
    
    if(err) return next(err);
     
    const authToken =  socket.request.cookies[TOKEN_NAME]

    if(!authToken) return next(new ErrorHandler("Please Login to access this route",401))

    const decodedData = jwt.verify(authToken,process.env.JWT_SECRET);

    const user = await User.findById(decodedData._id);

    if(!user) return next(new ErrorHandler("Please login to access this route",401));

    socket.user = user;

    return next();

  } catch (error) {
    console.log(error)
    return next(new ErrorHandler("Please Login to access this route",401))
  }
}

export { isAuthenticated, adminOnly ,socketAuthenticator };
