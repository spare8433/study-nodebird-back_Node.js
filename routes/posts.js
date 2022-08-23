const express = require('express')

const { Post, User, Image, Comment } = require('../models')

const router = express.Router()

router.get('/', async (req, res, next) => {
  try {
    const posts = await Post.findAll({
      limit: 10,
      order: [
        ['createdAt', 'DESC'],
        [Comment,'createdAt', 'DESC'] // 댓글 정렬
      ],
      include: [{
        model: User,
        attributes: ['id', 'nickname']
      }, {
        model: Image,
      }, {
        model: Comment,
        include: [{
          model: User,
          attributes: ['id', 'nickname'],
        }]
      }, {
        model: User,  // 좋아요 누른사람
        as: 'Likers',
        attributes: ['id']
      }]
    })
    res.status(200).send(posts)
  } catch (error) {
    console.error(error);
  }
})

module.exports = router