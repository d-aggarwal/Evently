import bcrypt from "bcrypt";

export const hashPassword = async (password) => {
    return await bcrypt.hash(password, 10);
};

export const isPasswordCorrect = async (
    enteredPassword,
    hashedPassword
) => {
    return await bcrypt.compare(
        enteredPassword,
        hashedPassword
    );
};
