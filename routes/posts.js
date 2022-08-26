const express = require('express')
const { Op } = require('sequelize') // 오퍼레이터(연산자) 관련

const { Post, User, Image, Comment } = require('../models')

const router = express.Router()

router.get('/', async (req, res, next) => {
  try {
    const where = {

    }
    if(parseInt(req.query.lastId, 10)) {
      where.id = { [Op.lt]: parseInt(req.query.lastId, 10) } // lastId 보다 작은거 10개
    }

    const posts = await Post.findAll({
      where,
      limit: 10,
      order: [
        ['createdAt', 'DESC'],
        [Comment,'createdAt', 'DESC'] // 댓글 정렬
      ],
      include: [{
        model: User,
        attributes: ['id', 'nickname']
      }, {
        model: Post,
        as: 'Retweet',
        include: [{
          model: User,
          attributes: ['id', 'nickname'],
        }, {
          model: Image,
        }]
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