import jwt from 'jsonwebtoken';
const generateAccessToken = (user) => {
    const payload = {
        sub: user._id
    };
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
};
const generateRefreshToken = (user) => {
    const payload = {
        sub: user._id
    };
    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '30d' });
};
export { generateAccessToken, generateRefreshToken };
//# sourceMappingURL=auth.js.map