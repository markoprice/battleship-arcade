import type { Character } from '../types';
import arcadeAustin from '../assets/arcade-austin.png';
import arcadeSebastian from '../assets/arcade-sebastian.png';
import arcadeBobby from '../assets/arcade-bobby.png';
import arcadeSatwik from '../assets/arcade-satwik.png';
import productScott from '../assets/product-scott.png';
import productWalden from '../assets/product-walden.png';
import productSteven from '../assets/product-steven.png';
import productRussell from '../assets/product-russell.png';

export const salesCharacters: Character[] = [
  {
    id: 'austin',
    name: 'Austin Mead',
    title: 'VP Enterprise',
    nickname: 'The Closer',
    team: 'sales',
    portrait: arcadeAustin,
    stats: [
      { label: 'PROSPECT', value: 85 },
      { label: 'DEMO', value: 90 },
      { label: 'CLOSE', value: 95 },
    ],
  },
  {
    id: 'sebastian',
    name: 'Sebastian Canizares',
    title: 'GTM Leader',
    nickname: 'The Connector',
    team: 'sales',
    portrait: arcadeSebastian,
    stats: [
      { label: 'PROSPECT', value: 80 },
      { label: 'DEMO', value: 85 },
      { label: 'CLOSE', value: 75 },
    ],
  },
  {
    id: 'bobby',
    name: 'Bobby Nobakht',
    title: 'GTM',
    nickname: 'The Hunter',
    team: 'sales',
    portrait: arcadeBobby,
    stats: [
      { label: 'PROSPECT', value: 90 },
      { label: 'DEMO', value: 80 },
      { label: 'CLOSE', value: 70 },
    ],
  },
  {
    id: 'satwik',
    name: 'Satwik Bebortha',
    title: 'Engineering Leader',
    nickname: 'The Leader',
    team: 'sales',
    portrait: arcadeSatwik,
    stats: [
      { label: 'PROSPECT', value: 75 },
      { label: 'DEMO', value: 85 },
      { label: 'CLOSE', value: 80 },
    ],
  },
];

export const productCharacters: Character[] = [
  {
    id: 'scott',
    name: 'Scott Wu',
    title: 'CEO',
    nickname: 'The Architect',
    team: 'product',
    portrait: productScott,
    stats: [
      { label: 'FRONT-END', value: 90 },
      { label: 'BACK-END', value: 95 },
      { label: 'AI', value: 90 },
    ],
  },
  {
    id: 'walden',
    name: 'Walden Yan',
    title: 'CPO',
    nickname: 'The Archivist',
    team: 'product',
    portrait: productWalden,
    stats: [
      { label: 'FRONT-END', value: 85 },
      { label: 'BACK-END', value: 90 },
      { label: 'AI', value: 85 },
    ],
  },
  {
    id: 'steven',
    name: 'Steven Hao',
    title: 'CTO',
    nickname: 'The Builder',
    team: 'product',
    portrait: productSteven,
    stats: [
      { label: 'FRONT-END', value: 80 },
      { label: 'BACK-END', value: 95 },
      { label: 'AI', value: 75 },
    ],
  },
  {
    id: 'russell',
    name: 'Russell Kaplan',
    title: 'President',
    nickname: 'The Wizard',
    team: 'product',
    portrait: productRussell,
    stats: [
      { label: 'FRONT-END', value: 85 },
      { label: 'BACK-END', value: 80 },
      { label: 'AI', value: 90 },
    ],
  },
];
