import { Config, Methods, MainDB } from "../../config/Init.js"
import _ShiftTime from "../../model/ShiftTime.js"
import _ShiftAssign from "../../model/ShiftAssign.js"

const ObjectId = Methods.getObjectId()
const SHIFT_TIME_COLLECTION = "tblcafe_shifttime"
const SHIFT_ASSIGN_COLLECTION = "tblcafe_shiftassign"
const MINUTES_IN_DAY = 24 * 60

const isValidTimeString = (timeStr = "") => /^([01]\d|2[0-3]):([0-5]\d)$/.test(timeStr)

const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
};

const getTimeRanges = (startMinutes, endMinutes) => {
    if (startMinutes === endMinutes) {
        return [[0, MINUTES_IN_DAY]];
    }

    if (startMinutes < endMinutes) {
        return [[startMinutes, endMinutes]];
    }

    return [
        [startMinutes, MINUTES_IN_DAY],
        [0, endMinutes]
    ];
};

const checkOverlap = (start1, end1, start2, end2) => {
    const ranges1 = getTimeRanges(start1, end1);
    const ranges2 = getTimeRanges(start2, end2);

    return ranges1.some(([rangeStart1, rangeEnd1]) =>
        ranges2.some(([rangeStart2, rangeEnd2]) =>
            rangeStart1 < rangeEnd2 && rangeStart2 < rangeEnd1
        )
    );
};

const buildShiftTimeDetails = ({ timeSlotName, startTime, endTime }) => ({
    timeSlotName: String(timeSlotName || "").trim(),
    startTime,
    endTime
});

const getShiftTimeValidationMessage = ({ timeSlotName, startTime, endTime }) => {
    if (!timeSlotName || !startTime || !endTime) {
        return "timeSlotName, startTime and endTime are required.";
    }

    if (!isValidTimeString(startTime) || !isValidTimeString(endTime)) {
        return "startTime and endTime must be in HH:MM format.";
    }

    return "";
};

const hasOverlappingShift = (shiftList = [], startTime, endTime) => {
    const newStart = timeToMinutes(startTime);
    const newEnd = timeToMinutes(endTime);

    return shiftList.some((shift) => {
        if (!isValidTimeString(shift.startTime) || !isValidTimeString(shift.endTime)) {
            return false;
        }

        const existingStart = timeToMinutes(shift.startTime);
        const existingEnd = timeToMinutes(shift.endTime);

        return checkOverlap(newStart, newEnd, existingStart, existingEnd);
    });
};

class Shift {
    async AddShiftTime(req, res, next) {
        try {
            const shiftTimePayload = buildShiftTimeDetails(req.body || {});
            const validationMessage = getShiftTimeValidationMessage(shiftTimePayload);

            if (validationMessage) {
                req.ResponseBody = {
                    status: 400,
                    message: validationMessage
                };
                return next();
            }

            const existingShifts = await MainDB.getmenual(SHIFT_TIME_COLLECTION, new _ShiftTime(), [{ $match: {} }]);
            const hasOverlap = hasOverlappingShift(existingShifts.ResultData, shiftTimePayload.startTime, shiftTimePayload.endTime);

            if (hasOverlap) {
                req.ResponseBody = {
                    status: 400,
                    message: "Time slot overlaps with an existing shift."
                };
                return next();
            }

            const insertdata = await MainDB.executedata("i", new _ShiftTime(), SHIFT_TIME_COLLECTION, shiftTimePayload);

            req.ResponseBody = {
                status: insertdata.status,
                message: insertdata.status == 200 ? "Shift Time created successfully" : insertdata.message
            };
            next();
        } catch (error) {
            console.error("Error: ", error);
            req.ResponseBody = {
                status: 500,
                message: Config.resstatuscode['500']
            }
            next()
        }
    }

    async ListShiftTime(req, res, next) {
        try {
            const fetchdata = await MainDB.getmenual(SHIFT_TIME_COLLECTION, new _ShiftTime(), [{ $match: {} }]);
            req.ResponseBody = {
                status: 200,
                message: "List Shift Times",
                data: fetchdata.ResultData
            };
            next();
        } catch (error) {
            console.error("Error: ", error);
            req.ResponseBody = {
                status: 500,
                message: Config.resstatuscode['500']
            }
            next()
        }
    }

    async UpdateShiftTime(req, res, next) {
        try {
            if (!Methods.ValidateObjectId(req.body?._id)) {
                req.ResponseBody = {
                    status: 400,
                    message: "Valid shift time _id is required."
                };
                return next();
            }

            const shiftTimeId = new ObjectId(req.body._id);
            const existingShiftTime = await MainDB.getmenual(
                SHIFT_TIME_COLLECTION,
                new _ShiftTime(),
                [{ $match: { _id: shiftTimeId } }]
            );

            if (!existingShiftTime.ResultData.length) {
                req.ResponseBody = {
                    status: 400,
                    message: "Shift Time not found."
                };
                return next();
            }

            const currentShiftTime = existingShiftTime.ResultData[0];
            const updatedShiftTime = buildShiftTimeDetails({
                timeSlotName: req.body.timeSlotName ?? currentShiftTime.timeSlotName,
                startTime: req.body.startTime ?? currentShiftTime.startTime,
                endTime: req.body.endTime ?? currentShiftTime.endTime
            });

            const validationMessage = getShiftTimeValidationMessage(updatedShiftTime);
            if (validationMessage) {
                req.ResponseBody = {
                    status: 400,
                    message: validationMessage
                };
                return next();
            }

            const otherShifts = await MainDB.getmenual(
                SHIFT_TIME_COLLECTION,
                new _ShiftTime(),
                [{ $match: { _id: { $ne: shiftTimeId } } }]
            );

            const hasOverlap = hasOverlappingShift(otherShifts.ResultData, updatedShiftTime.startTime, updatedShiftTime.endTime);
            if (hasOverlap) {
                req.ResponseBody = {
                    status: 400,
                    message: "Time slot overlaps with an existing shift."
                };
                return next();
            }

            const updateData = await MainDB.Update(
                SHIFT_TIME_COLLECTION,
                new _ShiftTime(),
                [{ _id: shiftTimeId }, updatedShiftTime]
            );

            if (updateData.status !== 200) {
                req.ResponseBody = {
                    status: updateData.status,
                    message: updateData.message
                };
                return next();
            }

            const assignmentUpdate = await MainDB.UpdateMany(
                SHIFT_ASSIGN_COLLECTION,
                new _ShiftAssign(),
                [{ shiftid: shiftTimeId }, { shiftTimedetails: updatedShiftTime }]
            );

            req.ResponseBody = {
                status: 200,
                message: "Shift Time updated successfully",
                data: updateData.data,
                updatedAssignments: assignmentUpdate.modifiedCount || 0
            };
            next();
        } catch (error) {
            console.error("Error: ", error);
            req.ResponseBody = {
                status: 500,
                message: Config.resstatuscode['500']
            }
            next()
        }
    }

    async DeleteShiftTime(req, res, next) {
        try {
            if (!Methods.ValidateObjectId(req.body?._id)) {
                req.ResponseBody = {
                    status: 400,
                    message: "Valid shift time _id is required."
                };
                return next();
            }

            const shiftTimeId = new ObjectId(req.body._id);
            const existingShiftTime = await MainDB.getmenual(
                SHIFT_TIME_COLLECTION,
                new _ShiftTime(),
                [{ $match: { _id: shiftTimeId } }]
            );

            if (!existingShiftTime.ResultData.length) {
                req.ResponseBody = {
                    status: 400,
                    message: "Shift Time not found."
                };
                return next();
            }

            const linkedAssignments = await MainDB.getmenual(
                SHIFT_ASSIGN_COLLECTION,
                new _ShiftAssign(),
                [{ $match: { shiftid: shiftTimeId } }]
            );

            const deleteAssignments = await MainDB.DeleteMany(
                SHIFT_ASSIGN_COLLECTION,
                new _ShiftAssign(),
                { shiftid: shiftTimeId }
            );

            if (deleteAssignments.status !== 200) {
                req.ResponseBody = {
                    status: deleteAssignments.status,
                    message: deleteAssignments.message
                };
                return next();
            }

            const deleteShiftTime = await MainDB.Delete(
                SHIFT_TIME_COLLECTION,
                new _ShiftTime(),
                { _id: shiftTimeId }
            );

            req.ResponseBody = {
                status: deleteShiftTime.status,
                message: deleteShiftTime.status == 200 ? "Shift Time deleted successfully" : deleteShiftTime.message,
                deletedAssignments: linkedAssignments.ResultData.length
            };
            next();
        } catch (error) {
            console.error("Error: ", error);
            req.ResponseBody = {
                status: 500,
                message: Config.resstatuscode['500']
            }
            next()
        }
    }

    async AddShiftAssign(req, res, next) {
        try {
            const insertdata = await MainDB.executedata("i", new _ShiftAssign(), SHIFT_ASSIGN_COLLECTION, {
                employeeid: new ObjectId(req.body.employeeid),
                employeedetails: req.body.employeedetails,
                shiftid: new ObjectId(req.body.shiftid),
                shiftTimedetails: req.body.shiftTimedetails,
                assigndate: new Date(),
                assigndetails: req.body.assigndetails || {}
            });

            req.ResponseBody = {
                status: insertdata.status,
                message: "Shift assigned successfully",
                data: insertdata.data
            };
            next();
        } catch (error) {
            console.error("Error: ", error);
            req.ResponseBody = {
                status: 500,
                message: Config.resstatuscode['500']
            }
            next()
        }
    }

    async ListShiftAssign(req, res, next) {
        try {
            var PaginationInfo = req.body.paginationinfo;
            const requiredPage = { pageno: PaginationInfo.pageno, skip: (PaginationInfo.pageno - 1) * PaginationInfo.pagelimit, pagelimit: PaginationInfo.pagelimit };
            var pipeline = [];
            var sort = Object.keys(PaginationInfo.sort).length !== 0 ? PaginationInfo.sort : {};
            pipeline.push(...Methods.GetPipelineForFilter(PaginationInfo.filter));
            const searchtext = req.body.searchtext || ""
            let projection = PaginationInfo.projection ? PaginationInfo.projection : {};

            if (searchtext !== "") {
                pipeline.push(...Methods.GetGlobalSearchFilter(new _ShiftAssign(), searchtext))
            }

            const fetchdata = await MainDB.getmenual(SHIFT_ASSIGN_COLLECTION, new _ShiftAssign(), pipeline, requiredPage, sort, false, projection);

            req.ResponseBody = {
                status: 200,
                message: "List Shift Assignments",
                data: fetchdata.ResultData
            };
            next();
        } catch (error) {
            console.error("Error: ", error);
            req.ResponseBody = {
                status: 500,
                message: Config.resstatuscode['500']
            }
            next()
        }
    }

    async UpdateShiftAssign(req, res, next) {
        try {
            let updateObj = {};
            if (req.body.status !== undefined) updateObj.status = req.body.status;
            if (req.body.shiftid) updateObj.shiftid = new ObjectId(req.body.shiftid);
            if (req.body.shiftTimedetails) updateObj.shiftTimedetails = req.body.shiftTimedetails;
            if (req.body.assigndate) updateObj.assigndate = req.body.assigndate;

            let UpdateData = await MainDB.Update(
                SHIFT_ASSIGN_COLLECTION,
                new _ShiftAssign(),
                [{ _id: new ObjectId(req.body._id) }, updateObj]
            );

            req.ResponseBody = {
                status: UpdateData.status,
                message: "Shift assignment updated"
            };
            next();
        } catch (error) {
            console.error("Error: ", error);
            req.ResponseBody = {
                status: 500,
                message: Config.resstatuscode['500']
            }
            next()
        }
    }

    async DeleteShiftAssign(req, res, next) {
        try {
            let deleteData = await MainDB.Delete(
                SHIFT_ASSIGN_COLLECTION,
                new _ShiftAssign(),
                { _id: new ObjectId(req.body._id) }
            );

            req.ResponseBody = {
                status: deleteData.status,
                message: "Shift assignment deleted"
            };
            next();
        } catch (error) {
            console.error("Error: ", error);
            req.ResponseBody = {
                status: 500,
                message: Config.resstatuscode['500']
            }
            next()
        }
    }
}

export default Shift
