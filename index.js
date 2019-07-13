/* Simple example of getting JSON from a POST */
const port = 9000
const portHttp = 80
const uWS = require('./uWebSockets/uws')


const app = uWS./*SSL*/App({
    key_file_name: 'misc/key.pem',
    cert_file_name: 'misc/cert.pem',
    passphrase: '1234'
}).post('/*', (res, req) => {
    // /* Note that you cannot read from req after returning from here */
    // let url = req.getUrl();
    //
    // /* Read the body until done or error */
    // readJson(res, (obj) => {
    //     console.log('Posted to ' + url + ': ')
    //     console.log(obj);
    //     if(!obj.login){
    //         res.end('Thanks for this json!')
    //     } else {
    //         res.end(obj.login)
    //     }
    //
    // }, () => {
    //     /* Request was prematurely aborted or invalid or missing, stop reading */
    //     console.log('Invalid JSON or no data at all!');
    // });
}).listen(port, (token) => {
    if (token) {
        console.log('Listening to port ' + port);
    } else {
        console.log('Failed to listen to port ' + port);
    }
});

const http = require('http')

const requestHandler = (request, response) => {
    response.end('Hello Node.js Server!')
}
const server = http.createServer(requestHandler)
server.listen(portHttp, (err) => {
    console.error(err)
})


/* Helper function for reading a posted JSON body */
function readJson(res, cb, err) {
    let buffer;
    /* Register data cb */
    res.onData((ab, isLast) => {
        let chunk = Buffer.from(ab);
        if (isLast) {
            let json;
            if (buffer) {
                try {
                    json = JSON.parse(Buffer.concat([buffer, chunk]));
                } catch (e) {
                    /* res.close calls onAborted */
                    res.close();
                    return;
                }
                cb(json);
            } else {
                try {
                    json = JSON.parse(chunk);
                } catch (e) {
                    /* res.close calls onAborted */
                    res.close();
                    return;
                }
                cb(json);
            }
        } else {
            if (buffer) {
                buffer = Buffer.concat([buffer, chunk]);
            } else {
                buffer = Buffer.concat([chunk]);
            }
        }
    });

    /* Register error cb */
    res.onAborted(err);
}