import { Config, MainDB, Methods } from "../../config/Init.js"
import _BGImages from "../../model/BGImages.js"

const ObjectId = Methods.getObjectId()
export default class Background {
        async AddBackground(req, res, next) {
                try {
                        let Responsebody = {}
                        const uploadimg = await Methods.fileupload(req.body.file, "background", Methods.generateRandomString(20), "jpg")

                        const data = await MainDB.executedata("i", new _BGImages(), "tblcafe_bgimgs", { url: uploadimg.url })
                        console.log("🚀 ~ Background.js:10 ~ Background ~ AddBackground ~ uploadimg>>", uploadimg);
                        Responsebody.status = data.status
                        Responsebody.message = data.message
                        req.ResponseBody = Responsebody
                        next()
                } catch (error) {
                        req.ResponseBody = {
                                status: 500,
                                message: Config.resstatuscode['500']
                        }
                        next()
                }
        }
        async ListBackground(req, res, next) {
                try {
                        let Responsebody = {}
                        const data = await MainDB.getmenual("tblcafe_bgimgs", new _BGImages(), [{ $match: { status: 1 } }])
                        Responsebody.status = 200
                        Responsebody.message = "Success!"
                        Responsebody.data = data.ResultData
                        req.ResponseBody = Responsebody
                        next()
                } catch (error) {
                        req.ResponseBody = {
                                status: 500,
                                message: Config.resstatuscode['500']
                        }
                        next()
                }
        }
        async UpdateBackground(req, res, next) {
                try {
                        let Responsebody = {}
                        const data = await MainDB.Update("tblcafe_bgimgs", new _BGImages(), [{ _id: new ObjectId(req.body._id) }, { status: req.body.status }])
                        Responsebody.status = data.status
                        Responsebody.message = data.message
                        req.ResponseBody = Responsebody
                        next()
                } catch (error) {
                        req.ResponseBody = {
                                status: 500,
                                message: Config.resstatuscode['500']
                        }
                        next()
                }
        }
        async RemoveBackground(req, res, next) {
                try {
                        let Responsebody = {}
                        const data = await MainDB.executedata("d", new _BGImages(), "tblcafe_bgimgs", [{ _id: new ObjectId(req.body._id) }])
                        Responsebody.status = data.status
                        Responsebody.message = data.message
                        req.ResponseBody = Responsebody
                        next()
                } catch (error) {
                        req.ResponseBody = {
                                status: 500,
                                message: Config.resstatuscode['500']
                        }
                        next()
                }
        }
}