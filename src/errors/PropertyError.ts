import { ValidationError } from '@hapi/joi'

export class PropertyError {
  constructor(public property: string, public error: string) {}

  static fromValidationError(error: ValidationError): PropertyError[] {
    const errors = error?.details || []
    return errors.map(err => {
      const property = err.path.reduce<string>((prop, key) => {
        if (typeof key === 'number') {
          return `${prop}[${key}]`
        } else if (!prop) {
          return key
        }

        return `${prop}.${key}`
      }, '')

      return new PropertyError(property, err.message)
    })
  }
}
