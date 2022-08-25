const express = require('express')
const bcrypt = require('bcrypt')
const { User, Post } = require('../models')
const passport = require('passport');
const db = require('../models');
const router = express.Router();
const { isLoggedIn, isNotLoggedIn } = require('./middlewares')


router.get('/', isLoggedIn, async (req, res, next) => {
  try {
    if (!req.user) return res.status(200).json(null)
    const fullUserWithoutPassword = await User.findOne({
      where: { id: req.user.id },
      attributes: {
        exclued: ['password']
      },
      include: [{
        model: Post,
        attributes: ['id'],
      }, {
        model: User,
        as: 'Followings',
        attributes: ['id'],
      }, {  
        model: User,
        as: 'Followers',
        attributes: ['id'],
      }]
    })

    res.status(200).json(fullUserWithoutPassword)
  } catch (error) {
    console.error(error);
    next(error)
  }
})

router.post('/', isNotLoggedIn, async (req, res) => {
  try {
    const exUser = await User.findOne({
      where: {
        email: req.body.email,
      }
    })

    if (exUser) {
      return res.status(403).send('이미 사용중인 아이디입니다.');
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 12)
    await User.create({
      email: req.body.email,
      nickname: req.body.nickname,
      password: hashedPassword,
    })
    res.status(200).send('ok')
  } catch (error) {
    console.log(error);
    next(error) // status 500
  }
})

router.post('/login', isNotLoggedIn, (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error(err);
      return next(err)
    }
    if (info) {
      console.log(info);
      return res.status(401).send(info.reason)
    }
    return req.logIn(user, async (loginErr) => {
      if (loginErr) {
        console.error(loginErr);
        return next(loginErr)
      }
      const fullUserWithoutPassword = await User.findOne({
        where: { id: user.id },
        attributes: {
          exclued: ['password']
        },
        include: [{
          model: Post
        }, {
          model: User,
          as: 'Followings',
        }, {  
          model: User,
          as: 'Followers'
        }]
      })
      return res.status(200).json(fullUserWithoutPassword)
    }) 
  })(req, res, next)
})

router.post('/logout', isLoggedIn, (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err)
    console.log('dd');
    res.redirect('/');
  })
  req.session.destroy()
  res.send('ok')
})


router.patch('/nickname', isLoggedIn, async (req, res, next) => {
  try {
    User.update({
      nickname: req.body.nickname
    }, {
      where: { id: req.user.id },
    })
    res.status(200).json({ nickname: req.body.nickname })
  } catch (error) {
    console.error(error);
    next(error)
  }
})

router.patch('/:userId/follow', isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: req.params.userId }})
    if(!user) {
      return res.status(403).send('팔로우 하려는 대상이 존재하지 않습니다.')
    }
    await user.addFollowers(req.user.id)
    res.status(200).json({ UserId: parseInt(req.params.userId) })
  } catch (error) {
    console.error(error);
    next(error)
  }
})

router.delete('/:userId/follow', isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: req.params.userId }})
    if(!user) {
      return res.status(403).send('언팔로우 하려는 대상이 존재하지 않습니다.')
    }
    await user.removeFollowers(req.user.id)
    res.status(200).json({ UserId: parseInt(req.params.userId) })
  } catch (error) {
    console.error(error);
    next(error)
  }
})

router.get('/followers', isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: req.user.id }})
    console.log('followers', user);
    if(!user) {
      return res.status(403).send('존재하지 않는 사용자의 요청입니다')
    }
    const followers = await user.getFollowers()
    res.status(200).json(followers)
  } catch (error) {
    console.error(error);
    next(error)
  }
})

router.get('/followings', isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: req.user.id }})
    if(!user) {
      return res.status(403).send('존재하지 않는 사용자의 요청입니다')
    }
    const followings = await user.getFollowings()
    res.status(200).json(followings)
  } catch (error) {
    console.error(error);
    next(error)
  }
})

router.delete('/follower/:userId', isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: req.user.id }})
    if(!user) {
      return res.status(403).send('차단 하려는 대상이 존재하지 않습니다.')
    }
    await user.removeFollowers()
    res.status(200).json({ UserId: parseInt(req.params.userId) })
  } catch (error) {
    console.error(error);
    next(error)
  }
})

module.exports = router;