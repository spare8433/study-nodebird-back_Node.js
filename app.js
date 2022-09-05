const express = require('express')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const morgan = require('morgan')
const path = require('path')
const dotenv = require('dotenv')
const hpp = require('hpp')
const helmet = require('helmet')


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



app.use(cors({
  origin: ['http://localhost:3000', `http://${process.env.FRONT_URL}`],
  credentials: true,  // 쿠키 공유
}))
app.use(session({
  saveUninitialized: false,
  resave: false,
  secret: false,
  domain: process.env.NODE_ENV === 'production' && '.spare8433.kro.kr'

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

if (process.env.NODE_ENV  === 'production') {
  app.use(morgan('combined'))
  app.use(hpp())
  app.use(helmet())
  app.listen(80, () => {
    console.log('실 서버 실행중');
  })
} else {
  app.use(morgan('dev'))
  app.listen(3065, () => {
    console.log('개발 서버 실행중');
  })
}
