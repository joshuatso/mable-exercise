import express from 'express';

const app = express();
const PORT = 5000;

app.use(express.json());

app.use('/api/products', require('./routes/api/products'));

app.listen(PORT, () => console.log(`Server ready at port ${PORT}`));