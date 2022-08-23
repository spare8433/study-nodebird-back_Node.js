const passport = require('passport')
const local = require('./local')
const { User } = require('../models')

module.exports = () => {
  passport.serializeUser((user, done) => {  // 로그인시 id 와 쿠키 기억해서 서버가 기억
    // console.log('초기로그인', user);
    done(null, user.id)
  })

  passport.deserializeUser(async (id, done) => {  // 로그인 이후 데이터 요청시 제공된 id 와 쿠키를 통해 정보를 불러옴
    // console.log('로그인 유지 중', user);
    try {
      const user = await User.findOne({ where: { id } })
      
      done(null, user)  //req.user 생성
    } catch (error) {
      console.error(error)
      done(error)
    }
  })

  local()
}