const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database("flavors.db", (err) => {
  if (err) {
    console.error("Database error:", err.message);
  } else {
    console.log("Connected to database.");
    db.run(`
      CREATE TABLE IF NOT EXISTS flavors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,  -- Added UNIQUE constraint
        ingredients TEXT NOT NULL,
        allergens TEXT
      )
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS cart (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        flavor_id INTEGER NOT NULL,  -- Added NOT NULL constraint
        FOREIGN KEY (flavor_id) REFERENCES flavors(id) ON DELETE CASCADE -- Added ON DELETE CASCADE
      )
    `);
  }
});


// Get all flavors (with optional search)
app.get("/flavors", (req, res) => {
  const { q } = req.query; // Get search query

  let sql = "SELECT * FROM flavors";
  let params = [];

  if (q) {
    sql += " WHERE LOWER(name) LIKE ?";
    params.push(`%${q.toLowerCase()}%`);
  }

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    res.json(rows);
  });
});


// Add a new flavor (with input validation)
app.post("/flavors", (req, res) => {
    const { name, ingredients, allergens } = req.body;

    // Server-side validation
    if (!name || typeof name !== 'string' || name.trim() === "") {
        return res.status(400).json({ error: "Name is required and must be a non-empty string." });
    }
    if (!ingredients || typeof ingredients !== 'string' || ingredients.trim() === "") {
        return res.status(400).json({ error: "Ingredients are required and must be a non-empty string." });
    }

    db.run(
        "INSERT INTO flavors (name, ingredients, allergens) VALUES (?, ?, ?)",
        [name.trim(), ingredients.trim(), allergens], // Trim whitespace
        function(err) {
            if (err) {
                if (err.message.includes("UNIQUE constraint failed")) {
                  return res.status(400).json({ error: "Flavor name already exists." });
                }
                return res.status(500).json({ error: "Failed to add flavor" });
            }
            res.status(201).json({ message: "Flavor added", id: this.lastID });
        }
    );
});


// Add flavor to cart (check if flavor exists first)
app.post("/cart", (req, res) => {
  const { flavorId } = req.body;

  db.get("SELECT 1 FROM flavors WHERE id = ?", [flavorId], (err, row) => {  // Check if flavor exists
    if (err) {
      return res.status(500).json({ error: "Database error" });
    }
    if (!row) {
      return res.status(404).json({ error: "Flavor not found" });
    }

    db.run("INSERT INTO cart (flavor_id) VALUES (?)", [flavorId], function (err) {
      if (err) {
        return res.status(500).json({ error: "Failed to add to cart" });
      }
      res.status(201).json({ message: "Added to cart", id: this.lastID });
    });
  });
});



// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
