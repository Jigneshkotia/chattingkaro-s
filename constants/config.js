
const corsOptions = {
    origin :'https://www.chattingkaro.live',
    methods : ["GET","POST","PUT","DELETE"],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials : true
}


const TOKEN_NAME = "chat-ka-token";


export{corsOptions, TOKEN_NAME}