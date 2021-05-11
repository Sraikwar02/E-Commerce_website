const express = require('express');
const { check, body } = require('express-validator/check');
const User = require('../models/user');
const authController = require('../controllers/auth');

const router = express.Router();

router.get('/login', authController.getLogin);

router.post('/login', [
    check('email')
        .isEmail()
        .withMessage('Please enter the valid email')
        .normalizeEmail(),
    body('password', 'Invalid password')
        .trim()
        .isLength({ min: 5 })
        .isAlphanumeric()
    ], authController.postLogin);

router.post('/logout', authController.postLogout);

router.get('/signup', authController.getSignup);

router.post('/signup',
    [check('email')
        .isEmail()
        .withMessage('Please enter the valid email')
        .custom((value, { req }) => {
            // if( value==='test@test.com') {
            //     throw new Error ('this email is forbidden');
            // }
            // return true;
            return User.findOne({ email: value })
                .then(userDoc => {
                    if (userDoc) {
                        return Promise.reject('E-mail already exist please enter different E-mail');
                    }
                })
        })
        .normalizeEmail(),
    body('password', 'please enter password with number and text and atleast 5 characters')
    .isLength({ min: 5 })
    .isAlphanumeric()
        .trim(),
    body('confirmPassword')
        .trim()
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Password have to match');
            }
            return true;
        }
        )
    ], authController.postSignup);

router.get('/reset', authController.getReset);

router.post('/reset',
    // [body('password', 'please enter password with number and text and atleast 5 characters')
    // .isLength({ min: 5 })
    // .isAlphanumeric()
    // .trim()],
    authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/newPassword', authController.postNewPassword);

module.exports = router;