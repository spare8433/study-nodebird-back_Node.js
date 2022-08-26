const express = require('express');
const multer = require('multer')
const path = require('path')  // 파일이나 디렉토리의 경로를 다룰 때 사용하는 기본제공 모듈
const fs = require('fs') // 파일 입출력 처리를 할 때 사용하는 기본제공 모듈
const { Post, User, Comment, Image, Hashtag } = require('../models');
const { isLoggedIn } = require('./middlewares')

const router = express.Router();

try {
  fs.accessSync('uploads');
} catch (error) {
  fs.mkdirSync('uploads')
}

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, done) {
      done(null, 'uploads')
    },
    filename(req, file, done) {   //파일 이름이 중복되면 덮어씌워질 수 있으므로 시간정보를 붙여 저장
      console.log(file);
      const ext = path.extname(file.originalname)   // 확장자 추출 ex) .png
      const basename = path.basename(file.originalname, ext)  // 파일 이름
      done(null, basename + '_' + new Date().getTime() + ext) // ex) 기러기이미지201511232.png
    }
  }),
  limits: { fileSize: 20 * 1024 * 1024}
})

router.post('/', isLoggedIn, upload.none(), async (req, res, next) => {
  console.log(req.body.content);
  try {
    const hashtags = req.body.content.match(/#[^\s#]+/g)
    const post = await Post.create({
      content: req.body.content,
      UserId: req.user.id
    })

    if (hashtags) {
      /** return ex) [[#노드, true], [#리액트, false]] */
      const result = await Promise.all(hashtags.map((tag) => Hashtag.findOrCreate({
         where: { name: tag.slice(1).toLowerCase() },
      })))
      await post.addHashtags(result.map((v) => v[0]))
    }

    if (req.body.image) { // 이미지 정보가 있을때
      if (Array.isArray(req.body.image)){ // 여러개의 이미지일 경우 배열로 받아 처리
        const images = await Promise.all(req.body.image.map((img) => Image.create({ src: img })))
        await post.addImages(images)
      } else {
        const image = await Image.create({ src: req.body.image })
        await post.addImages(image)
      }
    }

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

router.post('/images', isLoggedIn, upload.array('image'), async (req, res, next) => {
  console.log(req.files);
  res.json(req.files.map((v) => v.filename))
});

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

router.post('/:postId/retweet', isLoggedIn, async (req, res, next) => {
  try {
    const post = await Post.findOne({
      where: { id: req.params.postId },
      include: [{
        model: Post,
        as: 'Retweet',
      }],
    })

    if(!post) return res.status(403).send('존재하지 않는 게시글입니다.')

    console.log('post', post);

    // 자신의 글 리트윗 및 자신의글에 리트윗한 글을 리트윗 금지
    if (req.user.id === post.UserId || post.Retweet?.UserId === req.user.id) {
      if(post) return res.status(403).send('자신의 글은 리트윗 할 수 없습니다.')
    }
    const retweetTargetId = post.RetweetId || post.id

    const exPost = await Post.findOne({
      where: {
        UserId: req.user.id,
        RetweetId: retweetTargetId,
      }
    })

    if (exPost) return res.status(403).send('한개의 글당 한번의 리트윗만 할 수 잇습니다.')

    const retweet = await Post.create({
      UserId: req.user.id,
        RetweetId: retweetTargetId,
        content: 'ret'
    })

    const retweetWithPrevPost = await Post.findOne({
      where: {
        id: retweet.RetweetId
      },
      include: [{
        model: Post,
        as: 'Retweet',
        include: [{
          model: User,
          attributes: ['id', 'nickname'],
        }, {
          model: Image,
        }]
      }, {
        model: User,
        attributes: ['id', 'nickname'],
      }, {
        model: Image,
      }, {
        model: User,
        as: 'Likers',
        attributes: ['id'],
      }, {
        model: Comment,
        include: [{
          model: User,
          attributes: ['id', 'nickname'],
        }]
      }]
    })

    res.status(201).json(retweetWithPrevPost)
  } catch (error) { 
    console.error(error);
    next(error)
  }
})

module.exports = router;