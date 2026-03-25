import Servermode from "./serverENV.js";

class Config {
        constructor() {
                this.port = process.env.PORT;
                this.endpointv1 = "/moonlightcafe/v1";
                this.servermode = Servermode; // prod - Live | uat - test | dev = dev
                this.dataencryption = false;
                this.tokenkey = process.env.TOKEN_KEY;
                this.GEMINI_API_URL = process.env.GEMINI_API_URL
                this.GoogleAPIKey = process.env.GoogleAPIKey
                this.mainmailid = `Moonlight Cafe <${process.env.MAIN_MAIL_ID}>`
                this.gmail_client_id = process.env.Client_ID
                this.gmail_client_secret = process.env.Client_Secret
                this.gmail_refresh_token = process.env.GMAIL_REFRESH_TOKEN
                this.superadminroleid = "695d43a98bb9b230a1363f14"

                this.ADMIN_USER_IDS = ["68fa58fcc1e1441ff5706b4a"]

                this.allowtax = 1
                this.taxdetails = {
                        dineintax: 5,
                        takeawaytax: 10
                }
                /********************** MONGODB SETUP **********************/
                this.DBType = "MONGODB";
                this.DBName = process.env.MONGODB_DBNAME;
                this.DBHost = process.env.MONGODB_HOST;
                this.DBPort = process.env.MONGODB_PORT;
                this.DBUser = process.env.MONGODB_USER;
                this.DBPass = process.env.MONGODB_PASS;
                /********************** MONGODB SETUP **********************/
                /********************** Fire Base SETUP **********************/
                this.firebasetype = "service_account"
                this.firebaseproject_id = "moonlightcafe-91677"
                this.firebaseprivate_key_id = "a3b12c39d721218c10a487a0d16e59b239743577"
                this.firebaseprivate_key = "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCQTKBLuDeDrImm\nb6YRszc2jLOu7yvOQQhvb5Oj8aoZDLjXKjRMPcJUOIfNV0af4akE3Rihx0sbiGTg\njmbW+eoGiwF03gktWOzpiLehkIivzaOWXM2J8XQTaI+XkDu0J8betQpmWFkf2MrS\nwBp8y5Ww91MAqCQM4HK0tRr/xhp9zGeYNwe9KST5+B7sjdM7C6BzfVgcSykgbXFv\nzxk3hGoXaL4Ac1mmQtHdFZyS6EbcW4yOFzFQDbn7yeMGVptaCS9+rc8Xs061/kga\n3lrO3o/814gYDpKtiZeUmc9a67LObACP8zbmgRU3prmVaEYmcI4kTFq+iaDqpDO5\nl1bZK5jDAgMBAAECggEAGjSwT9AO1Oz6uq1AHarMdi2rXDO3YufQnlxHFdkHqTD0\nSK8zfD0jE6SIlTQqcVLMHUQB+y90ZnWozFdQOe59H98SzqScSg4CSI85ui/Dgxn3\ngZEtCsY87GFq4n2hOiCXL071qoyU8wGuJAQbS1q1vsPL4SyoD2abrlHNq3HQ0dON\nlE1N+HtkynmA2Yo+fq97iFGIkPFt4C/AfcdUuX5nJIv8R+GUPI/C4LL/7ozwqbM0\nYk9uUvj0HnpP5GS7LLaQbi+snOyOA0UpZXvOk5Wt0RW7IYZOSmvOeqZf5DRYSqTc\nRNuThZ6rMBCja+CUrwVUzKVEa6lirWjZkaNzGVicgQKBgQDCLgKsw36IMB27MIqO\nasASc1pNGbBFSCCRALnOjRq43+NVhyhcUrCV0WZBi27b5b4LIYhpCKO1Wpsn+/nA\nW09bQzQpxkkanALlWzoLGeLCFeiwRXO2Ihfeq+MphKFJALc/qo8k5PKuRSIjt6OS\n3vwIEgApvlOG36GB7tzOsTcC4QKBgQC+PUZUvgOh3hCxXAQg36ctpQB7BMyO5IaB\nluDtjplXrRCjtmGoUeTBTjGDsNw/Pkk7RaxoeCBDBJZ7ZtaFA5ew8QJA8be+qopG\n8fJuQ0gWiwNmqIujGZ3W4fv7LBtBQmOaGZM1unGFC0zNWS/YlZNUFcfYXSJkZ2xe\nXppApKC0IwKBgQC9FWKjasZmxTveULlLTyXzkYIoO9CK1l5n9KX6PSr9RX6whSlH\nJXowmTSStLzhwkiZvDCB3tjTOwSFHfeoWQHgY4OC/kOndq3XO0s9DhriVcU9CJRR\nkcdenFBa2HzZgqnuhB5Zldu+2TESSLsuxJX1Idooy924I0G5Lai0WJqx4QKBgBnm\nx9uj32S7knRDfgBn0yBA1fbp6VwPO00LmOZfQvuQAbL4kwVS2R2EovM2MlaeCWR7\nkQTMTkAxsLduggisO4wI1HC5OHZKS/dq28ItgPQoyza//fsf8sCeFivVjoRtIJiL\noOJw1yHxLuzKltwbSWrqaEJKM/ONrVCP+tqQT50XAoGBALZPRNQAUBrTY0wQUCPa\nJl2+Be2aY65wZuvYPalKWypWdXj8M4Bfgl8sG9VCi4nCd/e2DqComvjd+CMS4dFM\nC6FQC7ED3sHN5Tt7F8AG7GeNdAPJ4JyVmXpHWbg/iGJ623VTgY84BcpXJYOvqTQk\nvpuGfbf2c3rqEFeZF2VIpZ8y\n-----END PRIVATE KEY-----\n"
                this.firebaseclient_email = "firebase-adminsdk-fbsvc@moonlightcafe-91677.iam.gserviceaccount.com"
                this.firebaseclient_id = "117524266243859037612"
                this.firebaseauth_uri = "https://accounts.google.com/o/oauth2/auth"
                this.firebasetoken_uri = "https://oauth2.googleapis.com/token"
                this.firebaseauth_provider_x509_cert_url = "https://www.googleapis.com/oauth2/v1/certs"
                this.firebaseclient_x509_cert_url = "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40moonlightcafe-91677.iam.gserviceaccount.com"
                this.firebaseuniverse_domain = "googleapis.com"
                /********************** Fire Base SETUP **********************/
                if (this.servermode == "local") {                        // Local
                        this.dataencryption = false;
                        this.logerror = true;
                        this.version = 1;
                        this.manage_moonlightcafe = "http://192.168.1.2:3000"
                        this.moonlightcafe = "http://192.168.1.2:3001"
                } else if (this.servermode == "prod") {                        // live
                        this.dataencryption = true;
                        this.logerror = true;
                        this.version = 1;
                        this.manage_moonlightcafe = "https://manage-moonlightcafe.pages.dev"
                        this.moonlightcafe = "https://moonlightcafe.pages.dev"
                } else if (this.servermode == "uat") {                        // test
                        this.dataencryption = false;
                        this.logerror = true;
                        this.version = 1;
                        this.manage_moonlightcafe = "https://manage-moonlightcafe.pages.dev"
                        this.moonlightcafe = "https://moonlightcafe.pages.dev"
                } else if (this.servermode == "dev") {                        // test
                        this.dataencryption = false;
                        this.logerror = true;
                        this.version = 1;
                        this.manage_moonlightcafe = "https://manage-moonlightcafe.pages.dev"
                        this.moonlightcafe = "https://moonlightcafe.pages.dev"
                }

                this.resstatuscode = {
                        '100': "Continue",
                        '101': "Switching Protocols",
                        '103': "Early Hints",
                        '200': "OK",
                        '201': "Created",
                        '202': "Accepted",
                        '203': "Non-Authoritative Information",
                        '204': "No Content",
                        '205': "Reset Content",
                        '206': "Partial Content",
                        '300': "Multiple Choices",
                        '301': "Moved Permanently",
                        '302': "Found",
                        '303': "See Other",
                        '304': "Not Modified",
                        '307': "Temporary Redirect",
                        '308': "Permanent Redirect",
                        '400': "Bad Request",
                        '401': "Unauthorized",
                        '402': "Payment Required",
                        '403': "Forbidden",
                        '404': "Not Found",
                        '405': "Method Not Allowed",
                        '406': "Not Acceptable",
                        '407': "Proxy Authentication Required",
                        '408': "Request Timeout",
                        '409': "Conflict",
                        '410': "Gone",
                        '411': "Length Required",
                        '412': "Precondition Failed",
                        '413': "Payload Too Large",
                        '414': "URI Too Long",
                        '415': "Unsupported Media Type",
                        '416': "Range Not Satisfiable",
                        '417': "Expectation Failed",
                        '418': "I'm a teapot",
                        '422': "Unprocessable Entity",
                        '425': "Too Early",
                        '426': "Upgrade Required",
                        '428': "Precondition Required",
                        '429': "Too Many Requests",
                        '431': "Request Header Fields Too Large",
                        '451': "Unavailable For Legal Reasons",
                        '500': "Internal Server Error",
                        '501': "Not Implemented",
                        '502': "Bad Gateway",
                        '503': "Service Unavailable",
                        '504': "Gateway Timeout",
                        '505': "HTTP Version Not Supported",
                        '506': "Variant Also Negotiates",
                        '507': "Insufficient Storage",
                        '508': "Loop Detected",
                        '510': "Not Extended",
                        '511': "Network Authentication Required",
                };

                this.emailtemplates = {
                        'welcomeletter': {
                                'subject': "Welome To Moonlight Cafe",
                                'body': "/assets/htmltemplates/welcomeletter.html",
                                'type': 1,
                        },
                        'googleloginmail': {
                                'subject': "Welome To Moonlight Cafe",
                                'body': "/assets/htmltemplates/GoogleWelcomeMail.html",
                                'type': 2,
                        },
                        'forgotpassword': {
                                'subject': 'Reset your Password',
                                'body': "/assets/htmltemplates/forgotpassword.html",
                                'type': 3
                        },
                        'billing': {
                                'subject': 'Dine in Billing for moonlightcafe',
                                'body': "/assets/htmltemplates/billing.html",
                                'type': 3
                        },
                        'customersupport': {
                                'subject': 'Moonlight Café - Support Ticket Submitted',
                                'body': "/assets/htmltemplates/customersupport.html",
                                'type': 4
                        },
                        'customersupportresolved': {
                                'subject': 'Moonlight Café - Support Ticket Resolved',
                                'body': "/assets/htmltemplates/customersupportresolved.html",
                                'type': 5
                        },
                        "employeereg": {
                                'subject': 'Welcome to Moonlight Cafe – Your Employee Account Details',
                                'body': "/assets/htmltemplates/employeereg.html",
                                'type': 6
                        },
                }

                //for response message
                this.errmsg = {
                        "insert": "Data inserted successfully.",
                        "update": "Data updated successfully.",
                        "delete": "Data deleted successfully.",
                        "datafound": "Data Found for the user.",
                        "dberror": 'Something went wrong, Error Code : ',
                        "notexist": 'Data not exist.',
                        'deactivate': "Your account is suspended, please contact administrator to activate account.",
                        'uservalidate': "User Validate.",
                        'userright': "Sorry, You don't have enough permissions to perform this action",
                        'requireddata': 'All fields are required.',
                        'invalidtoken': "Invalid token.",
                        'tokenvalidate': "Token validated",
                        'usernotfound': "User not found",
                        'accountnotfound': "Account not found",
                        'invalidusername': "Invalid Username.",
                        'invalidemail': "Please Enter Valid Email.",
                        'invalidpassword': "Invalid Password.",
                        'successlogin': "Login Successfully",
                        'checkmail': "We have send the otp in mail.",
                        'otpexpired': "Entered OTP is expired.",
                        'invalidotp': "Entered OTP is invalid.",
                        'oldusepassword': "Can not use previously used password",
                        'passreset': "Password Reset Successfully",
                        'invalidrequest': "Invalid request.",
                        'isexist': 'Data already exist.',
                        'invalidicon': 'Invalid Icon.',
                        'invalidcredentials': 'Invalid Credentials.',
                        'customernotfound': 'Customer Details Not Found!',
                        'statecodeexist': 'Short code already exists.',
                        'stateexist': 'state already exists.',
                        'inuse': 'Data is already in use.',
                        'invalidareaid': "pincode is invalid",
                        'invaliddoctypeidid': "Document Type is invalid",
                        'invalidtenantprojectid': "The Tenant Project Id Is Invalid.",
                        "menualreadyassign": 'Menu already assign please update the menu assign data',

                        'passwordlength': "Suggest a longer password.",
                        'passwordluppercase': "Please enter uppercase letters for strong password.",
                        'passwordlowercase': "Please enter lowercase letters for strong password.",
                        'passwordnumber': "please Enter numbers for strong password.",
                        'passwordspecialchar': "please Enter special characters for strong password.",
                };

                this.headers = {
                        "Content-Type": "application/json",
                }

        }

        getServermode() {
                return this.servermode;
        }

        getResponsestatuscode() {
                return this.resstatuscode
        }

        getDBType() {
                return this.DBType;
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

        getOtherformdataaction() {
                return this.otherformdataaction
        }

        setServermode(servermode) {
                this.servermode = servermode;
        }
}


export default Config;