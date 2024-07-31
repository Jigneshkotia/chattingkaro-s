import { body, param, validationResult } from "express-validator";
import { ErrorHandler } from "../utils/utility.js";

const validateHandler = (req, res, next) => {
  const errors = validationResult(req);

  const errorMessages = errors
    .array()
    .map((error) => error.msg)
    .join(", ");

  console.log(errorMessages);
  if (errors.isEmpty()) return next();
  else next(new ErrorHandler(errorMessages, 400));
};

const registerValidator = () => [
  body("name", "Please Enter a Name").notEmpty(),
  body("username", "Please Enter a Username").notEmpty(),
  body("bio", "Please Enter a Bio").notEmpty(),
  body("password", "Please Enter a Password").notEmpty(),
];

const loginValidator = () => [
  body("username", "Please Enter a Username").notEmpty(),
  body("password", "Please Enter a Password").notEmpty(),
];

const newGroupValidator = () => [
  body("name", "Please Enter a name").notEmpty(),
  body("members")
    .notEmpty()
    .withMessage("Please Enter a member")
    .isArray({ min: 2, max: 100 })
    .withMessage("Members must be between 2-100"),
];

const addMembersValidator = () => [
  body("chatId", "Please Enter a chat-ID").notEmpty(),
  body("members")
    .notEmpty()
    .withMessage("Please Enter a member")
    .isArray({ min: 1, max: 97 })
    .withMessage("Members must be between 2-100"),
];

const removeMemberValidator = () => [
  body("chatId", "Please Enter a chat-ID").notEmpty(),
  body("userId", "Please Enter a user-ID").notEmpty(),
];

const sendAttachmentsValidator = () => [
  body("chatId", "Please Enter a chat-ID").notEmpty(),
];

const chatIdValidator = () => [
  param("id", "Please Enter a chat-ID").notEmpty(),
];

const renameValidator = () => [
  param("id", "Please Enter a chat-ID").notEmpty(),
  body("name", "Please Enter a Name").notEmpty(),
];

const sendRequestValidator = () => [
  body("userId", "Please Enter user ID").notEmpty(),
];

const acceptRequestValidator = () => [
  body("requestId", "Please Enter request ID").notEmpty(),
  body("accept")
    .notEmpty()
    .withMessage("Please add accept")
    .isBoolean()
    .withMessage("accept must be boolean"),
];

const adminLoginValidator = () => [
  body("secretKey","Please Enter Secret Key").notEmpty(),
];



export {
  acceptRequestValidator, addMembersValidator, adminLoginValidator, chatIdValidator, loginValidator,
  newGroupValidator, registerValidator, removeMemberValidator, renameValidator, sendAttachmentsValidator, sendRequestValidator, validateHandler
};

