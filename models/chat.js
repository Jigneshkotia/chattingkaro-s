import mongoose ,{ Schema, Types, model } from "mongoose";

const schema = new Schema({
    name: {
        type : String,
        required : true,
    },
    groupChat: {
        type : Boolean,
        default: false
    },
    creator: {
        type : Types.ObjectId,
        ref : "User"
    },
    members:[{
        type : Types.ObjectId,
        ref : "User"
    }],
    isDummyChat: { type: Boolean, default: false },
    dummyPersona: {
      name: String,
      bio: String,
      avatar: String,
      targetSenderInChat: String,
      tonePrompt: String,
      pineconeNamespace: String,
      totalChunks: { type: Number, default: 0 },
    },
},{
    timestamps : true
});

export const Chat = mongoose.models.Chat || model("Chat",schema);
