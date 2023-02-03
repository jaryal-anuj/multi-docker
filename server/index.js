const keys = require('./keys');
const redis = require('redis');
const cors = require('cors');
const express = require('express');
const { Pool } = require('pg');

const pgClient = new Pool({
    user: keys.pgUser,
    host: keys.pgHost,
    database: keys.pgDatabase,
    password: keys.pgPassword,
    port: keys.pgPort
});


pgClient.on('error',()=>console.log('Lost PG connection'));
pgClient.on('connect',(client)=>{
    client.query('CREATE TABLE IF NOT EXISTS values (number INT)').catch(err=>console.log(err));
});

const redisClient = redis.createClient({
    socket:{
        host:keys.redisHost,
        port:keys.redisPort,
        reconnectStrategy:retries => Math.min(retries * 50, 500)
    }
});
redisClient.connect().then(() => {
    console.log('Redis connected');
});
const redisPublisher = redisClient.duplicate();
redisPublisher.connect().then(() => {
    console.log('Redis publisher connected');
});

//redisPublisher.on('error', err => console.log('Redis Client Error', err));
////
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded());


app.get('/', (req, res) => {
  res.send('Hello World!')
});

app.get('/values/all', async (req, res)=>{
    const values = await pgClient.query('SELECT * from values');
    res.send(values.rows);
});

app.get('/values/current', async (req, res)=>{
    
    const values = await redisClient.hGetAll('values');
    res.send(values);
});

app.post('/values', async( req, res)=>{
    const index = req.body.index;
    if(parseInt(index)> 40){
        return res.status(422).send('Index too high');
    }
    redisClient.hSet('values',index, 'Nothing yet!');
    redisPublisher.publish('insert', index);
    pgClient.query('INSERT INTO values(number) VALUES($1)',[index]);
    res.send({ working:true});
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});