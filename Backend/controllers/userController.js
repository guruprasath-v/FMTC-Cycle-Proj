const bcrypt = require('bcrypt');
const {v4: uuidv4} = require('uuid');

const userModels = require('../models/userModels');
const standModels = require('../models/standModels');
const {createSuccessResponse, createErrorResponse} = require('../utils/responseUtils');
const genToken = require('../utils/jwtUtils');

/**
 * Handles user registration.
 * 
 * Validates the input data, checks if the user already exists, creates a new user in the database,
 * and returns a success response. In case of any errors, it throws an AppError.
 * 
 * @async
 * @function userRegisterController
 * 
 * @param {Object} req - The request object containing user registration data.
 * @param {Object} res - The response object to send back the result.
 * @param {Function} next - The next middleware function to pass control to.
 * 
 * @returns {Promise<void>} Sends a response object if registration is successful.
 * 
 * @throws {AppError} Throws an error if user already exists or any other error occurs.
 */
async function userRegisterController(req, res, next) {
    try {
        const { rollNumber, userName, mobile, password } = req.body;

        if (!rollNumber || !userName || !mobile || !password) {
            throw createErrorResponse({
                message: 'Missing required fields.',
                statusCode: 400,
                description: 'One or more required fields are missing from the request.',
                suggestedAction: 'Please provide all the required fields (rollNumber, userName, mobile, password).'
            });
        }

        if (rollNumber.length < 4 || userName.length < 4 || mobile.length !== 10 || password.length < 4) {
            throw createErrorResponse({
                message: 'Invalid field lengths.',
                statusCode: 400,
                description: 'Some fields do not meet the required length constraints.',
                suggestedAction: 'Please ensure the following minimum lengths: Roll Number: 4, User Name: 4, Mobile: 10 digits, Password: 4.'
            });
        }
        

        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = uuidv4();
        const user = {
            rollNumber,
            userName,
            userId,
            mobile,
            password: hashedPassword,
            prevUsages: [],
        }

        const response = await userModels.userRegistration(user);

        return res.status(response.statusCode).json(response);
    } catch (err) {
        next(err); // Passing the error to the next middleware
    }
    
}

/**
 * Authenticates user credentials and logs the user in.
 * Verifies roll number and password, generates a JWT if valid, 
 * and sets it as a secure HTTP-only cookie in the response.
 * 
 * @async
 * @function userLogin
 * 
 * @param {Object} req - Express request object, containing user credentials.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @throws {AppError} - If required fields are missing or invalid.
 * 
 * @returns {void} - Sends JSON response with login status.
 */

async function userLogin(req, res, next) {
    try {
        const { rollNumber, password } = req.body;

        if (!rollNumber || !password) {
            throw createErrorResponse({
                message: 'Missing required fields.',
                statusCode: 400,
                description: 'Roll number and password are required fields.',
                suggestedAction: 'Please provide both rollNumber and password.'
            });
        }
    
        if(rollNumber.length < 4 || password.length < 4) {
            throw createErrorResponse({
                message: 'Invalid field lengths.',
                statusCode: 400,
                description: 'Roll Number and Password must be at least 4 characters long.',
                suggestedAction: 'Ensure Roll Number and Password meet the minimum length requirements.'
            });
        }
    
        const response = await userModels.verifyCredentials(rollNumber, password);

        const token = genToken(response.data);

        res.cookie('JTOK', token, {
            httpOnly: true,   // Ensures it's not accessible via JavaScript
            maxAge: 3600000   // Optional: Expiry time of the cookie (e.g., 1 hour)
        });
        

        res.status(200).json({
            message: 'User logged in successfully.',
            statusCode: 200,
            description: 'User logged in; JWT token set in cookie.',
        });      
    } catch (error) {
        next(error)
    }
}

/**
 * Checks if the user has an active cycle usage.
 * If the user is not currently using a cycle, responds with a success message.
 * 
 * @async
 * @function checkUserResource
 * @param {object} req - The Express request object, containing user details in `req.user`.
 * @param {object} res - The Express response object, used to send the JSON response.
 * @param {function} next - The Express next middleware function, called to handle any errors.
 * @returns {Promise<void>} - Sends a JSON response with the user's current usage status or passes errors to the error handler.
 * @throws {AppError} - Forwards errors to the error-handling middleware if an exception occurs.
 */
async function checkUserResource(req, res, next) {
    try {
        console.log('Checking availability...')
        const user = req.user;

        const userCurrStatus = await userModels.checkCurrUsage(user.userId);

        if (userCurrStatus.message == 'ok') {
            res.status(userCurrStatus.statusCode).json(userCurrStatus);
        }
    } catch (error) {
        console.log(error);
        next(error);
    }
}



module.exports = {
    userRegisterController,
    userLogin,
    checkUserResource,
}
