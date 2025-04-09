const EventRegistry = require("./events/EventRegistry");

function makeres({status = 200, data}) {
    return {
        status: status,
        data: data
    }
}

function datRes({ok = false, data = {}, message = ""} = {}) {
    return {
        ok, data: data, message: message,
    }
}

const APiContext = ({data}) => {
    const validateParams = function () {
        return data.event && data.action
    }

    const handler = async () => {
        if (!validateParams())
            return datRes({message: "Invalid request! Ensure both event and action are provided."})
        const [ok,info] = await EventRegistry(data.event,data.action, data.data)
        return datRes({ok: ok,...info})
    }

    async function process() {
        return new Promise(async (resolve, reject) => {
            resolve(makeres({data: await handler()}))
        })
    }

    return {process}
}

const ApiBuilder = (req, res) => {
    const context = APiContext({data: req.body})
    const build = (fn) => {
        context.process().then(d => fn(d))
    }
    return {build}
}
module.exports = ApiBuilder