const { MongoClient, ObjectId } = require("mongodb");

async function setupTestDatabase() {
  const client = new MongoClient("mongodb://localhost:27017");

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("shop");

    // Drop existing collections
    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
      await db.collection(collection.name).drop();
    }

    // Create users collection with some sample data
    await db.collection("users").insertMany([
      {
        _id: new ObjectId(),
        email: "john@example.com",
        name: "John Doe",
        age: 35,
        address: {
          street: "123 Main St",
          city: "Seoul",
          country: "South Korea",
        },
        createdAt: new Date("2023-01-15"),
        lastLogin: new Date("2024-03-10"),
      },
      {
        _id: new ObjectId(),
        email: "jane@example.com",
        name: "Jane Smith",
        age: 28,
        address: {
          street: "456 Park Ave",
          city: "Busan",
          country: "South Korea",
        },
        createdAt: new Date("2023-03-20"),
        lastLogin: new Date("2024-03-12"),
      },
    ]);

    // Create products collection
    await db.collection("products").insertMany([
      {
        _id: new ObjectId(),
        name: "Laptop Pro",
        category: "Electronics",
        price: 1299.99,
        stock: 50,
        specs: {
          cpu: "Intel i7",
          ram: "16GB",
          storage: "512GB SSD",
        },
        tags: ["laptop", "computer", "electronics"],
        createdAt: new Date("2024-01-01"),
      },
      {
        _id: new ObjectId(),
        name: "Wireless Mouse",
        category: "Electronics",
        price: 29.99,
        stock: 200,
        specs: {
          type: "Wireless",
          dpi: "1600",
          battery: "AA",
        },
        tags: ["mouse", "computer", "accessories"],
        createdAt: new Date("2024-01-02"),
      },
    ]);

    // Create orders collection
    await db.collection("orders").insertMany([
      {
        _id: new ObjectId(),
        userId: (
          await db.collection("users").findOne({ email: "john@example.com" })
        )._id,
        status: "completed",
        items: [
          {
            productId: (
              await db.collection("products").findOne({ name: "Laptop Pro" })
            )._id,
            quantity: 1,
            price: 1299.99,
          },
        ],
        totalAmount: 1299.99,
        shippingAddress: {
          street: "123 Main St",
          city: "Seoul",
          country: "South Korea",
        },
        createdAt: new Date("2024-02-15"),
        updatedAt: new Date("2024-02-18"),
      },
      {
        _id: new ObjectId(),
        userId: (
          await db.collection("users").findOne({ email: "jane@example.com" })
        )._id,
        status: "processing",
        items: [
          {
            productId: (
              await db
                .collection("products")
                .findOne({ name: "Wireless Mouse" })
            )._id,
            quantity: 2,
            price: 29.99,
          },
        ],
        totalAmount: 59.98,
        shippingAddress: {
          street: "456 Park Ave",
          city: "Busan",
          country: "South Korea",
        },
        createdAt: new Date("2024-03-10"),
        updatedAt: new Date("2024-03-10"),
      },
    ]);

    // Create reviews collection
    await db.collection("reviews").insertMany([
      {
        _id: new ObjectId(),
        userId: (
          await db.collection("users").findOne({ email: "john@example.com" })
        )._id,
        productId: (
          await db.collection("products").findOne({ name: "Laptop Pro" })
        )._id,
        rating: 5,
        comment: "Excellent laptop, very fast and reliable",
        createdAt: new Date("2024-02-20"),
      },
      {
        _id: new ObjectId(),
        userId: (
          await db.collection("users").findOne({ email: "jane@example.com" })
        )._id,
        productId: (
          await db.collection("products").findOne({ name: "Wireless Mouse" })
        )._id,
        rating: 4,
        comment: "Good mouse, but battery life could be better",
        createdAt: new Date("2024-03-12"),
      },
    ]);

    console.log("Test database setup completed!");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.close();
  }
}

setupTestDatabase();
