import { pathExistsSync, lstatSync } from 'fs-extra'

export const isDir = (file: string): boolean => pathExistsSync(file) && lstatSync(file).isDirectory()

export const clearEmptyLine = (text: string) => {
  return text.split('\n').filter(Boolean).join('\n')
}
