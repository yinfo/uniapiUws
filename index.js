const controller = require('./main_modules/http-ws-controller')
global.$storage = require('./main_modules/$storage')
$storage.onStart()
    .then()
    .catch(err => {
        console.error('$storage.onStart() ', err.message)
    })


/* Simple example of getting JSON from a POST */
const port = 9001
const uWS = require('./uWebSockets/uws')

const uWSapp = uWS.App({
// const app = uWS./*SSL*/App({
    key_file_name: 'misc/key.pem',
    cert_file_name: 'misc/cert.pem',
    passphrase: '1234'
}).get('/info', (res, req) => {
    res.end($storage.getPostgresString())
}).post('/uniapi', (res, req) => {
    /* Note that you cannot read from req after returning from here */
    // let url = req.getUrl()

    /* Read the body until done or error */
    readJson(res, (command) => {
        controller.onApiMessageHttp(res, command)
    }, () => {
        /* Request was prematurely aborted or invalid or missing, stop reading */
        console.log('Invalid JSON or no data at all!');
    })
}).ws('/*', {
    /* Options */
    compression: 0,
    maxPayloadLength: 16 * 1024 * 1024,
    idleTimeout: 10000,
    /* Handlers */
    open: (ws, req) => {
        console.log('A WebSocket connected via URL: ' + req.getUrl() + '!');
        // try {
        //     const query = req.getQuery()
        //     const sessionId = query.replace('sessionId=', '')
        //     $storage.checkDatabaseSessionId(sessionId)
        //         .then(() => {
        //             if ($storage.addSession(ws, sessionId)) {
        //                 controller.sendSuccessWS(ws, 'Валидная сессия')
        //             }
        //         })
        //         .catch(() => {
        //             controller.sendErrorWS(ws, 'Invalid sessionId: ' + sessionId)
        //             setTimeout(() => {
        //                 try {
        //                     ws.close()
        //                 } catch (e) {
        //
        //                 }
        //
        //             }, 1000)
        //         })
        //
        // } catch (e) {
        //     console.error(e.message)
        //     controller.sendErrorWS(ws, 'Invalid sessionId')
        //     setTimeout(() => {
        //         try {
        //             ws.close()
        //         }catch (e) {
        //
        //         }
        //
        //     }, 1000)
        // }
    },
    message: (ws, message, isBinary) => {
        try {
            const strMessage = ab2str(message)
            const command = JSON.parse(strMessage)
            controller.onApiMessageWS(ws, command)
        } catch (e) {
            controller.sendErrorWS(ws, e.message)
        }
    },
    drain: (ws) => {
        console.log('WebSocket backpressure: ' + ws.getBufferedAmount());
    },
    close: (ws, code, message) => {
        // $storage.removeSession(ws.sessionId)
        // console.log('WebSocket closed code = ' + code);
    }

}).any('/*', (res, req) => {
    res.end('Nothing to see here!');
}).listen(port, (token) => {
    if (token) {
        console.log('Listening to port ' + port);
    } else {
        console.log('Failed to listen to port ' + port);
    }
});


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

function ab2str(arrayBuffer) {
    let result = "";
    let i = 0;
    let c = 0;
    let c1 = 0;
    let c2 = 0;
    let c3 = 0;
    let data = new Uint8Array(arrayBuffer);

    // If we have a BOM skip it
    if (data.length >= 3 && data[0] === 0xef && data[1] === 0xbb && data[2] === 0xbf) {
        i = 3;
    }

    while (i < data.length) {
        c = data[i];

        if (c < 128) {
            result += String.fromCharCode(c);
            i++;
        } else if (c > 191 && c < 224) {
            if (i + 1 >= data.length) {
                throw "UTF-8 Decode failed. Two byte character was truncated.";
            }
            c2 = data[i + 1];
            result += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
            i += 2;
        } else {
            if (i + 2 >= data.length) {
                throw "UTF-8 Decode failed. Multi byte character was truncated.";
            }
            c2 = data[i + 1];
            c3 = data[i + 2];
            result += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
            i += 3;
        }
    }
    return result;
}































