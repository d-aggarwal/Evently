import {asyncHandler} from "../utils/asyncHandler.js";
import  {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from  "../utils/ApiResponse.js";
import {
    hashPassword,
    isPasswordCorrect,
} from "../utils/password.js";
import {prisma} from "../utils/prisma.js";
import {generateAccessToken} from "../utils/jwt.js"
import notificationProducer from "../kafka/producer/notification.producer.js";
import logger from "../utils/logger.js";


const generateAccessTokenForUser = async (userId) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: userId,
            },
        });

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        return generateAccessToken(user);
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating access token"
        );
    }
};


const registerUser = asyncHandler(async(req,res) => {
  //get user details form frontend
  //validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  //upload them to cloudinary
  // create user object - create entry in db
  // remove password and refresh token from reponse
  // check for user creation
  //return response

  const {firstName, email, password } = req.body
  //console.log("email: ", email);

  if (
      [firstName, email, password].some((field) => field?.trim() === "")
  ) {
      throw new ApiError(400, "All fields are required")
  }

 const existedUser = await prisma.user.findFirst({
    where: {
        OR: [
            { email }
        ]
    }
});

  if (existedUser) {
      throw new ApiError(409, "User with email already exists")
  }
 

  const hashedPassword = await hashPassword(password);

const user = await prisma.user.create({
    data: {
        firstName,
        email,
        password: hashedPassword,
    },
});

  if (!user) {
      throw new ApiError(500, "Something went wrong while registering the user")
  }

  await notificationProducer.sendWelcomeEmail(
        user.email,
        user.firstName
   );

  logger.info(`Welcome email queued for ${user.email}`);

  const {password: _, ...userResponse} = user;

  return res.status(201).json(
      new ApiResponse(200, userResponse, "User registered Successfully")
  )

})

const loginUser = asyncHandler(async (req, res) =>{
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    const {email, password} = req.body
    console.log(email);

    if (!email) {
        throw new ApiError(400, "email is required")
    }

    const user = await prisma.user.findFirst({
    where: {
        OR: [
            { email }
        ]
    }
});

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

   const isPasswordValid = await isPasswordCorrect(
    password,
    user.password
);

   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    }

   const accessToken =
    await generateAccessTokenForUser(user.id);

    const loggedInUser =
    await prisma.user.findUnique({
        where: {
            id: user.id,
        },
        select: {
            password: true,
        },
    });

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken
            },
            "User logged In Successfully"
        )
    )

})

const logoutUser = asyncHandler(async(req, res) => {

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body

    

    const user = await prisma.user.findUnique({
    where: {
        id: req.user.id,
    },
});
    const validPassword =
    await isPasswordCorrect(
        oldPassword,
        user.password
    );

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

   await prisma.user.update({
    where: {
        id: req.user.id,
    },
    data: {
        password: await hashPassword(newPassword),
    },
});

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})


const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "User fetched successfully"
    ))
})


export  {
    registerUser
    , loginUser
    , logoutUser
    , changeCurrentPassword,
    getCurrentUser,
};