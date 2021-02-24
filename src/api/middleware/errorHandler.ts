/* eslint-disable @typescript-eslint/no-unused-vars */
import { Request, Response, NextFunction } from 'express'

export const errorHandler = (
  error: Error,
  _request: Request,
  response: Response,
  _next: NextFunction
) => {
  response.status(500).json({
    name: error.name,
    message: error.message,
    stackTrace: error.stack
  })
}
