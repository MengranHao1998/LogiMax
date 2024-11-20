import { NextFunction, Request, Response } from "express";
import * as jwt from "jsonwebtoken";

export function secureMiddleware(req: Request, res: Response, next: NextFunction) {
    let token : string = req.cookies.auth_token;
    jwt.verify(token, process.env.JWT_SECRET!, (err, user) => {
        if (err) {
            res.redirect("/login");
        } else {
            console.log(user);
            res.locals.user = user;
            next();
        }
    });
};