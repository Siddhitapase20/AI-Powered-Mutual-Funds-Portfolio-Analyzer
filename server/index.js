const express = require('express')
const cors = require('cors')
require('dotenv').config();

const authRoutes = require('./routes/auth');
const portfolioRoutes = require('./routes/portfolio');
const fundsRoutes = require('./routes/funds');
const aiRoutes = require('./routes/ai');
const sipRoutes = require('./routes/sip');
const fundSearchRoutes = require('./routes/fundSearch');
const goalRoutes = require('./routes/goals');
const rebalancingRoutes = require('./routes/rebalancing');


const app = express();

app.use(cors({origin: 'http://localhost:3000'}));
app.use(express.json());

//Routes
app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/funds', fundsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/sip', sipRoutes);
app.use('/api/fund-search', fundSearchRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/rebalancing', rebalancingRoutes);

//Health Check
app.get('/', (req, res) =>{
    res.json({message: 'mutual funds api is running'});
});

// global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:',err);
    res.status(500).json({message: 'Something went wrong on the server.'});
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`server running on http://localhost:${PORT}`);
});


