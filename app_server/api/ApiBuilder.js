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
    const canProcess = function () {
        return data.event && data.action
    }

    const handler = () => {
        if (!canProcess())
            return datRes()
        return datRes({ok: true})
    }

    async function process() {
        return new Promise((resolve, reject) => {
            resolve(makeres({data: handler()}))
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