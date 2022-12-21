# Building a To-Do app with Cloudflare Pages, Workers, and KV

## Introduction

Modern life is *busy*. From the fun things we enjoy like meeting our friends for dinner and going to the cinema, to the more mundane things like paying our bills on time or getting groceries - there are a **lot** of things we have to remember to do each day.

Now, I don't know about you, but I struggle to keep all of the things I have to do in a given day in my head - but fortunately, humanity has a cheat code; The To-Do list.

Yes, that ancient practice of writing a list of things we need to do is as helpful to us now as it has been for our ancestors over the centuries.

And that's what we're going to build here.

In this tutorial, we will build a To-Do list application which can create, update, and delete things to do from a (dare I say?) natty-looking list.

This application will be made up of three components:

1. A static application hosted on Cloudflare pages
2. An API, which will be powered by Cloudflare Workers
3. Cloudflare KV - a key-value data store which will persist the items we add to our list.

## Pre-requisites

To follow this tutorial, you will need the following:

1. A [Cloudflare account](https://dash.cloudflare.com/signup)
2. Cloudflare's [Wrangler CLI tool](https://github.com/cloudflare/wrangler)
3. Your favourite IDE
4. The Git command line utility.

### Getting the materials

To get started with this tutorial, first clone this repo. In your terminal, enter the following command:

`git clone git@github.com:seanmtracey/cloudfare-todo.git`

This will make a copy of this repository on your local system that we can work on.

Once the repo has been cloned, `cd` into the newly created project directory. This is where we'll be executing commands to deploy our application from the duration of this tutorial.

### Installing the Wrangler CLI tool

We'll be making requests to the Cloudflare platform using the Wrangler tool.

Using the [npm CLI tool](https://www.npmjs.com/), we can install Wrangler with the following command:

`npm i -g wrangler`

With the `-g` flag, we're going to install the Wrangler globally so we can use it for any of our Cloudflare Pages/Workers etc. projects.

## Creating The Project

The very first thing we're going to do to get this our to-do list  rolling is create a **project** for Cloudflare Pages.

Cloudflare Pages is designed for storing static assets that can be viewed on the web, but a **project** can also have [Cloudflare Workers](https://workers.cloudflare.com/) integrated into our application, enabling us to have dynamic routes which we can control with JavaScript.

This makes it a great place to host any HTML/CSS/JavaScript/Images we want to use in our application, as well as define workers and routes which can be utilised as an API for more dynamic interactions.

To create your project, enter the following command in your terminal

`wrangler pages project create todo-tutorial`

In the above line of code, I've called my project `todo-tutorial`, but you can use something else if you prefer. Just make sure to take note of what you enter here, as we'll be using it later on when we want to deploy our static assets and Cloudflare Workers.

![A screengrab showing the output of Wrangler successfully creating a project](/doc_assets/image_1.png)

You'll be asked to enter the production branch name. Cloudflare Pages has production and development environments for building applications on. Press your "return" key to select the `main` branch as your production branch, as this is the only branch we'll be using to deploy.

After the project has been successfully created, a unique URL will be generated where we'll be able to access our application once we've deployed it. There's nothing deployed yet, so there'll be nothing to see there, but take note of this for later.

## Setting up our database

In order to have a useful to-do list, we need some way of persisting data across sessions. A to-do list that erases itself once we browse away from it isn't all that helpful!

For this tutorial, we're going to use [Cloudflare KV](https://developers.cloudflare.com/workers/learning/how-kv-works/), a key-value data store.

But what is a key-value data store? Well, databases come in many shapes and sizes. Some are structured like tables, others like documents. A key-value data store is a type of database which allows you to store a **value** against a given **key**. Each **key** in the datastore is unique, and the **value** can be updated and modified as we like. 

Some examples of key-value datastores are Redis, DynamoDB or Azure Cosmos, but we're going to use Cloudflare KV.

Cloudflare KV is globally accessible and utilises Cloudflare's expansive global network to deliver data with incredibly low latency, so it's perfect for storing and retrieving a list of things we want to do for our to-do list.

To create a KV data store that we can interact with for our application, we need to create a KV workspace. You can think of a workspace in the same way you might a partition on your local hard-drive. It creates a unique space in your Cloudflare account for key-value pairs that we can access and manipulate with our applications.

Each KV namespace is isolated from other KV namespaces you may have in your Cloudflare account, so it's a great way to separate out data for different use cases, but still have a simple, common interface that our applications can store and access values.

To create your KV namespace, enter the following command in your terminal.

`wrangler kv:namespace create todo_tutorial_namespace`;

Again, you can use any name you like, but take note of the underscores here, KV namespaces can only have alphanumeric and _ characters, and can't begin with a number.

![A screengrab showing the output of Wrangler successfully creating a KV namespace](/doc_assets/image_2.png)

Once the command has completed, you should see an output similar to the above. We're not using a `wrangler.toml` file in this project, so Wrangler has prepended our namespace with `worker-`. Take note of the entire namespace name.

### Binding our KV namespace to our Project.

Now that we've created a **project** and a **KV namespace**, we need to bind that namespace to our project so we can securely interact with our key-value store.

For this next part, we're going to use the [Cloudflare Dashboard](https://dash.cloudflare.com).

Open up the Cloudflare Dashboard (https://dash.cloudflare.com) and click the "Pages" link in the sidebar (highlighted below in the green box).

![A screengrab showing the Cloudflare Dashboard, and where to find the Pages link](/doc_assets/image_3.png)

This will load the *Pages* section of the Cloudflare dashboard, and we should be able to see the project we created a few steps back for our to-do applications.

Click the name of your project (highlighted below in purple), this will let view and edit all of the details our project has so far.

![A screengrab showing the Cloudflare Dashboard, and where to find the Pages link](/doc_assets/image_4.png)

Once the page has loaded, click "Settings" (highlighted below in blue) and click "Functions" (highlighted in orange) when the view has loaded. This will take us to our project settings where we'll be able to bind our KV namespace to our project.

![A screengrab showing the Cloudflare Dashboard, and where to find the functions settings for our project](/doc_assets/image_5.png)

Scroll down the settings section until you find the heading "KV namespace bindings" and then click "Add binding" (highlighted below in red)

![A screengrab showing KV namespace bindings section of our project's function settings](/doc_assets/image_6.png)

The view will change to show you a section where you'll be able to create a **Variable name** and select a **KV namespace** that you'll want to bind to that variable name. Enter `TODO` (all uppercase, no space) as the variable name and select the KV namespace that you created with the command you ran a few steps back. Then click "Save".

![A screengrab showing how to create a KV namespace binding](/doc_assets/image_7.png)

This will create a global variable in any Cloudflare Worker that we deploy as part of our project that we'll be able to use to interact with our KV datastore. We'll be using Cloudflare workers later on to define endpoints that will make up the API our static application will interact with to create and persist our to-do list.

### Trying It Out

And that's it! We now have a Cloudflare KV data store that our project can read and write data to. So let's try it out!

On the left-hand side of the Cloudflare Dashboard, click the dropdown icon next to "Workers" (highlighted below in green) and then click "KV" in the dropdown that appears (highlighted in blue). This will take us the KV section of the Cloudflare Dash where we'll be able to explore our KV datastores.

![A screengrab showing where to access the Cloudflare KV section of the Cloudflare dash](/doc_assets/image_8.png)

The next view you'll see will be the Workers KV section. Here, you'll be able to view and interact with any KV data stores you've created. Click the "View" link (highlighted below in purple) for the KV namespace you've just created.

![A screengrab showing where the "View" button is for the KV namespace we've created and bound to our project](/doc_assets/image_9.png)

This will load up all of the entries that our data store has. Right now, it's empty, but you can add a key and value to make sure that everything is working as expected. This is a super-handy view to have when looking to find some data in our namespace quickly, or just when we're exploring the kind of data that's stored by our application.

Enter the following values for the **key** and **value** in the table, then click "Add entry"

Key:
`unique_id`

Value:
`{"value":"Create first item!","status":"unchecked"}`

![A screengrab showing where the existing entries for our KV namespace](/doc_assets/image_10.png)

## Deploying Our Static Assets

A big chunk of our to-do application is the static web page that's going to display our list, as well as let us create, update and delete items from said list.

Now that we have our Pages project and KV datastore, we can take the first steps to getting our application on the web.

Head back to your terminal and change directory to the `project` folder with the following command

`cd ./project`

This folder contains the boilerplate for our to-do application. It has the HTML, CSS, JavaScript, and image files in respective directories that make up our application.

Right now, the page doesn't do very much (except look pretty), but when we're done with it, this will be a fully-fledged application that you'll be proud to add everyday tasks to.

For now, we're just going to upload the assets as they are so we can get a live URL where we can see our changes on the web.

There's also a `functions` directory which will defined the endpoints for our Workers-powered API that will interact with our KV namespace. Right now, they're just empty files, but they'll be uploaded all the same. We'll make this perform ✨magic✨ later on in this tutorial.

To deploy our static assets to our Pages Project, enter the following command in your terminal

`wrangler pages publish ./`

The Wrangler tool will ask you whether or not you want to create a new project, or add to an existing one. Select "Use an existing project" then select your project from the list that will appear.

![An image showing the Wrangler successfully deploying our project to Cloudflare Pages](/doc_assets/image_12.png)

If all goes well, all of the assets in the `project` directory will be uploaded and deployed to Cloudflare Pages. If you like, you can copy the URL that Wrangler will have output at the end to see the page. 

Note that the first section of the domain that the Wrangler has created for us will link to the version of our project we just deployed, not the base URL of the project. If you want to see the project at it's base URL(and thus, the latest version of the project that has been deployed) remove everything before the first period (`.`).

![An image showing what the static assets for our to-do list will look like](/doc_assets/image_11.png)

And that's it! We've deployed the static assets for our to-do list to Cloudflare Pages. It doesn't do much right now, but it sure does look good. So, let's get to work on making this static page very much dynamic 🚀

## Building out our API with Cloudflare Workers

When you were deploying your static assets to Cloudflare Pages, you may have noticed that the Wrangler also said something about "Compiling workers". Well, in our `project` directory, we have a `functions` directory too - and in there, we have some more folders, each with filenames like `[item].js` or `list.js`.

Cloudflare Pages has a really cool feature, it's built to integrate with Workers, and if we have `functions` folder in the root directory of our  project, Wrangler will create a Worker for each `.js` file it finds in that directories.

But what is a Worker? A Worker is a piece of JavaScript code that can be deployed to handle HTTP requests when triggered on a given endpoint. It's a whole [serverless platform](https://en.wikipedia.org/wiki/Serverless_computing) that we can use to dynamically handle and respond to HTTP requests, all without having to worry about deploying and maintaining a server!

For every `.js` the Wrangler finds in our function directory, it will create a Worker which will run the code that the `.js` file has whenever it's triggered by a HTTP request. The HTTP routes for these workers are determined by the directory structure of our `functions` directory.

So, if we have a `hello.js` file in the root of our `functions` folder, it can be triggered by hitting `https://<OUR_PAGES_URL>/hello`. If we have a `world.js` file in a subdirectory called `hello`, it can be triggered on `https://<OUR_PAGES_URL>/hello/world`. This opens up a whole world of possibilities when it comes to building fast, scalable web applications that can handle all manners of internet traffic.

And the best part of this is, Workers integrate with KV! So, we can create a Worker that can handle HTTP requests and interact with our KV datastore on our behalf, and return it to the requesting client.

And that's exactly what we're going to do now!

### Listing Items in the KV Datastore

The very first thing we're going to do with our Workers is create a `/list` endpoint that will list all of the keys currently stored in KV.

Open up the `functions/api` directory in your favourite IDE, and open the `list.js` file for editing. 

Right now, it's very empty and you'll only see the following:

```javascript
export async function onRequest(context) {

    // List the items in the KV data store

}
```

This function uses the module syntax to expose a function `onRequest` which Cloudflare will execute when a request hits the `/list` endpoint. Cloudflare will pass through an object to the `context` parameter, which we can use to access certain properties and methods associated with the request. With the code the way it is, all that we'll get back now is a `500` error, as the function doesn't return a valid response. Let's change that.

After the line `// List the items in the KV data store` add the following code:

```javascript
const items = await context.env.TODO.list();

const body = JSON.stringify(items.keys);

return new Response(body, {
    headers: { 
        'Content-Type': 'application/json'
    },
});
```

On the first line, we're creating a variable `items` which will await the execution of the `context.env.TODO.list()` function. If you cast your mind back to when we created a binding for our KV namespace, we have the binding the variable name `TODO`. It's here through `context.env` that we can interact with the KV binding and call methods to interact with our datastore. In this case, we're asking KV to list all of the keys it currently has stored.

Next, we create a variable `body` which will be a stringified version of the JSON object that `context.env.TODO.list()` will return containing all of the keys in our data store. We're going to send this object back to the requesting client as a response as a string, so we need to stringify the content *before* we return it.

Finally, we return a new `Response` object (a global constructor available to our Worker) and pass it our `body` variable along with any headers we want to send with the response.

Save your file and publish your application again with the same command we used before. 

**Make sure you run this command in the `project` folder, not the functions folder.**

`wrangler pages publish ./`

After the project has deployed, you can trigger the function and see the result by going to `https://<OUR_PAGES_URL>/api/list` in your browser, and you should see the key for the entry we added earlier to our KV store earlier:

```json
[
    {
        "name":"unique_id"
    }
]
```

### Getting an item from KV 

Now that we have a way to list the keys in KV, we need an endpoint we can hit to get the value for that key.

Once again, in your favourite IDE, open up the file `functions/api/get/[item].js`.

As before, you'll see that it's very empty at the moment, but here we're going to write the code that will get a the value for a *specific* key in KV.

#### Parameterised Routes

But before we do that, you may have noticed that the filename for our Worker is a little odd in this instance, it's wrapped in `[]`.

This tells the Wrangler that the Worker generated for this file will handle a dynamic route - that is, a route which will allow us to match sections of a URL with parameterized segments.

For example, we could trigger this Worker with both `/api/get/foo` and `/api/get/bar`, or any other value in that section in the URL. The value of this segment will then be available for us to respond to in the Worker when it's triggered, so we can change our response depending on the route that the Worker is being triggered on. 

In our case, we're going to have the last section of our URL be the key that we want to access from KV `/api/get/<KV_KEY>`.

#### Coding our /api/get Worker

Head back to your IDE, and enter the following code after the line `// Get item from KV data store`:

```javascript
const data = await context.env.TODO.get(context.params.item);
return new Response(JSON.stringify(data), {
    headers: { 
        'Content-Type': 'application/json'
    },
});
```

In the code above, we're once again using the `TODO` object in the `context.env` variable to access our bound KV namespace, except this time we're calling the `get` method.

We use `context.params.item` to access the value of the `<KV_KEY>` section of the requesting URL, which will be the key that we want to retrieve from KV.

Then, we once again return a `Response` object, passing in a stringified version of the JSON object we'll have retrieved from KV, and again pass through the headers that we want our response to have.

Save the file and deploy the project once again using `wrangler pages publish ./`.

This time, after your project has finished deploying, visit `https://<OUR_PAGES_URL>/api/get/unique_id`, with `unique_id` being the key of the entry that we added to our KV namespace a few steps back in your browser.

You should see something like the following returned as a response:

```json
"{\"value\":\"Create first item!\",\"status\":\"unchecked\"}"
```

That's the value for the key we just passed to our Worker!

Now we have a way to both list keys in KV, and then individually retrieve them from our data store.

### Updating an item in KV

Next up, we want to be able to update items in our KV namespace so we can check them off, or change the wording of any items we've created.

This function is going to be a little more complex than the two Workers that we've written already, but don't worry, it's still very simple.

Open up `/functions/update/[item].js` in your favourite IDE for editing.

Just as in our `/api/get` Worker, we expect the requesting URL to pass through the key we want to update in our KV namespace, but this time we're expecting a body to be passed in the request with a JSON object detailing the changes to the key's value that we want to make.

Copy and paste the following code after the `// Update an item in the KV data store` line in our `/functions/update/[item].js` file:

```javascript
const itemToUpdate = context.params.item;

const data = await context.request.json();

if(!data){

    const responseMsg = {
        status : "err",
        msg : "No data was passed for updating"
    };

    return Response(JSON.stringify(responseMsg), {}, 422);

}

try {
    
    await context.env.TODO.put(itemToUpdate, JSON.stringify(data));
    
} catch(err) {
    
    const responseMsg = {
        status : "err", 
        msg : `Could not update item "${itemToUpdate}"`
    };

    return new Response(JSON.stringify(responseMsg), {
        headers: { 
            'Content-Type': 'application/json'
        },
    }, 500);

}

return new Response(JSON.stringify({status : "ok"}), {
    headers: { 
        'Content-Type': 'application/json'
    },
});
```

First, we get the key that we want to update in our KV namespace from our requesting URL with `context.params.item` and assign it to the variable `itemToUpdate`.

Next, we create a `data` variable which will contain the contents of the request's body using `context.request.json()`. Calling the `.json()` method on the `context.request` object will automatically parse a stringified JSON request body as JSON that we can interact with in our code.

After that, we check whether or not there's any data in the request body. If not, we respond to the client with a message telling them they've not passed any information to be updated for the given key.

If there is data in the request body, we then try to update the key's value in KV with `context.env.TODO.put();`. The `put` method expects the first argument to be the key that we want to update and the second argument to be the value that we want to set for that key. In this case, we're re-stringifying the JSON object that was passed to our function and storing it as a string in our namespace against the passed key.

If something goes wrong with the `put` operation, the `catch` statement will create an error response message with a `500` HTTP status code and return that the requesting client.

Otherwise, we simply repond with a JSON object telling our client that the item was successfully updated with `{status : "ok"}`.

If you want to test your Worker, you can run the following cURL command, and then get the same key again in your browser.

```sh
curl --location --request POST 'https://<OUR_PAGES_URL>/api/update/unique_id' --header 'Content-Type: application/json' --data-raw '{"value":"Updated via curl!","status":"checked"}'
```

Publish your project again with `wrangler pages publish ./`

### Deleting an item in KV

We're 3/4s of the way there with our API! 🥳

The last thing we need to do is create a Worker which can delete a key from KV. We wouldn't want our to-do list getting clogged up with ancient items, now, would we?

Open up `/functions/delete/[item].js` in your IDE and copy and paste the following code after the line `// Delete item from KV data store`

```javascript
if(context.request.method !== "DELETE"){

    const responseMsg = {
        status : "err",
        msg : `Improper request method "${context.request.method}" used. Request method must be "DELETE"`
    };

    return new Response(JSON.stringify(responseMsg), {
        headers: { 
            'Content-Type': 'application/json'
        },
    });

} else {
    
    await context.env.TODO.delete(context.params.item);
    
    return new Response(JSON.stringify({status : "ok"}), {
        headers: { 
            'Content-Type': 'application/json'
        },
    });

}
```

In this piece of code, the very first thing we're checking is the HTTP method used to make the request. We're deleting something from our KV namespace, so we only want to respond to `DELETE` requests. If the request is made using any HTTP method other than `DELETE`, we respond to the client explaining that they have to make the request using the `DELETE` method.

If the `DELETE` method has been used, then we use `context.env.TODO.delete(context.params.item);` passing in the key in our requesting URL that we want to delete from our KV namespace as the argument to the `delete` method.

Finally, we respond with another stringified `{status : "ok"}` JSON object.

And that's it! All of our endpoints are defined! 🎉

Save your file, and then publish your project one last time with `wrangler pages publish ./`.

## Accessing our API with our static site

Now that we have our Workers-powered API all set up and deployed, we need to code our static assets to make HTTP requests to the endpoints we've defined so we can add, update, remove, and list the items in our application.

### Showing all of the to-do items in KV

#### Listing all of the items in KV
First up, we'll write the code that will list all of the items in our KV store and then render them in our application.

Open up `project/scripts/main.js` and find the comment block that starts with `// CODE BLOCK 1` and copy and paste the following code just after it:

```javascript

fetch('/api/list')
    .then(res => {

        if(res.ok){
            return res.json();
        } else {
            throw res;
        }
    
    })
    .then(results => {

        // CODE BLOCK 1-1

    })
    .then(data => {

        // CODE BLOCK 1-2

    })
    .catch(err => {
        console.log("Initial load err:", err);
    })
;
```

This will make a fetch request to the `/api/list` route we've created that the Worker created with `/functions/api/list.js` will handle.

Workers deployed as part of a pages project are hosted relative to the static elements that make up our application, so we don't need to include and origin in the request URL we pass to the fetch function.

Next, we check that the response is valid, and then we parse it as JSON to be handled by the next `then()` block of code.

If this request is successful, an array of keys in our KV namespace will be returned as a JSON array by our Worker.

#### Getting the values of keys in KV

After the line `// CODE BLOCK 1-1` copy and paste the following code:

```javascript

const data = results.map(key => {

    return fetch(`/api/get/${key.name}`)
        .then(res => {
            if(res.ok){
                return res.json();
            } else {
                throw res;
            }
        })
        .then(data => {

            data = JSON.parse(data);

            if(data === null){
                return null;
            }

            return {
                id : key.name,
                value : data.value,
                status : data.status
            };
        })
        .catch(err => {
            console.log(err);
        })
    ;

});

return Promise.all(data);

```

This block of code will iterate over all of the keys that are returned by the `/api/list` request, and for each one will make a separate request to `/api/get/<KEY_ID>` to get the value of each respective key.

These requests will hit the Worker created with the `/functions/get/[item].js` file, which will return the value for the key that's passed in place of `<KEY_ID>` in the `/api/get/<KEY_ID>` URL.

You may notice that we check if the data returned by the `/api/get/<KEY_ID>` request is `null`. We do this because KV is **eventually consistent**, which, in short, means that the data we're returned may not be the *latest* version of that data. In the case of `null` being returned, a key was valid when it was included in the `/api/list` request, but has subsequently been deleted before we requested that keys value. You can find out more about KV and eventual consistency [here](https://developers.cloudflare.com/workers/learning/how-kv-works).

If the data return from our request is not `null`, we return an object with the key, and the `value` and `status` properties stored in the JSON object against our given key. 

Finally, all of the results of the requests made to `/api/get/<KEY_ID>` are returned with `Promise.all(data)`, which will pass all of the responses to the next `.then()` in the promise chain as an array.

#### Rendering existing items in our application

After all of our requsts have completed, it's time to render our list!

Copy and paste the following code after the line `// CODE BLOCK 1-2`:

```javascript

data.filter(item => {
    return item !== null;
}).forEach(item => {
    list.appendChild(createListItem(item.id, item.value, item.status));
});

list.querySelector('li:last-of-type').scrollIntoView();

```

This code will filter out all of the `null` responses we may have receieved from our `/api/get/<KEY_ID>` requests, and then uses the existing functions in our application to render them to our list.

Save your `main.js` file and then publish the application again.

Once the project has deployed, load up the URL and you should see the item we created earlier in this tutorial in your list!

![An image showing the static assets dynamically updating per the items in our KV namespace](/doc_assets/image_13.png)

### Updating our to-do items

Now that we can get all of the items in our KV namespace, let's add some code to update them in KV when we change them in our app.

The static application already has event listeners that will check for when the text of an item is changed, or if the item has been checked/unchecked in the list, so all we need to do is add the code that will send the lastest state of the list to our API for storage.

Find the line in `main.js` that starts with `// CODE BLOCK 2` and copy and paste the following code after that line:

```javascript
return fetch(`/api/update/${node.dataset.id}`, {
        method : "POST",
        body : JSON.stringify(data),
        headers : {
            "Content-Type" : "application/json"
        }
    })
    .then(res => {
        if(res.ok){
            return res.json();
        } else {
            throw res;
        }
    })
    .then(function(){
        evaluateList();
    })
    .catch(err => {
        console.log('PUT err:', err);
    })
;
```

This code again uses the fetch function to make a request to our API, but this time the method is `POST`, and the body is a stringified JSON object containing the text of the updated list item, and the status (whether or not it's been checked).

The key for the item we want to update in KV is stored on the node for the list item as a data attribute (`data-id="<KEY_ID>"`), so we access that and use it to make up part of the request that goes the the Worker created by our `/functions/api/update/[item].js` file.

Once the request has received a response, we check again that it's a valid response, and then call the pre-existing `evaluateList()` method which will update our UI to show how many items have been added to, and crossed off from our list.

Save your file again, and then publish the project with `wrangler pages publish ./`. If you load up the application with the new URL, you'll be able to add and update items in the to-do list, and they'll persist across refreshes!✨

### Deleting our to-do items

We're nearly there, reader. The most satisfying part of any todo list is getting rid of the items on it once we've completed them. So, let's add the code that will let us feel that sweet, *sweet* sense of relief that can only be provided by deleting an item from our to-do list.

Find the line of code that starts with `// CODE BLOCK 3` in our `main.js` file and copy and paste the following code after it.

```javascript
fetch(`/api/delete/${parentElement.dataset.id}`, {
        method : "DELETE"
    })
    .then(res => {
        if(res.ok){
            return res.json();
        } else {
            throw res;
        }
    })
    .then(() => {
        
        parentElement.parentNode.removeChild(parentElement);
        evaluateList();

    })
    .catch(err => {
        console.log('Delete err:', err);
    })
;
```

Much like the code we used to update our list items, this code accesses a data attribute to get the key that we want to delete from our list, and by extension, our KV namespace.

Our `/functions/api/delete/[item].js` file expects a HTTP request with the `DELETE` method, so we set that in the options for our fetch request.

Once the request has been responded to by our worker, we check the response is valid, and if it is, we update our view to remove that item from our list and statistics.

And we're done! Publish your application one last time and you'll have a fully functional to-do list that you can add, update and delete items from. Happy crossing-off!

## That's all folks!

You can find out more about Cloudflare Pages, Workers, and KV at the following links:

- [Cloudflare Pages](https://pages.cloudflare.com/)
- [Cloudflare Workers](https://workers.cloudflare.com/)
- [Cloudflare KV](https://www.cloudflare.com/en-gb/products/workers-kv/)