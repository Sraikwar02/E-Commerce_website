const Product = require('../models/product');
const Order = require('../models/order');
const fs = require('fs');
const path = require('path');
const pdfDocument= require('pdfkit');
const session = require('express-session');

const stripe=require('stripe')('STRIPE_PRIVATE_KEY');

const Items_Per_Page=2;


exports.getProducts = (req, res, next) => {
    const page= +req.query.page || 1;
    let totalItems;
    Product.find()
    .countDocuments()
    .then(numProducts=>{
        totalItems=numProducts;
        return Product.find()
        .skip((page-1)*Items_Per_Page)
        .limit(Items_Per_Page);
    })
    .then(product => {
        res.render('shop/product-list', {
            prods: product,
            pagetitle: 'All Products',
            path: 'Product',
            currentPage:page,
            hasNextPage:Items_Per_Page * page < totalItems,
            hasPreviousPage:page>1,
            nextPage:page + 1,
            previousPage:page -1,
            lastPage:Math.ceil(totalItems/Items_Per_Page),
        })
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};


exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findById(prodId).then(product => {
        res.render('shop/product-detail', {
            Product: product,
            pagetitle: product.title,
            path: 'Product'
        });
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.getIndex = (req, res, next) => {
    const page= +req.query.page || 1;
    let totalItems;
    Product.find()
    .countDocuments()
    .then(numProducts=>{
        totalItems=numProducts;
        return Product.find()
        .skip((page-1)*Items_Per_Page)
        .limit(Items_Per_Page);
    })
    .then(product => {
        res.render('shop/index', {
            prods: product,
            pagetitle: 'shop',
            path: 'shop',
            currentPage:page,
            hasNextPage:Items_Per_Page * page < totalItems,
            hasPreviousPage:page>1,
            nextPage:page + 1,
            previousPage:page -1,
            lastPage:Math.ceil(totalItems/Items_Per_Page),
        })
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.getCart = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            const products = user.cart.items;
            res.render('shop/cart', {
                pagetitle: 'Your Cart',
                path: 'Your Cart',
                products: products
            });
        }).catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.postCart = (req, res, next) => {
    const prodId = req.body.ProductId;
    Product.findById(prodId)
        .then(product => {
            return req.user.addToCart(product);
        }).then(result => {
            console.log(result);
            res.redirect('/cart');
        });
};

exports.postCartDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId;
    req.user.removeItemFromCart(prodId)
        .then(result => {
            res.redirect('/cart');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getCheckout=(req,res,next)=>{
    let products;
    let total=0;
    req.user
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            products = user.cart.items;
            total=0;
            products.forEach(p=>{
                total += p.quantity * p.productId.price;
            });
            return stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: products.map(p=>{
                    return {
                        name: p.productId.title,
                        description: p.productId.description,
                        amount: p.productId.price * 100,
                        currency:'INR',
                        quantity: p.quantity
                    };
                }),
                mode: 'payment',
                success_url: req.protocol + '://' + req.get('host') + '/checkout/success',
                cancel_url:req.protocol + '://' + req.get('host') + '/checkout/cancel'
            });
        })
        .then(session=>{
            res.render('shop/checkout', {
                pagetitle: 'Checout',
                path: 'checkout',
                products: products,
                totalSum:total,
                sessionId:session.id
            });
        }).catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};


exports.getOrders = (req, res, next) => {
    Order.find({ 'user.userId': req.user._id })
        .then(orders => {
            res.render('shop/Orders', {
                pagetitle: 'Your Orders',
                path: 'Orders',
                orders: orders
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
};

exports.getCheckoutSuccess = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        .execPopulate().then(user => {
            const products = user.cart.items.map(i => {
                return { quantity: i.quantity, product: { ...i.productId._doc } }
            });
            const order = new Order({
                user: {
                    email: req.user.email,
                    userId: req.user
                },
                products: products
            });
            return order.save();
        }).then(result => {
            req.user.clearCart();
        }).then(() => {
            res.redirect('/orders');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
    };

// exports.postOrder = (req, res, next) => {
//     req.user
//         .populate('cart.items.productId')
//         .execPopulate().then(user => {
//             const products = user.cart.items.map(i => {
//                 return { quantity: i.quantity, product: { ...i.productId._doc } }
//             });
//             const order = new Order({
//                 user: {
//                     email: req.user.email,
//                     userId: req.user
//                 },
//                 products: products
//             });
//             return order.save();
//         }).then(result => {
//             req.user.clearCart();
//         }).then(() => {
//             res.redirect('/orders');
//         })
//         .catch(err => {
//             const error = new Error(err);
//             error.httpStatusCode = 500;
//             return next(error);
//         });
//     };
    
    
    exports.getInvoices = (req, res, next) => {
        const OrderId = req.params.orderId;
        
        Order.findById(OrderId).then(order => {
            
            if (!order) {
                return next(new Error('No Order found'));
            }
            if (order.user.userId.toString() !== req.user._id.toString()) {
            return next(new Error('Unauthorised User'))
        }
        const invoiceName = 'invoice-' + OrderId + '.pdf';
        const Invoicepath = path.join('Data', 'invoices', invoiceName);
        res.setHeader('Content-Type', 'application/pdf');
        const pdfDoc=new pdfDocument();
        res.setHeader(
            'Content-Disposition',
            'inline; filename="' + invoiceName + '"'
            );        
        pdfDoc.pipe(fs.createWriteStream(Invoicepath));
        pdfDoc.pipe(res);

        pdfDoc.fontSize(21).text('Invoice',{
            underline:true
        });
        pdfDoc.text('-----------------------------------------------------');
        let totalPrice=0;
        order.products.forEach(prod=>{
            totalPrice+=prod.quantity*prod.product.price;
            pdfDoc.fontSize(15).text(prod.product.title +' - ' + prod.quantity +' X '+' $'+prod.product.price);
        });
        
        pdfDoc.text('-----------------------------------------------------');
        pdfDoc.fontSize(18).text('Total Price ='+'  $'+totalPrice);
        

        pdfDoc.end();
        // fs.readFile(Invoicepath, (err, data) => {
        //     if (err) {
        //         return next(err);
        //     }
        //     res.setHeader('Content-Type', 'application/pdf');
        //     res.setHeader(
        //         'Content-Disposition',
        //         'inline; filename="' + invoiceName + '"'
        //         );
        //         res.send(data);
        //     });
        // const file=fs.createReadStream(Invoicepath);

            // file.pipe(res);
        }).catch(err=>{
            // console.log(err);
            next(err)
        });
};