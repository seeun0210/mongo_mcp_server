# Shop Database ERD

This is an Entity-Relationship Diagram (ERD) for our online shop database, showing the relationships between users, products, orders, and reviews.

```mermaid
erDiagram
  reviews {
    ObjectId _id PK
    ObjectId userId FK
    ObjectId productId FK
    number rating
    string comment
    Date createdAt
  }
  users {
    ObjectId _id PK
    string email
    string name
    number age
    string address_street
    string address_city
    string address_country
    Date createdAt
    Date lastLogin
  }
  orders {
    ObjectId _id PK
    ObjectId userId FK
    string status
    ObjectId items_productId FK
    number items_quantity
    number items_price
    array items
    number totalAmount
    string shipping_street
    string shipping_city
    string shipping_country
    Date createdAt
    Date updatedAt
  }
  products {
    ObjectId _id PK
    string name
    string category
    number price
    number stock
    string specs_type
    string specs_dpi
    string specs_battery
    array tags
    Date createdAt
  }
  reviews }|--|| users : "belongs to"
  reviews }|--|| products : "written for"
  orders }|--|| users : "placed by"
  orders }|--|| products : "contains"
```

## Schema Description

### Users

- Stores user information including name, email, age, and address
- Tracks user creation and last login dates

### Products

- Contains product details like name, category, price, and stock
- Includes technical specifications and tags
- Tracks when the product was added

### Orders

- Records purchases made by users
- Contains order status and shipping information
- Includes array of ordered items with quantities and prices
- Tracks order creation and update times

### Reviews

- Stores product reviews from users
- Contains rating and comment
- Links to both user and product
- Records when the review was created
