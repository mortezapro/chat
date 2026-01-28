import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

dotenv.config();

const mockUsers = [
  {
    username: 'ali_ahmadi',
    email: 'ali@example.com',
    password: '123456',
    firstName: 'علی',
    lastName: 'احمدی',
    bio: 'برنامه‌نویس و توسعه‌دهنده نرم‌افزار',
    phoneNumber: '09123456789',
    isOnline: false
  },
  {
    username: 'sara_mohammadi',
    email: 'sara@example.com',
    password: '123456',
    firstName: 'سارا',
    lastName: 'محمدی',
    bio: 'طراح UI/UX و گرافیست',
    phoneNumber: '09123456790',
    isOnline: true
  },
  {
    username: 'reza_karimi',
    email: 'reza@example.com',
    password: '123456',
    firstName: 'رضا',
    lastName: 'کریمی',
    bio: 'مدیر پروژه و تحلیل‌گر سیستم',
    phoneNumber: '09123456791',
    isOnline: false
  },
  {
    username: 'maryam_hasani',
    email: 'maryam@example.com',
    password: '123456',
    firstName: 'مریم',
    lastName: 'حسنی',
    bio: 'توسعه‌دهنده فرانت‌اند',
    phoneNumber: '09123456792',
    isOnline: true
  },
  {
    username: 'amir_nasiri',
    email: 'amir@example.com',
    password: '123456',
    firstName: 'امیر',
    lastName: 'نصیری',
    bio: 'مهندس نرم‌افزار و معمار سیستم',
    phoneNumber: '09123456793',
    isOnline: false
  },
  {
    username: 'zahra_rahimi',
    email: 'zahra@example.com',
    password: '123456',
    firstName: 'زهرا',
    lastName: 'رحیمی',
    bio: 'تست‌کننده نرم‌افزار و QA',
    phoneNumber: '09123456794',
    isOnline: true
  },
  {
    username: 'hossein_faraji',
    email: 'hossein@example.com',
    password: '123456',
    firstName: 'حسین',
    lastName: 'فرجی',
    bio: 'توسعه‌دهنده بک‌اند و DevOps',
    phoneNumber: '09123456795',
    isOnline: false
  },
  {
    username: 'fatemeh_azizi',
    email: 'fatemeh@example.com',
    password: '123456',
    firstName: 'فاطمه',
    lastName: 'عزیزی',
    bio: 'مدیر محتوا و نویسنده',
    phoneNumber: '09123456796',
    isOnline: true
  },
  {
    username: 'mohammad_rezaei',
    email: 'mohammad@example.com',
    password: '123456',
    firstName: 'محمد',
    lastName: 'رضایی',
    bio: 'مشاور فناوری اطلاعات',
    phoneNumber: '09123456797',
    isOnline: false
  },
  {
    username: 'narges_sadeghi',
    email: 'narges@example.com',
    password: '123456',
    firstName: 'نرگس',
    lastName: 'صادقی',
    bio: 'تحلیل‌گر داده و دانشمند داده',
    phoneNumber: '09123456798',
    isOnline: true
  }
];

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chat-app';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Clear existing users (optional - comment out if you want to keep existing users)
    // await User.deleteMany({});
    // console.log('🗑️  Cleared existing users');

    // Create users
    const createdUsers = [];
    for (const userData of mockUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [
          { email: userData.email },
          { username: userData.username }
        ]
      });

      if (existingUser) {
        console.log(`⏭️  User ${userData.username} already exists, skipping...`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      // Create user
      const user = new User({
        ...userData,
        password: hashedPassword
      });

      await user.save();
      createdUsers.push(user);
      console.log(`✅ Created user: ${userData.username} (${userData.firstName} ${userData.lastName})`);
    }

    console.log(`\n🎉 Successfully created ${createdUsers.length} users!`);
    console.log('\n📝 Login credentials for all users:');
    console.log('   Email: [username]@example.com');
    console.log('   Password: 123456\n');
    
    console.log('👥 Created users:');
    createdUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.firstName} ${user.lastName} (@${user.username}) - ${user.email}`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedUsers();










