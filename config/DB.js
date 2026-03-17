import _mongoose from "mongoose";
import dotenv1 from "dotenv";
import jwt from "jsonwebtoken";
import { Config, Methods, MainDB } from "./Init.js";
import _History from "../model/History.js";
import _Logdata from "../model/Logdata.js";
import _Tokenexpiry from "../model/Authentication/Tokenexpiry.js";
import _Employees from "../model/Employees.js";
import _CustomerDetails from "../model/CustomerDetails/CustomerDetails.js";
import { Worker } from "worker_threads"
import fs from "fs";
import _ from 'lodash';
import _FireBaseToken from "../model/FireBaseToken.js"
import firebaseAdminobj from "../config/firebase.js";
import _Notification from '../model/Notification.js';

var privateKEY = fs.readFileSync("./config/private.key", "utf8");
var publicKEY = fs.readFileSync("./config/public.key", "utf8");

dotenv1.config({ path: ".env" });

var _URL
var _RequestBody
var _RequestHeaders
var _IpAddress

class DB {
    constructor() {
        var DBName;
        var DBUser;
        var DBHost;
        var DBPass;
        var DBPort;
        var DBConn;
        var DBType;
        var mongoose;

        this.DBType = "MONGODB";
        this.DBName = process.env.MONGODB_DBNAME;
        this.DBHost = process.env.MONGODB_HOST;
        this.DBPort = process.env.MONGODB_PORT;
        this.DBUser = process.env.MONGODB_USER;
        this.DBPass = process.env.MONGODB_PASS;
    }

    Connect() {
        // const errmsg = Config.errmsg
        try {
            let check = _mongoose.connections.map(function (s) {
                return s.name;
            }).includes(this.DBName);

            if (this.DBType == "MONGODB" && this.DBName && this.DBHost && !check) {
                const connectDB = async () => {
                    try {
                        // var connectionstring = "mongodb://" + this.DBHost + ":" + this.DBPort + "/" + this.DBName;
                        // if (Config.servermode == "prod" || Config.servermode == "uat" | Config.servermode == "dev") {
                        let connectionstring = "mongodb+srv://" + this.DBUser + ":" + this.DBPass + "@" + this.DBHost + "/" + this.DBName
                        // }

                        this.mongoose = _mongoose.createConnection(connectionstring, {
                            // useNewUrlParser: true,
                            // useUnifiedTopology: true,
                            retryWrites: true,
                            readPreference: "nearest"
                        });
                        this.mongoose.set("runValidators", true);

                        console.log("CONNECTION COUNT: " + _mongoose.connections.length + "  MONGODB CONNECTED TO: " + this.DBName);
                    } catch (err) {
                        console.log("Failed to connect to MongoDB", err);
                    }
                };
                connectDB();
            }
        } catch (e) {
            console.log(e);
        }
    }

    createmodel(collection, schema) {
        // Swap parameters if they're in wrong order (defensive programming)
        if (typeof collection === 'object' && typeof schema === 'string') {
            [collection, schema] = [schema, collection];
        }


        try {
            var Objres = {};
            var ObjModel;

            // Check if model already exists
            if (this.mongoose.models[collection]) {
                ObjModel = this.mongoose.models[collection];
                Objres["objModel"] = ObjModel;
                Objres["collection"] = collection;
                return Objres;
            }

            // Extract compound index if it exists
            const compoundIndex = typeof schema.compoundIndex === 'function'
                ? schema.compoundIndex()
                : [];

            // Create schema - only once!
            const mongooseSchema = new _mongoose.Schema(schema, {
                timestamps: true
            });

            // Set auto-indexing
            mongooseSchema.set("autoIndex", true);

            // Add compound indexes
            if (compoundIndex.length > 0) {
                compoundIndex.forEach(element => {
                    mongooseSchema.index(element, { unique: true });
                });
            }

            // Create the model
            ObjModel = this.mongoose.model(collection, mongooseSchema, collection);

            Objres["objModel"] = ObjModel;
            Objres["collection"] = collection;
            return Objres;

        } catch (e) {
            console.log(" ****************** Start Mongoose Model Error ************************** ");
            console.log("DATABASE INFO", this.DBName, this.DBUser, this.DBHost, this.DBPass, this.DBPort, this.DBConn, this.DBType, this.mongoose);
            console.log(e);
            console.log(" ****************** End Mongoose Model Error ************************** ");

            // Return error object instead of undefined
            return {
                objModel: null,
                collection: collection,
                error: e.message
            };
        }
    }

    async puthistory(RequestBody, RequestHeaders, IpAddress, URL) {
        try {

            if (this.DBType === "MONGODB") {

                _RequestBody = RequestBody
                _RequestHeaders = RequestHeaders
                _IpAddress = IpAddress
                // this._URL=URL
                _URL = URL
                var HistoryData = {}
                HistoryData.ipaddress = IpAddress
                HistoryData.platform = RequestHeaders['user-agent']
                HistoryData.datetime = Methods.GetTimestamp()
                HistoryData.body = RequestBody
                HistoryData.headers = RequestHeaders
                HistoryData.url = URL
                await this.executedata('i', new _History(), 'tblcafe_history', HistoryData, false)

            }
        }
        catch (e) {
            console.log(e)
        }
        /*-------------End History Table data insert ------------- */
    }

    async executedata(operation, SchemaClassObj, CollectionName, data, insertlog = true, dependency = []) // operation=i,u,d  ObjModel=table name    data=array of data  extra= extra id parameter with value, 
    {

        const ObjectId = _mongoose.Types.ObjectId

        var resp = {
            'status': 400,
            'message': Config.errmsg['dberror']
        }

        try {

            const ObjModel = this.createmodel(CollectionName, SchemaClassObj)



            if (this.DBType == 'MONGODB') {
                if (operation == 'i') {
                    var DataInsert = new ObjModel['objModel'](data)

                    const err = DataInsert.validateSync()

                    if (err) {
                        throw err
                    }
                    else {
                        resp.data = await DataInsert.save()
                        resp.status = 200
                        resp.message = Config.errmsg['insert']
                    }
                }
                else if (operation == 'u') {
                    const updateResp = await ObjModel['objModel'].findByIdAndUpdate(new ObjectId(data._id), data, { runValidators: true, new: true })
                    resp.data = updateResp
                    resp.status = 200
                    resp.message = Config.errmsg['update']
                }
                else if (operation == 'd') {
                    // check in dependancy variable 
                    var check = null
                    if (dependency.length) {
                        for (var i = 0; i < dependency.length; i++) {
                            check = await dependency[i][0].findOne(dependency[i][1])
                            if (check) {
                                break
                            }
                        }
                    }
                    if (!check) {
                        var DataDelete = await ObjModel['objModel'].findByIdAndDelete(data)
                        if (DataDelete == null) {
                            resp.status = 200
                            resp.message = Config.errmsg['notexist']
                        }
                        else {
                            resp.status = 200
                            resp.data = DataDelete
                            resp.message = Config.errmsg['delete']
                        }
                    }
                    else {
                        resp.status = 401
                        resp.message = Config.errmsg['inuse']
                    }
                }
            }
        }
        catch (err) {
            resp.message = Config.errmsg['dberror'] + ' ' + err.toString()
            resp.status = 400

            // Duplicate Data Error
            if (err.code === 11000) {
                resp.message = `The ${Object.keys(err.keyValue).map(val => Config.uniquekeymsg[val]).toString()} is already exist in records.`
                resp.status = 409
            }
            // Requiredfield Error
            else if (err.name === 'ValidationError') {
                resp.message = Object.values(err.errors).map(val => val.message).join(', ')
                resp.status = 400
            }
        }

        // if (insertlog == true) {
        //     this.insertlogdata(_RequestBody, _RequestHeaders, _IpAddress, _URL, CollectionName, operation, resp.status, resp.message)
        // }

        return resp
    }

    async InsertMany(CollectionName, SchemaClassObj, data) {
        var resp = {
            'status': 400,
            'message': Config.errmsg['dberror']
        }
        try {
            if (this.DBType == 'MONGODB') {

                const ObjSchemaModel = this.createmodel(CollectionName, SchemaClassObj)
                const result = await ObjSchemaModel['objModel'].insertMany(data).catch(function (error) {
                    console.log(error)      // Failure
                });

                resp.status = 200
                resp.message = Config.errmsg['insert']
            }

        }
        catch (err) {
            console.log(err)
            resp.message = Config.errmsg['dberror'] + ' ' + err.toString()
            resp.status = 400

            // Duplicate Data Error
            if (err.code === 11000) {
                resp.message = errmsg['isexist']
                resp.status = 409
            }

            // Requiredfield Error
            else if (err.name === 'ValidationError') {
                resp.message = Object.values(err.errors).map(val => val.message).toString()
                //resp.message=errmsg['required']
                resp.status = 400
            }
        }

        return resp
    }

    async insertlogdata(RequestBody, RequestHeaders, IpAddress, URL, tblname, operation, errorcode, errormsg) {
        try {
            if (this.DBType === "MONGODB") {
                // Page name from URL
                var PageName = URL.split("/")

                var page = PageName[PageName.length - 1]

                var useragent = RequestHeaders['user-agent']

                var LogDetails = {}
                LogDetails.tblname = tblname
                LogDetails.dataary = 'Body : ' + Methods.Jsontostring(RequestBody) + ' Headers : ' + Methods.Jsontostring(RequestHeaders)
                LogDetails.operation = operation
                LogDetails.errorcode = errorcode
                LogDetails.errormsg = errormsg
                LogDetails.pagename = page
                LogDetails.platform = useragent
                LogDetails.cmpname = 'Note Verse'
                LogDetails.ipaddress = IpAddress
                LogDetails.logdatetime = Methods.getdatetimestr()

                var response = await this.executedata('i', new _Logdata(), 'tblcafe_log', LogDetails, false)
            }
        }
        catch (e) {
            console.log(e)
        }
    }

    async sendNotifications({ tousers, payload }) {
        const tokens = await this.getDeviceTokens({ userids: tousers })
        console.log('tokens :>> ', tokens)
        await this.InsertNotification(payload, tousers)
        await this.sendPushNotification(tokens, payload.title, payload.body, payload)
    }

    async InsertNotification(payload, tousers) {
        var notificationData = [];
        tousers.forEach(function (user) {
            let insert = {
                title: payload.title,
                body: payload.body,
                type: payload.type,
                typeid: payload.typeid,
                pagename: payload.pagename,
                arguments: payload?.arguments ?? null,
                receiverid: user,
                status: 1,
                time: new Date(),
                sid: payload.sid ? payload.sid : "",
                read: 0,
                clickaction: payload.clickaction,
                clickflag: payload.clickflag,
                actionname: payload.actionname,
                iconimage: payload.iconimage,
                notificationcolor: payload.notificationcolor
            };
            notificationData.push(insert);
        });
        const resp = await this.InsertMany("tblcafe_notification", new _Notification(), notificationData);
        return resp;
    }

    async getDeviceTokens({ userids }) {
        if (!userids?.length) return []

        const pipeline = [
            {
                $match: {
                    uid: { $in: userids }, // STRING MATCH
                    isexpired: 0
                }
            },
            {
                $group: {
                    _id: null,
                    tokens: { $addToSet: "$token" }
                }
            }
        ]

        try {
            const resp = await MainDB.getmenual(
                "tblcafe_firebasetoken",
                new _FireBaseToken(),
                pipeline
            )

            return resp?.ResultData?.[0]?.tokens || []
        } catch (err) {
            console.error("getDeviceTokens error:", err)
            return []
        }
    }

    async sendPushNotification(tokens, title, body, data = {}) {
        try {
            var result;
            const chunks = _.chunk(tokens, 500);
            const promise = chunks.map(async function (tokenchunk) {
                const payload = {
                    tokens: tokenchunk,
                    title: title,
                    body: body,
                    data: data,
                };
                result = await firebaseAdminobj.sendMulticastNotification(payload);
            });
            await Promise.all(promise);
            return result;
        } catch (e) {
            console.log(e);
        }
    }

    async sendMail(emailfrom, emailto, templateid, subject = '', data = {}, files = '', bcc = '', cc = '', sendername = '', emailhostid = '', attachments = [], refdata = {}, tonames = [], igonreActiveAccount = false, inReplyTo = "", references = [], insertApprovalEmail = false, insertApprovalEmailData = {}) {
        try {
            let requestedpersonid = "";

            if (data?.requestedpersonid) {
                requestedpersonid = data.requestedpersonid;
                delete data.requestedpersonid;
            }

            if (!requestedpersonid && refdata?.recordinfo?.entryuid) {
                requestedpersonid = refdata.recordinfo.entryuid;
            }

            let template;
            let body;

            template = templateid;
            let tempbody = await Methods.getFileContent(template.body, 'utf8');
            body = this.createBody(tempbody, data);

            let transporterdata = {
                service: "gmail",
                host: "...",
                port: 465,
                secure: true,
                tls: {
                    ciphers: 'SSLv3'
                },
                auth: {
                    user: Config.mailid,
                    pass: Config.mailpass
                }
            };

            const emails = [];

            emailto.forEach(id => {
                emails.push(id);
            });

            const workerData = {
                mailemailfrom: emailfrom,
                to: emails,
                mailsubject: subject || template.subject,
                text: "",
                html: body,
                mailattachments: attachments,
                mailbcc: bcc,
                mailcc: cc,
                mytransporterdata: transporterdata,
                requestedpersonid: requestedpersonid,
            };

            if (!Methods.checkForNullValues(inReplyTo)) {
                workerData.inReplyTo = inReplyTo;
            }

            if (Array.isArray(references) && references.length > 0) {
                workerData.references = references;
            }

            const worker = new Worker("./workers/sendmail.js", {
                workerData
            });

            worker.once("message", async result => {
                if (result?.status === "pass") {
                    if (Object.keys(refdata).length > 0) {
                        let emaildata = {
                            from: emailfrom,
                            datetime: Methods.getdatetimeisostr(),
                            to: emails,
                            subject: subject || template.subject,
                            body: body,
                            bcc: bcc,
                            cc: cc,
                            host: transporterdata.host,
                            port: transporterdata.port,
                            type: refdata.type,
                            tonames: tonames,
                            recordinfo: refdata.recordinfo
                        };

                        delete refdata.recordinfo;

                        let adddata = { ...refdata, ...data };
                        emaildata.refdata = adddata;
                    }

                    if (insertApprovalEmail && Object.keys(insertApprovalEmailData).length > 0) {
                        insertApprovalEmailData.message_id = result.message_id;
                        await this.executedata("i", new _Email(), 'tblapprovalemails', insertApprovalEmailData);
                    }
                } else {
                    // Store failed mail log
                    let newdata = {
                        data: {
                            emailfrom: emailfrom,
                            emailto: emailto,
                            templateid: templateid,
                            subject: subject || template.subject,
                            data: data,
                            body: body,
                            files: files,
                            bcc: bcc,
                            cc: cc,
                            sendername: sendername,
                            emailhostid: emailhostid,
                            attachments: attachments,
                            refdata: refdata,
                            toname: tonames,
                        }
                    };

                    // Optional: Log failure
                    // await this.executedata('i', new _FailMailRecord(), 'tblfailmailrecord', newdata);

                    return result;
                }

                worker.terminate();
            });

            worker.on("error", error => {
                console.error("Worker Error:", error);
                worker.terminate();
            });

            worker.on("exit", exitCode => {
                console.log("Worker exited with code:", exitCode);
                worker.terminate();
            });

        } catch (e) {
            console.error("sendMail error:", e);
        }
    }

    createBody(body, data) {
        let startIndex = 0
        let result = []
        for (let strchar = 0; strchar <= body.length; strchar++) {
            if (body.charAt(strchar) === '#') {
                startIndex = strchar
            }
            else if (body.charAt(strchar) === '?') {
                result.push(body.substring(
                    parseInt(startIndex),
                    parseInt(strchar) + 1
                ))
            }
        }

        for (let i = -0; i < result.length; i++) {
            body = body.replaceAll(result[i], data[result[i].substring(1, result[i].length - 1)])
        }

        return body
    }

    async Update(CollectionName, SchemaClassObj, pipeline, options = {}, insertlog = false) {

        var resp = {
            'status': 400,
            'message': Config.errmsg['dberror']
        }

        try {
            const ObjSchemaModel = this.createmodel(CollectionName, SchemaClassObj)
            const result = await ObjSchemaModel['objModel'].updateOne(pipeline[0], pipeline[1], options)
            const updatedata = await ObjSchemaModel['objModel'].aggregate([{ $match: pipeline[0] }])

            resp.status = 200
            resp.message = Config.errmsg['update']
            resp.data = updatedata[0]
        } catch (err) {
            resp.message = Config.errmsg['error'] + ' ' + err.toString()
            resp.status = 400

            // Duplicate Data Error
            if (err.code === 11000) {
                console.log(err)
                resp.message = Config.errmsg['isexist']
                resp.status = 409
            }
            // Required field Error
            else if (err.name === 'ValidationError') {
                resp.message = Object.values(err.errors).map(val => val.message).toString()
                //resp.message=Config.errmsg['required']
                resp.status = 400
            }
        }

        if (insertlog == true) {
            //insert Logs of Operation 
            this.insertlogdata(_RequestBody, _RequestHeaders, _IpAddress, _URL, CollectionName, 'u', resp.status, resp.message)
        }

        return resp
    }

    async Delete(CollectionName, SchemaClassObj, filter, options = {}, insertlog = false) {

        var resp = {
            'status': 400,
            'message': Config.errmsg['dberror']
        }

        try {
            const ObjSchemaModel = this.createmodel(CollectionName, SchemaClassObj)
            const result = await ObjSchemaModel['objModel'].deleteOne(filter, options)
            resp.status = 200
            resp.message = Config.errmsg['delete']
            // return result

        } catch (err) {
            resp.message = Config.errmsg['dberror'] + ' ' + err.toString()
            resp.status = 400

            // In case of ValidationError (though unlikely in delete)
            if (err.name === 'ValidationError') {
                resp.message = Object.values(err.errors).map(val => val.message).toString()
                resp.status = 400
            }
        }

        if (insertlog == true) {
            //insert Logs of Operation 
            this.insertlogdata(_RequestBody, _RequestHeaders, _IpAddress, _URL, CollectionName, 'd', resp.status, resp.message)
        }

        return resp
    }


    async UpdateMany(CollectionName, SchemaClassObj, pipeline) {
        const ObjSchemaModel = await this.createmodel(CollectionName, SchemaClassObj)
        const result = await ObjSchemaModel['objModel'].updateMany(pipeline[0], pipeline[1])

        return result
    }

    async DeleteMany(CollectionName, SchemaClassObj, pipeline) {
        var resp = {
            'status': 400,
            'message': Config.errmsg['dberror']
        }

        try {
            if (this.DBType == 'MONGODB') {
                const ObjSchemaModel = await this.createmodel(CollectionName, SchemaClassObj)
                await ObjSchemaModel['objModel'].deleteMany(pipeline)

                resp.status = 200
                resp.message = Config.errmsg['delete']
            }

        }
        catch (err) {
            resp.message = Config.errmsg['dberror'] + ' ' + err.toString()
            resp.status = 400
        }

        return resp
    }

    async getjwt(uid, unqkey, iss, useragent, aud, exph = "8h") {

        try {
            if (iss && uid && unqkey && useragent) {
                // PAYLOAD
                var payload = {
                    uid: uid,
                    unqkey: unqkey,
                    useragent: useragent,
                };

                // SIGNING OPTIONS
                var signOptions = {
                    issuer: iss,
                    audience: aud, // Audience
                    expiresIn: exph,
                    algorithm: "RS256",
                };
                var token = jwt.sign(payload, privateKEY, signOptions);


                let data = {
                    unqkey: unqkey,
                    uid: uid,
                    iss: iss,
                    useragent: useragent,
                    exp: exph,
                    entry_date: Methods.getdatetimestr(),
                    isvalid: 1,
                    token: token
                }
                // let tokenexpiry = Object.assign(new _Tokenexpiry(), data)
                const chk = await this.executedata('i', new _Tokenexpiry(), 'tblcafe_tokens', data)

                return token;
            }
        } catch (err) {
            console.log(err);
        }
    }

    async authanticateuser(token, uid, unqkey) {
        try {
            //VALIDATE TOKEN
            var resp = await this.validatejwt(token, uid, unqkey);
            //TOKEN VALIDATED
            if (resp.status == 200) {
                const errmsg = Config.errmsg;

                if (uid.includes("guest-") !== false) {
                    //For Guest User Without login
                    resp.status = 200;
                    resp.message = errmsg["uservalidate"];
                } else {
                    const ObjectId = Methods.getObjectId()

                    const pipeline = [{ $match: { "_id": new ObjectId(uid) } }]
                    const person = await this.getmenual('tblcafe_employees', new _Employees(), pipeline)
                    const user = await MainDB.getmenual("tblcafe_customerdetails", new _CustomerDetails(), pipeline)
                    //VALIDATE USERROLE ID
                    if (person.ResultData.length > 0 || user.ResultData.length > 0) {
                        resp.status = 200
                        resp.message = errmsg['uservalidate']
                    }
                }
            }

            return resp;
        } catch (err) {
            console.log(err);
        }
    }

    async validatejwt(token, uid, unqkey) {
        try {
            if (!token) {
                return { status: 401, message: "Token missing" };
            }

            // ✅ Strip out "Bearer " if present
            if (token.startsWith("Bearer ")) {
                token = token.split(" ")[1];
            }

            let decoded;
            try {
                decoded = jwt.verify(token, publicKEY, { algorithms: ["RS256"] });
            } catch (err) {
                console.log("❌ JWT verification failed:", err);
                if (err.name === "TokenExpiredError") {
                    return { status: 401, message: "Token expired" };
                }
                return { status: 401, message: "Invalid token" };
            }

            // 🔍 Validate required fields match


            if (!decoded || decoded.uid !== uid || decoded.unqkey !== unqkey) {
                return { status: 401, message: "Token user mismatch" };
            }
            const expipipeline = [{ $match: { unqkey: unqkey, uid: uid.toString(), isvalid: 1 } }]

            const tokenRecord = await this.getmenual("tblcafe_tokens", new _Tokenexpiry(), expipipeline);

            if (!tokenRecord.ResultData.length) {
                return { status: 401, message: "Token invalid or revoked" };
            }

            return {
                status: 200,
                message: "Token valid",
                key: token,
                unqkey: decoded.unqkey,
            };
        } catch (err) {
            console.error("validatejwt Error:", err);
            return { status: 500, message: "Internal Server Error", error: err.message };
        }
    }

    async TokenExpireforLogout(token, uid, unqkey) {
        try {
            const tokenRecord = await this.Update("tblcafe_tokens", new _Tokenexpiry(), [{ token: token, uid: uid, unqkey: unqkey }, { isvalid: 0 }]);
            if (tokenRecord.status == 200) {
                return true
            }
            return false
        } catch (error) {
            return error
        }

    }

    async getmenual(CollectionName, SchemaClassObj, pipeline, requiredPage = {}, sort = {}, fieldorder = false, projection = {}, customeFiledOrder = {}, internalCall = false,) {
        try {
            const ObjSchemaModel = await this.createmodel(CollectionName, SchemaClassObj)
            var ResultData
            var ResponseData = {}
            var currentpage = 0
            var nextpage = 0
            var Documents = 0

            var countPipeline = [...pipeline]
            countPipeline.push({ $count: "doccount" })

            if (Object.keys(projection).length !== 0) {
                pipeline.push({
                    '$project': projection
                })
            }
            if (Object.keys(sort).length !== 0) {
                pipeline.push({
                    "$sort": sort
                })
            }

            if (Object.keys(requiredPage).length !== 0) {

                currentpage = requiredPage.pageno
                pipeline.push(
                    {
                        "$limit": requiredPage.pagelimit + requiredPage.skip
                    },
                    {
                        "$skip": requiredPage.skip
                    },
                )

                ResultData = await ObjSchemaModel['objModel'].aggregate(pipeline).collation({ locale: "en", strength: 1 }).allowDiskUse(true);

                const countDoc = await ObjSchemaModel['objModel'].aggregate(countPipeline)
                if (countDoc && countDoc[0] && countDoc[0].doccount) {
                    Documents = countDoc[0].doccount
                }

                var totalPage = Math.ceil(Documents / requiredPage.pagelimit)
                if (totalPage > currentpage)
                    nextpage = 1
            }
            else {
                ResultData = await ObjSchemaModel['objModel'].aggregate(pipeline)
            }

            // get data 
            var fieldorderdata = 0

            if (fieldorder) {

                const ObjSchemaModelOrder = this.createmodel('tblfieldorder', new _FieldOrder())
                let fieldpage = customeFiledOrder.pagename ? customeFiledOrder.pagename : CollectionName

                fieldorderdata = await ObjSchemaModelOrder['objModel'].findOne({ 'userid': RequestHeaders.uid, 'pagename': fieldpage }, { '_id': 0, 'fields': '$fields' })

                //new addon
                const Obj = SchemaClassObj
                var fieldorder

                // if (customeFiledOrder.staticOrder) {
                //     fieldorder = customeFiledOrder.staticOrder
                // } else if (typeof Obj.getFieldOrder === 'function') {
                //     fieldorder = Obj.getFieldOrder()
                // }

                var updatedFields = []

                //if static has field add

                if (fieldorderdata && fieldorder && fieldorder.fields) {
                    fieldorderdata.fields.map(function (o) {
                        let staticField = fieldorder.fields.find(k => k.field == o.field)
                        if (staticField) {
                            staticField.active = o.active
                            updatedFields.push(staticField)
                        }
                    })
                }


                // if(fieldorderdata && fieldorder && fieldorder.fields){
                // 	fieldorderdata.fields.map(function(o){
                // 		let staticField = fieldorder.fields.find(k=>k.field == o.field)
                // 		if(staticField){
                // 			staticField.active = o.active
                // 			updatedFields.push(o)
                // 		}
                // 	})
                // }

                //add from static if not exist on data
                if (fieldorder && fieldorder.fields) {
                    fieldorder.fields.map(function (o) {
                        let staticField
                        if (fieldorderdata) { staticField = fieldorderdata.fields.find(k => k.field == o.field) }
                        if (staticField) { } else {
                            updatedFields.push(o)
                        }
                    })
                }

                //freezed fields first
                updatedFields.sort(function (a, b) { return b.freeze - a.freeze })
                fieldorderdata = { fields: updatedFields }
            }


            // ResponseData.fromdb = this.DBName
            ResponseData.ResultData = ResultData
            ResponseData.currentpage = currentpage
            ResponseData.nextpage = nextpage
            ResponseData.totaldocs = Documents
            ResponseData.fieldorderdata = fieldorderdata

            return ResponseData

        } catch (err) {
            console.log(err);

            return {
                ResultData: [],
                currentpage: 0,
                nextpage: 0
            }
        }

    }

    async FindOne(CollectionName, SchemaClassObj, pipeline, projection = {}) {
        const ObjSchemaModel = await this.createmodel(CollectionName, SchemaClassObj);

        // If projection is empty, don't apply it (i.e., return all fields)
        const projectionQuery = Object.keys(projection).length ? projection : null;

        var ResultData = await ObjSchemaModel['objModel']
            .findOne(pipeline)
            .collation({ locale: "en", strength: 1 })
            .select(projectionQuery);  // Apply projection if provided, otherwise return all fields

        return ResultData;
    }

    async CheckEmpExsist(body) {
        try {
            const ObjectId = Methods.getObjectId()
            const match = {
                $or: [
                    { email: body.email },
                    { number: body.number }
                ]
            };

            // Exclude current employee during update
            if (body?._id) {
                match._id = { $ne: new ObjectId(body._id) };
            }

            const chkdata = await MainDB.getmenual(
                "tblcafe_employees",
                new _Employees(),
                [{ $match: match }]
            );

            if (chkdata.ResultData.length) {
                const emailExists = chkdata.ResultData.some(
                    emp => emp.email === body.email
                );

                const numberExists = chkdata.ResultData.some(
                    emp => emp.number === body.number
                );

                if (emailExists) {
                    return {
                        status: 400,
                        message: "Please use a different email"
                    };
                }

                if (numberExists) {
                    return {
                        status: 400,
                        message: "Please use a different number"
                    };
                }
            }

            return {
                status: 200,
                message: Config.resstatuscode["200"]
            };

        } catch (error) {
            console.error("CheckEmpExsist Error:", error);
            return {
                status: 500,
                message: Config.resstatuscode["500"]
            };
        }
    }

    getDBName() {
        return this.DBName;
    }
    getDBUser() {
        return this.DBUser;
    }
    getDBHost() {
        return this.DBHost;
    }
    getDBPass() {
        return this.DBPass;
    }
    getDBPort() {
        return this.DBPort;
    }
    getDBType() {
        return this.DBType;
    }
    getDBConn() {
        return this.DBConn;
    }

    setDBName(DBName) {
        this.DBName = DBName;
    }
    setDBUser(DBUser) {
        this.DBUser = DBUser;
    }
    setDBHost(DBHost) {
        this.DBHost = DBHost;
    }
    setDBPass(DBPass) {
        this.DBPass = DBPass;
    }
    setDBPort(DBPort) {
        this.DBPort = DBPort;
    }
    setDBType(DBType) {
        this.DBType = DBType;
    }
    setDBConn(DBConn) {
        this.DBConn = DBConn;
    }
}

export default DB;