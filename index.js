const express = require('express');
const cors = require('cors');
let jwt = require('jsonwebtoken');

const app = express()
const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb');
const { sendEmail } = require('./controllers/emailControllers');
require('dotenv').config();
const port = process.env.PORT || 8000;
// middle wares
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET,POST,DELETE')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    next()
})
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: "property homie rocco server is running" })
})

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.mwzl4ri.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        req.decoded = decoded;
        next();
    })
}


async function run() {
    try {
        const serviceCollection = client.db('propertyHomieRocco').collection('services');
        const propertyCollection = client.db('propertyHomieRocco').collection('properties');
        const reviews = client.db('propertyHomieRocco').collection('reviews');

        //jwt
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30d' });
            res.send({ token })
            console.log({ token })
        })
        // Handle POST request to /email/sendEmail
        // Handle requests to /email/sendEmail with the sendEmail handler
        app.post("/email/sendEmail", sendEmail);


        //get all services
        app.get('/services', async (req, res) => {
            const query = {}
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        })
        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await serviceCollection.findOne(query);
            res.send(result);
        })
        //add new service
        app.post('/services', async (req, res) => {
            const service = req.body;
            const result = await serviceCollection.insertOne(service);
            res.send({ insertedCount: result.insertedCount });
        })
        //get single service
        app.get('/service/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await serviceCollection.findOne(query);
            res.send(result);
        })
        // get featured properties
        app.get('/featured-properties', async (req, res) => {
            const query = { isFeatured: true };
            const limit = 6;
            const cursor = propertyCollection.find(query).limit(limit);
            const properties = await cursor.toArray();
            res.send(properties);

        })
        app.get('/featured-properties/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const properties = await propertyCollection.findOne(query);

            res.send(properties)
        })

        // get all properties

        app.get('/allproperties', async (req, res) => {
            const query = {};
            const cursor = propertyCollection.find(query);
            const properties = await cursor.toArray();
            res.send(properties);
        })
        //get single property
        app.get('/allproperties/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await propertyCollection.findOne(query);
            res.send(result);
        })
        // reviews api

        //add review to database
        app.post('/reviews', async (req, res) => {
            const review = req.body;
            const result = await reviews.insertOne(review);
            res.send(result);
        })

        //single service all review
        app.get('/reviews/:id', async (req, res) => {
            const id = req.params.id;
            const query = { serviceId: id };
            const cursor = reviews.find(query);
            const results = await cursor.toArray();
            res.send(results);
        })


        //get single review
        app.get('/single-reviews/', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await reviews.findOne(query);
            res.send(result);
        })
        app.get('/reviews/email/:email', async (req, res) => {
            const email = req.params.email;
            console.log(email)
            const cursor = reviews.find({ email: email });
            const results = await cursor.toArray();
            res.send(results);
        })

        // Endpoint for getting all reviews
        app.get('/reviews', async (req, res) => {
            try {
                const reviewss = await reviews.find();
                res.json(reviewss);
            } catch (error) {
                console.error(error);
                res.status(500).send('Server Error');
            }
        });


    }
    finally {

    }
}
run().catch(err => console.error(err));
app.listen(port, () => {
    console.log(`property homie rocco is running on ${port}`);
})

        //show all reviews
        // app.get('/reviews', verifyJWT, async (req, res) => {
        //     const decoded = req.decoded;

        //     if (decoded.email !== req.query.email) {
        //         res.status(403).send({ message: 'unauthorized access' })
        //     }
        //     let query = {};
        //     if (req.query.email) {
        //         query = {
        //             email: req.query.email
        //         }
        //     }
        //     const cursor = reviews.find(query).sort({ date: 'desc' });
        //     const reviewss = await cursor.toArray();
        //     res.send(reviewss);
        // })

          // // Endpoint for adding a new review
        // app.post('/reviews', async (req, res) => {
        //     const { name, rating, review } = req.body;
        //     try {
        //         const newReview = new Review({ name, rating, review });
        //         await newReview.save();
        //         res.json(newReview);
        //     } catch (error) {
        //         console.error(error);
        //         res.status(500).send('Server Error');
        //     }
        // });


          // //review delete
        // app.delete('/reviews/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const query = { _id: ObjectId(id) };
        //     const result = await reviews.deleteOne(query);
        //     res.send(result);
        // })