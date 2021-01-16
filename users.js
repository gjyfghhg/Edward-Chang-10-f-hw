import Users from "../models/User";
import express from "express";
import UserController from "../controllers/users";
import UploadController from "../controllers/upload";
import getFileObject from "../helpers/fileObject";
require("dotenv").config();
const bucketName = process.env.AWS_BUCKET;
const router = express.Router();
let multer = require("multer");
const SIZE_LIMIT = 5242880;
const SIZE_TRANSIT = 1024;
const errorMessage = "File is too big";

/* GET users listing. */
router.get("/fetch", async (req, res, next) => {
  res.json({ success: true });
});
// change user avatar
router.post(
  "/avatar",
  UploadController.avatar.single("data"),
  async (req, res, error) => {
    try {
      const size = req.headers["content-length"];
      const fileObject = getFileObject(req.file);
      if (size < SIZE_LIMIT) {
        const url = `https://${bucketName}.s3.amazonaws.com/${req.file.key}`;
        const user = await UserController.changeAvatar(req.body, url);
        res.json({
          data: {
            url: url,
            size: size / SIZE_TRANSIT + "kb",
            name: fileObject.name,
            type: fileObject.type,
            extension: fileObject.extension,
          },
          success: true,
        });
      } else if (error instanceof multer.MulterError) {
        res.json({
          data: error,
          success: false,
        });
      } else {
        res.json({
          data: {
            errorMessage,
            size: size / SIZE_TRANSIT + "kb",
          },
          success: false,
        });
      }
    } catch (e) {
      return res.json({
        success: false,
        data: e,
      });
    }
  }
);

router.post("/", async (req, res) => {
  const result = await UserController.createNewUser(req);
  if (result) {
    res.json({
      success: true,
      data: result,
    });
  } else {
    res.json({
      success: false,
      data: "create new user failed",
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await UserController.getAllUsers(req.params.id);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.json({
      success: false,
      data: error,
    });
  }
});

router.get("/:username", async (req, res) => {
  try {
    const result = await UserController.getUserByUsername(req.query.username);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.json({
      success: false,
      data: error,
    });
  }
});

router.get("/:email", async (req, res) => {
  try {
    const result = await UserController.getUserByEmail(req.query.username);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.json({
      success: false,
      data: error,
    });
  }
});

//PUT: update user field by id
router.put("/id", async (req, res) => {
  const { id, key, value } = req.query;
  try {
    const result = await UserController.updateUserById(id, key, value);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      data: error,
    });
  }
});

router.delete("/id/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await UserController.deleteUserById(id);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.json({
      success: false,
      data: error,
    });
  }
});

// Add friend by id
router.post("/friends", async (req, res) => {
  const { friend_1_id, friend_2_id } = req.body;
  try {
    await UserController.addFriendship(friend_1_id, friend_2_id);
    res.json({
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      data: error,
    });
  }
});

// Remove friendships
router.put("/friends", async (req, res) => {
  const { friend_1_id, friend_2_id } = req.body;
  if (friend_1_id && friend_2_id) {
    try {
      const user_1 = await Users.findById(friend_1_id);
      if (user_1.friends.includes(friend_2_id)) {
        await Users.findByIdAndUpdate(friend_1_id, {
          $pull: {
            friends: friend_2_id,
          },
        });
        await Users.findByIdAndUpdate(friend_2_id, {
          $pull: {
            friends: friend_1_id,
          },
        });
        res.json({
          success: true,
        });
      } else {
        throw "They are not friends!";
      }
    } catch (error) {
      res.json({
        success: false,
        data: error,
      });
    }
  } else {
    res.json({
      success: false,
      data: "You are missing one or more user id",
    });
  }
});

export default router;
