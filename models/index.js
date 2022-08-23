const Sequelize = require('sequelize')
const env = process.env.NODE_ENV || 'development'
const config = require('../config/config')[env]
const db = {}

const sequelize = new Sequelize(config.database, config.username, config.password, config)

db.Comment = require('./Comment')(sequelize, Sequelize)
db.Hashtag = require('./Hashtag')(sequelize, Sequelize)
db.Image = require('./Image')(sequelize, Sequelize)
db.Post = require('./Post')(sequelize, Sequelize)
db.User = require('./User')(sequelize, Sequelize)


Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
