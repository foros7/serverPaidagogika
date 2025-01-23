const Grade = sequelize.define('Grade', {
    score: {
        type: Sequelize.FLOAT,
        allowNull: false
    },
    comments: {
        type: Sequelize.TEXT
    },
    subject: {
        type: Sequelize.STRING,
        allowNull: false
    }
});

User.hasMany(Grade);
Grade.belongsTo(User);

module.exports = {
    sequelize,
    User,
    Announcement,
    Quiz,
    QuizSubmission,
    Material,
    Grade,
    initDatabase
}; 