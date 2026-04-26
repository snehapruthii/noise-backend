const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors({ origin: '*' })); 
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
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
// The Mailbox: Catch data from the simulator and save it to MongoDB
app.post('/api/noise', async (req, res) => {
  try {
    // Print the data to the Render logs so we can see it arrive!
    console.log("📨 INCOMING DATA:", req.body); 

    // Assuming your Mongoose model is named 'Noise' (or whatever you named it!)
    const newNoiseData = new NoiseData(req.body); 
    await newNoiseData.save();

    res.status(200).send("Data successfully saved!");
  } catch (error) {
    console.error("❌ Database save failed:", error.message);
    res.status(500).send("Failed to save data");
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
