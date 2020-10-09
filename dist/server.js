"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = express_1.default();
const PORT = 5000;
app.use(express_1.default.json());
app.use('/api/products', require('./routes/api/products'));
app.listen(PORT, () => console.log(`Server ready at port ${PORT}`));
//# sourceMappingURL=server.js.map