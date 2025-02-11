
const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Connect to SQLite database (or create if not exists)
const db = new sqlite3.Database("flavors.db", (err) => {
    if (err) {
        console.error("Error opening database:", err.message);
    } else {
        console.log("Connected to SQLite database.");
        db.run(
            `CREATE TABLE IF NOT EXISTS flavors (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                ingredients TEXT NOT NULL,
                allergens TEXT
            )`
        );
        db.run(
            `CREATE TABLE IF NOT EXISTS cart (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                flavor_id INTEGER,
                FOREIGN KEY (flavor_id) REFERENCES flavors(id)
            )`
        );
    }
});

// Fetch all flavors
app.get("/flavors", (req, res) => {
    db.all("SELECT * FROM flavors", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: "Database error" });
        }
        res.json(rows);
    });
});

// Add a new flavor
app.post("/flavors", (req, res) => {
    const { name, ingredients, allergens } = req.body;
    if (!name || !ingredients) {
        return res.status(400).json({ message: "Name and ingredients are required" });
    }

    db.run(
        "INSERT INTO flavors (name, ingredients, allergens) VALUES (?, ?, ?)",
        [name, ingredients, allergens],
        function (err) {          
            if (err) {   
                return res.status(500).json({ message: "Error adding flavor" });
            }
            res.status(201).json({ message: "Flavor added successfully", id: this.lastID });
        }
    );
});

// Search flavors by name
app.get("/flavors/search/:query", (req, res) => {
    const query = `%${req.params.query.toLowerCase()}%`;
    db.all("SELECT * FROM flavors WHERE LOWER(name) LIKE ?", [query], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: "Database error" });
        }
        res.json(rows);
    });
});

// Add flavor to cart
app.post("/cart", (req, res) => {
    const { flavorId } = req.body;
    db.run("INSERT INTO cart (flavor_id) VALUES (?)", [flavorId], function (err) {
        if (err) {
            return res.status(500).json({ message: "Error adding to cart" });
        }
        res.json({ message: "Flavor added to cart", id: this.lastID });
    });
});

// Get cart items
app.get("/cart", (req, res) => {
    db.all(
        "SELECT flavors.* FROM flavors JOIN cart ON flavors.id = cart.flavor_id",
        [],
        (err, rows) => {
            if (err) {
                return res.status(500).json({ message: "Database error" });
            }
            res.json(rows);
        }
    );
});

// Remove a flavor from the cart
app.delete("/cart/:id", (req, res) => {
    const flavorId = parseInt(req.params.id);
    db.run("DELETE FROM cart WHERE flavor_id = ?", [flavorId], function (err) {
        if (err) {
            return res.status(500).json({ message: "Error removing from cart" });
        }
        res.json({ message: "Flavor removed from cart" });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});