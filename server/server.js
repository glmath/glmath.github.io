const express = require("express");
const app = express();
const port = 7772;
const { exec } = require("child_process");

const mongo = require("mongodb");
var MongoClient = require('mongodb').MongoClient;

const bcrypt = require('bcrypt');
const saltRounds = 10;
let db = null;
var cookieParser = require('cookie-parser')
let auth = require("./auth.json");

let usersCollection = null;
let lessonsCollection = null;
let uri = "mongodb+srv://nedaChatAdmin:" + auth.DB_PASSWORD + "@nedacluster-7z4i0.mongodb.net/NowPlan?retryWrites=true&w=majority";
const fs = require('fs');
const { ListGroupItem } = require("react-bootstrap");

// since creating a lesson tree is expensive, memonize it to optimize
let cachedLessonTree = {};
let shouldRecalculateTree = true; // if we moved something or renamed we should recalulate tree

MongoClient.connect(uri, function (err, dbtemp) {
  if (err) {
    console.log(err);
  }
  var dbo = dbtemp.db("LMath");

  db = dbo;
  dbo.createCollection("users", function (err, res) {
  });
  usersCollection = dbo.collection("users");
  lessonsCollection = dbo.collection("lessons");

  mongoSetUpDone();
});

function mongoSetUpDone() {
  app.use(express.json());       // to support JSON-encoded bodies
  app.use(cookieParser());
  app.use(express.urlencoded()); // to support URL-encoded bodiesk
  // Add headers
  app.use(function (req, res, next) {

    // Website you wish to allow to connect
    if (req.headers.origin == undefined) {
      res.setHeader('Access-Control-Allow-Origin', "http://127.0.0.1:7772");
    } else {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    }

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
  });

  app.listen(port, function () {
    console.log("Neda Plan Server Started on port " + port);
  });

  app.post('/newUser', (req, res) => {
    req.body.id = req.body.id.toLowerCase();
    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(req.body.password, salt);
    usersCollection.findOne({ _id: req.body.id }, (err, user) => {
      if (user != null || user != undefined) {
        res.send("duplicate");
        return;
      }
      usersCollection.insertOne({
        _id: req.body.id,
        id: req.body.id,
        password: hash,
        lists: {},
      });
      res.send("new user added");

    });


  });
  app.post('/loginUser', (req, res) => {
    req.body.id = req.body.id.toLowerCase();
    res.setHeader('Content-Type', 'application/json');
    usersCollection.findOne({ _id: req.body.id }, (err, user) => {
      if (user != null) {
        res.send(JSON.stringify({ correctPass: bcrypt.compareSync(req.body.password, user.password) }));
      } else {
        res.send(JSON.stringify({ correctPass: false }));
      }

    });
  });

  app.get('/getUsers', (req, res) => {
    usersCollection.find({}).toArray((err, users) => {
      let usersToSend = {};
      users.map((user, index) => {
        delete users[index].password;
        usersToSend[user.id] = users[index];
      });
      res.setHeader('Content-Type', 'application/json');

      res.send(JSON.stringify(usersToSend));
    });
  });


  app.post('/userExists', (req, res) => {
    req.body.id = req.body.id.toLowerCase();
    res.setHeader('Content-Type', 'application/json');
    usersCollection.findOne({ _id: req.body.id }, (err, user) => {
      if (user == null || user == undefined || err) {
        res.send(JSON.stringify({ exists: false }));
        return;
      }
      res.send(JSON.stringify({ exists: true }));
    });

  });

  app.post('/deleteUser', (req, res) => {
    req.body.id = req.body.id.toLowerCase();
    console.log("got remove reqest");
    res.setHeader('Content-Type', 'application/json');
    usersCollection.findOne({ _id: req.body.id }, (err, user) => {
      if (user == null || user == undefined || err) {
        res.send(JSON.stringify({}));
        return;
      }
      usersCollection.remove({ _id: req.body.id });
      console.log("removed user" + req.body.id);
      res.send(JSON.stringify({}));
    });
  });



  app.post('/post/lesson/', (req, res) => {
    let id = req.body.id;

    if (lessonsCollection.findOne({ _id: id }, (err, lesson) => {
      if (err || lesson == undefined || lesson == null) {
        // res.status(404).send({});
        console.log("Trying to post to lesson not even made!");
        return;
      }

      // check if the parent id changed, if so tell the parent that its no longer a child
      if (lesson.parentId != req.body.parentId && req.body.parentId != undefined) {
        shouldRecalculateTree = true;

        // remove from old parent
        lessonsCollection.findOne({ _id: lesson.parentId }, (err, oldParentLesson) => {
          let children = oldParentLesson.children;
          var index = children.indexOf(req.body.id);
          children.splice(index, 1);

          lessonsCollection.updateOne({ _id: lesson.parentId }, { $set: { children: children } }, { upsert: true });
        });

        // add to new parent
        lessonsCollection.findOne({ _id: req.body.parentId }, (err, newParentLesson) => {
          let children = newParentLesson.children;
          children.push(req.body.id);

          lessonsCollection.updateOne({ _id: newParentLesson.id }, { $set: { children: children } }, { upsert: true });
        });
      }
    }));

    lessonsCollection.updateOne({ _id: id }, { $set: req.body }, { upsert: true });

    res.send(JSON.stringify({
      status: "success",
    }));

  });

  app.post("/post/lesson-to-github/", (req, res) => {
    let id = req.body.id;
    let filename = __dirname + "/../client/lessons/" + id + ".json";

    fs.writeFile(filename, JSON.stringify(req.body), function (err) {
      if (err) {
        return console.log(err);
      }
      console.log("The file was saved!");
      commitToGithub(id, filename, () => {
        // let filename = __dirname + "/../client/lessons/" + "cachefile" + ".json";
        // fs.writeFile(filename, Date.now(), function (err) {
        //   commitToGithub(filename, () => {});
        // });
      })
    });

    res.send(JSON.stringify({
      status: "success",
    }));
  });

  function commitToGithub(id, filename, callback) {
    ExecuteCommand("git add " + filename, (out) => {
      ExecuteCommand("git commit -m \"AutoCommit: Changed lesson " + id + "\"", (out) => {
        ExecuteCommand("git push", (out) => {
          console.log("Pushed changes to github");
        });
      });
    });

  }
  function ExecuteCommand(cmnd, callback) {
    exec(cmnd, (error, stdout, stderr) => {
      if (error) {
        console.log(`error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
      callback(stdout);
    });
  }

  app.post("/post/create/lesson/", (req, res) => {
    let newLesson = req.body;
    let parentId = req.body.parentId;
    if (!newLesson || !parentId || newLesson.id == "" || newLesson.id == undefined || newLesson.id == null) {
      console.log("ERROR NO LESSON OR PARENT ID");
    }
    if (!newLesson || !parentId) {
      res.status(500).send({});
      return;
    }
    // TODO: Check if id already exists in database and if so return error here

    newLesson["_id"] = newLesson.id;
    lessonsCollection.insertOne(newLesson);



    // we need to tell the parents of this lesson that we added a new child
    console.log(parentId);
    lessonsCollection.findOne({ _id: parentId }, (err, lesson) => {
      if (err || !lesson) {
        console.log(lesson);
        try {
          res.send("LESSON PARENT NOT FOUND");
        } catch {

        }
        return;
      }

      let children = lesson.children;
      children.push(newLesson.id);

      lessonsCollection.updateOne({ _id: parentId }, { $set: { children: children } }, { upsert: true });
      res.send({ status: "success" });

    });




    shouldRecalculateTree = true;

  });


  app.get('/get/lesson/:id/', (req, res) => {
    lessonsCollection.findOne({ _id: req.params.id }, (err, lesson) => {
      if (err || lesson == null || lesson == undefined) {
        res.status(404).send(JSON.stringify({}));
        return;
      }

      res.send(JSON.stringify(lesson));
    });
  });

  app.get('/get/lesson-tree/:id/', (req, res) => {
    if (!shouldRecalculateTree) {
      res.send(JSON.stringify(cachedLessonTree));
      return;
    } else {
      createLessonTree("root", (tree) => {
        res.send(JSON.stringify(tree));
      });
    }

  });

  async function findLessonFromDatabase(id) {
    const lesson = await lessonsCollection.findOne({ _id: id })
    return lesson
  }

  async function createLessonTree(id, callback) {
    let root = await findLessonFromDatabase(id);
    // console.log(root);

    let tree = {
      id: root.id,
      name: "Math",
      children: root.children,
    };

    let queue = [];
    queue.push(tree);

    // Do breadth first search to create a tree with all the children in a compact form of name, id, and children. 
    // it is slightly confusing since the children end up being used as a placeholder for the next layers id's
    while (queue.length > 0) {
      numberInLayer = queue.length;
      for (let k = 0; k < numberInLayer; k++) {
        let newRoot = queue.shift();

        let childrenIds = newRoot.children;
        newRoot.children = [];

        for (let i = 0; i < childrenIds.length; i++) {
          let lesId = childrenIds[i];

          let lesson = await findLessonFromDatabase(lesId);
          let compact = { id: lesson.id, name: lesson.name, children: lesson.children }; // the lesson.children is just a placeholder used in the next round

          newRoot.children.push(compact); // we add it here to fix it later
          queue.push(compact);

        }
      }
    }


    // this is to memonize so we dont have to redo this expensive calculation everytime
    cachedLessonTree = tree;
    shouldRecalculateTree = false;
    callback(tree);
  }

  app.use('/', express.static("./"))
}