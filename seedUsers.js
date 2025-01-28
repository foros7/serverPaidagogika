const bcrypt = require('bcryptjs');
const { User } = require('./database');

const seedUsers = async () => {
    try {
        // Check if we already have users
        const count = await User.count();
        if (count === 0) {
            console.log('Seeding users...');
            
            // Create instructor
            const hashedPassword = await bcrypt.hash('123456', 10);
            await User.create({
                username: 'instructor',
                password: hashedPassword,
                role: 'instructor'
            });

            // Create test students
            const students = [
                { username: 'student1', password: '123456', role: 'student' },
                { username: 'student2', password: '123456', role: 'student' },
                { username: 'student3', password: '123456', role: 'student' }
            ];

            for (const student of students) {
                const hashedStudentPassword = await bcrypt.hash(student.password, 10);
                await User.create({
                    username: student.username,
                    password: hashedStudentPassword,
                    role: student.role
                });
            }

            console.log('Users seeded successfully');
        } else {
            console.log('Users already exist, skipping seed');
        }
    } catch (error) {
        console.error('Error seeding users:', error);
        throw error;
    }
};

module.exports = seedUsers; 