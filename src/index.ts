#!/usr/bin/env node
import JSZip from 'jszip'
import consola from 'consola'
import { glob } from 'glob'
import { createWriteStream, readFileSync } from 'fs'
import { resolve, parse } from 'path'
import { clearEmptyLine, isDir } from './utils'
import { ensureDirSync, pathExistsSync } from 'fs-extra'

const ROOT = process.cwd()
const PRESET_IGNORE = [
  '.DS_Store',
  '.history/**',
  '.git/**',
  '.idea/**',
  '.vscode/**',
  'node_modules/**',
  '**/node_modules/**'
]
const GIT_IGNORE = resolve(ROOT, '.gitignore')

function generateGitIgnorePatterns(file: string) {
  if (!pathExistsSync(file)) {
    return []
  }

  const files = clearEmptyLine(readFileSync(file, 'utf-8')).split('\n')

  return files.reduce((patterns, file) => {
    if (file.startsWith('/') && !file.endsWith('/')) {
      // example: /foo -> /foo and /foo/**
      return [...patterns, file, `${file}/**`]
    }

    if (file.startsWith('/') && file.endsWith('/')) {
      // example: /foo/ -> /foo/**
      return [...patterns, `${file}**`]
    }

    if (!file.startsWith('/') && !file.endsWith('/')) {
      // example: foo -> foo and **/foo/**
      return [...patterns, file, `**/${file}/**`]
    }

    if (!file.startsWith('/') && file.endsWith('/')) {
      // example: foo/ -> **/foo/**
      return [...patterns, `**/${file}**`]
    }

    // comment and other
    return patterns
  }, [] as string[])
}

function getOutput(argv: string[]) {
  const index = argv.findIndex((arg) => /^(-o|--output)$/.test(arg))

  if (index > 0) {
    return argv[index + 1]
  }

  return `${resolve(ROOT, parse(ROOT).name)}.zip`
}

function run() {
  const output = getOutput(process.argv)
  const gitIgnorePatterns = generateGitIgnorePatterns(GIT_IGNORE)

  if (pathExistsSync(output)) {
    consola.warn(`${output} already existed`)
    return
  }

  ensureDirSync(parse(output).dir)

  const files = glob.sync('**', {
    root: ROOT,
    cwd: ROOT,
    dot: true,
    ignore: [...PRESET_IGNORE, ...gitIgnorePatterns]
  })

  const zip = new JSZip()

  files.forEach((file) => {
    const path = resolve(ROOT, file)

    if (!isDir(path)) {
      zip.file(file, readFileSync(path, 'utf-8'))
    }
  })

  zip
    .generateNodeStream({ streamFiles: true })
    .pipe(createWriteStream(output))
    .on('finish', () => {
      consola.success(`${output} zip success!`)
    })
}

run()
