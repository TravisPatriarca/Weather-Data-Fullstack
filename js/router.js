/**
 * @summary request handler routing
 * @author Travis Patriarca <trav.patriarca@gmail.com>
 *
 * Created at     : 01-04-2021 
 * Last modified  : 06-04-2021
 */

'use strict';

function route(pathname, handle, request, response) {
    console.log('Routing: ' + pathname);

    if (typeof handle[pathname] === 'function') {
        handle[pathname](request, response); //execute request handler functions
    } else {
        console.log('no handler found for: ' + pathname);
        response.writeHead(404, {'Content-Type': 'text/plain'});
        response.write('resource not found!');
        response.end();
    }
}

exports.route = route;