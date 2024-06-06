const express = require('express');
const app = express();
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

// middileware
app.use(express.json());
app.use(cors());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xxoesz5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection

        const usersCollection = client.db("bloodDB").collection("users");
        const requestCollection = client.db("bloodDB").collection("request");

        app.post('/users', async (req, res) => {
            const newUser = req.body;
            const result = await usersCollection.insertOne(newUser);
            res.send(result);
        });

        app.get('/users', async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
        })

        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = {email: email};
            const result = await usersCollection.find(query).toArray();
            res.send(result);
        })

        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
              $set: {
                role: 'admin'
              }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc);
            res.send(result);
          })

        app.patch('/users/volunteer/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
              $set: {
                role: 'volunteer'
              }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc);
            res.send(result);
          })

        app.patch('/users/active/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
              $set: {
                status: 'active'
              }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc);
            res.send(result);
          })

        app.patch('/users/blocked/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
              $set: {
                status: 'blocked'
              }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc);
            res.send(result);
          })

        app.get('/request', async (req, res) => {
            const result = await requestCollection.find().toArray();
            res.send(result);
        });

        app.get('/request/:requesterEmail', async (req, res) => {
            const requesterEmail = req.params.email;
            const query = {email: requesterEmail};
            const result = await requestCollection.find(query).toArray();
            res.send(result);
        });

        app.post('/request', async (req, res) => {
            const newRequest = req.body;
            const result = await requestCollection.insertOne(newRequest);
            res.send(result);
        });


        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Blood Donation Sever is running');
});

app.listen(port, () => {
    console.log(`Blood Donation Server on PORT ${port}`);
})