import express from "express";
import {
        setReqHeaderParams,
        sendResponse,
        UserAuth,
} from "./config/apiconfig.js";
import { Config } from "./config/Init.js";
import _Signup from './api/Authentication/Signup.js'
import _Category from './api/Category/Category.js'
import _FoodItems from "./api/FoodItems/FoodItems.js"
import _Services from "./api/Services/Services.js"
import _ContactUs from "./api/ContactUs/ContactUs.js"
import _Tables from "./api/Tables/Tables.js"
import _AddToCart from "./api/AddToCart/AddToCart.js"
import _APIOTP from "./api/OTP/OTP.js"
import _FileUpload from "./api/FileUpload.js"
import _CustomerAction from "./api/CustomerAction/CustomerAction.js"

const Apisignup = new _Signup()
const APICategory = new _Category()
const APIFoodItems = new _FoodItems()
const APIServices = new _Services()
const APIContactUs = new _ContactUs()
const APITables = new _Tables()
const AddToCart = new _AddToCart()
const APIOTP = new _APIOTP()
const FileUpload = new _FileUpload()
const ApiCustomerAction = new _CustomerAction()

var router = express.Router()
router.all('*', setReqHeaderParams)


router.get(Config.endpointv1 + '/healthcheck', Apisignup.health)
router.post(Config.endpointv1 + "/register", Apisignup.Register, sendResponse)
router.post(Config.endpointv1 + "/login", Apisignup.Login, sendResponse)

router.post(Config.endpointv1 + "/customer/details", ApiCustomerAction.ListCustomerDetails, sendResponse)
router.post(Config.endpointv1 + "/customer/update", ApiCustomerAction.UpdateCustomerDetails, sendResponse)

router.post(Config.endpointv1 + "/category", APICategory.ListCategories, sendResponse)
router.post(Config.endpointv1 + "/add/category", APICategory.AddCategories, sendResponse)

router.post(Config.endpointv1 + "/fooditems", APIFoodItems.ListFoodItems, sendResponse)
router.post(Config.endpointv1 + "/add/fooditems", APIFoodItems.AddFoodItems, sendResponse)

router.post(Config.endpointv1 + "/services", APIServices.ListServices, sendResponse)
router.post(Config.endpointv1 + "/add/services", APIServices.AddServices, sendResponse)

router.post(Config.endpointv1 + "/contactus", APIContactUs.ListContactUs, sendResponse)
router.post(Config.endpointv1 + "/add/contactus", APIContactUs.AddContactUs, sendResponse)

router.post(Config.endpointv1 + "/free/tables", APITables.FreeTables, sendResponse)
router.post(Config.endpointv1 + "/add/tables", APITables.AddTables, sendResponse)
router.post(Config.endpointv1 + "/book/table", APITables.BookTable, sendResponse)
router.post(Config.endpointv1 + "/takeawayurl", APITables.TakeAwayURL, sendResponse)

router.post(Config.endpointv1 + "/addtocart", AddToCart.InsertAddToCart, sendResponse)
router.post(Config.endpointv1 + "/viewcart", AddToCart.ViewCart, sendResponse)

router.post(Config.endpointv1 + "/send/otp", APIOTP.OTPSend, sendResponse)
router.post(Config.endpointv1 + "/verify/otp", APIOTP.OTPverify, sendResponse)

router.post(Config.endpointv1 + "/file/upload", FileUpload.fileupload, sendResponse)
export default router
