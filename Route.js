import express from "express";
import {
        setReqHeaderParams,
        sendResponse,
        UserAuth,
} from "./config/apiconfig.js";
import { Config } from "./config/Init.js";
import _Signup from './api/Authentication/Signup.js'
import _Category from './api/Category/Category.js'
import _FoodItems from "./api/Masters/FoodItems.js"
import _Services from "./api/Masters/Services.js"
import _ContactUs from "./api/Masters/ContactUs.js"
import _Tables from "./api/Masters/Tables.js"
import _AddToCart from "./api/AddToCart/AddToCart.js"
import _Favorite from "./api/Masters/Favorite.js"
import _APIOTP from "./api/Masters/OTP.js"
import _FileUpload from "./api/FileUpload.js"
import _CustomerAction from "./api/Masters/Customer.js"
import _Employees from "./api/Masters/Employees.js"
import _Background from "./api/Masters/Background.js"
import _Dashboard from "./api/Dashboard.js"
import _Menu from "./api/Masters/Menu.js"
import _AboutUs from "./api/Masters/AboutUs.js"

const Apisignup = new _Signup()
const APICategory = new _Category()
const APIFoodItems = new _FoodItems()
const APIServices = new _Services()
const APIContactUs = new _ContactUs()
const APITables = new _Tables()
const AddToCart = new _AddToCart()
const Favorite = new _Favorite()
const APIOTP = new _APIOTP()
const FileUpload = new _FileUpload()
const ApiCustomerAction = new _CustomerAction()
const ApiEmployees = new _Employees()
const ApiBackground = new _Background()
const ApiDashboard = new _Dashboard()
const Menu = new _Menu()
const APIAboutUs = new _AboutUs()

var router = express.Router()
router.all('*', setReqHeaderParams)

/****************************************************** User Auth APIs ******************************************************/
router.get(Config.endpointv1 + '/healthcheck', Apisignup.health)
router.post(Config.endpointv1 + "/getaccesstoken", Apisignup.Getaccesstoken, sendResponse)
router.post(Config.endpointv1 + "/cust/getaccesstoken", Apisignup.CustomerGetaccesstoken, sendResponse)
router.post(Config.endpointv1 + "/register", Apisignup.Register, sendResponse)                  // Only for Customer 
router.post(Config.endpointv1 + "/login", Apisignup.Login, sendResponse)
router.post(Config.endpointv1 + "/logindata", Apisignup.LoginData, sendResponse)
router.post(Config.endpointv1 + "/logout", Apisignup.LogOut, sendResponse)
router.post(Config.endpointv1 + "/admin/login", Apisignup.AdminLogin, sendResponse)
router.post(Config.endpointv1 + "/auth/2fa/verify", Apisignup.VerifyAdmin2FA, sendResponse)
router.post(Config.endpointv1 + "/google/login", Apisignup.GoogleLogin, sendResponse)
router.post(Config.endpointv1 + "/employee/google/login", Apisignup.GoogleLoginEmployee, sendResponse);
router.post(Config.endpointv1 + "/getdevicetoken", Apisignup.GetDeviceToken, sendResponse)
router.post(Config.endpointv1 + "/emp/2fa/setup", UserAuth(), Apisignup.SetupAdmin2FA, sendResponse)
router.post(Config.endpointv1 + "/emp/2fa/enable", UserAuth(), Apisignup.EnableAdmin2FA, sendResponse)
router.post(Config.endpointv1 + "/emp/2fa/disable", UserAuth(), Apisignup.DisableAdmin2FA, sendResponse)

router.post(Config.endpointv1 + "/fetch/emp/data", UserAuth(), Apisignup.FetchEmployeeData, sendResponse)
/****************************************************** User Auth APIs ******************************************************/

/****************************************************** Admin Portal ******************************************************/

router.post(Config.endpointv1 + "/userroles/add", UserAuth(), ApiEmployees.AddUserRole, sendResponse)
router.post(Config.endpointv1 + "/userroles/list", UserAuth(), ApiEmployees.ListUserRoles, sendResponse)
router.post(Config.endpointv1 + "/userroles/update", UserAuth(), ApiEmployees.UpdateUserRole, sendResponse)
router.delete(Config.endpointv1 + "/userroles/delete", UserAuth(), ApiEmployees.RemoveUserRole, sendResponse)

router.post(Config.endpointv1 + "/background/add", UserAuth(), ApiBackground.AddBackground, sendResponse)
router.post(Config.endpointv1 + "/background/list", UserAuth({ required: false }), ApiBackground.ListBackground, sendResponse)
router.post(Config.endpointv1 + "/background/update", UserAuth(), ApiBackground.UpdateBackground, sendResponse)
router.delete(Config.endpointv1 + "/background/delete", UserAuth(), ApiBackground.RemoveBackground, sendResponse)

router.post(Config.endpointv1 + "/employee/add", UserAuth(), ApiEmployees.AddEmployees, sendResponse)
router.post(Config.endpointv1 + "/employee/update", UserAuth(), ApiEmployees.UpdateEmployees, sendResponse)
router.post(Config.endpointv1 + "/employee/list", UserAuth(), ApiEmployees.ListEmployee, sendResponse)
router.post(Config.endpointv1 + "/emp/change/forgot/password", UserAuth(), ApiEmployees.EmpChangeForgotPassword, sendResponse)

router.post(Config.endpointv1 + "/notification/list", UserAuth(), ApiEmployees.ListNotification, sendResponse)
router.post(Config.endpointv1 + "/notification/read", UserAuth(), ApiEmployees.ReadNotification, sendResponse)

router.post(Config.endpointv1 + "/employee/toggle/status", UserAuth(), ApiEmployees.UpdateEmployeeStatus, sendResponse)
router.post(Config.endpointv1 + "/emp/change/theme", UserAuth(), ApiEmployees.UpdateEmployeeTheme, sendResponse)
router.post(Config.endpointv1 + "/emp/update/profile", UserAuth(), ApiEmployees.UpdateProfile, sendResponse)

/****************************************************** Admin Portal ******************************************************/

/****************************************************** Customer Portal ******************************************************/
// Dashboard
router.post(Config.endpointv1 + "/food/tagline", ApiDashboard.HomePageFoodTagLine, sendResponse)


/****************************************************** Customer Portal ******************************************************/
router.post(Config.endpointv1 + "/customer/details", UserAuth(), ApiCustomerAction.ListCustomerDetails, sendResponse)
router.post(Config.endpointv1 + "/customer/list", UserAuth(), ApiCustomerAction.ListCustomer, sendResponse)
router.post(Config.endpointv1 + "/customer/update", UserAuth(), ApiCustomerAction.UpdateCustomerDetails, sendResponse)
router.post(Config.endpointv1 + "/change/forgot/password", /* UserAuth(), */ ApiCustomerAction.ChangeForgotPassword, sendResponse)
router.post(Config.endpointv1 + "/customer/change/password", UserAuth(), ApiCustomerAction.PassWordUpdateSecure, sendResponse)

router.post(Config.endpointv1 + "/category/list", /* UserAuth(), */ APICategory.ListCategories, sendResponse)
router.post(Config.endpointv1 + "/category/add", UserAuth(), APICategory.AddCategories, sendResponse)
router.post(Config.endpointv1 + "/category/update", UserAuth(), APICategory.UpdateCategory, sendResponse)
router.delete(Config.endpointv1 + "/category/remove", UserAuth(), APICategory.RemoveCategory, sendResponse)

router.post(Config.endpointv1 + "/fooditems/list", /* UserAuth(), */ APIFoodItems.ListFoodItemsWithFilters, sendResponse)
router.post(Config.endpointv1 + "/fooditems", APIFoodItems.ListFoodItems, sendResponse)
router.post(Config.endpointv1 + "/fooditems/add", UserAuth(), APIFoodItems.AddFoodItems, sendResponse)
router.post(Config.endpointv1 + "/fooditems/update", UserAuth(), APIFoodItems.UpdateFoodItems, sendResponse)
router.delete(Config.endpointv1 + "/fooditems/remove", UserAuth(), APIFoodItems.RemoveFoodItems, sendResponse)

router.post(Config.endpointv1 + "/services",/*  UserAuth(), */ APIServices.ListServices, sendResponse)
router.post(Config.endpointv1 + "/add/services", UserAuth(), APIServices.AddServices, sendResponse)

router.post(Config.endpointv1 + "/contactus", UserAuth(), APIContactUs.ListContactUs, sendResponse)
router.post(Config.endpointv1 + "/add/contactus", APIContactUs.AddContactUs, sendResponse)
router.post(Config.endpointv1 + "/resolve/contactus", APIContactUs.ResolveContactUs, sendResponse)

router.post(Config.endpointv1 + "/tables/list", UserAuth(), APITables.ListTables, sendResponse)
router.post(Config.endpointv1 + "/table/update", UserAuth(), APITables.UpdateTable, sendResponse)
router.post(Config.endpointv1 + "/table/add", UserAuth(), APITables.AddTables, sendResponse)
router.delete(Config.endpointv1 + "/table/remove", UserAuth(), APITables.RemoveTables, sendResponse)

router.post(Config.endpointv1 + "/free/tables", UserAuth(), APITables.FreeTables, sendResponse)
router.post(Config.endpointv1 + "/table/select", UserAuth(), APITables.BookTable, sendResponse)
router.post(Config.endpointv1 + "/takeawayurl", UserAuth(), APITables.TakeAwayURL, sendResponse)

router.post(Config.endpointv1 + "/addtocart", UserAuth(), AddToCart.InsertAddToCart, sendResponse)
router.post(Config.endpointv1 + "/viewcart", UserAuth(), AddToCart.ViewCart, sendResponse)
router.post(Config.endpointv1 + "/dinein/billing", UserAuth(), AddToCart.DineinBilling, sendResponse)
router.post(Config.endpointv1 + "/dinein/billing/listing", UserAuth(), AddToCart.ListDineinBilling, sendResponse)
router.post(Config.endpointv1 + "/dinein/billing/payment", UserAuth(), AddToCart.CustomerDineinPayment, sendResponse)
router.post(Config.endpointv1 + "/dinein/check/admin/status", UserAuth(), AddToCart.CheckAdminPaymentReceivedStatus, sendResponse)
router.post(Config.endpointv1 + "/list/orders", UserAuth(), AddToCart.ListPendingPayments, sendResponse)                    // For Admin Listing 
router.post(Config.endpointv1 + "/admin/payments/received", UserAuth(), AddToCart.ReceivePendingPayments, sendResponse)                    // For Admin Approve 
router.post(Config.endpointv1 + "/view/previous/orders", UserAuth(), AddToCart.ViewPastOrders, sendResponse)

router.post(Config.endpointv1 + "/order/verify", UserAuth(), AddToCart.VerifyOrder, sendResponse)
router.post(Config.endpointv1 + "/rating/add", UserAuth(), AddToCart.RatingAdd, sendResponse)
router.post(Config.endpointv1 + "/rating", UserAuth(), AddToCart.ListRating, sendResponse)

router.post(Config.endpointv1 + "/favorites/add", UserAuth(), Favorite.AddtoFavorite, sendResponse)
router.post(Config.endpointv1 + "/favorites/list", UserAuth(), Favorite.ListFavorite, sendResponse)
router.delete(Config.endpointv1 + "/favorites/remove", UserAuth(), Favorite.RemoveFavorite, sendResponse)

router.post(Config.endpointv1 + "/menu/add", UserAuth(), Menu.InsertMenu, sendResponse)
router.post(Config.endpointv1 + "/menu/list", UserAuth(), Menu.ListMenu, sendResponse)
router.post(Config.endpointv1 + "/menu/update", UserAuth(), Menu.UpdateMenu, sendResponse)
router.delete(Config.endpointv1 + "/menu/remove", UserAuth(), Menu.RemoveMenu, sendResponse)

router.post(Config.endpointv1 + "/permissions/addupdate", UserAuth(), Menu.AddUpdatePermissions, sendResponse)
router.post(Config.endpointv1 + "/permissions/list", UserAuth(), Menu.ListPermissions, sendResponse)


router.post(Config.endpointv1 + "/send/otp", /* UserAuth(), */ APIOTP.OTPSend, sendResponse)
router.post(Config.endpointv1 + "/admin/send/otp", /* UserAuth(), */ APIOTP.AdminOTPSend, sendResponse)
router.post(Config.endpointv1 + "/verify/otp", /* UserAuth(), */ APIOTP.OTPverify, sendResponse)
router.post(Config.endpointv1 + "/verify/otp/token", /* UserAuth(), */ APIOTP.OTPTokenverify, sendResponse)

router.post(Config.endpointv1 + "/aboutus", /* UserAuth(), */ APIAboutUs.ListAboutUs, sendResponse)


router.post(Config.endpointv1 + "/file/upload", UserAuth(), FileUpload.fileupload, sendResponse)
export default router
