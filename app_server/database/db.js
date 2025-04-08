require('dotenv').config();
const mongoose = require('mongoose');
// const dbURL = "mongodb+srv://abutimartin778:wDsGgXeSLtFsfoUV@cluster0.5neaq1z.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const dbURL = "mongodb://root:Q5ulHsTzf2Wgu0W11HhPX6ixKeX8l6a36fgV7KHEOHIcBABg4K5Gd375KHJIFrLw@35.209.80.45:27017/?directConnection=true&tls=true&tlsCAFile=/etc/mongo/certs/ca.pem"
mongoose.set('useNewUrlParser', true);
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useUnifiedTopology', true);

const connect = () => {
    mongoose.connect(dbURL, {autoIndex: true}).then(() => {
        console.log('Database connection successful');
    }).catch(err => {
        console.log('Database connection error: ' + err);
        setTimeout(connect, 5000);
    });
};
// wDsGgXeSLtFsfoUV
module.export = connect

mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to ' + dbURL);
});

mongoose.connection.on('error', err => {
    console.log('Mongoose connection error: ' + err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected');
});

const gracefulShutdown = (msg, callback) => {
    mongoose.connection.close(() => {
        console.log(`Mongoose disconnected through ${msg}`);
        callback();
    });
};

process.on('SIGINT', gracefulShutdown.bind(null, 'app termination'));
process.on('SIGTERM', gracefulShutdown.bind(null, 'Heroku app shutdown'));
process.on('SIGUSR2', gracefulShutdown.bind(null, 'nodemon restart'));

connect();
