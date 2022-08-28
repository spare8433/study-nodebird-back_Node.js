const express = require('express')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const moran = require('morgan')
const path = require('path')
const dotenv = require('dotenv')
const db = require('./models')
const postRotuer = require('./routes/post')
const postsRotuer = require('./routes/posts')
const userRotuer = require('./routes/user')
const hashtagRotuer = require('./routes/hashtag')
const passport = require('passport')
const passportConfig = require('./passport')

const app = express()

dotenv.config()

db.sequelize.sync()
  .then(() => {
    console.log('db 연결 성공')
  }).catch(console.error)

passportConfig();

app.use('/', express.static(path.join(__dirname, 'uploads')))
app.use(express.json()) // json 데이터 처리
app.use(express.urlencoded({ extended: true })) // form 관련 데이터처리
app.use(cookieParser(process.env.COOKIE_SECRET))
app.use(moran('dev'))
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,  // 쿠키 공유
}))
app.use(session({
  saveUninitialized: false,
  resave: false,
  secret: process.env.COOKIE_SECRET
}))
app.use(passport.initialize())
app.use(passport.session())

app.get('/', (req, res) => {
  res.send('hello express')
})

app.use('/post', postRotuer)
app.use('/posts', postsRotuer)
app.use('/user', userRotuer)
app.use('/hashtag', hashtagRotuer)

app.listen(3065, () => {
  console.log('서버 실행중');
})