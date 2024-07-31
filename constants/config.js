
const corsOptions = {
    origin :[process.env.CLIENT_URL],
    methods : ["GET","POST","PUT","DELETE"],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials : true
}

const TOKEN_NAME = "chat-ka-token";


export{corsOptions, TOKEN_NAME}