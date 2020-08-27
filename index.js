const express = require('express');
const body_parser = require('body-parser');
const dotenv = require('dotenv').config();
const ejs = require('ejs');
const mongoose = require('mongoose');
const lodash = require('lodash');

const app = express();
app.set('view engine', 'ejs');
app.use(body_parser.urlencoded({extended: true}));
app.use(body_parser.json());
app.use(express.static(__dirname + '/public'));

let deprecation_warning_items = {
    useNewUrlParser: true,
    useUnifiedTopology: true
}
// Mongodb databases - uncomment appropriate line
// Dev
mongoose.connect(process.env.MONGODB_DEV, deprecation_warning_items);

// Force Mongoose to use MongoDB's findOneAndUpdate() function.
mongoose.set('useFindAndModify', false);

const article_schema = new mongoose.Schema ({
    title: {
        type: String,
        required: true
    },
    title_lower: {
        type: String,
        required: true
    },
    content: {
        type: String
    }
});

const Article = mongoose.model('article', article_schema);

let fields_to_return = {_id: false, title: true, content: true}; 

app.get('/', function(req, res) {
    Article.find(function(err, articles) {
        if (err) {
            console.log(err);
        } else {
            res.render('index', {
                response_title: "Available Records",
                articles: articles
            });
        }
    }).select(fields_to_return);
});

app.route('/articles')
    .get(function(req, res) {
        Article.find(function(err, articles) {
            if (err) {
                console.log(err);
                res.send(err);
            } else {
                res.send(articles + "\n");
            }
        }).select(fields_to_return);
    })
    .post(function(req, res) {
        const new_article = new Article ({
            title: req.body.title,
            title_lower: lodash.lowerCase(req.body.title),
            content: req.body.content
        });
        new_article.save(function(err) {
            if (err) {
                console.log(err);
                res.send(err);
            } else {
                Article.findOne({title_lower: lodash.lowerCase(req.body.title)}, function(err, article_cleaned) {
                    if (err) {
                        console.log(err);
                        res.send(err);
                    } else {
                        res.send("Article saved - " + article_cleaned + "\n");
                    }
                }).select(fields_to_return);
            }
        });    
    })
    .delete(function(req, res) {
        Article.deleteMany(function(err) {
            if (err) {
                console.log(err);
                res.send(err);
            } else {
                res.send("All articles deleted\n");
            }
        });
    });

app.route('/articles/:article_title')
    .get(function(req, res) {
        let article_title_cleaned = lodash.lowerCase(req.params.article_title);
        Article.findOne({title_lower: article_title_cleaned}, function(err, article_cleaned) {
            if (article_cleaned != undefined) {
                res.send(article_cleaned + "\n");
            } else {
                res.send("No such article found.\n");
            }   
        }).select(fields_to_return);
    })
    .put(function(req, res) {
        let article_title_cleaned = lodash.lowerCase(req.params.article_title);
        let updated_record = {
            title: req.body.title,
            title_lower: lodash.lowerCase(req.body.title),
            content: req.body.content
        }
        Article.findOneAndUpdate({title_lower: article_title_cleaned}, updated_record, {new: true}, function(err, article_cleaned) {
            if (article_cleaned === null) {
                res.send("No such article - \"" + req.params.article_title + "\"\n");
            } else {
                res.send("Article Updated - " + article_cleaned + "\n");
            }
        }).select(fields_to_return);
    })
    .patch(function(req, res) {
        let article_title_cleaned = lodash.lowerCase(req.params.article_title);
        let updated_record = {};
        if (req.body.title != undefined) {
            updated_record = {
                title: req.body.title,
                title_lower: lodash.lowerCase(req.body.title)
            }
        } else {
            updated_record = {
                content: req.body.content
            }
        }
        Article.findOneAndUpdate({title_lower: article_title_cleaned}, updated_record, {new: true}, function(err, article_cleaned) {
            if (article_cleaned === null) {
                res.send("No such article - \"" + req.params.article_title + "\"\n");
            } else {
                res.send("Article Updated - " + article_cleaned + "\n");
            }
        }).select(fields_to_return);
    })
    .delete(function(req, res) {
        let article_title_cleaned = lodash.lowerCase(req.params.article_title);
        Article.findOneAndDelete({title_lower: article_title_cleaned}, function(err, article_cleaned) {
            if (article_cleaned === null) {
                res.send("No such article - \"" + req.params.article_title + "\"\n");
            } else {
                res.send("Article Deleted - \"" + req.params.article_title + "\"\n");
            }
        }).select(fields_to_return);
    });

app.listen(process.env.PORT, function() {
    console.log("Server started on port " + process.env.PORT);
});