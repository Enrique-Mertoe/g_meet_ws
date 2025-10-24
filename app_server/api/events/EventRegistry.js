const ApiAuth = require("./Authentication");
const ApiMeeting = require("./Meeting");
const handlers = ["auth", "meeting"]
const EventRegistry = async (event, action, data) => {
    if (!handlers.includes(event))
        return [false, `Invalid event > (${event}, can't be found.`]
    if (event === "auth")
        return [true, await ApiAuth({action, data})]
    if (event === "meeting")
        return [true, await ApiMeeting({action, data})]
}
module.exports = EventRegistry