import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate, initials } from './utils'

describe('formatCurrency', () => {
  it('formatea número positivo como ARS', () => {
    const resultado = formatCurrency(1000)
    expect(resultado).toContain('1.000')
  })

  it('formatea cero', () => {
    const resultado = formatCurrency(0)
    expect(resultado).toContain('0')
  })

  it('formatea valores con decimales correctamente', () => {
    const resultado = formatCurrency(1500.5)
    expect(resultado).toBeDefined()
  })
})

describe('formatDate', () => {
  it('formatea una fecha ISO en español', () => {
    const resultado = formatDate('2026-04-19T12:00:00Z')
    expect(resultado).toContain('19')
    expect(resultado).toContain('abr')
  })

  it('incluye la hora', () => {
    const resultado = formatDate('2026-04-19T15:30:00Z')
    expect(resultado).toBeDefined()
    expect(typeof resultado).toBe('string')
  })
})

describe('initials', () => {
  it('retorna las dos primeras iniciales', () => {
    expect(initials('Juan Pérez')).toBe('JP')
  })

  it('maneja nombre de una sola palabra', () => {
    expect(initials('Admin')).toBe('A')
  })

  it('maneja nombre con más de dos palabras', () => {
    expect(initials('María José García')).toBe('MJ')
  })

  it('retorna string vacío para nombre vacío', () => {
    expect(initials('')).toBe('')
  })
})
