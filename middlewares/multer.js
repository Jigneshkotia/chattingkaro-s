import multer from "multer";

const multerUpload = multer({limits: {fileSize: 1024 * 1024 * 5}});

const singleAvatar = multerUpload.single("avatar");

const attachmentsMulter = multerUpload.array("files",5);
const dummyChatUpload = multer({
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, callback) => callback(null, file.mimetype === "text/plain" || file.originalname.toLowerCase().endsWith(".txt")),
}).single("chatFile");

export {singleAvatar, attachmentsMulter, dummyChatUpload};
