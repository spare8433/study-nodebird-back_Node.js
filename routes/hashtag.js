const express = require('express');
const multer = require('multer')
const { Op } = require('sequelize')
const path = require('path')  // 파일이나 디렉토리의 경로를 다룰 때 사용하는 기본제공 모듈
const fs = require('fs') // 파일 입출력 처리를 할 때 사용하는 기본제공 모듈
const { Post, User, Comment, Image, Hashtag } = require('../models');
const { isLoggedIn } = require('./middlewares')

const router = express.Router();

router.get('/:hashtag', async (req, res, next) => {
  try {
    const where = {}
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
        model: Hashtag,
        where: {
          name: decodeURIComponent(req.params.hashtag)
        }
      },{
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