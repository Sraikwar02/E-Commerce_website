const mongoose=require('mongoose');
const fileHelper=require('../util/file');
const { validationResult } =require('express-validator/check');

const Product = require('../models/product');
const product = require('../models/product');

exports.getAddProduct = (req, res, next) => {
    res.render('admin/edit-product', {
        pagetitle: 'Add-products',
        path: 'admin/add-product',
        editing: false,
        isAuthenticated:req.session.isLoggedIn,
        hasError:false,        
        errorMessage:null,
        validationErrors:[]
    })
};

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const image = req.file;
    const price = req.body.price;
    const description = req.body.description;
    
    console.log(image);

    if(!image) {
        return res.status(422)
        .render('admin/edit-product', {
            pagetitle: 'Add-products',
            path: 'admin/add-product',
            editing: false,
            hasError:true,
            product:{ 
                title:title,
                price:price,
                description:description,
            },
            errorMessage:"attached file is not an image",
            validationErrors:[]
        });
    }

    const imageUrl=image.path;

    const errors=validationResult(req);
    if(!errors.isEmpty()) {
        console.log(errors.array());
        res.status(422)
        .render('admin/edit-product', {
            pagetitle: 'Add-products',
            path: 'admin/add-product',
            editing: false,
            hasError:true,
            product:{ 
                title:title,
                imageUrl:imageUrl,
                price:price,
                description:description,
            },
            errorMessage:errors.array()[0].msg,
            validationErrors:errors.array()
        });
    }
    const product=new Product({
        // _id:new mongoose.Types.ObjectId('6014248f0efc250578b74ec4'),
        title:title,
        price:price,
        imageUrl:imageUrl,
        description:description,
        userId:req.user
    });
    product.save()
    .then(result => {
        // console.log(result);
        console.log('Created Product');
        res.redirect('/admin/products')
    }).catch(err => {
        // console.log(err);
        // res.redirect('/500');
        const error=new Error(err);
        error.httpStatusCode=500;
        return next(error);
    });
};

exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;
    if (!editMode) {
        return res.redirect('/');
    }
    const prodId = req.params.productId;
    Product.findById(prodId)
    .then(product => {
        if (!product) {
            return res.redirect('/');
        };
        res.render('admin/edit-product', {
            pagetitle: 'Edit-product',
            path: 'admin/Edit-product',
            editing: editMode,
            product: product,
            hasError:false,
            errorMessage:null,
            validationErrors:[]
        });
    }).catch(err =>{
        const error=new Error(err);
        error.httpStatusCode=500;
        return next(error);
    });
};


exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const updatedPrice = req.body.price;
    const image = req.file;
    const updatedDescription = req.body.description;
    const errors=validationResult(req);

    if(!errors.isEmpty()) {
        console.log(errors.array());
        return res.render('admin/edit-product', {
            pagetitle: 'Edit-product',
            path: 'admin/Edit-product',
            editing:true, 
            editMode:true,
            product: {
                title:updatedTitle,
                price:updatedPrice,
                imageUrl:updatedImageUrl,
                description:updatedDescription,
                _id:prodId
            },
            hasError:true,
            errorMessage:errors.array()[0].msg,
            validationErrors:errors.array()

            // isAuthenticated:req.session.isLoggedIn
        });
    }
    Product.findById(prodId).then(product=>{
        
        if(product.userId.toString() !== req.user._id.toString()) {
            return res.redirect('/');
        }
        product.title=updatedTitle;
        product.price=updatedPrice;
        if(image) {
            fileHelper.deleteFile(product.imageUrl);
            product.imageUrl=image.path;
        }
        product.description=updatedDescription;
        return product.save().then(result => {
            console.log('Product Updated')
            res.redirect('/admin/products');
        });
    })
    .catch(err =>{
        const error=new Error(err);
        error.httpStatusCode=500;
        return next(error);
    });
};

exports.getProducts = (req, res, next) => {
    Product.find({ userId:req.user._id  })
    // .select('title price -_id')
    // .populate('userId','name')
    .then(products => {
        res.render('admin/products', {
            prods: products,
            pagetitle: 'Admin Products',
            path: 'Admin Products',
            isAuthenticated:req.session.isLoggedIn
        });
    }).catch(err => console.log(err));
};

exports.deleteProduct = (req, res, next) => {
    const prodId = req.params.productId;
    product.findById(prodId).then(product=>{
        if(!product) {
            next(new Error('Product not Found'));
        }
        fileHelper.deleteFile(product.imageUrl);
        return Product.deleteOne({ _id:prodId, userId:req.user._id })
    })
    .then(()=>{
        res.status(200).json({message:'Success!'});
    })
    .catch(err =>{
        res.status(500).json({message:'Deleting Product Failed'});
    });
};