var fs = require("fs");

var AdminModel = require("../../models/Admin");
var Giftcard = require("../../models/Giftcard");
var UsersModel = require("../../models/User");
var OrdersModel = require("../../models/Order");
var GlassesModel = require("../../models/Products/Glasses");
var CustomerSupportModel = require("../../models/CustomerSupport");

const { sendEmail } = require("../../services/EmailService");

var AdminAuthController = require("../Auth/AdminAuthController");

const { comparePassword, hashPassword } = require("../../helpers/hashing");

/*
    TODO: Store JWT tokens in the database once authentication is completed
    Currently, we are only using the refreshTokens array to manage refresh tokens.
*/
var tokens = require("../../helpers/refreshToken");

exports.profile = async (req, res, next) => {
  try {
    // hardcoded temporarily.
    // const adminId = "64fb40e2734ac0a4df233e4e";
    const adminId = req.params.adminId;
    const isAdminExists = await AdminModel.findById(adminId).select(
      "-password -role"
    );

    // const isAdminExists = await AdminModel.findById(req.user.id).select("-password -role");

    if (!isAdminExists)
      return res.status(400).json({ message: "Admin account not found." });

    res.status(200).json(isAdminExists);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "500: Error occured" });
  }
};

exports.updatePersonalInformation = (req, res, next) => {
  try {
    const { firstName, lastName, email } = req.body;

    AdminModel.updateOne(
      // {_id: req.user.id},
      { _id: req.params.adminId },
      { $set: { firstName: firstName, lastName: lastName, email: email } }
    )
      .then((updateResponse) => {
        AdminModel.find({ email: email })
          .then((response) => {
            // Generate new access token for user
            // const user = {
            //     id: response[0]._id.toString(),
            // }

            // const token = AdminAuthController.generateAccessToken(user);
            // const refreshToken = AdminAuthController.generateRefreshToken(user);

            // tokens.addRefreshTokens(refreshToken);

            res.status(200).json({
              user: response[0],
              // accessToken: token,
              // refreshToken: refreshToken,
              message: "Admin Details are Updated Successfully.",
            });
          })
          .catch((error) => {
            if (error) res.status(404).json({ message: "error occured." });
          });
      })
      .catch((error) => {
        if (error) res.status(404).json({ message: "admin not found" });
      });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "500: Error occured" });
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const adminId = req.params.adminId;

    console.log(adminId);

    const { currentPassword, newPassword, confirmPassword } = req.body;

    const AdminDoc = await AdminModel.findById(adminId);
    // const AdminDoc = await AdminModel.findById(req.user.id);

    console.log("found admin doc: ", AdminDoc);

    if (!AdminDoc) return res.status(400).json({ message: "Invalid user id." });

    const comparedPassword = comparePassword(
      currentPassword,
      AdminDoc.password
    );

    if (!comparedPassword)
      return res
        .status(400)
        .json({ message: "Current password is incorrect." });

    if (newPassword !== confirmPassword)
      return res.status(400).json({
        message: "The password and confirm password fields do not match.",
      });

    const newHashedPassword = hashPassword(newPassword);

    console.log(newHashedPassword);

    AdminModel.findByIdAndUpdate(
      adminId,
      { password: newHashedPassword },
      { new: true }
    )
      .then((response) => {
        return res
          .status(200)
          .json({ message: "Password is updated successfully." });
      })
      .catch((err) => {
        console.log(err);
        return res.status(403).json({
          message:
            "Admin don't have sufficient permissions to change password.",
        });
      });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "500: Error occured while changing user password." });
  }
};

// Add to Giftcard [Admin]
exports.addGiftcard = async (req, res, next) => {
  try {
    const { code, amount, status, note, customerEmail, expirationDate } =
      req.body;

    const AddedGiftcard = await Giftcard.create({
      code: code,
      value: amount.price,
      currency: amount.currency,
      status: status,
      expirationDate: expirationDate,
      note: note,
    });

    if (!AddedGiftcard)
      return res
        .status(400)
        .json({ message: "400: Error occured while adding giftcards." });

    console.log(customerEmail);

    // Send an email to the user
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

    const inputDate = new Date(expirationDate);
    const options = { year: "numeric", month: "short", day: "numeric" };
    const formattedDate = inputDate.toLocaleDateString("en-US", options);

    if (emailRegex.test(customerEmail)) {
      await sendEmail(code, formattedDate, customerEmail);
    }

    res.status(200).json({ message: "Giftcard is added successfully." });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "500: Error occured while adding giftcards." });
  }
};

// View Giftcards [Admin]
exports.viewGiftcard = (req, res, next) => {
  try {
    Giftcard.find({})
      .then((response) => {
        res.status(200).json(response);
      })
      .catch((error) => {
        res
          .status(400)
          .json({ message: "500: Error occured while viewing giftcards." });
      });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "500: Error occured while viewing giftcards." });
  }
};

// View Giftcards [Admin]
exports.viewParticularGiftcard = (req, res, next) => {
  try {
    const giftcardId = req.params.giftcardId;

    Giftcard.findOne({ _id: giftcardId })
      .then((response) => {
        res.status(200).json(response);
      })
      .catch((error) => {
        res
          .status(400)
          .json({ message: "500: Error occured while viewing giftcards." });
      });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "500: Error occured while viewing giftcards." });
  }
};

// Update Giftcards [Admin]
exports.updateGiftcard = async (req, res, next) => {
  try {
    const giftcardId = req.params.giftcardId;

    const { code, amount, status, note, customerEmail, expirationDate } =
      req.body;

    const newUpdatedGiftcard = {
      code: code,
      value: amount.price,
      currency: amount.currency,
      status: status,
      expirationDate: expirationDate,
      note: note,
    };

    const updatedGiftcard = await Giftcard.findByIdAndUpdate(
      giftcardId,
      newUpdatedGiftcard,
      { new: true }
    );

    if (!updatedGiftcard)
      return res
        .status(400)
        .json({ message: "400: Error occured while updating giftcard." });

    res.status(200).json(updatedGiftcard);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "500: Error occured while updating giftcards." });
  }
};

// Delete Giftcards [Admin]
exports.deleteGiftcard = async (req, res, next) => {
  try {
    const giftcardId = req.params.giftcardId;

    const deleteGiftcard = await Giftcard.findByIdAndDelete(giftcardId);

    if (!deleteGiftcard)
      return res.status(400).json({ message: "Giftcard does not exists." });

    res.status(204).json(deleteGiftcard);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "500: Error occured while deleting giftcards." });
  }
};

// Upload Profile Image - Server
exports.uploadProfileImageServer = async (req, res, next) => {
  try {
    if (!req.file)
      return res
        .status(400)
        .json({ message: "Error occured while uploading image" });

    const imageId = await AdminModel.findById(req.user.id).select(
      "profilePicture"
    );

    // If Profile Picture already exists then remove the old image.
    if (imageId && imageId.profilePicture)
      fs.unlinkSync(
        "./public/uploads/profile_images/" + imageId.profilePicture
      );

    const profilePicture = await AdminModel.findByIdAndUpdate(
      req.user.id,
      { profilePicture: req.file.filename },
      { new: true }
    );

    if (!profilePicture)
      return res
        .status(400)
        .json({ message: "Error occured while uploading image to db" });

    res.status(200).json({ message: "Image uploaded successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal Error occured while uploading image to server",
    });
  }
};

// View Profile Image - Server
exports.viewProfileImageServer = async (req, res, next) => {
  try {
    const adminId = req.params.adminId;
    const imageId = await AdminModel.findById(req.user.id).select(
      "profilePicture"
    );

    if (!(imageId && imageId.profilePicture))
      return res
        .status(404)
        .json({ message: "Error occured while retriving image id." });

    res.status(200).json({
      profilePicture: imageId.profilePicture,
      location: "/uploads/profile_images/" + imageId.profilePicture,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal Error occured while viewing image from server",
    });
  }
};

// Delete Profile Image - Server
exports.deleteProfileImageServer = async (req, res, next) => {
  try {
    const imageId = await AdminModel.findById(req.user.id).select(
      "profilePicture"
    );

    if (!(imageId && imageId.profilePicture))
      return res
        .status(400)
        .json({ message: "Error occured while retriving image id." });

    fs.unlinkSync("./public/uploads/profile_images/" + imageId.profilePicture);

    const removeFromUserDocs = await AdminModel.findByIdAndUpdate(req.user.id, {
      profilePicture: "",
    });

    if (!removeFromUserDocs)
      return res
        .status(400)
        .json({ message: "Error occured while removing image from db" });

    res.status(200).json({ message: "Image is removed from successfully." });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal Error occured while deleting image from server",
    });
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const usersList = await UsersModel.find(
      {},
      { __v: 0, password: 0, payments: 0 }
    ).sort({ _id: -1 });

    if (!usersList)
      return res.status(400).json({
        message: "400: Error occured while fetching users",
      });

    res.status(200).json(usersList);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "500: Error occured while fetching users" });
  }
};

exports.getAllAgents = async (req, res, next) => {
  try {
    const agentsList = await CustomerSupportModel.find(
      {},
      { __v: 0, password: 0, payments: 0 }
    ).sort({ _id: -1 });

    if (!agentsList)
      return res.status(400).json({
        message: "400: Error occured while fetching agents",
      });

    res.status(200).json(agentsList);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "500: Error occured while fetching agents" });
  }
};

exports.getParticularUser = async (req, res, next) => {
  try {
    const customerId = req.params.customerId;

    const usersList = await UsersModel.findOne(
      { _id: customerId },
      { __v: 0, password: 0, payments: 0 }
    );

    if (!usersList)
      return res.status(400).json({
        message: "400: Error occured while fetching user",
      });

    res.status(200).json(usersList);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "500: Error occured while fetching user" });
  }
};

exports.getAllOrders = async (req, res, next) => {
  try {
    const allOrdersList = await OrdersModel.find({}, { __v: 0 })
      .sort({ _id: -1 })
      .populate({
        path: "user",
        select: "firstName lastName profilePicture",
      })
      .populate({
        path: "paymentMethod",
        select: "paymentType",
      })
      .populate({
        path: "items.frame",
        model: "Glasses",
      });

    if (!allOrdersList)
      return res.status(400).json({
        message: "400: Error occured while fetching orders",
      });

    res.status(200).json(allOrdersList);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "500: Error occured while fetching orders" });
  }
};

exports.getCustomersParticularOrders = async (req, res, next) => {
  try {
    const customerId = req.params.customerId;

    const allOrdersList = await OrdersModel.find(
      { user: customerId },
      { __v: 0 }
    )
      .sort({ _id: -1 })
      .populate({
        path: "user",
        select: "-password -payment",
      })
      .populate({
        path: "paymentMethod",
        select: "paymentType",
      })
      .populate({
        path: "items.frame",
        model: "Glasses",
      });

    if (!allOrdersList)
      return res.status(400).json({
        message: "400: Error occured while fetching orders",
      });

    res.status(200).json(allOrdersList);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "500: Error occured while fetching orders" });
  }
};

exports.getCustomersSingleOrder = async (req, res, next) => {
  try {
    const customerId = req.params.customerId;
    const orderId = req.params.orderId;

    const allOrdersList = await OrdersModel.findOne(
      { user: customerId, _id: orderId },
      { __v: 0 }
    )
      .sort({ _id: -1 })
      .populate({
        path: "user",
        select: "-password -payment",
      })
      .populate({
        path: "paymentMethod",
        select: "paymentType",
      })
      .populate({
        path: "items.frame",
        model: "Glasses",
      });

    if (!allOrdersList)
      return res.status(400).json({
        message: "400: Error occured while fetching orders",
      });

    res.status(200).json(allOrdersList);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "500: Error occured while fetching orders" });
  }
};

// This is created for testing purposes only
exports.registerTestUser = async (req, res, next) => {
  try {
    const {
      firstname,
      lastname,
      email,
      password,
      confirmpassword,
      phone,
      status,
      city,
      country,
    } = req.body;

    const hashedPassword = hashPassword(password);

    const createUser = await UsersModel.create({
      firstName: firstname,
      lastName: lastname,
      email: email,
      password: hashedPassword,
      phone: phone,
      city: city,
      country: country,
      status: status,
    });

    if (!createUser)
      return res.status(400).json({ message: "Unable to create an account." });

    res.status(201).json({
      user: createUser,
      message: "User account is created.",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "error occured during account creation." });
  }
};

// Ban User
exports.banUser = async (req, res, next) => {
  const customerId = req.params.customerId;

  const { banned_until, banned_reason } = req.body;

  try {
    const updatedUserData = await UsersModel.findByIdAndUpdate(
      customerId,
      {
        status: {
          user_status: "Banned",
          is_banned: {
            banned_until: banned_until,
            banned_reason: banned_reason,
          },
        },
      },
      { new: true }
    );

    if (!updatedUserData) {
      return res.status(404).json({ message: "user not found" });
    }

    res.status(200).json({ message: "User is banned" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred while banning user" });
  }
};

// Ban Agent
exports.banAgent = async (req, res, next) => {
  const agentId = req.params.agentId;

  const { banned_until, banned_reason } = req.body;

  try {
    const updatedAgentData = await CustomerSupportModel.findByIdAndUpdate(
      agentId,
      {
        status: {
          user_status: "Banned",
          is_banned: {
            banned_until: banned_until,
            banned_reason: banned_reason,
          },
        },
      },
      { new: true }
    );

    if (!updatedAgentData) {
      return res.status(404).json({ message: "agent not found" });
    }

    res.status(200).json({ message: "agent is banned" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred while banning agent" });
  }
};

exports.unbanUser = async (req, res, next) => {
  const customerId = req.params.customerId;

  try {
    const updatedUserData = await UsersModel.findByIdAndUpdate(
      customerId,
      {
        status: {
          user_status: "Active",
          is_banned: null,
        },
      },
      { new: true }
    );

    if (!updatedUserData) {
      return res.status(404).json({ message: "user not found" });
    }

    res.status(200).json({ message: "User is unbanned" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while unbanning the user" });
  }
};

// unban agent
exports.unbanAgent = async (req, res, next) => {
  const agentId = req.params.agentId;

  try {
    const updatedAgentData = await CustomerSupportModel.findByIdAndUpdate(
      agentId,
      {
        status: {
          user_status: "Active",
          is_banned: null,
        },
      },
      { new: true }
    );

    if (!updatedAgentData) {
      return res.status(404).json({ message: "agent not found" });
    }

    res.status(200).json({ message: "agent is unbanned" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while unbanning the agent" });
  }
};

exports.customerAnalytics = async (req, res, next) => {
  try {
    const allUsers = await UsersModel.find();

    if (!allUsers)
      return res
        .status(400)
        .json({ message: "400: Error occured while getting customers." });

    const totalUsers = allUsers.length;
    const activeUsers = allUsers.filter(
      (user) => user.status.user_status === "Active"
    ).length;
    const bannedUsers = allUsers.filter(
      (user) => user.status.user_status === "Banned"
    ).length;

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const usersCurrentMonth = allUsers.filter((user) => {
      const userDate = new Date(user.createdAt);
      return (
        userDate.getMonth() === currentMonth &&
        userDate.getFullYear() === currentYear
      );
    }).length;

    const getUsersByMonth = () => {
      const monthlyUserCount = {};
    
      allUsers.forEach(user => {
        const createdAt = new Date(user.createdAt);
        const monthName = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(createdAt);
        const monthYear = `${monthName}-${createdAt.getFullYear()}`;
    
        if (monthlyUserCount[monthYear]) {
          monthlyUserCount[monthYear]++;
        } else {
          monthlyUserCount[monthYear] = 1;
        }
      });
    
      return monthlyUserCount;
    };
    
    const usersByMonth = getUsersByMonth();
    
    const monthsOfYear = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(Date.UTC(new Date().getFullYear(), i, 1));
      return { name: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date), value: 0 };
    });
    
    const totalUsersChart = monthsOfYear.map(month => ({
      ...month,
      value: usersByMonth[`${month.name}-${new Date().getFullYear()}`] || 0,
    }));

    const getActiveUsersByMonth = () => {
      const activeUsersByMonth = {};
    
      allUsers.forEach(user => {
        const status = user.status.user_status;
        const createdAt = new Date(user.createdAt);
        const monthName = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(createdAt);
        const monthYear = `${monthName}-${createdAt.getFullYear()}`;
    
        if (!activeUsersByMonth[monthYear]) {
          activeUsersByMonth[monthYear] = 0;
        }
    
        if (status === 'Active') {
          activeUsersByMonth[monthYear]++;
        }
      });
    
      return activeUsersByMonth;
    };
    
    const activeUsersByMonth = getActiveUsersByMonth();
    
    // Generate an array with all months in a year
    const activeMonthsOfYear = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(Date.UTC(new Date().getFullYear(), i, 1));
      return {
        name: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date),
        value: 0,
      };
    });
    
    // Merge the counts with the array of all months
    const ActiveUsersChart = activeMonthsOfYear.map(month => ({
      ...month,
      value: activeUsersByMonth[`${month.name}-${new Date().getFullYear()}`] || 0,
    }));

    const getBannedUsersByMonth = () => {
      const bannedUsersByMonth = {};
    
      allUsers.forEach(user => {
        const status = user.status.user_status;
        const createdAt = new Date(user.createdAt);
        const monthName = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(createdAt);
        const monthYear = `${monthName}-${createdAt.getFullYear()}`;
    
        if (!bannedUsersByMonth[monthYear]) {
          bannedUsersByMonth[monthYear] = 0;
        }
    
        if (status === 'Banned') {
          bannedUsersByMonth[monthYear]++;
        }
      });
    
      return bannedUsersByMonth;
    };
    
    const bannedUsersByMonth = getBannedUsersByMonth();
    
    const bannedMonthsOfYear = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(Date.UTC(new Date().getFullYear(), i, 1));
      return {
        name: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date),
        value: 0,
      };
    });
    
    const BannedUsersChart = bannedMonthsOfYear.map(month => ({
      ...month,
      value: bannedUsersByMonth[`${month.name}-${new Date().getFullYear()}`] || 0,
    }));
    
    res.status(200).json({
      totalUsersChart: totalUsersChart,
      ActiveUsersChart: ActiveUsersChart,
      BannedUsersChart: BannedUsersChart,
      totalUsers: totalUsers,
      activeUsers: activeUsers,
      bannedUsers: bannedUsers,
      usersCurrentMonth: usersCurrentMonth,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

exports.agentsAnalytics = async (req, res, next) => {
  try {
    const allAgents = await CustomerSupportModel.find();

    if (!allAgents)
      return res
        .status(400)
        .json({ message: "400: Error occured while getting customers." });

    const totalAgents = allAgents.length;
    const activeAgents = allAgents.filter(
      (user) => user.status.user_status === "Active"
    ).length;
    const bannedAgents = allAgents.filter(
      (user) => user.status.user_status === "Banned"
    ).length;

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const agentsCurrentMonth = allAgents.filter((user) => {
      const userDate = new Date(user.createdAt.$date);
      return (
        userDate.getMonth() === currentMonth &&
        userDate.getFullYear() === currentYear
      );
    }).length;

    const getUsersByMonth = () => {
      const monthlyUserCount = {};
    
      allAgents.forEach(user => {
        const createdAt = new Date(user.createdAt);
        const monthName = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(createdAt);
        const monthYear = `${monthName}-${createdAt.getFullYear()}`;
    
        if (monthlyUserCount[monthYear]) {
          monthlyUserCount[monthYear]++;
        } else {
          monthlyUserCount[monthYear] = 1;
        }
      });
    
      return monthlyUserCount;
    };
    
    const usersByMonth = getUsersByMonth();
    
    const monthsOfYear = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(Date.UTC(new Date().getFullYear(), i, 1));
      return { name: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date), value: 0 };
    });
    
    const totalUsersChart = monthsOfYear.map(month => ({
      ...month,
      value: usersByMonth[`${month.name}-${new Date().getFullYear()}`] || 0,
    }));

    const getActiveUsersByMonth = () => {
      const activeUsersByMonth = {};
    
      allAgents.forEach(user => {
        const status = user.status.user_status;
        const createdAt = new Date(user.createdAt);
        const monthName = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(createdAt);
        const monthYear = `${monthName}-${createdAt.getFullYear()}`;
    
        if (!activeUsersByMonth[monthYear]) {
          activeUsersByMonth[monthYear] = 0;
        }
    
        if (status === 'Active') {
          activeUsersByMonth[monthYear]++;
        }
      });
    
      return activeUsersByMonth;
    };
    
    const activeUsersByMonth = getActiveUsersByMonth();
    
    // Generate an array with all months in a year
    const activeMonthsOfYear = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(Date.UTC(new Date().getFullYear(), i, 1));
      return {
        name: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date),
        value: 0,
      };
    });
    
    // Merge the counts with the array of all months
    const ActiveUsersChart = activeMonthsOfYear.map(month => ({
      ...month,
      value: activeUsersByMonth[`${month.name}-${new Date().getFullYear()}`] || 0,
    }));

    const getBannedUsersByMonth = () => {
      const bannedUsersByMonth = {};
    
      allAgents.forEach(user => {
        const status = user.status.user_status;
        const createdAt = new Date(user.createdAt);
        const monthName = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(createdAt);
        const monthYear = `${monthName}-${createdAt.getFullYear()}`;
    
        if (!bannedUsersByMonth[monthYear]) {
          bannedUsersByMonth[monthYear] = 0;
        }
    
        if (status === 'Banned') {
          bannedUsersByMonth[monthYear]++;
        }
      });
    
      return bannedUsersByMonth;
    };
    
    const bannedUsersByMonth = getBannedUsersByMonth();
    
    const bannedMonthsOfYear = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(Date.UTC(new Date().getFullYear(), i, 1));
      return {
        name: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date),
        value: 0,
      };
    });
    
    const BannedUsersChart = bannedMonthsOfYear.map(month => ({
      ...month,
      value: bannedUsersByMonth[`${month.name}-${new Date().getFullYear()}`] || 0,
    }));

    res.status(200).json({
      totalAgentsChart: totalUsersChart,
      ActiveAgentsChart: ActiveUsersChart,
      BannedAgentsChart: BannedUsersChart,
      totalAgents: totalAgents,
      activeAgents: activeAgents,
      bannedAgents: bannedAgents,
      agentsCurrentMonth: agentsCurrentMonth,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
}
