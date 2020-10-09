import express from 'express';
const router = express.Router();
import { getProducts, createProduct, initializeProductTables } from '../../models/products';
import { ProductInput } from '../../types/interfaces';

initializeProductTables().then(() => console.log("Product tables ready."))

router
    .get("/", (req, res) => {
        getProducts()
            .then(results => res.status(200).json(results))
            .catch(error => res.status(400).json({msg: error.message}))
    })
    .post("/", (req, res) => {
        createProduct(req.body)
            .then(results => {
                res.status(200).json(results)
            })
            .catch(error => res.status(400).json({msg: error.message}))
    })

module.exports = router;