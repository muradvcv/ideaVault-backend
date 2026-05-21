const express = require('express');
const cors = require("cors");
const dotenv = require('dotenv');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

dotenv.config();

const uri = process.env.MONGODB_URI;

const app = express();

app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {

  try {

    await client.connect();

    const db = client.db("ideaVault");

    const ideaCollection = db.collection("ideas");



    // get all ideas
    app.get('/ideas', async (req, res) => {

      const result = await ideaCollection.find().toArray();

      res.json(result);
    });



    // get single idea
    app.get('/ideas/:id', async (req, res) => {

      const { id } = req.params;

      const result = await ideaCollection.findOne({
        _id: new ObjectId(id)
      });

      res.json(result);
    });



    // add ideas
    app.post('/idea', async (req, res) => {

      const ideaData = req.body;

      const result = await ideaCollection.insertOne(ideaData);

      res.json(result);

      console.log(ideaData);
    });



    // get my ideas
    app.get('/my-ideas', async (req, res) => {

      const email = req.query.email;

      const query = {
        userEmail: email
      };

      const result = await ideaCollection.find(query).toArray();

      res.json(result);
    });



    // delete idea
    app.delete('/ideas/:id', async (req, res) => {

      const { id } = req.params;

      const query = {
        _id: new ObjectId(id)
      };

      const result = await ideaCollection.deleteOne(query);

      res.json(result);
    });



    // update idea
    app.put('/ideas/:id', async (req, res) => {

      const { id } = req.params;

      const updatedIdea = req.body;

      const query = {
        _id: new ObjectId(id)
      };

      const updatedDoc = {
        $set: {
          title: updatedIdea.title,
          category: updatedIdea.category,
          shortDescription: updatedIdea.shortDescription,
        }
      };

      const result = await ideaCollection.updateOne(query, updatedDoc);

      res.json(result);
    });



    await client.db("admin").command({ ping: 1 });

    console.log("MongoDB Connected Successfully");

  } finally {

  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('server is running');
});

app.listen(port, () => {
  console.log(`server running on ${port}`);
});