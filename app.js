const express = require('express');
const ejs = require('ejs');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');

const app = express();

const db = mysql.createPool({
    host: '',
    user: '',          
    password: '',           
    database: 'ecommerce'
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true }))

app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false
}));

let list = []

function setZero(req,res,next){
    list = []
    next()
}

app.get('/', setZero,(req, res) => {
    const select = 'select * from ecommerce.storage'

    db.query(select, (err, result) => {
        res.render('index', { data: result ,alert:''});
    })

});

app.get('/shop', setZero,(req, res) => {
    res.render('shop')
});

app.get('/cart', (req, res) => {
    const select = 'SELECT * FROM ecommerce.cart'

    db.query(select, (err, result) => {

        if (err) {
            console.error(err)
        }

        res.render('cart', { data: result, lists: [] });
    })
});

app.post('/sell', setZero,(req, res) => {
    const { name, price, img } = req.body

    const select = 'SELECT * FROM ecommerce.storage WHERE name = ?'

    const insert = 'insert into ecommerce.storage (name,price,image) values(?,?,?)'

    db.query(select, [name], (err, result) => {
        if (result.length > 0) {
            res.render('shop')
            return
        }
        db.query(insert, [name, price, img], (err, result) => {
            if (err) {
                console.log(err)
            }
            db.query(select, (err, result) => {
                res.render('shop')
            })
        })
    })
})
app.post('/addCart', setZero ,(req, res) => {
    const { name, price, img } = req.body

    const selectCart = 'SELECT * FROM ecommerce.cart WHERE name = ?'
    const selectStorage = 'select * from ecommerce.storage'

    const insert = 'insert into ecommerce.cart (name,price,image) values(?,?,?)'

    db.query(selectCart, [name], (err, result) => {
        if (result.length > 0) {
            db.query(selectStorage, (err, result) => {
                res.render('index', { data: result , alert: 'This merchantdise already in cart'})
            })
            return
        }
        db.query(insert, [name, price, img], (err, result) => {
            if (err) {
                console.log(err)
            }
            db.query(selectStorage, (err, result) => {
                res.render('index', { data: result ,alert:''})
            })
        })
    })
})

app.post('/buy', (req, res) => {
    const { name, amout, price } = req.body


    const select = 'SELECT * FROM ecommerce.cart'
    db.query(select, (err, result) => {

        if (err) {
            console.error(err)
        }
        const exists = list.find(li => li.name === name);

        if (exists) {
            exists.amout += parseInt(amout)
        }else{
            list.push({ name: name, amout: parseInt(amout) , price: price })
        }


        console.log(list)
        res.render('cart', { data: result, lists: list });
    })
})

app.post('/delete',setZero, (req, res) => {
    const { name } = req.body

    const select = 'SELECT * FROM ecommerce.cart'
    const deletes = 'DELETE FROM ecommerce.cart WHERE name = ?'

    console.log(name)
    db.query(deletes, [name], (err, result) => {

        db.query(select, (err, result) => {
            res.render('cart', { data: result, lists: [] });
        })
    })

})

app.listen(3000, () => {
    console.log('server is running...');
});
