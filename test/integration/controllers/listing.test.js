const seed = require('../../../seed');
const assert = require('chai').assert;

// test interactions between listing controller and listing model
describe('#Listing_Controller', function() {
	let listingController = require('../../../src/controllers/listing');
	before(function() {
		const listingModel = require('../../../src/models/Listing');
		listingController.setModel(listingModel);
	});
	after(function(done) {
		seed.seed().then(done, done);
	});
	beforeEach(function(done) {
		seed.seed().then(done, done);
	});
	describe('#countBelongsTo', function() {
		it('should return the number of listings that belong to user', function(done) {
			getSeroID()
			.then((id) => {
				return listingController.countBelongsTo(id);
			})
			.then(count => {
				assert.equal(count, 3, 'Expected 3 listings to belong to sero');
				done();
			})
			.catch(done);
		});
		it('should reject if passed an invalid owner_id', function(done) {
			const invalidID = 'abc';
			listingController.countBelongsTo(invalidID)
			.then(count => done(new Error('expected a rejection with error')))
			.catch(err => done());
		});
		it('should resolve with 0 if passed a nonexistent owner_id', function(done) {
			const nonexistentID = '5a302a283d3653249ce3ca71';
			listingController.countBelongsTo(nonexistentID)
			.then(count => {
				assert.equal(count, 0);
				done();
			})
			.catch(done);
		});
	});
});

function getSeroID() {
	return new Promise(function(resolve, reject) {
		const userModel = require('../../../src/models/User');
		userModel.findOne({ fname: 'Sero' })
		.then(userObj => resolve(userObj._id))
		.catch(reject);
	});
}

function postListing(user_id) {
	return new Promise(function(resolve, reject) {
		const listingModel = require('../../../src/models/Listing');
		const validData = { title: 'bumble', description: 'new app', lang: 'JAVA', type: 'FULL_TIME', owner_id: user_id };
		let modelInstance = new listingModel(validData);
		modelInstance.save()
		.then(res => resolve(res))
		.catch(reject);
	});
}