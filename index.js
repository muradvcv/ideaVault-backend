const express = require('express');
const cors = require("cors");
const dotenv = require('dotenv');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');

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

// Jwt token verified

const jwks = createRemoteJWKSet(
  new URL("http://localhost:3000/api/auth/jwks")
);

const tokenVerify = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const { payload } = await jwtVerify(token, jwks);

    console.log("PAYLOAD:", payload);

    req.user = payload;
    next();
  } catch (error) {
    console.log(error);
    return res.status(403).json({ message: "Forbidden" });
  }
};


async function run() {

  try {

    await client.connect();
    const db = client.db("ideaVault");
    const ideaCollection = db.collection("ideas");
    const commentCollection = db.collection("comments")


    // get comment from server
    app.get('/comment', async (req, res) => {

      const result = await commentCollection.find().toArray()
      res.json(result)

    })

    // dleete
    app.delete("/comment/:id",tokenVerify, async (req, res) => {
      const { id } = req.params;
      const { email } = req.body;

      const comment = await commentCollection.findOne({
        _id: new ObjectId(id),
      });

      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      if (comment.userEmail !== email) {
        return res.status(403).json({ message: "Not allowed" });
      }

      const result = await commentCollection.deleteOne({
        _id: new ObjectId(id),
      });

      res.json(result);
    });

    app.put("/comment/:id", async (req, res) => {
      const { id } = req.params;
      const { email, comment } = req.body;

      const existing = await commentCollection.findOne({
        _id: new ObjectId(id),
      });

      if (!existing) {
        return res.status(404).json({ message: "Not found" });
      }

      if (existing.userEmail !== email) {
        return res.status(403).json({ message: "Not allowed" });
      }

      const result = await commentCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            comment,
          },
        }
      );

      res.json(result);
    });
    // update my comment

    app.put("/comment/:id",tokenVerify, async (req, res) => {
      const { id } = req.params;
      const { email, comment } = req.body;

      const existing = await commentCollection.findOne({
        _id: new ObjectId(id),
      });

      if (!existing) {
        return res.status(404).json({ message: "Not found" });
      }

      if (existing.userEmail !== email) {
        return res.status(403).json({ message: "Not allowed" });
      }

      const result = await commentCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            comment,
          },
        }
      );

      res.json(result);
    });

    // add comment on server
    app.post('/comment',tokenVerify, async (req, res) => {
      const commentData = req.body
      const result = await commentCollection.insertOne(commentData)

      res.json(result)

      console.log(commentData);

    })


    // get all ideas
    app.get('/ideas', async (req, res) => {

      const result = await ideaCollection.find().toArray();

      res.json(result);
    });


    // get single idea
    app.get('/ideas/:id',tokenVerify,async (req, res) => {

      const { id } = req.params;

      const result = await ideaCollection.findOne({
        _id: new ObjectId(id)
      });

      res.json(result);
    });


    // add idea
    app.post('/idea',tokenVerify, async (req, res) => {

      const ideaData = req.body;

      const result = await ideaCollection.insertOne(ideaData);

      res.json(result);

      console.log(ideaData);
    });


    // get my ideas
    app.get('/my-ideas',tokenVerify, async (req, res) => {

      const email = req.query.email;

      const query = {
        userEmail: email
      };

      const result = await ideaCollection.find(query).toArray();

      res.json(result);
    });

    // delete idea
    app.delete('/ideas/:id',tokenVerify,async (req, res) => {

      const { id } = req.params;

      const query = {
        _id: new ObjectId(id)
      };

      const result = await ideaCollection.deleteOne(query);

      res.json(result);
    });



    // update idea
    app.put('/ideas/:id',tokenVerify, async (req, res) => {

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