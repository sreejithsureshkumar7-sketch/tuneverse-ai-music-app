import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

mongoose.connect(process.env.MONGO_URI).then(()=>console.log('MongoDB connected')).catch(err=>console.log('MongoDB error:', err.message));

const SongSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: { type: String, required: true },
  language: { type: String, default: 'Tamil' },
  mood: { type: String, default: 'Happy' },
  coverUrl: String,
  audioUrl: { type: String, required: true },
  isLicensed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
const Song = mongoose.model('Song', SongSchema);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'))
});
const upload = multer({ storage });

app.get('/', (req, res) => res.json({ message: 'TuneVerse AI Backend Running' }));

app.get('/api/songs', async (req, res) => {
  const { q = '', mood = '', language = '' } = req.query;
  const filter = {};
  if (q) filter.$or = [{ title: new RegExp(q, 'i') }, { artist: new RegExp(q, 'i') }];
  if (mood) filter.mood = mood;
  if (language) filter.language = language;
  const songs = await Song.find(filter).sort({ createdAt: -1 });
  res.json(songs);
});

app.post('/api/songs', upload.fields([{ name: 'audio', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), async (req, res) => {
  const { title, artist, language, mood, isLicensed } = req.body;
  if (isLicensed !== 'true') return res.status(400).json({ message: 'Upload only licensed/owned songs.' });
  if (!req.files?.audio?.[0]) return res.status(400).json({ message: 'Audio file required' });
  const audioUrl = `${req.protocol}://${req.get('host')}/uploads/${req.files.audio[0].filename}`;
  const coverUrl = req.files?.cover?.[0] ? `${req.protocol}://${req.get('host')}/uploads/${req.files.cover[0].filename}` : '';
  const song = await Song.create({ title, artist, language, mood, audioUrl, coverUrl, isLicensed: true });
  res.status(201).json(song);
});

app.post('/api/ai/recommend', async (req, res) => {
  const text = (req.body.text || '').toLowerCase();
  let mood = 'Happy';
  if (text.includes('sad') || text.includes('love') || text.includes('miss')) mood = 'Sad';
  if (text.includes('study') || text.includes('focus')) mood = 'Study';
  if (text.includes('gym') || text.includes('workout')) mood = 'Workout';
  const songs = await Song.find({ mood }).limit(10);
  res.json({ detectedMood: mood, songs });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
