/**
 * @summary request handlers for server.js
 * @author Travis Patriarca <trav.patriarca@gmail.com>
 *
 * Created at     : 01-04-2021 
 * Last modified  : 06-04-2021
 */

'use strict';

const fs = require('fs');
const qs = require('querystring');
const xml2js = require('xml2js');
const req = require('request');

//request index.html
function reqStart(request, response) {
    console.log('request handler "start" was called.');
    let html = fs.readFileSync(__dirname + '/../html/index.html');
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.write(html);
    response.end();
}

//request index.css
function reqCss(request, response) {
    console.log('request handler "css" was called.');
    let css = fs.readFileSync(__dirname + '/../css/index.css');
    response.writeHead(200, {'Content-Type': 'text/css'});
    response.write(css);
    response.end();
}

//request web.js
function reqWebJs(request, response) {
    console.log('request handler "web js" was called.');
    let js = fs.readFileSync(__dirname + '/web.js');
    response.writeHead(200, {'Content-Type': 'text/javascript'});
    response.write(js);
    response.end();
}

//request favicon
function reqFavicon(request, response) {
    console.log('Request handler "favicon" was called.');
    response.setHeader('Content-Type', 'image/x-icon');
    const path_ = __dirname + "/../img/favicon.ico";
    fs.createReadStream(path_).pipe(response); //send image
}

//request weather data
function reqData(request, response) {
    console.log('request handler "data" was called.');
    request.setEncoding('utf8');

    let postData = '';
    request.addListener('data', function(dataChunk) {
        postData += dataChunk;
    });

    request.addListener('end', function() {
        const data = qs.parse(postData); //get associative array from postData
        const year = parseInt(data['year']);
        const startMonth = parseInt(data['startMonth']);
        const endMonth = parseInt(data['endMonth']);
        const fileTypes = ['.xml', '.json']; //supported file types
        let fileTypeIndex = 0;

        //get first file type
        req.get('http://it.murdoch.edu.au/~S900432D/ict375/data/' + year + fileTypes[fileTypeIndex], callback);

        function callback(err, res, body) {
            if (err) {
                console.error('error:', err);
                console.log('statusCode:', res && res.statusCode);
                response.writeHead(500); //internal server error
                response.end();
            }
            else
            {
                if (res.statusCode == 404) { //if file does not exist
                    if (fileTypeIndex == fileTypes.length-1) { //if no more file type to try
                        console.error("File not found (404): " + 'http://it.murdoch.edu.au/~S90i0432D/ict375/data/' + year + " USING LOCAL FILES");
                        parseData(getLocalData(year, fileTypes), startMonth, endMonth, response); //get local file data
                    }
                    else
                    {
                        //try next file type
                        fileTypeIndex++;
                        console.error("XML URL FAILURE: attempting "+fileTypes[fileTypeIndex] + "..."); 
                        req.get('http://it.murdoch.edu.au/~S900432D/ict375/data/' + year + fileTypes[fileTypeIndex], callback);
                    }
                }
                else
                {
                    parseData(body, startMonth, endMonth, response);
                }
            }
        }
    });
}

function parseData(fileData, startMonth, endMonth, response) {
    let weatherData = [];
    try { //parse xml to json
        xml2js.parseString(fileData.toString(), {explicitArray:  false}, function (err, result) {
            weatherData = processJSON(JSON.stringify(result), startMonth, endMonth);
            const weatherJSON = JSON.stringify(weatherData);
            response.writeHead(200, {'Content-Type': 'application/json'});
            response.write(weatherJSON); //create JSON to return
            response.end();
        });
    } catch (e) {
        console.error("XML PARSING FAILURE: attempting json...");
        weatherData = processJSON(fileData, startMonth, endMonth);
        const weatherJSON = JSON.stringify(weatherData);
        response.writeHead(200, {'Content-Type': 'application/json'});
        response.write(weatherJSON); //create JSON to return
        response.end();
    }
}

//return data from file
function getLocalData(year, fileTypes) {
    const path = __dirname + '/../data/' + year;
    const ext = getFileExtensionFromFile(path, fileTypes);

    return fs.readFileSync(path+ext);
}

//get file ext from local file
function getFileExtensionFromFile(path, fileTypes) {
    let fileType = false;
    fileTypes.forEach(type => {
        if (fs.existsSync(path+type)) {
            fileType = type;
        }
    });

    return fileType;
}

function convWS(ws) {
    return (ws*3.6);
}

function convSR(sr) {
    return ((sr * (1.0/6.0)) / 1000.0);
}

function calcSum(array) {
    let sum = 0;
    array.forEach(data => {
        sum += data;
    });

    return sum;
}

function calcAvg(array) {
    const sum = calcSum(array);
    const avg = sum/array.length;

    return avg;
}

//calculate monthly data
function getMonthlyData(monthArray) {
    monthArray.forEach((month, i) => {
        monthArray[i].ws = month.ws.length == 0 ? -1 : calcAvg(month.ws);
        monthArray[i].sr = month.sr.length == 0 ? -1 : calcSum(month.sr);
    });

    return monthArray
}

//create monthObject array from json data
function processJSON(data, startMonth, endMonth) {
    class monthObject {
        constructor(m) {
            this.sr = [];
            this.ws = [];
        }
    }

    let json = JSON.parse(data);
    const records = json['weather']['record'];
    
    let weatherData = [];
    for (let i=0; i<12; i++) {
        weatherData[i] = new monthObject();
    }
    records.forEach((record, index) => {
        const month = parseInt(record['date'].split('/')[1]);
        if (month >= startMonth && month <= endMonth) {
            let ws = convWS(record['ws']);
            weatherData[month-1].ws.push(ws);

            let sr = convSR((record['sr'] < 100 ? 0 : record['sr']));
            weatherData[month-1].sr.push(sr);
        }
    });

    return getMonthlyData(weatherData);
}

exports.reqStart = reqStart;
exports.reqCss = reqCss;
exports.reqWebJs = reqWebJs;
exports.reqFavicon = reqFavicon;
exports.reqData = reqData;