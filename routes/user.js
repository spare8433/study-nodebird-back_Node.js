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

router.delete('/', (req, res) => {
  res.json({ id: 1})
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


module.exports = router;