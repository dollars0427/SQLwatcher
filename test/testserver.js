var express = require('express');
var bodyParser = require('body-parser');
var app = new express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));

app.get('/',function(req, res){
    res.send(req.query);
});

app.listen(3000);
