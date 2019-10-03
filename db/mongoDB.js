////MONGODB CLIENT////
var mongoClient = require('mongodb').MongoClient;

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
        if(await db.listCollections({name:'admin'}).hasNext()){
            await db.dropCollection('admin');
        }
        await db.createCollection('admin',{strict:true});
        await db.collection('admin').insertOne({id:1,username:process.env.USERNAME,password:process.env.PASSWORD});

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