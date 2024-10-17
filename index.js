const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
  const userCollection = client.db("SCIC").collection("users");
  try {
    app.get("/searchText", async (req, res) => {
      const page = req.query?.page
      const text = req.query?.text;
      console.log(page, text)
      try {
        productsLength = await productCollection
          .find({ productName: { $regex: `${text}`, $options: "i" } })
          .toArray();
        const result1 =productsLength.length;
        const result2 = await productCollection
        .find({ productName: { $regex: `${text}`, $options: "i" } })
        .skip(page * 2)
        .limit(2)
        .toArray();
        console.log('Result1 ',result1)
        console.log('Result2 ',result2)
        return res.status(404).send(result1, result2);
      } catch (error) {
        return res.status(404).json({ message: "No products found" });
      }
    });

    app.get("/getHomePageProduct", async (req, res) => {
      try {
        const productsByCategory = await productCollection
          .aggregate([
            {
              $match: {
                productCategory: {
                  $in: [
                    "Accessories",
                    "Basic Component",
                    "Development Board",
                    "Display",
                    "General IC",
                    "Home Automation",
                    "Kits",
                    "Microcontroller",
                    "Misscellaneous",
                    "Robotic",
                    "Sensor",
                    "Wireless",
                  ],
                },
              },
            },
            {
              $group: {
                _id: "$productCategory", // Group products by category
                products: {
                  $push: {
                    _id: "$_id",
                    productName: "$productName",
                    productImage: "$productImage",
                    productPrice: "$productPrice",
                  },
                },
              },
            },
            {
              $project: {
                _id: 1,
                products: { $slice: ["$products", 4] }, // Limit to 4 products per category
              },
            },
            { $sort: { _id: 1 } }, // Sort by category name alphabetically
          ])
          .toArray();

        res.status(200).json(productsByCategory);
      } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ message: "Failed to fetch products" });
      }
    });

    app.get("/singlePro/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await productCollection.findOne(filter);
      res.send(result);
      // console.log('hits here')
      // res.send({message: 'Man why?'})
    });

    app.get("/singleCategoryData/:category", async (req, res) => {
      const firstPage = parseInt(req.query?.page);
      console.log("First Page koto ", firstPage);
      const so = parseInt(req.query?.sort) || 1;
      let soo =
        parseInt(req.query?.sort) === 0
          ? {}
          : parseInt(req.query?.sort) === 1
          ? { productPrice: 1 }
          : { productPrice: -1 };
      // console.log('Output of soo ',soo)
      // console.log('Value of So ', so)
      const category = req.params.category;
      const filter = { productCategory: category };
      const options = {
        sort: soo,
        projection: {
          _id: 1,
          productName: 1,
          productImage: 1,
          productCategory: 1,
          productPrice: 1,
        },
      };
      // console.log("Option check ", options);
      const result1 = await productCollection.countDocuments(filter);
      const result2 = await productCollection
        .find(filter, options)
        .skip(firstPage * 4)
        .limit(4)
        .toArray();
      res.send({ result1, result2 });
    });
    //insert A Product
    app.post("/addProduct", async (req, res) => {
      const product = req.body;
      const result = await productCollection.insertOne(product);
      res.send(result);
    });

    app.get("/adminCheck/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const user = await userCollection.findOne(filter);
      let IsAdmin = user?.role === "admin";
      console.log("Admin checkinig  ", IsAdmin);
      res.send({ IsAdmin });
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user?.email };
      const ache = await userCollection.findOne(query);
      if (ache) {
        return res.send({ message: "user already exists" });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });
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

      const dd = date === "true" ? { creationDate: 1 } : { price: `${value}` };
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
  res.send("TechShop is running on the Server");
});

app.listen(port, async () => {
  console.log(`TechShop is running on port ${port}`);
});
