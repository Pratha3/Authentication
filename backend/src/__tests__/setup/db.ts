import mongoose from 'mongoose'

export async function connectTestDB() {
  const uri = process.env.MONGO_URI!
  await mongoose.connect(uri)
}

export async function clearTestDB() {
  const collections = mongoose.connection.collections
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({})
  }
}

export async function closeTestDB() {
  await mongoose.connection.dropDatabase()
  await mongoose.connection.close()
}
