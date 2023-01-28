
require("dotenv").config()


const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");


const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
mongoose.set("strictQuery", false);
main().catch(console.error());


// Connect to MongoDB Atlas.
async function main() {
	
	const uri = process.env.MONGO_URI;
	const options = {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	};

	await mongoose.connect(uri, options)
	.then(() => console.log("Connected to Atlas!"));

	
	app.listen(process.env.PORT || 3000, function () {
		console.log("Server started on port 3000.");
	});
};



// Connect to MongoDB by port.
// async function main() {
// 	await mongoose.connect("mongodb://127.0.0.1:27017/todolistDB")  // local connection with community server.
// 	.then(() => console.log("Connected!"));
// };



// Defining a Model Schema.
const Schema = mongoose.Schema;
const itemSchema = new Schema({
	name: String
});

const listSchema = new Schema({
	name: String,
	items: [itemSchema]
});

// Create a Model.
const Item = new mongoose.model("Item", itemSchema);
const List = new mongoose.model("List", listSchema);

// Create & Save a Document.
const item1 = new Item({
	name: "Welcome to your ToDoList!"
});
const item2 = new Item({
	name: "Hit the '+' button to add a new item."
});
const item3 = new Item({
	name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];



app.get('/', function (req, res) {

  Item.find({}, function(err, foundItems) {    // {} empty returns all, foundItems captures it.

		if (foundItems.length === 0) {
			Item.insertMany(defaultItems, {
				function(err) {
					if (err) {
						console.log(err);
					} else {
						console.log("Succesfully saved to todolistDB");
					}
				}
			});
			res.redirect("/");   // after if check redirect back to itself in order to run the else block.
		} else {
				res.render("list", { listTitle: "Today", newListItems: foundItems });
		}
  });

});


app.get('/:customListName', function (req, res) {
	const customListName = _.capitalize(req.params.customListName);

	List.findOne({ name: customListName }, function(err, foundList) {
		if (!err) {
			if (!foundList) {
				// Create a new List.
				const list = new List({
					name: customListName,
					items: defaultItems
				});
				list.save();
				res.redirect("/" + customListName);

			} else {
				// Show an existing List.
				res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
			}
		}
	});

});


app.post('/', function (req, res) {
  
  const itemName = req.body.newItem;
  const listName = req.body.list;   // .list is the button name.

	const item = new Item({
		name: itemName
	});

	if (listName === "Today") {
		item.save();
		res.redirect("/");
	} else {
		List.findOne({name: listName}, function(err, foundList) {
			foundList.items.push(item);
			foundList.save();
			res.redirect("/" + listName);
		});
	}

});


app.post('/delete', function(req, res) {
	const checkedItemId = req.body.checkbox;
	const listName = req.body.listName;

	if (listName === "Today") {
		Item.findByIdAndRemove(checkedItemId, function (err) {
			if (!err) {
				console.log("Succesfully deleted checked item.");
				res.redirect("/");
			}
		});
	} else {
		List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList) {
			if (!err) {
				res.redirect("/" + listName);
			}
		});
	}

});



app.get("/about", function (req, res) {
	res.render("about");
});


