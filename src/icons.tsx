import React from 'react'

export function getFruitIcon(topic: string, size = 20) {
  const t = (topic || '').toLowerCase()
  if (t.includes('banana')) return Banana({size})
  if (t.includes('almond') || t.includes('nut')) return Almond({size})
  if (t.includes('salmon') || t.includes('fish')) return Fish({size})
  if (t.includes('quinoa') || t.includes('grain') || t.includes('rice')) return Grain({size})
  if (t.includes('smoothie') || t.includes('berry')) return Berry({size})
  if (t.includes('apple') || t.includes('pear')) return Apple({size})
  if (t.includes('avocado')) return Avocado({size})
  if (t.includes('lemon') || t.includes('lime')) return Lemon({size})
  // fallback fruit
  return GenericFruit({size})
}

function SvgWrapper({children, size}: any){
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{display:'inline-block',verticalAlign:'middle'}}>{children}</svg>
}

function Banana({size=20}: any){
  return (
    <SvgWrapper size={size}>
      <path d="M2 12c4-6 10-6 18-4" fill="none" stroke="#FFD66B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 13c2 2 5 3 8 3 3 0 6-1 9-3" fill="#FFE7A6" stroke="#F5C041" strokeWidth="0.3" />
    </SvgWrapper>
  )
}

function Almond({size=20}: any){
  return (
    <SvgWrapper size={size}>
      <ellipse cx="12" cy="12" rx="8" ry="5" fill="#F5D3B3" stroke="#D6A985" strokeWidth="0.6" />
    </SvgWrapper>
  )
}

function Fish({size=20}: any){
  return (
    <SvgWrapper size={size}>
      <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z" fill="#F4A1A1" />
      <circle cx="8" cy="10" r="1" fill="#fff" />
    </SvgWrapper>
  )
}

function Grain({size=20}: any){
  return (
    <SvgWrapper size={size}>
      <rect x="6" y="6" width="12" height="12" rx="3" fill="#F2E6B6" stroke="#D6C089" />
    </SvgWrapper>
  )
}

function Berry({size=20}: any){
  return (
    <SvgWrapper size={size}>
      <circle cx="9" cy="12" r="3" fill="#FF6B81" />
      <circle cx="14" cy="11" r="2.5" fill="#7CC6FF" />
    </SvgWrapper>
  )
}

function Apple({size=20}: any){
  return (
    <SvgWrapper size={size}>
      <path d="M12 5c2 0 3 1 4 2 1 1 1 3 0 5s-3 3-4 3-3-1-4-3-1-4 0-5c1-1 2-2 4-2z" fill="#FF6B6B" />
      <path d="M13 4c0 .8-.8 1.6-1 2" stroke="#2C6B2C" strokeWidth="0.6" fill="none" />
    </SvgWrapper>
  )
}

function Avocado({size=20}: any){
  return (
    <SvgWrapper size={size}>
      <path d="M12 4c3 0 6 4 6 8s-3 8-6 8-6-4-6-8 3-8 6-8z" fill="#7BD389" />
      <circle cx="12" cy="14" r="2" fill="#5B3E1B" />
    </SvgWrapper>
  )
}

function Lemon({size=20}: any){
  return (
    <SvgWrapper size={size}>
      <ellipse cx="12" cy="12" rx="6" ry="4" fill="#FFD166" stroke="#E2B600" />
    </SvgWrapper>
  )
}

function GenericFruit({size=20}: any){
  return (
    <SvgWrapper size={size}>
      <circle cx="12" cy="12" r="8" fill="#FFD66B" />
    </SvgWrapper>
  )
}

export default getFruitIcon
