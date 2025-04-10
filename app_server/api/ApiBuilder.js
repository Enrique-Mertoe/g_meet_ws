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

const validateParams = function (data) {
    return data.event && data.action
}
const APiContext = ({data}) => {


    const handler = async () => {
        if (!validateParams(data))
            return datRes({message: "Invalid request! Ensure both event and action are provided."})
        try {
            const [ok, info] = await EventRegistry(data.event, data.action, data.data)
            return datRes({ok: ok, ...info})
        } catch (err) {
            console.log("Error: ", err.message)
            return datRes({message: "Action not completed"})
        }
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
module.exports = {ApiBuilder}