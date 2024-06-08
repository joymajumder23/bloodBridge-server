const express = require('express');
const app = express();
const cors = require('cors');
var jwt = require('jsonwebtoken');
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
    const blogsCollection = client.db("bloodDB").collection("blogs");

    // jwt related api
    app.post('/jwt', async (req, res) => {
      console.log(req.headers);
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res.send({ token });
    })
    console.log(process.env.ACCESS_TOKEN_SECRET);


    app.post('/users', async (req, res) => {
      const newUser = req.body;
      const result = await usersCollection.insertOne(newUser);
      res.send(result);
    });

    // admin
    app.get('/users', async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    })

    app.get('/users/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await usersCollection.findOne(query);
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
    app.get('/users/admin/:email', async (req, res) => {
      const email = req.params.email;
      // if (email !== req.decoded.email) {
      //   return res.status(403).send({ message: 'unauthorized access' });
      // }

      const query = { email: email };
      const user = await usersCollection.findOne(query);

      let admin = false;
      if (user) {
        admin = user?.role === 'admin';
      }
      res.send({ admin });
    })

    // blog post
    app.post('/blogs', async (req, res) => {
      const newBlog = req.body;
      const result = await blogsCollection.insertOne(newBlog);
      res.send(result);
    });

    // blog post
    app.get('/blogs', async (req, res) => {
      const result = await blogsCollection.find().toArray();
      res.send(result);
    });

    // blog published
    app.patch('/blogs/published/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: 'published'
        }
      }
      const result = await blogsCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })

    // blog draft
    app.patch('/blogs/draft/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: 'draft'
        }
      }
      const result = await blogsCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })
// donor---------------------------
    app.post('/request', async (req, res) => {
      const newRequest = req.body;
      const result = await requestCollection.insertOne(newRequest);
      res.send(result);
    });

    app.get('/request', async (req, res) => {
      const result = await requestCollection.find().toArray();
      res.send(result);
    });

    // inprogress
    app.patch('/request/inprogress/:id', async (req, res) => {
      const id = req.params.id;
      const donorInfo = req.body;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          donorName: donorInfo.donorName,
          donorEmail: donorInfo.donorEmail,
          status: 'inprogress'
        }
      }
      const result = await requestCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })

    // done
    app.patch('/request/done/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: 'done'
        }
      }
      const result = await requestCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })

    // cancel
    app.patch('/request/cancel/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: 'canceled'
        }
      }
      const result = await requestCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })

    // donor request id get
    app.get('/request/requester/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await requestCollection.findOne(query);
      res.send(result);
    });

// donor request email get
    app.get('/request/:requesterEmail', async (req, res) => {
      const email = req.params.requesterEmail;
      const query = { requesterEmail: email };
      console.log(query);
      const result = await requestCollection.find(query).toArray();
      res.send(result);
    });
    
// update
    app.put('/request/:id', async (req, res) => {
      const reqData = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          recipientName: reqData.recipientName,
          address: reqData.address,
          blood: reqData.blood,
          district: reqData.district,
          upazila: reqData.upazila,
          donationDate: reqData.donationDate,
          donationTime: reqData.donationTime,
          details: reqData.details,
          location: reqData.location,
          status: reqData.status
        }
      }
      const result = await requestCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })

// request delete
    app.delete('/request/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      console.log(query);
      const result = await requestCollection.deleteOne(query);
      res.send(result);
    })

// blog delete
    app.delete('/blogs/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      console.log(query);
      const result = await blogsCollection.deleteOne(query);
      res.send(result);
    })

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