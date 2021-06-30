//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", { useNewUrlParser:true, useUnifiedTopology: true});

const itemSchema = {
  name: String
};

const Item = new mongoose.model("Item", itemSchema);

const cook = new Item ({
  name: "Cook"
});

const eat = new Item ({
  name: "Eat"
});

const sleep = new Item ({
  name: "Sleep"
});

const defaultItems = [cook, eat, sleep];

const listSchema = {
  name: String,
  items: [itemSchema]
};

const List = new mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find({}, function(err, foundItem){

    if (foundItem.length === 0){
      Item.insertMany(defaultItems, function(err){
        if(err) {
          console.log(err);
        } else {
          console.log("Successfully inserted the items to DB.")
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItem});
    }
  });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }
});

app.post("/delete", function(req, res){
  const itemID = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(itemID, function(err){
      if(err){
        console.log(err);
      } else {
        console.log("Item successfully deleted from DB.")
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: itemID}}}, function(err, foundList){
      if (!err){
        res.redirect("/" + listName);
      }
    });
  }


});

app.get("/:random", function(req, res){
  const random = _.capitalize(req.params.random);

  List.findOne({name : random}, function(err, foundList){
    if(!err){
      if(!foundList){
        //Creates new page

        const list = new List({
          name: random,
          items: defaultItems
        });
        list.save();

        res.redirect("/" + random);
      } else {
        //Shows existing page 

        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });
});


app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
