// For the server side, server page is always deal with the get and post request from the clients. 
// In this case, server page wil send data back to the clients when they send a get request; 
// On the other hand, when clients send a post request, those post requests will trigger some functions to manipulate database 
const express = require('express');
const app = express();
app.use(express.static(__dirname));

// call built-in middleware "express.json()" to parse any incoming JSON data payload (in other words, form stringified to JS object)
// call built-in middleware "express.urlencoded({ extended: false }" to parse any incoming Query encoded data payload (in other words, form encoded to uncoder JS object)
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


// npm install os
const os = require('os');
// Function to get the host IP
function getHostIP() {
  const interfaces = os.networkInterfaces();
  let hostIP;

  Object.keys(interfaces).forEach((interfaceName) => {
    const iface = interfaces[interfaceName];
    iface.forEach((entry) => {
      if (!entry.internal && entry.family === 'IPv4') {
        hostIP = entry.address;
      }
    });
  });

  return hostIP;
}

let currentHostIp = getHostIP();
console.log(currentHostIp)

const cors = require('cors');
app.use(cors());
//http://(hostip):3000 is the live chat page. This make use of cors to secure the connection between chat page and server and grant the chat page to be able to send get and post requests to the server
const http = require('http').createServer(app);

// io is a function, not a property or an object
const io = require('socket.io')(http, {
  cors: {
    origin: `http://${currentHostIp}:3000`,
    methods: ['GET', 'POST'],
  },
});



//define the connection figure to mongodb
const { MongoClient } = require('mongodb');

// replace your own mongDB url here
const uri = "";
//create a new client object
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function main() {
  try {
    //connect to the mongodb and choose the database and collections to be used
    await client.connect();

    // replace your own mongDB database and connection here
    const db = client.db("");
    const collection = db.collection("");

    //Listening to the post request on "http://hostip:8080/messages", when there is a post request, the app will deliver the body message included within the post request body to database and insert it
    app.post('/messages', async (req, res) => {
      const message = req.body;
      console.log(message)
      //{ name: 'Raymond', message: 'hi' }

      await createListing(message, collection);
      io.emit('message', message);
      res.sendStatus(200);
    });

    // Listening to the get request on "http://hostip:8080/messages", when there is a get request, the app send back the data to the cilent, in this case which is "http://hostip:3300" 
    app.get('/messages', async (req, res) => {
      try {
        let listings = await find(client);
        res.json(listings);
      } catch (error) {
        console.error(error);
        res.status(500).send('Insternal Server Error');
      }
    });

    // Listening to the post request on "http://hostip:8080/delete", when there is a post request, the app will delete all data in database 
    app.post('/delete', async (req, res) => {
      try {
        await deleteAllListings(client);
        io.emit('messagesDeleted');
        res.json({ deletedCount: 0 });
      } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'An error occurred' });
      }
    });

    const port = 8080;
    // when you using socket.io, the "app" is passed by http module, so here should be "http.listen"
    http.listen(port, () => {
      console.log(`Server is listening on port ${port}`);
    });

  } catch (e) {
    console.error(e);
  }
}

async function createListing(newListing, collection) {
  const result = await collection.insertOne(newListing);
  console.log(`New listing created with the following id: ${result.insertedId}`);
}

async function find(client) {
  const result = await client.db("learning-nodejs").collection('01').find({}).toArray();
  return result
}

async function deleteAllListings(client) {
  const result = await client.db("learning-nodejs").collection('01').deleteMany({});
  return result;
}

main().catch(console.error);

