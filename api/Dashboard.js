import { Config, Methods, MainDB } from "../config/Init.js"
import _FinalOrders from "../model/FinalOrders.js"

const getMatchStage = (req) => {
    const { from, to } = req.body;
    let match = {};
    if (from && to) {
        match.createdAt = {
            $gte: new Date(from),
            $lte: new Date(to)
        };
    }
    return match;
};

export default class Dashboard {
    async HomePageFoodTagLine(req, res, next) {
        try {
            const tagline = "ઘર જેવો સ્વાદ, મમ્મી નું ટિફિન.";
            req.ResponseBody = {
                status: 200,
                message: Config.errmsg['datafound'],
                tagline: tagline
            }
            next()
        } catch (error) {
            req.ResponseBody = { status: 500, message: "Internal Server Error", error: error.message };
            return next();
        }
    }

    async DashboardCount(req, res, next) {
        try {
            const match = getMatchStage(req);
            const pipeline = [
                { $match: match },
                {
                    $group: {
                        _id: null,
                        totalorders: { $sum: 1 },
                        revenue: { $sum: "$amount" },
                        penddingorders: {
                            $sum: { $cond: [{ $eq: ["$adminstatus", 1] }, 1, 0] }
                        },
                        completedorders: {
                            $sum: { $cond: [{ $eq: ["$adminstatus", 2] }, 1, 0] }
                        },
                        cancelledorders: {
                            $sum: { $cond: [{ $eq: ["$adminstatus", 3] }, 1, 0] }
                        },
                        customers: { $addToSet: "$customerid" }
                    }
                }
            ];

            const result = await MainDB.getmenual("tblcafe_finalorders", new _FinalOrders(), pipeline);
            const data = result.ResultData[0] || {
                totalorders: 0, revenue: 0, penddingorders: 0, completedorders: 0, cancelledorders: 0, customers: []
            };

            req.ResponseBody = {
                status: 200,
                message: "Success",
                totalorders: data.totalorders,
                revenue: data.revenue,
                penddingorders: data.penddingorders,
                completedorders: data.completedorders,
                cancelledorders: data.cancelledorders,
                totalcustomer: data.customers.length
            };
            return next();
        } catch (error) {
            req.ResponseBody = { status: 500, message: "Internal Server Error", error: error.message };
            return next();
        }
    }

    async DashboardPaymentMethod(req, res, next) {
        try {
            const match = getMatchStage(req);
            const pipeline = [
                { $match: match },
                { $group: { _id: "$paymentmethod", count: { $sum: 1 } } }
            ];
            const result = await MainDB.getmenual("tblcafe_finalorders", new _FinalOrders(), pipeline);

            let cash = 0, upi = 0, other = 0;
            result.ResultData.forEach(item => {
                if (item._id === 1) cash = item.count;
                else if (item._id === 2) upi = item.count;
                else other += item.count;
            });

            req.ResponseBody = {
                status: 200,
                message: "Success",
                data: cash > 0 || upi > 0 ? [
                    { name: "Cash", value: cash },
                    { name: "UPI", value: upi },
                    // { name: "Other", value: other }
                ] : []
            };
            return next();
        } catch (error) {
            req.ResponseBody = { status: 500, message: "Internal Server Error", error: error.message };
            return next();
        }
    }

    async DashboardServiceType(req, res, next) {
        try {
            const match = getMatchStage(req);
            const pipeline = [
                { $match: match },
                { $group: { _id: "$servicetype", count: { $sum: 1 } } }
            ];
            const result = await MainDB.getmenual("tblcafe_finalorders", new _FinalOrders(), pipeline);

            let dineIn = 0, takeAway = 0, other = 0;
            result.ResultData.forEach(item => {
                if (item._id === 1) dineIn = item.count;
                else if (item._id === 2) takeAway = item.count;
                else other += item.count;
            });

            req.ResponseBody = {
                status: 200,
                message: "Success",
                data: dineIn > 0 || takeAway > 0 ? [
                    { name: "Dine In", value: dineIn },
                    { name: "Take Away", value: takeAway },
                    // { name: "Other", value: other }
                ] : []
            };
            return next();
        } catch (error) {
            req.ResponseBody = { status: 500, message: "Internal Server Error", error: error.message };
            return next();
        }
    }

    async DashboardRevenueTrend(req, res, next) {
        try {
            const match = getMatchStage(req);
            const diffDays = match.createdAt && match.createdAt.$lte && match.createdAt.$gte ?
                Math.max(1, Math.ceil((match.createdAt.$lte.getTime() - match.createdAt.$gte.getTime()) / (1000 * 60 * 60 * 24))) : 30;

            const isMonthWise = diffDays > 31;
            const groupFormat = isMonthWise ? "%Y-%m" : "%Y-%m-%d";

            const pipeline = [
                { $match: match },
                {
                    $group: {
                        _id: { $dateToString: { format: groupFormat, date: "$createdAt" } },
                        revenue: { $sum: "$amount" },
                        orders: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ];

            const result = await MainDB.getmenual("tblcafe_finalorders", new _FinalOrders(), pipeline);

            const rawData = result.ResultData || [];
            let data = [];

            if (match.createdAt && match.createdAt.$gte && match.createdAt.$lte) {
                const startDate = new Date(match.createdAt.$gte);
                const endDate = new Date(match.createdAt.$lte);

                const pad = (n) => n.toString().padStart(2, '0');
                const formatDate = (date, format) => {
                    if (format === "%Y-%m") {
                        return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;
                    }
                    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
                };

                const dataMap = new Map();
                rawData.forEach(item => {
                    dataMap.set(item._id, {
                        revenue: item.revenue,
                        orders: item.orders
                    });
                });

                let current = new Date(startDate);
                const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

                if (isMonthWise) {
                    current.setUTCDate(1);
                    current.setUTCHours(0, 0, 0, 0);
                    while (current <= endDate) {
                        const key = formatDate(current, groupFormat);
                        const existing = dataMap.get(key) || { revenue: 0, orders: 0 };
                        data.push({
                            key,
                            label: `${monthNames[current.getUTCMonth()]} ${current.getUTCFullYear()}`,
                            ...existing
                        });
                        current.setUTCMonth(current.getUTCMonth() + 1);
                    }
                } else {
                    current.setUTCHours(0, 0, 0, 0);
                    while (current <= endDate) {
                        const key = formatDate(current, groupFormat);
                        const existing = dataMap.get(key) || { revenue: 0, orders: 0 };
                        data.push({
                            key,
                            label: `${pad(current.getUTCDate())} ${monthNames[current.getUTCMonth()]} ${current.getUTCFullYear()}`,
                            ...existing
                        });
                        current.setUTCDate(current.getUTCDate() + 1);
                    }
                }
            } else {
                data = rawData.map(item => ({
                    key: item._id,
                    label: item._id,
                    revenue: item.revenue,
                    orders: item.orders
                }));
            }

            req.ResponseBody = { status: 200, message: "Success", data };
            return next();
        } catch (error) {
            req.ResponseBody = { status: 500, message: "Internal Server Error", error: error.message };
            return next();
        }
    }

    async DashboardTopItems(req, res, next) {
        try {
            const match = getMatchStage(req);
            const pipeline = [
                { $match: match },
                { $unwind: "$data" },
                {
                    $group: {
                        _id: "$data.foodname",
                        orders: { $sum: { $convert: { input: "$data.quantity", to: "int", onError: 1, onNull: 1 } } },
                        revenue: {
                            $sum: {
                                $multiply: [
                                    { $convert: { input: "$data.quantity", to: "int", onError: 1, onNull: 1 } },
                                    { $convert: { input: "$data.price", to: "double", onError: 0, onNull: 0 } }
                                ]
                            }
                        }
                    }
                },
                { $sort: { orders: -1 } },
                { $limit: 10 }
            ];

            const result = await MainDB.getmenual("tblcafe_finalorders", new _FinalOrders(), pipeline);
            const data = result.ResultData.map(item => ({
                name: item._id || "Unnamed Item",
                orders: item.orders,
                revenue: item.revenue
            }));

            req.ResponseBody = { status: 200, message: "Success", data };
            return next();
        } catch (error) {
            req.ResponseBody = { status: 500, message: "Internal Server Error", error: error.message };
            return next();
        }
    }

    async DashboardRecentOrders(req, res, next) {
        try {
            const match = getMatchStage(req);
            const pipeline = [
                { $match: match },
                { $sort: { createdAt: -1 } },
                { $limit: 6 }
            ];

            const result = await MainDB.getmenual("tblcafe_finalorders", new _FinalOrders(), pipeline);

            const data = result.ResultData.map(order => ({
                id: order._id,
                orderNo: order.orderno || order._id,
                customer: order.customername || "Guest",
                createdAt: order.createdAt,
                amount: order.totalamount || order.amount,
                paymentMethod: order.paymentmethod,
                serviceType: order.servicetype,
                status: order.adminstatus === 2 ? "Completed" : order.adminstatus === 3 ? "Cancelled" : "Pending",
                lineItems: order.data || []
            }));

            req.ResponseBody = { status: 200, message: "Success", data };
            return next();
        } catch (error) {
            req.ResponseBody = { status: 500, message: "Internal Server Error", error: error.message };
            return next();
        }
    }
}