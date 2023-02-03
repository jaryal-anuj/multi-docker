const keys = require('./keys');
const redis = require('redis');

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
const sub = redisClient.duplicate();

sub.connect().then(() => {
    console.log('Redis sub connected');
});


//sub.on('error', err => console.log('Redis Client Error', err));

function fib(index){
    if(index<2) return 1;
    return fib(index-1)+fib(index-2);
}

//sub.on('message',);

sub.subscribe('insert',(message, channel)=>{
    console.log('here',message)
    redisClient.hSet('values', message, fib(parseInt(message)));
});