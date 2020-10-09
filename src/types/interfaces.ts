export interface ProductInput {
    productName: string,
    orderMin?: number,
    description?: string,
    variants: {
        variantName: string,
        options: {
            optionName: string
        }[]
    }[],
    SKUs: {
        SKU: string,
        MSRP: number,
        variantOptionCombinations: {
            variantName: string,
            optionName: string
        }[]
    }[]
};