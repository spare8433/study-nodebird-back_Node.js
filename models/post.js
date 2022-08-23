module.exports = (sequelize, DataTypes) => {
  const Post = sequelize.define('Post', {
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  }, {
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci'
  })
  Post.associate = (db) => {
    db.Post.belongsTo(db.User)  //userId 생성 post.addUser , post.getUser, post.setUser
    db.Post.belongsToMany(db.Hashtag, { through: 'PostHashtag' }) // post.addHashtags
    db.Post.belongsToMany(db.User, { through: 'Like', as: 'Likers'})  // post.addLikers, post.removeLikers 이런 메서드 생성
    db.Post.hasMany(db.Comment) // post.addComments
    db.Post.hasMany(db.Image) // post.addImages
    db.Post.belongsTo(db.Post, { as: 'Retweet'}) // post.addRetweet
  }
  return Post
}