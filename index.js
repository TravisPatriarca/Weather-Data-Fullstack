/**
 * @summary server start up and handles
 * @author Travis Patriarca <trav.patriarca@gmail.com>
 *
 * Created at     : 01-04-2021 
 * Last modified  : 06-04-2021
 */

"use strict"

const server = require('./js/server');
const router = require('./js//router');
const requestHandlers = require('./js//requestHandlers');

let handle = {};

handle['/'] = requestHandlers.reqStart;
handle['/css/index.css'] = requestHandlers.reqCss;
handle['/js/web.js'] = requestHandlers.reqWebJs;
handle['/favicon.ico'] = requestHandlers.reqFavicon;
handle['/weather-data'] = requestHandlers.reqData;

server.startServer(router.route, handle);