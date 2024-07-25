const express = require('express');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const app = express();

const serviceAccountPath = path.join(__dirname, 'bmi-calculator-472bb-firebase-adminsdk-mbi36-e0b67eef4d.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('Service account JSON file not found:', serviceAccountPath);
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://bmi-calculator-472bb-default-rtdb.firebaseio.com"
});

const db = admin.firestore();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.render('index');
});

app.post('/calculate', async (req, res) => {
  try {
    console.log('Request body:', req.body);

    const weight = parseFloat(req.body.weight);
    const height = parseFloat(req.body.height);
    
    console.log('Parsed weight:', weight, 'Parsed height:', height);

    if (isNaN(weight) || isNaN(height) || weight <= 0 || height <= 0) {
      throw new Error('Invalid input values');
    }

    const bmi = weight / (height * height);
    console.log('Calculated BMI:', bmi);

    const bmiRecord = {
      weight: weight,
      height: height,
      bmi: bmi,
      date: new Date().toISOString()
    };

    await db.collection('bmiRecords').add(bmiRecord);
    console.log('BMI record saved:', bmiRecord);

    res.render('index', { bmi: bmi.toFixed(2) });
  } catch (error) {
    console.error('Error calculating BMI or saving to Firebase:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
