import { Config, Methods, MainDB, RecordInfo } from "./Init.js";
import _PaginationInfo from "./PaginationInfo.js";

export var RequestBody;
export var RequestHeaders;
export var ResponseBody = {};
export var ResponseHeaders = {};
export var IpAddress;
export var URL;
export var PaginationInfo;

export async function setReqHeaderParams(req, res, next) {
        try {
                var route = req.url.replace(Config.endpointv1, "");

                if (Config.dataencryption == true) {
                        if (req.body.reqbody) {
                                let tmpKey = req.body.reqbody.split(".")[1];
                                req.body = Methods.decryptData(
                                        req.body.reqbody.split(".")[0],
                                        tmpKey
                                );
                        }

                        if (req.headers.reqheader) {
                                let tmpKey = req.headers.reqheader.split(".")[1];
                                let headerKeys = Methods.decryptData(
                                        req.headers.reqheader.split(".")[0],
                                        tmpKey
                                );
                                req.headers = { ...req.headers, ...headerKeys };
                                delete req.headers.reqheader;
                        }
                }

                // if (Config.getPageName()[route]) {
                //     let pagename = Config.getPageName()[route].pagename;
                //     let action = Config.getPageName()[route].action;
                //     req.headers.pagename = pagename;
                //     req.headers.useraction = action;
                // }

                if (
                        !req.headers.version ||
                        (req.headers.version && Config.getVersion() <= req.headers.version)
                ) {
                        ResponseBody = {};
                        ResponseHeaders = {};
                        RequestHeaders = Object.assign({}, req.headers);
                        IpAddress =
                                req.header("x-forwarded-for") ||
                                req.headers["public-ip"] ||
                                req.connection.remoteAddress;

                        URL = req.url;
                        RequestBody = Object.assign({}, req.body);

                        PaginationInfo = Object.assign(
                                new _PaginationInfo(),
                                req.body.paginationinfo
                        );

                        if (URL.includes("/add")) {
                                req.body.recordinfo = {
                                        entryuid: req.headers.uid,
                                        entryby: req.headers.username,
                                        entrydate: Methods.getdatetimeisostr(),
                                        timestamp: Methods.GetTimestamp(),
                                        isactive: 1,
                                };
                        }

                        // fill record info data use only for add,delete,list
                        if (URL.includes("/add")) {
                                RecordInfo.setEntryuid(req.headers.uid);
                                RecordInfo.setEntryby(req.headers.username);
                                RecordInfo.setEntrydate(Methods.getdatetimeisostr());
                                RecordInfo.setUpdateuid(" ");
                                RecordInfo.setUpdateby(" ");
                                RecordInfo.setUpdatedate(" ");
                        }
                        RecordInfo.setTimestamp(Methods.GetTimestamp());
                        RecordInfo.setIsactive(1);
                        await MainDB.puthistory(RequestBody, req.headers, IpAddress, URL);

                        next();
                } else {
                        let ResponseBody = {};
                        ResponseBody.status = 400;
                        ResponseBody.message = Config.errmsg["invalidversion"];
                        ResponseBody.updateversion = true;

                        if (Config.dataencryption == true) {
                                const respJSON = JSON.stringify(ResponseBody);
                                ResponseBody = Methods.encryptData(respJSON);
                        }

                        res.set(ResponseHeaders);
                        res.status(400).send(ResponseBody);
                }
        } catch (error) {
                console.log(error);
                res.status(500).send({ status: 500, message: Config.resstatuscode["500"] });
        }
}

export function UserAuth(options = {}) {
        const { required = true } = options;

        return async function (req, res, next) {

                const token = req.headers.token;

                // ✅ No token provided
                if (!token) {
                        if (!required) {
                                // Guest access allowed
                                req.userauth = { status: 200, guest: true };
                                return next();
                        }

                        return res.status(401).send({
                                status: 401,
                                message: "Unauthorized"
                        });
                }

                // ✅ Token provided → validate
                const userauth = await MainDB.authanticateuser(
                        token,
                        req.headers.uid,
                        req.headers.unqkey
                );

                if (userauth?.status !== 200) {
                        return res.status(userauth?.status || 401).send({
                                message: userauth?.message || "Unauthorized",
                                data: userauth?.data || null
                        });
                }

                // ✅ Valid user → set headers
                if (userauth?.key && userauth?.unqkey) {
                        res.set({ key: userauth.key, unqkey: userauth.unqkey });

                        if (Config.dataencryption === true) {
                                const data = {
                                        key: userauth.key || "",
                                        unqkey: userauth.unqkey || "",
                                };

                                const headerJSON = JSON.stringify(data);
                                const resheader = Methods.encryptData(headerJSON);
                                res.set({ resheader });
                        }
                }

                req.userauth = userauth;
                return next();
        };
}

export function sendResponse(req, res) {
        let ResponseBody = req.ResponseBody;

        let status = ResponseBody["status"];

        if (status == 500 && Config.logerror) {
                console.log("_______________________________________________________________");
                console.log(ResponseBody.err);
                console.log("_______________________________________________________________");

                // MainDB.createErrLog(ResponseBody.err, req.url)

                // if (Config.servermode !== "dev") {
                // 	delete ResponseBody.err
                // }
        }

        if (status == 401) {

        }

        if (Config.dataencryption == true) {
                const respJSON = JSON.stringify(ResponseBody);
                ResponseBody = Methods.encryptData(respJSON);
        }
        res.status(status).send(ResponseBody);
}
