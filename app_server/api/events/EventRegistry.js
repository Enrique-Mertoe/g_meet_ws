const ApiAuth = require("./Authentication");
const handlers = ["auth"]
const EventRegistry = async (event, action, data) => {
    if (!handlers.includes(event))
        return [false, `Invalid event > (${event}, can't be found.`]
    if (event === "auth")
        return [true, await ApiAuth({action, data})]
}
module.exports = EventRegistry