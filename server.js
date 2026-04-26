const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors({ origin: '*' })); 
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb+srv://snehapruthi0228:<db_password>@cluster0.3gc55vy.mongodb.net/?appName=Cluster0')
  .then(() => console.log('Database connected!'))
  .catch(err => console.log('Database error: ', err));

// Define what the data looks like
const NoiseData = mongoose.model('Noise', new mongoose.Schema({
    deviceId: String,
    noiseLevel: Number,
    lat: Number,
    lng: Number,
    timestamp: { type: Date, default: Date.now }
}));

// Route to receive data from the hardware
app.post('/api/noise', async (req, res) => {
    try {
        await new NoiseData(req.body).save();
        res.status(201).send("Saved!");
    } catch (error) {
        res.status(500).send("Error");
    }
});

// Route to send data to your React map
app.get('/api/noise/latest', async (req, res) => {
    try {
        const data = await NoiseData.aggregate([
            { $sort: { timestamp: -1 } },
            { $group: { _id: "$deviceId", latest: { $first: "$$ROOT" } } }
        ]);
        res.json(data.map(d => d.latest));
    } catch (error) {
        res.status(500).send("Error");
    }
});

// Tell the app to use Render's port, OR use 5000 if running locally
const PORT = process.env.PORT || 5000; 

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});