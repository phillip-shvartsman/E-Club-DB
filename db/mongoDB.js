////MONGODB CLIENT////
var mongoClient = require('mongodb').MongoClient;
const bcrypt = require('bcrypt');

//The db itself.
let db = null;
const db_url = 'mongodb://localhost:' + process.env.DB_PORT;

module.exports.connect = () => new mongoClient(db_url,
    {
        useNewUrlParser:true,
        useUnifiedTopology:true,
        poolSize: 20,
        socketTimeoutMS: 480000,
        keepAlive: 300000,
        reconnectTries: Number.MAX_VALUE,
        reconnectInterval: 0
    }
).connect().then( async (client) => 
{
    try{
        db = await client.db(process.env.DB_NAME);

        //Insert the inventory collection if it doesn't exist
        if(!await db.listCollections({name:'inventory'}).hasNext()){
            await db.createCollection('inventory',{strict:true});
        }

        //On server restart read .env file to set username and password
        if(!await db.listCollections({name:'users'}).hasNext()){
            await db.createCollection('users',{strict:true});
        }
        await db.collection('users').deleteOne({id:1});
        const hash = await bcrypt.hash(process.env.PASSWORD,10);
        await db.collection('users').insertOne({id:1,email:process.env.USERNAME,password:hash,admin:true});

        //Create checkout collection
        if(!await db.listCollections({name:'checkOut'}).hasNext()){
            await db.createCollection('checkOut',{strict:true});
        }

        //Create requests collection
        if(!await db.listCollections({name:'requests'}).hasNext()){
            await db.createCollection('requests',{strict:true});
        }
        return Promise.resolve();
    }
    catch(err){
        console.error('Could not create MongoDB collections.');
        console.error(err);
    }
    
}).catch( err=>{
    console.error('Could not connect to MongoDB instance.');
    console.error(err);
});

module.exports.get = () => {
    if(!db){
        throw new Error('Call connect first!');
    }
    return db;
};