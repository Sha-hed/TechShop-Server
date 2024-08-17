const { MongoClient, ServerApiVersion } = require("mongodb");
const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
require("dotenv").config();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@cluster0.ojv3wo1.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  const productCollection = client.db("SCIC").collection("products");
  try {
    app.get("/allWork", async (req, res) => {
      let productsLength = 0;
      let products = [];
      const value = parseInt(req.query.value);
      const page = parseInt(req.query.page);
      const minPrice = parseInt(req.query.minPrice);
      const maxPrice = parseInt(req.query.maxPrice);
      const date = req.query.date;
      const text = req.query.text;
      const brand = req.query.brand;
      const category = req.query.category;
      console.log(brand, category, minPrice, maxPrice);
      const dd = date === "true" ? { creationDate: 1 } : { price: `${value}` };
      // console.log(req.query);
      if (text) {
        try {
          productsLength = await productCollection
            .find({ productName: { $regex: `^${text}`, $options: "i" } })
            .toArray();
          productsLength = productsLength.length;
          products = await productCollection
            .find({ productName: { $regex: `^${text}`, $options: "i" } })
            .skip(page * 6)
            .limit(6)
            .sort(dd)
            .toArray();
          return res.send({ productsLength, products });
        } catch (error) {
          return res.status(404).json({ message: "No products found" });
        }
      }
      if (brand || category || minPrice || maxPrice) {
        const query = {
          $and: [],
        };
        if (brand) {
          query.$and.push({ brandName: brand });
        }
        if (category) {
          query.$and.push({ category: category });
        }
        if (minPrice) {
          query.$and.push({ price: { $gte: minPrice } });
        }
        if (maxPrice) {
          query.$and.push({ price: { $lte: maxPrice } });
        }
        try {
          productsLength = await productCollection.find(query).toArray();
          productsLength = productsLength.length;
          products = await productCollection
            .find(query)
            .skip(page * 6)
            .limit(6)
            .sort(dd)
            .toArray();
          return res.send({ productsLength, products });
        } catch (error) {
          return res.status(404).json({ message: "No products found" });
        }
      }
      try {
        productsLength = await productCollection.estimatedDocumentCount();
        console.log("Product Length ", productsLength);
        products = await productCollection
          .find()
          .skip(page * 6)
          .limit(6)
          .sort(dd)
          .toArray();
        return res.send({ productsLength, products });
      } catch (error) {
        return res.status(404).json({ message: "No products found" });
      }
    });

    app.get("/category", async (req, res) => {
      const brand = req.query.brand;
      const category = req.query.category;
      const minPrice = parseInt(req.query.minPrice);
      const maxPrice = parseInt(req.query.maxPrice);
      console.log(brand, category, minPrice, maxPrice);
      const query = {
        $and: [],
      };
      if (brand) {
        query.$and.push({ brandName: brand });
      }
      if (category) {
        query.$and.push({ category: category });
      }
      if (brand) {
        query.$and.push({ brandName: brand });
      }
      if (minPrice) {
        query.$and.push({ price: { $gte: minPrice } });
      }
      if (maxPrice) {
        query.$and.push({ price: { $lte: maxPrice } });
      }
      const result = await productCollection.find(query).toArray();
      res.send(result);
    });

    // app.get("/sortByDate", async (req, res) => {
    //   const result = await productCollection
    //     .find()
    //     .sort({ creationDate: 1 })
    //     .toArray();
    //   res.send(result);
    // });

    // app.get("/sortByLowToHigh", async (req, res) => {
    //   const result = await productCollection
    //     .find()
    //     .sort({ price: `${parseInt(req.query.value)}` })
    //     .toArray();
    //   res.send(result);
    // });
    //Get all the name, will use pagination here
    app.get("/searchName", async (req, res) => {
      const text = req.query.text;
      try {
        const productLength = await productCollection
          .find({ productName: { $regex: `^${text}`, $options: "i" } })
          .toArray();
        const product = await productCollection
          .find({ productName: { $regex: `^${text}`, $options: "i" } })
          .skip(6)
          .limit(6)
          .toArray();
        res.send({ productLength, product });
      } catch (error) {
        res.status(404).json({ message: "No products found" });
      }
    });

    app.get("/products", async (req, res) => {
      const value = parseInt(req.query.value);
      const page = parseInt(req.query.page);
      const date = req.query.date;
      const dd = date === "true" ? { creationDate: 1 } : { price: `${value}` };
      const result = await productCollection
        .find()
        .skip(page * 6)
        .limit(6)
        .sort(dd)
        .toArray();
      res.send(result);
    });

    app.get("/countDocument", async (req, res) => {
      try {
        // Count the total number of documents in the 'productCollection'
        const result = await productCollection.estimatedDocumentCount();

        // Send the count as a response
        res.send({ totalDocuments: result });
      } catch (error) {
        // Handle any errors that occur during the operation
        res.status(500).send({ message: "Error counting documents", error });
      }
    });

    console.log("Successfully connected to MongoDB!");
  } finally {
  }
}
run().catch(console.dir);

app.get("/", async (req, res) => {
  res.send("Completing Job Task of SCIC");
});

app.listen(port, async () => {
  console.log(`completing job task on port ${port}`);
});
