// Lossless rasterization of the approved inline vector, not new artwork.
// Regenerate only when that approved source changes. Browser never accesses API.
import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { chromium } from 'playwright'
const css=await readFile('public-site/site.css','utf8')
const url=css.match(/url\(['"]?(data:image\/svg\+xml;base64,[^'"\)]+)/)[1]
const browser=await chromium.launch({headless:true})
try{
 const page=await browser.newPage()
 const png=await page.evaluate(async url=>{
  const image=new Image();image.src=url;await image.decode()
  const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight
  const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0)
  // Bake the approved 0/9/91/100% fade once, instead of masking a full-page
  // layer during every scroll frame. Stretching preserves these proportions.
  ctx.globalCompositeOperation='destination-in'
  const fade=ctx.createLinearGradient(0,0,0,canvas.height)
  fade.addColorStop(0,'transparent');fade.addColorStop(.09,'black');fade.addColorStop(.91,'black');fade.addColorStop(1,'transparent')
  ctx.fillStyle=fade;ctx.fillRect(0,0,canvas.width,canvas.height)
  return canvas.toDataURL('image/png').split(',')[1]
 },url)
 await writeFile('public-site/topography.png',Buffer.from(png,'base64'))
 console.log('Approved SVG SHA256:',createHash('sha256').update(Buffer.from(url.split(',')[1],'base64')).digest('hex'))
}finally{await browser.close()}
