const express = require('express');
const app = express();
require('dotenv').config();
const cors = require('cors');
var jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const stripe = require("stripe")(process.env.STRIPE_SCRETE_KEY);

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
    const fundCollection = client.db("bloodDB").collection("fund");

    // jwt related api
    app.post('/jwt', async (req, res) => {
      console.log(req.headers);
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res.send({ token });
    })
    console.log(process.env.ACCESS_TOKEN_SECRET);

    // custom middlewares
    const verifyToken = (req, res, next) => {

      // next();
      if (!req.headers.authorization) {
        // console.log('inside verify token', req.headers);
        console.log('inside verify token', req.headers.authorization);
        return res.status(401).send({ message: 'forbidden access' });
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'forbidden access' });
        }
        req.decoded = decoded;
        next();
      })
    }
    // verify admin
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const isAdmin = user?.role === 'admin';

      // if (!isAdmin) {
      //   return req.status(403).send({ message: 'forbidden access' });
      // }
      next();
    }

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

    app.patch('/users/admin/:id', verifyToken, verifyAdmin, async (req, res) => {
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

    app.patch('/users/volunteer/:id', verifyToken, verifyAdmin, async (req, res) => {
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

    app.patch('/users/active/:id', verifyToken, verifyAdmin, async (req, res) => {
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

    app.patch('/users/blocked/:id', verifyToken, verifyAdmin, async (req, res) => {
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

    // admin api
    app.get('/users/admin/:email', verifyToken, verifyAdmin, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'unauthorized access' });
      }

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

    // blog get
    app.get('/blogs', async (req, res) => {
      const result = await blogsCollection.find().toArray();
      res.send(result);
    });
    // blog get by id
    app.get('/blogs/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await blogsCollection.findOne(query);
      res.send(result);
    });

    // blog published
    app.patch('/blogs/published/:id', verifyToken, async (req, res) => {
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
    app.patch('/blogs/draft/:id', verifyToken, async (req, res) => {
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
    app.post('/request', verifyToken, async (req, res) => {
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
    app.put('/request/:id', verifyToken, async (req, res) => {
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

    // volunteer api
    app.get('/users/volunteer/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'unauthorized access' });
      }

      const query = { email: email };
      const user = await usersCollection.findOne(query);

      let volunteer = false;
      if (user) {
        volunteer = user?.role === 'volunteer';
      }
      res.send({ volunteer });
    })

    // search form
    // app.get('/requests', async (req, res) => {
    //   try {
    //     const { blood, district, upazila } = req.query;
    //     const query = {};
  
    //     if (blood) query.blood = blood;
    //     if (district) query.district = district;
    //     if (upazila) query.upazila = upazila;
  
    //     const donors = await requestCollection.find(query).toArray();
    //     res.json(donors);
    //   } catch (err) {
    //     res.status(500).send('Server Error');
    //   }
    // });

    // payment intent
    app.post('/create-payment-intent', async (req, res) => {
      console.log(req.body);
      const {fund} = req.body;
      const amount = parseInt(fund * 100);
      console.log(amount)
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"]
      });
      console.log(paymentIntent.clientSecret);
      res.send({
        clientSecret: paymentIntent.client_secret
      })
    })
  
  // payment api
  app.post('/fund', async (req, res) => {
    const fund = req.body;
    const result = await fundCollection.insertOne(fund);
    res.send(result);
  })

  app.get('/fund', async (req, res) => {
    const result = await fundCollection.find().toArray();
    res.send(result);
  })

    // payment intent
    // app.post('/create-payment-intent', async (req, res) => {
    //   const { price } = req.body;
    //   const amount = parseInt(price * 100);
    //   const paymentIntent = await stripe.paymentIntents.create({
    //     amount: amount,
    //     currency: 'usd',
    //     payment_method_types: ['card']
    //   });
    //   res.send({
    //     clientSecret: paymentIntent.client_secret
    //   });
    // })

    // payment history data loaded by user email
    // app.get('/payments/:email', async (req, res) => {
    //   const query = { email: req.params.email };
    //   // if(query !== req.decoded.email){
    //   //   return res.status(403).send({message: 'forbidden access'});
    //   // }
    //   const result = await paymentsCollection.find(query).toArray();
    //   res.send(result);
    //   console.log(result);
    // })

    // payment api
    // app.get('/payments', async (req, res) => {
    //   const result = await paymentsCollection.find().toArray();
    //   res.send(result);
    // })

    // app.post('/payments', async (req, res) => {
    //   const payment = req.body;
    //   const result = await paymentsCollection.insertOne(payment);

    //   // carefully delete each item from the cart
    //   // const query = {
    //   //   _id: {
    //   //     $in: payment.cartId.map(id => new ObjectId(id))
    //   //   }
    //   // };
    //   // const deleted = await cartCollection.deleteMany(query);
    //   res.send(result);
    // })

    // stats or analytics
    app.get('/admin-stats', async (req, res) => {
      const users = await usersCollection.estimatedDocumentCount();
      const requestTotal = await requestCollection.estimatedDocumentCount();
      const result = await fundCollection.aggregate([
        {
          $group: {
            _id: null, 
            funds: {
              $sum: '$fund'
            }
          }
        }
      ]).toArray();

      const totalFund = result.length > 0 ? result[0].funds : 0;
      res.send({
        users, requestTotal, totalFund
      })
    });

    // request delete
    app.delete('/request/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      console.log(query);
      const result = await requestCollection.deleteOne(query);
      res.send(result);
    })

    // blog delete
    app.delete('/blogs/:id', verifyToken, verifyAdmin, async (req, res) => {
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