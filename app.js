import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { errorMiddleware } from "./middlewares/error.js";
import adminRoute from "./routes/admin.js";
import chatRoute from "./routes/chat.js";
import userRoute from "./routes/user.js";
import { connectDB } from "./utils/features.js";
import { CHAT_JOINED, CHAT_LEAVED, NEW_MESSAGE, NEW_MESSAGES_ALERT, ONLINE_USERS, START_TYPING , STOP_TYPING} from "./constants/events.js";
import { v4 as uuid } from "uuid";
import { getSockets } from "./lib/helper.js";
import { Message } from "./models/message.js";
import { Chat } from "./models/chat.js";
import { User } from "./models/user.js";
import { batchGetEmbeddings, generatePersonaResponse } from "./services/geminiService.js";
import { queryPersonaChunks } from "./services/pineconeService.js";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";
import { corsOptions } from "./constants/config.js";
import { socketAuthenticator } from "./middlewares/auth.js";
dotenv.config({
  path: "./.env",
});

const mongoURI = process.env.MONGO_URI;
const port = process.env.PORT || 3000;
const envMode = process.env.NODE_ENV
  ? process.env.NODE_ENV.trim()
  : "PRODUCTION";
const adminSecretKey = process.env.SECRET_KEY || "jigneshKiChatApp";
const userSocketIDs = new Map();
const onlineUsers = new Set()

connectDB(mongoURI);
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: corsOptions });

app.set("io",io); 

//using Middlewares here
app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));

app.use("/api/v1/user", userRoute);
app.use("/api/v1/chat", chatRoute);
app.use("/api/v1/admin", adminRoute);

app.get("/", (req, res) => {
  res.send("hello from home!!");
});

io.use((socket, next) => {
  cookieParser()(
    socket.request,
    socket.request.res,
    async (err) => await socketAuthenticator(err,socket,next)
  );
});

io.on("connection", (socket) => {

  const user = socket.user;

  userSocketIDs.set(user._id.toString(), socket.id);


  socket.on(NEW_MESSAGE, async ({ chatId, members, message }) => {
    const messageForRealTime = {
      content: message,
      _id: uuid(),
      sender: {
        _id: user._id,
        name: user.name,
      },
      chat: chatId,
      createdAt: new Date().toISOString(),
    };

    const messageForDB = {
      content: message,
      sender: user._id,
      chat: chatId,
    };


    const membersSocket = getSockets(members);
    io.to(membersSocket).emit(NEW_MESSAGE, {
      chatId,
      message: messageForRealTime,
    });
    io.to(membersSocket).emit(NEW_MESSAGES_ALERT, {
      chatId,
    });

    try {
      await Message.create(messageForDB);
      const chat = await Chat.findById(chatId);
      if (!chat?.isDummyChat) return;

      const botId = chat.members.find((member) => member.toString() !== user._id.toString());
      const bot = await User.findById(botId, "name");
      if (!bot) return;
      socket.emit(START_TYPING, { chatId });
      const [queryVector, history] = await Promise.all([
        batchGetEmbeddings([message]).then(([vector]) => vector),
        Message.find({ chat: chatId }).sort({ createdAt: -1 }).limit(8).populate("sender", "name").lean(),
      ]);
      const retrievedChunks = await queryPersonaChunks(chat.dummyPersona.pineconeNamespace, queryVector);
      const reply = await generatePersonaResponse({
        personaName: chat.dummyPersona.name || bot.name,
        tonePrompt: chat.dummyPersona.tonePrompt,
        retrievedChunks,
        conversationHistory: history.reverse(),
        latestMessage: message,
      });
      const aiMessage = await Message.create({ content: reply, sender: bot._id, chat: chatId });
      io.to(socket.id).emit(NEW_MESSAGE, { chatId, message: { ...aiMessage.toObject(), sender: { _id: bot._id, name: bot.name } } });
      socket.emit(STOP_TYPING, { chatId });
    } catch (error) {
      console.log(error);
      socket.emit(STOP_TYPING, { chatId });
    }
    console.log("new message", messageForRealTime);
  });

  socket.on(START_TYPING, ({members, chatId})=>{


    const membersSockets = getSockets(members)

    socket.to(membersSockets).emit(START_TYPING, {chatId})
  })

  socket.on(STOP_TYPING, ({members, chatId})=>{


    const membersSockets = getSockets(members)

    socket.to(membersSockets).emit(STOP_TYPING, {chatId})
  })

  socket.on(CHAT_JOINED,({userId, members})=>{
    onlineUsers.add(userId.toString())
    
    const membersSocket = getSockets(members);
    io.to(membersSocket).emit(ONLINE_USERS, Array.from(onlineUsers))
  })

  socket.on(CHAT_LEAVED,({userId, members })=>{
    onlineUsers.delete(userId.toString())

    const membersSocket = getSockets(members);
    io.to(membersSocket).emit(ONLINE_USERS, Array.from(onlineUsers))
  })

  socket.on("disconnect", () => {
    userSocketIDs.delete(user._id.toString());
    onlineUsers.delete(user._id.toString())
    socket.broadcast.emit(ONLINE_USERS, Array.from(onlineUsers))
  });
});

app.use(errorMiddleware);

server.listen(port, () => {
  console.log(`the app is listening on port ${port} in ${envMode} mode`);
});

export { userSocketIDs, envMode, adminSecretKey };
