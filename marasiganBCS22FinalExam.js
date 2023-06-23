// submitted by: marasigan, christine t. (bcs22)

// loading the expressjs module into our app and into the express variable
// express module will allow us to use expressjs methods to create our api
const express = require('express');

// create an application with expressjs
// this create an expressjs application and stores it as app
// app is our server

const app = express();

const port = 4000;

// express.json() allows us to handle the request's body and automatically parse the incoming JSON to a JS object we can access and manage
app.use(express.json());

let users = [
    {
        email: "mikasa@email.com",
        password: "aot1234",
        isAdmin: false
    },
    {
        email: "cookie@email.com",
        password: "kimmyJopayMaya",
        isAdmin: false
    },
    {
        email: "marasigan@email.com",
        password: "admin1234",
        isAdmin: false
    }
];

let products = [];

let loggedUser;

// express has methods to use as routes corresponding to http method
// get (<endpoint>, <functionToHandle request and response>)

// register
app.post('/users/register', (req,res) => {
    // since 2 applications are communicating with one another, being our client and our api, it is a good practice to always console log the incoming data first.
    console.log(req.body);

    // simulate the creation of new user account
    let newUser = {
        email: req.body.email,
        password: req.body.password,
        isAdmin: req.body.isAdmin
    };
    users.push(newUser);
    console.log(users);

    res.send(`Registered Successfully.`)
});

// login
app.post('/users/login', (req, res) => {
    // should contain username and password
    console.log(req.body);

    // fund the user with the same username and password from our request body
    let foundUser = users.find((user) => {
        return user.username === req.body.username && user.password === req.body.password;
    });

    if(foundUser !== undefined) {
        // get the index number foundUser, but since the users array is an array of object we have to use findIndex().
        // it will iterate over all of the items and return tyhe index number of the current item that matches the return condition.
        let foundUserIndex = users.findIndex((user) => {
            return user.username === foundUser.username
        });
        // This will add the index of your found user in the foundUser obejct
        foundUser.index = foundUserIndex;
        // temporarily log our user in. Allows us to refer the details of a logged in user

        loggedUser = foundUser
        console.log(loggedUser);

        res.send('Thank you for logging in.')
        } else {
            loggedUser = foundUser;
            res.send('Login failed. Wrong credentials.')
        }
});

// getAllUsers (even if not logged in)
app.get('/users', (req,res) => {
    console.log(loggedUser);
        res.send(users);
});

// getCurrentUser who is logged in
app.get('/users/login', (req,res) => {
    console.log(loggedUser);

    if(loggedUser === undefined) {
        res.send('No user has been logged in yet');
       } else if (loggedUser.isAdmin === true || loggedUser.isAdmin === false){
        res.send(loggedUser)
    }
});


// add product/products
app.post('/products', (req, res) => {
    console.log(loggedUser);
    console.log(req.body);

    if (loggedUser.isAdmin === true) {
        if (Array.isArray(req.body)) {
            req.body.forEach((product) => {
                let userIndex = users.findIndex(user => user.email === loggedUser.email);
                let newProduct = {
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    isActive: true,
                    createdOn: Date(),
                    userIndex: userIndex
                };
                products.push(newProduct);
            });
        } else {
            let userIndex = users.findIndex(user => user.email === loggedUser.email);
            let newProduct = {
                name: req.body.name,
                description: req.body.description,
                price: req.body.price,
                isActive: true,
                createdOn: Date(),
                userIndex: userIndex
            };
            products.push(newProduct);
        }

        res.send('You have added new product(s).');
    } else {
        res.send('Unauthorized. Action Forbidden.');
    }
});

// Get specific product
app.get('/products/:index', (req, res) => {
    console.log(req.params);
    console.log(req.params.index);
    let index = parseInt(req.params.index);
    let product = products[index];

    // Exclude "userIndex" property when sending the product response
    const { userIndex, ...productData } = product;
    res.send(productData);
});

// Declare the userOrders array outside of the request handlers to make it accessible to both endpoints
const userOrders = [];

// A GET request containing a header is sent to the /users/orders endpoint.
app.get('/users/orders', (req, res) => {
    console.log(loggedUser);

    if (loggedUser.isAdmin === true) {
        // Clear the userOrders array before populating it with new orders
        userOrders.length = 0;

        users.forEach((user) => {
            let userIndex = users.findIndex(u => u.email === user.email);
            let userProducts = products.filter(product => product.userIndex === userIndex);

            // Calculate total amount for user products
            let totalAmount = userProducts.reduce((sum, product) => sum + product.price, 0);

            // Assign current timestamp to purchasedOn property
            let purchasedOn = Date();

            // Exclude users without products
            if (userProducts.length > 0) {
                let newOrder = {
                    userId: userIndex,
                    products: userProducts.map(product => ({
                        name: product.name,
                        description: product.description,
                        price: product.price,
                        isActive: product.isActive,
                        createdOn: product.createdOn
                    })),
                    totalAmount: totalAmount,
                    purchasedOn: purchasedOn
                };
                userOrders.push(newOrder);
                console.log(`User Index: ${userIndex}`);
                console.log(`Products: ${newOrder.products}`);
                console.log(`Total Amount: ${totalAmount}`);
                console.log(`Purchased On: ${purchasedOn}`);
            }
        });

        res.json(userOrders);
    } else {
        res.send('403 Forbidden Access - User Order can only be accessed by Admins.');
    }
});

// A GET request to print out a specific order by order index
app.get('/users/orders/:orderIndex', (req, res) => {
  const orderIndex = parseInt(req.params.orderIndex);

  if (loggedUser.isAdmin === true && orderIndex >= 0 && orderIndex < userOrders.length) {
    const order = userOrders[orderIndex];
    res.json(order);
  } else {
    res.status(404).send('Order not found');
  }
});

// A DELETE request to delete a specific order by order index
app.delete('/users/orders/:orderIndex', (req, res) => {
  const orderIndex = parseInt(req.params.orderIndex);

  if (loggedUser.isAdmin === true && orderIndex >= 0 && orderIndex < userOrders.length) {
    userOrders.splice(orderIndex, 1);
    res.send('Order deleted successfully.');
  } else {
    res.status(404).send('Order not found');
  }
});


// getAllProducts
app.get('/products', (req,res) => {
    console.log(loggedUser);

    if(loggedUser.isAdmin === true) {
        // Exclude "userIndex" property when sending the products response
        const productsToSend = products.map(({ userIndex, ...product }) => product);
        res.send(productsToSend);
    } else {
        res.send('Unauthorized. Action Forbidden')
    }
});

    app.get('/users/:index', (req,res) => {
        // req.params is an object that contains the route params.
        // its properties are then determined by your route parameters.
        console.log(req.params);
        // how do we access the actual route params?
        console.log(req.params.index);
        // re.params.index being part of the url string is a string, so we need to parse it as a propert int.
        let index = parseInt(req.params.index)
        /* console.log(typeOf index); */
        let user = users[index];
        res.send(user);
    })

// updateUser
    // We're going to update the password of our user. However, we should get the user first. To do this. we should not pass the index of the user in the body but instead in our route params.

    app.put('/users/:index', (req,res) => {
        console.log(req.params);
        console.log(req.params.index);
        let userIndex = parseInt(req.params.index);
        if(loggedUser !== undefined && loggedUser.index === userIndex) {
            // get the proper user from the array with our index:
            // req.body.password comes from the body of your request.
            users[userIndex].password = req.body.password;
            console.log(users[userIndex]);
            res.send('User password has been updated.')
        } else {
            res.send('Unauthorized. Login the correct user first.')
        }
    })

// Archive specific product
app.put('/products/archive/:index', (req, res) => {
    console.log(req.params);
    console.log(req.params.index);
    let productIndex = parseInt(req.params.index);
    if(loggedUser.isAdmin === true) {
        products[productIndex].isActive = false;
        console.log(products[productIndex]);
        res.send('Product Archived.')
    } else {
        res.send('Unauthorized. Action Forbidded')
    }
})

// Activate specific product
app.put('/products/activate/:index', (req, res) => {
    console.log(req.params);
    console.log(req.params.index);
    let productIndex = parseInt(req.params.index);
    if(loggedUser.isAdmin === true) {
        products[productIndex].isActive = true;
        console.log(products[productIndex]);
        res.send('Product Activated.')
    } else {
        res.send('Unauthorized. Action Forbidded')
    }
})

// Update specific product
app.put('/products/update/:index', (req, res) => {
    console.log(req.params);
    console.log(req.params.index);
    let productIndex = parseInt(req.params.index);
   
    if (loggedUser.isAdmin === true) {
        if (productIndex >= 0 && productIndex < products.length) {
            let updatedProduct = req.body;
            products[productIndex] = { ...products[productIndex], ...updatedProduct };
            console.log(products[productIndex]);
            res.send('Product updated.');
        } else {
            res.send('Invalid product index.');
        }
    } else {
        res.send('Unauthorized. Action Forbidden.');
    }
});

app.listen(port, () => console.log(`Server is running at port ${port}`));