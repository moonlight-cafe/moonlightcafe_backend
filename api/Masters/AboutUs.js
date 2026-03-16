import { Config, Methods, MainDB } from "../../config/Init.js"
import _AboutUs from "../../model/AboutUs.js"

const ObjectId = Methods.getObjectId()
class AboutUs {
        async ListAboutUs(req, res, next) {
                try {
                        // const aboutus = await MainDB.getmenual("tblcafe_aboutus", new _AboutUs(), [{ $match: { isactive: req.body.isactive } }])
                        const aboutus = await MainDB.getmenual("tblcafe_aboutus", new _AboutUs(), [{ $match: {} }, { $sort: { sortby: 1 } }])
                        req.ResponseBody = {
                                status: 200,
                                message: "About Us List",
                                data: aboutus.ResultData
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

export default AboutUs