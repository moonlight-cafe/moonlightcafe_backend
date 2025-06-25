import { Config, Methods, MainDB } from "../../config/Init.js"
import _AddToCart from "../../model/AddToCart.js"

const ObjectId = Methods.getObjectId()
class AddToCart {
        async InsertAddToCart(req, res, next) {
                try {
                        const newCart = {
                                customerid: req.body.customerid,
                                data: req.body.data,
                                totalamount: req.body.totalamount,
                                includetip: req.body.includetip,
                                tipamount: req.body.tipamount,
                                create_at: new Date().toISOString(),
                                updated_at: new Date().toISOString(),
                        };

                        await MainDB.executedata("i", new _AddToCart(), "tblcafe_tempcart", newCart);

                        req.ResponseBody = {
                                status: 200,
                                message: "Cart Inserted successfully"
                        };
                        next();

                } catch (err) {
                        console.error("Error: ", err);
                        req.ResponseBody = {
                                status: 500,
                                message: Config.resstatuscode['500']
                        }
                        next()
                }
        }

        async ViewCart(req, res, next) {
                try {
                        const data = await MainDB.getmenual("tblcafe_tempcart",
                                new _AddToCart(),
                                [
                                        { $match: { customerid: new ObjectId(req.body.customerid) } },
                                        { $sort: { _id: -1 } }
                                ])
                        req.ResponseBody = {
                                status: 200,
                                message: "View Cart",
                                data: data.ResultData
                        }
                        next()
                } catch (err) {
                        console.error("Error: ", err);
                        req.ResponseBody = {
                                status: 500,
                                message: Config.resstatuscode['500']
                        }
                        next()
                }
        }
}

export default AddToCart