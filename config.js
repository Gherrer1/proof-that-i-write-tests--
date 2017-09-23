const DB_URL = (process.env.NODE_ENV === 'prod') ? process.env.DB_URL : 'mongodb://localhost:27017/proof';
if(!DB_URL) {
	console.log('Exiting because no DB_URL env var provided in production mode');
	process.exit(1);
}

// export config values
module.exports = {
	DB_URL
};