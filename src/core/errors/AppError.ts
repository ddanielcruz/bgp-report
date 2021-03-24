interface AppErrorParams<T> {
  statusCode?: number
  data?: T
}

export class AppError<T = void> extends Error {
  public statusCode: number
  public data?: T

  constructor(message: string, params?: AppErrorParams<T>) {
    super(message)
    this.data = params?.data
    this.statusCode = params?.statusCode || 400
  }
}
