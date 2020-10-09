"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const products_1 = require("../../models/products");
products_1.initializeProductTables().then(() => console.log("Product tables ready."));
router
    .get("/", (req, res) => {
    products_1.getProducts()
        .then(results => res.status(200).json(results))
        .catch(error => res.status(400).json({ msg: error.message }));
})
    .post("/", (req, res) => {
    products_1.createProduct(req.body)
        .then(results => {
        res.status(200).json(results);
    })
        .catch(error => res.status(400).json({ msg: error.message }));
});
module.exports = router;
//# sourceMappingURL=products.js.map