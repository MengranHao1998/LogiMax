import jwt from 'jsonwebtoken';

export function authenticateToken(req, res, next) {
    const token = req.cookies.auth_token;
    if (!token) return res.redirect('/');
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'defaultSecretKey');
        req.user = decoded; 
        next(); 
    } catch {
        res.redirect('/'); 
    }
}