
import dotenv from "dotenv";

// This module is evaluated before app.js calls dotenv.config() in ESM mode.
dotenv.config({ path: "./.env" });

const configuredClientUrl = process.env.CLIENT_URL?.trim().replace(/\/$/, "");

const corsOptions = {
    origin : [...new Set([
        configuredClientUrl,
        "https://www.heybuddy.live",
        "https://chattingkaro-client.vercel.app",
        "https://www.chattingkaro.live",
    ].filter(Boolean))],
    methods : ["GET","POST","PUT","DELETE"],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials : true
}


const TOKEN_NAME = "chat-ka-token";


export{corsOptions, TOKEN_NAME}
