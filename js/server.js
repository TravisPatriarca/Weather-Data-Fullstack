/**
 * Create server and path request to reoute
 * 
 * @summary server creation
 * @author Travis Patriarca <trav.patriarca@gmail.com>
 *
 * Created at     : 01-04-2021 
 * Last modified  : 06-04-2021
 */

'use strict';

const http = require('http'); 
const url = require('url');

//create server
function startServer(route, handle) {
    http.createServer( function (request, response) {
        let pathname = url.parse(request.url).pathname; //get url pathname
        route(pathname, handle, request, response); //router request and pathname
    }).listen(8081,'localhost'); 
    
    console.log('Process ID:', process.pid);
}

exports.startServer = startServer;
