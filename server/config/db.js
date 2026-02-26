import mongoose from 'mongoose';

export async function connectDB() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/brvm-academy';
    await mongoose.connect(uri);
    console.log('✅ MongoDB connecté');
  } catch (error) {
    console.error('❌ Erreur MongoDB:', error.message);
    // En mode dev, on continue sans DB pour permettre le développement frontend
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.log('⚠️  Mode dev : l\'API fonctionnera sans base de données');
    }
  }
}
