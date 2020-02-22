var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const mongoDB = require('./db/mongoDB');
const logger = require('./logs/logger');

const app = express();

mongoDB.connect().then(()=>{
    // view engine setup
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'pug');

    // uncomment after placing your favicon in /public
    //app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
    app.use(morgan('combined',{stream: logger.stream}));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(cookieParser());
    app.use(express.static(path.join(__dirname, 'public')));

    const index = require('./routes/index');
    const requests = require('./routes/requests');
    const parts = require('./routes/parts');
    const checkouts = require('./routes/checkouts');
    const slack = require('./routes/slack');
    const users = require('./routes/users');

    app.use('/', index);
    app.use('/requests',requests);
    app.use('/parts',parts);
    app.use('/checkouts',checkouts);
    app.use('/slack',slack);
    app.use('/users',users);

    app.use(favicon(path.join(__dirname, './public/favicon', 'favicon.ico')));
    // catch 404 and forward to error handler
    app.use(function(req, res, next) {
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    });

    // error handler
    app.use(function(err, req, res, next) {
        // set locals, only providing error in development
        res.locals.message = err.message;
        res.locals.error = req.app.get('env') === 'development' ? err : {};

        logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

        // render the error page
        res.status(err.status || 500);
        res.render('error');
    });
});
module.exports = app;
