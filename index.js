const express = require('express')
const cors = require('cors')
require('dotenv').config()
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
var jwt = require('jsonwebtoken');
const app = express()
const port = 5000

app.use(express.json())
app.use(cors())



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.UseDB}:${process.env.password}@cluster0.hwuf8vx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


const verifyJWT=(req,res,next)=>{
  console.log('hitting server')
 //  console.log(req.headers.authorize)
   const authorize=req.headers.authorize;
   if (!authorize) {
     return res.status(401).send({error:true,message:'unauthorize access'})
   }
   const token = authorize.split(' ')[1]
   console.log(token)
   jwt.verify(token,process.env.AccessToken,(error,decoded)=>{
     if(error){
      return res.status(401).send({error: true , message:"unauthorize access"})
     }
     req.decoded=decoded
     next()
   })
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    const database= client.db("petDB")
    const userCollection=database.collection('user')
    const petCollection=database.collection('pets')
    const requestCollection=database.collection('request')
    const donationCampingCollection=database.collection('donation-camping')
    const donationsubmitCollection=database.collection('donation-submit')
    console.log("Pinged your deployment. You successfully connected to MongoDB!");


    app.post('/jwt',(req,res)=>{
      const user= req.body;
      console.log(user)
      const token= jwt.sign(user,process.env.AccessToken,{
        expiresIn:'2000h'
      });
      console.log(token)
      res.send({token})
  
     })
    app.post('/user',async(req,res)=>{
        const userpost=req.body
        const existingUser = await userCollection.findOne({ email: userpost.email });
   
        if (existingUser) {
          return res.status(400).json({ message: 'User already exists' });
        }
        const result= await userCollection.insertOne(userpost)
        res.send(result)
       
    })
 
    app.get('/user',verifyJWT,async(req,res)=>{
     const result= await userCollection.find().toArray()
     res.send(result)
    })

    app.patch('/user/:id',verifyJWT,async(req,res)=>{
      const updateFields = req.body;
      const id = req.params.id;
 
     const userQuery = { _id: new ObjectId(id) };
     const userUpdateDoc = { $set: { ...updateFields, role: 'admin' } };
     const userResult = await userCollection.updateOne(userQuery, userUpdateDoc);
    })

    app.get('/user/admin/:email',verifyJWT ,async (req, res) => {
        const email = req.params.email;
        const query = { email: email }
        const user = await userCollection.findOne(query)
        const result = { admin: user?.role === 'admin' }
        res.send(result)
      })

      app.post('/pets',async(req,res)=>{
        const petpost=req.body
        const result=await petCollection.insertOne(petpost)
        res.send(result)
      })
    

      
app.get('/petspegination',async (req, res) => {
  // Get the page and limit from the query parameters, with default values
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  // Calculate the starting index of the results
  const startIndex = (page - 1) * limit;

  try {
      // Get the paginated results from the collection
      const results = await petCollection.find().skip(startIndex).limit(limit).toArray();

      // Optionally, get the total count of documents for pagination info
      const totalDocuments = await petCollection.countDocuments();

      // Send the results along with pagination info
      res.send({
          page,
          limit,
          totalPages: Math.ceil(totalDocuments / limit),
          totalDocuments,
          results
      });
  } catch (err) {
      // Handle any errors
      res.status(500).send({ error: 'An error occurred while fetching the data.' });
  }
});

app.delete('/pet/:id',verifyJWT,async(req,res)=>{
  const id=req.params.id
  const query= {
    _id: new ObjectId(id)
  }

  const result= await petCollection.deleteOne(query)
  res.send(result)
})

app.get('/pet/:id',async(req,res)=>{
  const id=req.params.id
  const query= {
    _id: new ObjectId(id)
  }
  const result= await petCollection.findOne(query)
  res.send(result)
})

app.patch('/pet/:id',verifyJWT,async(req,res)=>{
  const id = req.params.id
  const updateFields = req.body;
  const updateDoc = { $set: updateFields };
  const query = { _id: new ObjectId(id) }
  const result= await petCollection.updateOne(query,updateDoc)
  res.send(result)
  console.log(result,'hello')
})

app.get('/pets', async (req, res) => {
  try {
    const result = await petCollection.find().sort({ postDate: -1 }).toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: 'Error fetching pets', error });
  }
});



app.post('/request',verifyJWT,async(req,res)=>{
  const petpost=req.body
  const result=await requestCollection.insertOne(petpost)
  res.send(result)
})

app.get('/request',verifyJWT,async(req,res)=>{
  const email=req.query.email
 
  const result= await requestCollection.find({email:email}).toArray()
  res.send(result)
})


app.get('/requeses',async(req,res)=>{
  
 
  const result= await requestCollection.find().toArray()
  res.send(result)
})

app.patch('/requestUpdate/:id',verifyJWT,async(req,res)=>{
  const id = req.params
  const updateFields = req.body;
  const updateDoc = { $set: updateFields };
  const query = { _id: new ObjectId(id) }
  const result= await requestCollection.updateOne(query,updateDoc)
  res.send(result)
  console.log(result)
})

// donation create get update delete


app.post('/donation-camping',verifyJWT,async(req,res)=>{
  const petpost=req.body
  const result=await donationCampingCollection.insertOne(petpost)
  res.send(result)
})
app.get('/donation-campaigns', async (req, res) => {
  try {
      const campaigns = await donationCampingCollection.find({}).toArray();
      res.send(campaigns);
  } catch (error) {
      res.status(500).send({ error: error.message });
  }
});
app.get('/donation-campings',verifyJWT,async(req,res)=>{
  
  const { page = 1, limit = 10 } = req.query; // Default to page 1 and limit 10

  try {
      const campaigns = await donationCampingCollection.find()
          .sort({ createdAt: -1 }) // Sort by createdAt in descending order
          .skip((page - 1) * limit)
          .limit(parseInt(limit))
          .toArray();

      res.send(campaigns);
     
  } catch (error) {
      res.status(500).send({ message: 'Error fetching donation campaigns', error });
  }
})
app.get('/donation/:id',async(req,res)=>{
  const id=req.params.id
  const query= {
    _id: new ObjectId(id)
  }
  const result= await donationCampingCollection.findOne(query)
  res.send(result)
})
app.delete('/donation/:id',verifyJWT,async(req,res)=>{
  const id=req.params.id
  const query= {
    _id: new ObjectId(id)
  }
  const result= await donationCampingCollection.deleteOne(query)
  res.send(result)
})

app.patch('/donationupdate/:id',verifyJWT,async(req,res)=>{
  const update = req.body;
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };

  try {
    const result = await donationCampingCollection.updateOne(query, { $set: update });
    res.send(result);
    console.log(result);
  } catch (error) {
    console.error('Error updating donation campaign:', error);
    res.status(500).send({ error: error.message });
  }
})

app.get('/my-donation',verifyJWT,async(req,res)=>{
  const email=req.query.email
 
  const result= await donationCampingCollection.find({email:email}).toArray()
  res.send(result)
})
app.get('/my-donation-pay',verifyJWT,async(req,res)=>{
  const email=req.query.email
 
  const result= await donationsubmitCollection.find({email:email}).toArray()
  res.send(result)
})




// payment 

app.post('/create-payment-intent',verifyJWT, async (req, res) => {
  const { amount, _id, email } = req.body;
  
  try {
      const paymentIntent = await stripe.paymentIntents.create({
          amount: amount * 100, // Stripe amount is in cents
          currency: 'usd',
          metadata: { _id, email }
      });
      res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});


app.post('/donation-submit',verifyJWT,async(req,res)=>{
  const { email, userEmail, campaignID, image, transactionId, amount } = req.body;
  const parsedAmount = parseFloat(amount);
  // const id=req.params.campaignID
  // Insert donation submission
  const donationSubmission = {
      email,
      userEmail,
      campaignID,
      image,
      transactionId,
      amount,
      date: new Date()
  };



  try {
      const result = await donationsubmitCollection.insertOne(donationSubmission);

      // Update donation campaign with incremented donated amount
      await donationCampingCollection.updateOne(
        { _id: new ObjectId(campaignID) },
          { $inc: { donatedAmount: parsedAmount } }
      );

      res.send(result);
  } catch (error) {
      res.status(500).send({ error: error.message });
  }
})


app.delete('/refund/:id', verifyJWT,async (req,res) => {
  const id = req.params.id;
  if (!ObjectId.isValid(id)) {
      return res.status(400).send({ error: 'Invalid ID format' });
  }
  const query = { _id: new ObjectId(id) };
  try {
      const result = await donationsubmitCollection.deleteOne(query);
      res.send(result);
  } catch (error) {
      res.status(500).send({ error: error.message });
  }
});

app.patch('/refundses/:id', verifyJWT,async (req,res) => {
  const { amount } = req.body;
  const id = req.params.id;
  const parsedAmount = parseFloat(amount);
  const query = { _id: new ObjectId(id) };
  try {
      const result = await donationCampingCollection.updateOne(query, { $inc: { donatedAmount: -parsedAmount } });
      res.send(result);
console.log(result);
  } catch (error) {
      res.status(500).send({ error: error.message });
  }
});

  } finally {
    // Ensures that the client will close when you finish/error
   
  }
}
run().catch(console.dir);




app.get('/', (req, res) => {
  res.send('Server Running!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})