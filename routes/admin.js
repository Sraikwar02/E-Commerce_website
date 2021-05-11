const path=require('path');

const express=require('express');
const { body } = require('express-validator/check');

const rootDir=require('../util/path');

const router=express.Router();
const adminController=require('../controllers/admin');
const isAuth=require('../middleware/isAuth');

// // admin/add-product => Get
router.get('/add-product',isAuth ,adminController.getAddProduct);

// // admin/products => Get
router.get('/products',isAuth ,adminController.getProducts);

// // admin/add-product=> Post
router.post('/add-product',[
        body('title','please enter a title with atleast 3 character length')
        .isLength({ min: 3})
        .isString()
        .trim(),
        body('price','please enter a numerical value with upto 2 decimal length')
        .isFloat(),
        body('description','please enter description with atleast 5 charcter long')
        .isLength({ min:5,max:200}).trim()
    ],isAuth ,adminController.postAddProduct);

// // admin/edit-product=>Get
router.get('/edit-product/:productId',isAuth ,adminController.getEditProduct);

// // // admin/edit-product=>Post
router.post('/edit-product',[
    body('title','please enter a title with atleast 3 character length')
    .isString()
    .isLength({ min: 3})
    .trim(),
    body('price','please enter a numerical value with upto 2 decimal length')
    .isFloat(),
    body('description','please enter description with atleast 5 charcter long')
    .isLength({ min: 5,max:200}).trim()
    ],isAuth ,adminController.postEditProduct);

// // //admin/delete-product=>Post
router.delete('/product/:productId',isAuth ,adminController.deleteProduct);

module.exports=router;
