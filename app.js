var express = require('express');
const app = express();
const bodyParser = require('body-parser');
const dotenv = require('dotenv')
dotenv.config()
const port =  process.env.PORT||8210;
const mongo = require('mongodb');
const MongoClient = mongo.MongoClient;
const cors = require('cors')
// to recive data from form
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(cors())
app.use((req,res,next) => {
    res.header('Access-Control-Allow-Origin','*');
    next();
});

//const mongourl = "mongodb://localhost:27017"
const mongourl = "mongodb+srv://document:rk123456@cluster0.gfit3.mongodb.net/eduaug?retryWrites=true&w=majority"
var db;
//get
app.get('/',(req,res) => {
    res.send("Welcome to Node Api2")
})

//List All cities
app.get('/location',(req,res) =>{
    db.collection('location').find().toArray((err,result)=>{
        if(err) throw err;
        res.send(result)
    })
})

//List all restaurants
app.get('/restaurants',(req,res) =>{
    db.collection('restaurants').find().toArray((err,result)=>{
        if(err) throw err;
        res.send(result)
    })
})

// query example
app.get('/restaurant',(req,res) =>{
    var query = {}
    if(req.query.stateId){
        query={state_id:Number(req.query.stateId)}
        
    }else if(req.query.mealtype){
        query={"mealTypes.mealtype_id":Number(req.query.mealtype)}
    }
    console.log(query)
    db.collection('restaurants').find(query).toArray((err,result)=>{
        if(err) throw err;
        res.send(result)
    })
})

//filterapi
//(http://localhost:8210/filter/1?lcost=500&hcost=600)
app.get('/filter/:mealType',(req,res) => {
    var sort = {cost:1}
    var skip = 0;
    var limit = 1000000000000;
    if(req.query.sortkey){
        sort = {cost:req.query.sortkey}
    }
    if(req.query.skip && req.query.limit){
        skip = Number(req.query.skip);
        limit = Number(req.query.limit)
    }
    var mealType = req.params.mealType;
    var query = {"mealTypes.mealtype_id":Number(mealType)};
    if(req.query.cuisine && req.query.lcost && req.query.hcost){
        query={
            $and:[{cost:{$gt:Number(req.query.lcost),$lt:Number(req.query.hcost)}}],
            "cuisines.cuisine_id":Number(req.query.cuisine),
            "mealTypes.mealtype_id":Number(mealType)
        }
    }   
    else if(req.query.cuisine){
        query = {"mealTypes.mealtype_id":Number(mealType),"cuisines.cuisine_id":Number(req.query.cuisine) }
        console.log(query)
       
       //query = {"type.mealtype":mealType,"Cuisine.cuisine":{$in:["1","5"]}}
    }
    else if(req.query.lcost && req.query.hcost){
        var lcost = Number(req.query.lcost);
        var hcost = Number(req.query.hcost);
        query={$and:[{cost:{$gt:lcost,$lt:hcost}}],"mealTypes.mealtype_id":Number(mealType)}
    }
    db.collection('restaurants').find(query).sort(sort).skip(skip).limit(limit).toArray((err,result)=>{
        if(err) throw err;
        res.send(result)
    })
})

//List all QuickSearches
app.get('/quicksearch',(req,res) =>{
    db.collection('mealType').find().toArray((err,result)=>{
        if(err) throw err;
        res.send(result)
    })
})

// restaurant Details
app.get('/details/:id',(req,res) => {
    var id = req.params.id
    console.log(id)
    db.collection('restaurants').find({restaurant_id:Number(id)}).toArray((err,result)=>{
        if(err) throw err;
        res.send(result)
    })
})

// menu Details on basis for restaurant
app.get('/menu/:id',(req,res) => {
    var id = req.params.id
    console.log(id)
    db.collection('Restaurantmenu').find({restaurant_id:Number(id)}).toArray((err,result)=>{
        if(err) throw err;
        res.send(result)
    })
})

app.post('/menuItem',(req,res) => {
    //console.log(req.body.id)
    db.collection('Restaurantmenu').find({menu_id:{$in:req.body}}).toArray((err,result)=>{
        if(err) throw err;
        res.send(result)
        console.log(result)
    })
})

// place order 
app.post('/placeOrder',(req,res) => {
    console.log(req.body);
    db.collection('orders').insertOne(req.body,(err,result) => {
        if(err) throw err;
        res.send("Order Placed")
    })
})

app.get('/viewOrder',(req,res) => {
    var query = {}
    if(req.query.email){
        query = {email:req.query.email}
    }
    db.collection('orders').find(query).toArray((err,result)=>{
        if(err) throw err;
        res.send(result)
    })
})

app.get('/viewOrder/:id',(req,res) => {
    var id = mongo.ObjectId(req.params.id);
    db.collection('orders').find({_id:id}).toArray((err,result)=>{
        if(err) throw err;
        res.send(result)
    })
})

app.delete('/deleteOrder',(req,res) => {
    db.collection('orders').remove({},(err,result)=>{
        if(err) throw err;
        res.send(result)
    })
})

app.put('/updateOrder/:id',(req,res) => {
    var id = Number(req.params.id);
    var status = req.body.status?req.body.status:"Pending"
    db.collection('orders').updateOne(
        {id:id},
        {
            $set:{
                "date":req.body.date,
                "bank_status":req.body.bank_status,
                "bank":req.body.bank,
                "status":status
            }
        }
    )
    res.send('data updated')
})

app.put('/updateStatus/:id',(req,res) => {
    var id = mongo.ObjectId(req.params.id);
    var status = 'Pending';
    var statuVal = 2
    if(req.query.status){
        statuVal = Number(req.query.status)
        if(statuVal == 1){
            status = 'Accepted'
        }else if (statuVal == 0){
            status = 'Rejected'
        }else{
            status = 'Pending'
        }
    }
    db.collection('orders').updateOne(
        {_id:id},
        {
            $set:{
               "status": status
            }
        }, (err,result) => {
            if(err) throw err;
            res.send(`Your order status is ${status}`)
        }
    )
})


MongoClient.connect(mongourl, (err,client) => {
    if(err) console.log("Error While Connecting");
    db = client.db('eduaug');
    app.listen(port,()=>{
        console.log(`listening on port no ${port}`)
    });
})