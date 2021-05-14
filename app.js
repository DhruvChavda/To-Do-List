// Use dotenv to read .env vars into Node
require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// connect mongoose
console.log(PASSWORD);
mongoose.connect(process.env.DB_CONN);
mongoose.set("useNewUrlParser", true);
mongoose.set("useFindAndModify", false);
mongoose.set("useCreateIndex", true);
mongoose.set("useUnifiedTopology", true);

// ***********************************************************************************
// ROOT SCHEMA
// new schema
const itemSchema = new mongoose.Schema({
    name: {
        type: String,
    },
});

// new model
const Item = mongoose.model("Item", itemSchema);

// new docs
const i1 = new Item({
    name: "Welcome to your online to do list !",
});

const i2 = new Item({
    name: "Hit the + button to add a new item",
});

const i3 = new Item({
    name: "<= Hit this to delete an item",
});

const defaultItems = [i3, i2, i1];

// ***********************************************************************************
// CUSTOM LIST SCHEMA
// new schema

const listSchema = new mongoose.Schema({
    listName: String,
    items: [itemSchema],
});

// new model

const List = mongoose.model("List", listSchema);

// ROOT GET

app.get("/", function (req, res) {
    Item.find({}, (err, listOfItems) => {
        if (listOfItems.length == 0) {
            Item.insertMany(defaultItems, (err) => {
                if (err) console.log("error has occured");
                else console.log("successfully inserted!");
            });
            res.redirect("/");
        }
        if (err) console.log("an error has occured!");
        else {
            res.render("list", { listTitle: "Today", newListItems: listOfItems });
        }
    });
});

// CUSTOM GET
app.get("/:customName", (req, res) => {
    const customName = _.capitalize(req.params.customName);

    List.findOne({ listName: customName }, (err, doc) => {
        if (err) console.log("ERROR OCCURED");
        else {
            // since docs is an object (coz we used findOne) just check whethwe it exists or not
            if (!doc) {
                // create a new List
                customList = new List({
                    listName: customName,
                    items: defaultItems,
                });
                customList.save();

                res.redirect("/" + customName);
            } else {
                // show an existing list
                if (doc.items.length == 0) {
                    doc.items = defaultItems;
                    doc.save();
                }
                res.render("list", { listTitle: customName, newListItems: doc.items });
            }
        }
    });
});

// **************CUSTOMIZED FOR ROOT AND CUSTOM*****************************************************************************

app.post("/", function (req, res) {
    const itemName = req.body.newItem;
    const lName = req.body.listName;
    // console.log(lName);
    // console.log(item);
    const newNote = Item({
        name: itemName,
    });

    if (lName == "Today") {
        newNote.save();
        res.redirect("/");
    } else {
        List.findOne({ listName: lName }, (err, doc) => {
            if (err) console.log(err);
            else {
                doc.items.push(newNote);
                doc.save();
            }
        });
        res.redirect("/" + lName);
    }
});

// DELETE
app.post("/delete", (req, res) => {
    const lname = req.body.deleteListName;
    const itemId = req.body.itemID;
    // console.log(req.body);
    // console.log(itemId);

    if (lname == "Today") {
        Item.findByIdAndRemove(req.body.itemID, (err) => {
            if (!err) {
                console.log("Successfully Deleted!");
                res.redirect("/");
            }
        });
    } else {
        List.findOne({ listName: lname }, (err, doc) => {
            if (!err) {
                // console.log(doc.items);
                doc.items.pull({ _id: itemId });
                doc.save();
                res.redirect("/" + lname);
            }
        });
    }
});

// SERVER STARTS
let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}
app.listen(port, function () {
    console.log("SERVER HAS STARTED SUCCESSFULLY!");
});
