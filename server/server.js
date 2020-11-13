const express = require("express");
const app = express();
const port = process.env.PORT;
const { exec } = require("child_process");
const session = require('express-session')
const { v4: uuidv4 } = require('uuid');
const fileUpload = require('express-fileupload');
const path = require("path");
var cloudinary = require('cloudinary');

const AWS = require('aws-sdk');
const mongo = require("mongodb");
var MongoClient = require('mongodb').MongoClient;

const bcrypt = require('bcrypt');
const saltRounds = 10;
let db = null;
var cookieParser = require('cookie-parser')
// let auth = require("./auth.json");

let usersCollection = null;
let lessonsCollection = null;
// let uri = "mongodb+srv://nedaChatAdmin:" + auth.DB_PASSWORD + "@nedacluster-7z4i0.mongodb.net/NowPlan?retryWrites=true&w=majority";
// cons
let uri = "mongodb+srv://nedaChatAdmin:" + process.env.DB_PASSWORD + "@nedacluster-7z4i0.mongodb.net/NowPlan?retryWrites=true&w=majority";
const fs = require('fs');
const { ListGroupItem } = require("react-bootstrap");
let PDFImage = require("pdf-image").PDFImage;

// since creating a lesson tree is expensive, memonize it to optimize
let cachedLessonTree = {};
let shouldRecalculateTree = true; // if we moved something or renamed we should recalulate tree

let validSessions = [];

// Initializing S3 Interface
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET,
});

// initlizing mongo db
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
  if (process.env.isHeroku == "true") {
    // this whole proccess is for setting up the git repo in a way we an commit to it
    let gitConfig = ' && git config user.email shahan.neda+glmath@gmail.com && git config --global user.name glMathUpdateBot ';

    ExecuteCommand("git clone https://glMathUpdateBot:" + process.env.GITHUB_PASSWORD + "@github.com/glMath/glmath.github.io.git temp && mv temp/.git ./.git && rm -rf temp " + gitConfig);
  }

  ;
  app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
    useTempFiles: true,
  }));

  app.use(express.json({ limit: '50mb' }));
  app.use(cookieParser());
  app.use(express.urlencoded({ limit: '50mb' }));

  // Add headers
  app.use(function (req, res, next) {

    if (req.headers.origin == undefined) {
      res.setHeader('Access-Control-Allow-Origin', "http://127.0.0.1:7772");
    } else {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, authorization, SessionId");


    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    next();
  });


  //   app.set('trust proxy', 1) // trust first proxy
  //   app.use(session({
  //     secret: 'secret',
  //     resave: true,
  //     // unset: 'destroy',
  //     domain: 'glmath.github.io',
  //     saveUninitialized: false,
  //     cookie:  {
  //         // path: '/',
  //         httpOnly: false,
  //         domain: 'glmath.github.io',
  //         maxAge: 24 * 6 * 60 * 10000,
  //         secure:"auto",
  //     },
  // })) 

  app.listen(port, function () {
    console.log("GlMath Server Started on port " + port);
  });

  function checkAuth(req, res, next) {
    let sessionId = req.headers.sessionid;

    if (validSessions.indexOf(sessionId) != -1) {
      next();
    } else {
      res.send(JSON.stringify({ status: "invalid-login" }))
    }
  }

  app.post('/login', function (req, res) {
    if (req.body.password == process.env.ADMIN_PASSWORD) {
      if (validSessions.length > 100) {
        validSessions.shift();
      }

      let newSessionId = uuidv4();
      validSessions.push(newSessionId);

      res.send(JSON.stringify(
        {
          status: "success",
          sessionId: newSessionId,
        }
      ));

    } else {
      res.send(JSON.stringify({ status: "fail" }));
    }
  });

  app.get('/logout', function (req, res) {

    var index = validSessions.indexOf(req.headers.sessionid);
    validSessions.splice(index, 1);

    res.send(JSON.stringify({ status: "success" }));
  });

  // app.post('/newUser', (req, res) => {
  //   req.body.id = req.body.id.toLowerCase();
  //   const salt = bcrypt.genSaltSync(saltRounds);
  //   const hash = bcrypt.hashSync(req.body.password, salt);
  //   usersCollection.findOne({ _id: req.body.id }, (err, user) => {
  //     if (user != null || user != undefined) {
  //       res.send("duplicate");
  //       return;
  //     }
  //     usersCollection.insertOne({
  //       _id: req.body.id,
  //       id: req.body.id,
  //       password: hash,
  //       lists: {},
  //     });
  //     res.send("new user added");

  //   });
  // });
  // app.post('/loginUser', (req, res) => {
  //   req.body.id = req.body.id.toLowerCase();
  //   res.setHeader('Content-Type', 'application/json');
  //   usersCollection.findOne({ _id: req.body.id }, (err, user) => {
  //     if (user != null) {
  //       res.send(JSON.stringify({ correctPass: bcrypt.compareSync(req.body.password, user.password) }));
  //     } else {
  //       res.send(JSON.stringify({ correctPass: false }));
  //     }

  //   });
  // });

  // app.get('/getUsers', (req, res) => {
  //   usersCollection.find({}).toArray((err, users) => {
  //     let usersToSend = {};
  //     users.map((user, index) => {
  //       delete users[index].password;
  //       usersToSend[user.id] = users[index];
  //     });
  //     res.setHeader('Content-Type', 'application/json');

  //     res.send(JSON.stringify(usersToSend));
  //   });
  // });


  // app.post('/userExists', (req, res) => {
  //   req.body.id = req.body.id.toLowerCase();
  //   res.setHeader('Content-Type', 'application/json');
  //   usersCollection.findOne({ _id: req.body.id }, (err, user) => {
  //     if (user == null || user == undefined || err) {
  //       res.send(JSON.stringify({ exists: false }));
  //       return;
  //     }
  //     res.send(JSON.stringify({ exists: true }));
  //   });

  // });

  // app.post('/deleteUser', (req, res) => {
  //   req.body.id = req.body.id.toLowerCase();
  //   console.log("got remove reqest");
  //   res.setHeader('Content-Type', 'application/json');
  //   usersCollection.findOne({ _id: req.body.id }, (err, user) => {
  //     if (user == null || user == undefined || err) {
  //       res.send(JSON.stringify({}));
  //       return;
  //     }
  //     usersCollection.remove({ _id: req.body.id });
  //     console.log("removed user" + req.body.id);
  //     res.send(JSON.stringify({}));
  //   });
  // });



  app.post('/post/lesson/', checkAuth, (req, res) => {
    let id = req.body.id;
    console.log("******* NEW LESSON UPDATE***********");
    console.log("LESOSN NAME and ID ", req.body.name, "  :  ", req.body.id);
    let hadToUpdateParent = false;


    lessonsCollection.findOne({ _id: id }, (err, lesson) => {
      if (err || lesson == undefined || lesson == null) {
        res.status(404).send({});
        console.log("Trying to post to lesson not even made!");
        return;
      }
      // console.log("LESSON IN DATA BASE", lesson);

      // name changed so we should recaluate
      if (lesson.name != req.body.name) {
        shouldRecalculateTree = true;
      }
      // console.log("lesson parent id vs req parent id", lesson.parentId, req.body.parentId);
      // console.log("databse parent id: ", lesson.parentId, " request parent id", req.body.parentId)
      // check if the parent id changed, if so tell the parent that its no longer a child, and also make sure we dont make ourself the parent
      if (lesson.parentId != req.body.parentId && req.body.parentId != undefined && req.body.parentId != req.body.id) {
        hadToUpdateParent = true;
        shouldRecalculateTree = true;
        // console.log("moving lesson ", id, " to new parent ", req.body.parentId);

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

          res.json({
            status: "success",
          });

        });
      }



      lessonsCollection.updateOne({ _id: id }, { $set: req.body }, { upsert: true });
      if (!hadToUpdateParent) {
        res.json({
          status: "success",
        });
      }
    });
  });


  app.post('/post/delete/', checkAuth, (req, res) => {
    let id = req.body.id;
    console.log("******* DELETING LESSON ***********");
    console.log("LESOSN NAME and ID ", req.body.name, "  :  ", req.body.id);
    shouldRecalculateTree = true;
    if (req.body.id == "root") {
      res.status(403).send({});
      return;
    }

    lessonsCollection.findOne({ _id: id }, (err, lesson) => {
      if (err || lesson == undefined || lesson == null) {
        res.status(404).send({});
        console.log("Trying to delete lesson not even made!");
        return;
      }

      //remove lesson from old parent
      if (lesson.parentId) {
        lessonsCollection.findOne({ _id: lesson.parentId }, (err, oldParentLesson) => {
          if (!oldParentLesson) {
            res.status(500);
            return;
          }

          let children = oldParentLesson.children;
          var index = children.indexOf(req.body.id);
          children.splice(index, 1);
          lessonsCollection.updateOne({ _id: lesson.parentId }, { $set: { children: children } }, { upsert: true });
        });
      }



      let lessonWithNoParent = req.body;
      lessonWithNoParent.parentId = "DELETED";
      lessonsCollection.updateOne({ _id: id }, { $set: lessonWithNoParent }, { upsert: true });

      res.json({
        status: "success",
      });

    });
  });

  app.post("/post/lesson-to-github/", checkAuth, (req, res) => {
    let id = req.body.id;
    let filename = __dirname + "/../client/lessons/" + id + ".json";

    lessonsCollection.findOne({ _id: id }, (err, lesson) => {
      fs.writeFile(filename, JSON.stringify(lesson), function (err) {
        if (err) {
          return console.log(err);
        }

        console.log("The file was saved!");
        commitToGithub(id, filename, () => {
        })

      });

      res.send(JSON.stringify({
        status: "success",
      }));
    });
  });

  app.post("/post/lesson-tree-to-github/", checkAuth, (req, res) => {
    let id = "LessonTree";
    let filename = __dirname + "/../client/lessons/lessontree.json";
    commitToGithub(id, filename, () => {
      res.send(JSON.stringify({
        status: "success",
      }));
    });
  });


  app.post('/post/upload-image', checkAuth, async (req, res) => {
    try {
      if (!req.files) {
        res.send({
          status: "failed",
        });
      } else {
        let image = req.files.image;
        let ext = path.extname(image.name)
        let filename = Date.now() + "--" + image.name;

        if (ext == ".pdf") {
          filename = filename + ".png"; // since we are going to be converting it to a png
          console.log("detecting pdf");

          var pdfImage = new PDFImage(image.tempFilePath, {
            combinedImage: true,
            convertOptions: {
              "-quality": "80", // this is all lossless, however it will increase the compression
              "-density": "250x250",// this is the key for keeping pencil scan writing legible
            }
          });

          pdfImage.convertFile().then(function (imagePaths) {
            console.log("Uploaded pdf! path:" + imagePaths);

            uploadFile(imagePaths, filename, (url) => {
              if (url == null) {
                throw "File upload failed!";
              }

              res.send({
                status: "image-uploaded",
                url: url,
              });

              ExecuteCommand("rm " + image.tempFilePath);
              ExecuteCommand("rm " + imagePaths);
            });
          });
          return;
        }
        // image.mv('../client/images/tempI');

        // cloudinary.v2.uploader.upload(image.tempFilePath,
        //   (error, result) => {
        //     if (error) {
        //       console.log(err);
        //       res.status(500).send(err);
        //       return;
        //     }

        //     res.send({
        //       status: "image-uploaded",
        //       url: result.secure_url,
        //     });

        //     ExecuteCommand("rm " + image.tempFilePath);
        //   });

        uploadFile(image.tempFilePath, filename, (url) => {
          if (url == null) {
            throw "File upload failed!";
          }

          res.send({
            status: "image-uploaded",
            url: url,
          });

          ExecuteCommand("rm " + image.tempFilePath);
        });
      }
    } catch (err) {
      console.log(err);
      res.status(500).send(err);
    }
  });




  const uploadFile = (filepath, keyForStorage, callback) => {
    const fileContent = fs.readFileSync(filepath);

    // setting up s3 upload parameters
    const params = {
      Bucket: "glmath",
      Key: keyForStorage,
      Body: fileContent,
      ACL: 'public-read',
    };

    // Uploading files to the bucket
    s3.upload(params, function (err, data) {
      if (err) {
        throw err
      }
      callback(data.Location);
    });
  };

  function squashLastTwoCommits() {


  }

  function commitToGithub(id, filename, callback) {

    ExecuteCommand("git add " + filename, (out) => {
      ExecuteCommand("git commit -m \"AutoCommit: Changed lesson " + id + "\"", (out) => {
        ExecuteCommand("git pull --no-edit && git push", (out) => {
          console.log("finished normal commit");
          DoGitResetCycle(id, filename);
        });
      });
    });


  }
  // this is for getting the update to be quick, make a temp commit and rebase it
  function DoGitResetCycle(id, filename, callback) {
    console.log("doing git cycle");
    let cacheFilename = __dirname + "/../client/lessons/cacheFile.json";
    fs.writeFile(cacheFilename, Date.now(), function (err) {
      console.log(err);

      ExecuteCommand("git reset HEAD~1" + filename, (out) => {
        ExecuteCommand("git add " + filename + " " + cacheFilename, (out) => {
          ExecuteCommand("git commit -m \"AutoCommit: Changed lesson " + id + "\"", (out) => {
            ExecuteCommand("git push", (out) => {
              console.log("Pushed changes to github");
              callback();
            });
          });
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
      console.log("GOT HERE FOR comnd, ", cmnd);
      if (callback) {
        callback(stdout);
      }
    });
  }

  app.post("/post/create/lesson/", checkAuth, (req, res) => {
    let newLesson = req.body;
    let parentId = req.body.parentId;
    console.log("Updating lesson", newLesson.id, " parent,", parentId);
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
        // console.log(lesson);
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


  app.get('/get/lesson/:id', (req, res) => {
    lessonsCollection.findOne({ _id: req.params.id }, (err, lesson) => {
      if (err || lesson == null || lesson == undefined) {
        res.status(404).send(JSON.stringify({}));
        return;
      }

      res.send(JSON.stringify(lesson));
    });
  });

  app.get('/get/lesson-tree/', (req, res) => {

    if (!shouldRecalculateTree) {
      res.send(JSON.stringify(cachedLessonTree));
      return;
    } else {
      createLessonTree("root", (tree) => {
        res.send(JSON.stringify(tree));
      });
    }
  });

  app.post("/post/lesson-tree/", checkAuth, (req, res) => {
    // let tree = req.body;

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
      lastUpdated: Date.now(),
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
          let compact = { id: lesson.id, name: lesson.name, children: lesson.children, order: lesson.order, defaultClosed: lesson.defaultClosed, lastUpdated: lesson.lastUpdated }; // the lesson.children is just a placeholder used in the next round

          newRoot.children.push(compact); // we add it here to fix it later
          queue.push(compact);
        }

        // this just sort and puts in correct order
        newRoot.children.sort((a, b) => (a.order > b.order) ? 1 : ((b.order > a.order) ? -1 : 0));
      }
    }


    fs.writeFile(__dirname + "/../client/lessons/lessontree.json", JSON.stringify([tree]), function (err) {
      console.log(err);
    });
    // this is to memonize so we dont have to redo this expensive calculation everytime
    cachedLessonTree = [tree];
    shouldRecalculateTree = false;
    callback([tree]);

  }

  app.use('/', express.static("./"))
}
