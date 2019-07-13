const errors = require('./errors')
//-------------------------------------------------------------------------------
//---------------------------Отправка сообщений-----------------------------------------
//--------------------------------------------------------------------------------
module.exports.sendSuccessWS = function (ws, message) {
    try {
        // switch (typeof message) {
        //     case 'string':
        //         ws.send(message)
        //         break
        //     case 'object':
        //         ws.send(JSON.stringify(message))
        //         break
        //     default:
        //         return false
        // }
        if (typeof message === 'string') {
            ws.send(message)
        } else if (typeof message === 'object') {
            ws.send(JSON.stringify(message))
        } else {
            return false
        }
        return true
    } catch (e) {
        console.error('sendSuccess', e.message)
        return false
    }
}

module.exports.sendSuccessHttp = function (res, message) {
    try {
        if (typeof message === 'string') {
            res.end(JSON.stringify({
                type: 'valid-response',
                message,
            }))
            return true
        } else if (typeof message === 'object') {
            if (!message.hasOwnProperty('type')) {
                message.type = 'valid-response'
            }
            res.end(JSON.stringify(message))
            return true
        } else {
            return false
        }
    } catch (e) {
        console.error('sendSuccessHttp ', e.message)
        return false
    }
}

module.exports.sendErrorWS = function (ws, error, message) {
    try {
        if (typeof error === 'string') {
            ws.send(JSON.stringify({
                errorId: error,
                message,
            }))
            return true
        } else if (typeof error === 'object') {
            if (message) error.msg = message
            ws.send(JSON.stringify(error))
            return true
        } else {
            return false
        }
    } catch (e) {
        console.error('sendError', e.message)
        return false
    }
}

module.exports.sendErrorHttp = function (res, error, message) {
    try {
        if (typeof error === 'string') {
            res.status(200).json({
                type: 'error',
                errorId: error,
                message,
            })
            return true
        } else if (typeof message === 'object') {
            error.type = 'error'
            res.status(200).json(error)
            return true
        } else {
            return false
        }
    } catch (e) {
        console.error('sendErrorHttp ', e.message)
        return false
    }
}

//-------------------------------------------------------------------------------
//---------------------------Анализ входящих сообщений-----------------------------------------
//--------------------------------------------------------------------------------
module.exports.runMethod = async function (scr, method, params) {
    const returnResult = {error:null, newData:null}
    try {
        switch (scr) {
            case '$storage':
                if (typeof $storage[method] === "function") {
                    returnResult.newData = params ? await $storage[method](params) : await $storage[method]()
                } else {
                    returnResult.error = errors.WRONG_METHOD
                }
                break
            default:
                const tempResult = await $storage.runDynamicModule(scr, method, params)
                if (tempResult && tempResult.errorId) {
                    returnResult.error = tempResult
                } else {
                    returnResult.newData = tempResult
                }
        }
    }catch (e) {
        returnResult.error = e
    }
    return returnResult
}

module.exports.onApiMessageWS = async function (ws, command) {
    try {
        const {scr, method, data, uid} = command
        const result = {uid, scr, method}

        if (!scr) {
            result.error = errors.MISSING_SCR
            return this.sendErrorWS(ws, result)
        }
        if (!method) {
            result.error = errors.MISSING_METHOD
            return this.sendErrorWS(ws, result)
        }

        const {error, newData} = await this.runMethod(scr, method, data)
        if (error) {
            return this.sendErrorWS(ws, error)
        } else {
            result.data = newData
            this.sendSuccessWS(ws, result)
        }
    } catch (e) {
        return this.sendErrorWS(ws, e)
    }
}

module.exports.onApiMessageHttp = async (res, command) => {
    try {
        const {scr, method, data, uid} = command
        const result = {uid, scr, method}

        if (!scr) {
            result.error = errors.MISSING_SCR
            return this.sendErrorHttp(res, result)
        }
        if (!method) {
            result.error = errors.MISSING_METHOD
            return this.sendErrorHttp(res, result)
        }

        const {error, newData} = await this.runMethod(scr, method, data)
        if (error) {
            return this.sendErrorHttp(res, error)
        } else {
            result.data = newData
            this.sendSuccessHttp(res, result)
        }
    } catch (e) {
        return this.sendErrorHttp(res, e)
    }
}








