// Единая точка входа: компоненты импортируют всё из '@/validation'.
export { keepUnfixed, type Errors } from './errors';
export { validateLogin, type LoginValues } from './login';
export { validateOrder, type OrderValues } from './order';
export { validateProduct, type ProductValues } from './product';
export { toNumber } from './rules';
