const express = require('express');
const { Post, User, Comment, Image } = require('../models');
const { isLoggedIn } = require('./middlewares')

const router = express.Router();

router.post('/', isLoggedIn, async (req, res, next) => {
  console.log(req.body.content);
  try {
    const post = await Post.create({
      content: req.body.content,
      UserId: req.user.id
    })

    const fullPost = await Post.findOne({
      where: { id: post.id },
      include: [{
        model: Image,
      }, {
        model: Comment,
        include: [{
          model: User,  // 댓글 작성자
          attributes: ['id', 'nickname']
        }]
      }, {
        model: User,  // 게시물 작성자
        attributes: ['id', 'nickname']
      }, {
        model: User,  // 좋아요 누른사람
        as: 'Likers',
        attributes: ['id']
      }]
    })
    res.status(201).json(fullPost)
  } catch (error) {
    console.error(error);
    next(error)
  }
})

router.post('/:postId/comment', isLoggedIn, async (req, res, next) => {
  try {
    const post = await Post.findOne({
      where: { id: req.params.postId },
    })

    if(!post) return res.status(403).send('존재하지 않는 게시글입니다.')
    console.log(req.params);
    const comment = await Comment.create({
      content: req.body.content,
      PostId: parseInt(req.params.postId),
      UserId: req.user.id,
    })

    const fullComment = await Comment.findOne({
      where: {
        id: comment.id,
      },
      include: [{
        model: User,
        attributes: ['id', 'nickname'],
      }]
    })
    res.status(201).json(fullComment)
  } catch (error) { 
    console.error(error);
    next(error)
  }
})

router.patch('/:postId/like', isLoggedIn, async (req, res, next) => {
  try {
    const post = await Post.findOne({ where: { id: req.params.postId }})

    await post.addLikers(req.user.id)
    res.json({ PostId : post.id, UserId: req.user.id })


    if (!post) return res.status(403).send('게시글이 존재하지 않습니다')
  } catch (error) {
    console.error(error);
  }
})

router.delete('/:postId/like', isLoggedIn, async (req, res, next) => {
  try {
    const post = await Post.findOne({ where: { id: req.params.postId }})

    if (!post) return res.status(403).send('게시글이 존재하지 않습니다')

    await post.removeLikers(req.user.id)
    res.json({ PostId : post.id, UserId: req.user.id })

  } catch (error) {
    console.error(error);
  }
})

router.delete('/:postId', isLoggedIn, async (req, res, next) => {
  try {
    Post.destroy({  // 컬럼 삭제
      where: { id: req.params.postId },
      UserId: req.user.id,
    })
    res.status(200).json({ PostId: parseInt(req.params.postId) })
  } catch (error) {
    console.error(error);
    next(error)
  }
})

module.exports = router;