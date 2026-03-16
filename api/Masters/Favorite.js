import { Config, Methods, MainDB } from "../../config/Init.js"
import _FavoriteModel from "../../model/FavoriteModel.js"
import _FoodItems from "../../model/FoodItems.js"


const ObjectId = Methods.getObjectId()

export default class Favorite {
        async AddtoFavorite(req, res, next) {
                try {
                        const newCart = {
                                customerid: req.body.customerid,
                                foodid: req.body.foodid,
                                foodcode: req.body.foodcode
                        };

                        const check = await MainDB.executedata("i", new _FavoriteModel(), "tblcafe_favorites", newCart);

                        req.ResponseBody = {
                                status: check.status,
                                message: check.status == 200 ? `${req.body.foodname} has been added to your favorites.` : check.message
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

        async ListFavorite(req, res, next) {
                try {
                        const fetchdata = await MainDB.getmenual("tblcafe_favorites", new _FavoriteModel(), [{ $match: { customerid: new ObjectId(req.body.customerid) } }]);
                        const foodids = fetchdata.ResultData.map(id => new ObjectId(id.foodid))
                        const fetchFoodItem = await MainDB.getmenual("tblcafe_fooditems", new _FoodItems(), [{ $match: { _id: { $in: foodids } } }])
                        req.ResponseBody = {
                                status: 200,
                                message: "Cart Inserted successfully",
                                data: fetchFoodItem.ResultData
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

        async RemoveFavorite(req, res, next) {
                try {
                        const deletedata = await MainDB.Delete("tblcafe_favorites", new _FavoriteModel(), { customerid: new ObjectId(req.body.customerid), foodid: new ObjectId(req.body.foodid) });

                        req.ResponseBody = {
                                status: deletedata.status,
                                message: deletedata.status == 200 ? `${req.body.foodname} has been removed from your favorites.` : deletedata.message
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
}