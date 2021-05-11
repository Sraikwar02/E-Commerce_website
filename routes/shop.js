const express=require('express');
const path=require('path');

const shopController=require('../controllers/shop');
const isAuth=require('../middleware/isAuth');

const router=express.Router();

router.get('/',shopController.getIndex);

router.get('/products',shopController.getProducts);

router.get('/products/:productId',shopController.getProduct);

router.get('/cart',isAuth ,shopController.getCart);

router.post('/cart',isAuth ,shopController.postCart);

router.get('/checkout',isAuth,shopController.getCheckout);

router.post('/cart-delete-items',isAuth ,shopController.postCartDeleteProduct);

router.get('/checkout/success',shopController.getCheckoutSuccess);

router.get('/checkout/cancel',shopController.getCheckout);

router.get('/Orders',isAuth ,shopController.getOrders);

// router.post('/create-order',isAuth ,shopController.postOrder);

router.get('/orders/:orderId',isAuth,shopController.getInvoices);

module.exports=router;