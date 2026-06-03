#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const allowedBlockStart = ['*', 'eslint-'];
const allowedLineStart = ['eslint-'];

function isAllowedComment(comment) {
  if (comment.startsWith('/*')) {
    const inner = comment.slice(2).trim();
    return allowedBlockStart.some(s => inner.startsWith(s));
  }
  if (comment.startsWith('//')) {
    const inner = comment.slice(2).trim();
    return allowedLineStart.some(s => inner.startsWith(s));
  }
  return false;
}

function scanFile(file) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const violations = [];
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*')) {
      if (!isAllowedComment(trimmed)) {
        violations.push(`${file}:${idx + 1}: Forbidden comment: ${trimmed}`);
      }
    }
  });
  return violations;
}

function walk(dir, ext = ['.ts', '.tsx', '.js', '.jsx', '.cjs']) {
  let results = [];
  fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(walk(full, ext));
    } else if (ext.includes(path.extname(entry.name))) {
      results.push(full);
    }
  });
  return results;
}

const root = process.cwd();
const excludeDirs = ['node_modules', 'dist', 'test-results'];
function walkAll(dir, ext = ['.ts', '.tsx', '.js', '.jsx', '.cjs']) {
  let results = [];
  fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!excludeDirs.includes(entry.name)) {
        results = results.concat(walkAll(full, ext));
      }
    } else if (ext.includes(path.extname(entry.name))) {
      results.push(full);
    }
  });
  return results;
}

const files = walkAll(root);
let allViolations = [];
files.forEach(file => {
  allViolations = allViolations.concat(scanFile(file));
});

if (allViolations.length) {
  console.error('Forbidden comments found:');
  allViolations.forEach(v => console.error(v));
  process.exit(1);
}
