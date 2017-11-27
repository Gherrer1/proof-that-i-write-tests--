const chai = require('chai');
const expect = chai.expect;
const should = chai.should();
const sinon = require('sinon');
const request = require('supertest');
const app = require('../../src/app');
const seed = require('../../seed');
const {SESSION_COOKIE_NAME,
       SERVER_ERROR_COOKIE_NAME} = require('../../src/config');
const debug = require('debug')('test-order');
const puppeteer = require('puppeteer');

describe('#Authentication_Routes', function() {

  beforeEach(function(done) {
    debug(':)');
    seed.seed()
    .then(done, done);
  });

  afterEach(function(done) {
    debug(':(');
    done();
  });

  describe('[GET /login]', function() {
    it('should redirect to /dashboard if user is already logged in', function() { /* In Flows tests */});
    it('should show client_error flash message on page along with just-tried email if flash cookie contains client error message, also flash cookie should be cleared', function(done) {
      request(app).get('/login')
        .set('Cookie', ['cookie_flash_message=%7B%22type%22%3A%22client_error%22%2C%22text%22%3A%22Invalid%20credentials%22%2C%22email%22%3A%22butthead%22%7D'])
        .expect(200)
        .expect(/class="client_error"/)
        .expect(/Invalid credentials/)
        .expect(/butthead/) // tried email
        .end(function(err, res) {
          if(err)
            return done(err);
          expect(res.headers['set-cookie'][0]).to.match(/cookie_flash_message=.+01 Jan 1970/); // this signifies that cookie has been cleared
          done();
        });
    });
  	it('should show server_error flash message on page along with just-tried email if flash cookie includes server-error, and should clear cookie', function(done) {
      request(app).get('/login')
        .set('Cookie', ['cookie_flash_message=%7B%22type%22%3A%22server_error%22%2C%22text%22%3A%22Something%20went%20wrong.%20Please%20try%20again%22%2C%22email%22%3A%22sato%40email.com%22%7D'])
        .expect(200)
        .expect(/class="server_error"/)
        .expect(/Something went wrong/)
        .expect(/sato@email.com/)
        .end(function(err, res) {
          if(err)
            return done(err);
          expect(res.headers['set-cookie'][0]).to.match(/cookie_flash_message=.+01 Jan 1970/); // this signifies that cookie has been cleared
          done();
        });
    });
  	it('should show signup_success flash message on page if flash cookie includes signup success message, and cookie should be cleared', function(done) {
      request(app).get('/login')
        .set('Cookie', ['cookie_flash_message=%7B%22type%22%3A%22signup_success%22%2C%22text%22%3A%22Sign%20up%20successful!%22%7D'])
        .expect(200)
        .expect(/class="signup_success"/)
        .expect(/Sign up successful!/)
        .end(function(err, res) {
          if(err)
            return done(err);
          expect(res.headers['set-cookie'][0]).to.match(/cookie_flash_message=.+01 Jan 1970/); // this signifies that cookie has been cleared
          done();
        });
    });
  	it('should show login page without any messages if no flash message cookie sent', function(done) {
      request(app).get('/login')
        .expect(200)
        .expect(/<form action="\/login" method="post">/, done);
    });
  });

  describe('[GET /signup]', function() {
    it('should redirect to /dashboard if request has a session cookie', function(done){
      // dont worry, itll run into authentication middleware to validate the cookie
      debug('running test');
      request(app).get('/signup')
        .set('Cookie', [`${SESSION_COOKIE_NAME}=1234`])
        .expect(302)
        .expect('Location', '/dashboard', done);
    });
    it('should render an HTML file with an error message above the signup form if server-error cookie is present', function(done) {
      debug('running test');
      const errorMessage = 'Something went wrong'
      request(app).get('/signup')
        .set('Cookie', [`${SERVER_ERROR_COOKIE_NAME}=${errorMessage}`])
        .expect(200)
        .expect(/<li>Something went wrong<\/li>/, done);
    });
    it('should return an HTML file with a form field that we can regex (if no cookies present)', function(done){
      debug('running test');
      request(app).get('/signup')
        .expect(200)
        .expect(/<form action="\/signup" method="POST">/, done);
    });
  });

  describe('[POST /signup]', function() {
    it('should redirect to /dashboard if request has a session cookie', function(done) {
      debug('running test');
      request(app).post('/signup')
        .set('Cookie', [`${SESSION_COOKIE_NAME}=1234`])
        .expect(302)
        .expect('Location', '/dashboard', done);
    });
    it('should redirect to /signup if request body has invalid parameters without any error messages to discourage bots - browser will have clientside validation', function(done) {
      debug('running test');
      request(app).post('/signup')
        .send({ fname: 'Tester', email: 'invalid email lol', also: 'many fields are missing LOL' })
        .expect(302)
        .expect('Location', '/signup')
        .end(function(err, res) {
          if(err) {
            return done(err);
          }
          // heres where we check that no cookies were sent
          var cookies = res.headers['set-cookie'];
          debug(cookies);
          // TODO: actually check that no cookies were sent, we dont know the shape of the data right now
          done();
        });
    });
    it('should redirect to /signup if username or email in request body are not unique without error \n\tmessages to discourage bots - clientside will check for uniqueness before allowing client to submit form', function(done) {
      debug('running test');
      request(app).post('/signup')
        .send({ fname: 'Otherkirishima', email: 'kirishima@email.com', password: '1111111111', username: 'kirishima', passwordConfirmation: '1111111111' })
        .expect(302)
        .expect('Location', '/signup')
        .end(function(err, res) {
          if(err) {
            return done(err);
          }
          var cookies = res.headers['set-cookie'];
          debug(cookies);
          // TODO: actually check that no cookies were returned (cookies that mightve carried error messages)
          done()
        });
    });
    it('should redirect to /login with success message if no session cookie and if request body is all valid, including unique username and email', function(done) {
      debug('running test');
      request(app).post('/signup')
        .send({ fname: 'Uniqueuser', email: 'uniqueEmail@email.com', password: '1111111111', username: 'uniqueUname', passwordConfirmation: '1111111111' })
        .expect(302)
        .expect('Location', '/login')
        .end(function(err, res) {
          // TODO: make sure a flash message cookie is present
          if(err) {
            return done(err);
          }
          done();
        });
    });
    it('should redirect to /signup with error message via cookie (something went wrong) for server errors (*1)');
  });

  describe('[POST /login]', function() {

    it('should redirect to /login with client_error flash message (including attempted email) if data is invalid - as in simply doesnt fit the requirements used for signup', function(done) {
      debug('running test');
      request(app).post('/login')
        .send({ email: 'a', password: '1' })
        .expect(302)
        .expect('Location', '/login')
        .end(function(err, res) {
          if(err)
            return done(err);
          const cookie = res.headers['set-cookie'][0];
          expect(cookie).to.match(/cookie_flash_message=.+client_error.+email%22/);
          expect(res.headers['set-cookie'].length).to.equal(1);
          done();
        });
    });
    it('should redirect to /login with server-error cookie/flash message if there are server errors', function(done) {
      var stub = sinon.stub(require('bcrypt'), 'compare').rejects(new Error('Hashing went wrong bro'));
      request(app).post('/login')
        .send({ email: 'sato@email.com', password: '1111111111' })
        .expect(302)
        .expect('Location', '/login')
        .end(function(err, res) {
          stub.restore();
          if(err) {
            return done(err);
          }
          const cookie = res.headers['set-cookie'][0];
          expect(cookie).to.match(/cookie_flash_message=.+server_error.+email%22/);
          expect(res.headers['set-cookie'].length).to.equal(1);
          done();
        });
    });
    it('should redirect to /login with client_error flash message (with email included) if username is incorrect', function(done) {
      request(app).post('/login')
        .send({ email: 'satoo@email.com', password: '1111111111' })
        .expect(302)
        .expect('Location', '/login')
        .end(function(err, response) {
          if(err)
            return done(err);
          const cookie = response.headers['set-cookie'][0];
          expect(cookie).to.match(/cookie_flash_message=.+client_error.+email%22/);
          expect(response.headers['set-cookie'].length).to.equal(1);
          done();
        });
    });
    it('should redirect to /login with client_error flash message (with email included) if username correct but password incorrect', function(done) {
      request(app).post('/login')
        .send({ email: 'sato@email.com', password: '1112221112' })
        .expect(302)
        .expect('Location', '/login')
        .end(function(err, response) {
          if(err)
            return done(err);
          const cookie = response.headers['set-cookie'][0];
          expect(cookie).to.match(/cookie_flash_message=.+Invalid.+credentials.+email/); // Invalid.+credentials
          expect(response.headers['set-cookie'].length).to.equal(1);
          done();
        });
    });
    it('should give session cookie and signup_success flash message if login credentials are correct', function(done) {
      request(app).post('/login')
        .send({ email: 'sato@email.com', password: '1111111111' })
        .expect(302)
        .expect('Location', '/dashboard')
        .end(function(err, res) {
          if(err) {
            return done(err);
          }
          const cookie = res.headers['set-cookie'][0];
          expect(cookie).to.match(/thekid=.+\./); // session cookie
          expect(res.headers['set-cookie'].length).to.equal(1);
          done();
        });
    });
  });
});

describe('#Flows', function() {
    let page, browser;
    const width = 1920;
    const height = 1080;
    /* before ALL tests*/
    before(async function() {
      this.timeout(10000);
      const browserConfig = { headless: true };
      if(!browserConfig.headless) {
        browserConfig.slowMo = 80;
        browserConfig.args = [`--window-size=${width},${height}`]
      }
      browser = await puppeteer.launch(browserConfig);
      page = await browser.newPage();
      await page.setViewport({ width, height });
    });
    /* after ALL test */
    after(async function() {
      await browser.close();
    });

    beforeEach(function(done) {
      seed.seed()
      .then(done, done);
    });

    it('successful POST /login -> GET /dashboard, then GET /login --redirect--> GET /dashboard because already signed in', async function() {
      this.timeout(17000);
      var server = app.listen(3000);
      await page.goto('http://localhost:3000/login');
      await page.waitForSelector('#emailInput');
      await page.type('#emailInput', 'sato@email.com');
      await page.type('#passwordInput', '1111111111');
      await page.click('#submitInput');
      await page.waitForSelector('#welcome');
      await page.goto('http://localhost:3000/login');
      // by waiting for #welcome, we're really expecting to be redirected back to /dashboard
      await page.waitForSelector('#welcome', { timeout: 2000 });
      server.close();
    });
});

/**
 * *1 server errors include db operation errors, hashing errors, etc
 */
