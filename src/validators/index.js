let { check, validationResult } = require('express-validator/check');
let { matchedData }             = require('express-validator/filter');
let vConstants                  = require('./validatorConstants');

// the way these work: unless message is explicitly listed, default message inluded with check() is the message used
var signupValidators = [
  check('fname', 'First name missing')
    .exists()
    .isLength({ min: 1 }) // max currently 20
    .isLength({ max: vConstants.signup.fname.max }).withMessage(`First name cannot be greater than ${vConstants.signup.fname.max} characters`),
  check('username', 'Username missing')
    .exists() // min, max currently 5, 12
    .isLength({ min: vConstants.signup.username.min, max: vConstants.signup.username.max }).withMessage(`Username must be between ${vConstants.signup.username.min} and ${vConstants.signup.username.max} characters long`),
  check('email', 'Email missing')
    .exists()
    .isLength({ min: 1 }) // has a natural max by virtue of checking for isEmail()
    .isEmail().withMessage('Invalid email'),
  check('password', 'Password missing')
    .exists()
    .isLength({ min: vConstants.signup.password.min, max: vConstants.signup.password.max }).withMessage(`Password must be between ${vConstants.signup.password.min} and ${vConstants.signup.password.max} characters long`),
  check('passwordConfirmation', 'Password confirmation missing')
    .exists()
    .isLength({ min: 1 }) // not saved so we DGAF about how long
    .custom( (value, { req }) => value === req.body.password ).withMessage('Password confirmation does not match password')
  // check('fname', /*message=*/'first name missing') // manually tested
  //   .exists()
  //   .trim(),
  // check('username')
  //   .exists().withMessage('Username missing') // manually tested
  //   .isLength({ min: 7, max: 15 }).withMessage('Username not between 7 and 15 characters long')
  //   .trim(),
  // check('email', /*message=*/'invalid email')
  //   .isEmail()
  //   .trim()
  //   .normalizeEmail(),
];

module.exports = {
  signupValidators // Array of middleware functions
}
