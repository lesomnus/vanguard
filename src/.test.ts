import path from 'node:path'

// eslint-disable-next-line unicorn/prefer-module
const ProjectRoot = path.resolve(__dirname, '..')

export const PageUrl = `file://${path.join(ProjectRoot, 'dist/demo/index.html')}`
