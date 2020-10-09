import { Pool } from 'pg';
const pool = new Pool({
    user: 'me',
    host: 'localhost',
    database: 'mable',
    password: 'password',
    port: 5432,
});

import { ProductInput } from '../types/interfaces';
    
const createProductTablesQuery = `
    CREATE TABLE IF NOT EXISTS products(
        "productId" INT GENERATED ALWAYS AS IDENTITY,
        "productName" VARCHAR(30) NOT NULL,
        "orderMin" INT,
        "description" TEXT,
        PRIMARY KEY("productId")
    );

    CREATE TABLE IF NOT EXISTS variants(
        "variantId" INT GENERATED ALWAYS AS IDENTITY,
        "variantName" VARCHAR(30),
        "productId" INT,
        PRIMARY KEY("variantId"),
        CONSTRAINT "fkProduct"
            FOREIGN KEY("productId")
                REFERENCES products("productId")
    );

    CREATE TABLE IF NOT EXISTS options(
        "optionId" INT GENERATED ALWAYS AS IDENTITY,
        "optionName" VARCHAR(30),
        "variantId" INT,
        PRIMARY KEY("optionId"),
        CONSTRAINT "fkVariant"
            FOREIGN KEY("variantId")
                REFERENCES variants("variantId")
    );

    CREATE TABLE IF NOT EXISTS SKUs(
        "SKU" VARCHAR(30),
        "MSRP" INT,
        "productId" INT,
        PRIMARY KEY("SKU"),
        CONSTRAINT "fkProduct"
            FOREIGN KEY("productId")
                REFERENCES products("productId")
    );

    CREATE TABLE IF NOT EXISTS variantOptionCombinations(
        "variantOptionCombinationId" INT GENERATED ALWAYS AS IDENTITY,
        "SKU" VARCHAR(30),
        "variantId" INT,
        "optionId" INT,
        PRIMARY KEY("variantOptionCombinationId"),
        CONSTRAINT "fkSKU"
            FOREIGN KEY("SKU")
                REFERENCES SKUs("SKU"),
        CONSTRAINT "fkVariant"
            FOREIGN KEY("variantId")
                REFERENCES variants("variantId"),
        CONSTRAINT "fkOption"
            FOREIGN KEY("optionId")
                REFERENCES options("optionId")
    );
`;

const initializeProductTables = async () => {
    await pool.query(createProductTablesQuery);
}

const getProducts = async () => {
    const outputProducts = []
    const getProductsNoSKUsQuery = `
        WITH allProducts AS (
            SELECT * FROM products
        ), allProductsVariants AS (
            SELECT * FROM allProducts JOIN variants ON allProducts."productId" = variants."productId"
        )

        SELECT * FROM allProductsVariants JOIN options ON allProductsVariants."variantId" = options."variantId";
    `;
    const getProductsSKUsQuery = `
        WITH allProducts AS (
            SELECT * FROM products
        ), allProductsSKUs AS (
            SELECT * FROM allProducts JOIN SKUs ON allProducts."productId" = SKUs."productId"
        ), allProductsSKUsCombos AS (
            SELECT * FROM allProductsSKUs JOIN variantOptionCombinations ON allProductsSKUs."SKU" = variantOptionCombinations."SKU"
        ), allProductsSKUsCombosVariants AS (
            SELECT * FROM allProductsSKUsCombos LEFT JOIN variants ON allProductsSKUsCombos."variantId" = variants."variantId"
        )

        SELECT * FROM allProductsSKUsCombosVariants LEFT JOIN options ON allProductsSKUsCombosVariants."optionId" = options."optionId";
    `;
    try {
        const noSKUsResults = await pool.query(getProductsNoSKUsQuery);
        noSKUsResults.rows.forEach(row => {
            const findOutputProduct = outputProducts.find(product => product.productId == row.productId);
            if (!findOutputProduct) {
                outputProducts.push({
                    productId: row.productId,
                    productName: row.productName,
                    orderMin: row.orderMin,
                    description: row.description,
                    variants: [{
                        variantName: row.variantName,
                        options: [{
                            optionName: row.optionName
                        }]
                    }],
                    SKUs: []
                });
            } else {
                const findOutputVariant = findOutputProduct.variants.find(variant => variant.variantName == row.variantName);
                if (!findOutputVariant) {
                    findOutputProduct.variants.push({
                        variantName: row.variantName,
                        options: [{
                            optionName: row.optionName
                        }]
                    });
                } else {
                    findOutputVariant.options.push({
                        optionName: row.optionName
                    })
                }
            }
        });
        const SKUsResults = await pool.query(getProductsSKUsQuery);
        SKUsResults.rows.forEach(row => {
            const findOutputProduct = outputProducts.find(product => product.productId == row.productId);
            if (!findOutputProduct) {
                throw Error("Product not found for SKU.")
            } else {
                const findOutputSKU = findOutputProduct.SKUs.find(SKU => SKU.SKU == row.SKU);
                if (!findOutputSKU) {
                    findOutputProduct.SKUs.push({
                        SKU: row.SKU,
                        variantOptionCombinations: [{
                            variantName: row.variantName,
                            optionName: row.optionName
                        }]
                    });
                } else {
                    findOutputSKU.variantOptionCombinations.push({
                        variantName: row.variantName,
                        optionName: row.optionName
                    })
                }
            }
        });
        return outputProducts;
    } catch (err) {
        throw err;
    }
    // const getProductsQuery = `
    //     SELECT * FROM products ORDER BY "productId" ASC;
    // `;
    // const getVariantsQuery = productId => `
    //     SELECT * FROM variants WHERE "productId" = '${productId}' ORDER BY "variantId" ASC;
    // `;
    // const getVariantOptionsQuery = variantId => `
    //     SELECT * FROM variantOptions WHERE "variantId" = '${variantId}' ORDER BY "variantOptionId" ASC;
    // `;
    // const getSKUsQuery = productId => `
    //     SELECT * FROM SKUs WHERE "productId" = '${productId}' ORDER BY "SKU" ASC;
    // `;
    // const getVariantOptionCombinationsQuery = SKU => `
    //     SELECT * FROM variantOptionCombinations WHERE "SKU" = '${SKU}' ORDER BY "variantOptionCombinationId" ASC;
    // `;
    // const products = (await pool.query(getProductsQuery)).rows;
    // return products.map(async product => ({
    //     ...product,
    //     variants: (await pool.query(getVariantsQuery(product.productId)).rows).map(async variant => ({
    //         ...variant,
    //         options: (await pool.query(getVariantOptionsQuery(variant.variantId))).rows
    //     })),
    //     SKUs: (await pool.query(getSKUsQuery(product.productId)).rows).map(async SKU => ({
    //         ...SKU,
    //         variantOptionCombinations: (await pool.query(getVariantOptionCombinationsQuery(SKU.SKU))).rows
    //     }))
    // }))
};

const createProduct = async (productInput: ProductInput) => {
    const detectDuplicates = (arr, objectName: string, fieldName: string) => {
        arr.reduce((prev, cur) => {
            if (prev[cur[fieldName]]) {
                console.log(`Cannot have duplicate ${objectName} ${fieldName}s.`)
                throw Error(`Cannot have duplicate ${objectName} ${fieldName}s.`);
            } else {
                prev[cur[fieldName]] = 1;
            }
            return prev;
        }, {});
    };
    const variants = productInput.variants;
    detectDuplicates(variants, 'variant', 'variantName');
    variants.forEach(variant => detectDuplicates(variant.options, 'option', 'optionName'));
    const SKUs = productInput.SKUs;
    detectDuplicates(SKUs, 'SKU', 'SKU');
    SKUs.forEach(SKU => {
        detectDuplicates(SKU.variantOptionCombinations, 'variant-option combo', 'variantName');
        SKU.variantOptionCombinations.forEach(combo => {
            if (!variants.find(variant => variant.variantName == combo.variantName) || 
                       !variants.find(variant => variant.variantName == combo.variantName)
                        .options.find(option => option.optionName == combo.optionName)) {
                throw Error('Variant/option combination not valid.')
            };
        });
    });
    const createProductQuery = `
        START TRANSACTION;
            WITH newProduct AS (
                INSERT INTO products ("productName", "orderMin", "description")
                VALUES (
                    '${productInput.productName}', 
                    ${productInput.orderMin ? "'" + productInput.orderMin + "'" : 'NULL'}, 
                    ${productInput.description ? "'" + productInput.description + "'" : 'NULL'}
                )
                RETURNING *
            ), newVariants AS (
                INSERT INTO variants ("variantName", "productId")
                VALUES ${variants.map(variant => `('${variant.variantName}', (SELECT "productId" FROM newProduct))`).join(', ')}
                RETURNING *
            ), newOptions AS (
                INSERT INTO options ("optionName", "variantId")
                VALUES ${variants.map(variant => variant.options.map(option => `('${option.optionName}', (SELECT "variantId" FROM newVariants WHERE "variantName" = '${variant.variantName}'))`)).join(', ')}
                RETURNING *
            ), newSKUs AS (
                INSERT INTO SKUs ("SKU", "MSRP", "productId")
                VALUES ${SKUs.map(SKU => `('${SKU.SKU}', '${SKU.MSRP}', (SELECT "productId" FROM newProduct))`).join(', ')}
                RETURNING *
            ), newVariantOptionCombinations AS (
                INSERT INTO variantOptionCombinations ("SKU", "variantId", "optionId")
                VALUES ${SKUs.map(SKU => SKU.variantOptionCombinations.map(combo => `('${SKU.SKU}', (SELECT "variantId" FROM newVariants WHERE "variantName" = '${combo.variantName}'), (SELECT "optionId" FROM newOptions WHERE "optionName" = '${combo.optionName}'))`)).join(', ')}
            )
            
            SELECT "productId" FROM newProduct;

        COMMIT TRANSACTION;
    `;
    const productId = (await pool.query(createProductQuery)).find(result => result.command == 'SELECT').rows[0].productId;
    return {productId, ...productInput};
};
    
export { getProducts, createProduct, initializeProductTables };
