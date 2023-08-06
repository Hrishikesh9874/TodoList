require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose=require('mongoose');
const _=require('lodash');

const app = express();
const PORT=process.env.PORT || 3000;
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// mongoose.connect("mongodb://127.0.0.1:27017/todoDB", {useNewUrlParser:true})
mongoose.set('strictQuery', false);
const connectDB=async()=>{
  try{
    const conn=await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected: '+conn.connection.host );
  }
  catch(err){
    console.log(err);
    process.exit(1);
  }
}

const itemsSchema={
  name: String
}

const Item=mongoose.model("Item", itemsSchema);

const item1=new Item({
  name: "Welcome to your TODO list"
})

const item2=new Item({
  name: "Hit the + button to add a new item"
})

const item3=new Item({
  name: "<-- Hit this to delete"
})

const defaultItems=[item1, item2, item3];

const listSchema={
  name:String,
  items:[itemsSchema]
}

const List=mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find({})
  .then(function(foundItems){

    if(foundItems.length===0){
      Item.insertMany(defaultItems)
      .then(function(){
        // console.log("Data inserted") 
      })
      .catch(function(error){
        // console.log(error)      
      });
      res.redirect("/");
    }
    else{
      res.render("list", { listTitle: "Today", listItems:foundItems});
    }
  
  })
  .catch(function(error){
    // console.log(error);      
  });

});

app.get("/:customListName", function(req, res){
  const customListName= _.capitalize(req.params.customListName)
  List.findOne({name:customListName})
  .then(function(foundList){
    if(!foundList){
      const list=new List({
        name: customListName,
        items: defaultItems
      })
      if(customListName!="Favicon.ico"){
        list.save();
        res.redirect("/"+customListName)
      }
    }
    if(foundList){
     res.render("list", {listTitle: foundList.name, listItems: foundList.items});
    }
  })
  .catch(function(err){
    // console.log(err)
  });
});

app.post("/", function(req, res){

  const itemName=req.body.newTodo
  const listName=req.body.listSubmit

  const item=new Item({
    name:itemName
  })
  
  if(listName==="Today"){
    item.save();
    res.redirect("/");
  }
  else{
    List.findOne({name:listName})
    .then(function(foundList){
      foundList.items.push(item)
      foundList.save();
      res.redirect("/"+listName);
    })
    .catch(function(err){
      // console.log(err);
    })
  }
});


app.post("/delete", function(req, res){

  const checkedItemId=req.body.checkbox
  const listName=req.body.listName

  if(listName==="Today"){
      Item.deleteOne({_id:checkedItemId})
    .then(function(){
      res.redirect("/");
      // console.log("Deleted"+req.body);
    })
    .catch(function(err){
      // console.log(err);
    })
  }
  else{
    List.findOneAndUpdate({name:listName},{$pull: {items: {_id:checkedItemId}}})
    .then(function(foundList){
      res.redirect("/"+listName)
    })
    .catch(function(err){
      console.log(err)
    })
  }

});

// app.listen(3000, function() {
//   console.log("Server running on port 3000.");
// });
connectDB().then(()=>{
  console.log('Listening on port '+PORT );
})