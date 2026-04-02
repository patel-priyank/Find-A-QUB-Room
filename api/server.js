require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');

const eventRoutes = require('./routes/eventRoutes');
const locationRoutes = require('./routes/locationRoutes');
const statisticRoutes = require('./routes/statisticRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  console.log(req.method, req.path);
  next();
});

app.use((req, res, next) => {
  setTimeout(() => next(), 450);
});

app.get('/', (req, res) => {
  res.json({ msg: 'api working' });
});

app.use('/api/events', eventRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/statistics', statisticRoutes);
app.use('/api/user', userRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`db connected, listening on port ${process.env.PORT}`);
    });
  })
  .catch(err => {
    console.error(err);
  });
