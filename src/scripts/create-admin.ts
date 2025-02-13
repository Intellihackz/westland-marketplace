import bcrypt from 'bcryptjs';
import clientPromise from '../lib/mongodb';

async function createAdminUser() {
  try {
    const client = await clientPromise;
    const db = client.db();

    const email = 'zephyrdev@duck.com';
    const password = '123dded@00';
    const hashedPassword = await bcrypt.hash(password, 12);

    // Check if user exists
    const existingUser = await db.collection('users').findOne({ email });
    
    if (existingUser) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    await db.collection('users').insertOne({
      email,
      password: hashedPassword,
      name: 'Admin User',
      role: 'admin',
      createdAt: new Date()
    });

    console.log('Admin user created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser(); 