const bcrypt = require('bcryptjs');
const { User } = require('./database');

const seedUsers = async () => {
    try {
        // Δημιουργία των student users
        for (let i = 1; i <= 3; i++) {
            const username = `student${i}`;
            const password = await bcrypt.hash(username, 10); // το password είναι ίδιο με το username

            await User.findOrCreate({
                where: { username },
                defaults: {
                    username,
                    password,
                    role: 'student'
                }
            });
            
            console.log(`Created or found user: student${i}`);
        }

        // Δημιουργία instructor
        const instructorUsername = 'instructor';
        const instructorPassword = await bcrypt.hash('instructor', 10);

        await User.findOrCreate({
            where: { username: instructorUsername },
            defaults: {
                username: instructorUsername,
                password: instructorPassword,
                role: 'instructor'
            }
        });

        console.log('Users seeding completed successfully');
    } catch (error) {
        console.error('Error seeding users:', error);
    }
};

module.exports = seedUsers; 