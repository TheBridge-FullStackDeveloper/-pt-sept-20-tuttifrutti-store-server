const router = require('express').Router();

const OrderModel = require('../../models/Orders');
const CartModel = require('../../models/Carts');

const { isAuthenticated } = require('../middlewares/authentication');

router.post('/', [isAuthenticated], async (req, res, next) => {
  try {
    const cart = await CartModel.findOne({ userId: req.user }).populate({
      path: 'productsQuantity.productId',
      select: {
        price: 1,
        brand: 1,
        productName: 1,
        productRef: 1,
        pictures: 1
      }
    });

    const populatedCartProducts = cart
      .get('productsQuantity')
      .map((el) => el.toObject());

    const totalPriceByProduct = populatedCartProducts.map(
      (product) => product.productId.price * product.quantity
    );
    const totalPrice = totalPriceByProduct.reduce(function (a, b) {
      return a + b;
    });

    const result = await OrderModel.create({
      userId: req.user,
      totalPrice: totalPrice,
      state: 'pending-payment',
      productsQuantity: populatedCartProducts
    });

    res.status(200).json({
      success: true,
      data: result
    });

    const cartId = cart._id.toString();
    console.log(cartId);

    CartModel.findByIdAndDelete(cartId, function (err) {
      if (err) console.log(err);
      console.log('Successful deletion');
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:orderId', [isAuthenticated], async (req, res, next) => {
  const { orderId } = req.params;

  try {
    const result = await OrderModel.findById(orderId);

    if (!result) throw new Error('order not found');

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
