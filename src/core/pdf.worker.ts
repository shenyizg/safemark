// The pdf.js worker, with our polyfills loaded before it (imports evaluate in order).
import './polyfills'
import 'pdfjs-dist/legacy/build/pdf.worker.mjs'
