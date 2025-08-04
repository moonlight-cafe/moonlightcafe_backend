import _mongoose from "mongoose";
import dotenv1 from "dotenv";
import jwt from "jsonwebtoken";
import { Config, Methods, MainDB } from "./Init.js";
import _History from "../model/History.js";
import _Logdata from "../model/Logdata.js";
import _Tokenexpiry from "../model/Authentication/Tokenexpiry.js";
import { Worker } from "worker_threads"
import fs from "fs";
import axios from "axios";

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
                        var connectionstring = "mongodb://" + this.DBHost + ":" + this.DBPort + "/" + this.DBName;
                        console.log("🚀 ~ DB.js:50 ~ DB ~ connectDB ~ Config.servermode>>", Config.servermode);
                        // if (Config.servermode == "prod" || Config.servermode == "uat" | Config.servermode == "dev") {
                        //     connectionstring = "mongodb+srv://" + this.DBUser + ":" + this.DBPass + "@" + this.DBHost + "/" + this.DBName
                        // }

                        console.log("🚀 ~ DB.js:51 ~ DB ~ connectDB ~ connectionstring>>", connectionstring);
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
        try {
            var Objres = {};
            var ObjModel;

            const compoundIndex = typeof schema.compoundIndex === 'function' ? schema.compoundIndex() : []

            const { Schema } = _mongoose;
            schema = new Schema(schema);

            //this.mongoose && this.mongoose.models && this.mongoose.models[collection]
            if (this.mongoose.models[collection]) {
                ObjModel = this.mongoose.models[collection];
            } else {
                if (this.mongoose) {
                    schema.set("autoIndex", true);
                    if (compoundIndex.length > 0) {
                        compoundIndex.forEach(element => {
                            schema.index(element, { unique: true })
                        });
                    }
                    ObjModel = this.mongoose.model(collection, schema, collection);
                }
            }

            Objres["objModel"] = ObjModel;
            Objres["collection"] = collection;
            return Objres;
        } catch (e) {
            console.log(" ****************** Start Mongoose Model Error ************************** ");
            console.log("DATABASE INFO", this.DBName, this.DBUser, this.DBHost, this.DBPass, this.DBPort, this.DBConn, this.DBType, this.mongoose);
            console.log(e);
            console.log(" ****************** End Mongoose Model Error ************************** ");
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
                await this.executedata('i', new _History(), 'tblnv_history', HistoryData, false)

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

    async insertlogdata(RequestBody, RequestHeaders, IpAddress, URL, tblname, operation, errorcode, errormsg) {
        try {
            if (this.DBType === "MONGODB") {
                // Page name from URL
                console.log("🚀 ~ DB.js:231 ~ DB ~ insertlogdata ~ URL>>", URL);
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

                var response = await this.executedata('i', new _Logdata(), 'tblnv_log', LogDetails, false)
            }
        }
        catch (e) {
            console.log(e)
        }
    }

    async sendMail(
        usertype,
        emailfrom,
        emailto,
        templateid,
        subject = '',
        data = {},
        files = '',
        bcc = '',
        cc = '',
        sendername = '',
        emailhostid = '',
        attachments = [],
        refdata = {},
        tonames = [],
        igonreActiveAccount = false,
        inReplyTo = "",
        references = [],
        insertApprovalEmail = false,
        insertApprovalEmailData = {}
    ) {
        try {
            const ObjectId = _mongoose.Types.ObjectId;
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

            if (Methods.ValidateObjectId(templateid)) {
                const emailtemplatePipeline = [{ $match: { _id: new ObjectId(templateid) } }];
                const emailtemplateResp = await this.getmenual('tblemailtemplatemaster', new _EmailTemplate(), emailtemplatePipeline);
                template = emailtemplateResp.ResultData[0];
                body = this.createBody(template.body, data);
                bcc = template.bccemails?.toString() || '';
                cc = template.ccemails?.toString() || '';
            } else {
                template = templateid;
                let tempbody = await Methods.getFileContent(template.body, 'utf8');
                body = this.createBody(tempbody, data);
            }

            // SMTP setup
            let transporterdata = {
                pool: false,
                host: "localhost",
                port: 1025,
                secure: false,
                auth: {
                    user: "project.1",
                    pass: "secret.1"
                }
            };

            let mailsmtpPipeline = [{ $match: { default: 1 } }];
            if (emailhostid) {
                mailsmtpPipeline = [{ $match: { _id: new ObjectId(emailhostid) } }];
            } else if (template.emailhostid) {
                mailsmtpPipeline = [{ $match: { _id: template.emailhostid } }];
            }

            transporterdata = {
                service: "gmail",
                host: "...",
                port: 465,
                secure: true,
                auth: {
                    // user: "jainilmithaiwala@gmail.com",
                    // pass: "rerb hqtd zbsc dyig"
                    user: Config.mailid,
                    pass: Config.mailpass
                    // pass: "rlru inif kbwt dsor"
                }
            };
            // const emailSmtpResp = await this.getmenual('tblemailsmtp', new _EmailSMTP(), mailsmtpPipeline);
            // if (emailSmtpResp.ResultData?.length > 0) {
            // transporterdata = {
            //     service: emailSmtpResp.ResultData[0].service,
            //     host: emailSmtpResp.ResultData[0].host,
            //     port: emailSmtpResp.ResultData[0].port,
            //     secure: true,
            //     tls: {
            //         ciphers: 'SSLv3'
            //     },
            //     auth: {
            //         user: emailSmtpResp.ResultData[0].username,
            //         pass: emailSmtpResp.ResultData[0].password
            //     }
            // };
            // }

            const emailtoids = [];
            const emails = [];

            emailto.forEach(id => {
                if (Methods.ValidateObjectId(id.toString())) {
                    emailtoids.push(new ObjectId(id));
                } else {
                    emails.push(id);
                }
            });

            const personPipeline = [
                { $match: { '_id': { "$in": emailtoids } } },
                { $project: { 'Email': 1 } }
            ];

            // const models = {
            //     1: _Employee,
            //     2: _CustomerDetails,
            //     3: _VendorMaster
            // };

            // const collections = {
            //     1: "employees",
            //     2: "tblreg_customerdetail",
            //     3: "tblreg_vendormaster"
            // };

            const workerData = {
                mailemailfrom: emailfrom || (emailSmtpResp.ResultData?.[0]?.email || "local@gmail.com"),
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
                            from: emailfrom || (emailSmtpResp.ResultData?.[0]?.email || "local@local.com"),
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

                        // Optional: Log success
                        // await this.executedata('i', new _EmailLogs(), 'tblemaillog', emaildata);
                    }

                    if (insertApprovalEmail && Object.keys(insertApprovalEmailData).length > 0) {
                        insertApprovalEmailData.message_id = result.message_id;
                        await this.executedata("i", new _Email(), 'tblapprovalemails', insertApprovalEmailData);
                    }
                } else {
                    // Store failed mail log
                    let newdata = {
                        data: {
                            emailfrom: emailfrom || (emailSmtpResp.ResultData?.[0]?.email || "local@local.com"),
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
            resp.status = 200
            resp.message = Config.errmsg['update']
            // return result

        } catch (err) {
            resp.message = Config.errmsg['dberror'] + ' ' + err.toString()
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

    async getjwt(uid, unqkey, exph = "2h") {
        try {
            if (uid && unqkey) {

                var payload = {
                    uid: uid.toString(),
                    unqkey: unqkey
                };

                var signOptions = {
                    expiresIn: exph,
                };

                let data = {
                    unqkey: unqkey,
                    uid: uid.toString(),
                    exp: exph,
                    entry_date: Methods.getdatetimestr(),
                    isvalid: 1,
                    update_date: ''
                }

                try {
                    var t = jwt.sign(payload, process.env.ENCRYPTION_KEY, signOptions);
                } catch (err) {
                    console.error('JWT Error:', err);
                }

                const add = await this.executedata('i', new _Tokenexpiry(), 'tblnv_expiry', data)
                return t;
            }
        } catch (err) {
            console.log(err);
        }
    }

    async validatejwt(token, uid, unqkey, action = '') {
        const errmsg = Config.errmsg

        var resp = {}
        resp.status = 401
        resp.message = errmsg['invalidtoken']
        var id = ''
        try {
            if (uid.includes("guest-")) {
                // checksubdomain = false
            }
            var decoded = jwt.verify(token, process.env.ENCRYPTION_KEY)

            if (decoded.uid === uid && decoded.unqkey === unqkey) {
                const pipeline = [{ $match: { unqkey: unqkey, isvalid: '1' } }]

                var responseData = await this.getmenual('tblnv_expiry', new _Tokenexpiry(), pipeline)

                if (responseData && responseData.ResultData[0]) {
                    id = responseData.ResultData[0]._id
                    resp.status = 200
                    resp.message = errmsg['tokenvalidate']
                } else {
                    resp.autologout = true
                }
            }

        }
        catch (e) {
            resp.message = errmsg['invalidtoken']
            resp.status = 401
            console.log('e :>> ', e);
            if (e instanceof jwt.TokenExpiredError) {
                if (action == '') {
                    unqkey = Methods.generateuuid()
                    resp.key = await this.getjwt(uid, unqkey)
                    resp.unqkey = unqkey
                    resp.message = errmsg['tokenvalidate']
                    resp.status = 200
                }
            } else {
                resp.autologout = true
            }
            if (id) {
                const delResp = await this.executedata('d', new _Tokenexpiry(), 'tblnv_expiry', { _id: id })
            }
        }

        return resp
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

                if (customeFiledOrder.staticOrder) {
                    fieldorder = customeFiledOrder.staticOrder
                } else if (typeof Obj.getFieldOrder === 'function') {
                    fieldorder = Obj.getFieldOrder()
                }

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