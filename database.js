const mongoose = require('mongoose');

const URI = process.env.MONGO_URI;
mongoose.connect(URI)
.then(() => console.log('BD conectada'))
.catch(err => console.error(err));

module.exports = mongoose;