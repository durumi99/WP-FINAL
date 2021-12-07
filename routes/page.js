const express = require("express");
const fs = require("fs");
const { isLoggedIn, isNotLoggedIn } = require("./middlewares");
const { Post, User, Hashtag } = require("../models");
const sequelize = require("sequelize");
const { writer } = require("repl");
const Op = sequelize.Op;

const router = express.Router();

router.use((req, res, next) => {
  res.locals.user = req.user;
  res.locals.followerCount = req.user ? req.user.Followers.length : 0;
  res.locals.followingCount = req.user ? req.user.Followings.length : 0;
  res.locals.followerIdList = req.user
    ? req.user.Followings.map((f) => f.id)
    : [];
  next();
});

router.get("/profile", isLoggedIn, (req, res) => {
  res.render("profile", { title: "내 정보 - NodeBird" });
});

router.get("/join", isNotLoggedIn, (req, res) => {
  res.render("join", { title: "회원가입 - NodeBird" });
});

router.get("/new", isLoggedIn, (req, res) => {
  res.render("new", { title: "게시물 작성" });
});

router.get("/follow", isLoggedIn, async (req, res, next) => {
  res.render("follow", { title: "팔로우" });
});

router.get("/msg", isLoggedIn, (req, res) => {
  res.render("message", { title: "Direct Message" });
});

router.get("/edit", isLoggedIn, (req, res) => {
  res.render("edit", { title: "게시물 편집" });
});

router.get("/cert", (req, res) => {
  res.render("cert", { title: "이메일 인증" });
});

router.get("/", async (req, res, next) => {
  try {
    const posts = await Post.findAll({
      include: {
        model: User,
        attributes: ["id", "nickid"],
      },
      order: [["createdAt", "DESC"]],
    });
    res.render("main", {
      title: "SSUSTAGRAM",
      twits: posts,
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.get("/search", async (req, res, next) => {
  const query = req.query.search;
  const option = req.query.option;

  if (!query) {
    return res.redirect("/");
  }
  try {
    let posts = [];
    if (option == "hashtag") {
      const hashtag = await Hashtag.findOne({
        where: { title: { [Op.like]: "%" + query + "%" } },
      });

      if (hashtag) {
        posts = await hashtag.getPosts({ include: [{ model: User }] });
      }
    } else if (option == "writer") {
      const writer = await User.findOne({
        where: { nickid: { [Op.like]: "%" + query + "%" } },
        //include: { model: Post },
      });

      // for (let i = 0; i < writer.length; i++) {
      //   writer[i] = await writer[i].getPosts({ include: [{ model: User }] });
      //   //console.log("posts:", posts);
      // }
      //posts = await writer;
      if (writer) {
        posts = await writer.getPosts({ include: [{ model: User }] });
      }
      console.log("posts:", posts);
    } else if (option == "text") {
      // 해결
      const text = await Post.findAll({
        where: { content: { [Op.like]: "%" + query + "%" } },
        include: { model: User },
      });
      if (text) {
        posts = await text;
        console.log(text);
      }
    }
    //console.log(posts);
    return res.render("main", {
      title: `${query} | NodeBird`,
      twits: posts,
    });
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

router.get("/writersearch", async (req, res, next) => {
  const query = req.query.search;

  if (!query) {
    return res.redirect("/");
  }
  try {
    let posts = [];
    const writer = await User.findOne({ where: { nickid: query } });
    if (writer) {
      posts = await writer.getPosts({ include: [{ model: User }] });
    }

    return res.render("main", {
      title: `${query} | NodeBird`,
      twits: posts,
    });
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

router.get("/hashtag", async (req, res, next) => {
  const query = req.query.hashtag;
  if (!query) {
    return res.redirect("/");
  }
  try {
    const hashtag = await Hashtag.findOne({ where: { title: query } });
    let posts = [];
    if (hashtag) {
      posts = await hashtag.getPosts({ include: [{ model: User }] });
    }

    return res.render("main", {
      title: `${query} | NodeBird`,
      twits: posts,
    });
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

module.exports = router;
