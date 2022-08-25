module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('images', 'src', {
      type: Sequelize.STRING(100),
    })
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('images');
  },
};