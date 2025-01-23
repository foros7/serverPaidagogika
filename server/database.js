const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'database.sqlite'),
    logging: false
});

// Ορισμός μοντέλων
const User = sequelize.define('User', {
    username: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
    },
    password: {
        type: Sequelize.STRING,
        allowNull: false
    },
    role: {
        type: Sequelize.STRING,
        allowNull: false
    }
});

const Announcement = sequelize.define('Announcement', {
    title: {
        type: Sequelize.STRING,
        allowNull: false
    },
    content: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    createdBy: {
        type: Sequelize.STRING,
        allowNull: false
    }
});

const Quiz = sequelize.define('Quiz', {
    title: {
        type: Sequelize.STRING,
        allowNull: false
    },
    description: Sequelize.TEXT,
    questions: {
        type: Sequelize.JSON,
        allowNull: false
    },
    instructor: {
        type: Sequelize.STRING,
        allowNull: false
    }
});

const QuizSubmission = sequelize.define('QuizSubmission', {
    answers: {
        type: Sequelize.JSON,
        allowNull: false
    },
    score: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    maxScore: {
        type: Sequelize.INTEGER,
        allowNull: false
    }
});

const Material = sequelize.define('Material', {
    filename: {
        type: Sequelize.STRING,
        allowNull: false
    },
    originalname: {
        type: Sequelize.STRING,
        allowNull: false
    },
    url: {
        type: Sequelize.STRING,
        allowNull: false
    },
    uploadedBy: {
        type: Sequelize.STRING,
        allowNull: false
    }
});

// Σχέσεις
Quiz.hasMany(QuizSubmission);
QuizSubmission.belongsTo(Quiz);
User.hasMany(QuizSubmission);
QuizSubmission.belongsTo(User);

// Συνάρτηση αρχικοποίησης
const initDatabase = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection established.');
        
        // Συγχρονισμός μοντέλων με τη βάση
        await sequelize.sync({ alter: true });
        console.log('Database synchronized.');
    } catch (error) {
        console.error('Database initialization error:', error);
    }
};

module.exports = {
    sequelize,
    User,
    Announcement,
    Quiz,
    QuizSubmission,
    Material,
    initDatabase
}; 