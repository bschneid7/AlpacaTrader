import User from '../models/User.js';
import {connectDB} from '../config/database.js';

async function checkUsers() {
  await connectDB();
  const users = await User.find({});
  console.log('Users:', users.map(u => ({email: u.email, id: u._id})));
  process.exit(0);
}

checkUsers();
